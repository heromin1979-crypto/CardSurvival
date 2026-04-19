// === CRAFT SYSTEM ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import BLUEPRINTS_BASE from '../data/blueprints.js';
import BLUEPRINTS_ADV  from '../data/blueprints_advanced.js';
import HIDDEN_RECIPES  from '../data/hiddenRecipes.js';
import { SKILL_DEFS }  from '../data/skillDefs.js';
import SkillSystem     from './SkillSystem.js';
import StatSystem      from './StatSystem.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import BALANCE         from '../data/gameBalance.js';
import NightSystem     from './NightSystem.js';
import GameData from '../data/GameData.js';

// 히든 레시피 포함 전체 레시피
const BLUEPRINTS = { ...BLUEPRINTS_BASE, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };

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

    // 동일 블루프린트 중복 제작 방지
    const alreadyInQueue = GameState.crafting.activeQueue.some(
      entry => entry.blueprintId === blueprintId
    );
    if (alreadyInQueue) {
      return { ok: false, reason: I18n.t('craftSys.alreadyInQueue', { name: bp.name }) };
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
    // check required tools (보드 카드 + 구역 설치 구조물 모두 확인)
    const bp = BLUEPRINTS[bpId];
    if (bp?.requiredTools?.length) {
      for (const toolId of bp.requiredTools) {
        const onBoard = gs.getBoardCards().some(c => c.definitionId === toolId);
        const installed = gs.location.installedStructures?.[gs.location.currentDistrict];
        const isInstalled = installed?.id === toolId;
        if (!onBoard && !isInstalled) {
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

    // ── 1-TP 기초 제작: 큐/카드 생성 생략하고 즉시 생산 ─────────
    // (단일 스테이지 + 총 TP === 1인 경우)
    const totalTpAll = bp.stages.reduce((sum, s) => sum + s.tpCost, 0);
    if (bp.stages.length === 1 && totalTpAll === 1) {
      EventBus.emit('craftStarted', { blueprintId });
      this._produceOutput(bp, { craftCardId: null });
      return true;
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
      upgrade: 'crafting',
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

    // 셰프 팀 리더십: 요리(food) 카테고리 제작 시 동료 평균 사기 보너스
    if (bp.category === 'food' && GameState.player.characterId === 'chef') {
      const npcSys = SystemRegistry.get('NPCSystem');
      const avgMorale = npcSys?.getTeamAverageMorale?.() ?? 70;
      if      (avgMorale > 85) score += 0.20;
      else if (avgMorale > 70) score += 0.10;
    }

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
      upgrade: 'crafting',
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
          // 의료 구조물 → middle row 가장 왼쪽(slot 0)에 배치
          if (outDef?.type === 'structure' && outDef?.subtype === 'medical') {
            this._placeAtLeftmost(inst.instanceId, 'middle');
          } else {
            GameState.placeCardInRow(inst.instanceId, outputRow);
          }
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

    // 제작 스킬 XP: BALANCE 기반 (skillOverride로 훈련 레시피 지원)
    const craftSkillId = bp.skillOverride ?? craftSkillMap[bp.category] ?? 'crafting';
    const craftXp      = BALANCE.crafting.xpBase[craftSkillId] ?? 5;
    const stageCount   = bp.stages?.length ?? 1;
    SkillSystem.gainXp(craftSkillId, craftXp * stageCount);

    // 보조 스킬 XP — 카테고리별 관련 스킬 소량 부여 (연관 이해도)
    // 기초 crafting은 모든 전문 제작의 기반이므로 항상 +1
    if (craftSkillId !== 'crafting') {
      SkillSystem.gainXp('crafting', stageCount);
    }
    // 구조물 제작 → building + armorcraft(내구성 이해)
    if (bp.category === 'structure' && craftSkillId !== 'armorcraft') {
      SkillSystem.gainXp('armorcraft', stageCount);
    }
    // 무기 제작 → weaponcraft + melee(무기 감각)
    if (bp.category === 'weapon') {
      SkillSystem.gainXp('melee', stageCount);
    }
    // 방어구 제작 → armorcraft + defense(방어 감각)
    if (bp.category === 'armor') {
      SkillSystem.gainXp('defense', stageCount);
    }
    // 음식 제작 → cooking + harvesting(재료 가공 이해)
    if (bp.category === 'food' && craftSkillId !== 'harvesting') {
      SkillSystem.gainXp('harvesting', stageCount);
    }
    // 의료 제작 → medicine + cooking(조제·조합 이해)
    if (bp.category === 'medical' && craftSkillId !== 'cooking') {
      SkillSystem.gainXp('cooking', Math.ceil(stageCount / 2));
    }

    // 제작 아이템에 _crafted 플래그 태깅 (요리 + 무기 등)
    for (const id of outputIds) {
      if (GameState.cards[id]) GameState.cards[id]._crafted = true;
    }
  },

  /** 카드를 row의 가장 왼쪽(slot 0)에 배치, 기존 카드는 오른쪽으로 밀림 */
  _placeAtLeftmost(instanceId, row) {
    GameState._compactRow(row);
    const board = GameState.board[row];
    const lastNull = board.lastIndexOf(null);
    if (lastNull === -1) {
      // 꽉 참 → 일반 배치 시도
      GameState.placeCardInRow(instanceId, row);
      return;
    }
    for (let i = lastNull; i > 0; i--) {
      board[i] = board[i - 1];
    }
    board[0] = instanceId;
    EventBus.emit('cardPlaced', { instanceId, row, slot: 0 });
  },

  getQueueProgress(entry) {
    if (!entry || entry.tpTotal === 0) return 1;
    return (entry.tpTotal - entry.tpRemaining) / entry.tpTotal;
  },
};

export default CraftSystem;
