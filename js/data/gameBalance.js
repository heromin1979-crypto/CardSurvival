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
    hydrationDecayPerTP:  1.0,   // (기존 2.0 → 1.5 → 1.0으로 완화)
    nutritionDecayPerTP:  0.5,
    moraleDecayPerTP:     0.2,
    fatigueGainPerTP:     0.8,
    staminaRegenPerTP:    1.2,   // (기존 1.5 → 1.2로 완화)
    // 무게 경고 온보딩 힌트 발화 비율 — 과적 페널티(100%) 전에 미리 안내
    weightWarnPct: 0.75,
    // 무게 비율(weightPct)별 스태미나 소모 배율 (max 이하이면 해당 mult)
    // 과적(>100%)에서만 페널티를 부여하고 그 이하 무게는 배율 없음
    weightMultipliers: [
      { max: 1.00, mult: 1.0 },
      { max: Infinity, mult: 1.2 },
    ],
    // 과적 구간별 스태미나 변화량(/TP). pct ≤1.0은 staminaRegenPerTP(회복) 적용
    staminaDrainTiers: [
      { max: 1.5, delta: -0.5 },
      { max: 2.0, delta: -1.0 },
      { max: Infinity, delta: -2.0 },
    ],
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
    warnLevel:        40,   // 소음 경고 온보딩 힌트 발화 레벨 — 유입 임계 전 선제 안내
    flushReductionMult: 0.5,   // 소음 플러시 시 influxThreshold 대비 잔존 비율
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
    failureXpMult:      0.5,    // 제작 실패 시 획득 XP 배율
    chefTeamBonusHigh:  0.20,   // 셰프 팀 평균사기 >85 품질 점수 보너스
    chefTeamBonusMid:   0.10,   // 셰프 팀 평균사기 >70 품질 점수 보너스
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
    defaultPlayerSpeed: 5,
    defaultCompanionSpeed: 5,
    defaultEnemySpeed: 4,
    initiativeRollMax: 3,
    deathsDoor: {
      baseResist: 0.75,
      resistLossPerCheck: 0.10,
      minimumResist: 0.05,
      outgoingDamageMult: 0.7,  // 죽음의 문턱 상태에서 가하는 피해 감소
    },
    stress: {
      resolveChance: 0.10,
      afterResolve: 3,
      afterMeltdown: 2,
      // 상시 축적원 (0~10 스케일 기준)
      heavyHitThreshold: 15,    // 이 이상 피해 피격 시 스트레스 축적
      heavyHitStress: 1,
      deathsDoorStress: 2,      // 죽음의 문턱 진입 시
      allyDownStress: 2,        // 아군(동료) 다운 목격 시
      nightRoundStress: 1,      // 야간 전투 라운드당 (광원 없을 때)
      nightLitRoundStress: 0,   // 광원 보유 시 야간 라운드 스트레스
      shakenThreshold: 7,       // 이 이상이면 동요 — 임계 전부터 스트레스 관리에 가치 부여
      shakenAccPenalty: 0.05,   // 동요 상태 명중 감소
    },
    // ── 도주 (상황식 — 도주각을 만드는 플레이가 유효 전술이 되도록) ──
    flee: {
      base: 0.5,                // 기본 도주 성공률
      openFrontBonus: 0.2,      // 적 전열 공백 시 가산
      speedTokenBonus: 0.15,    // 자신 speed 토큰 보유 시 가산
      disabledEnemiesBonus: 0.15, // 살아있는 적 전원 기절/주저 시 가산
      cap: 0.9,                 // 상한
    },
    // ── 기본 회피(토큰과 별개인 상시 회피 확률) ──
    defaultPlayerDodge: 0.05,
    defaultCompanionDodge: 0.05,
    // ── 랭크 위치 시너지 ──
    position: {
      backlineRangedAccBonus: 0.10,   // 3~4랭크에서 원거리 스킬 명중 보너스
      frontlineMeleeDamageMult: 1.10, // 1랭크에서 근접 스킬 피해 보너스
      knockbackWallDamage: 4,         // 강제 밀치기가 벽(4랭크)에 막힐 때의 충돌 고정 피해
    },
    // ── 전투 토큰 (1회 소비형 버프/디버프 계수) ──
    tokens: {
      blockDamageMult:      0.5,   // block: 받는 피해 절반 (CombatStatusSystem.applyDamage)
      strengthDamageMult:   1.3,   // strength/power/improvised: 다음 공격 피해 증가 (공격 강화 계열 — 공격당 1개만 소비)
      vulnerableDamageMult: 1.3,   // vulnerable: 받는 피해 증가
      hesitationDamageMult: 0.7,   // hesitation: 다음 공격 피해 감소
      accuracyBonus:        0.15,  // accuracy: 다음 공격 명중 보정
      focusCritBonus:       0.15,  // focus: 다음 공격 치명타 확률 보정
      speedInitiativeBonus: 4,     // speed: 다음 라운드 이니셔티브 굴림 보정
      markedDamageMult:     1.5,   // marked(표식): 받는 피해 대폭 증가 — 집중 사격 시너지
    },
    relationship: {
      positiveChance: 0.18,
      negativeChance: 0.15,
      supportStressHeal: 1,
      interfereStress: 1,
    },
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
    // 명중률/치명타 기본값
    baseUnarmedAccuracy: 0.70,  // 맨손 공격 기본 명중률
    defaultCritMultiplier: 1.5, // 무기 미지정 시 치명타 배율 기본값
    noAmmoMeleeDamage:   [5, 10], // 탄약 없는 원거리무기 → 근접 전환 피해 범위
    noAmmoAccuracy:      0.65,  // 탄약 없는 근접 전환 명중률
    noAmmoNoise:         3,     // 탄약 없는 근접 전환 소음
    defaultStealthDifficulty: 0.5, // 적 은신 난이도 기본값
    enemyDefaultDamage:  [3, 6],  // 적 공격 피해 기본 범위(attack.damage 미지정 시)
    enemyBaseAccuracy:   0.7,   // 적 공격 기본 명중률(attack.accuracy 미지정 시)
    enemySpecialSkillChance: 0.5, // 적이 특수스킬을 사용할 확률
    fleeFailedDamageMult: 1.5,  // 도주 실패 시(등 보임) 받는 피해 배율
    companionTargetChance: 0.20, // 적이 플레이어 대신 동료를 노릴 확률
    doctorZombieMedDropChance: 0.30, // 의사 — 좀비 처치 시 의료품 추가 드롭 확률
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
    // ── 방어 관통 바닥 ──
    // 정액 방어가 피해를 이 비율 아래로 깎지 못한다 — 저티어 무기의 고방어 적 무력화 방지
    defenseFloorRatio:    0.30,
    // ── 타이밍 압박 적 (timedThreat) ──
    timedThreats: {
      bloater: {
        aoeDamage:      [25, 40],
        corpseBurst:    [8, 14],
        infectionCloud: 15,
      },
      screamer: {
        summonCount:  [1, 2],
        summonNoise:  25,
      },
      charger: {
        strikeDamage:     [30, 45],
        strikeStun:       1,
        guardCounterMult: 2.0,
      },
    },
    // ── 사기 격파 (인간 적) ──
    moraleBreak: {
      routThreshold:      0,
      critMoraleDmg:      25,
      allyDeathMoraleDmg: 30,
      routLootMult:       0.5,
    },
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
    // W3-2 Phase A — 서브로케이션 재고 고갈
    stockDecayPerDay: 1,  // 일자 경과 시 subLocationStock 자동 감소량 (같은 day 중복 차감 방지)
    // [DEPRECATED] 구 드랍 30일 이진 리필 — 드랍 개편 Phase 1에서 EcologySystem 연속 자원 모델로 대체됨.
    //   런타임(ExploreSystem)은 더 이상 사용하지 않음. 시뮬레이터/구버전 참조 호환용으로만 잔존.
    respawnLootDays:     30,   // (legacy) 구역 루팅 리스폰까지 경과 일수
    respawnLootChance:   0.5,  // (legacy) 리스폰 시 각 아이템 드롭 확률
    respawnLootQtyDivisor: 2,  // (legacy) 리스폰 수량 = floor(원수량 / 이 값)
    masteryRareLootChance: 0.05, // 탐색 마스터리 희귀 루팅 확률
    // 지역 탐사도(%) — Phase 3. 탐사 1회당 상승량(구별 exploreIncrement로 덮어쓰기 가능), 100%까지 누적.
    explorationPerExplore: 5,    // 탐사 1회당 탐사도 상승 % (전역 기본)
    explorationYieldBonusMax: 0.5, // 탐사도 100% 시 일반 루팅 보너스 픽 확률 최대치(0.5 = 50%)
    subLocationNoiseMult:  0.8,  // 세부장소 탐색 소음 배율(구 소음 대비)
    nightHospitalAmbushChance: 0.20, // 야간 보라매 응급실/수술실 잠복 환자 조우 확률
    indoorRadiationMult:   0.5,  // 건물 내부 방사선 노출 배율
    masteryRarePool: ['bandage', 'painkiller', 'antiseptic', 'rope', 'wire'], // 탐색 마스터리 희귀 루팅 풀
  },

  // ── 부패 (Phase 4) — 음식 유기물만, 일 1회 contamination 누적 ───
  spoilage: {
    // subtype별 기본 부패 일수(이 일수에 걸쳐 contamination 0→100). 아이템 spoilDays로 개별 덮어쓰기.
    daysBySubtype: { food_raw: 2, carcass: 2, food: 5, drink: 7 },
    defaultDays: 5,                       // subtype 미해당 음식 기본
    seasonMult: { spring: 1.0, summer: 2.0, autumn: 1.0, winter: 0.5 }, // 여름 빨리, 겨울 느리게
  },

  // ── 도난 (Phase 4) — 동물이 바닥 음식을 물어가 둥지로 ──────────
  theft: {
    dailyChance: 0.15,   // 바닥에 음식이 있을 때 일 1회 도난 확률
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
    coldExposureTpThreshold:   48,  // 저체온증 발병 누적 저온 TP (~16시간)
    heatExposureTpThreshold:   36,  // 열사병 발병 누적 고온 TP (~12시간)
    sepsisExposureTpThreshold: 48,  // 패혈증 발병 누적 고감염 TP
    commonColdChance:        0.004, // TP당 감기 발병 확률(계절 보정 전)
    influenzaChance:         0.004, // TP당 독감 발병 확률
    radiationSicknessChance: 0.005, // TP당 방사선 질환 발병 확률
    waterContamSevereThreshold: 50, // 물 오염 '심함' 임계
    contamMildThreshold:        20, // 음식/물 오염 '중간' 임계
    choleraChanceSevereWater:  0.55, // 심한 오염수 콜레라 확률
    dysenteryChanceSevereWater: 0.50, // 심한 오염수 이질 확률
    dysenteryChanceContamFood:  0.40, // 오염 음식/물 이질 확률
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

  // ── 보라매병원 습격 (Hospital Siege) ──────────────
  // 응급실 거점(보라매병원)을 노리는 약탈자·감염자 습격.
  // GuardSystem이 상주 수비대로 자동 시뮬하거나, 플레이어 현장 시 CombatSystem 경로.
  hospitalSiege: {
    startDay:         10,     // 10일차부터 (er_unlocked 플래그 필요)
    intervalDays:     6,      // 평균 6일 간격
    intervalVariance: 1,      // ±1일 랜덤 (즉 5~7일)
    baseEnemies:      2,      // 첫 습격 2명
    enemiesPerWave:   0.5,    // 습격마다 +0.5 (반올림)
    maxEnemies:       7,
    baseDangerLevel:  2,
    dangerScaling:    0.3,    // 습격마다 +0.3
    structureDamage:  25,     // 패배 시 구조물 피해 25%
    dangerModDelta:   0.05,   // 패배 시 서브로케이션 dangerMod +0.05
    casualtiesMin:    1,
    casualtiesMax:    2,
    victoryMorale:    10,
    defeatMorale:     -12,    // W1-1: 기존 -15 완화
    victoryItems: [
      { id: 'pistol_ammo', qty: 3 },
    ],
    // 연승 streak 보너스 (누적 방어 성공 시 추가 사기)
    streakBonus: {
      at2: 5,      // 2연승 시 +5 추가
      at5: 15,     // 5연승 시 +15 추가 (2연승 누적 위)
    },
    // W1-2: hordeWave와 최소 간격 — 겹치면 뒤쪽 이벤트를 밀어냄
    minGapWithHordeDays: 3,
    // W2-2: 튜토리얼 습격 — 첫 습격은 학습용으로 가벼움 (siegeCount === 0 분기)
    tutorialWarningDay: 7,    // Day 7에 예고 notify 발행
    tutorial: {
      numEnemies:        1,    // 최소 적
      skipStructureDmg:  true, // 패배해도 구조물 피해 없음
      skipDangerMod:     true, // 패배해도 서브로케이션 dangerMod 증가 없음
      skipCasualties:    true, // 패배해도 환자 사망 없음
      moraleMultiplier:  0.5,  // 사기 손실 절반
    },
    // 의사 특권 — player.characterId === 'doctor'일 때 defeat 완화
    // (튜토리얼 moraleMultiplier와 곱연산 누적)
    doctorPrivilege: {
      casualtiesReduce:       1,     // 사망자 min/max 각각 -1 (최소 0)
      defeatMoraleMultiplier: 0.75,  // 사기 손실 25% 경감
    },
    // W3-3 의사 전용 대피 미니게임 (siege encounter 4번째 옵션)
    // 점수 = baseScore + stage1 가중치 + stage2 가중치 + medicine×skillMult + trustedNpc×trustMult
    // score >= threshold → 'partial_victory', else → 'defeat'
    doctorEvacuation: {
      baseScore: 0,
      threshold: 20,
      stageWeights: {
        stage1: { A: 8, B: 6 },  // A=약품 우선 / B=부상자 우선
        stage2: { C: 5, D: 8 },  // C=복도(빠름·노출) / D=계단(느림·은폐)
      },
      skillMult: 2,   // medicine skill level × 2
      trustMult: 3,   // 신뢰 NPC 수 × 3
      // partial_victory 효과 (구조물 피해·사기·위험도 감경)
      partialVictoryMorale:          5,     // +5 (성공적 대피 감사)
      partialVictoryStructureMult:   0.5,   // 구조물 피해 기본 × 0.5
      partialVictoryDangerMult:      0.5,   // landmark danger 기본 × 0.5
    },
  },

  // ── 환자 유입 (Patient Intake) ──────────────────
  patientIntake: {
    moraleDeath:   -2,     // W1-1: 기존 -3 완화 (환자 사망)
    moraleDepart:  -1,     // W1-1: 기존 -2 완화 (환자 이탈)
    cumulativeMoraleBonusPer: 0.5, // 누적 치료 환자 1명당 사기 보너스
    cumulativeMoraleBonusCap: 50,  // 누적 환자 사기 보너스 상한
    // 의사 마일스톤 사기 보너스 (누적 치료 수 도달 시 one-shot)
    moraleMilestones: {
      5:  5,
      10: 10,
      25: 15,
      50: 20,
    },
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

  // ── NPC ────────────────────────────────────────────────
  npc: {
    trustCombatBonusPer5: 0.3,  // 전투 보너스 배율 = 1.0 + (trust/5) × 이 값
    // 야간 경계 보너스 (NPC별 안전도 가산 / 조우 감소)
    watchBonuses: {
      npc_soldier_deserter: { safetyAdd: 20, encounterReduce: 0.3 },
      npc_dog:              { safetyAdd: 15, encounterReduce: 0.2 },
      npc_mechanic:         { safetyAdd: 10, encounterReduce: 0.1 },
      npc_old_survivor:     { safetyAdd:  8, encounterReduce: 0.1 },
      npc_nurse:            { safetyAdd:  5, encounterReduce: 0.05 },
      npc_student:          { safetyAdd:  8, encounterReduce: 0.1 },
      npc_child:            { safetyAdd:  2, encounterReduce: 0.0 },
      npc_trader:           { safetyAdd:  5, encounterReduce: 0.05 },
    },
  },

  // ── 스킬 보너스 계수 ───────────────────────────────────
  // skillDefs.js getBonuses() 수식에 쓰이는 튜닝 계수.
  skills: {
    scavenging: {
      maxExtraLootChance: 0.30,  // 탐색 Lv.20 시 추가 루팅 확률(레벨 비례: level/20 × 이 값)
      lv20RareLootChance: 0.05,  // 탐색 Lv.20 도달 시 희귀 루팅 확률
    },
  },

  // ── 특성(trait) 효과 값 ────────────────────────────────
  // TraitSystem이 이 값을 우선 참조 (정의의 이름/설명은 TraitSystem에 유지).
  traits: {
    scavenger: { bonusLootCount: 1 },   // 탐색 시 추가 발견 아이템 수
    medic:     { healMultiplier: 1.5 }, // 의료 아이템 회복 배율
    silent:    { noiseMult: 0.6 },      // 소음 발생 배율
  },

  // ── 신체 부상 ──────────────────────────────────────────
  body: {
    // 부위별 피격 확률 (무기 타입별)
    hitTables: {
      melee:   { head: 0.10, torso: 0.35, leftArm: 0.15, rightArm: 0.15, leftLeg: 0.125, rightLeg: 0.125 },
      ranged:  { head: 0.15, torso: 0.45, leftArm: 0.10, rightArm: 0.10, leftLeg: 0.10,  rightLeg: 0.10 },
      unarmed: { head: 0.15, torso: 0.25, leftArm: 0.20, rightArm: 0.20, leftLeg: 0.10,  rightLeg: 0.10 },
    },
    // 부상 타입별 기본 치유 TP
    injuryHealTP: { laceration: 36, bleeding: 24, fracture: 108, concussion: 72 },
    naturalHealRate: 0.05,  // severity 당 TP마다 치유 진행량
    // 부상 타입 결정 확률 (피해량 구간별)
    headConcussionChance:  0.6,  // 머리 피격 시 뇌진탕(아니면 열상)
    highDmgFractureChance: 0.5,  // 피해 ≥25 골절(아니면 출혈)
    midDmgBleedingChance:  0.35, // 피해 ≥15 출혈
    midDmgLacerationChance: 0.65,// 피해 ≥15 (누적) 열상, 그 외 골절
    lowDmgLacerationChance: 0.6, // 그 외 열상(아니면 출혈)
    // 심각도 결정 확률
    severeChanceHighDmg: 0.4,  // 피해 ≥30 → 0.4 확률 sev3, 아니면 sev2
    severeChanceMidDmg:  0.5,  // 피해 ≥18 → 0.5 확률 sev2, 아니면 sev1
  },

  // ── 계절 보너스 루팅 ──────────────────────────────────
  // 탐색 시 현재 계절에 따라 추가로 굴리는 보너스 아이템 테이블.
  seasonal: {
    maxCount: 2,   // 1회 탐색당 계절 보너스 최대 획득 개수
    seasonLoot: {
      spring: [
        { id: 'vitamins',  qty: 1, chance: 0.40 },
        { id: 'gauze',     qty: 1, chance: 0.25 },
      ],
      summer: [
        { id: 'sports_drink', qty: 1, chance: 0.30 },
        { id: 'empty_bottle', qty: 1, chance: 0.20 },
      ],
      autumn: [
        { id: 'canned_food', qty: 1, chance: 0.45 },
        { id: 'energy_bar',  qty: 1, chance: 0.35 },
        { id: 'rice',        qty: 1, chance: 0.20 },
      ],
      winter: [
        { id: 'wood',               qty: 1, chance: 0.50 },
        { id: 'cloth',              qty: 1, chance: 0.35 },
        { id: 'charcoal',           qty: 1, chance: 0.25 },
        { id: 'contaminated_water', qty: 1, chance: 0.30 },
      ],
    },
  },

  // ── 낚시 ──────────────────────────────────────────────
  fishing: {
    tpCostPerCast:        2,     // 낚시 1회 TP 비용
    baseCatchChance:      0.50,  // 기본 어획 확률 (fishing Lv.0) — PR12 v8 진입 트리거
    maxCatchChance:       0.70,  // 최대 어획 확률 (fishing Lv.20)
    baitWormBonus:        0.10,  // 지렁이 미끼 어획률 보너스
    baitInsectBonus:      0.05,  // 곤충 미끼 어획률 보너스
    rodBasicBonus:        0.00,  // 기본 낚싯대 추가 보너스 없음
    rodImprovedBonus:     0.15,  // 개량 낚싯대 어획률 보너스
    rareFishChanceMax:    0.15,  // Lv.20 희귀어 확률
    nonRareSmallChance:   0.45,  // 희귀어 아닐 때 소형어 확률(아니면 중형)
    trapMediumChance:     0.3,   // 통발 수확 시 중형어 확률(아니면 소형)
    trapCheckIntervalTP:  8,     // 통발 자동 수확 주기 (TP)
    trapBaseCatch:        0.40,  // 통발 기본 어획률
    trapMaxCatch:         0.60,  // 통발 최대 어획률 (fishingQuality 3 기준)
    xpPerCast:            3,     // 낚시 시도 XP
    xpPerRareFish:        10,    // 희귀어 XP
    xpPerTrapHarvest:     1,     // 통발 수확 XP
  },
};

export default BALANCE;
