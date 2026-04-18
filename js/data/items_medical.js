// === ITEMS: MEDICAL (의료 아이템) ===
// 의료 소모품 — subtype 'medical' 또는 medical 태그 보유 소모품
// bandage~guard_stance_kit 제외, 순수 의료 23항목

const ITEMS_MEDICAL = {

  // ─── 기본 의료 (11) ────────────────────────────────────────

  bandage: {
    id: 'bandage', name: '붕대', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩹', description: '상처를 감아 출혈을 막는다.',
    onConsume: { hp: 15, infection: -5 },
    tags: ['medical', 'healing', 'bandage'],
    dismantle: [{ definitionId: 'cloth_scrap', qty: 2, chance: 0.8 }],
  },

  alcohol_swab: {
    id: 'alcohol_swab', name: '알코올 솜', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.02,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧴', description: '상처 소독용 알코올 솜. 초기 감염을 즉시 제거하고 출혈을 경감한다.',
    onConsume: { infection: -15, hp: 3 },
    tags: ['medical', 'antiseptic', 'bandage'],
    dismantle: [],
  },

  first_aid_kit: {
    id: 'first_aid_kit', name: '구급키트', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.6,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏥', description: '완전한 응급처치. HP, 감염 모두 치료.',
    onConsume: { hp: 50, infection: -30, morale: 10 },
    tags: ['medical', 'healing'],
    dismantle: [
      { definitionId: 'bandage', qty: 2, chance: 0.8 },
      { definitionId: 'antiseptic', qty: 1, chance: 0.6 },
      { definitionId: 'gauze', qty: 2, chance: 0.7 },
    ],
  },

  antiseptic: {
    id: 'antiseptic', name: '소독약', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '상처 감염을 예방. 감염 수치 감소.',
    onConsume: { infection: -20, hp: 5 },
    tags: ['medical', 'antiseptic'],
    dismantle: [],
  },

  painkiller: {
    id: 'painkiller', name: '진통제', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '통증 감소. HP 소폭 회복, 전투 집중력 향상.',
    onConsume: { hp: 10, morale: 10, fatigue: -10 },
    tags: ['medical', 'stimulant'],
    dismantle: [],
  },

  antibiotics: {
    id: 'antibiotics', name: '항생제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '박테리아 감염 치료. 감염 수치를 크게 낮춘다.',
    onConsume: { infection: -45 },
    tags: ['medical', 'antibiotic'],
    dismantle: [],
  },

  rad_blocker: {
    id: 'rad_blocker', name: '방사선차단제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☢️', description: '방사선을 대폭 감소. 고방사선 구역 생존 필수.',
    onConsume: { radiation: -40 },
    tags: ['medical', 'radiation'],
    dismantle: [],
  },

  splint: {
    id: 'splint', name: '부목', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🦴', description: '골절 등 중상 치료. 피로 감소 효과.',
    onConsume: { hp: 20, fatigue: -20 },
    tags: ['medical', 'healing'],
    dismantle: [
      { definitionId: 'wood', qty: 1, chance: 0.7 },
      { definitionId: 'cloth_scrap', qty: 2, chance: 0.8 },
    ],
  },

  surgery_kit: {
    id: 'surgery_kit', name: '수술키트', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔬', description: '외과 수술 도구 세트. 치명상 치료 가능.',
    onConsume: { hp: 80, infection: -50, radiation: -20 },
    tags: ['medical', 'healing', 'surgery'],
    dismantle: [
      { definitionId: 'antiseptic', qty: 2, chance: 0.7 },
      { definitionId: 'gauze', qty: 3, chance: 0.8 },
      { definitionId: 'sharp_blade', qty: 1, chance: 0.5 },
    ],
  },

  antidote: {
    id: 'antidote', name: '해독제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '독 상태이상 즉시 제거. 산성 공격에도 효과.',
    onConsume: { infection: -30, hp: 15 },
    tags: ['medical', 'antidote'],
    dismantle: [],
  },

  stimulant: {
    id: 'stimulant', name: '각성제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚡', description: '즉각적인 피로 회복. 전투 능력 일시 상승.',
    onConsume: { fatigue: -50, morale: 20, hp: 10 },
    tags: ['medical', 'stimulant'],
    dismantle: [],
  },

  // ─── 의료 음료·식량 (medical 태그) (3) ─────────────────────

  herbal_tea: {
    id: 'herbal_tea', name: '허브차', type: 'consumable', subtype: 'drink',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍵', description: '야생 허브를 끓여 만든 차. 근육을 이완시키고 체력을 소폭 회복.',
    onConsume: { stamina: 20, fatigue: -10, morale: 5, hydration: 15 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['drinkable', 'medical', 'stamina', 'crafted'],
    dismantle: [],
  },

  stamina_tonic: {
    id: 'stamina_tonic', name: '활력 강장제', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧉', description: '허브차를 농축 추출한 강장제. 빠른 체력 회복에 유용.',
    onConsume: { stamina: 45, fatigue: -20, morale: 10 },
    leaveOnConsume: { definitionId: 'empty_bottle', qty: 1 },
    tags: ['medical', 'stamina', 'crafted'],
    dismantle: [{ definitionId: 'herbal_tea', qty: 1, chance: 0.5 }],
  },

  battle_ration: {
    id: 'battle_ration', name: '전투 식량팩', type: 'consumable', subtype: 'food',
    rarity: 'rare', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪖', description: '특수 제조된 군용 전투 식량. 스태미나·체력·영양을 한 번에 회복.',
    onConsume: { stamina: 80, fatigue: -35, hp: 15, nutrition: 25, morale: 15 },
    tags: ['edible', 'medical', 'stamina', 'crafted', 'food'],
    dismantle: [
      { definitionId: 'stamina_tonic', qty: 1, chance: 0.4 },
      { definitionId: 'energy_bar',    qty: 1, chance: 0.6 },
    ],
  },

  // ─── 비밀 조합 결과물 — 의료 (2) ──────────────────────────

  herbal_medicine: {
    id: 'herbal_medicine', name: '한방 치료제', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2, stackable: true, maxStack: 5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '비타민과 정수로 만든 민간요법 치료제.',
    onConsume: { infection: -20, morale: 10 },
    tags: ['medical', 'healing'], dismantle: [],
  },
  strong_painkiller: {
    id: 'strong_painkiller', name: '강력 진통제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1, stackable: true, maxStack: 3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '진통제와 스포츠 음료를 섞은 강력 진통제.',
    onConsume: { morale: 15, fatigue: -10 },
    tags: ['medical'], dismantle: [],
  },

  // ─── 크래프팅 체인 확장 — 의료 (8) ────────────────────────

  crude_medicine: {
    id: 'crude_medicine', name: '조제 약', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '약초로 만든 조잡한 약. 없는 것보단 낫다.',
    onConsume: { hp: 15, infection: -10 },
    tags: ['medical', 'healing'],
    dismantle: [],
  },

  purified_medicine: {
    id: 'purified_medicine', name: '정제 약', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '정제 과정을 거친 약. 효능이 확실하다.',
    onConsume: { hp: 30, infection: -20 },
    tags: ['medical', 'healing'],
    dismantle: [],
  },

  synthetic_antibiotics: {
    id: 'synthetic_antibiotics', name: '합성 항생제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '합성한 항생제. 심각한 감염도 치료한다.',
    onConsume: { hp: 20, infection: -40 },
    tags: ['medical', 'antibiotic'],
    dismantle: [],
  },

  universal_cure: {
    id: 'universal_cure', name: '만병통치약', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '✨', description: '전설적인 합성약. 거의 모든 질병을 치료한다.',
    onConsume: { hp: 50, infection: -50, morale: 20 },
    tags: ['medical', 'healing'],
    dismantle: [],
  },

  anesthetic: {
    id: 'anesthetic', name: '마취제', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '통증을 억제하는 마취제. 수술 전 필수.',
    onConsume: { hp: 0, morale: 5 },
    tags: ['medical', 'anesthetic'],
    dismantle: [],
  },

  surgical_anesthetic: {
    id: 'surgical_anesthetic', name: '수술용 마취제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '고순도 마취제. 복잡한 수술에도 사용 가능.',
    onConsume: { hp: 0, morale: 10 },
    tags: ['medical', 'anesthetic'],
    dismantle: [],
  },

  detox_potion: {
    id: 'detox_potion', name: '해독제', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '체내 독소를 중화하는 해독 물약.',
    onConsume: { hp: 10, infection: -15, contamination: -20 },
    tags: ['medical', 'antidote'],
    dismantle: [],
  },

  rad_flush: {
    id: 'rad_flush', name: '방사능 해독제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '☢️', description: '방사능 오염을 급속히 제거하는 특수 약제.',
    onConsume: { hp: 5, contamination: -40 },
    tags: ['medical', 'radiation'],
    dismantle: [],
  },

  // ─── 의료 체인 — 의사 특화 (Sprint 4, 4종) ─────────────────

  herbal_extract: {
    id: 'herbal_extract', name: '약초 추출액', type: 'consumable', subtype: 'medical',
    rarity: 'common', weight: 0.15,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧃', description: '약초를 달여 농축한 기초 추출액. 단독 복용해도 경미한 항균 효과.',
    onConsume: { hp: 8, infection: -5 },
    tags: ['medical', 'herbal', 'crafted'],
    dismantle: [{ definitionId: 'herb', qty: 1, chance: 0.6 }],
  },

  concentrated_serum: {
    id: 'concentrated_serum', name: '농축 혈청', type: 'consumable', subtype: 'medical',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧬', description: '추출액을 정제·농축한 혈청. 의사의 손을 거쳐야만 만들어진다.',
    onConsume: { hp: 25, infection: -20 },
    tags: ['medical', 'serum', 'crafted'],
    dismantle: [{ definitionId: 'herbal_extract', qty: 1, chance: 0.5 }],
  },

  broad_antibiotic: {
    id: 'broad_antibiotic', name: '광범위 항생제', type: 'consumable', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💉', description: '혈청과 항생제를 결합한 광범위 항생제. 다양한 감염원에 유효.',
    onConsume: { hp: 25, infection: -55 },
    tags: ['medical', 'antibiotic', 'crafted'],
    dismantle: [
      { definitionId: 'concentrated_serum', qty: 1, chance: 0.4 },
      { definitionId: 'antibiotics',        qty: 1, chance: 0.4 },
    ],
  },

  infected_blood_sample: {
    id: 'infected_blood_sample', name: '감염 혈액 표본', type: 'material', subtype: 'medical',
    rarity: 'rare', weight: 0.1,
    defaultDurability: 100, defaultContamination: 30,
    icon: '🩸', description: '감염자에게서 채취한 혈액 표본. 백신·치료제 합성의 핵심 원료.',
    tags: ['medical', 'sample', 'research'],
    dismantle: [],
  },

  // ─── Sprint 5: 엔드게임 백신 ───────────────────────────────

  plague_vaccine: {
    id: 'plague_vaccine', name: '역병 백신', type: 'consumable', subtype: 'medical',
    rarity: 'legendary', weight: 0.1, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💠', description: '0번 환자 표본에서 추출한 항원과 광범위 항생제로 합성한 백신. 감염 진행을 완전히 차단한다.',
    onConsume: { hp: 30, infection: -100, morale: 40 },
    tags: ['medical', 'vaccine', 'legendary', 'crafted'],
    dismantle: [],
  },
};

export default ITEMS_MEDICAL;
