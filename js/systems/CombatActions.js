// === COMBAT ACTIONS (가드·투척·다중타겟·동행 액션) ===
// CombatSystem.js의 800라인 제한 유지를 위해 분리된 액션 로직

import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import I18n       from '../core/I18n.js';
import StateMachine from '../core/StateMachine.js';
import NoiseSystem from './NoiseSystem.js';
import BALANCE    from '../data/gameBalance.js';
import GameData from '../data/GameData.js';

// ── 방어(Guard) 행동 ────────────────────────────────────────────

export function guardAction() {
  const gs = GameState;
  gs.combat.playerGuard = {
    active:       true,
    damageReduce: BALANCE.combat.guardDamageReduction,
    counterBonus: BALANCE.combat.guardCounterBonus,
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
      }, msgs);

    case 'aoe_bleed':
      return _applyAoE(alive, {
        baseDmg:   def.combat?.damage ?? [25, 40],
        statusId:  'bleed',
        statusName: '출혈',
        duration:  effect.bleedDuration ?? 2,
        dmgPerRound: effect.bleedDmgPerRound ?? 4,
        label:     I18n.t('combatSys.throwBlast'),
      }, msgs);

    default:
      return I18n.t('combatSys.throwGeneric', { name: I18n.itemName(def.id, def.name) });
  }
}

function _applyAoE(alive, { baseDmg, statusId, statusName, duration, dmgPerRound, label }, msgs) {
  const gs  = GameState;
  const [dMin, dMax] = baseDmg;

  for (const enemy of alive) {
    const dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    enemy.currentHp = Math.max(0, enemy.currentHp - dmg);

    // 상태이상 부여 (per-enemy _statusEffects)
    if (!enemy._statusEffects) enemy._statusEffects = [];
    const existing = enemy._statusEffects.find(s => s.id === statusId);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
    } else {
      enemy._statusEffects.push({
        id: statusId, name: statusName, duration,
        effect: { hpLossPerRound: dmgPerRound },
      });
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
 * multiTarget 무기로 최대 count명의 살아있는 적에게 피해 부여
 * 추가 타겟에는 50% 데미지 적용 (관통 어택 패널티)
 */
export function applyMultiTarget(primaryDamage, weaponDef, targetIndex, combatSystemRef) {
  const gs    = GameState;
  const alive = combatSystemRef.getAliveEnemies();
  const count = weaponDef.multiTarget ?? 1;
  if (count <= 1 || alive.length <= 1) return [];

  const extraLogs = [];
  const extras = alive.filter((_, i) => gs.combat.enemies.indexOf(_) !== targetIndex).slice(0, count - 1);

  for (const extra of extras) {
    const splash = Math.max(1, Math.floor(primaryDamage * 0.5));
    extra.currentHp = Math.max(0, extra.currentHp - splash);
    extraLogs.push(I18n.t('combatSys.multiTargetHit', {
      enemy: I18n.enemyName(extra.id, extra.name),
      dmg: splash,
    }));
  }
  return extraLogs;
}

// ── NPC 동행 전투 명령 ──────────────────────────────────────────

export function companionAttack(combatSystemRef) {
  const gs      = GameState;
  const npcSys  = SystemRegistry.get('NPCSystem');
  if (!npcSys) return I18n.t('combatSys.noCompanion');

  const companions = gs.companions ?? [];
  if (companions.length === 0) return I18n.t('combatSys.noCompanion');

  // 쿨다운 체크
  const cooldownKey = '_companionAttackCooldown';
  if ((gs.combat[cooldownKey] ?? 0) > 0) {
    return I18n.t('combatSys.companionCooldown', { turns: gs.combat[cooldownKey] });
  }

  const target  = combatSystemRef._getTarget();
  if (!target) return I18n.t('combatSys.noTarget');

  const logs = [];
  for (const npcId of companions) {
    const bonus = npcSys.getCompanionCombatBonus?.() ?? 1.0;
    const dmg   = Math.floor((8 + Math.floor(Math.random() * 10)) * bonus);
    target.currentHp = Math.max(0, target.currentHp - dmg);
    const npcName = I18n.itemName(npcId, GameData?.items?.[npcId]?.name ?? npcId);
    logs.push(I18n.t('combatSys.companionAtk', { name: npcName, enemy: I18n.enemyName(target.id, target.name), dmg }));
  }

  gs.combat[cooldownKey] = BALANCE.combat.companionAttackCooldown;
  return logs.join(' ');
}

export function companionHeal(combatSystemRef) {
  const gs      = GameState;
  const npcSys  = SystemRegistry.get('NPCSystem');
  if (!npcSys) return I18n.t('combatSys.noCompanion');

  const companions = gs.companions ?? [];
  if (companions.length === 0) return I18n.t('combatSys.noCompanion');

  const cooldownKey = '_companionHealCooldown';
  if ((gs.combat[cooldownKey] ?? 0) > 0) {
    return I18n.t('combatSys.companionHealCooldown', { turns: gs.combat[cooldownKey] });
  }

  const healed = 10 + Math.floor(Math.random() * 8);
  gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + healed);
  gs.combat[cooldownKey] = BALANCE.combat.companionHealCooldown;

  const npcId   = companions[0];
  const npcName = I18n.itemName(npcId, GameData?.items?.[npcId]?.name ?? npcId);
  return I18n.t('combatSys.companionHeal', { name: npcName, val: healed });
}

// ── 쿨다운 틱 (매 라운드 호출) ──────────────────────────────────

export function tickCompanionCooldowns() {
  const gs  = GameState;
  if ((gs.combat._companionAttackCooldown ?? 0) > 0) gs.combat._companionAttackCooldown--;
  if ((gs.combat._companionHealCooldown  ?? 0) > 0) gs.combat._companionHealCooldown--;
}

// ── 적 per-enemy 상태이상 틱 ────────────────────────────────────

export function tickEnemyStatusEffects(enemy, logFn) {
  if (!enemy._statusEffects?.length) return;
  enemy._statusEffects = enemy._statusEffects.filter(s => {
    if (s.effect?.hpLossPerRound) {
      enemy.currentHp = Math.max(0, enemy.currentHp - s.effect.hpLossPerRound);
      logFn(I18n.t('combatSys.statusTickEnemy', {
        name:   s.name,
        target: I18n.enemyName(enemy.id, enemy.name),
        dmg:    s.effect.hpLossPerRound,
      }));
    }
    s.duration--;
    return s.duration > 0;
  });
}
