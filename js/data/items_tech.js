// === ITEMS: TECH (전자부품·에너지·첨단장비) ===
// 전자부품 6 + 구조물 5 + 도구 2 + 에너지 2 = 15 items

const ITEMS_TECH = {

  // ─── 전자 기초 부품 (6) ──────────────────────────────────────

  circuit_board: {
    id: 'circuit_board', name: '회로기판', type: 'material', subtype: 'tech',
    rarity: 'common', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔲', description: '폐전자제품에서 수거한 기판. 구리선과 칩을 추출할 수 있다.',
    tags: ['tech', 'material'],
    dismantle: [
      { definitionId: 'copper_wire', qty: 2, chance: 0.8 },
      { definitionId: 'microchip', qty: 1, chance: 0.3 },
    ],
  },

  copper_wire: {
    id: 'copper_wire', name: '구리선', type: 'material', subtype: 'tech',
    rarity: 'common', weight: 0.1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔌', description: '전기 전도성이 뛰어난 구리선. 코일이나 배선에 사용된다.',
    tags: ['tech', 'material', 'metal'],
    dismantle: [],
  },

  copper_coil: {
    id: 'copper_coil', name: '구리 코일', type: 'material', subtype: 'tech',
    rarity: 'uncommon', weight: 0.3,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧲', description: '구리선을 감아 만든 코일. 모터와 발전기의 핵심 부품.',
    tags: ['tech', 'material', 'crafted'],
    dismantle: [{ definitionId: 'copper_wire', qty: 3, chance: 0.9 }],
  },

  microchip: {
    id: 'microchip', name: '마이크로칩', type: 'material', subtype: 'tech',
    rarity: 'uncommon', weight: 0.05,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔬', description: '정밀 회로가 새겨진 칩. 고급 전자장비 제작에 필수적이다.',
    tags: ['tech', 'material'],
    dismantle: [],
  },

  circuit_module: {
    id: 'circuit_module', name: '회로 모듈', type: 'material', subtype: 'tech',
    rarity: 'rare', weight: 0.2,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📟', description: '여러 칩과 배선을 조합한 범용 전자 모듈.',
    tags: ['tech', 'material', 'crafted'],
    dismantle: [
      { definitionId: 'microchip', qty: 1, chance: 0.7 },
      { definitionId: 'copper_wire', qty: 2, chance: 0.8 },
    ],
  },

  electric_motor: {
    id: 'electric_motor', name: '전기 모터', type: 'material', subtype: 'tech',
    rarity: 'rare', weight: 1.5,
    defaultDurability: 100, defaultContamination: 0,
    icon: '⚡', description: '구리 코일과 자석으로 구동되는 소형 모터.',
    tags: ['tech', 'material', 'crafted'],
    dismantle: [
      { definitionId: 'copper_coil', qty: 1, chance: 0.8 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.6 },
    ],
  },

  // ─── 에너지 (2) ──────────────────────────────────────────────

  power_cell: {
    id: 'power_cell', name: '파워 셀', type: 'material', subtype: 'tech',
    rarity: 'rare', weight: 0.8,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔋', description: '고효율 충전식 전력 저장 장치.',
    tags: ['tech', 'material', 'energy'],
    dismantle: [
      { definitionId: 'copper_wire', qty: 1, chance: 0.6 },
      { definitionId: 'electronic_parts', qty: 1, chance: 0.5 },
    ],
  },

  generator_core: {
    id: 'generator_core', name: '발전기 코어', type: 'material', subtype: 'tech',
    rarity: 'rare', weight: 3.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔋', description: '모터와 회로 모듈로 구성된 발전 핵심부.',
    tags: ['tech', 'material', 'crafted', 'energy'],
    dismantle: [
      { definitionId: 'electric_motor', qty: 1, chance: 0.7 },
      { definitionId: 'circuit_module', qty: 1, chance: 0.5 },
    ],
  },

  // ─── 구조물 (5) ──────────────────────────────────────────────

  portable_generator: {
    id: 'portable_generator', name: '휴대용 발전기', type: 'structure', subtype: 'tech',
    rarity: 'legendary', weight: 8.0,
    defaultDurability: 200, defaultContamination: 0,
    icon: '⚡', description: '연료로 전력을 생산하는 소형 발전기. 전력 장비를 가동할 수 있다.',
    tags: ['tech', 'structure', 'energy'],
    dismantle: [
      { definitionId: 'generator_core', qty: 1, chance: 0.6 },
      { definitionId: 'scrap_metal', qty: 3, chance: 0.8 },
    ],
  },

  solar_panel: {
    id: 'solar_panel', name: '태양광 패널', type: 'structure', subtype: 'tech',
    rarity: 'rare', weight: 4.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '☀️', description: '태양 에너지를 전기로 변환하는 패널.',
    tags: ['tech', 'structure', 'energy'],
    dismantle: [
      { definitionId: 'circuit_board', qty: 2, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.8 },
    ],
  },

  electric_fence: {
    id: 'electric_fence', name: '전기 울타리', type: 'structure', subtype: 'tech',
    rarity: 'rare', weight: 5.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '⚡', description: '전류가 흐르는 방어 울타리. 적과 야생동물을 억제한다.',
    tags: ['tech', 'structure', 'defense'],
    dismantle: [
      { definitionId: 'copper_wire', qty: 5, chance: 0.9 },
      { definitionId: 'scrap_metal', qty: 2, chance: 0.7 },
    ],
  },

  spotlight: {
    id: 'spotlight', name: '탐조등', type: 'structure', subtype: 'tech',
    rarity: 'uncommon', weight: 3.0,
    defaultDurability: 150, defaultContamination: 0,
    icon: '💡', description: '넓은 영역을 밝히는 강력한 조명. 야간 방어에 유용하다.',
    tags: ['tech', 'structure', 'light'],
    dismantle: [
      { definitionId: 'electronic_parts', qty: 1, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
    ],
  },

  solar_charger: {
    id: 'solar_charger', name: '태양광 충전기', type: 'structure', subtype: 'tech',
    rarity: 'rare', weight: 3.5,
    defaultDurability: 150, defaultContamination: 0,
    icon: '🔆', description: '태양광으로 배터리를 충전하는 장치.',
    tags: ['tech', 'structure', 'energy'],
    dismantle: [
      { definitionId: 'circuit_board', qty: 1, chance: 0.6 },
      { definitionId: 'copper_wire', qty: 2, chance: 0.7 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.8 },
    ],
  },

  // ─── 도구 (2) ────────────────────────────────────────────────

  radio_transmitter: {
    id: 'radio_transmitter', name: '무선 송신기', type: 'tool', subtype: 'tech',
    rarity: 'rare', weight: 1.0,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📡', description: '전파를 발신할 수 있는 장치. 구조 요청이나 통신에 사용된다.',
    tags: ['tech', 'tool', 'communication'],
    dismantle: [
      { definitionId: 'circuit_module', qty: 1, chance: 0.5 },
      { definitionId: 'copper_wire', qty: 2, chance: 0.7 },
    ],
  },

  powered_drill: {
    id: 'powered_drill', name: '전동 드릴', type: 'tool', subtype: 'tech',
    rarity: 'rare', weight: 2.0,
    defaultDurability: 120, defaultContamination: 0,
    icon: '🔧', description: '전력으로 구동되는 드릴. 건축과 채굴에 강력한 성능을 발휘한다.',
    tags: ['tech', 'tool'],
    dismantle: [
      { definitionId: 'electric_motor', qty: 1, chance: 0.6 },
      { definitionId: 'scrap_metal', qty: 1, chance: 0.7 },
    ],
  },
};

export default ITEMS_TECH;
