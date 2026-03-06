// === CRAFT SYSTEM ===
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import BLUEPRINTS from '../data/blueprints.js';

const CraftSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  // Check if a blueprint's current stage requirements are met on the board
  canStartBlueprint(blueprintId) {
    const bp = BLUEPRINTS[blueprintId];
    if (!bp) return { ok: false, reason: 'Unknown blueprint' };

    if (GameState.crafting.activeQueue.length >= GameState.crafting.maxQueueSize) {
      return { ok: false, reason: '작업 큐가 가득 참' };
    }

    const stage = bp.stages[0];
    return this._checkStageReqs(stage, blueprintId);
  },

  _checkStageReqs(stage, bpId) {
    const gs = GameState;
    for (const req of stage.requiredItems) {
      const count = gs.countOnBoard(req.definitionId);
      if (count < req.qty) {
        const def = window.__GAME_DATA__.items[req.definitionId];
        return { ok: false, reason: `${def?.name ?? req.definitionId} 부족 (${count}/${req.qty})` };
      }
    }
    // check required tools
    const bp = BLUEPRINTS[bpId];
    if (bp?.requiredTools?.length) {
      for (const toolId of bp.requiredTools) {
        const hasIt = gs.getBoardCards().some(c => c.definitionId === toolId);
        if (!hasIt) {
          const def = window.__GAME_DATA__.items[toolId];
          return { ok: false, reason: `도구 필요: ${def?.name ?? toolId}` };
        }
      }
    }
    return { ok: true };
  },

  startBlueprint(blueprintId) {
    const bp   = BLUEPRINTS[blueprintId];
    if (!bp) return false;
    const check = this.canStartBlueprint(blueprintId);
    if (!check.ok) {
      EventBus.emit('notify', { message: check.reason, type: 'warn' });
      return false;
    }

    const stage = bp.stages[0];

    // Consume items at 'start'
    const reservedIds = [];
    if (stage.consumeAt === 'start') {
      for (const req of stage.requiredItems) {
        let needed = req.qty;
        const matching = GameState.getBoardCards().filter(c => c.definitionId === req.definitionId);
        for (const card of matching) {
          if (needed <= 0) break;
          if ((card.quantity ?? 1) <= needed) {
            needed -= (card.quantity ?? 1);
            GameState.removeCardInstance(card.instanceId);
            EventBus.emit('cardRemoved', { instanceId: card.instanceId });
          } else {
            card.quantity -= needed;
            needed = 0;
            EventBus.emit('boardChanged', {}); // 수량 변경 → 화면 갱신
          }
        }
      }
    }

    const entry = {
      blueprintId,
      stageIndex:   0,
      tpTotal:      stage.tpCost,
      tpRemaining:  stage.tpCost,
      reservedIds,
    };

    GameState.crafting.activeQueue.push(entry);
    EventBus.emit('notify', { message: `⚒️ ${bp.name} 제작 시작.`, type: 'info' });
    EventBus.emit('craftStarted', { blueprintId });
    return true;
  },

  onTP() {
    const queue = GameState.crafting.activeQueue;
    const completed = [];

    for (let i = queue.length - 1; i >= 0; i--) {
      const entry = queue[i];
      entry.tpRemaining--;

      if (entry.tpRemaining <= 0) {
        const bp = BLUEPRINTS[entry.blueprintId];
        // Check next stage
        const nextStageIdx = entry.stageIndex + 1;
        if (nextStageIdx < bp.stages.length) {
          // Advance to next stage
          const nextStage = bp.stages[nextStageIdx];
          const stageCheck = this._checkStageReqs(nextStage, entry.blueprintId);

          if (!stageCheck.ok) {
            // Pause and notify
            entry.tpRemaining = 0;
            EventBus.emit('notify', { message: `${bp.name} 다음 단계 재료 부족: ${stageCheck.reason}`, type: 'warn' });
            continue;
          }
          // Consume next stage items
          if (nextStage.consumeAt === 'start') {
            for (const req of nextStage.requiredItems) {
              let needed = req.qty;
              const matching = GameState.getBoardCards().filter(c => c.definitionId === req.definitionId);
              for (const card of matching) {
                if (needed <= 0) break;
                if ((card.quantity ?? 1) <= needed) {
                  needed -= (card.quantity ?? 1);
                  GameState.removeCardInstance(card.instanceId);
                  EventBus.emit('cardRemoved', { instanceId: card.instanceId });
                } else {
                  card.quantity -= needed;
                  needed = 0;
                  EventBus.emit('boardChanged', {}); // 수량 변경 → 화면 갱신
                }
              }
            }
          }
          entry.stageIndex   = nextStageIdx;
          entry.tpTotal      = nextStage.tpCost;
          entry.tpRemaining  = nextStage.tpCost;
        } else {
          // All stages complete — produce output
          completed.push(i);
          this._produceOutput(bp);
        }
      }
    }

    // Remove completed entries
    for (const idx of completed) {
      queue.splice(idx, 1);
    }
  },

  _produceOutput(bp) {
    const outputIds = [];
    if (bp._outputCustom) {
      // Special case: molotov → give a cloth item as placeholder (no molotov def in items.js)
      const reward = GameState.createCardInstance('cloth', { quantity: 1 });
      if (reward) {
        GameState.placeCardInRow(reward.instanceId, 'middle');
        outputIds.push(reward.instanceId);
      }
    } else {
      for (const out of bp.output) {
        const inst = GameState.createCardInstance(out.definitionId, { quantity: out.qty });
        if (inst) {
          GameState.placeCardInRow(inst.instanceId, 'middle');
          outputIds.push(inst.instanceId);
        }
      }
    }

    EventBus.emit('craftComplete', { blueprintId: bp.id, outputInstanceIds: outputIds });
    EventBus.emit('notify', { message: `✅ ${bp.name} 완성!`, type: 'good' });
  },

  getQueueProgress(entry) {
    if (!entry || entry.tpTotal === 0) return 1;
    return (entry.tpTotal - entry.tpRemaining) / entry.tpTotal;
  },
};

export default CraftSystem;
