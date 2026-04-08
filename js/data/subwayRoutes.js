// === SUBWAY & SEWER ROUTE DATA ===
// 서울 지하철 노선(간략화) + 하수도 비밀 경로
// Simplified Seoul metro lines + sewer secret routes

const SUBWAY_LINES = {

  line_2: {
    id: 'line_2', name: '2호선', icon: '\u{1F7E2}', color: '#33A23D',
    stations: [
      'gangnam', 'seocho', 'dongjak', 'yeongdeungpo', 'mapo',
      'seodaemun', 'jongno', 'dongdaemun', 'seongdong', 'gangdong',
    ],
    circular: true,
    tpCostPerStation: 1,
    dangerLevel: 3,
    encounterChance: 0.30,
    unlockCondition: { requiredItem: 'flashlight', minDay: 15 },
  },

  line_3: {
    id: 'line_3', name: '3호선', icon: '\u{1F7E0}', color: '#FE5B10',
    stations: [
      'gangnam', 'seocho', 'dongjak', 'yongsan', 'jongno',
      'seodaemun', 'eunpyeong',
    ],
    circular: false,
    tpCostPerStation: 1,
    dangerLevel: 3,
    encounterChance: 0.25,
    unlockCondition: { requiredItem: 'flashlight', minDay: 20 },
  },

  line_4: {
    id: 'line_4', name: '4호선', icon: '\u{1F535}', color: '#32A1C8',
    stations: [
      'nowon', 'gangbuk', 'seongbuk', 'dongdaemun', 'junggoo',
      'yongsan', 'dongjak', 'gwanak',
    ],
    circular: false,
    tpCostPerStation: 1,
    dangerLevel: 2,
    encounterChance: 0.20,
    unlockCondition: { requiredItem: 'flashlight', minDay: 10 },
  },

  line_7: {
    id: 'line_7', name: '7호선', icon: '\u{1F7E4}', color: '#747F00',
    stations: [
      'dobong', 'nowon', 'jungrang', 'gwangjin', 'gangdong',
      'songpa', 'gangnam',
    ],
    circular: false,
    tpCostPerStation: 1,
    dangerLevel: 2,
    encounterChance: 0.20,
    unlockCondition: { requiredItem: 'flashlight', minDay: 15 },
  },
};

const SEWER_ROUTES = {

  sewer_gangnam_yongsan: {
    id: 'sewer_gangnam_yongsan',
    from: 'gangnam', to: 'yongsan',
    tpCost: 3,
    dangerLevel: 4,
    encounterChance: 0.40,
    radiation: 3,
    unlockCondition: { requiredItem: 'gas_mask', minDay: 30 },
  },

  sewer_mapo_yeongdeungpo: {
    id: 'sewer_mapo_yeongdeungpo',
    from: 'mapo', to: 'yeongdeungpo',
    tpCost: 4,
    dangerLevel: 4,
    encounterChance: 0.35,
    unlockCondition: { requiredItem: 'rope', minDay: 50, minSkill: { building: 3 } },
  },
};

// ── 역 탐색 루팅 테이블 ───────────────────────────────────────
const STATION_LOOT = {
  default: [
    { id: 'energy_bar',   weight: 30, minQty: 1, maxQty: 2 },
    { id: 'sports_drink', weight: 20, minQty: 1, maxQty: 1 },
    { id: 'battery',      weight: 15, minQty: 1, maxQty: 2 },
    { id: 'scrap_metal',  weight: 25, minQty: 2, maxQty: 4 },
    { id: 'flashlight',   weight: 10, minQty: 1, maxQty: 1 },
  ],
  special: {
    jongno:  [{ id: 'canned_food',      weight: 40, minQty: 2, maxQty: 4 }],
    gangnam: [{ id: 'first_aid_kit',    weight: 15, minQty: 1, maxQty: 1 }],
    yongsan: [{ id: 'electronic_parts', weight: 30, minQty: 1, maxQty: 3 }],
  },
};

export { SUBWAY_LINES, SEWER_ROUTES, STATION_LOOT };
