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
    durationDays: [3, 5],   // 치료 시 3-5일 후 자연 회복
    symptoms: {
      fatiguePerTP:    0.3,   // 피로 누적 +0.3/TP
      moralePerTP:    -0.3,   // 사기 -0.3/TP
    },
    treatmentTags: ['antibiotic', 'vitamin'],  // 이 태그가 있는 아이템이 치료
    treatmentItemIds: ['first_aid_kit', 'vitamins'],
    // 7일 방치 시 독감으로 악화
    escalateDays: 7,
    escalatesTo: 'influenza',
  },

  // ── 독감 (Influenza) ──────────────────────────────────────────
  // 중등도. 수분 소모 증가, HP 감소. 방치 시 치명적.
  influenza: {
    id:        'influenza',
    name:      '독감',
    icon:      '🤒',
    severity:  2,
    description: '고열과 전신 쇠약. 수분 소모 급증, HP 감소. 방치 10일 시 사망.',
    durationDays: [5, 8],
    symptoms: {
      hydrationDecayExtra: 1.5,   // 수분 추가 -1.5/TP (기본 2.0에 추가)
      fatiguePerTP:  0.5,
      moralePerTP:  -1.0,
      hpPerTP:      -0.3,
    },
    treatmentTags: ['antibiotic'],
    treatmentItemIds: ['antibiotics'],
    fatal: true,
    fatalDays: 10,  // 10일 방치 시 사망
    deathCause: '독감 합병증',
  },

  // ── 이질 (Dysentery) ─────────────────────────────────────────
  // 오염 음식 섭취. 심한 탈수. 방치 시 치명적.
  dysentery: {
    id:        'dysentery',
    name:      '이질',
    icon:      '🤢',
    severity:  2,
    description: '오염된 음식 섭취. 심한 탈수와 영양 감소. 방치 8일 시 사망.',
    durationDays: [4, 7],
    symptoms: {
      hydrationDecayExtra: 2.5,   // 수분 추가 -2.5/TP
      nutritionDecayExtra: 0.8,   // 영양 추가 -0.8/TP
      hpPerTP: -0.5,
    },
    treatmentTags: ['antibiotic', 'antidote'],
    treatmentItemIds: ['antibiotics', 'antidote'],
    fatal: true,
    fatalDays: 8,
    deathCause: '이질 탈수',
  },

  // ── 콜레라 (Cholera) ─────────────────────────────────────────
  // 심하게 오염된 물 섭취. 초고속 탈수. 매우 위험.
  cholera: {
    id:        'cholera',
    name:      '콜레라',
    icon:      '☠️',
    severity:  3,
    description: '오염된 물 섭취. 극도의 탈수. 방치 5일 시 사망. 즉각 치료 필요!',
    durationDays: [3, 5],
    symptoms: {
      hydrationDecayExtra: 5.0,   // 수분 추가 -5.0/TP (극심한 탈수)
      hpPerTP: -2.0,
    },
    treatmentTags: ['antibiotic', 'antidote'],
    treatmentItemIds: ['antibiotics', 'antidote'],
    fatal: true,
    fatalDays: 5,
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
    durationDays: [1, 14],  // 체온 회복이 우선 — 기간은 상한선
    symptoms: {
      fatiguePerTP: 1.0,
      moralePerTP: -1.0,
      hpPerTP:     -0.5,
    },
    treatmentTags: [],        // 아이템 치료 없음 — 체온 회복으로만 완치
    treatmentItemIds: [],
    healCondition: { tempAbove: 45 },   // 체온 45 초과 시 자동 회복
    fatal: true,
    fatalDays: 7,
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
      hydrationDecayExtra: 2.5,
      moralePerTP: -2.0,
      hpPerTP:     -1.0,
    },
    treatmentTags: [],
    treatmentItemIds: ['purified_water', 'sports_drink'],
    healCondition: { tempBelow: 60 },   // 체온 60 미만 시 자동 회복
    fatal: true,
    fatalDays: 4,
    deathCause: '열사병',
  },

  // ── 패혈증 (Sepsis) ──────────────────────────────────────────
  // 감염 70 이상 방치 시 발병. 매우 치명적.
  sepsis: {
    id:        'sepsis',
    name:      '패혈증',
    icon:      '🦠',
    severity:  3,
    description: '감염 악화로 혈류 감염. HP 급감. 4일 방치 시 사망. 즉각 항생제 필요!',
    durationDays: [2, 4],
    symptoms: {
      hpPerTP:      -3.0,   // HP -3/TP — 매우 치명적
      fatiguePerTP:  1.5,
      moralePerTP:  -1.5,
    },
    treatmentTags: ['antibiotic'],
    treatmentItemIds: ['antibiotics'],
    fatal: true,
    fatalDays: 4,
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
      hpPerTP:             -1.0,
      nutritionDecayExtra:  0.5,   // 구토로 영양 추가 손실
      moralePerTP:         -0.5,
    },
    treatmentTags: ['rad_blocker'],
    treatmentItemIds: ['rad_blocker'],
    fatal: true,
    fatalDays: 10,
    deathCause: '방사선 질환',
  },
};

export default DISEASES;
