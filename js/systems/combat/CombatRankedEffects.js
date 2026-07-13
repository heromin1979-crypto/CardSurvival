// CombatSystem 믹스인 — 랭크 스킬 파이프라인 (코스트/명중·치명 프로필/효과 적용/아이템).
// 메서드는 CombatSystem 객체에 스프레드되어 this=CombatSystem으로 실행된다.
import EventBus       from '../../core/EventBus.js';
import GameState      from '../../core/GameState.js';
import I18n           from '../../core/I18n.js';
import SystemRegistry from '../../core/SystemRegistry.js';
import NoiseSystem    from '../NoiseSystem.js';
import StatSystem     from '../StatSystem.js';
import SkillSystem    from '../SkillSystem.js';
import NightSystem    from '../NightSystem.js';
import BALANCE        from '../../data/gameBalance.js';
import { addStress, addToken, applyDamage, healCombatant } from './CombatStatusSystem.js';
import {
  composeAccuracy,
  modifyIncomingDamage,
  modifyOutgoingDamage,
  resolveHitRoll,
  rollCrit,
  weaponAffinityMult,
} from './CombatResolution.js';
import { getRank, moveCombatant } from './FormationSystem.js';

export const CombatRankedEffects = {
  _consumeRankedCosts(actor, skill) {
    const gs = GameState;
    const stamina = skill?.costs?.stamina ?? 0;
    if (stamina > 0 && actor?.sourceType === 'player' && gs.stats?.stamina) {
      gs.stats.stamina.current = Math.max(0, (gs.stats.stamina.current ?? 0) - stamina);
    }

    const noise = skill?.costs?.noise ?? 0;
    if (noise > 0) NoiseSystem.addNoise(noise);

    const ammoId = skill?.costs?.ammo;
    if (typeof ammoId === 'string' && ammoId.length > 0) {
      const ammoInst = gs.getBoardCards().find(c => c.definitionId === ammoId);
      if (!ammoInst) return { ok: false, reason: 'insufficient_ammo' };
      // 원거리 마스터리: 확률적으로 탄약 미소모 (레거시 _attackAction과 동일 규칙)
      const ammoSave = actor?.sourceType === 'player'
        && SkillSystem.hasMastery('ranged')
        && Math.random() < BALANCE.combat.ammoSaveChance;
      if (!ammoSave) {
        ammoInst.quantity = (ammoInst.quantity ?? 1) - 1;
        if (ammoInst.quantity <= 0) {
          gs.removeCardInstance(ammoInst.instanceId);
          EventBus.emit('cardRemoved', { instanceId: ammoInst.instanceId });
        } else {
          EventBus.emit('boardChanged', {});
        }
      }
    }

    const durLoss = skill?.costs?.durability ?? 0;
    const weaponInstanceId = skill?.equipmentInstanceId;
    if (durLoss > 0 && weaponInstanceId && gs.cards?.[weaponInstanceId]) {
      const isMeleeEquipment = !ammoId;
      const durSave = actor?.sourceType === 'player'
        && isMeleeEquipment
        && Math.random() < SkillSystem.getBonus('melee', 'durSaveChance');
      if (!durSave) {
        const inst = gs.cards[weaponInstanceId];
        inst.durability = Math.max(0, (inst.durability ?? 0) - durLoss);
        if (inst.durability <= 0) {
          const def = gs.getCardDef(weaponInstanceId);
          EventBus.emit('notify', {
            message: I18n.t('combatSys.weaponBroken', { name: I18n.itemName(def?.id, def?.name) }),
            type: 'warn',
          });
          gs.removeCardInstance(weaponInstanceId);
          EventBus.emit('cardRemoved', { instanceId: weaponInstanceId });
        }
      }
    }

    return { ok: true };
  },

  _rollRange(range, random = Math.random) {
    const [min, max] = Array.isArray(range) && range.length === 2 ? range : [0, 0];
    const roll = typeof random === 'function' ? random : Math.random;
    return min + Math.floor(roll() * (max - min + 1));
  },

  // 스트레스 증감 + 임계(각오/붕괴) 피드백 로그·연출의 단일 창구
  _applyStressWithFeedback(target, amount, random = Math.random) {
    if (!target || !Number.isFinite(amount) || amount === 0) return null;
    const result = addStress(target, amount, random);
    if (result.resolved) {
      this._pushCombatLog(`${this._rankedCombatantLabel(target)}이(가) 극한에서 각오를 다진다! (strength 획득)`);
      this._fx({ kind: 'status', targetId: target.id, statusId: 'resolve' });
    } else if (result.meltdown) {
      this._pushCombatLog(`${this._rankedCombatantLabel(target)}이(가) 스트레스로 무너진다… (vulnerable 노출)`);
      this._fx({ kind: 'status', targetId: target.id, statusId: 'panic' });
    }
    return result;
  },

  _rankedSkillWeaponDef(skill) {
    const instanceId = skill?.equipmentInstanceId;
    if (!instanceId || !GameState.cards?.[instanceId]) return null;
    return GameState.getCardDef(instanceId);
  },

  _legacyEnemyFor(combatant) {
    if (combatant?.sourceType !== 'enemy') return null;
    return GameState.combat?.enemies?.[combatant.enemyIndex] ?? null;
  },

  // 스킬의 최종 명중/치명 프로필 — 판정(_resolveRankedHit)과 UI 프리뷰가 공유하는 단일 계산기
  _rankedAimProfile(actor, skill) {
    const gs = GameState;
    const weaponDef = this._rankedSkillWeaponDef(skill);
    const isFirearm = !!weaponDef?.combat?.requiresAmmo;
    let accuracy = Number.isFinite(skill?.accuracy) ? skill.accuracy : 0.7;
    let critChance = Number.isFinite(skill?.critChance) ? skill.critChance : 0;
    let critMultiplier = skill?.critMultiplier;

    // 위치 시너지: 후열(3~4랭크)에서 원거리 스킬은 안정된 사선 보너스
    if (this._isRangedRankedSkill(skill)) {
      const actorRank = getRank(gs.combat?.formations, actor?.id);
      if (actorRank !== null && actorRank >= 3) {
        accuracy = composeAccuracy(accuracy, {
          backline: BALANCE.combat.position.backlineRangedAccBonus,
        });
      }
    }

    if (actor?.sourceType === 'player') {
      const modifiers = {
        morale: StatSystem.getMoraleTier().accBonus ?? 0,
      };
      if (NightSystem.isNight()) {
        const hasLight = gs.getBoardCards().some(c =>
          gs.getCardDef(c.instanceId)?.tags?.includes('light_source') && (c.durability ?? 100) > 0);
        modifiers.night = -(hasLight
          ? BALANCE.combat.nightLitPenalty
          : BALANCE.combat.nightAccuracyPenalty);
      }
      if (isFirearm) {
        modifiers.rangedSkill = SkillSystem.getBonus('ranged', 'accBonus');
        critChance = Math.min(1, critChance + SkillSystem.getBonus('ranged', 'critBonus'));
      }
      accuracy = composeAccuracy(accuracy, modifiers);
      ({ accuracy, critChance } = this._applyCharacterAimIdentity({
        accuracy,
        critChance,
        weaponDef,
        skillId: isFirearm ? 'ranged' : null,
      }));
      critChance = Math.min(1, critChance + (gs.player.critBonus ?? 0));
    }

    return { accuracy, critChance, critMultiplier, weaponDef };
  },

  // UI 표시용 스킬 프리뷰 (굴림 없음) — 명중/치명/피해 범위
  previewRankedSkill(skillId) {
    const combat = GameState.combat;
    const active = combat?.combatants?.[combat.activeCombatantId];
    const skill = combat?.skillsById?.[skillId];
    if (!active || !skill) return null;

    const damageEffect = (skill.effects ?? []).find(effect => effect?.type === 'damage');
    const dmg = Array.isArray(damageEffect?.value) ? damageEffect.value : null;

    if (skill.target?.side === 'ally') {
      return { accuracy: 100, critChance: 0, dmgMin: dmg?.[0] ?? 0, dmgMax: dmg?.[1] ?? 0, supportive: true };
    }

    const profile = this._rankedAimProfile(active, skill);
    return {
      accuracy: Math.round(profile.accuracy * 100),
      critChance: Math.round(Math.min(1, profile.critChance) * 100),
      dmgMin: dmg?.[0] ?? 0,
      dmgMax: dmg?.[1] ?? 0,
      supportive: false,
    };
  },

  // 랭크 스킬 명중/치명타 판정 — 레거시 _attackAction의 보정 체계를 단일 파이프라인으로 통합
  _resolveRankedHit(actor, target, skill, random = Math.random) {
    // 아군 대상 스킬(힐/버프/이동)은 판정 없이 성공 — 회피/명중 토큰을 소모하지 않는다
    if (actor?.side && target?.side && actor.side === target.side) {
      return { hit: true, dodged: false, crit: false, skill };
    }

    let { accuracy, critChance, critMultiplier, weaponDef } = this._rankedAimProfile(actor, skill);

    // 레거시 보스 회피 버프(phantom_sniper 등)는 명중률 배율로 유지
    const legacyEnemy = this._legacyEnemyFor(target);
    const evasion = legacyEnemy?._combatBuffs?.evasion;
    if (evasion && (evasion.duration ?? 0) > 0) {
      accuracy = Math.max(0.05, accuracy * (1 - (evasion.value ?? 0)));
    }

    const hitRoll = resolveHitRoll({ attacker: actor, defender: target, accuracy, random });
    if (!hitRoll.hit) {
      return { hit: false, dodged: hitRoll.dodged, crit: false, skill, weaponDef };
    }

    const dealsDamage = (skill?.effects ?? []).some(effect => effect?.type === 'damage');
    const critRoll = dealsDamage
      ? rollCrit({ attacker: actor, critChance, critMultiplier, random })
      : { crit: false, multiplier: critMultiplier };

    return {
      hit: true,
      dodged: false,
      crit: critRoll.crit,
      critMultiplier: critRoll.multiplier,
      skill,
      weaponDef,
    };
  },

  _applyRankedEffect(effect, actor, target, random = Math.random, hitInfo = null) {
    switch (effect?.type) {
      case 'damage':
        return this._applyRankedDamageEffect(effect, actor, target, random, hitInfo);
      case 'heal': {
        const healResult = healCombatant(target, this._rollRange(effect.value, random));
        this._syncRankedTargetToLegacy(target);
        if (healResult.healed > 0) {
          if (target.sourceType === 'companion') {
            this._fx({ kind: 'companionHeal', npcId: target.sourceId, amount: healResult.healed });
          } else {
            this._fx({ kind: 'useItem', fx: 'heal', label: `+${healResult.healed}` });
          }
        }
        if (healResult.deathsDoorCleared) {
          this._pushCombatLog(`${this._rankedCombatantLabel(target)}이(가) 죽음의 문턱에서 벗어났다.`);
        }
        return { ok: true };
      }
      case 'token':
        addToken(target, effect.token, effect.stacks ?? 1);
        return { ok: true };
      case 'status': {
        const status = effect.status;
        if (status?.chance != null && random() >= status.chance) return { ok: true };
        if (!Array.isArray(target.statusEffects)) target.statusEffects = [];
        target.statusEffects.push({ ...status });
        this._fx({ kind: 'status', targetId: target.id, statusId: status?.id ?? status?.name ?? 'effect' });
        return { ok: true };
      }
      case 'move': {
        const rank = getRank(GameState.combat?.formations, target.id);
        return {
          ok: moveCombatant(
            GameState.combat?.formations,
            target.id,
            Math.max(1, Math.min(4, (rank ?? 1) + (effect.distance ?? 0))),
          ),
        };
      }
      case 'stress':
        this._applyStressWithFeedback(target, effect.value ?? 0, random);
        return { ok: true };
      case 'guard':
        addToken(target, 'block', 1);
        this._fx({ kind: 'guard', targetId: target.id });
        return { ok: true };
      case 'flee':
        if (random() < (effect.chance ?? 0)) {
          this._syncRankedCombatants();
          this._stabilizePlayerAfterCombat();
          GameState.combat.active = false;
          GameState.combat.outcome = 'fled';
        }
        return { ok: true };
      default:
        return { ok: false, reason: 'invalid_effect' };
    }
  },

  // 랭크 피해 파이프라인: 치명타 → 공격측 배율(플레이어 스위트+토큰) → 약점/저항 → 방어 → 피격측 토큰 → 적용
  _applyRankedDamageEffect(effect, actor, target, random = Math.random, hitInfo = null) {
    const gs = GameState;
    const skill = hitInfo?.skill ?? null;
    const weaponDef = hitInfo?.weaponDef ?? this._rankedSkillWeaponDef(skill);

    let damage = this._rollRange(effect.value, random);

    if (hitInfo?.crit) {
      damage = Math.floor(damage * (hitInfo.critMultiplier ?? BALANCE.combat.defaultCritMultiplier ?? 1.5));
    }

    if (actor?.sourceType === 'player') {
      damage = this._applyPlayerDamageSuite(damage, skill, weaponDef);
    }

    // 위치 시너지: 최전방(1랭크) 근접 공격은 체중이 실린다
    if (this._isMeleeRankedSkill(skill)
        && getRank(GameState.combat?.formations, actor?.id) === 1) {
      damage = Math.floor(damage * BALANCE.combat.position.frontlineMeleeDamageMult);
    }

    damage = modifyOutgoingDamage(damage, actor);

    const legacyEnemy = this._legacyEnemyFor(target);
    if (legacyEnemy) {
      const affinity = weaponAffinityMult(weaponDef?.weaponType, legacyEnemy);
      if (affinity > 1) {
        damage = Math.floor(damage * affinity);
        this._pushCombatLog(I18n.t('combatSys.weakness', { type: weaponDef.weaponType }));
      } else if (affinity < 1) {
        damage = Math.floor(damage * affinity);
        this._pushCombatLog(I18n.t('combatSys.resistance', { type: weaponDef.weaponType }));
      }
      damage = this._applyEnemyDefense(damage, legacyEnemy.defense);
      if ((legacyEnemy._combatBuffs?.invulnerable?.duration ?? 0) > 0) damage = 0;
    }

    damage = modifyIncomingDamage(damage, target);

    // 사망 후처리(_onEnemyKilled)가 참조할 처치 무기 정보 — 적용 전에 기록
    if (legacyEnemy) {
      gs.combat._lastKillContext = {
        weaponType: weaponDef?.weaponType ?? 'unarmed',
        isSilent:   !!weaponDef?.tags?.includes('silent'),
        isMelee:    !weaponDef?.combat?.requiresAmmo,
      };
    }

    const result = applyDamage(target, damage, random);
    this._syncRankedTargetToLegacy(target);

    if (legacyEnemy) {
      if (hitInfo?.crit && legacyEnemy.type === 'human' && legacyEnemy.currentMorale != null) {
        legacyEnemy.currentMorale = Math.max(
          0,
          legacyEnemy.currentMorale - BALANCE.combat.moraleBreak.critMoraleDmg,
        );
      }
      if (actor?.sourceType === 'player') {
        if (legacyEnemy.currentHp > 0) this._applyCharacterOnHitIdentity(legacyEnemy, weaponDef);
        SkillSystem.gainXp(this._rankedXpSkillId(skill, weaponDef), hitInfo?.crit ? 4 : 2);
      }
      gs.combat.lastHit = {
        target: 'enemy',
        damage: result.damage,
        isCrit: hitInfo?.crit === true,
        enemyIndex: target.enemyIndex,
      };
      this._fx({
        kind: actor?.sourceType === 'companion' ? 'companionAttack' : 'playerAttack',
        npcId: actor?.sourceType === 'companion' ? actor.sourceId : undefined,
        fx: weaponDef ? this._weaponFx(weaponDef) : (skill?.icon === 'shot' ? 'shot' : 'slash'),
        targetIdx: target.enemyIndex,
        dmg: result.damage,
        crit: hitInfo?.crit === true,
        killed: target.dead === true,
      });
    }

    if (result.deathsDoorEntered) {
      this._pushCombatLog(`${this._rankedCombatantLabel(target)}이(가) 죽음의 문턱에 몰렸다!`);
      this._fx({ kind: 'status', targetId: target.id, statusId: 'deaths_door' });
    }

    return { ok: true };
  },

  // 원거리 스킬 판별: 1랭크에서 못 쓰는 스킬(원거리는 usableFrom [2,3,4] 계약)
  _isRangedRankedSkill(skill) {
    return Array.isArray(skill?.usableFrom)
      && skill.usableFrom.length > 0
      && !skill.usableFrom.includes(1)
      && (skill.effects ?? []).some(effect => effect?.type === 'damage');
  },

  _isMeleeRankedSkill(skill) {
    return Array.isArray(skill?.usableFrom)
      && skill.usableFrom.includes(1)
      && skill?.target?.side === 'enemy'
      && (skill.effects ?? []).some(effect => effect?.type === 'damage');
  },

  // 정액 방어 차감 + 관통 바닥: 방어가 피해를 원피해의 일정 비율 아래로 깎지 못한다
  _applyEnemyDefense(damage, defense) {
    const floor = Math.max(1, Math.ceil(damage * (BALANCE.combat.defenseFloorRatio ?? 0)));
    return Math.max(floor, damage - (defense ?? 0));
  },

  _rankedXpSkillId(skill, weaponDef) {
    if (skill?.source === 'equipment') {
      return weaponDef?.combat?.requiresAmmo ? 'ranged' : 'melee';
    }
    return skill?.id === 'basic_strike' ? 'unarmed' : 'melee';
  },

  // 레거시 _attackAction의 플레이어 데미지 배율 스위트 이식 (품질/스킬/전역 보너스/아이덴티티/동행/사기)
  _applyPlayerDamageSuite(damage, skill, weaponDef) {
    const gs = GameState;
    const instanceId = skill?.equipmentInstanceId ?? null;

    if (instanceId && gs.cards?.[instanceId]) {
      const qualityMult = BALANCE.quality.tiers[gs.cards[instanceId]?._quality]?.mult ?? 1.0;
      damage = Math.round(damage * qualityMult);
      if (!weaponDef?.combat?.requiresAmmo) {
        damage = Math.floor(damage * SkillSystem.getBonus('melee', 'dmgMult'));
      }
    } else if (skill?.id === 'basic_strike') {
      damage = Math.floor(damage * SkillSystem.getBonus('unarmed', 'dmgMult'));
    }

    damage = Math.floor(damage * (gs.player.combatDmgBonus ?? 1.0));
    damage = this._applyCharacterDamageIdentity(damage, instanceId, weaponDef);
    if (gs.player.knifeDmgBonus && weaponDef
        && (weaponDef.tags?.includes('blade') || weaponDef.tags?.includes('knife') || weaponDef.subtype === 'knife')) {
      damage = Math.floor(damage * gs.player.knifeDmgBonus);
    }
    const npcCombatMult = SystemRegistry.get('NPCSystem')?.getCompanionCombatBonus?.() ?? 1.0;
    damage = Math.floor(damage * npcCombatMult);
    damage = Math.floor(damage * (StatSystem.getMoraleTier().dmgMult ?? 1.0));

    return damage;
  },

  _consumeRankedCombatItem(actor, itemInstanceId) {
    const gs = GameState;
    if (!actor || typeof itemInstanceId !== 'string' || !gs.cards?.[itemInstanceId]) {
      return { ok: false, reason: 'item_unavailable' };
    }

    const def = gs.getCardDef(itemInstanceId);
    if (!def?.onConsume) {
      return { ok: false, reason: 'item_no_effect' };
    }

    const { hp, infection, morale } = def.onConsume;
    const effects = [];

    if (hp) {
      const healMult = actor.sourceType === 'player'
        ? this._getMedicalHealMultiplier(def)
        : 1.0;
      const healed = Math.round(hp * healMult);
      const healResult = healCombatant(actor, healed);
      this._syncRankedTargetToLegacy(actor);
      effects.push({ type: 'heal', amount: healResult.healed });
      this._pushCombatLog(I18n.t('combatSys.hpHeal', { val: healResult.healed }));
      if (healResult.deathsDoorCleared) {
        this._pushCombatLog(`${this._rankedCombatantLabel(actor)}이(가) 죽음의 문턱에서 벗어났다.`);
      }
      this._fx({ kind: 'useItem', fx: 'heal', label: `+${healResult.healed}` });
    }
    if (infection) {
      gs.modStat('infection', infection);
      effects.push({ type: 'infection', amount: infection });
    }
    if (morale) {
      gs.modStat('morale', morale);
      effects.push({ type: 'morale', amount: morale });
    }
    if (!hp) this._fx({ kind: 'useItem', fx: 'buff', label: 'ITEM' });

    const inst = gs.cards[itemInstanceId];
    inst.quantity = (inst.quantity ?? 1) - 1;
    if (inst.quantity <= 0) {
      gs.removeCardInstance(itemInstanceId);
      EventBus.emit('cardRemoved', { instanceId: itemInstanceId });
    } else {
      EventBus.emit('boardChanged', {});
    }
    this._markMedicalIdentityUse(def);

    return { ok: true, effects };
  },

};
