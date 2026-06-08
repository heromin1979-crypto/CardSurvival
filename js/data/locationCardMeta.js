export const LOCATION_CARD_META = {
  "gangnam": {
    "subtype": "medical",
    "rarity": "rare",
    "tags": [
      "location",
      "medical"
    ]
  },
  "gangdong": {
    "subtype": "urban",
    "rarity": "uncommon",
    "tags": [
      "location"
    ]
  },
  "gangbuk": {
    "subtype": "safe",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "gangseo": {
    "subtype": "urban",
    "rarity": "uncommon",
    "tags": [
      "location"
    ]
  },
  "gwanak": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "gwangjin": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "guro": {
    "subtype": "industrial",
    "rarity": "uncommon",
    "tags": [
      "location"
    ]
  },
  "geumcheon": {
    "subtype": "industrial",
    "rarity": "uncommon",
    "tags": [
      "location",
      "radiation"
    ]
  },
  "nowon": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "dobong": {
    "subtype": "safe",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "dongdaemun": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "dongjak": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "mapo": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location",
      "radiation"
    ]
  },
  "seodaemun": {
    "subtype": "medical",
    "rarity": "uncommon",
    "tags": [
      "location",
      "medical"
    ]
  },
  "seocho": {
    "subtype": "urban",
    "rarity": "rare",
    "tags": [
      "location"
    ]
  },
  "seongdong": {
    "subtype": "industrial",
    "rarity": "common",
    "tags": [
      "location",
      "radiation"
    ]
  },
  "seongbuk": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "songpa": {
    "subtype": "urban",
    "rarity": "rare",
    "tags": [
      "location"
    ]
  },
  "yangcheon": {
    "subtype": "safe",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "yeongdeungpo": {
    "subtype": "urban",
    "rarity": "rare",
    "tags": [
      "location"
    ]
  },
  "yongsan": {
    "subtype": "urban",
    "rarity": "uncommon",
    "tags": [
      "location"
    ]
  },
  "eunpyeong": {
    "subtype": "safe",
    "rarity": "common",
    "tags": [
      "location"
    ]
  },
  "jongno": {
    "subtype": "warzone",
    "rarity": "rare",
    "tags": [
      "location",
      "radiation",
      "military"
    ]
  },
  "junggoo": {
    "subtype": "urban",
    "rarity": "uncommon",
    "tags": [
      "location"
    ]
  },
  "jungrang": {
    "subtype": "urban",
    "rarity": "common",
    "tags": [
      "location"
    ]
  }
};

// 한강 카드는 구별 독립 엔트리(lm_hangang_<구>) 10개로 분리 — locationCardFactory.js buildAllHangangCards()가 생성.
export const LANDMARK_CARD_META = {
  "lm_gangnam": {
    "name": "삼성서울병원",
    "subtype": "landmark",
    "rarity": "rare",
    "tags": [
      "location",
      "landmark",
      "medical"
    ],
    "icon": "🏥",
    "description": "강남구 최대 의료시설. 의약품·수술키트가 대량 비축되어 있으나 좀비 밀도가 극히 높다.",
    "landmarkBonus": "탐색 시 의료 아이템 발견 확률 +20%",
    "districtId": null
  },
  "lm_gangdong": {
    "name": "올림픽공원",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🏟️",
    "description": "88서울올림픽 경기장. 광활한 공원에 생존자들이 임시 캠프를 세웠던 흔적이 남아있다.",
    "landmarkBonus": "방문 시 사기 +10",
    "districtId": null
  },
  "lm_gangbuk": {
    "name": "북한산 국립공원",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "⛰️",
    "description": "서울 북쪽을 지키는 산악 지대. 약초·목재 등 자연 자원이 풍부하다.",
    "landmarkBonus": "탐색 시 자연 자원 발견 +20%",
    "districtId": null
  },
  "lm_gangseo": {
    "name": "김포국제공항",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "✈️",
    "description": "물류 창고와 격납고에 항공 공구·장비 부품이 가득하다. 약탈자들도 탐내는 장소.",
    "landmarkBonus": "탐색 시 공구·부품 발견 +20%",
    "districtId": null
  },
  "lm_gwanak": {
    "name": "서울대학교 연구소",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark",
      "medical"
    ],
    "icon": "🔬",
    "description": "폐쇄된 의약품 연구실. 합성 의약품 원료와 정수 장비가 남아있다.",
    "landmarkBonus": "탐색 시 의약품 원료 발견 +15%",
    "districtId": null
  },
  "lm_gwangjin": {
    "name": "어린이대공원",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🎡",
    "description": "뚝섬 유원지 일대. 식당가에 통조림과 생수가 아직 남아있다.",
    "landmarkBonus": "탐색 시 식량 발견 확률 +10%",
    "districtId": null
  },
  "lm_guro": {
    "name": "구로디지털단지",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "💻",
    "description": "IT 기업 건물과 전자 부품 창고. 전선·기판·배터리가 가득하다.",
    "landmarkBonus": "탐색 시 전자부품 발견 +20%",
    "districtId": null
  },
  "lm_geumcheon": {
    "name": "시흥공단 기계창",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark",
      "radiation"
    ],
    "icon": "⚙️",
    "description": "중소 공장 밀집 지역의 폐공장. 고철과 공구가 가득하지만 방사선 오염 주의.",
    "landmarkBonus": "탐색 시 금속재료 발견 +25%",
    "districtId": null
  },
  "lm_nowon": {
    "name": "태릉선수촌",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🏋️",
    "description": "국가대표 훈련시설. 체육용품과 에너지 식품이 남아있다.",
    "landmarkBonus": "방문 시 피로 -10",
    "districtId": null
  },
  "lm_dobong": {
    "name": "도봉산 등산로",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🌲",
    "description": "울창한 도봉산 숲. 자연 엄폐물이 많아 이동 소음이 크게 줄어든다.",
    "landmarkBonus": "이 구역 소음 생성 -30%",
    "districtId": null
  },
  "lm_dongdaemun": {
    "name": "동대문 디자인 플라자",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🎨",
    "description": "거대한 DDP 건물과 인근 의류시장. 천·가죽·실이 대량으로 남아있다.",
    "landmarkBonus": "탐색 시 천·의류 발견 +25%",
    "districtId": null
  },
  "lm_dongjak": {
    "name": "국립현충원",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "⛺",
    "description": "국립묘지의 넓은 부지. 감염자들이 기피하는 조용한 구역.",
    "landmarkBonus": "이 구역 조우 확률 -10%p",
    "districtId": null
  },
  "lm_boramae_hospital": {
    "name": "보라매병원",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🏥",
    "description": "서울시립 보라매병원. 의약품과 의료 장비가 남아있지만 감염 위험이 있다.",
    "landmarkBonus": "탐색 시 의료 아이템 발견 +15%",
    "districtId": "dongjak"
  },
  "lm_mapo": {
    "name": "홍대 지하상가",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🎸",
    "description": "홍대 클럽 거리 지하상가. 잡화·식료품·의류가 뒤섞여 있다.",
    "landmarkBonus": "방문 시 사기 +5",
    "districtId": null
  },
  "lm_seodaemun": {
    "name": "세브란스병원",
    "subtype": "landmark",
    "rarity": "rare",
    "tags": [
      "location",
      "landmark",
      "medical"
    ],
    "icon": "💉",
    "description": "연세대학교 의료원. 수술실과 약품 창고가 있으나 내부 감염자 밀도가 높다.",
    "landmarkBonus": "탐색 시 의료 아이템 발견 +25%",
    "districtId": null
  },
  "lm_seocho": {
    "name": "예술의전당",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🎭",
    "description": "문화예술 복합시설. 생존자 기록과 메모가 많이 남아있고 사기 회복에 도움이 된다.",
    "landmarkBonus": "방문 시 사기 +10",
    "districtId": null
  },
  "lm_seongdong": {
    "name": "성수 공방거리",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🔨",
    "description": "수제화·가죽공방 밀집 지역. 가죽·실·접착제 등 제작 재료가 풍부하다.",
    "landmarkBonus": "탐색 시 제작 재료 발견 +20%",
    "districtId": null
  },
  "lm_seongbuk": {
    "name": "고려대학교 캠퍼스",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "📚",
    "description": "고려대 도서관·연구동. 학술 자료와 실험 장비가 남아있다.",
    "landmarkBonus": "탐색 시 아이템 발견 수 +1",
    "districtId": null
  },
  "lm_songpa": {
    "name": "롯데월드타워",
    "subtype": "landmark",
    "rarity": "rare",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🗼",
    "description": "서울 최고층 건물. 지하 쇼핑몰에 대량의 물자가 남아있으나 약탈자들의 거점이기도 하다.",
    "landmarkBonus": "탐색 시 희귀 아이템 발견 확률 +10%",
    "districtId": null
  },
  "lm_yangcheon": {
    "name": "목동 종합운동장",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "⚾",
    "description": "목동야구장과 체육관. 안전한 휴식 공간으로 생존자들이 잠시 머물다 간 흔적이 있다.",
    "landmarkBonus": "방문 시 피로 -15",
    "districtId": null
  },
  "lm_yeongdeungpo": {
    "name": "KBS 방송국",
    "subtype": "landmark",
    "rarity": "rare",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "📡",
    "description": "방송 송신탑과 스튜디오. 비상 발전기와 전자장비가 있으며 생존자 무선 신호를 잡을 수 있다.",
    "landmarkBonus": "무전 수신 가능 — 생존자 위치 단서 획득",
    "districtId": null
  },
  "lm_yongsan": {
    "name": "용산 전자상가",
    "subtype": "landmark",
    "rarity": "rare",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "💾",
    "description": "전자부품 전문 상가. 배터리·전선·통신장비가 대량으로 비축되어 있다.",
    "landmarkBonus": "탐색 시 전자부품 발견 +30%",
    "districtId": null
  },
  "lm_eunpyeong": {
    "name": "진관사",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🛕",
    "description": "북한산 자락의 천년고찰. 승려들이 남긴 약초와 허브가 감염 저항에 도움이 된다.",
    "landmarkBonus": "방문 시 감염 -5",
    "districtId": null
  },
  "lm_jongno": {
    "name": "경복궁",
    "subtype": "landmark",
    "rarity": "legendary",
    "tags": [
      "location",
      "landmark",
      "military"
    ],
    "icon": "🏯",
    "description": "조선왕조의 정궁. 지하 유물 보관소에 귀한 물자가 있지만 군의 잔존 감염자들이 득실거린다.",
    "landmarkBonus": "탐색 시 희귀·전설급 아이템 발견 가능",
    "districtId": null
  },
  "lm_junggoo": {
    "name": "남대문시장",
    "subtype": "landmark",
    "rarity": "uncommon",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🛒",
    "description": "과거 한국 최대 전통시장. 상인들이 숨겨둔 창고에 다양한 생필품이 남아있다.",
    "landmarkBonus": "탐색 시 식량·생필품 발견 +20%",
    "districtId": null
  },
  "lm_jungrang": {
    "name": "중랑천 습지",
    "subtype": "landmark",
    "rarity": "common",
    "tags": [
      "location",
      "landmark"
    ],
    "icon": "🌿",
    "description": "중랑천변 생태 습지. 오염됐지만 식물성 자원과 빗물을 수집할 수 있다.",
    "landmarkBonus": "탐색 시 수자원 발견 +15%",
    "districtId": null
  }
};
