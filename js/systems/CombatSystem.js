// === COMBAT SYSTEM ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import StateMachine    from '../core/StateMachine.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import NoiseSystem  from './NoiseSystem.js';
import StatSystem   from './StatSystem.js';
import EndingSystem from './EndingSystem.js';
import SkillSystem  from './SkillSystem.js';
import DiseaseSystem from './DiseaseSystem.js';
import BodySystem    from './BodySystem.js';
import { rollEnemyGroup } from '../data/enemies.js';
import BALANCE from '../data/gameBalance.js';
import CharDialogue from '../data/charDialogues.js';
import NightSystem from './NightSystem.js';
import GameData from '../data/GameData.js';
import {
  guardAction, consumeGuard,
  throwableAction,
  applyMultiTarget,
  companionAttack, companionHeal,
  tickCompanionCooldowns, tickEnemyStatusEffects,
} from './CombatActions.js';

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

    // 습격/약탈자 전투 정보 보존
    const encounterLabel = data.isHordeWave
      ? I18n.t('combatSys.hordeWave', { wave: data.hordeWaveNum, count: enemies.length })
      : data.isRaiderAttack
        ? I18n.t('combatSys.raiderAttack', { count: enemies.length })
        : I18n.t('combatSys.combatStart', { count: enemies.length });

    // 캐릭터 전투 시작 대사
    CharDialogue.emit(gs.player.characterId, 'combat_start');

    gs.combat = {
      active:       true,
      enemies,
      targetIndex:  0,
      playerAction: null,
      log:          [encounterLabel],
      outcome:      null,
      rewards:      [],
      nodeId:       data.nodeId ?? null,
      dangerLevel:  dangerLevel,
      round:        0,
      xpGained:     0,
      lastHit:      null,
      playerStatus: [],
      enemyStatus:  [],
      _encounterData: data,
      _isNew:       true,   // 첫 렌더링 진입 애니메이션 트리거용
      _ambushFailed: data.ambushFailed === true,  // 선제 제압 실패 플래그
    };
    EventBus.emit('combatStarted', {});

    // 선제 제압 실패: 첫 번째 플레이어 행동 전에 적이 선제 공격
    if (data.ambushFailed) {
      gs.combat.log.push('⚡ 적이 선제 반응! 첫 행동 전에 공격을 받습니다.');
    }

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

    // 선제 제압 실패: 첫 행동 전 적 선제 공격
    if (gs.combat._ambushFailed) {
      gs.combat._ambushFailed = false;
      if (gs.combat.active) this._allEnemiesAttack();
      if (!gs.combat.active) return; // 즉사 처리
    }

    // 기절 체크 — 이번 턴 행동 불가
    const stunIdx = gs.combat.playerStatus.findIndex(s => s.id === 'stun');
    if (stunIdx !== -1) {
      gs.combat.playerStatus.splice(stunIdx, 1);
      gs.combat.log.push(I18n.t('combatSys.stunned'));
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
      case 'guard':
        guardAction();
        logEntry = I18n.t('combatSys.guardStart');
        break;
      case 'throwable':
        logEntry = throwableAction(weaponInstanceId, this);
        if (!gs.combat.active) return; // smoke bomb fled
        break;
      case 'companionAttack':
        logEntry = companionAttack(this);
        break;
      case 'companionHeal':
        logEntry = companionHeal(this);
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

    // 전투 로그 크기 제한
    if (gs.combat.log.length > BALANCE.combat.combatLogMaxEntries) {
      gs.combat.log.splice(0, gs.combat.log.length - BALANCE.combat.combatLogMaxEntries);
    }

    // 타겟 사망 처리
    if (target.currentHp <= 0) {
      this._onEnemyKilled(target);
      if (this._allEnemiesDead()) {
        this._resolveVictory();
        return;
      }
      this._autoAdvanceTarget();
      gs.combat.log.push(I18n.t('combatSys.nextTarget', { name: I18n.enemyName(this._getTarget()?.id, this._getTarget()?.name) }));
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
    let weaponName = I18n.t('combatSys.unarmed');
    let isCrit = false;
    let skillId = 'unarmed';  // 사용 스킬 (XP 훅용)
    let isRanged = false;

    if (weaponId && gs.cards[weaponId]) {
      const def = gs.getCardDef(weaponId);
      if (def?.combat) {
        const [dMin, dMax] = def.combat.damage;
        const rawDmg = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
        const qualityMult = BALANCE.quality.tiers[gs.cards[weaponId]?._quality]?.mult ?? 1.0;
        damage         = Math.round(rawDmg * qualityMult);
        accuracy       = def.combat.accuracy;
        noise          = def.combat.noiseOnUse;
        durLoss        = def.combat.durabilityLoss ?? 0;
        critChance     = def.combat.critChance     ?? 0;
        critMultiplier = def.combat.critMultiplier ?? 1.5;
        weaponName     = I18n.itemName(def.id, def.name);
        isRanged       = !!(def.combat.requiresAmmo);
        skillId        = isRanged ? 'ranged' : 'melee';

        if (isRanged) {
          // 원거리: 명중률·치명타 스킬 보너스 적용
          accuracy   = Math.min(1, accuracy   + SkillSystem.getBonus('ranged', 'accBonus'));
          critChance = Math.min(1, critChance + SkillSystem.getBonus('ranged', 'critBonus'));

          const ammoInst = gs.getBoardCards().find(c => c.definitionId === def.combat.requiresAmmo);
          if (!ammoInst) {
            EventBus.emit('notify', { message: I18n.t('combatSys.noAmmo'), type: 'warn' });
            damage = 5 + Math.floor(Math.random() * 6);
            accuracy = 0.65; noise = 3; skillId = 'melee';
          } else {
            // 마스터리: 20% 확률 탄약 미소모
            const ammoSave = SkillSystem.hasMastery('ranged') && Math.random() < BALANCE.combat.ammoSaveChance;
            if (!ammoSave) {
              ammoInst.quantity = (ammoInst.quantity ?? 1) - 1;
              if (ammoInst.quantity <= 0) {
                gs.removeCardInstance(ammoInst.instanceId);
                EventBus.emit('cardRemoved', { instanceId: ammoInst.instanceId });
              } else {
                EventBus.emit('boardChanged', {}); // 탄약 수량 변경 UI 동기화
              }
            }
          }
        }

        if (durLoss > 0 && gs.cards[weaponId]) {
          // 근접무기 내구도 절약 (스킬 durSaveChance)
          const durSave = skillId === 'melee'
            ? Math.random() < SkillSystem.getBonus('melee', 'durSaveChance')
            : false;
          if (!durSave) {
            gs.cards[weaponId].durability = Math.max(0, gs.cards[weaponId].durability - durLoss);
            if (gs.cards[weaponId].durability <= 0) {
              EventBus.emit('notify', { message: I18n.t('combatSys.weaponBroken', { name: weaponName }), type: 'warn' });
              gs.removeCardInstance(weaponId);
              EventBus.emit('cardRemoved', { instanceId: weaponId });
            }
          }
        }
      }
    } else {
      // 맨손: BALANCE 기반 데미지 + 스킬 dmgMult 적용
      const unarmedMult = SkillSystem.getBonus('unarmed', 'dmgMult');
      const [uMin, uMax] = BALANCE.combat.unarmedBaseDmg;
      damage = Math.floor((uMin + Math.floor(Math.random() * (uMax - uMin + 1))) * unarmedMult);
    }

    NoiseSystem.addNoise(noise);

    // 사기 구간별 명중률 보정
    const moraleTierAcc = StatSystem.getMoraleTier();
    accuracy = Math.max(0.1, Math.min(1, accuracy + (moraleTierAcc.accBonus ?? 0)));

    // 야간 전투 명중률 패널티
    if (NightSystem.isNight()) {
      const hasLight = gs.getBoardCards().some(c => gs.getCardDef(c.instanceId)?.tags?.includes('light_source') && (c.durability ?? 100) > 0);
      accuracy = Math.max(0.1, accuracy - (hasLight ? BALANCE.combat.nightLitPenalty : BALANCE.combat.nightAccuracyPenalty));
    }
    const hit = Math.random() < accuracy;
    if (hit) {
      const effectiveCritChance = Math.min(1, critChance + (gs.player.critBonus ?? 0));
      if (Math.random() < effectiveCritChance) { isCrit = true; damage = Math.floor(damage * critMultiplier); }

      // 근접/원거리 스킬 dmgMult 적용 (무기 있는 경우)
      if (skillId === 'melee') {
        damage = Math.floor(damage * SkillSystem.getBonus('melee', 'dmgMult'));
      } else if (skillId === 'ranged') {
        // 원거리 dmgMult는 별도 보너스 없음 (명중률·치명타로 대체)
      }

      damage = Math.floor(damage * (gs.player.combatDmgBonus ?? 1.0));
      // NPC 동행 전투 보너스
      const npcCombatMult = SystemRegistry.get('NPCSystem')?.getCompanionCombatBonus?.() ?? 1.0;
      damage = Math.floor(damage * npcCombatMult);
      // 사기 구간별 데미지 배율
      const moraleTier = StatSystem.getMoraleTier();
      damage = Math.floor(damage * (moraleTier.dmgMult ?? 1.0));

      // 약점/저항 배율 + 방어 반격 보너스
      if (weaponId && gs.cards[weaponId]) {
        const wType = gs.getCardDef(weaponId)?.weaponType;
        if (wType && enemy.weaknesses?.includes(wType)) {
          damage = Math.floor(damage * BALANCE.combat.weaponWeaknessMult);
          gs.combat.log.push(I18n.t('combatSys.weakness', { type: wType }));
        } else if (wType && enemy.resistances?.includes(wType)) {
          damage = Math.floor(damage * BALANCE.combat.weaponResistanceMult);
          gs.combat.log.push(I18n.t('combatSys.resistance', { type: wType }));
        }
      }
      if (gs.combat.playerGuard?.active) {
        damage = Math.floor(damage * (1 + gs.combat.playerGuard.counterBonus));
        gs.combat.playerGuard = null;
      }

      const finalDmg = Math.max(1, damage - (enemy.defense ?? 0));
      enemy.currentHp = Math.max(0, enemy.currentHp - finalDmg);

      // 다중 타겟 (창/산탄총)
      if (weaponId && gs.cards[weaponId]) {
        const mDef = gs.getCardDef(weaponId);
        if (mDef?.multiTarget > 1) {
          const extraLogs = applyMultiTarget(finalDmg, mDef, gs.combat.targetIndex, this);
          for (const el of extraLogs) gs.combat.log.push(el);
        }
      }
      gs.combat.lastHit = { target: 'enemy', damage: finalDmg, isCrit, enemyIndex: gs.combat.targetIndex };

      // XP 획득
      SkillSystem.gainXp(skillId, isCrit ? 4 : 2);

      // 맨손 마스터리: 기절 확률 + 추가 데미지
      if (skillId === 'unarmed' && SkillSystem.hasMastery('unarmed')) {
        if (Math.random() < BALANCE.combat.unarmedStunChance && !gs.combat.enemyStatus.some(s => s.id === 'stun')) {
          const stunDmg = BALANCE.combat.unarmedStunDmg;
          enemy.currentHp = Math.max(0, enemy.currentHp - stunDmg);
          gs.combat.enemyStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: 1, effect: {} });
          gs.combat.log.push(I18n.t('combatSys.unarmedMastery', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: stunDmg }));
        }
      }

      const eName = I18n.enemyName(enemy.id, enemy.name);
      if (isCrit) return I18n.t('combatSys.critHit', { weapon: weaponName, enemy: eName, dmg: finalDmg });
      return I18n.t('combatSys.normalHit', { weapon: weaponName, enemy: eName, dmg: finalDmg, hp: enemy.currentHp, maxHp: enemy.maxHp });
    }
    return I18n.t('combatSys.miss', { weapon: weaponName });
  },

  _useItemAction(itemId) {
    const gs = GameState;
    if (!itemId || !gs.cards[itemId]) return I18n.t('combatSys.itemUnavail');
    const def = gs.getCardDef(itemId);
    if (!def?.onConsume) return I18n.t('combatSys.itemNoEffect');

    const { hp, infection, morale } = def.onConsume;
    const msgs = [];
    if (hp) {
      const healMult = gs.player.healBonus ?? 1.0;
      const healed = Math.round(hp * healMult);
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + healed);
      msgs.push(I18n.t('combatSys.hpHeal', { val: healed }));
    }
    if (infection) { gs.modStat('infection', infection); msgs.push(I18n.t('combatSys.infectionChange', { val: `${infection > 0 ? '+' : ''}${infection}` })); }
    if (morale)    { gs.modStat('morale', morale);    msgs.push(I18n.t('combatSys.moraleUp', { val: morale })); }

    const inst = gs.cards[itemId];
    inst.quantity = (inst.quantity ?? 1) - 1;
    if (inst.quantity <= 0) { gs.removeCardInstance(itemId); EventBus.emit('cardRemoved', { instanceId: itemId }); }

    return I18n.t('combatSys.itemUsed', { name: I18n.itemName(def.id, def.name), effects: msgs.join(', ') });
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
      EventBus.emit('combatEnd', { outcome: 'fled' });
      StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
    } else {
      gs.combat.log.push(I18n.t('combatSys.stealthFail'));
      if (gs.combat.active) this._allEnemiesAttack();
    }
  },

  _fleeAction() {
    const gs      = GameState;
    const data    = gs.combat._encounterData ?? {};
    const success = Math.random() < 0.6;
    NoiseSystem.addNoise(10);
    if (success) {
      gs.combat.active  = false;
      gs.combat.outcome = 'fled';
      gs.modStat('fatigue', 10);

      // 좀비 습격 도주: 구조물 내구도 25% 감소 + 사기 패널티
      if (data.isHordeWave) {
        this._applyStructureDamage(BALANCE.hordeWaves.structureDamage);
        gs.modStat('morale', BALANCE.hordeWaves.defeatMorale);
        EventBus.emit('notify', {
          message: I18n.t('combatSys.hordeFleeDmg'),
          type: 'danger',
        });
      }

      EventBus.emit('combatEnd', { outcome: 'fled' });
      StateMachine.transition('combat_result', { outcome: 'fled', nodeId: gs.combat.nodeId });
    } else {
      // 도주 실패: 모든 적이 강화 공격 (1.5배 데미지)
      gs.combat.log.push(I18n.t('combatSys.fleeFail'));
      gs.combat._fleeFailed = true;
      if (gs.combat.active) this._allEnemiesAttack();
      gs.combat._fleeFailed = false;
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

        gs.player.hp.current = Math.max(0, gs.player.hp.current - dmg);
        if (!enemy._skillCooldowns) enemy._skillCooldowns = {};
        enemy._skillCooldowns[skill.id] = skill.cooldown;
        gs.combat.lastHit = { target: 'player', damage: dmg, isCrit: false };
        EventBus.emit('playerHit', { damage: dmg });
        DiseaseSystem.checkCombatInjury(dmg, gs);
        BodySystem.onCombatHit(dmg, enemy);
        if (effectiveStunChance > 0 && Math.random() < effectiveStunChance) {
          if (!gs.combat.playerStatus.some(s => s.id === 'stun')) {
            gs.combat.playerStatus.push({ id: 'stun', name: I18n.t('combatSys.stun'), duration: 1, effect: {} });
          }
          logs.push(I18n.t('combatSys.enemySkillStun', { skill: skill.name, enemy: I18n.enemyName(enemy.id, enemy.name), dmg, hp: gs.player.hp.current }));
        } else {
          logs.push(I18n.t('combatSys.enemySkill', { skill: skill.name, enemy: I18n.enemyName(enemy.id, enemy.name), dmg, hp: gs.player.hp.current }));
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

      // 도주 실패 시 1.5배 피해 (등을 보인 페널티)
      if (gs.combat._fleeFailed) {
        damage = Math.floor(damage * 1.5);
      }

      // 20% chance to target a companion instead of the player
      const companions = gs.companions ?? [];
      if (companions.length > 0 && Math.random() < 0.20) {
        const targetNpcId = companions[Math.floor(Math.random() * companions.length)];
        const npcSys = SystemRegistry.get('NPCSystem');
        if (npcSys) {
          npcSys.damageCompanion(targetNpcId, damage);
          const npcName = I18n.itemName(targetNpcId, GameData?.items?.[targetNpcId]?.name);
          return I18n.t('npc.hitInstead', { name: npcName, dmg: damage });
        }
      }

      gs.player.hp.current = Math.max(0, gs.player.hp.current - damage);
      gs.combat.lastHit    = { target: 'player', damage, isCrit: false };
      EventBus.emit('playerHit', { damage });

      // 전투 부상 체크 (출혈, 열상, 골절, 뇌진탕)
      DiseaseSystem.checkCombatInjury(damage, gs);
      // 신체 부위별 부상 판정
      BodySystem.onCombatHit(damage, enemy);

      // 방어술 XP
      SkillSystem.gainXp('defense', 1);

      // 방어술 마스터리: 15% 확률 반격
      if (SkillSystem.hasMastery('defense') && Math.random() < 0.15) {
        enemy.currentHp = Math.max(0, enemy.currentHp - 5);
        gs.combat.log.push(I18n.t('combatSys.defMastery', { enemy: I18n.enemyName(enemy.id, enemy.name) }));
      }

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
        return I18n.t('combatSys.enemyAtkInfect', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: damage, hp: gs.player.hp.current });
      }
      return I18n.t('combatSys.enemyAtk', { enemy: I18n.enemyName(enemy.id, enemy.name), dmg: damage, hp: gs.player.hp.current });
    }
    return I18n.t('combatSys.enemyDodge', { enemy: I18n.enemyName(enemy.id, enemy.name) });
  },

  // ── 상태이상 틱 ────────────────────────────────────────

  _tickStatusEffects() {
    const gs = GameState;

    gs.combat.playerStatus = gs.combat.playerStatus.filter(s => {
      if (s.effect.hpLossPerRound) {
        gs.player.hp.current = Math.max(0, gs.player.hp.current - s.effect.hpLossPerRound);
        gs.combat.log.push(I18n.t('combatSys.statusTick', { name: s.name, dmg: s.effect.hpLossPerRound, hp: gs.player.hp.current }));
      }
      if (s.effect.infection) gs.modStat('infection', s.effect.infection);
      s.duration--;
      return s.duration > 0;
    });

    // per-enemy 상태이상 틱 (AoE 투척 효과 포함)
    for (const enemy of this.getAliveEnemies()) {
      tickEnemyStatusEffects(enemy, msg => gs.combat.log.push(msg));
    }

    // 레거시 enemyStatus 틱 (단일 타겟용 하위호환)
    const target = this._getTarget();
    if (target) {
      gs.combat.enemyStatus = (gs.combat.enemyStatus ?? []).filter(s => {
        if (s.effect.hpLossPerRound) {
          target.currentHp = Math.max(0, target.currentHp - s.effect.hpLossPerRound);
          gs.combat.log.push(I18n.t('combatSys.statusTickEnemy', { name: s.name, target: I18n.enemyName(target.id, target.name), dmg: s.effect.hpLossPerRound }));
        }
        s.duration--;
        return s.duration > 0;
      });
    }

    // 동행 쿨다운 틱
    tickCompanionCooldowns();

    // 방어 상태 만료
    if (gs.combat.playerGuard?.active) consumeGuard();
  },

  // ── 적 사망 처리 (개별) ────────────────────────────────

  _onEnemyKilled(enemy) {
    const gs  = GameState;
    const xp  = enemy.xp ?? 0;
    gs.player.xp     = (gs.player.xp ?? 0) + xp;
    gs.combat.xpGained += xp;
    gs.combat.log.push(I18n.t('combatSys.kill', { enemy: I18n.enemyName(enemy.id, enemy.name), xp }));

    // 숨겨진 요소 추적: 킬 카운터 갱신
    gs.flags.totalKills = (gs.flags.totalKills ?? 0) + 1;
    // 생태계: 좀비 밀도 감소
    EventBus.emit('enemyKilled', { districtId: gs.location.currentDistrict });

    // 처치 시 사용 무기 스킬 XP
    const weapMain = gs.player.equipped?.weapon_main;
    const weapSub  = gs.player.equipped?.weapon_sub;
    const weapInst = weapMain ? gs.cards[weapMain] : (weapSub ? gs.cards[weapSub] : null);
    const weapDef  = weapInst ? gs.getCardDef(weapInst.instanceId) : null;
    const killSkill = weapDef?.combat?.requiresAmmo ? 'ranged' : (weapDef ? 'melee' : 'unarmed');
    SkillSystem.gainXp(killSkill, 5);

    // 근접 킬/은신 킬 추적
    if (killSkill === 'melee' || killSkill === 'unarmed') {
      gs.flags.meleeKills = (gs.flags.meleeKills ?? 0) + 1;
    }
    if (weapDef?.tags?.includes('silent') && gs.combat.lastHit?.isCrit) {
      gs.flags.stealthKills = (gs.flags.stealthKills ?? 0) + 1;
    }

    for (const lootEntry of (enemy.lootTable ?? [])) {
      if (Math.random() < BALANCE.combat.enemyDropChance) {
        const qty  = lootEntry.minQty + Math.floor(Math.random() * (lootEntry.maxQty - lootEntry.minQty + 1));
        const inst = gs.createCardInstance(lootEntry.definitionId, { quantity: qty });
        if (inst) {
          const placed = gs.placeCardInRow(inst.instanceId, 'middle');
          const actualId = placed?.instanceId ?? inst.instanceId;
          if (gs.cards[actualId] && !gs.combat.rewards.includes(actualId)) {
            gs.combat.rewards.push(actualId);
          }
        }
      }
    }

    // 의사(doctor) 전용: 좀비 처치 시 30% 확률로 의료 아이템 추가 드롭
    const charId = gs.player.characterId ?? '';
    if (charId === 'doctor' && enemy.infectionChance > 0) {
      if (Math.random() < 0.30) {
        const medPool = ['bandage', 'gauze', 'antiseptic'];
        const medId   = medPool[Math.floor(Math.random() * medPool.length)];
        const medInst = gs.createCardInstance(medId, { quantity: 1 });
        if (medInst) {
          const placed = gs.placeCardInRow(medInst.instanceId, 'middle');
          const actualId = placed?.instanceId ?? medInst.instanceId;
          if (gs.cards[actualId] && !gs.combat.rewards.includes(actualId)) {
            gs.combat.rewards.push(actualId);
          }
          gs.combat.log.push(I18n.t('combatSys.doctorBonus'));
        }
      }
    }
  },

  // ── 전투 종료 ──────────────────────────────────────────

  _resolveVictory() {
    const gs   = GameState;
    const data = gs.combat._encounterData ?? {};
    gs.combat.active  = false;
    gs.combat.outcome = 'victory';

    // 좀비 습격 승리: 추가 사기 보너스
    if (data.isHordeWave) {
      const hw = BALANCE.hordeWaves;
      gs.modStat('morale', hw.victoryMorale);
      gs.modStat('fatigue', 15);
      EventBus.emit('notify', {
        message: I18n.t('combatSys.hordeVictory', { wave: data.hordeWaveNum, morale: hw.victoryMorale }),
        type: 'success',
      });
    } else {
      gs.modStat('morale', 10);
      gs.modStat('fatigue', 10);
    }

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
        message: I18n.t('combatSys.respawnWarn', { delay: delayTP }),
        type: 'warn',
      });
    } else {
      gs.combatRespawn.active = false;
    }

    // 캐릭터 전투 승리 대사
    CharDialogue.emit(gs.player.characterId, 'combat_win');
    EventBus.emit('combatEnd', { outcome: 'victory', rewards: gs.combat.rewards });
    StateMachine.transition('combat_result', {
      outcome: 'victory',
      rewards: gs.combat.rewards,
      nodeId:  gs.combat.nodeId,
    });
  },

  _resolveDefeat() {
    const gs   = GameState;
    const data = gs.combat._encounterData ?? {};
    gs.combat.active       = false;
    gs.combat.outcome      = 'defeat';

    // 좀비 습격 패배: 구조물 내구도 25% 감소
    if (data.isHordeWave) {
      this._applyStructureDamage(BALANCE.hordeWaves.structureDamage);
      gs.modStat('morale', BALANCE.hordeWaves.defeatMorale);
    }

    gs.player.isAlive      = false;
    gs.player.deathCause   = I18n.t('combatSys.deathCause');
    EventBus.emit('combatEnd', { outcome: 'defeat' });
    // EndingSystem 경유: death_combat 또는 death_horde 엔딩 결정
    EndingSystem.triggerDeathEnding(I18n.t('combatSys.deathCause'), gs);
  },

  // ── 구조물 피해 (습격 패배/도주) ──────────────────────

  _applyStructureDamage(damagePercent) {
    const gs    = GameState;
    const items = GameData?.items ?? {};
    for (const card of gs.getBoardCards()) {
      const def = items[card.definitionId] ?? gs.getCardDef(card.instanceId);
      if (!def) continue;
      if (def.subtype !== I18n.t('combatSys.structure') && !def.tags?.includes('structure')) continue;
      const inst = gs.cards[card.instanceId];
      if (!inst || (inst.durability ?? 0) <= 0) continue;
      const loss = Math.ceil(inst.durability * (damagePercent / 100));
      inst.durability = Math.max(0, inst.durability - loss);
      if (inst.durability <= 0) {
        EventBus.emit('notify', {
          message: I18n.t('combatSys.structDestroyed', { name: I18n.itemName(def.id, def.name) }),
          type: 'danger',
        });
      }
    }
    EventBus.emit('boardChanged', {});
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

    // 보드 무기 (장착되지 않은 것, 장소/랜드마크 제외)
    for (const card of gs.getBoardCards()) {
      if (seen.has(card.instanceId)) continue;
      const def = gs.getCardDef(card.instanceId);
      if (def?.type === 'weapon') result.push(card);
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
    return GameState.getBoardCards().filter(c => {
      const def = GameState.getCardDef(c.instanceId);
      if (!def || def.type === 'location') return false;
      return def.tags?.includes('medical');
    });
  },

  getAvailableThrowables() {
    return GameState.getBoardCards().filter(c => {
      const def = GameState.getCardDef(c.instanceId);
      if (!def) return false;
      return def.subtype === 'throwable' || def.tags?.includes('throwable');
    });
  },

  // ── 공격 미리보기 (UI 표시용 — 랜덤 없이 범위만 계산) ──────
  previewAttack(weaponId = null) {
    const gs    = GameState;
    const enemy = gs.combat.enemies?.[gs.combat.targetIndex];
    if (!enemy) return { dmgMin: 0, dmgMax: 0, accuracy: 70, critChance: 0, ammoLeft: null };

    let dmgMin = 0, dmgMax = 0, accuracy = 0.70, critChance = 0, ammoLeft = null;

    if (weaponId && gs.cards[weaponId]) {
      const def = gs.getCardDef(weaponId);
      if (def?.combat) {
        const [dMin, dMax] = def.combat.damage;
        const qualMult = BALANCE.quality.tiers[gs.cards[weaponId]?._quality]?.mult ?? 1.0;
        dmgMin     = Math.max(1, Math.round(dMin * qualMult) - (enemy.defense ?? 0));
        dmgMax     = Math.max(1, Math.round(dMax * qualMult) - (enemy.defense ?? 0));
        accuracy   = def.combat.accuracy;
        critChance = def.combat.critChance ?? 0;

        if (def.combat.requiresAmmo) {
          accuracy   = Math.min(1, accuracy + SkillSystem.getBonus('ranged', 'accBonus'));
          critChance = Math.min(1, critChance + SkillSystem.getBonus('ranged', 'critBonus'));
          const ammoInst = gs.getBoardCards().find(c => c.definitionId === def.combat.requiresAmmo);
          ammoLeft = ammoInst ? (ammoInst.quantity ?? 1) : 0;
        }
      }
    } else {
      const [uMin, uMax] = BALANCE.combat.unarmedBaseDmg;
      const mult = SkillSystem.getBonus('unarmed', 'dmgMult');
      dmgMin = Math.max(1, Math.floor(uMin * mult) - (enemy.defense ?? 0));
      dmgMax = Math.max(1, Math.floor(uMax * mult) - (enemy.defense ?? 0));
      accuracy = 0.80;
    }

    if (NightSystem.isNight()) {
      const hasLight = gs.getBoardCards().some(c =>
        gs.getCardDef(c.instanceId)?.tags?.includes('light_source') && (c.durability ?? 100) > 0
      );
      accuracy = Math.max(0.10, accuracy -
        (hasLight ? BALANCE.combat.nightLitPenalty : BALANCE.combat.nightAccuracyPenalty));
    }

    const moraleTier = StatSystem.getMoraleTier();
    accuracy = Math.max(0.10, Math.min(1, accuracy + (moraleTier.accBonus ?? 0)));

    return {
      dmgMin,
      dmgMax,
      accuracy:   Math.round(accuracy * 100),
      critChance: Math.round(Math.min(1, critChance + (gs.player.critBonus ?? 0)) * 100),
      ammoLeft,
    };
  },
};

export default CombatSystem;
