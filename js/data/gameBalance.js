// === GAME BALANCE CONSTANTS ===
// 게임 밸런스 상수를 한 곳에서 관리. 시스템들은 이 파일의 값을 참조한다.

const BALANCE = {
  // ── 스탯 감소율 (/TP) ──────────────────────────────
  stats: {
    hydrationDecayPerTP:  1.5,   // (기존 2.0 → 1.5로 완화)
    nutritionDecayPerTP:  0.5,
    moraleDecayPerTP:     0.2,
    fatigueGainPerTP:     0.8,
    staminaRegenPerTP:    1.2,   // (기존 1.5 → 1.2로 완화)
  },

  // ── 수분 ────────────────────────────────────────────
  hydration: {
    max:          288,
    startValue:   200,
  },

  // ── 방어력 ──────────────────────────────────────────
  armor: {
    damageReductionCap:  0.50,   // (기존 0.75 → 0.50)
    critReductionCap:    0.70,   // (기존 0.90 → 0.70)
    specialDmgReductCap: 0.60,   // 적 특수스킬 방어 캡
  },

  // ── 소음 ────────────────────────────────────────────
  noise: {
    max:              100,
    baseDecayPerTP:   1.0,
    influxThreshold:  60,
    // 소음 레벨에 따른 추가 감소 (스파이럴 방지)
    scaledDecayBreakpoints: [
      { threshold: 70, bonusDecay: 0.5 },
      { threshold: 80, bonusDecay: 1.0 },
      { threshold: 90, bonusDecay: 1.5 },
    ],
  },

  // ── 이동 ────────────────────────────────────────────
  travel: {
    baseCostTP:         2,
    baseStaminaDrain:   10,
    exploreStaminaDrain: 5,
    lowStaminaThreshold: 0.3,
    lowStaminaPenalty:   1.5,
    immobileWeightPct:   2.0,
  },

  // ── 제작 ────────────────────────────────────────────
  crafting: {
    maxQueueSize:       3,
    baseFailureChance:  0.12,   // 기본 실패 확률 12%
    minFailureChance:   0.02,   // 스킬 최대 시 최소 실패률 2%
    failureRefundRate:  0.5,    // 실패 시 재료 50% 반환
    xpBase: {
      building:    10,
      weaponcraft: 8,
      armorcraft:  8,
      cooking:     5,
      crafting:    5,
    },
  },

  // ── 전투 ────────────────────────────────────────────
  combat: {
    fleeChance:         0.6,
    fleeNoise:          10,
    fleeFatigue:        10,
    unarmedBaseDmg:     [3, 7],
    unarmedStunChance:  0.10,
    unarmedStunDmg:     5,
    masteryCounterChance: 0.15,
    masteryCounterDmg:   5,
    ammoSaveChance:     0.20,
    killXp:             5,
    hitXp:              2,
    critBonusXp:        2,
    defenseXp:          1,
    combatLogMaxEntries: 50,
  },

  // ── 캠프파이어 ──────────────────────────────────────
  campfire: {
    tempBoostPerTP:     2,
    fuelConsumePerTP:   0.5,   // 내구도 0.5/TP 소모
    noFuelTempBoost:    0,
  },

  // ── 조우 ────────────────────────────────────────────
  encounter: {
    reductionCap:          0.85,
    structureReductCap:    0.70,
    respawnNoiseThreshold: 35,
    earlyGameGraceDays:    3,     // 초반 N일간 조우 확률 감소 적용
    earlyGameEncounterMult: 0.45, // 초반 조우 확률 배율 (45%로 감소)
  },

  // ── 질병 노출 카운터 ───────────────────────────────
  disease: {
    exposureDecayRate:  0.5,   // (기존 2~3 → 0.5로 완화)
  },

  // ── 사기 구간별 효과 ───────────────────────────────
  moraleTiers: {
    high:    { threshold: 70, dmgMult: 1.10, accBonus: 0.05, staminaRegenMult: 1.20, craftFailMult: 0.8,  fatigueGainMult: 0.9  },
    normal:  { threshold: 30, dmgMult: 1.00, accBonus: 0.00, staminaRegenMult: 1.00, craftFailMult: 1.0,  fatigueGainMult: 1.0  },
    low:     { threshold: 15, dmgMult: 0.85, accBonus:-0.15, staminaRegenMult: 0.70, craftFailMult: 1.5,  fatigueGainMult: 1.3  },
    despair: { threshold:  0, dmgMult: 0.70, accBonus:-0.25, staminaRegenMult: 0.00, craftFailMult: 2.0,  fatigueGainMult: 1.6, blockExplore: true },
  },

  // ── 후반 레이드 이벤트 ─────────────────────────────
  raidEvents: {
    startDay:           12,    // 12일차부터 레이드 발생
    baseChancePerTP:    0.003, // TP당 기본 발생 확률 0.3%
    dayScaling:         0.0002,// 일차마다 확률 증가
    maxChance:          0.015, // 최대 1.5%/TP
    minEnemies:         3,
    maxEnemies:         6,
  },

  // ── 좀비 습격 (Horde Wave) ────────────────────────
  hordeWaves: {
    startDay:         30,     // 30일차부터
    intervalDays:     15,     // 15일 간격 (Day 30, 45, 60, 75, 90...)
    intervalVariance: 3,      // ±3일 랜덤
    baseEnemies:      2,
    enemiesPerWave:   1,      // 웨이브마다 +1
    maxEnemies:       8,
    baseDangerLevel:  2,
    dangerScaling:    0.5,    // 웨이브마다 +0.5
    structureDamage:  25,     // 패배/도주 시 구조물 내구도 25% 감소
    victoryMorale:    15,
    defeatMorale:     -20,
  },

  // ── 약탈자 NPC 이벤트 ─────────────────────────────
  raiderEvents: {
    startDay:         40,
    baseChancePerTP:  0.001,
    dayScaling:       0.00005,
    maxChance:        0.005,
    cooldownTP:       480,     // 5일 쿨다운
    demandItems:      3,
    demandItemsMax:   5,
    surrenderMorale:  -15,
    refuseMorale:     -5,
  },
  // ── 야간 ──────────────────────────────────────────
  night: {
    startHour:            20,
    endHour:              6,
    encounterMult:        2.0,
    travelCostMult:       1.5,
    darkSleepFatigueMult: 0.5,   // 어둠 수면 시 피로 회복 ×0.5
    darkSleepAnxietyGain: 5,     // 어둠 수면 시 불안 +5
    darkNightmareBonus:   0.10,  // 어둠 수면 시 악몽 확률 +10%
    litSleepAnxietyDrop:  3,     // 광원 수면 시 불안 -3
    lightDrainPerTP:      0.5,   // 야간 광원 카드 내구도 감소 (/TP)
  },
};

export default BALANCE;
