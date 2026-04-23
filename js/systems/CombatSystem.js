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
import NPCSystem     from './NPCSystem.js';
import { rollEnemyGroup } from '../data/enemies.js';
import { NPC_ITEMS } from '../data/npcs.js';
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
      if (to === 'combat') {
        try {
          this._setupCombat(data);
        } catch (err) {
          console.error('[CombatSystem] _setupCombat 실패:', err);
          console.error('[CombatSystem] data:', data);
          // 최소한의 combat 객체 생성 — render 에러 방지
          GameState.combat = {
            active: true, enemies: data?.enemies ?? [], targetIndex: 0,
            playerAction: null, log: ['⚠️ 전투 초기화 오류: ' + (err?.message ?? err)],
            outcome: null, rewards: [], nodeId: data?.nodeId ?? null,
            dangerLevel: data?.dangerLevel ?? 2, round: 0, xpGained: 0,
            lastHit: null, playerStatus: [], enemyStatus: [],
            _encounterData: data ?? {}, _isNew: true, _ambushFailed: false,
          };
          EventBus.emit('combatStarted', {});
        }
      }
    });
  },

  _setupCombat(data) {
    const gs          = GameState;
    const dangerLevel = data.dangerLevel ?? 2;
    const noiseLevel  = gs.noise?.level ?? 0;

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
      // Phase 1: 턴 큐 필드
      turnQueue:    [],
      activeIdx:    0,
      roundNumber:  1,
      _encounterData: data,
      _isNew:       true,   // 첫 렌더링 진입 애니메이션 트리거용
      _ambushFailed: data.ambushFailed === true,  // 선제 제압 실패 플래그
    };
    // 전투 시작 시 큐 구성 (player → 살아있는 companions → enemies)
    const companions = (GameState.companions ?? []).filter(id => {
      const st = GameState.npcs?.states?.[id];
      return st?.isCompanion && (st.hp ?? 0) > 0;
    });
    gs.combat.turnQueue = this._buildTurnQueue(gs.combat, companions);
    gs.combat.activeIdx = 0;   // 항상 플레이어부터

    // Phase 3 — 전투 시작 시 모든 적의 초기 의도 결정 (Into the Breach 방식 가시성)
    for (const e of gs.combat.enemies) {
      e._nextIntent = this._decideNextIntent(e, gs.combat, gs);
    }

    EventBus.emit('combatStarted', {});

    // 선제 제압 실패: 첫 번째 플레이어 행동 전에 적이 선제 공격
    if (data.ambushFailed) {
      gs.combat.log.push('⚡ 적이 선제 반응! 첫 행동 전에 공격을 받습니다.');
    }

    // death_horde 엔딩 조건 추적: 이 전투의 적 수 기록
    gs.flags.lastEnemyCount = enemies.length;
  },

  // ── Combat Overhaul Phase 1 · 턴 큐 ─────────────────────
  // 큐 구조: [{type:'player'|'companion'|'enemy', id?, enemyIdx?, order}]
  // activeIdx: 큐 내 현재 턴 위치
  // roundNumber: 큐 한 바퀴 = 1 라운드 (랩어라운드 시 증가)

  _buildTurnQueue(combat, companions = []) {
    const queue = [];
    let order = 0;
    queue.push({ type: 'player', order: order++ });
    for (const id of companions) {
      queue.push({ type: 'companion', id, order: order++ });
    }
    const enemies = combat.enemies ?? [];
    for (let i = 0; i < enemies.length; i++) {
      queue.push({ type: 'enemy', enemyIdx: i, order: order++ });
    }
    return queue;
  },

  _currentEntry(combat) {
    const q = combat?.turnQueue;
    if (!q || q.length === 0) return null;
    return q[combat.activeIdx] ?? null;
  },

  _isEntryAlive(entry, combat, npcStates) {
    if (!entry) return false;
    if (entry.type === 'player') {
      return (GameState.player?.hp?.current ?? 0) > 0;
    }
    if (entry.type === 'enemy') {
      const e = combat?.enemies?.[entry.enemyIdx];
      return !!e && (e.currentHp ?? 0) > 0;
    }
    if (entry.type === 'companion') {
      const st = npcStates?.[entry.id];
      return !!st && (st.hp ?? 0) > 0;
    }
    return false;
  },

  _advanceTurn(combat, npcStates) {
    const q = combat?.turnQueue;
    if (!q || q.length === 0) return;
    const n = q.length;
    const startIdx = combat.activeIdx;
    for (let step = 1; step <= n; step++) {
      const next = (startIdx + step) % n;
      if (next === 0 || (next < startIdx)) {
        // 큐 한 바퀴 돌았음을 감지 (첫 번째 랩어라운드 시점만 roundNumber 증가)
        if (next <= startIdx) combat.roundNumber = (combat.roundNumber ?? 1) + 1;
      }
      combat.activeIdx = next;
      const entry = q[next];
      if (this._isEntryAlive(entry, combat, npcStates)) return;
    }
    // 모두 죽어 한 바퀴 돌아도 못 찾음 — activeIdx는 startIdx로 복귀해 무한루프 방지
    combat.activeIdx = startIdx;
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
      // 기계공 자작 무기 보너스 (+15%)
      if (gs.player.characterId === 'engineer' && weaponId && gs.cards[weaponId]?._crafted) {
        damage = Math.floor(damage * 1.15);
      }
      // 셰프 나이프/칼 무기 보너스
      if (gs.player.knifeDmgBonus && weaponId) {
        const wDef = gs.getCardDef(weaponId);
        if (wDef?.tags?.includes('blade') || wDef?.tags?.includes('knife') || wDef?.subtype === 'knife') {
          damage = Math.floor(damage * gs.player.knifeDmgBonus);
        }
      }
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
    const fleeBonus = gs.player.fleeBonus ?? 0;
    const success = Math.random() < (BALANCE.combat.fleeChance + fleeBonus);
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
      // 보라매병원 습격 도주 — 패배로 간주, HospitalSiegeSystem이 후처리
      if (data.isSiege) {
        EventBus.emit('siegeResolved', {
          outcome:       'defeat',
          casualties:    0,
          defenseRating: 0,
          threat:        0,
          siegeId:       data.siegeId ?? null,
        });
      }
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

  /**
   * Phase 1 호환 엔트리포인트. 과거 "모든 적 일괄 공격" 의미론을
   * 턴 큐 기반 `_processAiTurns`로 위임한다. 외부 call site 변경 없음.
   */
  _allEnemiesAttack() {
    this._processAiTurns();
  },

  /**
   * Phase 1: 턴 큐 순서대로 AI 엔티티(동료/적) 턴을 플레이어 차례 전까지 실행.
   *   - activeIdx를 advance → entry type 분기 → 실행 → 승/패 판정 루프
   *   - 동료 턴은 Phase 1에서 stub (Phase 2에서 stance 기반 자율 행동 구현)
   *   - 최대 iter 제한(큐 길이×2)으로 무한루프 방지
   */
  _processAiTurns() {
    const gs = GameState;
    const combat = gs.combat;
    if (!combat?.active || !combat.turnQueue?.length) return;

    const npcStates = gs.npcs?.states ?? {};
    const maxIter = combat.turnQueue.length * 2 + 2;
    let iter = 0;

    while (combat.active && iter++ < maxIter) {
      this._advanceTurn(combat, npcStates);
      const entry = this._currentEntry(combat);
      if (!entry) return;
      if (entry.type === 'player') return;   // 플레이어 차례로 복귀

      if (entry.type === 'companion') {
        this._runCompanionTurn(entry.id);
      } else if (entry.type === 'enemy') {
        this._runSingleEnemyTurn(entry.enemyIdx);
        if (gs.player.hp.current <= 0) { this._resolveDefeat(); return; }
      }

      if (this._allEnemiesDead()) { this._resolveVictory(); return; }
    }
  },

  // ── Combat Overhaul Phase 2 · 동료 자율 행동 ──────
  // stance: 'attack'(기본) | 'heal' | 'support' | 'hold' | 'manual'
  // state 위치: GameState.npcs.states[npcId].stance
  // 'manual'은 자동 행동 skip — 기존 companionAttack/Heal 명령 플로우 유지

  _getCompanionStance(npcId) {
    const st = GameState.npcs?.states?.[npcId];
    return st?.stance ?? 'attack';
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

  // 가장 낮은 HP의 살아있는 적 공격
  _companionAutoAttack(npcId) {
    const gs = GameState;
    const enemies = gs.combat?.enemies ?? [];
    const alive = enemies
      .map((e, idx) => ({ e, idx }))
      .filter(x => (x.e?.currentHp ?? 0) > 0);
    if (alive.length === 0) return;
    alive.sort((a, b) => (a.e.currentHp ?? 0) - (b.e.currentHp ?? 0));
    const target = alive[0].e;

    const cfg = BALANCE.combat.companionAuto;
    const [dMin, dMax] = cfg.attackDamage;
    const npcSys = SystemRegistry.get('NPCSystem');
    const bonus  = npcSys?.getCompanionCombatBonus?.() ?? 1.0;

    if (Math.random() > cfg.attackAccuracy) {
      gs.combat.log.push(I18n.t
        ? I18n.t('combatSys.companionAtkMiss', { name: this._npcLabel(npcId) })
        : `${this._npcLabel(npcId)} 공격 빗나감`);
      return;
    }

    const raw = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const dmg = Math.floor(raw * bonus);
    target.currentHp = Math.max(0, (target.currentHp ?? 0) - dmg);

    gs.combat.log.push(I18n.t
      ? I18n.t('combatSys.companionAtk', { name: this._npcLabel(npcId), enemy: I18n.enemyName?.(target.id, target.name) ?? target.name, dmg })
      : `${this._npcLabel(npcId)}→${target.name}: ${dmg} 피해`);
    EventBus.emit('companionAction', { npcId, action: 'attack', targetIdx: alive[0].idx, damage: dmg });
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

  _decideNextIntent(enemy, combat, gs) {
    if (!enemy || (enemy.currentHp ?? 0) <= 0) return null;
    const targets = this._getEligibleTargets(combat, gs);
    const pattern = enemy.aiPattern ?? 'normal';
    const target = this._pickTargetByPattern(pattern, targets, enemy);
    if (!target) return null;

    // 스킬 사용 가능 여부 (쿨다운 0인 특수 스킬)
    const readySkill = (enemy.specialSkills ?? []).find(s =>
      (enemy._skillCooldowns?.[s.id] ?? 0) === 0
    );
    const willUseSkill = !!readySkill;

    const iconEmoji = willUseSkill ? '💢' : '🗡';
    const tgtName = target.type === 'player' ? '플레이어' : this._npcLabel(target.id);
    const label = willUseSkill
      ? `${tgtName}에 ${readySkill.name ?? '스킬'} 사용`
      : `${tgtName} 공격`;

    return {
      action: willUseSkill ? 'skill' : 'attack',
      targetType: target.type,
      targetId: target.id ?? null,
      skillId: willUseSkill ? readySkill.id : null,
      iconEmoji,
      label,
      pattern,
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

    const intent = enemy._nextIntent;
    if (intent?.targetType === 'companion' && intent.targetId) {
      this._enemyAttackCompanion(enemy, intent.targetId);
    } else {
      // 기본 플레이어 타겟 (기존 로직 유지)
      const logs = this._runEnemyAI(enemy);
      for (const log of logs) {
        gs.combat.log.push(log);
        if (gs.player.hp.current <= 0) return;
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

    const [dMin, dMax] = enemy.attack?.damage ?? [3, 6];
    let damage = dMin + Math.floor(Math.random() * (dMax - dMin + 1));
    const hit = Math.random() < (enemy.attack?.accuracy ?? 0.7);
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

    npcSys.damageCompanion(npcId, damage);
    gs.combat.log.push(`${enemy.name ?? '적'} → ${this._npcLabel(npcId)}: ${damage} 피해`);
    gs.combat.lastHit = { target: 'companion', damage, npcId, isCrit: false };
    EventBus.emit('enemyAttackCompanion', { enemyId: enemy.id, npcId, damage });
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
          const npcName = I18n.itemName('npc_nurse', GameData?.items?.npc_nurse?.name);
          return I18n.t('npc.hitInstead', { name: npcName, dmg: damage });
        }
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
    // 생태계: 좀비 밀도 감소 + 퀘스트 추적(enemyId/enemyType 전달)
    EventBus.emit('enemyKilled', {
      districtId: gs.location.currentDistrict,
      enemyId: enemy.id,
      enemyType: enemy.type,
    });

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
    // 군견 유대감: 함께 싸워 이긴 동반자에게 +3 bond
    NPCSystem.onCombatVictory();
    EventBus.emit('combatEnd', { outcome: 'victory', rewards: gs.combat.rewards });
    // 보라매병원 습격 — HospitalSiegeSystem이 후처리하도록 siegeResolved 발행
    if (data.isSiege) {
      EventBus.emit('siegeResolved', {
        outcome:       'victory',
        casualties:    0,
        defenseRating: 0,
        threat:        0,
        siegeId:       data.siegeId ?? null,
      });
    }
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
    // 보라매병원 습격 패배 — HospitalSiegeSystem이 구조물/환자/dangerMod 후처리
    if (data.isSiege) {
      EventBus.emit('siegeResolved', {
        outcome:       'defeat',
        casualties:    0,
        defenseRating: 0,
        threat:        0,
        siegeId:       data.siegeId ?? null,
      });
    }
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
