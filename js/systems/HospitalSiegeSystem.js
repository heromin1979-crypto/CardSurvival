// === HOSPITAL SIEGE SYSTEM (Phase 4) ===
// 보라매병원 습격 오케스트레이터.
//
// 책임:
//   - 스케줄링: Day 10+부터 간격 5~7일 랜덤으로 siegeTriggered 발행
//   - 적 수 스케일: baseEnemies + siegeCount × enemiesPerWave (max maxEnemies)
//   - 플레이어 현장 여부 분기: currentLandmark === 'dongjak' → encounter 전환
//                             부재 → 기존 GuardSystem 자동 시뮬
//   - siegeResolved 후처리:
//       · victory → pendingLoot 추가 + morale +victoryMorale
//       · defeat  → patientDied × N + structureDamage + dangerMod 누적 + morale +defeatMorale
//   - moraleBonus 일일 합산 (상주 수비대 guard.moraleBonus 합 → 매일 morale 증가)
//
// 구독 이벤트:
//   tpAdvance      — 일일 틱 (day 변경 시 스케줄 체크 + moraleBonus 합산)
//   siegeResolved  — 후처리 (GuardSystem 또는 CombatSystem이 발행)
//
// 발행 이벤트:
//   siegeTriggered    { numEnemies, danger, siegeId, scheduledDay }
//   structureDamage   { damagePercent }              — 기존 이벤트 재사용
//   patientDied       { npcId }                      — 기존 이벤트 재사용
//   hospitalRewards   { items, morale }              — 신규, UI 알림용
//   hospitalDamaged   { structureDamage, landmarkDangerDelta } — 신규

import EventBus       from '../core/EventBus.js';
import GameState      from '../core/GameState.js';
import StateMachine   from '../core/StateMachine.js';
import SystemRegistry from '../core/SystemRegistry.js';
import BALANCE        from '../data/gameBalance.js';
import { rollEnemyGroup } from '../data/enemies.js';

const BORAMAE_LANDMARK_ID = 'lm_boramae_hospital';
const BORAMAE_SUB_LOCATIONS = [
  'boramae_emergency',
  'boramae_surgery',
  'boramae_pharmacy',
  'boramae_morgue',
  'boramae_rooftop',
  'boramae_cafeteria',
];

const HospitalSiegeSystem = {

  // ── 내부 상태 ───────────────────────────────────────
  _currentDay:          -Infinity,
  _initialized:         false,
  _unsubscribeTP:       null,
  _unsubscribeResolved: null,
  _activeSiegeId:       null,

  // ── 초기화 ─────────────────────────────────────────
  init() {
    this._unsubscribeAll();
    this._currentDay  = -Infinity;   // 첫 tpAdvance가 반드시 처리되도록
    this._initialized = true;

    this._unsubscribeTP       = EventBus.on('tpAdvance',     () => this._onTpAdvance());
    this._unsubscribeResolved = EventBus.on('siegeResolved', (p) => this._onSiegeResolved(p));
  },

  // ── tpAdvance 훅 ──────────────────────────────────
  _onTpAdvance() {
    const day = GameState.time?.day ?? 0;
    const tpInDay = GameState.time?.tpInDay ?? 0;

    // 하루 첫 TP에만 처리
    if (day === this._currentDay) return;
    this._currentDay = day;

    if (tpInDay !== 0) return;

    // er_unlocked 필요
    if (!GameState.flags?.er_unlocked) return;

    // W2-2: Day 7 튜토리얼 습격 예고
    this._checkTutorialWarning(day);

    // moraleBonus 일일 합산
    this._tickMoraleBonus();

    // 스케줄 체크
    this._checkSchedule(day);
  },

  // W2-2: Day 7 예고 (한 번만)
  _checkTutorialWarning(day) {
    const warnDay = BALANCE.hospitalSiege?.tutorialWarningDay;
    if (!warnDay || day !== warnDay) return;
    if (GameState.flags.siegeTutorialWarned) return;
    GameState.flags.siegeTutorialWarned = true;

    EventBus.emit('notify', {
      message: '⚠️ 병원 밖에서 발소리가 들린다. 사흘 내로 약탈자들이 응급실을 찾아올 것 같다. — 환자를 치료해 수비대를 확보하라.',
      type: 'warning',
      persistent: true,
    });
  },

  // ── 스케줄 체크 ───────────────────────────────────
  _checkSchedule(day) {
    const b = BALANCE.hospitalSiege;
    if (day < b.startDay) return;

    const flags = GameState.flags;

    // 첫 초기화: nextSiegeDay 계산
    if (flags.nextSiegeDay == null) {
      flags.nextSiegeDay = this._rollNextSiegeDay(b.startDay);
      return;
    }

    if (day < flags.nextSiegeDay) return;

    // 트리거
    this._triggerSiege(day);

    // 다음 예정일 갱신
    flags.nextSiegeDay = this._rollNextSiegeDay(day + b.intervalDays);
  },

  _rollNextSiegeDay(centerDay) {
    const b = BALANCE.hospitalSiege;
    const variance = Math.floor(Math.random() * (b.intervalVariance * 2 + 1)) - b.intervalVariance;
    return centerDay + variance;
  },

  // W1-2: hordeWave가 곧 터질 예정이면 뒤로 밀어 충돌 완화
  _pushHordeWaveIfOverlapping(today) {
    const minGap = BALANCE.hospitalSiege?.minGapWithHordeDays ?? 0;
    if (minGap <= 0) return;
    const nextHorde = GameState.flags?.nextHordeDay;
    if (nextHorde == null) return;
    const gap = nextHorde - today;
    if (gap >= 0 && gap < minGap) {
      GameState.flags.nextHordeDay = today + minGap;
      EventBus.emit('notify', {
        message: '🛡️ 병원 습격 여파로 좀비 무리가 잠시 물러섰다.',
        type: 'info',
      });
    }
  },

  // ── siege 발동 ─────────────────────────────────────
  _triggerSiege(day) {
    const b = BALANCE.hospitalSiege;
    const count = GameState.flags.siegeCount ?? 0;
    const isTutorial = count === 0 && b.tutorial != null;
    const numEnemies = isTutorial
      ? (b.tutorial.numEnemies ?? 1)
      : Math.min(b.maxEnemies, Math.round(b.baseEnemies + count * b.enemiesPerWave));
    const danger = Math.min(4, Math.floor(b.baseDangerLevel + count * b.dangerScaling));
    const siegeId = `siege_${day}_${count + 1}`;
    const playerPresent = this.isPlayerAtHospital();

    GameState.flags.siegeCount = count + 1;
    GameState.flags.lastSiegeDay = day;
    GameState.flags.lastSiegeWasTutorial = isTutorial;
    this._activeSiegeId = siegeId;

    // W1-2: hordeWave가 minGap 내로 예정되어 있으면 밀어냄 (중첩 방지)
    this._pushHordeWaveIfOverlapping(day);

    EventBus.emit('siegeTriggered', {
      numEnemies,
      danger,
      siegeId,
      scheduledDay: day,
      playerPresent,
      isTutorial,
    });

    if (isTutorial) {
      EventBus.emit('notify', {
        message: '🛡️ 첫 습격 — 약탈자 1명이 응급실 앞에 나타났다. (튜토리얼: 피해 없이 방어선을 시험하라)',
        type: 'warning',
      });
    }

    // 플레이어 현장 → CombatSystem 경로로 전환
    if (playerPresent) {
      this._enterCombat({ numEnemies, danger, siegeId });
    }
  },

  _enterCombat({ numEnemies, danger, siegeId }) {
    if (GameState.combat?.active) return;
    if (GameState.ui?.currentState !== 'main') return;

    const enemies = [];
    for (let i = 0; i < numEnemies; i++) {
      const group = rollEnemyGroup(danger, GameState.noise?.level ?? 0);
      if (group?.[0]) enemies.push(group[0]);
    }
    if (enemies.length === 0) return;

    StateMachine.transition('encounter', {
      nodeId:      GameState.location?.currentDistrict ?? null,
      enemies,
      dangerLevel: danger,
      noiseLevel:  GameState.noise?.level ?? 0,
      forced:      true,
      isSiege:     true,
      siegeId,
    });
  },

  // ── siegeResolved 후처리 ──────────────────────────
  _onSiegeResolved({ outcome, casualties = 0, defenseRating = 0, threat = 0 } = {}) {
    const b = BALANCE.hospitalSiege;

    if (outcome === 'victory') {
      this._applyVictory(b);
    } else if (outcome === 'defeat') {
      this._applyDefeat(b);
    }

    this._activeSiegeId = null;
  },

  _applyVictory(b) {
    // 보너스 아이템 pendingLoot에 추가
    const gained = [];
    for (const item of b.victoryItems ?? []) {
      GameState.pendingLoot = [
        ...GameState.pendingLoot,
        { definitionId: item.id, quantity: item.qty },
      ];
      gained.push({ ...item });
    }

    // 사기 상승 (기본 + 연승 보너스)
    const streak = (GameState.flags.siegeWinStreak ?? 0) + 1;
    GameState.flags.siegeWinStreak = streak;

    let moraleGain = b.victoryMorale;
    const bonusMap = b.streakBonus ?? {};
    if (streak >= 5 && bonusMap.at5) {
      moraleGain += bonusMap.at5;
    } else if (streak >= 2 && bonusMap.at2) {
      moraleGain += bonusMap.at2;
    }

    GameState.modStat('morale', moraleGain);

    EventBus.emit('hospitalRewards', { items: gained, morale: moraleGain, streak });
  },

  _applyDefeat(b) {
    GameState.flags.siegeWinStreak = 0;

    // W2-2: 튜토리얼 시에지는 영구 피해를 생략
    const tut = b.tutorial;
    const isTutorial = !!GameState.flags.lastSiegeWasTutorial && tut != null;
    const skipCasualties = isTutorial && tut.skipCasualties;
    const skipStructure  = isTutorial && tut.skipStructureDmg;
    const skipDanger     = isTutorial && tut.skipDangerMod;
    const tutoMoraleMult = isTutorial ? (tut.moraleMultiplier ?? 1) : 1;

    // 의사 특권 — defeat 완화 (튜토리얼과 곱연산 누적)
    const isDoctor = GameState.player?.characterId === 'doctor';
    const dp = b.doctorPrivilege;
    const doctorPrivilegeApplied = isDoctor && dp != null;
    const docMoraleMult = doctorPrivilegeApplied ? (dp.defeatMoraleMultiplier ?? 1) : 1;
    const moraleMult    = tutoMoraleMult * docMoraleMult;

    // 1) 환자 무작위 사망 1~2명 (의사면 casualtiesReduce만큼 감소)
    if (!skipCasualties) {
      const intake = SystemRegistry.get('PatientIntakeSystem');
      const admitted = intake?._admitted ?? [];
      const casualtiesWanted = this._rollCasualties(b, doctorPrivilegeApplied ? (dp.casualtiesReduce ?? 0) : 0);
      const victims = this._sampleRandom(admitted, casualtiesWanted);
      for (const npcId of victims) {
        EventBus.emit('patientDied', { npcId });
      }
    }

    // 2) 구조물 피해
    if (!skipStructure) {
      EventBus.emit('structureDamage', { damagePercent: b.structureDamage });
    }

    // 3) 서브로케이션 dangerMod 누적 증가
    if (!skipDanger) {
      for (const subId of BORAMAE_SUB_LOCATIONS) {
        GameState.addLandmarkDangerMod(BORAMAE_LANDMARK_ID, subId, b.dangerModDelta);
      }
    }

    // 4) 사기 하락 (튜토리얼은 절반, 의사는 ×0.75 추가 경감)
    GameState.modStat('morale', Math.round(b.defeatMorale * moraleMult));

    EventBus.emit('hospitalDamaged', {
      structureDamage:     skipStructure ? 0 : b.structureDamage,
      landmarkDangerDelta: skipDanger    ? 0 : b.dangerModDelta,
      isTutorial,
      doctorPrivilegeApplied,
    });
  },

  _rollCasualties(b, reduce = 0) {
    const min = Math.max(0, (b.casualtiesMin ?? 1) - reduce);
    const max = Math.max(0, (b.casualtiesMax ?? 2) - reduce);
    return min + Math.floor(Math.random() * (max - min + 1));
  },

  _sampleRandom(arr, n) {
    const pool = [...arr];
    const picked = [];
    for (let i = 0; i < n && pool.length > 0; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    return picked;
  },

  // ── moraleBonus 일일 합산 ─────────────────────────
  _tickMoraleBonus() {
    const guardSys = SystemRegistry.get('GuardSystem');
    if (!guardSys) return;
    const stationed = guardSys.getStationed?.() ?? [];
    if (stationed.length === 0) return;

    let total = 0;
    for (const npcId of stationed) {
      const def = guardSys.getGuardDef?.(npcId);
      total += def?.moraleBonus ?? 0;
    }
    if (total !== 0) {
      GameState.modStat('morale', total);
    }
  },

  // ── 플레이어 현장 여부 ─────────────────────────────
  isPlayerAtHospital() {
    return GameState.location?.currentLandmark === 'dongjak';
  },

  // ── 테스트 유틸 ────────────────────────────────────
  _unsubscribeAll() {
    if (this._unsubscribeTP)       { this._unsubscribeTP();       this._unsubscribeTP       = null; }
    if (this._unsubscribeResolved) { this._unsubscribeResolved(); this._unsubscribeResolved = null; }
  },

  _reset() {
    this._unsubscribeAll();
    this._currentDay    = -Infinity;
    this._initialized   = false;
    this._activeSiegeId = null;
  },
};

export default HospitalSiegeSystem;
