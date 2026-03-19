// === CRAFT SYSTEM ===
import EventBus    from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import BLUEPRINTS from '../data/blueprints.js';
import SkillSystem from './SkillSystem.js';
import StatSystem  from './StatSystem.js';
import BALANCE from '../data/gameBalance.js';

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
    // ── 제작 실패 판정 ──────────────────────────────────
    const craftSkillMap = {
      structure: 'building', material: 'crafting', food: 'cooking',
      medical: 'crafting', weapon: 'weaponcraft', armor: 'armorcraft', tool: 'crafting',
    };
    const relevantSkill = craftSkillMap[bp.category] ?? 'crafting';
    const skillReduction = SkillSystem.getBonus(relevantSkill, 'craftSuccessBonus') ?? 0;
    const charBonus = GameState.player.craftSuccessBonus ?? 0;
    // 사기 구간별 제작 실패율 배율
    const moraleTier = StatSystem.getMoraleTier();
    const failChance = Math.max(
      BALANCE.crafting.minFailureChance,
      (BALANCE.crafting.baseFailureChance - skillReduction - charBonus) * (moraleTier.craftFailMult ?? 1.0)
    );

    if (Math.random() < failChance) {
      // 실패: 재료 일부 반환
      const refundRate = BALANCE.crafting.failureRefundRate;
      for (const stage of bp.stages) {
        for (const req of stage.requiredItems) {
          const refundQty = Math.floor(req.qty * refundRate);
          if (refundQty > 0) {
            const refundInst = GameState.createCardInstance(req.definitionId, { quantity: refundQty });
            if (refundInst) GameState.placeCardInRow(refundInst.instanceId, 'middle');
          }
        }
      }
      EventBus.emit('notify', { message: `❌ ${bp.name} 제작 실패! 재료 일부가 반환됩니다.`, type: 'danger' });
      EventBus.emit('craftFailed', { blueprintId: bp.id });
      // 실패해도 스킬 XP (절반)
      const craftXp = (BALANCE.crafting.xpBase[relevantSkill] ?? 5) * (bp.stages?.length ?? 1);
      SkillSystem.gainXp(relevantSkill, Math.ceil(craftXp * 0.5));
      return;
    }

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

    // 제작 스킬 XP: BALANCE 기반
    const craftSkillId = craftSkillMap[bp.category] ?? 'crafting';
    const craftXp      = BALANCE.crafting.xpBase[craftSkillId] ?? 5;
    SkillSystem.gainXp(craftSkillId, craftXp * (bp.stages?.length ?? 1));
    // 요리 제작 시 flags에 crafted=true 표시를 위한 output 태깅
    if (craftSkillId === 'cooking') {
      for (const id of outputIds) {
        if (GameState.cards[id]) GameState.cards[id]._crafted = true;
      }
    }
  },

  getQueueProgress(entry) {
    if (!entry || entry.tpTotal === 0) return 1;
    return (entry.tpTotal - entry.tpRemaining) / entry.tpTotal;
  },
};

export default CraftSystem;
