// CombatSystem 믹스인 — 동료 자율 행동 + 적 의도/AI/공격/타이밍 위협.
// 메서드는 CombatSystem 객체에 스프레드되어 this=CombatSystem으로 실행된다.
import EventBus       from '../../core/EventBus.js';
import GameState      from '../../core/GameState.js';
import I18n           from '../../core/I18n.js';
import SystemRegistry from '../../core/SystemRegistry.js';
import NoiseSystem    from '../NoiseSystem.js';
import StatSystem     from '../StatSystem.js';
import SkillSystem    from '../SkillSystem.js';
import DiseaseSystem  from '../DiseaseSystem.js';
import BodySystem     from '../BodySystem.js';
import { rollEnemy }  from '../../data/enemies.js';
import { NPC_ITEMS }  from '../../data/npcs.js';
import BALANCE        from '../../data/gameBalance.js';
import GameData       from '../../data/GameData.js';
import { applyDamage, consumeToken } from './CombatStatusSystem.js';
import { modifyIncomingDamage, modifyOutgoingDamage } from './CombatResolution.js';
import { buildEnemyProfile } from './EnemyCombatAdapter.js';
import { getRank, moveCombatant } from './FormationSystem.js';
import {
  COMPANION_COMBAT_LOADOUTS,
  getCombatSkill,
} from '../../data/combatSkills.js';

export const CombatAiTurns = {
  // ── Combat Overhaul Phase 2 · 동료 자율 행동 ──────
  // stance: 'attack'(기본) | 'heal' | 'support' | 'hold' | 'manual'
  // state 위치: GameState.npcs.states[npcId].stance
  // 'manual'은 자동 행동 skip — 기존 companionAttack/Heal 명령 플로우 유지

  _getCompanionStance(npcId) {
    const st = GameState.npcs?.states?.[npcId];
    return st?.stance ?? 'attack';
  },

  resolveManualCompanionAction(action, npcId = null) {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat?.active) return false;

    const entry = this._currentEntry(combat);
    if (entry?.type !== 'companion') return false;
    const activeNpcId = entry.id;
    if (npcId && npcId !== activeNpcId) return false;

    const st = gs.npcs?.states?.[activeNpcId];
    if (!st || (st.hp ?? 0) <= 0) return false;

    this._tickCompanionSkillCooldowns(activeNpcId);

    switch (action) {
      case 'attack':
        this._companionAutoAttack(activeNpcId, { preferSelectedTarget: true });
        break;
      case 'heal':
        this._companionAutoHeal(activeNpcId);
        break;
      case 'support':
        this._companionAutoSupport(activeNpcId);
        break;
      case 'hold':
      case 'wait':
        this._companionHold(activeNpcId);
        break;
      default:
        return false;
    }

    this._finishActorTurn();
    return true;
  },

  _finishActorTurn() {
    const gs = GameState;
    if (!gs.combat?.active) return;

    for (const enemy of gs.combat.enemies ?? []) {
      if ((enemy.currentHp ?? 0) <= 0 && !enemy._killProcessed) {
        this._onEnemyKilled(enemy);
      }
    }

    if (this._allEnemiesDead()) {
      this._resolveVictory();
      return;
    }

    this._autoAdvanceTarget();
    this._tickStatusEffects();
    if (this._allEnemiesDead()) { this._resolveVictory(); return; }
    if (this._isPlayerDefeated()) { this._resolveDefeat(); return; }

    this._processAiTurns();
  },

  _runCompanionTurn(npcId) {
    const gs = GameState;
    const st = gs.npcs?.states?.[npcId];
    if (!st || (st.hp ?? 0) <= 0) return;
    if (!gs.combat?.active) return;

    // 쿨다운 틱 (턴 시작 시점)
    this._tickCompanionSkillCooldowns(npcId);

    const stance = this._getCompanionStance(npcId);
    switch (stance) {
      case 'manual': return;                        // 자동 행동 skip
      case 'hold':    return this._companionHold(npcId);
      case 'heal':    return this._companionAutoHeal(npcId);
      case 'support': return this._companionAutoSupport(npcId);
      case 'attack':
      default:        return this._companionAutoAttack(npcId);
    }
  },

  // 가장 낮은 HP의 닿는 적 공격 (원거리 동료는 후열 직접 타격 가능)
  _companionAutoAttack(npcId, options = {}) {
    const gs = GameState;
    const enemies = gs.combat?.enemies ?? [];
    const attackSkill = (COMPANION_COMBAT_LOADOUTS[npcId] ?? [])
      .map(skillId => gs.combat?.skillsById?.[skillId] ?? getCombatSkill(skillId))
      .find(skill => (skill?.effects ?? []).some(effect => effect?.type === 'damage'));
    const damageEffect = attackSkill?.effects?.find(effect => effect?.type === 'damage');
    const isRangedNpc = attackSkill
      ? (attackSkill.target?.ranks ?? []).some(rank => rank > 2)
      : (BALANCE.combat.companionAuto.rangedCompanions ?? []).includes(npcId);
    const alive = this.getReachableEnemies(isRangedNpc)
      .map(e => ({ e, idx: enemies.indexOf(e) }))
      .filter(x => x.idx >= 0);
    if (alive.length === 0) return;
    const selectedIdx = gs.combat?.targetIndex ?? -1;
    const selected = options.preferSelectedTarget
      ? alive.find(x => x.idx === selectedIdx)
      : null;
    if (!selected) alive.sort((a, b) => (a.e.currentHp ?? 0) - (b.e.currentHp ?? 0));
    const targetEntry = selected ?? alive[0];
    const target = targetEntry.e;

    const cfg = BALANCE.combat.companionAuto;
    const [dMin, dMax] = Array.isArray(damageEffect?.value)
      ? damageEffect.value
      : cfg.attackDamage;
    const accuracy = Number.isFinite(attackSkill?.accuracy)
      ? attackSkill.accuracy
      : cfg.attackAccuracy;
    const combatant = gs.combat?.combatants?.[npcId];
    const multiplier = Number.isFinite(combatant?.combatDamageMultiplier)
      && combatant.combatDamageMultiplier > 0
      ? combatant.combatDamageMultiplier
      : 1;

    if (Math.random() > accuracy) {
      gs.combat.log.push(I18n.t
        ? I18n.t('combatSys.companionAtkMiss', { name: this._npcLabel(npcId) })
        : `${this._npcLabel(npcId)} 공격 빗나감`);
      this._fx({ kind: 'companionAttack', npcId, targetIdx: targetEntry.idx, miss: true });
      return;
    }

    const raw = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const dmg = Math.floor(raw * multiplier);
    target.currentHp = Math.max(0, (target.currentHp ?? 0) - dmg);

    gs.combat.log.push(I18n.t
      ? I18n.t('combatSys.companionAtk', { name: this._npcLabel(npcId), enemy: I18n.enemyName?.(target.id, target.name) ?? target.name, dmg })
      : `${this._npcLabel(npcId)}→${target.name}: ${dmg} 피해`);
    this._fx({ kind: 'companionAttack', npcId, targetIdx: targetEntry.idx, dmg, fx: isRangedNpc ? 'shot' : 'slash' });
    EventBus.emit('companionAction', { npcId, action: 'attack', targetIdx: targetEntry.idx, damage: dmg });
  },

  // 이번 턴 받는 피해 감소 버프 (1턴)
  _companionHold(npcId) {
    const gs = GameState;
    const st = gs.npcs?.states?.[npcId];
    if (!st) return;
    const reduct = BALANCE.combat.companionAuto.holdDamageReduct;
    st.combatBuffs = st.combatBuffs ?? {};
    st.combatBuffs.holdReduct = { value: reduct, duration: 1 };
    gs.combat.log.push(`🛡️ ${this._npcLabel(npcId)} 방어 자세 (피해 -${Math.round(reduct * 100)}%)`);
    this._fx({ kind: 'companionBuff', npcId, buff: 'hold' });
    EventBus.emit('companionAction', { npcId, action: 'hold' });
  },

  // 플레이어 HP < 70% 이면 힐, 아니면 attack 폴백
  _companionAutoHeal(npcId) {
    const gs = GameState;
    const p = gs.player;
    const hpRatio = (p?.hp?.current ?? 0) / (p?.hp?.max ?? 1);
    const cfg = BALANCE.combat.companionAuto;
    if (hpRatio >= cfg.healThreshold) {
      // 힐 필요 없음 → 공격 폴백
      return this._companionAutoAttack(npcId);
    }
    const [min, max] = cfg.healAmount;
    const amt = min + Math.floor(Math.random() * (max - min + 1));
    p.hp.current = Math.min(p.hp.max, (p.hp.current ?? 0) + amt);
    gs.combat.log.push(`💉 ${this._npcLabel(npcId)} 응급 처치 (+${amt} HP)`);
    this._fx({ kind: 'companionHeal', npcId, amount: amt });
    EventBus.emit('companionAction', { npcId, action: 'heal', amount: amt });
  },

  // 클래스 스킬 쿨다운 0이면 사용, 아니면 attack 폴백
  _companionAutoSupport(npcId) {
    const skill = BALANCE.combat.companionAuto.classSkills?.[npcId];
    if (!skill) return this._companionAutoAttack(npcId);
    const st = GameState.npcs?.states?.[npcId];
    if (!st) return;
    st.skillCooldowns = st.skillCooldowns ?? {};
    const cd = st.skillCooldowns[skill.id] ?? 0;
    if (cd > 0) return this._companionAutoAttack(npcId);

    this._applyCompanionSkill(npcId, skill);
    st.skillCooldowns[skill.id] = skill.cooldown;
  },

  _applyCompanionSkill(npcId, skill) {
    const gs = GameState;
    const label = this._npcLabel(npcId);

    if (skill.id === 'nurse_triage') {
      // 모든 아군 +healAmount
      const p = gs.player;
      if (p.hp) p.hp.current = Math.min(p.hp.max, (p.hp.current ?? 0) + skill.healAmount);
      for (const id of (gs.companions ?? [])) {
        const s = gs.npcs?.states?.[id];
        if (!s || (s.hp ?? 0) <= 0) continue;
        s.hp = Math.min(s.maxHp ?? 50, s.hp + skill.healAmount);
      }
      gs.combat.log.push(`⚕️ ${label} 응급 분류 (모두 +${skill.healAmount} HP)`);
    }
    else if (skill.id === 'soldier_suppress') {
      gs.combat._suppressMult = skill.atkMult;
      gs.combat._suppressRemaining = skill.duration;
      gs.combat.log.push(`🎯 ${label} 제압 사격 (${skill.duration}턴 · 적 공격력 ×${skill.atkMult})`);
    }
    else if (skill.id === 'doctor_diagnose') {
      gs.combat._diagnoseResistBonus = skill.resistBonus;
      gs.combat._diagnoseRemaining   = skill.duration;
      gs.combat.log.push(`🔬 ${label} 상태 진단 (${skill.duration}턴 · 아군 상태이상 저항 +${Math.round(skill.resistBonus * 100)}%)`);
    }

    this._fx({ kind: 'companionSkill', npcId, skillId: skill.id });
    EventBus.emit('companionAction', { npcId, action: 'skill', skillId: skill.id });
  },

  _tickCompanionSkillCooldowns(npcId) {
    const st = GameState.npcs?.states?.[npcId];
    if (!st?.skillCooldowns) return;
    for (const id of Object.keys(st.skillCooldowns)) {
      if (st.skillCooldowns[id] > 0) st.skillCooldowns[id]--;
    }
  },

  // NPC 라벨 — ui·log 공용 (한글 name 우선, 없으면 id 축약)
  _npcLabel(npcId) {
    if (!npcId) return '';
    const npcItem = NPC_ITEMS?.[npcId];
    if (npcItem?.name) return I18n.itemName ? I18n.itemName(npcId, npcItem.name) : npcItem.name;
    return npcId.replace(/^npc_/, '');
  },

  // ── Combat Overhaul Phase 3 · 적 의도 예고 + aiPattern ──
  // Into the Breach 방식: 적의 다음 턴 행동을 결정적으로 미리 결정/표시.
  // `enemy._nextIntent = { action, targetType, targetId?, iconEmoji, label }`
  //
  // aiPattern 분기 (5종):
  //   aggressive → HP 최저 타겟 (플레이어+동료 중)
  //   defensive  → 원거리 무기 들고있는 플레이어 우선
  //   horde      → 무작위 타겟
  //   normal     → 플레이어 고정
  //   sniper     → 힐러 클래스 동료 우선, 없으면 플레이어
  //   predator   → bleed/infection/burn 상태이상 타겟 우선

  _getEligibleTargets(combat, gs) {
    const targets = [];
    if ((gs?.player?.hp?.current ?? 0) > 0) {
      const weapon = gs.player.equipped?.weapon_main ?? gs.player.equipped?.weapon_sub;
      const wDef = weapon ? gs.getCardDef?.(weapon) : null;
      const isRanged = !!wDef?.combat?.requiresAmmo;
      const statusEffects = combat?.playerStatus ?? [];
      targets.push({
        type: 'player',
        hp: gs.player.hp.current,
        maxHp: gs.player.hp.max,
        isRanged,
        statusEffects,
      });
    }
    const companions = gs?.companions ?? [];
    for (const id of companions) {
      const st = gs.npcs?.states?.[id];
      if (!st || (st.hp ?? 0) <= 0) continue;
      targets.push({
        type: 'companion',
        id,
        hp: st.hp,
        maxHp: st.maxHp ?? 50,
        isHealer: id === 'npc_nurse' || id === 'npc_doctor',
        statusEffects: st.statusEffects ?? [],
      });
    }
    return targets;
  },

  _pickTargetByPattern(pattern, targets, enemy) {
    if (!targets || targets.length === 0) return null;
    const hasStatus = t => (t.statusEffects ?? []).some(s =>
      s.id === 'bleed' || s.id === 'infection' || s.id === 'burn' || s.id === 'acid_burn'
    );

    switch (pattern) {
      case 'aggressive': {
        // HP 최저 (ratio 기준으로 fair)
        const sorted = [...targets].sort((a, b) =>
          (a.hp / (a.maxHp || 1)) - (b.hp / (b.maxHp || 1))
        );
        return sorted[0];
      }
      case 'defensive': {
        // 원거리 무기 들고있는 플레이어 우선
        const ranged = targets.find(t => t.type === 'player' && t.isRanged);
        if (ranged) return ranged;
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
      case 'horde': {
        return targets[Math.floor(Math.random() * targets.length)];
      }
      case 'sniper': {
        // 힐러 클래스 동료 우선, 없으면 플레이어, 아니면 첫 번째
        const healer = targets.find(t => t.type === 'companion' && t.isHealer);
        if (healer) return healer;
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
      case 'predator': {
        // 상태이상 있는 대상 우선 (약한 먹잇감)
        const wounded = targets.find(hasStatus);
        if (wounded) return wounded;
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
      case 'normal':
      default: {
        // 플레이어 고정
        return targets.find(t => t.type === 'player') ?? targets[0];
      }
    }
  },

  // taunted 토큰을 가진 아군이 있으면 패턴과 무관하게 그쪽을 노린다 (도발)
  _tauntedTargetOf(targets, combat) {
    const combatants = combat?.combatants;
    if (!combatants) return null;
    return targets.find(t => {
      const combatant = combatants[t.type === 'player' ? 'player' : t.id];
      return (combatant?.tokens?.taunted ?? 0) > 0 && combatant.dead !== true;
    }) ?? null;
  },

  _decideNextIntent(enemy, combat, gs) {
    if (!enemy || (enemy.currentHp ?? 0) <= 0) return null;
    const targets = this._getEligibleTargets(combat, gs);
    const pattern = enemy.aiPattern ?? 'normal';
    const taunted = this._tauntedTargetOf(targets, combat);
    const target = taunted ?? this._pickTargetByPattern(pattern, targets, enemy);
    if (!target) return null;
    const viaTaunt = taunted !== null;

    // 잠복: 깨어나기 전에는 위협이 아니다 — 이 창에 처치하면 기습 무효
    if ((enemy._dormantRemaining ?? 0) > 0) {
      return {
        action: 'dormant',
        countdown: enemy._dormantRemaining,
        targetType: 'self',
        targetId: null,
        iconEmoji: '💤',
        label: '잠복 — 곧 깨어난다',
        pattern,
      };
    }

    // 예고: 다음 턴 발동할 스킬을 보여준다 — 이동/블록/피격 취소로 대응할 창
    if (enemy._telegraph) {
      const tgSkill = (enemy.specialSkills ?? []).find(s => s.id === enemy._telegraph.skillId);
      return {
        action: 'telegraph',
        skillId: enemy._telegraph.skillId,
        countdown: enemy._telegraph.remaining,
        targetType: target?.type ?? 'player',
        targetId: target?.id ?? null,
        iconEmoji: '⚠️',
        label: `${tgSkill?.name ?? '강습'} 준비 중!`,
        pattern,
      };
    }

    // 동요: 사기가 꺾이기 시작한 인간 적 — 사기 공격·처치 압박이 유효함을 노출
    const wavering = enemy.type === 'human'
      && enemy.currentMorale != null
      && (enemy.currentHp / (enemy.maxHp || 1)) <= 0.5;

    // 타이밍 압박 적: 충전 중이면 카운트다운 의도 우선
    if ((enemy._chargeRemaining ?? null) !== null && enemy.timedThreat) {
      const icon = enemy.timedThreat.id === 'self_destruct' ? '💥'
                 : enemy.timedThreat.id === 'summon_horde'  ? '📣'
                 : '⚡';
      const labelMap = {
        self_destruct: `${enemy._chargeRemaining}턴 후 자폭`,
        summon_horde:  `${enemy._chargeRemaining}턴 후 증원 소환 · 시끄럽게 처치 시 비명`,
        charge_strike: `${enemy._chargeRemaining}턴 후 강타`,
      };
      return {
        action: 'timed_threat',
        threatId: enemy.timedThreat.id,
        countdown: enemy._chargeRemaining,
        targetType: target?.type ?? 'player',
        targetId: target?.id ?? null,
        iconEmoji: icon,
        label: labelMap[enemy.timedThreat.id] ?? '위협 충전',
        pattern: enemy.aiPattern ?? 'normal',
      };
    }

    // 후열 근접 적: 다음 턴은 공격이 아니라 전열로 전진
    if (this.rowOf(enemy) === 'back' && (enemy.attackType ?? 'melee') === 'melee') {
      return {
        action: 'advance',
        targetType: 'self',
        targetId: null,
        iconEmoji: '👣',
        label: I18n.t('combat.rankFront') + ' 전진',
        pattern,
      };
    }

    // 스킬 사용 가능 여부 (쿨다운 0인 특수 스킬)
    const readySkill = (enemy.specialSkills ?? []).find(s =>
      (enemy._skillCooldowns?.[s.id] ?? 0) === 0
    );
    const willUseSkill = !!readySkill;

    const iconEmoji = willUseSkill ? '💢' : '🗡';
    const tgtName = target.type === 'player' ? '플레이어' : this._npcLabel(target.id);
    const baseLabel = willUseSkill
      ? `${tgtName}에 ${readySkill.name ?? '스킬'} 사용`
      : `${tgtName} 공격`;
    const label = wavering ? `${baseLabel} · 동요` : baseLabel;

    return {
      action: willUseSkill ? 'skill' : 'attack',
      targetType: target.type,
      targetId: target.id ?? null,
      skillId: willUseSkill ? readySkill.id : null,
      iconEmoji,
      label,
      pattern,
      viaTaunt,
      wavering,
    };
  },

  /**
   * 큐 엔트리 기반 단일 적 턴 실행. Phase 3 — intent 기반 타겟 라우팅.
   *   - enemy._nextIntent.targetType === 'companion' → 해당 동료 공격 (NPCSystem.damageCompanion)
   *   - 그 외 → 기존 _runEnemyAI (플레이어 타겟)
   *   - 턴 종료 후 다음 intent 재결정
   */
  _runSingleEnemyTurn(enemyIdx) {
    const gs = GameState;
    const enemy = gs.combat.enemies?.[enemyIdx];
    if (!enemy || enemy.currentHp <= 0) return;

    // 잠복 상태: 깨어나기 전에는 행동하지 않는다 — 이 사이 처치하면 기습 무효
    if ((enemy._dormantRemaining ?? 0) > 0) {
      enemy._dormantRemaining -= 1;
      const enemyName = I18n.enemyName(enemy.id, enemy.name);
      gs.combat.log.push(enemy._dormantRemaining > 0
        ? I18n.t('combatSys.dormantStir', { enemy: enemyName })
        : I18n.t('combatSys.dormantWake', { enemy: enemyName }));
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    // 산성 축적 등 방치 비용: 생존한 자기 턴마다 상태이상 피해가 커진다
    if (enemy.statusInflict?.escalatePerTurn) {
      enemy._inflictEscalation = (enemy._inflictEscalation ?? 0) + enemy.statusInflict.escalatePerTurn;
      gs.combat.log.push(I18n.t('combatSys.inflictEscalate', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        status: enemy.statusInflict.name,
        stacks: enemy._inflictEscalation,
      }));
    }

    const stunIdx = (enemy._statusEffects ?? []).findIndex(s =>
      s?.id === 'stun' || s?.effect?.skipTurn === true);
    if (stunIdx !== -1) {
      const [stun] = enemy._statusEffects.splice(stunIdx, 1);
      const enemyName = I18n.enemyName(enemy.id, enemy.name);
      gs.combat.log.push(`${enemyName}은(는) ${stun?.name ?? I18n.t('combatSys.stun')} 상태라 행동하지 못했다.`);
      this._fx({ kind: 'status', target: 'enemy', enemyIdx, statusId: 'stun' });
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }
    this._applyEnemyTurnStartTraits(enemy);

    // 사기 격파: 사기 소진 시 도주(rout)
    if (enemy.type === 'human' && enemy.currentMorale != null
        && enemy.currentMorale <= BALANCE.combat.moraleBreak.routThreshold) {
      enemy._routed = true;
      enemy.currentHp = 0;
      gs.combat.log.push(I18n.t('combatSys.enemyRout', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      return;
    }

    // 후열 근접 적: 공격 대신 전열로 전진 (1턴 소모)
    if (this.rowOf(enemy) === 'back' && (enemy.attackType ?? 'melee') === 'melee') {
      enemy.row = 'front';
      gs.combat.log.push(I18n.t('combatSys.enemyAdvance', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      this._fx({ kind: 'advance', enemyIdx });
      enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    // 타이밍 압박: 충전 중/발동 처리
    if ((enemy._chargeRemaining ?? null) !== null) {
      if (enemy._chargeRemaining > 0) {
        if (enemy.timedThreat?.chargingAttacks) {
          const logs = this._runEnemyAI(enemy);
          for (const log of logs) { gs.combat.log.push(log); if (this._isPlayerDefeated()) return; }
        }
        enemy._chargeRemaining -= 1;
        enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
        return;
      }
      this._resolveTimedThreat(enemy);
      enemy._chargeRemaining = enemy.timedThreat?.chargeTurns ?? null;
      if (enemy.currentHp > 0) enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
      return;
    }

    const intent = enemy._nextIntent;
    // 도발이 이 턴의 타겟을 강제했다면 스택 1 소비 (1스택 = 적 1턴 유도)
    if (intent?.viaTaunt) {
      const tauntedId = intent.targetType === 'player' ? 'player' : intent.targetId;
      const tauntedCombatant = gs.combat.combatants?.[tauntedId];
      if (tauntedCombatant) consumeToken(tauntedCombatant, 'taunted', 1);
    }
    if (intent?.targetType === 'companion' && intent.targetId) {
      this._enemyAttackCompanion(enemy, intent.targetId);
    } else {
      // 기본 플레이어 타겟 (기존 로직 유지)
      const logs = this._runEnemyAI(enemy);
      for (const log of logs) {
        gs.combat.log.push(log);
        if (this._isPlayerDefeated()) return;
      }
    }
    if (gs.combat.log.length > BALANCE.combat.combatLogMaxEntries) {
      gs.combat.log.splice(0, gs.combat.log.length - BALANCE.combat.combatLogMaxEntries);
    }

    // 다음 턴 intent 재결정 (죽었을 수도 있으므로 null 허용)
    enemy._nextIntent = this._decideNextIntent(enemy, gs.combat, gs) ?? null;
  },

  /**
   * Phase 3 — 적이 동료를 명시적으로 공격.
   * 공격 로직은 _enemyAttack과 동일 구조이되, 최종 데미지를 NPCSystem.damageCompanion으로 라우팅.
   * 간결성을 위해 기본 attack 데미지만 사용 (스킬은 플레이어 전용 유지).
   */
  _enemyAttackCompanion(enemy, npcId) {
    const gs = GameState;
    const npcSys = SystemRegistry.get('NPCSystem');
    if (!npcSys?.damageCompanion) return;
    const st = gs.npcs?.states?.[npcId];
    if (!st || (st.hp ?? 0) <= 0) return;

    const [dMin, dMax] = enemy.attack?.damage ?? (BALANCE.combat.enemyDefaultDamage ?? [3, 6]);
    let damage = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const hit = Math.random() < (enemy.attack?.accuracy ?? (BALANCE.combat.enemyBaseAccuracy ?? 0.7));
    if (!hit) {
      gs.combat.log.push(`${enemy.name ?? '적'} → ${this._npcLabel(npcId)}: 빗나감`);
      return;
    }

    // hold stance 피해 경감
    const holdReduct = st.combatBuffs?.holdReduct;
    if (holdReduct && (holdReduct.duration ?? 0) > 0) {
      damage = Math.max(1, Math.floor(damage * (1 - (holdReduct.value ?? 0))));
    }

    // suppress 버프 (companion skill: soldier_suppress)
    if ((gs.combat._suppressRemaining ?? 0) > 0) {
      damage = Math.max(1, Math.floor(damage * (gs.combat._suppressMult ?? 1)));
    }

    const struck = this._dealDamageToAlly({ npcId, rawDamage: damage });
    if (struck.dodged) {
      gs.combat.log.push(`${enemy.name ?? '적'} → ${this._npcLabel(npcId)}: 회피!`);
      return;
    }
    damage = struck.damage;
    gs.combat.log.push(`${enemy.name ?? '적'} → ${this._npcLabel(npcId)}: ${damage} 피해`);
    gs.combat.lastHit = { target: 'companion', damage, npcId, isCrit: false };
    this._fx({
      kind: 'enemyAttackCompanion',
      enemyIdx: gs.combat.enemies.indexOf(enemy),
      npcId,
      fx: this._monsterImpactFx(enemy),
      dmg: damage,
    });
    EventBus.emit('enemyAttackCompanion', { enemyId: enemy.id, npcId, damage });
  },

  _monsterImpactFx(enemy) {
    if ((enemy?.attackType ?? 'melee') === 'ranged') return 'shot';

    const id = String(enemy?.id ?? enemy?.definitionId ?? '').toLowerCase();
    const name = String(enemy?.name ?? '').toLowerCase();
    const key = `${id} ${name}`;

    if (key.includes('acid') || key.includes('poison') || key.includes('부식')) return 'acid';
    if (key.includes('charger') || key.includes('돌진')) return 'shock';
    if (key.includes('brute') || key.includes('horde') || key.includes('tiger') || key.includes('거대')) return 'slam';
    if (key.includes('bloater') || key.includes('radiation') || key.includes('폭발') || key.includes('방사')) return 'rupture';

    return 'claw';
  },

  _addPlayerStatus(status) {
    if (!status?.id) return false;
    const gs = GameState;
    if (!Array.isArray(gs.combat.playerStatus)) gs.combat.playerStatus = [];
    const existing = gs.combat.playerStatus.find(s => s.id === status.id);
    if (existing) {
      existing.duration = Math.max(existing.duration ?? 0, status.duration ?? 1);
      existing.effect = { ...(existing.effect ?? {}), ...(status.effect ?? {}) };
    } else {
      gs.combat.playerStatus.push({
        id: status.id,
        name: status.name ?? status.id,
        duration: status.duration ?? 1,
        effect: { ...(status.effect ?? {}) },
      });
    }
    this._fx({ kind: 'status', target: 'player', statusId: status.id });
    return true;
  },

  _instantiateEnemyFromDefinition(def) {
    if (!def) return null;
    const hpDef = def.hp ?? { min: def.maxHp ?? 1, max: def.maxHp ?? 1 };
    const hp = hpDef.min + Math.floor(Math.random() * (hpDef.max - hpDef.min + 1));
    return {
      ...def,
      currentHp: hp,
      maxHp: hp,
      row: def.position ?? def.row ?? 'front',
      _skillCooldowns: {},
      _statusEffects: [],
      _chargeRemaining: def.timedThreat?.chargeTurns ?? null,
      _dormantRemaining: def.dormant?.wakeTurns ?? null,
      currentMorale: def.type === 'human' ? (def.morale?.max ?? 100) : null,
    };
  },

  _summonEnemyById(enemyId, count = 1, row = 'front', sourceEnemy = null) {
    const gs = GameState;
    const def = GameData?.enemies?.[enemyId];
    if (!def || count <= 0) return 0;
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const add = this._instantiateEnemyFromDefinition(def);
      if (!add) continue;
      if (!this._spawnEnemyMidCombat(add, row)) break;
      spawned++;
    }
    if (spawned > 0) {
      this._fx({
        kind: 'summon',
        enemyIdx: sourceEnemy ? gs.combat.enemies.indexOf(sourceEnemy) : -1,
        count: spawned,
      });
    }
    return spawned;
  },

  // 전투 중 적 증원의 단일 진입점 — 레거시 enemies/turnQueue와 랭크 combatants/formations를
  // 함께 등록한다. 랭크 모드에서 포메이션(최대 4칸)이 꽉 차면 증원을 억제한다.
  _spawnEnemyMidCombat(enemyObj, row = 'front') {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat || !enemyObj) return false;
    enemyObj.row = row;

    if (combat.combatants && combat.formations) {
      this._compactRankedEnemyFormation();
      const preferredRanks = row === 'back' ? [3, 4, 1, 2] : [1, 2, 3, 4];
      const slotRank = preferredRanks.find(rank => combat.formations.enemy?.[rank - 1] == null);
      if (slotRank === undefined) {
        this._pushCombatLog('증원이 들어설 자리가 없다!');
        return false;
      }

      combat.enemies.push(enemyObj);
      const index = combat.enemies.length - 1;
      const combatantId = `enemy:${index}`;
      combat.formations.enemy[slotRank - 1] = combatantId;
      combat.combatants[combatantId] = {
        id: combatantId,
        side: 'enemy',
        sourceType: 'enemy',
        sourceId: enemyObj.id ?? enemyObj.definitionId,
        enemyIndex: index,
        hp: enemyObj.currentHp,
        maxHp: enemyObj.maxHp,
        speed: enemyObj.speed ?? BALANCE.combat.defaultEnemySpeed,
        dodge: enemyObj.dodge ?? 0,
        rank: slotRank,
        tokens: {},
        statusEffects: [...(enemyObj._statusEffects ?? [])],
        dead: (enemyObj.currentHp ?? 0) <= 0,
      };
      const profile = buildEnemyProfile(enemyObj);
      combat.enemyProfiles[combatantId] = profile;
      for (const skill of profile.skills ?? []) {
        combat.skillsById[skill.id] = skill;
      }
      combat.turnQueue?.push({
        type: 'enemy',
        enemyIdx: index,
        order: combat.turnQueue.length,
        combatantId,
      });
    } else {
      combat.enemies.push(enemyObj);
      combat.turnQueue?.push({
        type: 'enemy',
        enemyIdx: combat.enemies.length - 1,
        order: combat.turnQueue.length,
      });
    }

    enemyObj._nextIntent = this._decideNextIntent(enemyObj, combat, gs);
    return true;
  },

  _applyEnemyTemporaryBuff(enemy, id, value, duration) {
    if (!enemy || !id || !duration) return;
    if (!enemy._combatBuffs) enemy._combatBuffs = {};
    enemy._combatBuffs[id] = { value, duration };
  },

  _tickEnemyTemporaryBuffs(enemy) {
    if (!enemy?._combatBuffs) return;
    for (const [id, buff] of Object.entries(enemy._combatBuffs)) {
      buff.duration = (buff.duration ?? 1) - 1;
      if (buff.duration <= 0) {
        if (id === 'defenseBoost') enemy.defense = Math.max(0, (enemy.defense ?? 0) - (buff.value ?? 0));
        delete enemy._combatBuffs[id];
      }
    }
  },

  _applyEnemyTurnStartTraits(enemy) {
    if (!enemy || enemy.currentHp <= 0) return;
    this._tickEnemyTemporaryBuffs(enemy);
    this._applyBossPhaseTriggers(enemy);
    if (enemy.regeneration && enemy.currentHp < enemy.maxHp) {
      const before = enemy.currentHp;
      enemy.currentHp = Math.min(enemy.maxHp, enemy.currentHp + enemy.regeneration);
      const healed = enemy.currentHp - before;
      if (healed > 0) {
        GameState.combat.log.push(`${enemy.name ?? enemy.id} regenerates ${healed} HP`);
        this._fx({ kind: 'status', target: 'enemy', enemyIdx: GameState.combat.enemies.indexOf(enemy), statusId: 'regeneration' });
      }
    }
  },

  _applyEnemyAoeAttack(enemy, aoeAttack) {
    if (!aoeAttack || Math.random() >= (aoeAttack.chance ?? 1)) return 0;
    const gs = GameState;
    const [dMin, dMax] = aoeAttack.damage ?? [0, 0];
    const struck = this._dealDamageToAlly({
      rawDamage: dMin + Math.floor(Math.random() * (dMax - dMin + 1)),
      canBeDodged: false,
    });
    const dmg = struck.damage;
    gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
    EventBus.emit('playerHit', { damage: dmg });

    for (const id of (gs.companions ?? [])) {
      const st = gs.npcs?.states?.[id];
      if (st && (st.hp ?? 0) > 0) {
        this._dealDamageToAlly({ npcId: id, rawDamage: dmg, canBeDodged: false });
      }
    }

    if (aoeAttack.effect) {
      this._applyEnemySkillEffect(enemy, { id: 'aoe_attack', effect: aoeAttack.effect }, dmg);
    }
    this._fx({ kind: 'enemyAttack', enemyIdx: gs.combat.enemies.indexOf(enemy), fx: 'skill', dmg, crit: true });
    return dmg;
  },

  _applyBossPhaseTriggers(enemy) {
    if (!enemy?.phaseThresholds?.length || !enemy.maxHp) return;
    if (!enemy._triggeredPhaseThresholds) enemy._triggeredPhaseThresholds = [];
    const ratio = enemy.currentHp / enemy.maxHp;
    const thresholds = [...enemy.phaseThresholds].sort((a, b) => b - a);
    for (const threshold of thresholds) {
      if (ratio > threshold || enemy._triggeredPhaseThresholds.includes(threshold)) continue;
      enemy._triggeredPhaseThresholds.push(threshold);
      if (enemy._skillCooldowns) {
        for (const skill of (enemy.specialSkills ?? [])) enemy._skillCooldowns[skill.id] = 0;
      }
      if (enemy.summon?.enemyId) {
        this._summonEnemyById(enemy.summon.enemyId, enemy.summon.count ?? 1, 'front', enemy);
      }
      if (enemy.aoeAttack) this._applyEnemyAoeAttack(enemy, enemy.aoeAttack);
      GameState.combat.log.push(`${enemy.name ?? enemy.id} enters phase ${threshold}`);
    }
  },

  _applyEnemySkillEffect(enemy, skill, damageDealt = 0) {
    const effect = skill?.effect;
    if (!effect) return [];
    const gs = GameState;
    const logs = [];

    if (Number.isFinite(effect.forcedMove) && effect.forcedMove !== 0) {
      this._forceMoveAlly('player', effect.forcedMove, enemy);
    }

    if (effect.selfHeal) {
      const before = enemy.currentHp ?? 0;
      enemy.currentHp = Math.min(enemy.maxHp ?? before, before + effect.selfHeal);
      logs.push(`${enemy.name ?? enemy.id} heals ${enemy.currentHp - before} HP`);
    }

    if (effect.summon?.enemyId) {
      const count = effect.summon.count ?? 1;
      const spawned = this._summonEnemyById(effect.summon.enemyId, count, 'front', enemy);
      if (spawned > 0) logs.push(`${enemy.name ?? enemy.id} summons ${spawned} reinforcements`);
    }

    const dot = effect.dot ?? effect.bleed;
    if (dot) {
      const statusId = effect.bleed ? 'bleed' : `${skill.id}_dot`;
      this._addPlayerStatus({
        id: statusId,
        name: dot.name ?? statusId,
        duration: dot.duration ?? effect.duration ?? 2,
        effect: { hpLossPerRound: dot.hpLossPerRound ?? dot.hpPerRound ?? 0 },
      });
    }

    if (effect.poison) {
      this._addPlayerStatus({
        id: 'poison',
        name: 'poison',
        duration: effect.duration ?? effect.dot?.duration ?? 3,
        effect: { hpLossPerRound: effect.dot?.hpLossPerRound ?? 4 },
      });
    }

    if (effect.infection) gs.modStat?.('infection', effect.infection);
    if (effect.radiation) gs.modStat?.('radiation', effect.radiation);
    if (effect.bodyTemp) gs.modStat?.('temperature', effect.bodyTemp);

    if (effect.staminaDrain && gs.stats?.stamina) {
      gs.stats.stamina.current = Math.max(0, (gs.stats.stamina.current ?? 0) - effect.staminaDrain);
    }
    if (effect.moraleDrain && gs.stats?.morale) {
      gs.stats.morale.current = Math.max(0, (gs.stats.morale.current ?? 0) - effect.moraleDrain);
    }

    if (effect.stun) {
      this._addPlayerStatus({ id: 'stun', name: I18n.t('combatSys.stun'), duration: effect.stun, effect: {} });
    }

    if (effect.defenseBoost) {
      enemy.defense = (enemy.defense ?? 0) + effect.defenseBoost;
      this._applyEnemyTemporaryBuff(enemy, 'defenseBoost', effect.defenseBoost, effect.duration ?? 2);
    }
    if (effect.evasion) this._applyEnemyTemporaryBuff(enemy, 'evasion', effect.evasion, effect.duration ?? 2);
    if (effect.invulnerable) this._applyEnemyTemporaryBuff(enemy, 'invulnerable', 1, effect.invulnerable);

    if (effect.multiHit && damageDealt > 0) {
      const extraHits = Math.max(0, (effect.multiHit ?? 1) - 1);
      // 후속타는 본타에 이미 명중한 연계 — 회피 재판정 없이 적용
      const extra = this._dealDamageToAlly({ rawDamage: damageDealt * extraHits, canBeDodged: false });
      if (extra.damage > 0) logs.push(`${enemy.name ?? enemy.id} follows up for ${extra.damage} damage`);
    }

    if (effect.doubleShot && damageDealt > 0) {
      const extra = this._dealDamageToAlly({ rawDamage: damageDealt, canBeDodged: false });
      logs.push(`${enemy.name ?? enemy.id} fires again for ${extra.damage} damage`);
    }

    if (effect.aoe && damageDealt > 0) {
      for (const id of (gs.companions ?? [])) {
        const st = gs.npcs?.states?.[id];
        if (st && (st.hp ?? 0) > 0) {
          this._dealDamageToAlly({ npcId: id, rawDamage: damageDealt, canBeDodged: false });
        }
      }
    }

    return logs;
  },

  _runEnemyAI(enemy) {
    const gs   = GameState;
    const logs = [];

    // 예고된 스킬이 있으면 이번 턴은 그 발동이다 (이동 회피/블록 카운터 판정 포함)
    if (enemy._telegraph) {
      return this._resolveTelegraphedSkill(enemy);
    }

    for (const skill of (enemy.specialSkills ?? [])) {
      const cd = enemy._skillCooldowns?.[skill.id] ?? 0;
      if (cd > 0) { enemy._skillCooldowns[skill.id]--; continue; }
      if (Math.random() < (BALANCE.combat.enemySpecialSkillChance ?? 0.5)) {
        // 예고형 스킬: 이번 턴은 준비 동작만 — 플레이어에게 대응할 1턴을 준다
        if (skill.telegraph) {
          enemy._telegraph = {
            skillId: skill.id,
            remaining: skill.telegraph.turns ?? 1,
            targetRank: getRank(gs.combat.formations, 'player'),
          };
          logs.push(I18n.t('combatSys.telegraphStart', {
            enemy: I18n.enemyName(enemy.id, enemy.name),
            skill: skill.name ?? skill.id,
          }));
          this._fx({
            kind: 'status',
            target: 'enemy',
            enemyIdx: gs.combat.enemies.indexOf(enemy),
            statusId: 'telegraph',
          });
          return logs;
        }
        logs.push(...this._executeEnemySpecialSkill(enemy, skill));
        return logs;
      }
    }

    // 무리 패턴(spreadAttacks): 전열(1~2랭크) 동료가 있으면 다중 타격을 분산한다 —
    // 전열이 무너져 혼자 남으면 전 타격이 집중되므로 전열 유지가 카운터가 된다
    const rounds = enemy.attacksPerRound ?? 1;
    const spreadTargets = enemy.spreadAttacks && rounds >= 2 ? this._frontlineCompanionIds() : [];
    for (let i = 0; i < rounds; i++) {
      if (spreadTargets.length > 0 && i % 2 === 1) {
        this._enemyAttackCompanion(enemy, spreadTargets[Math.floor((i - 1) / 2) % spreadTargets.length]);
      } else {
        logs.push(this._enemyAttack(enemy));
      }
      if (this._isPlayerDefeated()) break;
    }
    return logs;
  },

  // 적의 강제 이동(넉백/끌기) — 아군 랭크 기준(1=최전방), 양수는 후열로 밀고 음수는 전열로 끈다.
  // 4랭크 벽에 막힌 밀치기는 이동 대신 충돌 고정 피해. 인접 아군이 막은 끌기는 무산된다.
  _forceMoveAlly(combatantId, distance, _enemy) {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat?.formations || !Number.isFinite(distance) || distance === 0) return false;
    const rank = getRank(combat.formations, combatantId);
    if (rank === null) return false;
    const destination = Math.max(1, Math.min(4, rank + distance));
    const label = this._rankedCombatantLabel(combat.combatants?.[combatantId]) ?? combatantId;

    if (destination === rank || !moveCombatant(combat.formations, combatantId, destination)) {
      const wallDmg = BALANCE.combat.position.knockbackWallDamage ?? 0;
      if (distance > 0 && wallDmg > 0) {
        this._dealDamageToAlly({
          npcId: combatantId === 'player' ? null : combatantId,
          rawDamage: wallDmg,
          canBeDodged: false,
        });
        combat.log.push(I18n.t('combatSys.knockbackWall', { target: label, dmg: wallDmg }));
      }
      return false;
    }
    combat.log.push(I18n.t(distance > 0 ? 'combatSys.knockback' : 'combatSys.pulledIn', { target: label }));
    this._fx({ kind: 'rankSwap', targetId: combatantId });
    return true;
  },

  _frontlineCompanionIds() {
    const combat = GameState.combat;
    return Object.values(combat?.combatants ?? {})
      .filter(c => c.side === 'ally' && c.sourceType === 'companion' && c.dead !== true && (c.hp ?? 0) > 0)
      .filter(c => {
        const rank = getRank(combat.formations, c.id);
        return rank !== null && rank <= 2;
      })
      .map(c => c.sourceId ?? c.id);
  },

  _resolveTelegraphedSkill(enemy) {
    const gs = GameState;
    const logs = [];
    const tg = enemy._telegraph;
    const skill = (enemy.specialSkills ?? []).find(s => s.id === tg?.skillId);
    if (!skill) {
      enemy._telegraph = null;
      return logs;
    }
    if (tg.remaining > 1) {
      tg.remaining -= 1;
      logs.push(I18n.t('combatSys.telegraphHold', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        skill: skill.name ?? skill.id,
      }));
      return logs;
    }
    enemy._telegraph = null;
    if (!enemy._skillCooldowns) enemy._skillCooldowns = {};
    const cfg = skill.telegraph ?? {};

    // 예고 시점 위치에서 벗어난 대상은 회피 기회를 얻는다 — 이동이 유효한 카운터
    const currentRank = getRank(gs.combat.formations, 'player');
    if (cfg.moveEvadeChance
        && tg.targetRank !== null
        && currentRank !== tg.targetRank
        && Math.random() < cfg.moveEvadeChance) {
      enemy._skillCooldowns[skill.id] = skill.cooldown;
      logs.push(I18n.t('combatSys.telegraphEvaded', {
        enemy: I18n.enemyName(enemy.id, enemy.name),
        skill: skill.name ?? skill.id,
      }));
      this._fx({ kind: 'enemyAttack', enemyIdx: gs.combat.enemies.indexOf(enemy), miss: true });
      return logs;
    }

    logs.push(...this._executeEnemySpecialSkill(enemy, skill, {
      blockNegatesStun: cfg.blockNegatesStun === true,
    }));
    return logs;
  },

  _executeEnemySpecialSkill(enemy, skill, counters = {}) {
    const gs = GameState;
    const logs = [];
    const [dMin, dMax] = skill.damage;
    let dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));

    // 방어구 효과: 피해 감소 + 방어술 스킬 보너스
    const armor         = StatSystem.getArmorEffects();
    const defSkillBonus = SkillSystem.getBonus('defense', 'damageReduction');
    const totalReduct   = Math.min(BALANCE.armor.specialDmgReductCap, armor.damageReduction + defSkillBonus);
    if (totalReduct > 0) {
      dmg = Math.max(1, Math.floor(dmg * (1 - totalReduct)));
    }
    // critReduction: 스킬의 stunChance도 비례 감소
    const effectiveStunChance = skill.stunChance
      ? skill.stunChance * (1 - armor.critReduction)
      : 0;

    const struck = this._dealDamageToAlly({ rawDamage: dmg });
    if (!enemy._skillCooldowns) enemy._skillCooldowns = {};
    enemy._skillCooldowns[skill.id] = skill.cooldown;
    if (struck.dodged) {
      logs.push(`${I18n.enemyName(enemy.id, enemy.name)}의 ${skill.name ?? '스킬'}을 회피했다!`);
      return logs;
    }
    dmg = struck.damage;
    gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
    EventBus.emit('playerHit', { damage: dmg });
    this._fx({
      kind:     'enemyAttack',
      enemyIdx: gs.combat.enemies.indexOf(enemy),
      fx:       'skill',
      dmg,
      crit:     true,
    });
    DiseaseSystem.checkCombatInjury(dmg, gs);
    BodySystem.onCombatHit(dmg, enemy);
    // 예고를 블록으로 받아냈다면 기절은 통하지 않는다
    const stunNegated = counters.blockNegatesStun === true && struck.blocked === true;
    if (effectiveStunChance > 0 && !stunNegated && Math.random() < effectiveStunChance) {
      if (!gs.combat.playerStatus.some(s => s.id === 'stun')) {
        gs.combat.playerStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: 1, effect: {} });
      }
      logs.push(I18n.t('combatSys.enemySkillStun', { skill: skill.name, enemy: I18n.enemyName(enemy.id, enemy.name), dmg, hp: gs.player.hp.current }));
    } else {
      if (stunNegated) {
        logs.push(I18n.t('combatSys.telegraphBlocked', { skill: skill.name ?? skill.id }));
      }
      logs.push(I18n.t('combatSys.enemySkill', { skill: skill.name, enemy: I18n.enemyName(enemy.id, enemy.name), dmg, hp: gs.player.hp.current }));
    }
    logs.push(...this._applyEnemySkillEffect(enemy, skill, dmg));
    return logs;
  },

  // ── 타이밍 압박 트리거 발동 ─────────────────────────────
  _resolveTimedThreat(enemy) {
    const gs = GameState;
    const T = BALANCE.combat.timedThreats;

    if (enemy.timedThreat?.id === 'self_destruct') {
      const [dMin, dMax] = T.bloater.aoeDamage;
      // 자폭 폭발은 광역 — 회피 불가, 블록/취약 토큰만 적용
      const burst = this._dealDamageToAlly({
        rawDamage: dMin + Math.floor(Math.random() * (dMax - dMin + 1)),
        canBeDodged: false,
      });
      const dmg = burst.damage;
      gs.modStat('infection', T.bloater.infectionCloud);
      gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
      EventBus.emit('playerHit', { damage: dmg });
      for (const id of (gs.companions ?? [])) {
        const st = gs.npcs?.states?.[id];
        if (st && (st.hp ?? 0) > 0) {
          this._dealDamageToAlly({ npcId: id, rawDamage: dmg, canBeDodged: false });
        }
      }
      enemy.currentHp = 0;
      gs.combat.log.push(I18n.t('combatSys.bloaterExplode', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg }));
      this._fx({ kind: 'explode', enemyIdx: gs.combat.enemies.indexOf(enemy), dmg });
      return;
    }

    if (enemy.timedThreat?.id === 'charge_strike') {
      const [dMin, dMax] = T.charger.strikeDamage;
      let dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
      const armor         = StatSystem.getArmorEffects();
      const defSkillBonus = SkillSystem.getBonus('defense', 'damageReduction');
      const totalReduct   = Math.min(BALANCE.armor.damageReductionCap, armor.damageReduction + defSkillBonus);
      if (totalReduct > 0) dmg = Math.max(1, Math.floor(dmg * (1 - totalReduct)));
      const struck = this._dealDamageToAlly({ rawDamage: dmg });
      if (struck.dodged) {
        gs.combat.log.push(I18n.t('combatSys.chargerStrike', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: 0 }) + ' — 회피!');
        return;
      }
      dmg = struck.damage;
      if (!gs.combat.playerStatus.some(s => s.id === 'stun')) {
        gs.combat.playerStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: T.charger.strikeStun, effect: {} });
      }
      gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: true }; // 강타는 연출상 크리티컬 취급(화면 흔들림 트리거)
      EventBus.emit('playerHit', { damage: dmg });
      DiseaseSystem.checkCombatInjury(dmg, gs);
      BodySystem.onCombatHit(dmg, enemy);
      gs.combat.log.push(I18n.t('combatSys.chargerStrike', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg }));
      this._fx({ kind: 'enemyAttack', enemyIdx: gs.combat.enemies.indexOf(enemy), fx: 'shock', dmg, crit: true });
      // 돌진의 운동량이 대상을 후열로 밀쳐낸다 — 근접 스킬이 잠기는 실제 턴 비용
      this._forceMoveAlly('player', 1, enemy);
      return;
    }

    if (enemy.timedThreat?.id === 'summon_horde') {
      const [cMin, cMax] = T.screamer.summonCount;
      const count = cMin + Math.floor(Math.random() * (cMax - cMin + 1));
      let spawned = 0;
      for (let i = 0; i < count; i++) {
        // 소환된 증원은 곧장 전열로 달려든다
        if (!this._spawnEnemyMidCombat(rollEnemy(gs.combat.dangerLevel ?? 3), 'front')) break;
        spawned++;
      }
      NoiseSystem.addNoise(T.screamer.summonNoise);
      if (spawned > 0) {
        gs.combat.log.push(I18n.t('combatSys.screamerSummon', { enemy: I18n.enemyName(enemy.id, enemy.name), count: spawned }));
        this._fx({ kind: 'summon', enemyIdx: gs.combat.enemies.indexOf(enemy), count: spawned });
      }
      return;
    }
  },

  _rankCombatantForEnemy(enemy) {
    const combat = GameState.combat;
    if (!combat?.combatants || !enemy) return null;
    const index = combat.enemies?.indexOf(enemy);
    if (index == null || index < 0) return null;
    return combat.combatants[`enemy:${index}`] ?? null;
  },

  // 아군 피해 단일 초크 포인트 — 적의 모든 공격 경로가 여기를 지나야
  // 회피/블록/취약 토큰과 죽음의 문턱이 진영과 무관하게 일관 동작한다.
  // npcId 없으면 플레이어 대상. 동료는 사망 이벤트 유지를 위해 damageCompanion을 경유한다.
  _dealDamageToAlly({ npcId = null, rawDamage, canBeDodged = true }) {
    const gs = GameState;
    const combat = gs.combat;
    const combatantId = npcId ?? 'player';
    const combatant = combat?.combatants?.[combatantId] ?? null;
    let damage = Math.max(0, Math.floor(rawDamage ?? 0));

    if (combatant && canBeDodged && (combatant.tokens?.dodge ?? 0) > 0) {
      consumeToken(combatant, 'dodge', 1);
      this._pushCombatLog(`${this._rankedCombatantLabel(combatant)}이(가) 공격을 회피했다!`);
      return { dodged: true, damage: 0, dead: false, blocked: false };
    }
    if (combatant) damage = modifyIncomingDamage(damage, combatant);

    if (!npcId) {
      if (combatant) {
        const result = applyDamage(combatant, damage, Math.random);
        gs.player.hp.current = Math.max(0, combatant.hp);
        if (result.deathsDoorEntered) {
          this._pushCombatLog('죽음의 문턱! 다음 일격을 버티지 못하면 쓰러진다.');
          this._fx({ kind: 'status', target: 'player', statusId: 'deaths_door' });
          this._applyStressWithFeedback(combatant, BALANCE.combat.stress.deathsDoorStress);
        } else if (result.deathResistCheck) {
          this._pushCombatLog(result.deathResistSuccess
            ? '죽음의 문턱에서 가까스로 버텨냈다!'
            : '더 이상 버틸 수 없었다…');
        } else if (result.damage >= BALANCE.combat.stress.heavyHitThreshold) {
          this._applyStressWithFeedback(combatant, BALANCE.combat.stress.heavyHitStress);
        }
        return { dodged: false, damage: result.damage, dead: result.dead, blocked: result.blocked === true };
      }
      gs.player.hp.current = Math.max(0, gs.player.hp.current - damage);
      return { dodged: false, damage, dead: gs.player.hp.current <= 0, blocked: false };
    }

    // 동료: block 토큰만 수동 적용 후 damageCompanion 경유(NPC 사망 처리 보존)
    if (combatant && (combatant.tokens?.block ?? 0) > 0) {
      consumeToken(combatant, 'block', 1);
      damage = Math.ceil(damage * BALANCE.combat.tokens.blockDamageMult);
    }
    SystemRegistry.get('NPCSystem')?.damageCompanion?.(npcId, damage);
    if (combatant) {
      const state = gs.npcs?.states?.[npcId];
      combatant.hp = Math.max(0, state?.hp ?? combatant.hp ?? 0);
      combatant.dead = combatant.hp <= 0;
      if (!combatant.dead && damage >= BALANCE.combat.stress.heavyHitThreshold) {
        this._applyStressWithFeedback(combatant, BALANCE.combat.stress.heavyHitStress);
      }
      // 동료가 쓰러지는 것을 목격한 나머지 아군의 동요
      if (combatant.dead) {
        for (const ally of Object.values(combat?.combatants ?? {})) {
          if (ally.side !== 'ally' || ally.dead === true || ally.id === combatant.id) continue;
          this._applyStressWithFeedback(ally, BALANCE.combat.stress.allyDownStress);
        }
      }
    }
    return { dodged: false, damage, dead: combatant?.dead === true };
  },

  _enemyAttack(enemy) {
    const gs = GameState;
    const [dMin, dMax] = enemy.attack.damage;
    let   damage = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const hit    = Math.random() < this._getEnemyAccuracyAgainstPlayer(enemy.attack.accuracy);

    if (hit) {
      // 적 자신의 토큰(hesitation/strength 등) — 랭크 combatant에 기록된 것을 소비
      damage = modifyOutgoingDamage(damage, this._rankCombatantForEnemy(enemy));

      // 방어구 효과 + 방어술 스킬 감소
      const armor         = StatSystem.getArmorEffects();
      const defSkillBonus = SkillSystem.getBonus('defense', 'damageReduction');
      const totalReduct   = Math.min(BALANCE.armor.damageReductionCap, armor.damageReduction + defSkillBonus);
      if (totalReduct > 0) {
        damage = Math.max(1, Math.floor(damage * (1 - totalReduct)));
      }

      // 방어(Guard) 중: 피해 감소
      if (gs.combat.playerGuard?.active) {
        damage = Math.max(1, Math.floor(damage * (1 - gs.combat.playerGuard.damageReduce)));
      }

      // 간호사 동반자: 피해 감소 + 도발
      const npcSysRef = SystemRegistry.get('NPCSystem');
      const nurseActive = (gs.companions ?? []).includes('npc_nurse');
      if (nurseActive) {
        const nurseDef = npcSysRef?.getNpcDef?.('npc_nurse');
        const dmgReduce = nurseDef?.companion?.combatDmgReduce ?? 0;
        if (dmgReduce > 0) {
          damage = Math.max(1, Math.floor(damage * (1 - dmgReduce)));
        }
        const tauntChance = nurseDef?.companion?.tauntChance ?? 0;
        if (tauntChance > 0 && Math.random() < tauntChance) {
          npcSysRef.damageCompanion('npc_nurse', damage);
          this._fx({
            kind: 'enemyAttackCompanion',
            enemyIdx: gs.combat.enemies.indexOf(enemy),
            npcId: 'npc_nurse',
            fx: this._monsterImpactFx(enemy),
            dmg: damage,
          });
          const npcName = I18n.itemName('npc_nurse', GameData?.items?.npc_nurse?.name);
          return I18n.t('npc.hitInstead', { name: npcName, dmg: damage });
        }
      }

      // 도주 실패 시 1.5배 피해 (등을 보인 페널티)
      if (gs.combat._fleeFailed) {
        damage = Math.floor(damage * (BALANCE.combat.fleeFailedDamageMult ?? 1.5));
      }

      // 20% chance to target a companion instead of the player
      const companions = (gs.companions ?? []).filter(id => (gs.npcs?.states?.[id]?.hp ?? 0) > 0);
      if (companions.length > 0 && Math.random() < (BALANCE.combat.companionTargetChance ?? 0.20)) {
        const targetNpcId = companions[Math.floor(Math.random() * companions.length)];
        const redirect = this._dealDamageToAlly({ npcId: targetNpcId, rawDamage: damage });
        if (redirect.dodged) {
          return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
        }
        this._fx({
          kind: 'enemyAttackCompanion',
          enemyIdx: gs.combat.enemies.indexOf(enemy),
          npcId: targetNpcId,
          fx: this._monsterImpactFx(enemy),
          dmg: redirect.damage,
        });
        const npcName = I18n.itemName(targetNpcId, GameData?.items?.[targetNpcId]?.name);
        return I18n.t('npc.hitInstead', { name: npcName, dmg: redirect.damage });
      }

      const struck = this._dealDamageToAlly({ rawDamage: damage });
      if (struck.dodged) {
        this._fx({
          kind:     'enemyAttack',
          enemyIdx: gs.combat.enemies.indexOf(enemy),
          fx:       this._monsterImpactFx(enemy),
          miss:     true,
        });
        return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
      }
      damage = struck.damage;
      gs.combat.lastHit    = { target: 'player', damage, isCrit: false };
      EventBus.emit('playerHit', { damage });
      this._fx({
        kind:     'enemyAttack',
        enemyIdx: gs.combat.enemies.indexOf(enemy),
        fx:       this._monsterImpactFx(enemy),
        dmg:      damage,
      });

      // 전투 부상 체크 (출혈, 열상, 골절, 뇌진탕)
      DiseaseSystem.checkCombatInjury(damage, gs);
      // 신체 부위별 부상 판정
      BodySystem.onCombatHit(damage, enemy);

      // 방어술 XP
      SkillSystem.gainXp('defense', 1);

      // 방어술 마스터리: 15% 확률 반격
      if (SkillSystem.hasMastery('defense') && Math.random() < (BALANCE.combat.masteryCounterChance ?? 0.15)) {
        enemy.currentHp = Math.max(0, enemy.currentHp - (BALANCE.combat.masteryCounterDmg ?? 5));
        gs.combat.log.push(I18n.t('combatSys.defMastery', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      }

      if (enemy.onHitEffect) {
        if (enemy.onHitEffect.infection) gs.modStat('infection', enemy.onHitEffect.infection);
        if (enemy.onHitEffect.radiation) gs.modStat('radiation', enemy.onHitEffect.radiation);
      }
      if (enemy.statusInflict) {
        const inflict = { ...enemy.statusInflict, effect: { ...enemy.statusInflict.effect } };
        // 방치 비용: 축적된 만큼 상태이상 피해가 커진다 (zombie_acid 등)
        if (enemy._inflictEscalation && Number.isFinite(inflict.effect.hpLossPerRound)) {
          inflict.effect.hpLossPerRound += enemy._inflictEscalation;
        }
        const already = gs.combat.playerStatus.find(s => s.id === inflict.id);
        if (already) {
          already.duration = Math.max(already.duration, inflict.duration);
          if (Number.isFinite(inflict.effect.hpLossPerRound)) {
            already.effect.hpLossPerRound = Math.max(
              already.effect.hpLossPerRound ?? 0,
              inflict.effect.hpLossPerRound,
            );
          }
        } else {
          gs.combat.playerStatus.push(inflict);
          this._fx({ kind: 'status', target: 'player', statusId: inflict.id });
        }
      }
      if (enemy.infectionChance && Math.random() < enemy.infectionChance) {
        gs.modStat('infection', 10);
        return I18n.t('combatSys.enemyAtkInfect', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: damage, hp: gs.player.hp.current });
      }
      return I18n.t('combatSys.enemyAtk', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: damage, hp: gs.player.hp.current });
    }
    this._fx({
      kind:     'enemyAttack',
      enemyIdx: gs.combat.enemies.indexOf(enemy),
      fx:       this._monsterImpactFx(enemy),
      miss:     true,
    });
    return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
  },

};
