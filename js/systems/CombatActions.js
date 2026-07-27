// === COMBAT ACTIONS (가드·투척·다중타겟·동행 액션) ===
// CombatSystem.js의 800라인 제한 유지를 위해 분리된 액션 로직

import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n       from '../core/I18n.js';
import StateMachine from '../core/StateMachine.js';
import NoiseSystem from './NoiseSystem.js';
import BALANCE    from '../data/gameBalance.js';
import { getCharacterCombatEffects } from '../data/characters.js';
import { createActionFx } from './combat/CombatMotionFx.js';

// ── 방어(Guard) 행동 ────────────────────────────────────────────

export function guardAction() {
  const gs = GameState;
  const effects = getCharacterCombatEffects(gs.player?.characterId);
  gs.combat.playerGuard = {
    active:       true,
    damageReduce: Math.min(0.85, BALANCE.combat.guardDamageReduction + (effects.guardDamageReduceBonus ?? 0)),
    counterBonus: BALANCE.combat.guardCounterBonus + (effects.guardCounterBonus ?? 0),
    duration:     BALANCE.combat.guardDuration,
  };
}

// 방어 상태 소비 (적 공격 처리 후 호출)
export function consumeGuard() {
  const gs = GameState;
  if (!gs.combat.playerGuard?.active) return;
  gs.combat.playerGuard.duration--;
  if (gs.combat.playerGuard.duration <= 0) {
    gs.combat.playerGuard = null;
  }
}

// ── 투척 무기(Throwable) 광역 행동 ─────────────────────────────

export function throwableAction(itemId, combatSystemRef) {
  const gs = GameState;
  if (!itemId || !gs.cards[itemId]) return I18n.t('combatSys.itemUnavail');

  const def = gs.getCardDef(itemId);
  if (!def?.throwableEffect) return I18n.t('combatSys.itemNoEffect');

  const effect = def.throwableEffect;
  const alive  = combatSystemRef.getAliveEnemies();
  const msgs   = [];

  // 투척 소음
  const noise = def.combat?.noiseOnUse ?? 30;
  NoiseSystem.addNoise(noise);

  // 아이템 소비
  const inst = gs.cards[itemId];
  inst.quantity = (inst.quantity ?? 1) - 1;
  if (inst.quantity <= 0) {
    gs.removeCardInstance(itemId);
    EventBus.emit('cardRemoved', { instanceId: itemId });
  }

  switch (effect.type) {
    case 'guaranteed_flee':
      return _guaranteedFlee(msgs);

    case 'aoe_fire':
      return _applyAoE(alive, {
        baseDmg:   def.combat?.damage ?? [20, 35],
        statusId:  'burn',
        statusName: '화상',
        duration:  effect.burnDuration ?? 2,
        dmgPerRound: effect.burnDmgPerRound ?? 5,
        label:     I18n.t('combatSys.throwFire'),
        fxType:    'fire',
      }, msgs, combatSystemRef);

    case 'aoe_bleed':
      return _applyAoE(alive, {
        baseDmg:   def.combat?.damage ?? [25, 40],
        statusId:  'bleed',
        statusName: '출혈',
        duration:  effect.bleedDuration ?? 2,
        dmgPerRound: effect.bleedDmgPerRound ?? 4,
        label:     I18n.t('combatSys.throwBlast'),
        fxType:    'blast',
      }, msgs, combatSystemRef);

    default:
      return I18n.t('combatSys.throwGeneric', { name: I18n.itemName(def.id, def.name) });
  }
}

function _applyAoE(alive, { baseDmg, statusId, statusName, duration, dmgPerRound, label, fxType }, msgs, combatSystemRef = null) {
  const gs  = GameState;
  const [dMin, dMax] = baseDmg;

  for (const enemy of alive) {
    const rolledDamage = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    let dmg = rolledDamage;
    if (typeof combatSystemRef?._resolveDirectEnemyDamage === 'function') {
      dmg = combatSystemRef._resolveDirectEnemyDamage(enemy, rolledDamage).damage;
    } else {
      const hpBefore = enemy.currentHp;
      enemy.currentHp = Math.max(0, enemy.currentHp - rolledDamage);
      dmg = hpBefore - enemy.currentHp;
    }
    const targetIndex = gs.combat.enemies.indexOf(enemy);
    const actor = gs.combat.combatants?.player ?? {
      id: 'player',
      side: 'ally',
      sourceType: 'player',
    };
    const target = gs.combat.combatants?.[`enemy:${targetIndex}`] ?? {
      id: `enemy:${targetIndex}`,
      side: 'enemy',
      sourceType: 'enemy',
      enemyIndex: targetIndex,
    };
    combatSystemRef?._fx?.(createActionFx({
      actor,
      actorIndex: 0,
      target,
      targetIndex,
      actionId: `throwable_${statusId}`,
      motionKey: 'ranged',
      impactFx: fxType ?? 'blast',
      damage: dmg,
      killed: enemy.currentHp <= 0,
    }));

    // 상태이상 부여 (per-enemy _statusEffects)
    if (typeof combatSystemRef?._applyEnemyStatusInflict === 'function') {
      combatSystemRef._applyEnemyStatusInflict(enemy, {
        id: statusId,
        name: statusName,
        sourceEnemyId: 'player',
        remainingRounds: duration,
        effect: { hpLossPerRound: dmgPerRound },
      }, gs.combat.enemies.indexOf(enemy));
    } else {
      if (!enemy._statusEffects) enemy._statusEffects = [];
      const existing = enemy._statusEffects.find(status => status.id === statusId);
      if (existing) {
        existing.duration = Math.max(existing.duration ?? 0, duration);
        existing.effect = {
          ...(existing.effect ?? {}),
          hpLossPerRound: Math.max(
            existing.effect?.hpLossPerRound ?? 0,
            dmgPerRound,
          ),
        };
      } else {
        enemy._statusEffects.push({
          id: statusId, name: statusName, duration,
          effect: { hpLossPerRound: dmgPerRound },
        });
      }
    }
    msgs.push(I18n.t('combatSys.throwAoeHit', {
      label,
      enemy: I18n.enemyName(enemy.id, enemy.name),
      dmg,
      status: statusName,
    }));
  }

  return msgs.join(' / ');
}

function _guaranteedFlee(msgs) {
  const gs = GameState;
  NoiseSystem.addNoise(BALANCE.combat.fleeNoise);
  gs.combat.active  = false;
  gs.combat.outcome = 'fled';
  gs.modStat('fatigue', BALANCE.combat.fleeFatigue);
  EventBus.emit('combatEnd', { outcome: 'fled' });
  StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
  return I18n.t('combatSys.smokeFlee');
}

// ── 다중 타겟 공격 ──────────────────────────────────────────────

/**
 * multiTarget 무기로 최대 count명의 닿는 적에게 피해 부여
 * 추가 타겟에는 50% 데미지 적용 (관통 어택 패널티)
 * 근접 관통(창)은 전열까지만, 원거리 관통(산탄총)은 후열도 휩쓴다.
 */
export function applyMultiTarget(
  primaryDamage,
  weaponDef,
  targetIndex,
  combatSystemRef,
  rangedForAction = null,
) {
  const gs      = GameState;
  const isRanged = typeof rangedForAction === 'boolean'
    ? rangedForAction
    : combatSystemRef.weaponReachIsRanged(weaponDef);
  const alive   = combatSystemRef.getReachableEnemies(isRanged);
  const count   = weaponDef.multiTarget ?? 1;
  if (count <= 1 || alive.length <= 1) return [];

  const extraLogs = [];
  const extras = alive.filter((_, i) => gs.combat.enemies.indexOf(_) !== targetIndex).slice(0, count - 1);

  for (const extra of extras) {
    const rolledSplash = Math.max(1, Math.floor(primaryDamage * 0.5));
    let splash = rolledSplash;
    if (typeof combatSystemRef?._resolveDirectEnemyDamage === 'function') {
      splash = combatSystemRef._resolveDirectEnemyDamage(extra, rolledSplash).damage;
    } else {
      const hpBefore = extra.currentHp;
      extra.currentHp = Math.max(0, extra.currentHp - rolledSplash);
      splash = hpBefore - extra.currentHp;
    }
    const extraIndex = gs.combat.enemies.indexOf(extra);
    const actor = gs.combat.combatants?.player ?? {
      id: 'player',
      side: 'ally',
      sourceType: 'player',
    };
    const target = gs.combat.combatants?.[`enemy:${extraIndex}`] ?? {
      id: `enemy:${extraIndex}`,
      side: 'enemy',
      sourceType: 'enemy',
      enemyIndex: extraIndex,
    };
    combatSystemRef._fx?.(createActionFx({
      actor,
      actorIndex: 0,
      target,
      targetIndex: extraIndex,
      actionId: isRanged ? 'shoot' : 'melee',
      motionKey: isRanged ? 'ranged' : 'melee',
      impactFx: isRanged ? 'shot' : 'slash',
      damage: splash,
      killed: extra.currentHp <= 0,
    }));
    extraLogs.push(I18n.t('combatSys.multiTargetHit', {
      enemy: I18n.enemyName(extra.id, extra.name),
      dmg: splash,
    }));
  }
  return extraLogs;
}

// ── 적 per-enemy 상태이상 틱 ────────────────────────────────────

export function tickEnemyStatusEffects(
  enemy,
  logFn,
  resolveDamage = null,
  { phase = 'all' } = {},
) {
  if (!enemy._statusEffects?.length) return;
  const statusesAtTickStart = [...enemy._statusEffects];

  if (phase !== 'duration') {
    for (const s of statusesAtTickStart) {
      if (!(enemy._statusEffects ?? []).includes(s)) continue;
      if (s._skipNextRoundTick === true) continue;
      if (s.effect?.hpLossPerRound) {
        const rawDamage = s.effect.hpLossPerRound;
        const result = typeof resolveDamage === 'function'
          ? resolveDamage(enemy, rawDamage)
          : (() => {
              const hpBefore = enemy.currentHp;
              enemy.currentHp = Math.max(0, enemy.currentHp - rawDamage);
              return { damage: hpBefore - enemy.currentHp };
            })();
        logFn(I18n.t('combatSys.statusTickEnemy', {
          name:   s.name,
          target: I18n.enemyName(enemy.id, enemy.name),
          dmg:    result?.damage ?? 0,
        }));
      }
    }
  }

  if (phase === 'damage') return;

  const expired = new Set();
  for (const s of statusesAtTickStart) {
    if (!(enemy._statusEffects ?? []).includes(s)) continue;
    if (s._skipNextRoundTick === true) {
      delete s._skipNextRoundTick;
      continue;
    }
    if (Number.isFinite(s.remainingRounds)) {
      s.remainingRounds--;
      if (Number.isFinite(s.duration)) s.duration = s.remainingRounds;
      if (s.remainingRounds <= 0) expired.add(s);
    } else if (Number.isFinite(s.duration)) {
      s.duration--;
      if (s.duration <= 0) expired.add(s);
    }
  }
  const activeStatuses = enemy._statusEffects ?? [];
  for (let index = activeStatuses.length - 1; index >= 0; index--) {
    if (expired.has(activeStatuses[index])) activeStatuses.splice(index, 1);
  }
}
