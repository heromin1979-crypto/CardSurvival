// === COMBAT SYSTEM ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import NoiseSystem  from './NoiseSystem.js';
import StatSystem   from './StatSystem.js';
import EndingSystem from './EndingSystem.js';
import { rollEnemyGroup } from '../data/enemies.js';

const CombatSystem = {
  init() {
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'combat') this._setupCombat(data);
    });
  },

  _setupCombat(data) {
    const gs          = GameState;
    const dangerLevel = data.dangerLevel ?? 2;
    const noiseLevel  = gs.noise.level;

    // enemies 배열: 전달받거나 소음 기반으로 새로 생성
    const enemies = data.enemies?.length
      ? data.enemies
      : rollEnemyGroup(dangerLevel, noiseLevel);

    gs.combat = {
      active:       true,
      enemies,
      targetIndex:  0,
      playerAction: null,
      log:          [`전투 시작! (적 ${enemies.length}마리)`],
      outcome:      null,
      rewards:      [],
      nodeId:       data.nodeId ?? null,
      dangerLevel:  dangerLevel,
      round:        0,
      xpGained:     0,
      lastHit:      null,
      playerStatus: [],
      enemyStatus:  [],
    };

    // death_horde 엔딩 조건 추적: 이 전투의 적 수 기록
    gs.flags.lastEnemyCount = enemies.length;
  },

  // ── 타겟 헬퍼 ──────────────────────────────────────────

  _getTarget() {
    const { enemies, targetIndex } = GameState.combat;
    return enemies[targetIndex] ?? null;
  },

  getAliveEnemies() {
    return GameState.combat.enemies.filter(e => e.currentHp > 0);
  },

  _allEnemiesDead() {
    return GameState.combat.enemies.every(e => e.currentHp <= 0);
  },

  // 죽은 타겟 → 다음 살아있는 적으로 자동 전환, 없으면 -1
  _autoAdvanceTarget() {
    const { enemies } = GameState.combat;
    const next = enemies.findIndex(e => e.currentHp > 0);
    GameState.combat.targetIndex = next >= 0 ? next : 0;
    return next;
  },

  // 플레이어가 직접 타겟 변경
  setTarget(index) {
    const { enemies } = GameState.combat;
    if (enemies[index] && enemies[index].currentHp > 0) {
      GameState.combat.targetIndex = index;
    }
  },

  // ── 행동 처리 ──────────────────────────────────────────

  resolveAction(action, weaponInstanceId = null) {
    const gs = GameState;
    if (!gs.combat.active) return;

    const target = this._getTarget();
    if (!target) return;

    gs.combat.round++;
    gs.combat.lastHit = null;

    // 기절 체크 — 이번 턴 행동 불가
    const stunIdx = gs.combat.playerStatus.findIndex(s => s.id === 'stun');
    if (stunIdx !== -1) {
      gs.combat.playerStatus.splice(stunIdx, 1);
      gs.combat.log.push('[기절] 이번 턴 행동 불가!');
      this._tickStatusEffects();
      if (gs.combat.active) this._allEnemiesAttack();
      return;
    }

    let logEntry = '';

    switch (action) {
      case 'melee':
      case 'shoot':
        logEntry = this._attackAction(action, weaponInstanceId, target);
        break;
      case 'stealth':
        logEntry = this._stealthAction();
        return;
      case 'flee':
        logEntry = this._fleeAction();
        return;
      case 'useItem':
        logEntry = this._useItemAction(weaponInstanceId);
        break;
      default:
        return;
    }

    gs.combat.log.push(logEntry);

    // 타겟 사망 처리
    if (target.currentHp <= 0) {
      this._onEnemyKilled(target);
      if (this._allEnemiesDead()) {
        this._resolveVictory();
        return;
      }
      this._autoAdvanceTarget();
      gs.combat.log.push(`[다음 타겟] ${this._getTarget()?.name}`);
    }

    // 상태이상 틱
    this._tickStatusEffects();
    if (this._allEnemiesDead()) { this._resolveVictory(); return; }
    if (gs.player.hp.current <= 0) { this._resolveDefeat(); return; }

    // 살아있는 모든 적 공격
    if (gs.combat.active) this._allEnemiesAttack();
  },

  // ── 개별 행동 ──────────────────────────────────────────

  _attackAction(type, weaponId, enemy) {
    const gs = GameState;
    let damage = 0, accuracy = 0.70, noise = 5, durLoss = 0;
    let critChance = 0, critMultiplier = 1.5;
    let weaponName = '맨손';
    let isCrit = false;

    if (weaponId && gs.cards[weaponId]) {
      const def = gs.getCardDef(weaponId);
      if (def?.combat) {
        const [dMin, dMax] = def.combat.damage;
        damage         = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
        accuracy       = def.combat.accuracy;
        noise          = def.combat.noiseOnUse;
        durLoss        = def.combat.durabilityLoss ?? 0;
        critChance     = def.combat.critChance     ?? 0;
        critMultiplier = def.combat.critMultiplier ?? 1.5;
        weaponName     = def.name;

        if (def.combat.requiresAmmo) {
          const ammoInst = gs.getBoardCards().find(c => c.definitionId === def.combat.requiresAmmo);
          if (!ammoInst) {
            EventBus.emit('notify', { message: '탄약 없음! 근접 공격으로 대체.', type: 'warn' });
            damage = 5 + Math.floor(Math.random() * 6);
            accuracy = 0.65; noise = 3;
          } else {
            ammoInst.quantity = (ammoInst.quantity ?? 1) - 1;
            if (ammoInst.quantity <= 0) {
              gs.removeCardInstance(ammoInst.instanceId);
              EventBus.emit('cardRemoved', { instanceId: ammoInst.instanceId });
            }
          }
        }

        if (durLoss > 0 && gs.cards[weaponId]) {
          gs.cards[weaponId].durability = Math.max(0, gs.cards[weaponId].durability - durLoss);
          if (gs.cards[weaponId].durability <= 0) {
            EventBus.emit('notify', { message: `${weaponName} 파손됨!`, type: 'warn' });
            gs.removeCardInstance(weaponId);
            EventBus.emit('cardRemoved', { instanceId: weaponId });
          }
        }
      }
    } else {
      damage = 3 + Math.floor(Math.random() * 5);
    }

    NoiseSystem.addNoise(noise);

    const hit = Math.random() < accuracy;
    if (hit) {
      const effectiveCritChance = Math.min(1, critChance + (gs.player.critBonus ?? 0));
      if (Math.random() < effectiveCritChance) { isCrit = true; damage = Math.floor(damage * critMultiplier); }
      damage = Math.floor(damage * (gs.player.combatDmgBonus ?? 1.0));
      const finalDmg = Math.max(1, damage - (enemy.defense ?? 0));
      enemy.currentHp = Math.max(0, enemy.currentHp - finalDmg);
      gs.combat.lastHit = { target: 'enemy', damage: finalDmg, isCrit, enemyIndex: gs.combat.targetIndex };
      if (isCrit) return `[크리티컬!] ${weaponName}으로 ${enemy.name}에게 ${finalDmg} 피해!`;
      return `[공격] ${weaponName}으로 ${enemy.name}에게 ${finalDmg} 피해! (HP: ${enemy.currentHp}/${enemy.maxHp})`;
    }
    return `[공격] ${weaponName} 빗나감!`;
  },

  _useItemAction(itemId) {
    const gs = GameState;
    if (!itemId || !gs.cards[itemId]) return '[아이템] 사용 불가.';
    const def = gs.getCardDef(itemId);
    if (!def?.onConsume) return '[아이템] 효과 없음.';

    const { hp, infection, morale } = def.onConsume;
    const msgs = [];
    if (hp) {
      const healMult = gs.player.healBonus ?? 1.0;
      const healed = Math.round(hp * healMult);
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + healed);
      msgs.push(`HP +${healed}`);
    }
    if (infection) { gs.modStat('infection', infection); msgs.push(`감염 ${infection > 0 ? '+' : ''}${infection}`); }
    if (morale)    { gs.modStat('morale', morale);    msgs.push(`사기 +${morale}`); }

    const inst = gs.cards[itemId];
    inst.quantity = (inst.quantity ?? 1) - 1;
    if (inst.quantity <= 0) { gs.removeCardInstance(itemId); EventBus.emit('cardRemoved', { instanceId: itemId }); }

    return `[아이템] ${def.name} 사용. ${msgs.join(', ')}`;
  },

  _stealthAction() {
    const gs      = GameState;
    const alive   = this.getAliveEnemies();
    // 그룹 은신 난이도: 살아있는 적 중 최고값
    const maxDiff = Math.max(...alive.map(e => e.stealthDifficulty ?? 0.5));
    const success = Math.random() > maxDiff;
    if (success) {
      gs.combat.active  = false;
      gs.combat.outcome = 'fled';
      StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
    } else {
      gs.combat.log.push('[은신] 실패! 적이 당신을 발견했다.');
      if (gs.combat.active) this._allEnemiesAttack();
    }
  },

  _fleeAction() {
    const gs      = GameState;
    const success = Math.random() < 0.6;
    NoiseSystem.addNoise(10);
    if (success) {
      gs.combat.active  = false;
      gs.combat.outcome = 'fled';
      gs.modStat('fatigue', 10);
      StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
    } else {
      gs.combat.log.push('[도주] 적이 따라잡았다!');
      if (gs.combat.active) this._allEnemiesAttack();
    }
  },

  // ── 적 행동 ────────────────────────────────────────────

  /** 살아있는 모든 적이 순서대로 플레이어를 공격 */
  _allEnemiesAttack() {
    const gs    = GameState;
    const alive = this.getAliveEnemies();
    for (const enemy of alive) {
      if (!gs.combat.active || gs.player.hp.current <= 0) break;
      const logs = this._runEnemyAI(enemy);
      for (const log of logs) {
        gs.combat.log.push(log);
        if (gs.player.hp.current <= 0) { this._resolveDefeat(); return; }
      }
    }
  },

  _runEnemyAI(enemy) {
    const gs   = GameState;
    const logs = [];

    for (const skill of (enemy.specialSkills ?? [])) {
      const cd = enemy._skillCooldowns?.[skill.id] ?? 0;
      if (cd > 0) { enemy._skillCooldowns[skill.id]--; continue; }
      if (Math.random() < 0.5) {
        const [dMin, dMax] = skill.damage;
        let dmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));

        // 방어구 효과: 피해 감소 + 크리티컬(스킬) 감소
        const armor = StatSystem.getArmorEffects();
        if (armor.damageReduction > 0) {
          dmg = Math.max(1, Math.floor(dmg * (1 - armor.damageReduction)));
        }
        // critReduction: 스킬의 stunChance도 비례 감소
        const effectiveStunChance = skill.stunChance
          ? skill.stunChance * (1 - armor.critReduction)
          : 0;

        gs.player.hp.current = Math.max(0, gs.player.hp.current - dmg);
        if (!enemy._skillCooldowns) enemy._skillCooldowns = {};
        enemy._skillCooldowns[skill.id] = skill.cooldown;
        gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
        if (effectiveStunChance > 0 && Math.random() < effectiveStunChance) {
          if (!gs.combat.playerStatus.some(s => s.id === 'stun')) {
            gs.combat.playerStatus.push({ id: 'stun', name: '기절', duration: 1, effect: {} });
          }
          logs.push(`[${skill.name}] ${enemy.name}의 강타! ${dmg} 피해 + 기절! (내 HP: ${gs.player.hp.current})`);
        } else {
          logs.push(`[${skill.name}] ${enemy.name}의 강타! ${dmg} 피해! (내 HP: ${gs.player.hp.current})`);
        }
        return logs;
      }
    }

    const rounds = enemy.attacksPerRound ?? 1;
    for (let i = 0; i < rounds; i++) {
      logs.push(this._enemyAttack(enemy));
      if (gs.player.hp.current <= 0) break;
    }
    return logs;
  },

  _enemyAttack(enemy) {
    const gs = GameState;
    const [dMin, dMax] = enemy.attack.damage;
    let   damage = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const hit    = Math.random() < enemy.attack.accuracy;

    if (hit) {
      // 방어구 효과 적용
      const armor = StatSystem.getArmorEffects();
      if (armor.damageReduction > 0) {
        damage = Math.max(1, Math.floor(damage * (1 - armor.damageReduction)));
      }

      gs.player.hp.current = Math.max(0, gs.player.hp.current - damage);
      gs.combat.lastHit    = { target: 'player', damage, isCrit: false };

      if (enemy.onHitEffect) {
        if (enemy.onHitEffect.infection) gs.modStat('infection', enemy.onHitEffect.infection);
        if (enemy.onHitEffect.radiation) gs.modStat('radiation', enemy.onHitEffect.radiation);
      }
      if (enemy.statusInflict) {
        const already = gs.combat.playerStatus.find(s => s.id === enemy.statusInflict.id);
        if (already) {
          already.duration = Math.max(already.duration, enemy.statusInflict.duration);
        } else {
          gs.combat.playerStatus.push({ ...enemy.statusInflict, effect: { ...enemy.statusInflict.effect } });
        }
      }
      if (enemy.infectionChance && Math.random() < enemy.infectionChance) {
        gs.modStat('infection', 10);
        return `[적 공격] ${enemy.name}이 ${damage} 피해! 감염! (내 HP: ${gs.player.hp.current})`;
      }
      return `[적 공격] ${enemy.name}이 ${damage} 피해! (내 HP: ${gs.player.hp.current})`;
    }
    return `[적 공격] ${enemy.name}의 공격 회피!`;
  },

  // ── 상태이상 틱 ────────────────────────────────────────

  _tickStatusEffects() {
    const gs     = GameState;
    const target = this._getTarget();

    gs.combat.playerStatus = gs.combat.playerStatus.filter(s => {
      if (s.effect.hpLossPerRound) {
        gs.player.hp.current = Math.max(0, gs.player.hp.current - s.effect.hpLossPerRound);
        gs.combat.log.push(`[${s.name}] ${s.effect.hpLossPerRound} 피해! (HP: ${gs.player.hp.current})`);
      }
      if (s.effect.infection) gs.modStat('infection', s.effect.infection);
      s.duration--;
      return s.duration > 0;
    });

    if (target) {
      gs.combat.enemyStatus = gs.combat.enemyStatus.filter(s => {
        if (s.effect.hpLossPerRound) {
          target.currentHp = Math.max(0, target.currentHp - s.effect.hpLossPerRound);
          gs.combat.log.push(`[${s.name}] ${target.name}에게 ${s.effect.hpLossPerRound} 피해!`);
        }
        s.duration--;
        return s.duration > 0;
      });
    }
  },

  // ── 적 사망 처리 (개별) ────────────────────────────────

  _onEnemyKilled(enemy) {
    const gs  = GameState;
    const xp  = enemy.xp ?? 0;
    gs.player.xp     = (gs.player.xp ?? 0) + xp;
    gs.combat.xpGained += xp;
    gs.combat.log.push(`[처치] ${enemy.name} 처치! +${xp} XP`);

    for (const lootEntry of (enemy.lootTable ?? [])) {
      if (Math.random() < 0.6) {
        const qty  = lootEntry.minQty + Math.floor(Math.random() * (lootEntry.maxQty - lootEntry.minQty + 1));
        const inst = gs.createCardInstance(lootEntry.definitionId, { quantity: qty });
        if (inst) { gs.placeCardInRow(inst.instanceId, 'middle'); gs.combat.rewards.push(inst.instanceId); }
      }
    }
  },

  // ── 전투 종료 ──────────────────────────────────────────

  _resolveVictory() {
    const gs = GameState;
    gs.combat.active  = false;
    gs.combat.outcome = 'victory';
    gs.modStat('morale', 10);
    gs.modStat('fatigue', 10);

    // ── 전투 소음 재조우 타이머 ──────────────────────────
    const noise  = gs.noise.level;
    const nodeId = gs.combat.nodeId;
    if (noise >= 35 && nodeId) {
      const delayTP = noise >= 65 ? 3 : noise >= 50 ? 4 : 5;
      gs.combatRespawn.active      = true;
      gs.combatRespawn.tpRemaining = delayTP;
      gs.combatRespawn.nodeId      = nodeId;
      gs.combatRespawn.dangerLevel = gs.combat.dangerLevel;
      EventBus.emit('notify', {
        message: `⚠ 전투 소음으로 몬스터가 접근 중! ${delayTP}턴 후 재조우`,
        type: 'warn',
      });
    } else {
      gs.combatRespawn.active = false;
    }

    EventBus.emit('combatEnd', { outcome: 'victory', rewards: gs.combat.rewards });
    StateMachine.transition('combat_result', {
      outcome: 'victory',
      rewards: gs.combat.rewards,
      nodeId:  gs.combat.nodeId,
    });
  },

  _resolveDefeat() {
    const gs = GameState;
    gs.combat.active       = false;
    gs.combat.outcome      = 'defeat';
    gs.player.isAlive      = false;
    gs.player.deathCause   = '부상 과다';
    EventBus.emit('combatEnd', { outcome: 'defeat' });
    // EndingSystem 경유: death_combat 또는 death_horde 엔딩 결정
    EndingSystem.triggerDeathEnding('부상 과다', gs);
  },

  // ── 유틸 ──────────────────────────────────────────────

  getAvailableWeapons() {
    const gs     = GameState;
    const result = [];
    const seen   = new Set();

    // 장착 무기 우선 (weapon_main → weapon_sub)
    for (const slot of ['weapon_main', 'weapon_sub']) {
      const id = gs.player.equipped?.[slot];
      if (id && gs.cards[id]) {
        const def = gs.getCardDef(id);
        if (def?.combat) { result.push(gs.cards[id]); seen.add(id); }
      }
    }

    // 보드 무기 (장착되지 않은 것)
    for (const card of gs.getBoardCards()) {
      if (seen.has(card.instanceId)) continue;
      if (gs.getCardDef(card.instanceId)?.type === 'weapon') result.push(card);
    }

    return result;
  },

  _getPlayerWeapon() {
    const gs = GameState;
    for (const slot of ['weapon_main', 'weapon_sub']) {
      const id = gs.player.equipped?.[slot];
      if (id && gs.cards[id]) {
        const def = gs.getCardDef(id);
        if (def?.combat) return { instanceId: id, def };
      }
    }
    for (const card of gs.getBoardCards()) {
      const def = gs.getCardDef(card.instanceId);
      if (def?.combat) return { instanceId: card.instanceId, def };
    }
    return null;
  },

  getAvailableMedicals() {
    return GameState.getBoardCards().filter(c => GameState.getCardDef(c.instanceId)?.tags?.includes('medical'));
  },
};

export default CombatSystem;
