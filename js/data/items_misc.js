// === ITEMS: MISC (의료·도구·구조물·특수) ===
// 의료 13 + 도구 10 + 구조물 10 + 환경오브젝트 22 + 가방 5 + 특수 6 = 66 items

const ITEMS_MISC = {

  // ─── 의료 (10) ────────────────────────────────────────────

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

  // ─── 도구 (10) ────────────────────────────────────────────

  flashlight: {
    id: 'flashlight', name: '손전등', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔦', description: '어두운 공간 탐색 시 발견 확률 +20%.',
    tags: ['tool', 'exploration', 'light'],
    onUse: { exploreBonus: 20 },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.8 },
    ],
  },

  water_filter: {
    id: 'water_filter', name: '정수 필터', type: 'tool', subtype: 'crafting',
    rarity: 'uncommon', weight: 0.2,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔩', description: '정수기 제작에 사용. 오염수를 정화.',
    tags: ['tool', 'craftable'],
    dismantle: [
      { definitionId: 'charcoal_filter', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
    ],
  },

  pipe_wrench: {
    id: 'pipe_wrench', name: '파이프렌치', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🔧', description: '수리·제작 도구. 강화 무기 제작에 필요.',
    tags: ['tool'],
    combat: { damage: [4, 8], accuracy: 0.75, noiseOnUse: 3, durabilityLoss: 2, critChance: 0.10, critMultiplier: 1.5 },
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.9 }],
  },

  lockpick: {
    id: 'lockpick', name: '자물쇠따개', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🗝️', description: '잠긴 문을 개방. 탐색 가능 장소 확대.',
    tags: ['tool', 'utility'],
    onUse: { unlockBonus: 1 },
    dismantle: [{ definitionId: 'wire', qty: 1, chance: 0.8 }],
  },

  gas_mask: {
    id: 'gas_mask', name: '방독면', type: 'tool', subtype: 'protection',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 80, defaultContamination: 0,
    icon: '😷', description: '유독 가스·오염 공기 차단. 필터 교체 필요.',
    tags: ['tool', 'protection'],
    onWear: { radiationMult: 0.50, infectionMult: 0.60 },
    dismantle: [
      { definitionId: 'rubber', qty: 1, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.6 },
    ],
  },

  binoculars: {
    id: 'binoculars', name: '쌍안경', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.4,
    defaultDurability: 70, defaultContamination: 0,
    icon: '🔭', description: '먼 거리 정찰. 위험도를 미리 파악 가능.',
    tags: ['tool', 'utility', 'scouting'],
    onUse: { scoutBonus: 1 },
    dismantle: [
      { definitionId: 'glass_shard', qty: 2, chance: 0.7 },
      { definitionId: 'plastic', qty: 1, chance: 0.8 },
    ],
  },

  radio: {
    id: 'radio', name: '무전기', type: 'tool', subtype: 'communication',
    rarity: 'rare', weight: 0.5,
    defaultDurability: 70, defaultContamination: 0,
    icon: '📻', description: '생존자 주파수 감지. 특수 이벤트 발생 가능.',
    tags: ['tool', 'communication'],
    onUse: { survivorSignal: true },
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
    ],
  },

  lighter: {
    id: 'lighter', name: '라이터', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 5, defaultContamination: 0,
    icon: '🔥', description: '불꽃을 만드는 도구. 내구도 1 소모당 불꽃 1회 생성. 연료가 다 떨어지면 못 쓴다. 희귀해진 세상에서는 소중히 아껴야 한다.',
    tags: ['tool', 'fire', 'light'],
    onUse: { fireStart: true, durabilityPerUse: 1 },
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  compass: {
    id: 'compass', name: '나침반', type: 'tool', subtype: 'navigation',
    rarity: 'uncommon', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧭', description: '방향 감각 유지. 이동 시 조우 확률 소폭 감소.',
    tags: ['tool', 'navigation'],
    onUse: { encounterReduction: 0.10 },
    dismantle: [],
  },

  whetstone: {
    id: 'whetstone', name: '숫돌', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🪨', description: '무기의 날을 세운다. 근접무기 데미지 강화에 사용.',
    tags: ['tool', 'utility'],
    dismantle: [],
  },

  rope_ladder: {
    id: 'rope_ladder', name: '로프사다리', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 1.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🪜', description: '고층 진입 및 탈출용 사다리. 특수 탐색 가능.',
    tags: ['tool', 'utility', 'crafted'],
    onUse: { highGroundAccess: true },
    dismantle: [
      { definitionId: 'rope', qty: 2, chance: 0.8 },
      { definitionId: 'wood', qty: 1, chance: 0.6 },
    ],
  },

  // ─── 구조물 (10) + 해체 가능 환경 오브젝트 (22) ───────────

  campfire: {
    id: 'campfire', name: '캠프파이어', type: 'structure', subtype: 'heat',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🔥', description: '돌을 쌓고 장작을 얹어 피운 화롯불. 온도 회복·요리·숯 생산에 사용. 비·눈에 꺼질 수 있음.',
    tags: ['structure', 'heat', 'light'],
    onTick: { temperature: 2, noise: 3 },
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'pebble', qty: 2, chance: 0.8 },
      { definitionId: 'kindling', qty: 1, chance: 0.5 },
      { definitionId: 'wood_bark', qty: 1, chance: 0.4 },
    ],
  },

  campfire_temp: {
    id: 'campfire_temp', name: '임시 화톳불', type: 'structure', subtype: 'heat',
    rarity: 'common', weight: 0.5,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🔥', description: '긴급 상황에서 급조한 화톳불. 3턴만 지속되며 비·눈에 바로 꺼진다. 요리 가능.',
    tags: ['structure', 'heat', 'temp'],
    onTick: { temperature: 1, noise: 2 },
    dismantleTP: 0,
    dismantle: [
      { definitionId: 'kindling', qty: 1, chance: 0.4 },
    ],
  },

  wind_stove: {
    id: 'wind_stove', name: '방풍 화로', type: 'structure', subtype: 'heat',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '♨️', description: '고철과 돌로 만든 방풍 화로. 비·눈에도 꺼지지 않으며 연료 소모가 적다. 요리·숯 생산 가능.',
    tags: ['structure', 'heat', 'crafted', 'weather_resistant'],
    onTick: { temperature: 2, noise: 2 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'pebble', qty: 3, chance: 0.7 },
    ],
  },

  water_purifier: {
    id: 'water_purifier', name: '정수기', type: 'structure', subtype: 'utility',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚰', description: '오염수를 정수. 인접 물병 자동 정화.',
    tags: ['structure', 'crafted'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'water_filter', qty: 1, chance: 0.5 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  barricade: {
    id: 'barricade', name: '바리케이드', type: 'structure', subtype: 'defense',
    rarity: 'common', weight: 4.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🚧', description: '입구를 막는 방어선. 적 조우 확률 감소.',
    tags: ['structure', 'defense', 'crafted'],
    onTick: { encounterReduction: 0.10 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.6 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
    ],
  },

  alarm_trap: {
    id: 'alarm_trap', name: '경보 트랩', type: 'structure', subtype: 'trap',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔔', description: '적 접근 시 경보 발생. 기습 방지.',
    tags: ['structure', 'trap', 'crafted'],
    onTrigger: { earlyWarning: true, noise: 20 },
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.8 },
      { definitionId: 'empty_can', qty: 1, chance: 0.9 },
    ],
  },

  spike_trap: {
    id: 'spike_trap', name: '가시 트랩', type: 'structure', subtype: 'trap',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 80, defaultContamination: 0,
    icon: '⚠️', description: '적 접근 시 자동 피해. 철파이프와 못으로 제작.',
    tags: ['structure', 'trap', 'crafted'],
    onTrigger: { damage: 20, bleed: true },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'iron_pipe', qty: 1, chance: 0.6 },
      { definitionId: 'nail', qty: 5, chance: 0.7 },
      { definitionId: 'wood', qty: 1, chance: 0.7 },
    ],
  },

  medical_station: {
    id: 'medical_station', name: '의무 거점', type: 'structure', subtype: 'medical',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛺', description: 'TP당 HP를 자동 회복. 감염 저항 강화.',
    tags: ['structure', 'medical', 'crafted'],
    onTick: { hp: 3, infection: -1 },
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'bandage', qty: 3, chance: 0.7 },
      { definitionId: 'wood', qty: 2, chance: 0.7 },
    ],
  },

  workbench: {
    id: 'workbench', name: '작업대', type: 'structure', subtype: 'craft',
    rarity: 'uncommon', weight: 5.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪚', description: '복잡한 제작을 가능하게 한다. 일부 레시피 필수.',
    tags: ['structure', 'crafted'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 4, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  storage_box: {
    id: 'storage_box', name: '저장 상자', type: 'structure', subtype: 'storage',
    rarity: 'common', weight: 2.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '📦', description: '아이템을 안전하게 보관. 인벤토리 확장 효과.',
    tags: ['structure', 'storage', 'crafted'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.6 },
    ],
  },

  garden: {
    id: 'garden', name: '텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 72, defaultContamination: 0,
    icon: '🌱', description: '식량을 자급자족. 내구도가 떨어지면 다시 심어야 한다.',
    tags: ['structure', 'crafted'],
    onTick: { nutrition: 0.4, noise: 1 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  rain_collector: {
    id: 'rain_collector', name: '빗물 수집기', type: 'structure', subtype: 'water',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 160, defaultContamination: 0,
    icon: '🪣', description: '빗물을 모아 수분을 보충한다. 겨울에는 눈을 녹여 소량 확보.',
    tags: ['structure', 'crafted'],
    onTick: { hydration: 0.3 },
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'empty_bottle', qty: 1, chance: 0.8 },
      { definitionId: 'cloth', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 소형 (6) ──────────────────

  broken_radio: {
    id: 'broken_radio', name: '고장난 라디오', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 1.0,
    defaultDurability: 40, defaultContamination: 0,
    icon: '📻', description: '전파가 터지지 않는 낡은 라디오. 부품으로 쓸모가 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'wire', qty: 1, chance: 0.6 },
      { definitionId: 'plastic', qty: 1, chance: 0.5 },
    ],
  },

  rusted_toolbox: {
    id: 'rusted_toolbox', name: '녹슨 공구함', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 2.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🧰', description: '녹이 슬었지만 안에 쓸만한 부품이 남아있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'nail', qty: 3, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.4 },
    ],
  },

  broken_lamp: {
    id: 'broken_lamp', name: '부서진 가로등', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 3.0,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🪫', description: '기울어진 가로등. 금속과 전선을 회수할 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.6 },
    ],
  },

  old_mailbox: {
    id: 'old_mailbox', name: '낡은 우체통', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '📮', description: '빨간 우체통. 두꺼운 철판으로 만들어져 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.9 },
      { definitionId: 'nail', qty: 2, chance: 0.5 },
    ],
  },

  broken_chair: {
    id: 'broken_chair', name: '부서진 의자', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 2.0,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🪑', description: '다리가 부러진 의자. 목재와 천 조각을 얻을 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'nail', qty: 2, chance: 0.6 },
      { definitionId: 'cloth_scrap', qty: 1, chance: 0.5 },
    ],
  },

  old_fire_extinguisher: {
    id: 'old_fire_extinguisher', name: '소화기', type: 'structure', subtype: 'salvage',
    rarity: 'common', weight: 2.5,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🧯', description: '압력이 빠진 소화기. 금속 용기와 부품을 회수.',
    tags: ['structure', 'salvage'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 1, chance: 0.9 },
      { definitionId: 'rubber', qty: 1, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.4 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 중형 (8) ──────────────────

  abandoned_fridge: {
    id: 'abandoned_fridge', name: '버려진 냉장고', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 8.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🧊', description: '전기가 끊긴 냉장고. 금속과 단열재가 풍부하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'wire', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.6 },
      { definitionId: 'plastic', qty: 1, chance: 0.5 },
    ],
  },

  wrecked_bicycle: {
    id: 'wrecked_bicycle', name: '잔해 자전거', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 5.0,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🚲', description: '바퀴가 빠진 자전거. 체인과 기어에서 금속을 얻는다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'wire', qty: 1, chance: 0.7 },
      { definitionId: 'rubber', qty: 2, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.5 },
    ],
  },

  old_generator: {
    id: 'old_generator', name: '폐발전기', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 10.0,
    defaultDurability: 60, defaultContamination: 0,
    icon: '⚡', description: '연료가 바닥난 소형 발전기. 전자부품이 쓸만하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.6 },
      { definitionId: 'spring', qty: 1, chance: 0.4 },
    ],
  },

  collapsed_shelf: {
    id: 'collapsed_shelf', name: '무너진 선반', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 6.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🗄️', description: '상점에서 무너진 진열대. 목재와 못을 회수할 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 3, chance: 0.8 },
      { definitionId: 'nail', qty: 5, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.5 },
    ],
  },

  broken_washing_machine: {
    id: 'broken_washing_machine', name: '고장난 세탁기', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 10.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🫧', description: '드럼 세탁기 잔해. 스프링과 금속이 풍부하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'rubber', qty: 2, chance: 0.6 },
      { definitionId: 'wire', qty: 1, chance: 0.5 },
      { definitionId: 'spring', qty: 2, chance: 0.5 },
    ],
  },

  street_vendor_cart: {
    id: 'street_vendor_cart', name: '포장마차 잔해', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 7.0,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🏮', description: '포장마차의 잔해. 천막과 골조를 분해할 수 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood', qty: 2, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
      { definitionId: 'cloth', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.4 },
    ],
  },

  traffic_light: {
    id: 'traffic_light', name: '교통 신호등', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 8.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🚦', description: '쓰러진 신호등. 전자 부품과 금속 회수.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.5 },
    ],
  },

  vending_machine: {
    id: 'vending_machine', name: '자판기 잔해', type: 'structure', subtype: 'salvage',
    rarity: 'uncommon', weight: 12.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥫', description: '부서진 자판기. 두꺼운 철판과 전자부품이 있다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'electronic_parts', qty: 1, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.7 },
      { definitionId: 'plastic', qty: 2, chance: 0.5 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 대형 (5) ──────────────────

  wrecked_car: {
    id: 'wrecked_car', name: '폐차', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 20.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🚗', description: '도로에 버려진 차량. 금속과 부품이 대량으로 나온다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 5, chance: 0.8 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'rubber', qty: 2, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.5 },
      { definitionId: 'leather', qty: 1, chance: 0.4 },
      { definitionId: 'spring', qty: 2, chance: 0.4 },
    ],
  },

  collapsed_scaffold: {
    id: 'collapsed_scaffold', name: '무너진 비계', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 25.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏗️', description: '공사 현장의 무너진 비계. 대량의 파이프와 철사.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 6, chance: 0.8 },
      { definitionId: 'wire', qty: 3, chance: 0.7 },
      { definitionId: 'rope', qty: 2, chance: 0.5 },
    ],
  },

  old_ac_unit: {
    id: 'old_ac_unit', name: '에어컨 실외기', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 15.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '❄️', description: '벽에 매달린 실외기. 구리선과 압축기 부품이 귀하다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'electronic_parts', qty: 2, chance: 0.6 },
      { definitionId: 'wire', qty: 2, chance: 0.7 },
      { definitionId: 'rubber', qty: 1, chance: 0.5 },
    ],
  },

  subway_gate: {
    id: 'subway_gate', name: '지하철 개찰구', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 18.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚇', description: '지하철역의 개찰구. 센서와 금속이 풍부.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'electronic_parts', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 3, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.5 },
    ],
  },

  telephone_booth: {
    id: 'telephone_booth', name: '공중전화 부스', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 15.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '☎️', description: '유리와 금속 프레임의 공중전화.',
    tags: ['structure', 'salvage'],
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.6 },
      { definitionId: 'electronic_parts', qty: 1, chance: 0.5 },
    ],
  },

  // ─── 해체 가능 환경 오브젝트 — 초대형 (3) ────────────────

  wrecked_bus: {
    id: 'wrecked_bus', name: '버스 잔해', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 30.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🚌', description: '전복된 시내버스. 해체에 오래 걸리지만 자원이 풍부.',
    tags: ['structure', 'salvage'],
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 8, chance: 0.8 },
      { definitionId: 'glass_shard', qty: 3, chance: 0.6 },
      { definitionId: 'rubber', qty: 3, chance: 0.7 },
      { definitionId: 'wire', qty: 2, chance: 0.5 },
      { definitionId: 'leather', qty: 2, chance: 0.4 },
      { definitionId: 'spring', qty: 2, chance: 0.4 },
    ],
  },

  destroyed_kiosk: {
    id: 'destroyed_kiosk', name: '파괴된 매점', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 20.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🏪', description: '편의점 잔해. 진열대와 간판에서 재료를 얻는다.',
    tags: ['structure', 'salvage'],
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood', qty: 4, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'glass_shard', qty: 2, chance: 0.6 },
      { definitionId: 'plastic', qty: 2, chance: 0.5 },
      { definitionId: 'nail', qty: 5, chance: 0.5 },
    ],
  },

  collapsed_guard_post: {
    id: 'collapsed_guard_post', name: '무너진 초소', type: 'structure', subtype: 'salvage',
    rarity: 'rare', weight: 20.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛖', description: '군/경비 초소의 잔해. 목재와 철판이 풍부.',
    tags: ['structure', 'salvage'],
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood', qty: 5, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.7 },
      { definitionId: 'nail', qty: 8, chance: 0.6 },
      { definitionId: 'glass_shard', qty: 1, chance: 0.5 },
      { definitionId: 'wire', qty: 1, chance: 0.4 },
    ],
  },

  // ─── 가방 (5) ─────────────────────────────────────────────

  small_bag: {
    id: 'small_bag', name: '작은 가방', type: 'tool', subtype: 'bag',
    rarity: 'common', weight: 0.3,
    defaultDurability: 80, defaultContamination: 0,
    icon: '👜', description: '소형 가방. 장착 시 인벤토리 3칸 확장.',
    tags: ['tool', 'bag'],
    bagSlots: 3,
    dismantle: [
      { definitionId: 'cloth', qty: 2, chance: 0.8 },
      { definitionId: 'rope', qty: 1, chance: 0.5 },
    ],
  },

  messenger_bag: {
    id: 'messenger_bag', name: '메신저백', type: 'tool', subtype: 'bag',
    rarity: 'common', weight: 0.5,
    defaultDurability: 75, defaultContamination: 0,
    icon: '💼', description: '어깨에 메는 가방. 장착 시 인벤토리 4칸 확장.',
    tags: ['tool', 'bag'],
    bagSlots: 4,
    dismantle: [
      { definitionId: 'leather', qty: 1, chance: 0.7 },
      { definitionId: 'cloth', qty: 2, chance: 0.7 },
    ],
  },

  backpack: {
    id: 'backpack', name: '배낭', type: 'tool', subtype: 'bag',
    rarity: 'uncommon', weight: 1.0,
    defaultDurability: 90, defaultContamination: 0,
    icon: '🎒', description: '든든한 배낭. 장착 시 인벤토리 5칸 확장.',
    tags: ['tool', 'bag', 'crafted'],
    bagSlots: 5,
    dismantle: [
      { definitionId: 'cloth', qty: 3, chance: 0.8 },
      { definitionId: 'leather', qty: 1, chance: 0.6 },
      { definitionId: 'rope', qty: 1, chance: 0.6 },
    ],
  },

  duffel_bag: {
    id: 'duffel_bag', name: '더플백', type: 'tool', subtype: 'bag',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 85, defaultContamination: 0,
    icon: '🧳', description: '대형 더플백. 장착 시 인벤토리 6칸 확장.',
    tags: ['tool', 'bag', 'crafted'],
    bagSlots: 6,
    dismantle: [
      { definitionId: 'cloth', qty: 4, chance: 0.8 },
      { definitionId: 'rope', qty: 2, chance: 0.6 },
      { definitionId: 'leather', qty: 1, chance: 0.5 },
    ],
  },

  military_bag: {
    id: 'military_bag', name: '군용 배낭', type: 'tool', subtype: 'bag',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪖', description: '군용 전술 배낭. 장착 시 인벤토리 7칸 확장.',
    tags: ['tool', 'bag'],
    bagSlots: 7,
    dismantle: [
      { definitionId: 'cloth', qty: 3, chance: 0.7 },
      { definitionId: 'leather', qty: 2, chance: 0.7 },
      { definitionId: 'rope', qty: 2, chance: 0.6 },
    ],
  },

  // ─── 특수 (6) ─────────────────────────────────────────────

  fuel_can: {
    id: 'fuel_can', name: '연료통', type: 'special', subtype: 'resource',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⛽', description: '발전기·차량에 사용되는 연료. 화염병 제작 원료.',
    tags: ['special', 'fuel'],
    dismantle: [],
  },

  map_fragment: {
    id: 'map_fragment', name: '지도 조각', type: 'special', subtype: 'document',
    rarity: 'rare', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', description: '서울 지도의 일부. 모으면 새 지역이 개방된다.',
    tags: ['special', 'collectible'],
    dismantle: [],
  },

  survivor_note: {
    id: 'survivor_note', name: '생존자 메모', type: 'special', subtype: 'document',
    rarity: 'uncommon', weight: 0.01,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📝', description: '이전 생존자의 기록. 사기를 높이고 단서를 제공.',
    onConsume: { morale: 15 },
    tags: ['special', 'document'],
    dismantle: [],
  },

  emergency_kit: {
    id: 'emergency_kit', name: '비상키트', type: 'special', subtype: 'medical',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🆘', description: '위기 상황 대응 완전 세트. 최고의 응급 도구.',
    onConsume: { hp: 60, infection: -40, radiation: -20, fatigue: -30, morale: 20 },
    tags: ['special', 'medical', 'healing'],
    dismantle: [
      { definitionId: 'first_aid_kit', qty: 1, chance: 0.7 },
      { definitionId: 'painkiller', qty: 2, chance: 0.8 },
    ],
  },

  flashbang: {
    id: 'flashbang', name: '섬광탄', type: 'weapon', subtype: 'throwable',
    rarity: 'rare', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💥', description: '섬광으로 적 기절. 도주·은신 성공률 대폭 상승.',
    tags: ['special', 'throwable'],
    combat: {
      damage: [0, 0], accuracy: 1.0, noiseOnUse: 25, durabilityLoss: 100,
      statusInflict: { id: 'stun', name: '기절', duration: 1, effect: { skipTurn: true }, chance: 0.70 },
    },
    dismantle: [],
  },

  premium_ration: {
    id: 'premium_ration', name: '군용 식량 (고급)', type: 'consumable', subtype: 'food',
    rarity: 'legendary', weight: 0.4,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥗', description: '특수부대용 고급 전투 식량. 모든 수치 대폭 회복.',
    onConsume: { nutrition: 80, hydration: 50, morale: 30, fatigue: -30, hp: 20 },
    tags: ['special', 'food', 'military'],
    dismantle: [],
  },

  // ═══ 비밀 조합 결과물 (secretCombinations.js 참조) ═══════════

  fishing_rod: {
    id: 'fishing_rod', name: '낚싯대', type: 'tool', subtype: 'tool',
    rarity: 'uncommon', weight: 1.5, stackable: false, maxStack: 1,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🎣', description: '즉석 낚싯대. 한강 인접 구역에서 물고기를 잡을 수 있다.',
    tags: ['tool'], dismantle: [{ definitionId: 'rope', qty: 1, chance: 0.5 }],
  },
  torch: {
    id: 'torch', name: '횃불', type: 'tool', subtype: 'tool',
    rarity: 'common', weight: 0.8, stackable: false, maxStack: 1,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🔥', description: '나무와 천으로 만든 횃불. 어두운 곳에서 시야를 확보한다.',
    tags: ['tool', 'light'], dismantle: [],
  },
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
  reinforced_shield: {
    id: 'reinforced_shield', name: '강화 방패', type: 'weapon', subtype: 'shield',
    rarity: 'rare', weight: 4.0, stackable: false, maxStack: 1,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🛡️', description: '고철로 보강한 방패. 높은 방어력.',
    combat: { damage: [0, 0], accuracy: 0, defense: 25, noiseOnAttack: 1 },
    tags: ['shield', 'defense'],
    equipSlot: 'offhand',
    dismantle: [{ definitionId: 'scrap_metal', qty: 2, chance: 0.7 }],
  },
  fire_bolt: {
    id: 'fire_bolt', name: '화염 볼트', type: 'consumable', subtype: 'ammo',
    rarity: 'uncommon', weight: 0.1, stackable: true, maxStack: 10,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔥', description: '불에 담근 크로스보우 볼트. 추가 화상 데미지.',
    tags: ['ammo', 'ranged'], dismantle: [],
  },
  survival_journal: {
    id: 'survival_journal', name: '생존 일지', type: 'tool', subtype: 'tool',
    rarity: 'uncommon', weight: 0.3, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📓', description: '기록은 생존의 증거. 매일 사용하면 트라우마·외로움 감소.',
    tags: ['tool', 'mental'], dismantle: [],
  },
  water_trap: {
    id: 'water_trap', name: '물 함정', type: 'structure', subtype: '구조물',
    rarity: 'uncommon', weight: 1.0, stackable: false, maxStack: 1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🪤', description: '빗물을 자동 수집하는 간이 장치.',
    tags: ['structure'], dismantle: [{ definitionId: 'rope', qty: 1, chance: 0.5 }],
  },
  oil_lamp: {
    id: 'oil_lamp', name: '기름 램프', type: 'tool', subtype: 'tool',
    rarity: 'common', weight: 0.5, stackable: false, maxStack: 1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🏮', description: '깡통과 천으로 만든 조명. 야간 탐색 효율 증가.',
    tags: ['tool', 'light'], dismantle: [{ definitionId: 'empty_can', qty: 1, chance: 0.6 }],
  },
  sling: {
    id: 'sling', name: '슬링', type: 'weapon', subtype: 'ranged',
    rarity: 'common', weight: 0.3, stackable: false, maxStack: 1,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🪢', description: '천과 로프로 만든 원시 투석기.',
    combat: { damage: [3, 8], accuracy: 0.55, noiseOnAttack: 2 },
    tags: ['ranged', 'weapon'],
    equipSlot: 'weapon_sub',
    dismantle: [{ definitionId: 'cloth', qty: 1, chance: 0.5 }],
  },
  thorn_wire: {
    id: 'thorn_wire', name: '가시 철사', type: 'material', subtype: 'defense',
    rarity: 'uncommon', weight: 1.5, stackable: true, maxStack: 5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪡', description: '철사와 못으로 만든 날카로운 방어물.',
    tags: ['material', 'defense'], dismantle: [{ definitionId: 'wire', qty: 1, chance: 0.6 }],
  },
  makeshift_shield: {
    id: 'makeshift_shield', name: '임시 방패', type: 'weapon', subtype: 'shield',
    rarity: 'common', weight: 3.0, stackable: false, maxStack: 1,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🛡️', description: '나무와 고철로 만든 임시 방패.',
    combat: { damage: [0, 0], accuracy: 0, defense: 12, noiseOnAttack: 2 },
    tags: ['shield', 'defense'],
    equipSlot: 'offhand',
    dismantle: [{ definitionId: 'wood', qty: 1, chance: 0.7 }, { definitionId: 'scrap_metal', qty: 1, chance: 0.5 }],
  },
  battery: {
    id: 'battery', name: '배터리', type: 'material', subtype: 'electronic',
    rarity: 'uncommon', weight: 0.3, stackable: true, maxStack: 5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔋', description: '아직 충전이 남아있는 배터리.',
    tags: ['material', 'electronic'], dismantle: [],
  },

  // ── 서울 지도 조각 (3파츠) ──────────────────────────────────
  map_fragment_north: {
    id: 'map_fragment_north', name: '서울 북부 지도 조각', type: 'misc', subtype: 'document',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', fragmentOf: 'north',
    description: '은평·종로·노원·도봉 일대 손그림 지도. 낡았지만 주요 도로와 랜드마크가 표시돼 있다.',
    tags: ['document', 'map'], dismantle: [],
  },
  map_fragment_center: {
    id: 'map_fragment_center', name: '서울 중부 지도 조각', type: 'misc', subtype: 'document',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', fragmentOf: 'center',
    description: '마포·용산·중구·성동 일대 인쇄 지도. 상인이 이동 경로를 형광펜으로 표시해뒀다.',
    tags: ['document', 'map'], dismantle: [],
  },
  map_fragment_south: {
    id: 'map_fragment_south', name: '서울 남부 지도 조각', type: 'misc', subtype: 'document',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🗺️', fragmentOf: 'south',
    description: '강남·서초·송파·강동 일대 군용 지도. 군 보급창고 위치에 붉은 X 표시가 남아있다.',
    tags: ['document', 'map'], dismantle: [],
  },

  // ─── 도구 제작 전용 구조물 (Phase B) — 6종 ──────────────────

  field_forge: {
    id: 'field_forge', name: '야전 대장간', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 8.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '⚒️', description: '고철과 돌로 세운 간이 대장간. 금속 도구·도끼날·볼트 촉 등을 단조한다.',
    tags: ['structure', 'crafted', 'forge'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 4, chance: 0.8 },
      { definitionId: 'pebble',      qty: 3, chance: 0.7 },
      { definitionId: 'wood_plank',  qty: 2, chance: 0.6 },
    ],
  },

  coal_furnace: {
    id: 'coal_furnace', name: '석탄 용광로', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 12.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🏭', description: '돌과 진흙으로 쌓은 고온 용광로. 고철 → 정제 금속, 납·황동·강철 제련 가능.',
    tags: ['structure', 'crafted', 'furnace'],
    requiredForBlueprints: true,
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'pebble',     qty: 6, chance: 0.8 },
      { definitionId: 'scrap_metal',qty: 3, chance: 0.7 },
    ],
  },

  chemistry_bench: {
    id: 'chemistry_bench', name: '화학 실험대', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 5.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧪', description: '유리병·금속 받침대로 만든 화학 실험대. 흑색 화약·뇌관·독 추출물 합성 가능.',
    tags: ['structure', 'crafted', 'chemistry'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'glass_shard',    qty: 2, chance: 0.6 },
      { definitionId: 'scrap_metal',    qty: 2, chance: 0.7 },
      { definitionId: 'wood_plank',     qty: 2, chance: 0.7 },
    ],
  },

  ammo_bench: {
    id: 'ammo_bench', name: '탄약 제조대', type: 'structure', subtype: 'craft',
    rarity: 'rare', weight: 6.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '탄피·화약·납을 조립해 탄약을 만드는 전문 제조대. 권총탄·산탄·소총탄 제작 가능.',
    tags: ['structure', 'crafted', 'ammo'],
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'refined_metal', qty: 2, chance: 0.7 },
      { definitionId: 'wood_plank',    qty: 2, chance: 0.7 },
      { definitionId: 'scrap_metal',   qty: 2, chance: 0.6 },
    ],
  },

  carpentry_bench: {
    id: 'carpentry_bench', name: '목공 작업대', type: 'structure', subtype: 'craft',
    rarity: 'uncommon', weight: 6.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪚', description: '나무를 정밀하게 가공하는 목공 작업대. 삽·낚싯대·볼트 샤프트·가구 제작 가능.',
    tags: ['structure', 'crafted', 'carpentry'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood',      qty: 4, chance: 0.8 },
      { definitionId: 'nail',      qty: 5, chance: 0.6 },
      { definitionId: 'scrap_metal',qty: 1, chance: 0.5 },
    ],
  },

  tanning_rack: {
    id: 'tanning_rack', name: '가죽 작업대', type: 'structure', subtype: 'craft',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🟫', description: '사냥한 동물 가죽을 건조·가공하는 작업대. 건조 가죽·가죽 끈 생산 가능.',
    tags: ['structure', 'crafted', 'tanning'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood',  qty: 3, chance: 0.8 },
      { definitionId: 'rope',  qty: 1, chance: 0.6 },
      { definitionId: 'nail',  qty: 3, chance: 0.5 },
    ],
  },

  // ─── 자연 환경 오브젝트 — 불 시스템 연계 (4) ─────────────

  withered_tree: {
    id: 'withered_tree', name: '말라비틀어진 나무', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 5.0,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🌵', description: '바짝 말라 죽은 나무. 부수면 마찰 점화에 쓰이는 마른 막대와 불쏘시개 재료를 얻는다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'dry_wood_stick', qty: 2, chance: 0.9 },
      { definitionId: 'dry_leaves',     qty: 1, chance: 0.7 },
      { definitionId: 'wood_bark',      qty: 1, chance: 0.6 },
      { definitionId: 'kindling',       qty: 1, chance: 0.5 },
    ],
  },

  weed_patch: {
    id: 'weed_patch', name: '잡초밭', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 0.5,
    defaultDurability: 20, defaultContamination: 0,
    icon: '🌾', description: '황폐한 땅에서 자란 잡초. 마른 풀을 채집해 불쏘시개로 활용한다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'dry_grass', qty: 2, chance: 0.9 },
      { definitionId: 'herb',      qty: 1, chance: 0.4 },
      { definitionId: 'dry_leaves',qty: 1, chance: 0.5 },
    ],
  },

  gravel_pile: {
    id: 'gravel_pile', name: '자갈 더미', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 3.0,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🪨', description: '도로가 파헤쳐진 자갈 더미. 부싯돌을 찾을 수 있다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'firestone',  qty: 1, chance: 0.6 },
      { definitionId: 'pebble',     qty: 3, chance: 0.9 },
      { definitionId: 'scrap_metal',qty: 1, chance: 0.2 },
    ],
  },

  tree_env: {
    id: 'tree_env', name: '나무 (가로수)', type: 'structure', subtype: 'natural',
    rarity: 'common', weight: 10.0,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🌳', description: '도시에 남은 가로수. 통나무와 나무껍질을 얻는다. 도끼가 있으면 효율이 높아진다.',
    tags: ['structure', 'salvage', 'natural'],
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'tree_log',  qty: 1, chance: 0.9 },
      { definitionId: 'wood_bark', qty: 1, chance: 0.7 },
      { definitionId: 'wood',      qty: 1, chance: 0.6 },
      { definitionId: 'dry_leaves',qty: 1, chance: 0.4 },
      { definitionId: 'acorn',     qty: 2, chance: 0.3 },
    ],
  },

  // ═══ Phase C: 식생 확장 — 채집 도구 (8, type: 'tool') ════════════════

  stone_knife: {
    id: 'stone_knife', name: '돌칼', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 15, defaultContamination: 0,
    icon: '🔪', description: '부싯돌을 깨서 만든 원시 칼. 고기와 생선 손질에 사용. 내구도가 낮아 금방 닳는다.',
    tags: ['tool', 'cutting'],
    onUse: { durabilityPerUse: 1 },
  },

  kitchen_knife: {
    id: 'kitchen_knife', name: '부엌칼', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.25,
    defaultDurability: 60, defaultContamination: 0,
    icon: '🔪', description: '단조한 부엌칼. 돌칼보다 훨씬 오래 쓸 수 있다. 고기·생선·채소 손질에 최적.',
    tags: ['tool', 'cutting'],
    onUse: { durabilityPerUse: 1 },
  },

  mortar_pestle: {
    id: 'mortar_pestle', name: '절구', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 1.5,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🪨', description: '돌을 깎아 만든 절구와 절굿공이. 도토리·약초·마늘을 빻아 가루나 페이스트로 만든다.',
    tags: ['tool', 'processing'],
    onUse: { durabilityPerUse: 1 },
  },

  clay_pot: {
    id: 'clay_pot', name: '토기 냄비', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 1.2,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🫙', description: '흙으로 빚어 불에 구운 토기 냄비. 조리솥 거치대에 올리면 스튜와 발효식품을 만들 수 있다.',
    tags: ['tool', 'cooking'],
    onUse: { durabilityPerUse: 1 },
  },

  iron_pot: {
    id: 'iron_pot', name: '무쇠솥', type: 'tool', subtype: 'utility',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🍳', description: '야전 대장간에서 만든 무쇠솥. 대용량 조리가 가능하고 내구도가 매우 높다.',
    tags: ['tool', 'cooking'],
    onUse: { durabilityPerUse: 1 },
  },

  fish_trap: {
    id: 'fish_trap', name: '통발', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.8,
    defaultDurability: 30, defaultContamination: 0,
    icon: '🎣', description: '철사와 나무로 만든 통발. 강변 지역에 설치하면 자동으로 날생선을 잡는다.',
    tags: ['tool', 'fishing'],
    onUse: { durabilityPerUse: 1 },
  },

  trowel: {
    id: 'trowel', name: '모종삽', type: 'tool', subtype: 'utility',
    rarity: 'common', weight: 0.3,
    defaultDurability: 40, defaultContamination: 0,
    icon: '🌱', description: '씨앗을 심고 텃밭을 가꾸는 작은 삽. 텃밭 조성과 수확에 필수 도구.',
    tags: ['tool', 'farming'],
    onUse: { durabilityPerUse: 1 },
  },

  sickle: {
    id: 'sickle', name: '낫', type: 'tool', subtype: 'utility',
    rarity: 'uncommon', weight: 0.5,
    defaultDurability: 50, defaultContamination: 0,
    icon: '🌾', description: '고철로 만든 낫. 텃밭 수확 시 TP 소모를 줄여준다. 풀과 쐐기풀 채집에도 사용.',
    tags: ['tool', 'farming', 'cutting'],
    onUse: { durabilityPerUse: 1 },
  },

  // ═══ Phase C: 식생 확장 — 가공·보존 구조물 (8, type: 'structure') ════

  drying_rack: {
    id: 'drying_rack', name: '건조대', type: 'structure', subtype: 'food',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🏗️', description: '나무 기둥과 줄로 만든 건조대. 고기·생선·버섯·베리를 소금에 절여 말린다. 장기 보존 식량 생산.',
    tags: ['structure', 'crafted', 'food'],
    requiredForBlueprints: true,
    dismantleTP: 1,
    dismantle: [
      { definitionId: 'wood',  qty: 3, chance: 0.8 },
      { definitionId: 'rope',  qty: 2, chance: 0.7 },
      { definitionId: 'nail',  qty: 2, chance: 0.5 },
    ],
  },

  cooking_pot_stand: {
    id: 'cooking_pot_stand', name: '조리솥 거치대', type: 'structure', subtype: 'food',
    rarity: 'uncommon', weight: 2.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🍳', description: '캠프파이어 위에 냄비를 올리는 금속 거치대. clay_pot 또는 iron_pot을 올리면 스튜·수프 조리 가능.',
    tags: ['structure', 'crafted', 'food'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
      { definitionId: 'wire',        qty: 1, chance: 0.6 },
      { definitionId: 'nail',        qty: 3, chance: 0.5 },
    ],
  },

  fermentation_pot: {
    id: 'fermentation_pot', name: '발효통', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🫙', description: '흙을 구워 만든 발효통. 채소·베리·곡물을 소금과 함께 담가 발효식품을 만든다. 숙성에 2~5일 소요.',
    tags: ['structure', 'crafted', 'food'],
    requiredForBlueprints: true,
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'pebble', qty: 3, chance: 0.6 },
      { definitionId: 'rope',   qty: 1, chance: 0.5 },
    ],
  },

  garden_bed_veggie: {
    id: 'garden_bed_veggie', name: '채소 텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🥬', description: '채소 씨앗을 심은 텃밭. 매 턴 조금씩 성장해 5일 후 채소를 수확할 수 있다.',
    tags: ['structure', 'crafted', 'food', 'farm'],
    onTick: { nutrition: 0.25 },
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'wood_plank',    qty: 2, chance: 0.8 },
      { definitionId: 'soil_bag',      qty: 2, chance: 0.7 },
      { definitionId: 'vegetable_seed',qty: 1, chance: 0.4 },
    ],
  },

  garden_bed_herb: {
    id: 'garden_bed_herb', name: '약초 텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🌿', description: '약초 씨앗을 심은 텃밭. 꾸준히 약초를 공급해준다. 의료 자급자족의 첫걸음.',
    tags: ['structure', 'crafted', 'food', 'farm'],
    onTick: { herb: 0.15 },
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'wood_plank', qty: 2, chance: 0.8 },
      { definitionId: 'soil_bag',   qty: 2, chance: 0.7 },
      { definitionId: 'herb_seed',  qty: 1, chance: 0.4 },
    ],
  },

  garden_bed_grain: {
    id: 'garden_bed_grain', name: '곡물 텃밭', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🌾', description: '곡물 씨앗을 심은 대형 텃밭. 7일 후 대량의 곡물을 수확할 수 있다. 식량 안보의 핵심.',
    tags: ['structure', 'crafted', 'food', 'farm'],
    onTick: { nutrition: 0.2 },
    requiredForBlueprints: true,
    dismantleTP: 3,
    dismantle: [
      { definitionId: 'wood_plank',qty: 3, chance: 0.8 },
      { definitionId: 'soil_bag',  qty: 3, chance: 0.7 },
      { definitionId: 'grain_seed',qty: 1, chance: 0.4 },
    ],
  },

  root_cellar: {
    id: 'root_cellar', name: '땅굴 저장고', type: 'structure', subtype: 'storage',
    rarity: 'rare', weight: 6.0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '🏚️', description: '땅을 파서 만든 저장고. 낮은 온도를 유지해 식품 부패를 늦춘다. 보존 기간 2배 연장.',
    tags: ['structure', 'crafted', 'storage'],
    onTick: { food_decay: -0.5 },
    requiredForBlueprints: false,
    dismantleTP: 4,
    dismantle: [
      { definitionId: 'wood_plank', qty: 4, chance: 0.7 },
      { definitionId: 'nail',       qty: 6, chance: 0.6 },
      { definitionId: 'rope',       qty: 1, chance: 0.5 },
    ],
  },

  bee_hive: {
    id: 'bee_hive', name: '벌통', type: 'structure', subtype: 'food',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 80, defaultContamination: 0,
    icon: '🐝', description: '나무 판자로 만든 벌통. 매 턴 소량의 꿀을 생산한다. 발효식품 촉진재이자 의료 재료.',
    tags: ['structure', 'crafted', 'food'],
    onTick: { honey: 0.05 },
    dismantleTP: 2,
    dismantle: [
      { definitionId: 'wood_plank', qty: 3, chance: 0.7 },
      { definitionId: 'rope',       qty: 1, chance: 0.5 },
    ],
  },
};

export default ITEMS_MISC;
