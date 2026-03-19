// === DISEASE DEFINITIONS ===
// 8개 질병 정의. DiseaseSystem.js가 이를 참조하여 발병·진행·치료·사망을 처리.
//
// symptoms 필드:
//   hydrationDecayExtra  : TP당 수분 추가 감소량 (기본값 위에 추가)
//   nutritionDecayExtra  : TP당 영양 추가 감소량
//   fatiguePerTP         : TP당 피로 추가 증가
//   moralePerTP          : TP당 사기 변화 (음수 = 감소)
//   hpPerTP              : TP당 HP 변화 (음수 = 감소)
// treatmentTags: 아이템의 tags[]에 해당 태그가 있으면 치료

export const DISEASES = {

  // ── 감기 (Common Cold) ─────────────────────────────────────────
  // 가벼운 질환. 방치 시 독감으로 악화.
  common_cold: {
    id:        'common_cold',
    name:      '감기',
    icon:      '🤧',
    severity:  1,   // 1=경증, 2=중증, 3=위중
    description: '체온 저하 시 발생. 피로와 사기 저하. 방치 시 독감으로 악화.',
    durationDays: [3, 5],
    symptoms: {
      fatiguePerTP:    0.4,   // 피로 누적 +0.4/TP (↑0.3)
      moralePerTP:    -0.4,   // 사기 -0.4/TP (↑0.3)
      hpPerTP:        -0.1,   // HP 소폭 감소 (신규)
    },
    treatmentTags: ['antibiotic', 'vitamin'],
    treatmentItemIds: ['first_aid_kit', 'vitamins'],
    escalateDays: 5,   // 5일 방치 시 독감 악화 (↓7일)
    escalatesTo: 'influenza',
  },

  // ── 독감 (Influenza) ──────────────────────────────────────────
  // 중등도. 수분 소모 증가, HP 감소. 방치 시 치명적.
  influenza: {
    id:        'influenza',
    name:      '독감',
    icon:      '🤒',
    severity:  2,
    description: '고열과 전신 쇠약. 수분 소모 급증, HP 감소. 방치 7일 시 사망.',
    durationDays: [5, 8],
    symptoms: {
      hydrationDecayExtra: 2.0,   // 수분 추가 -2.0/TP (↑1.5)
      fatiguePerTP:  0.7,         // (↑0.5)
      moralePerTP:  -1.2,         // (↑1.0)
      hpPerTP:      -0.5,         // (↑0.3)
    },
    treatmentTags: ['antibiotic'],
    treatmentItemIds: ['antibiotics'],
    fatal: true,
    fatalDays: 7,   // 7일 방치 시 사망 (↓10일)
    deathCause: '독감 합병증',
  },

  // ── 이질 (Dysentery) ─────────────────────────────────────────
  // 오염 음식 섭취. 심한 탈수. 방치 시 치명적.
  dysentery: {
    id:        'dysentery',
    name:      '이질',
    icon:      '🤢',
    severity:  2,
    description: '오염된 음식 섭취. 심한 탈수와 영양 감소. 방치 6일 시 사망.',
    durationDays: [4, 7],
    symptoms: {
      hydrationDecayExtra: 3.0,   // 수분 추가 -3.0/TP (↑2.5)
      nutritionDecayExtra: 1.0,   // 영양 추가 -1.0/TP (↑0.8)
      hpPerTP: -0.7,              // (↑0.5)
    },
    treatmentTags: ['antibiotic', 'antidote'],
    treatmentItemIds: ['antibiotics', 'antidote'],
    fatal: true,
    fatalDays: 6,   // (↓8일)
    deathCause: '이질 탈수',
  },

  // ── 콜레라 (Cholera) ─────────────────────────────────────────
  // 심하게 오염된 물 섭취. 초고속 탈수. 매우 위험.
  cholera: {
    id:        'cholera',
    name:      '콜레라',
    icon:      '☠️',
    severity:  3,
    description: '오염된 물 섭취. 극도의 탈수. 방치 4일 시 사망. 즉각 치료 필요!',
    durationDays: [3, 5],
    symptoms: {
      hydrationDecayExtra: 6.0,   // 수분 추가 -6.0/TP (↑5.0)
      nutritionDecayExtra: 0.5,   // 구토 (신규)
      hpPerTP: -2.5,              // (↑2.0)
    },
    treatmentTags: ['antibiotic', 'antidote'],
    treatmentItemIds: ['antibiotics', 'antidote'],
    fatal: true,
    fatalDays: 4,   // (↓5일)
    deathCause: '콜레라 탈수',
  },

  // ── 저체온증 (Hypothermia) ────────────────────────────────────
  // 장시간 저온 노출. 캠프파이어로 체온 회복 시 완치.
  hypothermia: {
    id:        'hypothermia',
    name:      '저체온증',
    icon:      '🥶',
    severity:  2,
    description: '장시간 저체온. 피로 급증, HP 감소. 체온 45 이상 회복 시 완치.',
    durationDays: [1, 14],
    symptoms: {
      fatiguePerTP: 1.2,     // (↑1.0)
      moralePerTP: -1.2,     // (↑1.0)
      hpPerTP:     -0.7,     // (↑0.5)
    },
    treatmentTags: [],
    treatmentItemIds: [],
    healCondition: { tempAbove: 45 },
    fatal: true,
    fatalDays: 5,   // (↓7일)
    deathCause: '저체온증',
  },

  // ── 열사병 (Heatstroke) ──────────────────────────────────────
  // 고온 장시간 노출. 수분 소모 급증.
  heatstroke: {
    id:        'heatstroke',
    name:      '열사병',
    icon:      '🌡️',
    severity:  2,
    description: '과도한 체온 상승. 수분·HP 감소. 체온 60 이하로 내리면 완치.',
    durationDays: [1, 5],
    symptoms: {
      hydrationDecayExtra: 3.0,   // (↑2.5)
      moralePerTP: -2.5,          // (↑2.0)
      hpPerTP:     -1.2,          // (↑1.0)
    },
    treatmentTags: [],
    treatmentItemIds: ['purified_water', 'sports_drink'],
    healCondition: { tempBelow: 60 },
    fatal: true,
    fatalDays: 3,   // (↓4일)
    deathCause: '열사병',
  },

  // ── 패혈증 (Sepsis) ──────────────────────────────────────────
  // 감염 70 이상 방치 시 발병. 매우 치명적.
  sepsis: {
    id:        'sepsis',
    name:      '패혈증',
    icon:      '🦠',
    severity:  3,
    description: '감염 악화로 혈류 감염. HP 급감. 3일 방치 시 사망. 즉각 항생제 필요!',
    durationDays: [2, 4],
    symptoms: {
      hpPerTP:      -3.5,   // HP -3.5/TP (↑3.0)
      fatiguePerTP:  2.0,   // (↑1.5)
      moralePerTP:  -2.0,   // (↑1.5)
    },
    treatmentTags: ['antibiotic'],
    treatmentItemIds: ['antibiotics'],
    fatal: true,
    fatalDays: 3,   // (↓4일)
    deathCause: '패혈증',
  },

  // ── 방사선 질환 (Radiation Sickness) ────────────────────────
  // 방사선 60 이상 누적 시 발병.
  radiation_sickness: {
    id:        'radiation_sickness',
    name:      '방사선 질환',
    icon:      '☢️',
    severity:  2,
    description: '방사선 과다 피폭. HP 감소, 영양 손실 (구토). 방사선 차단제 필요.',
    durationDays: [5, 10],
    symptoms: {
      hpPerTP:             -1.5,   // (↑1.0)
      nutritionDecayExtra:  0.8,   // (↑0.5)
      moralePerTP:         -0.8,   // (↑0.5)
      fatiguePerTP:         0.3,   // 피로 (신규)
    },
    treatmentTags: ['rad_blocker'],
    treatmentItemIds: ['rad_blocker'],
    fatal: true,
    fatalDays: 7,   // (↓10일)
    deathCause: '방사선 질환',
  },

  // ══════════════════════════════════════════════════════════════
  //  전투 부상 질병 (Combat Injuries)
  // ══════════════════════════════════════════════════════════════

  // ── 출혈 (Bleeding) ─────────────────────────────────────────
  // 가장 흔한 전투 부상. 모든 피격 시 발생 가능.
  bleeding: {
    id:        'bleeding',
    name:      '출혈',
    icon:      '🩸',
    severity:  1,
    description: '상처에서 피가 흐른다. 방치하면 HP가 서서히 줄어든다. 붕대로 지혈 가능.',
    durationDays: [1, 3],
    symptoms: {
      hpPerTP:      -0.4,   // HP 지속 감소
      fatiguePerTP:  0.2,   // 약간의 피로
    },
    treatmentTags: ['bandage'],
    treatmentItemIds: ['bandage', 'first_aid_kit', 'gauze'],
    fatal: false,
    combatInjury: true,     // 전투 부상 표시
    triggerDamage: 0,       // 모든 피격에서 발생 가능
    triggerChance: 0.20,    // 20% 확률
  },

  // ── 깊은 열상 (Deep Laceration) ────────────────────────────
  // 큰 피해 시 발생. 감염 위험 + HP 대량 손실.
  deep_laceration: {
    id:        'deep_laceration',
    name:      '깊은 열상',
    icon:      '🔪',
    severity:  2,
    description: '깊은 찢어진 상처. HP 급감, 감염 위험. 구급상자 또는 소독+붕대 필요.',
    durationDays: [3, 5],
    symptoms: {
      hpPerTP:             -0.8,   // HP 빠른 감소
      hydrationDecayExtra:  0.5,   // 출혈로 수분 손실
      fatiguePerTP:         0.3,
    },
    treatmentTags: ['first_aid'],
    treatmentItemIds: ['first_aid_kit', 'antiseptic'],
    fatal: true,
    fatalDays: 6,
    deathCause: '과다출혈',
    combatInjury: true,
    triggerDamage: 15,      // 15+ 피해 시 발생
    triggerChance: 0.20,    // 20% 확률
  },

  // ── 골절 (Fracture) ────────────────────────────────────────
  // 강타 계열 적에게 큰 피해 시 발생. 행동 크게 제한.
  fracture: {
    id:        'fracture',
    name:      '골절',
    icon:      '🦴',
    severity:  2,
    description: '뼈가 부러졌다. 극심한 피로, 행동 불능에 가까움. 진통제로 증상 완화.',
    durationDays: [7, 14],
    symptoms: {
      fatiguePerTP:  1.5,   // 극심한 피로
      moralePerTP:  -0.8,   // 사기 저하
      hpPerTP:      -0.2,   // 미세 HP 감소
    },
    treatmentTags: [],
    treatmentItemIds: ['painkiller', 'first_aid_kit'],
    fatal: false,
    combatInjury: true,
    triggerDamage: 20,      // 20+ 피해 시 발생
    triggerChance: 0.15,    // 15% 확률
  },

  // ── 뇌진탕 (Concussion) ───────────────────────────────────
  // 중간 이상 피해 시 발생. 사기·피로에 영향.
  concussion: {
    id:        'concussion',
    name:      '뇌진탕',
    icon:      '💫',
    severity:  1,
    description: '머리에 강한 충격. 어지러움, 집중력 저하. 휴식이 필요하다.',
    durationDays: [2, 4],
    symptoms: {
      moralePerTP:  -1.0,   // 사기 급감
      fatiguePerTP:  0.6,   // 피로 증가
      hpPerTP:      -0.1,   // 미세 HP 감소
    },
    treatmentTags: [],
    treatmentItemIds: ['painkiller'],
    fatal: false,
    combatInjury: true,
    triggerDamage: 12,      // 12+ 피해 시 발생
    triggerChance: 0.10,    // 10% 확률
  },
};

export default DISEASES;
