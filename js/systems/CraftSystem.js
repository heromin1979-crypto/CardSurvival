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
import TickEngine      from '../core/TickEngine.js';
import GameData from '../data/GameData.js';

// 히든 레시피 포함 전체 레시피
const BLUEPRINTS = { ...BLUEPRINTS_BASE, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };

const CraftSystem = {
  init() {
    // 제작은 스테이지 단위로 시간을 즉시 소비한다(TickEngine.skipTP).
    // 더 이상 tpAdvance에 묻어 자동 진행하지 않으므로 구독하지 않는다.
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

    const entry = {
      blueprintId,
      stageIndex:   0,
      craftCardId:  null,
      awaitingNext: false,
    };
    GameState.crafting.activeQueue.push(entry);
    EventBus.emit('craftStarted', { blueprintId });

    // 첫 단계 즉시 실행. 실패(야간/재료) 시 큐에서 롤백.
    if (!this._runStage(entry, 0, true)) {
      const idx = GameState.crafting.activeQueue.indexOf(entry);
      if (idx >= 0) GameState.crafting.activeQueue.splice(idx, 1);
      return false;
    }
    return true;
  },

  // 한 스테이지 실행: 야간/재료 확인 → 재료 소모 → 시간 즉시 소비 → 완성 또는 다음 단계 대기.
  // 시간·재료 소모 전에 모든 차단 조건을 검사하므로, 실패 시 부작용이 없다.
  _runStage(entry, stageIndex, isFirstStage = false) {
    const bp     = BLUEPRINTS[entry.blueprintId];
    const stage  = bp.stages[stageIndex];
    const bpName = I18n.blueprintName(entry.blueprintId, bp.name);

    // 야간 광원 체크 — 각 단계 진행 시점마다 판정 (낮에 끝난 단계는 소급 없음)
    const nightCheck = NightSystem.canActAtNight('craft');
    if (!nightCheck.allowed) {
      EventBus.emit('notify', { message: nightCheck.reason, type: 'warn' });
      return false;
    }
    // 재료 충족 체크
    const stageCheck = this._checkStageReqs(stage, entry.blueprintId);
    if (!stageCheck.ok) {
      EventBus.emit('notify', { message: I18n.t('craftSys.nextStageShort', { name: bpName, reason: stageCheck.reason }), type: 'warn' });
      return false;
    }

    // 재료 소모 (소방관 craftSave는 첫 단계에만 적용 — 기존 동작 보존)
    this._consumeStageItems(stage, isFirstStage);
    // 시간 즉시 소비 — 야간이어도 광원이 있으면 흐른다
    TickEngine.skipTP(stage.tpCost, `${bpName} — ${stage.label}`);
    entry.stageIndex = stageIndex;

    // 마지막 단계면 산출, 아니면 다음 단계 대기
    if (stageIndex >= bp.stages.length - 1) {
      this._produceOutput(bp, entry);
      const idx = GameState.crafting.activeQueue.indexOf(entry);
      if (idx >= 0) GameState.crafting.activeQueue.splice(idx, 1);
      return true;
    }
    entry.awaitingNext = true;
    this._ensureCraftCard(entry, bp);
    const nextStage = bp.stages[stageIndex + 1];
    EventBus.emit('craftStageAdvanced', { blueprintId: entry.blueprintId, stageIndex });
    EventBus.emit('notify', {
      message: I18n.t('craftSys.stageComplete', { name: bpName, stage: stage.label, next: nextStage.label }),
      type: 'info',
    });
    return true;
  },

  // 다음 단계 진행 — "이어서 제작" 버튼 / 카드 드롭의 공통 진입점
  advanceCraftStage(craftCardId) {
    const entry = GameState.crafting.activeQueue.find(e => e.craftCardId === craftCardId);
    if (!entry || !entry.awaitingNext) return false;
    const bp = BLUEPRINTS[entry.blueprintId];
    const nextIdx = entry.stageIndex + 1;
    if (!bp || nextIdx >= bp.stages.length) return false;

    entry.awaitingNext = false;
    const ok = this._runStage(entry, nextIdx, false);
    if (!ok) entry.awaitingNext = true; // 실패 시 대기 상태 복구
    return ok;
  },

  // 진행 중 제작 카드(targetId)에 다음 단계 필요 재료(sourceId)를 드롭하면 다음 단계 진행
  tryAdvanceByDrop(sourceId, targetId) {
    const target = GameState.cards[targetId];
    if (!target?._crafting || !target._craftEntry?.awaitingNext) return false;
    const srcDef = GameState.getCardDef(sourceId);
    if (!srcDef) return false;
    const reqs = target._craftEntry.nextStageReqs ?? [];
    if (!reqs.some(r => r.definitionId === srcDef.id)) return false;
    return this.advanceCraftStage(targetId);
  },

  // 스테이지 재료 소모 (consumeAt:'start' 한정). startBlueprint·다음 단계 진행 공용.
  _consumeStageItems(stage, applyCraftSave = false) {
    if (stage.consumeAt !== 'start') return;
    const craftSave = applyCraftSave ? (GameState.player.craftSaveChance ?? 0) : 0;
    let savedOnce = false;
    for (const req of stage.requiredItems) {
      let needed = req.qty;
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
          EventBus.emit('boardChanged', {});
        }
      }
    }
  },

  // 다음 단계 대기용 제작 카드 생성/갱신 (바닥 middle 행)
  _ensureCraftCard(entry, bp) {
    const nextStageIdx = entry.stageIndex + 1;
    const nextStage    = bp.stages[nextStageIdx];
    const ceData = {
      blueprintId:    entry.blueprintId,
      blueprintName:  bp.name,
      stageIndex:     entry.stageIndex,
      totalStages:    bp.stages.length,
      awaitingNext:   true,
      nextStageIndex: nextStageIdx,
      nextStageLabel: nextStage?.label ?? '',
      nextStageReqs:  (nextStage?.requiredItems ?? []).map(r => ({ definitionId: r.definitionId, qty: r.qty })),
    };
    if (entry.craftCardId && GameState.cards[entry.craftCardId]) {
      GameState.cards[entry.craftCardId]._craftEntry = ceData;
      EventBus.emit('boardChanged', {});
      return;
    }
    const outputDefId = bp.output?.[0]?.definitionId;
    if (!outputDefId) return;
    const craftInst = GameState.createCardInstance(outputDefId, {
      _crafting: true,
      _craftEntry: ceData,
    });
    if (craftInst) {
      GameState.placeCardInRow(craftInst.instanceId, 'middle');
      entry.craftCardId = craftInst.instanceId;
    }
  },

  // ── 품질 계산 (스택 불가 아이템에만 적용) ─────────────────
  _calculateQuality(bp) {
    const firstOutDef = GameData?.items[bp.output?.[0]?.definitionId];
    if (!firstOutDef || firstOutDef.stackable) return null;

    const craftSkillMap = {
      structure: 'building', material: 'crafting', food: 'cooking',
      medical: 'medicine', weapon: 'weaponcraft', armor: 'armorcraft', tool: 'crafting',
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
      if      (avgMorale > 85) score += (BALANCE.crafting.chefTeamBonusHigh ?? 0.20);
      else if (avgMorale > 70) score += (BALANCE.crafting.chefTeamBonusMid ?? 0.10);
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
      medical: 'medicine', weapon: 'weaponcraft', armor: 'armorcraft', tool: 'crafting',
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
      SkillSystem.gainXp(relevantSkill, Math.ceil(craftXp * (BALANCE.crafting.failureXpMult ?? 0.5)));
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
    const bp = BLUEPRINTS[entry?.blueprintId];
    if (!bp || !bp.stages?.length) return 1;
    // 완료된 단계 수 기준 (현재 단계까지 완료 → stageIndex+1 / 전체)
    return Math.min(1, (entry.stageIndex + 1) / bp.stages.length);
  },
};

export default CraftSystem;
