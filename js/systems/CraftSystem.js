// === CRAFT SYSTEM ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import BLUEPRINTS_BASE from '../data/blueprints.js';
import HIDDEN_RECIPES  from '../data/hiddenRecipes.js';
import { SKILL_DEFS }  from '../data/skillDefs.js';
import SkillSystem     from './SkillSystem.js';
import StatSystem      from './StatSystem.js';
import BALANCE         from '../data/gameBalance.js';
import NightSystem     from './NightSystem.js';
import GameData from '../data/GameData.js';

// 히든 레시피 포함 전체 레시피
const BLUEPRINTS = { ...BLUEPRINTS_BASE, ...HIDDEN_RECIPES };

const CraftSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  // Check if a blueprint's current stage requirements are met on the board
  canStartBlueprint(blueprintId) {
    // ── 야간 광원 체크 ──────────────────────────────────────
    const nightCheck = NightSystem.canActAtNight('craft');
    if (!nightCheck.allowed) return { ok: false, reason: nightCheck.reason };

    const bp = BLUEPRINTS[blueprintId];
    if (!bp) return { ok: false, reason: 'Unknown blueprint' };

    if (GameState.crafting.activeQueue.length >= GameState.crafting.maxQueueSize) {
      return { ok: false, reason: I18n.t('craftSys.queueFull') };
    }

    // 스킬 레벨 게이팅
    if (bp.requiredSkills) {
      for (const [skillId, minLevel] of Object.entries(bp.requiredSkills)) {
        const playerLevel = GameState.player.skills?.[skillId]?.level ?? 0;
        if (playerLevel < minLevel) {
          const skillName = SKILL_DEFS[skillId]?.name ?? skillId;
          return { ok: false, reason: I18n.t('craftSys.skillReq', { skill: skillName, min: minLevel, current: playerLevel }) };
        }
      }
    }

    const stage = bp.stages[0];
    return this._checkStageReqs(stage, blueprintId);
  },

  _checkStageReqs(stage, bpId) {
    const gs = GameState;
    for (const req of stage.requiredItems) {
      const count = gs.countOnBoard(req.definitionId);
      if (count < req.qty) {
        const def = GameData.items[req.definitionId];
        return { ok: false, reason: I18n.t('craftSys.itemShort', { name: I18n.itemName(req.definitionId, def?.name), have: count, need: req.qty }) };
      }
    }
    // check required tools
    const bp = BLUEPRINTS[bpId];
    if (bp?.requiredTools?.length) {
      for (const toolId of bp.requiredTools) {
        const hasIt = gs.getBoardCards().some(c => c.definitionId === toolId);
        if (!hasIt) {
          const def = GameData.items[toolId];
          return { ok: false, reason: I18n.t('craftSys.toolReq', { name: I18n.itemName(toolId, def?.name) }) };
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
    // 소방관 능력: craftSaveChance 확률로 재료 1개 절약
    const craftSave = GameState.player.craftSaveChance ?? 0;
    let savedOnce = false;
    if (stage.consumeAt === 'start') {
      for (const req of stage.requiredItems) {
        let needed = req.qty;
        // 소방관 재료 절약: 1개 아이템에만 적용 (최초 1회)
        if (!savedOnce && craftSave > 0 && needed > 0 && Math.random() < craftSave) {
          needed = Math.max(0, needed - 1);
          savedOnce = true;
          EventBus.emit('notify', { message: '도구 숙련 — 재료 1개를 절약했다.', type: 'good' });
        }
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
      craftCardId:  null,
    };

    // 바닥(middle) 행에 제작 진행 카드 생성
    const outputDefId = bp.output?.[0]?.definitionId;
    if (outputDefId) {
      const totalTpAll = bp.stages.reduce((sum, s) => sum + s.tpCost, 0);
      const craftInst = GameState.createCardInstance(outputDefId, {
        _crafting: true,
        _craftEntry: {
          blueprintId,
          blueprintName: bp.name,
          stageIndex: 0,
          stageLabel: stage.label,
          tpTotal: stage.tpCost,
          tpRemaining: stage.tpCost,
          totalStages: bp.stages.length,
          totalTpAll,
          completedTp: 0,
        },
      });
      if (craftInst) {
        GameState.placeCardInRow(craftInst.instanceId, 'middle');
        entry.craftCardId = craftInst.instanceId;
      }
    }

    GameState.crafting.activeQueue.push(entry);
    EventBus.emit('notify', { message: I18n.t('craftSys.started', { name: I18n.blueprintName(blueprintId, bp.name) }), type: 'info' });
    EventBus.emit('craftStarted', { blueprintId });
    return true;
  },

  onTP() {
    const queue = GameState.crafting.activeQueue;
    const completed = [];

    for (let i = queue.length - 1; i >= 0; i--) {
      const entry = queue[i];
      entry.tpRemaining--;

      // 제작 카드 진행 동기화
      if (entry.craftCardId && GameState.cards[entry.craftCardId]?._craftEntry) {
        GameState.cards[entry.craftCardId]._craftEntry.tpRemaining = entry.tpRemaining;
      }

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
            EventBus.emit('notify', { message: I18n.t('craftSys.nextStageShort', { name: I18n.blueprintName(entry.blueprintId, bp.name), reason: stageCheck.reason }), type: 'warn' });
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
          // 제작 카드 스테이지 진행 동기화
          if (entry.craftCardId && GameState.cards[entry.craftCardId]?._craftEntry) {
            const ce = GameState.cards[entry.craftCardId]._craftEntry;
            ce.completedTp += bp.stages[nextStageIdx - 1].tpCost;
            ce.stageIndex   = nextStageIdx;
            ce.stageLabel   = nextStage.label;
            ce.tpTotal      = nextStage.tpCost;
            ce.tpRemaining  = nextStage.tpCost;
          }
        } else {
          // All stages complete — produce output
          completed.push(i);
          this._produceOutput(bp, entry);
        }
      }
    }

    // Remove completed entries
    for (const idx of completed) {
      queue.splice(idx, 1);
    }
  },

  // ── 품질 계산 (스택 불가 아이템에만 적용) ─────────────────
  _calculateQuality(bp) {
    const firstOutDef = GameData?.items[bp.output?.[0]?.definitionId];
    if (!firstOutDef || firstOutDef.stackable) return null;

    const craftSkillMap = {
      structure: 'building', material: 'crafting', food: 'cooking',
      medical: 'crafting', weapon: 'weaponcraft', armor: 'armorcraft', tool: 'crafting',
    };
    const skillId = craftSkillMap[bp.category] ?? 'crafting';
    const playerLevel   = GameState.player.skills?.[skillId]?.level ?? 0;
    const requiredLevel = bp.requiredSkills?.[skillId] ?? 0;
    const skillExcess   = Math.max(0, playerLevel - requiredLevel);

    const Q = BALANCE.quality;
    let score = Math.random();
    score += skillExcess * Q.skillBonusPerLevel;

    const queueLen = GameState.crafting.activeQueue.length;
    if (queueLen <= 1)                               score += Q.focusBonusSolo;
    else if (queueLen >= BALANCE.crafting.maxQueueSize) score -= Q.focusPenaltyFull;

    const moraleTier = StatSystem.getMoraleTier();
    if      (moraleTier.craftFailMult < 1.0)  score += Q.moraleBonusHigh;
    else if (moraleTier.craftFailMult >= 2.0) score -= Q.moralePenaltyDespair;
    else if (moraleTier.craftFailMult > 1.0)  score -= Q.moralePenaltyLow;

    const t = Q.thresholds;
    if (score >= t.masterwork) return 'masterwork';
    if (score >= t.excellent)  return 'excellent';
    if (score >= t.good)       return 'good';
    return 'normal';
  },

  _produceOutput(bp, entry) {
    // ── 제작 카드 제거 ───────────────────────────────────
    if (entry?.craftCardId) {
      GameState.removeCardInstance(entry.craftCardId);
    }

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
      EventBus.emit('notify', { message: I18n.t('craftSys.failed', { name: I18n.blueprintName(bp.id, bp.name) }), type: 'danger' });
      EventBus.emit('craftFailed', { blueprintId: bp.id });
      // 실패해도 스킬 XP (절반)
      const craftXp = (BALANCE.crafting.xpBase[relevantSkill] ?? 5) * (bp.stages?.length ?? 1);
      SkillSystem.gainXp(relevantSkill, Math.ceil(craftXp * 0.5));
      return;
    }

    // ── 배치 행 결정: structure → 바닥(middle), 그 외 → 휴대(bottom) ──
    const outputRow = bp.category === 'structure' ? 'middle' : 'bottom';

    const outputIds = [];
    if (bp._outputCustom) {
      // Special case: molotov → give a cloth item as placeholder (no molotov def in items.js)
      const reward = GameState.createCardInstance('cloth', { quantity: 1 });
      if (reward) {
        GameState.placeCardInRow(reward.instanceId, outputRow);
        outputIds.push(reward.instanceId);
      }
    } else {
      for (const out of bp.output) {
        const outDef = GameData?.items[out.definitionId];
        const quality = (!outDef?.stackable) ? this._calculateQuality(bp) : null;
        const inst = GameState.createCardInstance(out.definitionId, {
          quantity: out.qty,
          ...(quality ? { _quality: quality } : {}),
        });
        if (inst) {
          GameState.placeCardInRow(inst.instanceId, outputRow);
          outputIds.push(inst.instanceId);
          // 품질 알림 (일반 제외)
          if (quality && quality !== 'normal') {
            const tier = BALANCE.quality.tiers[quality];
            EventBus.emit('notify', { message: `${tier.label} 품질 — ${tier.notify}`, type: 'good' });
          }
        }
      }
    }

    EventBus.emit('craftComplete', { blueprintId: bp.id, outputInstanceIds: outputIds });
    EventBus.emit('notify', { message: I18n.t('craftSys.complete', { name: I18n.blueprintName(bp.id, bp.name) }), type: 'good' });

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
