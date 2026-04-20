// === GAME BALANCE CONSTANTS ===
// 게임 밸런스 상수를 한 곳에서 관리. 시스템들은 이 파일의 값을 참조한다.

const BALANCE = {
  // ── 설계 목표 ────────────────────────────────────────
  // 100일 시뮬레이션 기준 생존율 목표: 10~20%
  // 현재 측정값(firefighter 100회 sim): 13.3% → 목표 범위 내
  // 목표를 벗어날 경우 stats.decay 값 조정으로 재조율
  design: {
    survivalRateTargetMin: 0.10,
    survivalRateTargetMax: 0.20,
  },

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
    maxQueueSize:       5,
    baseFailureChance:  0.12,   // 기본 실패 확률 12%
    minFailureChance:   0.02,   // 스킬 최대 시 최소 실패률 2%
    failureRefundRate:  0.5,    // 실패 시 재료 50% 반환
    xpBase: {
      building:    10,
      weaponcraft: 8,
      armorcraft:  8,
      medicine:    6,
      cooking:     5,
      crafting:    5,
    },
  },

  // ── 제작 품질 (스택 불가 아이템에만 적용) ───────────────
  quality: {
    tiers: {
      normal:     { label: '일반', mult: 1.00, notify: null },
      good:       { label: '양호', mult: 1.15, notify: '꽤 잘 만들어졌다.' },
      excellent:  { label: '우수', mult: 1.30, notify: '훌륭한 솜씨가 느껴진다!' },
      masterwork: { label: '걸작', mult: 1.50, notify: '완벽한 걸작이 완성됐다!' },
    },
    // qualityScore 임계값 (랜덤 0~1 + 보너스)
    thresholds: { masterwork: 1.15, excellent: 0.80, good: 0.45 },
    skillBonusPerLevel:   0.08,  // 요구 레벨 초과 1레벨당
    focusBonusSolo:       0.12,  // 큐 1개 (집중 제작)
    focusPenaltyFull:     0.05,  // 큐 꽉 참
    moraleBonusHigh:      0.08,  // 사기 높음
    moralePenaltyLow:     0.10,  // 사기 낮음
    moralePenaltyDespair: 0.20,  // 절망 상태
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
    enemyDropChance:    0.80,  // (기존 0.60 → 0.80 상향)
    killXp:             5,
    hitXp:              2,
    critBonusXp:        2,
    defenseXp:          1,
    combatLogMaxEntries: 50,
    // ── 방어 ──
    guardDamageReduction: 0.40,  // 방어 시 피해 40% 감소
    guardCounterBonus:    0.25,  // 방어 후 반격 데미지 +25%
    guardDuration:        1,     // 방어 지속 턴
    // ── 야간 전투 ──
    nightAccuracyPenalty: 0.15,  // 야간 전투 명중률 -15%
    nightLitPenalty:      0.07,  // 광원 보유 시 야간 패널티 완화 (-7%만 적용)
    // ── 약점/저항 ──
    weaponWeaknessMult:   1.50,  // 약점 속성 데미지 ×1.5
    weaponResistanceMult: 0.60,  // 저항 속성 데미지 ×0.6
    // ── NPC 동행 액션 쿨다운 ──
    companionAttackCooldown: 3,
    companionHealCooldown:   4,
  },

  // ── 캠프파이어 ──────────────────────────────────────
  campfire: {
    tempBoostPerTP:     2,
    fuelConsumePerTP:   0.5,   // 내구도 0.5/TP 소모
    noFuelTempBoost:    0,
  },

  // ── 탐색 루팅 ───────────────────────────────────────
  explore: {
    lootCountMin: 1,  // (기존 2~5 → 1~3으로 감소)
    lootCountMax: 3,
  },

  // ── 조우 ────────────────────────────────────────────
  encounter: {
    reductionCap:           0.85,
    structureReductCap:     0.70,
    respawnNoiseThreshold:  35,
    earlyGameGraceDays:     3,     // 초반 N일간 조우 확률 감소 적용
    earlyGameEncounterMult: 0.45,  // 초반 조우 확률 배율 (45%로 감소)
    landmarkDangerReduct:   0.10,  // 랜드마크 서브 장소 기본 위험도 감소
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
    startHour:            0,   // 자정(00:00)부터 야간
    endHour:              5,   // 05:00에 야간 종료
    encounterMult:        2.0,
    travelCostMult:       1.5,
    darkSleepFatigueMult: 0.5,   // 어둠 수면 시 피로 회복 ×0.5
    darkSleepAnxietyGain: 5,     // 어둠 수면 시 불안 +5
    darkNightmareBonus:   0.10,  // 어둠 수면 시 악몽 확률 +10%
    litSleepAnxietyDrop:  3,     // 광원 수면 시 불안 -3
    lightDrainPerTP:      0.5,   // 야간 광원 카드 내구도 감소 (/TP)
  },

  // ── 의료 구조물 내구도 ──────────────────────────────────
  medicalStation: {
    durabilityDecayPerTP: 0.093,  // 100 내구도 기준 ~15일(1080TP)
  },

  // ── 낚시 ──────────────────────────────────────────────
  fishing: {
    tpCostPerCast:        2,     // 낚시 1회 TP 비용
    baseCatchChance:      0.30,  // 기본 어획 확률 (fishing Lv.0)
    maxCatchChance:       0.70,  // 최대 어획 확률 (fishing Lv.20)
    baitWormBonus:        0.10,  // 지렁이 미끼 어획률 보너스
    baitInsectBonus:      0.05,  // 곤충 미끼 어획률 보너스
    rodBasicBonus:        0.00,  // 기본 낚싯대 추가 보너스 없음
    rodImprovedBonus:     0.15,  // 개량 낚싯대 어획률 보너스
    rareFishChanceMax:    0.15,  // Lv.20 희귀어 확률
    trapCheckIntervalTP:  8,     // 통발 자동 수확 주기 (TP)
    trapBaseCatch:        0.40,  // 통발 기본 어획률
    trapMaxCatch:         0.60,  // 통발 최대 어획률 (fishingQuality 3 기준)
    xpPerCast:            3,     // 낚시 시도 XP
    xpPerRareFish:        10,    // 희귀어 XP
    xpPerTrapHarvest:     1,     // 통발 수확 XP
  },
};

export default BALANCE;
