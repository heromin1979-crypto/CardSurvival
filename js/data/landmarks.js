import GameData from './GameData.js';

// === LANDMARK SUB-LOCATION DATA ===
// 25개 구별 랜드마크 세부 장소 (4~6개씩)
// lootTable: [{id, weight}] — weight 합산 기반 가중치 추첨

export const LANDMARK_DATA = {

  // ── 베이스캠프 (직접 건설한 안전 거점) ─────────────────────
  basecamp: {
    name: '베이스캠프',
    desc: '직접 건설한 안전 거점. 업그레이드와 휴식이 가능하다.',
    icon: '🏕',
    isBasecampLandmark: true,   // 사이드바 버튼 교체 트리거 플래그
    subLocations: [],            // 세부 장소 없음 — 사이드바에서 기능 제공
  },

  // ── 종로구 — 경복궁 ──────────────────────────────────────
  jongno: {
    name: '경복궁',
    desc: '조선 왕조의 법궁. 광활한 궁역에 유물과 역사의 흔적이 남아 있다.',
    icon: '🏯',
    subLocations: [
      {
        id: 'jongno_geunjeongjeon', name: '근정전',
        icon: '🏛️', desc: '정전(正殿). 넓은 광장 주변에 좀비 무리가 배회한다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'wood', weight: 4 },
          { id: 'rope', weight: 2 }, { id: 'painkiller', weight: 1 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'jongno_gyeonghoeru', name: '경회루',
        icon: '🌊', desc: '연못 위 누각. 물을 구할 수 있지만 오염됐을지 모른다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'contaminated_water', weight: 3 }, { id: 'purified_water', weight: 1 },
          { id: 'rope', weight: 2 }, { id: 'wood', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'jongno_storage', name: '지하 유물 보관소',
        icon: '🗝️', desc: '박물관 지하 창고. 자물쇠가 걸려 있고 어둡다. 방사선 오염 차단 용품 발견.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'electronic_parts', weight: 2 }, { id: 'wire', weight: 3 },
          { id: 'lockpick', weight: 1 }, { id: 'flashlight', weight: 2 },
          { id: 'rad_blocker', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'jongno_folklore', name: '국립민속박물관',
        icon: '🏺', desc: '민속 유물 전시관. 의약품 상자가 남아있을 수도 있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'antiseptic', weight: 2 }, { id: 'bandage', weight: 3 },
          { id: 'cloth', weight: 3 }, { id: 'leather', weight: 1 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'jongno_gwanghwamun', name: '광화문 광장',
        icon: '🏛️', desc: '넓은 광장. 군 최후 방어선 잔해. 위험하지만 군용 물자가 흩어져 있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'iron_pipe', weight: 3 },
          { id: 'nail', weight: 3 }, { id: 'pistol_ammo', weight: 3 },
          { id: 'smoke_bomb', weight: 2 },
        ],
        lootCount: [2, 4],
      },
    ],
  },

  // ── 중구 — 남대문시장 ─────────────────────────────────────
  junggoo: {
    name: '남대문시장',
    desc: '서울 최대 재래시장. 식료품, 의류, 잡화 등 온갖 생존 물자가 있을 수 있다.',
    icon: '🏪',
    subLocations: [
      {
        id: 'junggu_food', name: '식료품 구역',
        icon: '🥫', desc: '식품 가게들이 밀집한 구역. 상한 음식과 온전한 식량이 뒤섞여 있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'canned_food', weight: 5 }, { id: 'dried_meat', weight: 4 },
          { id: 'purified_water', weight: 2 }, { id: 'painkiller', weight: 1 },
        ],
        lootCount: [3, 5],
      },
      {
        id: 'junggu_clothing', name: '의류 창고',
        icon: '🧣', desc: '의류·직물 창고. 방어구 제작 재료를 구할 수 있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'cloth', weight: 5 }, { id: 'leather', weight: 2 },
          { id: 'rope', weight: 2 }, { id: 'work_gloves', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'junggu_electronics', name: '전자제품 코너',
        icon: '📻', desc: '배터리, 부품 등 전자기기 관련 잔해.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'electronic_parts', weight: 4 }, { id: 'wire', weight: 3 },
          { id: 'flashlight', weight: 2 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'junggu_underground', name: '지하 창고',
        icon: '🚪', desc: '시장 지하 물류 창고. 어둡고 좁다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'plastic', weight: 3 },
          { id: 'rope', weight: 2 }, { id: 'crowbar', weight: 1 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'junggu_subway', name: '지하철 연결 통로',
        icon: '🚇', desc: '시장 지하 지하철 연결 통로. 좀비 떼가 집결해 있다.',
        dangerMod: 0.40,
        lootTable: [
          { id: 'crowbar', weight: 3 }, { id: 'flashlight', weight: 3 },
          { id: 'first_aid_kit', weight: 2 }, { id: 'iron_pipe', weight: 3 },
          { id: 'bandage', weight: 2 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 용산구 — 전쟁기념관 ───────────────────────────────────
  yongsan: {
    name: '전쟁기념관',
    desc: '한국 전쟁사 기념관. 군사 장비 전시물과 지하 벙커가 있다.',
    icon: '🪖',
    subLocations: [
      {
        id: 'yongsan_outdoor', name: '야외 전시장',
        icon: '⚓', desc: '탱크·전투기 실물 전시 구역. 잔해에서 금속 재료를.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'scrap_metal', weight: 5 }, { id: 'iron_pipe', weight: 2 },
          { id: 'wire', weight: 2 }, { id: 'nail', weight: 3 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'yongsan_history', name: '전쟁역사관',
        icon: '🏛️', desc: '전쟁 역사 전시관. 의무 물자가 남아있을 가능성.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'bandage', weight: 4 }, { id: 'painkiller', weight: 2 },
          { id: 'antiseptic', weight: 2 }, { id: 'cloth', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'yongsan_weapons', name: '무기 전시실',
        icon: '⚔️', desc: '소화기·도검 전시 구역. 일부 전시품은 실물일 수 있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'knife', weight: 2 }, { id: 'baseball_bat', weight: 2 },
          { id: 'iron_pipe', weight: 3 }, { id: 'crowbar', weight: 1 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'yongsan_bunker', name: '지하 벙커',
        icon: '🔒', desc: '비상용 군사 벙커. 보급품이 비축돼 있을 수 있다.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'tactical_vest', weight: 2 }, { id: 'first_aid_kit', weight: 3 },
          { id: 'bandage', weight: 3 }, { id: 'painkiller', weight: 2 },
          { id: 'canned_food', weight: 3 }, { id: 'pistol_ammo', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'yongsan_arsenal', name: '무기고',
        icon: '💣', desc: '실제 무기가 보관된 구역. 극도로 위험하다.',
        dangerMod: 0.45,
        lootTable: [
          { id: 'molotov_cocktail', weight: 2 }, { id: 'machete', weight: 3 },
          { id: 'knife', weight: 3 }, { id: 'smoke_bomb', weight: 2 },
          { id: 'pistol_ammo', weight: 3 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 성동구 — 성수 공장지대 ────────────────────────────────
  seongdong: {
    name: '성수 공장지대',
    desc: '서울의 산업 심장부. 가죽 공방, 금속 가공소 등이 밀집해 있다.',
    icon: '🏭',
    subLocations: [
      {
        id: 'seongdong_metal', name: '금속 가공 공장',
        icon: '⚙️', desc: '철제 부품·금속 재료의 보고.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 5 }, { id: 'nail', weight: 4 },
          { id: 'wire', weight: 3 }, { id: 'iron_pipe', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seongdong_leather', name: '가죽 공방',
        icon: '👜', desc: '핸드메이드 가죽 제품 공방. 방어구 재료 확보 가능.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'leather', weight: 5 }, { id: 'cloth', weight: 3 },
          { id: 'work_gloves', weight: 2 }, { id: 'rope', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seongdong_chemical', name: '화학 저장소',
        icon: '🧪', desc: '유해 화학 물질 저장소. 방호 장비 없이 진입 위험.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'antiseptic', weight: 3 }, { id: 'rad_blocker', weight: 1 },
          { id: 'rubber', weight: 3 }, { id: 'plastic', weight: 3 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'seongdong_warehouse', name: '창고 지구',
        icon: '📦', desc: '대형 물류 창고. 다양한 재료가 쌓여 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'wood', weight: 3 }, { id: 'rope', weight: 3 },
          { id: 'plastic', weight: 3 }, { id: 'scrap_metal', weight: 3 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seongdong_workshop', name: '작업장',
        icon: '🔧', desc: '공구와 부품이 가득한 작업실.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'pipe_wrench', weight: 2 }, { id: 'nail', weight: 4 },
          { id: 'wire', weight: 3 }, { id: 'duct_tape', weight: 2 },
        ],
        lootCount: [1, 3],
      },
    ],
  },

  // ── 광진구 — 어린이대공원 ─────────────────────────────────
  gwangjin: {
    name: '어린이대공원',
    desc: '서울 동부의 대형 공원. 동물원, 식물원, 유원지가 있다.',
    icon: '🎡',
    subLocations: [
      {
        id: 'gwangjin_zoo', name: '동물원 구역',
        icon: '🦁', desc: '탈출한 동물들이 배회하는 위험 구역.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'rope', weight: 4 }, { id: 'leather', weight: 3 },
          { id: 'bandage', weight: 2 }, { id: 'knife', weight: 1 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gwangjin_botanical', name: '식물원',
        icon: '🌿', desc: '약용 식물이 자생하는 온실. 의료 재료 획득 가능.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'vitamins', weight: 5 }, { id: 'antiseptic', weight: 2 },
          { id: 'purified_water', weight: 2 }, { id: 'antidote', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gwangjin_kiosk', name: '공원 매점',
        icon: '🍿', desc: '공원 내 편의 시설. 식량이 남아있을 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'canned_food', weight: 4 }, { id: 'painkiller', weight: 2 },
          { id: 'bandage', weight: 2 }, { id: 'purified_water', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gwangjin_rides', name: '놀이기구 구역',
        icon: '🎢', desc: '방치된 놀이시설. 기계 부품을 얻을 수 있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'plastic', weight: 3 },
          { id: 'wire', weight: 2 }, { id: 'rubber', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'gwangjin_gate', name: '정문 광장',
        icon: '🚪', desc: '공원 입구. 좀비가 집결해 있지만 넘어온 물자도 있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'baseball_bat', weight: 2 }, { id: 'flashlight', weight: 2 },
          { id: 'bandage', weight: 3 }, { id: 'scrap_metal', weight: 2 },
        ],
        lootCount: [1, 2],
      },
    ],
  },

  // ── 동대문구 — 경희의료원 ─────────────────────────────────
  dongdaemun: {
    name: '경희의료원',
    desc: '대형 종합병원. 의약품과 의료 장비의 보고지만 감염 위험이 높다.',
    icon: '🏥',
    subLocations: [
      {
        id: 'dongdaemun_er', name: '응급실',
        icon: '🚨', desc: '응급 처치 구역. 의료 물자가 풍부하지만 좀비가 많다.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'bandage', weight: 5 }, { id: 'first_aid_kit', weight: 2 },
          { id: 'antiseptic', weight: 3 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'dongdaemun_pharmacy', name: '약품 창고',
        icon: '💊', desc: '병원 의약품 보관실. 자물쇠가 걸려있지만 내부엔 귀한 약이.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'antibiotics', weight: 3 }, { id: 'painkiller', weight: 4 },
          { id: 'rad_blocker', weight: 1 }, { id: 'antiseptic', weight: 3 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'dongdaemun_or', name: '수술실',
        icon: '🔬', desc: '외과 수술 설비. 정밀 의료 도구가 남아있을 수 있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'surgery_kit', weight: 1 }, { id: 'antiseptic', weight: 3 },
          { id: 'bandage', weight: 3 }, { id: 'splint', weight: 2 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'dongdaemun_icu', name: '중환자실',
        icon: '❤️', desc: '중환자 병동. 생존 물자가 가장 풍부하나 가장 위험하다.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'stimulant', weight: 2 }, { id: 'first_aid_kit', weight: 2 },
          { id: 'antibiotics', weight: 2 }, { id: 'bandage', weight: 3 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'dongdaemun_records', name: '의무기록실',
        icon: '📋', desc: '환자 기록 서류가 쌓인 조용한 구역. 처방약 샘플이 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'antibiotics', weight: 3 }, { id: 'painkiller', weight: 3 },
          { id: 'stimulant', weight: 2 }, { id: 'antiseptic', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'dongdaemun_basement', name: '지하 창고',
        icon: '🗄️', desc: '병원 지하 물자 창고. 유지보수 공구와 의료 자재.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'flashlight', weight: 2 },
          { id: 'duct_tape', weight: 3 }, { id: 'pipe_wrench', weight: 2 },
          { id: 'wire', weight: 2 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 중랑구 — 용마랜드 폐유원지 ──────────────────────────
  jungrang: {
    name: '용마랜드 폐유원지',
    desc: '수십 년째 방치된 유원지. 녹슨 놀이기구와 음산한 분위기.',
    icon: '🎠',
    subLocations: [
      {
        id: 'jungnang_ferris', name: '관람차 주변',
        icon: '🎡', desc: '거대한 관람차 기저부. 녹슨 금속이 가득하다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'scrap_metal', weight: 5 }, { id: 'wire', weight: 3 },
          { id: 'rubber', weight: 2 }, { id: 'iron_pipe', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'jungnang_ride_storage', name: '놀이기구 창고',
        icon: '🔩', desc: '유지보수용 부품이 쌓인 창고.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'electronic_parts', weight: 3 }, { id: 'rubber', weight: 3 },
          { id: 'scrap_metal', weight: 3 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'jungnang_control', name: '구 관리실',
        icon: '🖥️', desc: '유원지 통합 관리 시설. 전기 부품이 남아있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'flashlight', weight: 2 }, { id: 'wire', weight: 4 },
          { id: 'electronic_parts', weight: 3 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'jungnang_boiler', name: '지하 보일러실',
        icon: '🔥', desc: '고온 위험 구역. 물자는 풍부하나 유독 가스 주의.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'iron_pipe', weight: 3 },
          { id: 'rubber', weight: 2 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'jungnang_ticket', name: '매표소',
        icon: '🎫', desc: '유원지 입구 매표소. 조용한 편이다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'painkiller', weight: 2 }, { id: 'bandage', weight: 3 },
          { id: 'flashlight', weight: 2 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [1, 2],
      },
    ],
  },

  // ── 성북구 — 고려대학교 ──────────────────────────────────
  seongbuk: {
    name: '고려대학교',
    desc: '명문 대학 캠퍼스. 법학·의학·체육 시설이 혼재하며 물자가 다양하다.',
    icon: '🎓',
    subLocations: [
      {
        id: 'seongbuk_medschool', name: '의과대학',
        icon: '🏥', desc: '의학 교육 시설. 실습용 의약품이 남아있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'first_aid_kit', weight: 2 }, { id: 'antiseptic', weight: 3 },
          { id: 'surgery_kit', weight: 1 }, { id: 'antibiotics', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'seongbuk_sports', name: '화정체육관',
        icon: '🏟️', desc: '대형 실내 체육 시설. 스포츠 장비와 의무용품이 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'bandage', weight: 4 }, { id: 'rope', weight: 3 },
          { id: 'leather', weight: 2 }, { id: 'work_gloves', weight: 2 },
          { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seongbuk_law', name: '법학전문대학원',
        icon: '⚖️', desc: '고려대 명물 법대. 사무용품·의약품·비상식량이 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'painkiller', weight: 3 }, { id: 'bandage', weight: 2 },
          { id: 'canned_food', weight: 2 }, { id: 'flashlight', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'seongbuk_dorm', name: '학생 기숙사',
        icon: '🛏️', desc: '학생 기숙사. 생활 물자와 식량이 남아있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'canned_food', weight: 3 }, { id: 'bandage', weight: 2 },
          { id: 'cloth', weight: 3 }, { id: 'purified_water', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seongbuk_cafeteria', name: '학생식당',
        icon: '🍱', desc: '대형 학생 식당. 식량 재고와 주방 도구.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'canned_food', weight: 5 }, { id: 'purified_water', weight: 3 },
          { id: 'knife', weight: 2 }, { id: 'vitamins', weight: 2 },
        ],
        lootCount: [2, 4],
      },
    ],
  },

  // ── 강북구 — 북한산성 ────────────────────────────────────
  gangbuk: {
    name: '북한산성',
    desc: '조선 시대 산성. 산 위에 위치해 물자는 적지만 안전하고 전망이 좋다.',
    icon: '🏔️',
    subLocations: [
      {
        id: 'gangbuk_gate', name: '성문',
        icon: '🚪', desc: '오래된 성문. 금속 부품을 뜯어낼 수 있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'iron_pipe', weight: 3 },
          { id: 'nail', weight: 3 }, { id: 'wood', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangbuk_beacon', name: '봉수대',
        icon: '🔭', desc: '산 정상 봉화대. 조망은 좋으나 노출이 심하다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'wood', weight: 5 }, { id: 'rope', weight: 3 },
          { id: 'flashlight', weight: 1 }, { id: 'bandage', weight: 1 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangbuk_barracks', name: '군사 막사 터',
        icon: '⛺', desc: '옛 군사 시설 터. 군용 물자가 남아 있을 수도.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'crowbar', weight: 2 }, { id: 'knife', weight: 3 },
          { id: 'bandage', weight: 3 }, { id: 'canned_food', weight: 4 },
          { id: 'pistol_ammo', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'gangbuk_well', name: '우물',
        icon: '💧', desc: '성 내부 우물. 물을 구할 수 있지만 오염 여부 불명.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'contaminated_water', weight: 3 }, { id: 'purified_water', weight: 2 },
          { id: 'vitamins', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangbuk_arsenal', name: '무기고 터',
        icon: '⚔️', desc: '과거 무기 보관소 터. 녹슨 무기 잔해.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'machete', weight: 1 }, { id: 'iron_pipe', weight: 3 },
          { id: 'nail', weight: 4 }, { id: 'scrap_metal', weight: 3 },
        ],
        lootCount: [1, 2],
      },
    ],
  },

  // ── 도봉구 — 도봉산 등산로 ──────────────────────────────
  dobong: {
    name: '도봉산 등산로',
    desc: '울창한 산림과 암벽이 있는 등산 명소. 야생 약초와 자원이 풍부하다.',
    icon: '⛰️',
    subLocations: [
      {
        id: 'dobong_entrance', name: '등산 초입부',
        icon: '🌲', desc: '등산로 입구. 목재와 로프를 구할 수 있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'wood', weight: 5 }, { id: 'rope', weight: 3 },
          { id: 'vitamins', weight: 3 }, { id: 'bandage', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'dobong_lodge', name: '산장',
        icon: '🏠', desc: '산 중턱 등산객 쉼터. 비상 용품이 있을 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'canned_food', weight: 3 },
          { id: 'flashlight', weight: 2 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'dobong_shelter', name: '정상 대피소',
        icon: '🏕️', desc: '산 정상 비상 대피소. 귀한 의료품이 있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'first_aid_kit', weight: 2 }, { id: 'painkiller', weight: 3 },
          { id: 'splint', weight: 2 }, { id: 'bandage', weight: 3 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'dobong_valley', name: '계곡',
        icon: '🌊', desc: '맑은 계곡물. 약초도 자란다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'purified_water', weight: 4 }, { id: 'vitamins', weight: 4 },
          { id: 'contaminated_water', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'dobong_cliff', name: '암벽 지대',
        icon: '🧗', desc: '가파른 암벽 지역. 오르기 어렵지만 로프 등 장비가 있다.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'rope', weight: 4 }, { id: 'leather', weight: 2 },
          { id: 'bandage', weight: 2 }, { id: 'splint', weight: 1 },
        ],
        lootCount: [1, 2],
      },
    ],
  },

  // ── 노원구 — 태릉선수촌 ──────────────────────────────────
  nowon: {
    name: '태릉선수촌',
    desc: '1966년 설립된 국가 대표 엘리트 훈련 기지. 폐허가 됐지만 시설이 견고하다.',
    icon: '🏅',
    subLocations: [
      {
        id: 'nowon_gym', name: '실내 체육관',
        icon: '🏋️', desc: '격투·역도 전용 체육관. 운동 장비와 의무용품이 남아있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'bandage', weight: 4 }, { id: 'leather', weight: 3 },
          { id: 'rope', weight: 3 }, { id: 'work_gloves', weight: 2 },
          { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'nowon_pool', name: '실내 수영장',
        icon: '🏊', desc: '50m 실내 수영장. 물을 구할 수 있지만 오염됐을 가능성이 있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'contaminated_water', weight: 3 }, { id: 'purified_water', weight: 2 },
          { id: 'rope', weight: 2 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'nowon_dorm', name: '선수 기숙사',
        icon: '🛏️', desc: '국가 대표 선수들의 합숙 공간. 개인 물품과 식량이 남아있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'canned_food', weight: 4 }, { id: 'cloth', weight: 3 },
          { id: 'bandage', weight: 2 }, { id: 'purified_water', weight: 2 },
          { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'nowon_medical', name: '의무실',
        icon: '🩺', desc: '스포츠 의학 전문 의무실. 재활 치료 물자가 풍부하다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'first_aid_kit', weight: 2 }, { id: 'antiseptic', weight: 3 },
          { id: 'splint', weight: 3 }, { id: 'bandage', weight: 4 },
          { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'nowon_cafeteria', name: '급식소',
        icon: '🍽️', desc: '선수단 전용 식당. 대용량 비축 식품과 영양제가 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'canned_food', weight: 5 }, { id: 'vitamins', weight: 4 },
          { id: 'dried_meat', weight: 3 }, { id: 'purified_water', weight: 3 },
        ],
        lootCount: [2, 5],
      },
      {
        id: 'nowon_field', name: '야외 훈련장',
        icon: '🏃', desc: '육상 트랙과 야외 기구. 시야가 트여있어 감시에 유리하다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'rope', weight: 4 }, { id: 'scrap_metal', weight: 3 },
          { id: 'bandage', weight: 2 }, { id: 'wood', weight: 2 },
        ],
        lootCount: [1, 3],
      },
    ],
  },

  // ── 은평구 — 진관사 ──────────────────────────────────────
  eunpyeong: {
    name: '진관사',
    desc: '북한산 자락의 천년 고찰. 고요하고 약초원이 잘 보존돼 있다.',
    icon: '⛩️',
    subLocations: [
      {
        id: 'eunpyeong_main_hall', name: '대웅전',
        icon: '🏯', desc: '사찰 중심 법당. 조용하고 상대적으로 안전하다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'cloth', weight: 4 }, { id: 'bandage', weight: 3 },
          { id: 'rope', weight: 2 }, { id: 'lighter', weight: 1 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'eunpyeong_storage', name: '사찰 창고',
        icon: '📦', desc: '사찰 용품 창고. 다양한 물자가 보관돼 있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'canned_food', weight: 3 }, { id: 'purified_water', weight: 3 },
          { id: 'wood', weight: 3 }, { id: 'rope', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'eunpyeong_quarters', name: '스님 거처',
        icon: '🛏️', desc: '승려 거주 공간. 생활 물자가 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'painkiller', weight: 2 },
          { id: 'cloth', weight: 3 }, { id: 'purified_water', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'eunpyeong_dining', name: '공양 식당',
        icon: '🍱', desc: '사찰 식당. 식량이 남아 있을 수 있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'canned_food', weight: 4 }, { id: 'dried_meat', weight: 3 },
          { id: 'purified_water', weight: 3 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'eunpyeong_herb', name: '약초원',
        icon: '🌿', desc: '약용 식물을 재배하던 약초원. 의료 재료의 보고.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'vitamins', weight: 7 }, { id: 'antiseptic', weight: 3 },
          { id: 'antidote', weight: 3 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [3, 5],
      },
    ],
  },

  // ── 서대문구 — 세브란스병원 ──────────────────────────────
  seodaemun: {
    name: '신촌 세브란스병원',
    desc: '연세대 부속 종합병원. 감염 위험이 높으나 의약품이 풍부하다.',
    icon: '🏥',
    subLocations: [
      {
        id: 'seodaemun_er', name: '응급실',
        icon: '🚨', desc: '응급 처치 구역. 혼잡하고 위험하다.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'bandage', weight: 5 }, { id: 'first_aid_kit', weight: 2 },
          { id: 'antiseptic', weight: 4 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seodaemun_pharmacy', name: '약품 창고',
        icon: '💊', desc: '희귀 의약품 보관 냉장 창고.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'antibiotics', weight: 3 }, { id: 'painkiller', weight: 3 },
          { id: 'stimulant', weight: 2 }, { id: 'rad_blocker', weight: 1 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'seodaemun_or', name: '수술실',
        icon: '🔬', desc: '외과 수술 시설. 전문 의료 도구.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'surgery_kit', weight: 2 }, { id: 'antiseptic', weight: 4 },
          { id: 'splint', weight: 2 }, { id: 'bandage', weight: 3 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'seodaemun_lab', name: '연구실',
        icon: '⚗️', desc: '의학 연구 실험실. 시약과 희귀 약품.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'rad_blocker', weight: 2 }, { id: 'antidote', weight: 2 },
          { id: 'antiseptic', weight: 3 }, { id: 'antibiotics', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'seodaemun_morgue', name: '영안실',
        icon: '🪦', desc: '시신 안치실. 으스스하지만 의료 도구가 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'antiseptic', weight: 3 },
          { id: 'antidote', weight: 1 }, { id: 'splint', weight: 2 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'seodaemun_basement', name: '지하 물자 창고',
        icon: '🗄️', desc: '병원 지하 종합 창고. 의료 소모품과 유지보수 도구.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'flashlight', weight: 3 }, { id: 'duct_tape', weight: 3 },
          { id: 'wire', weight: 2 }, { id: 'bandage', weight: 3 },
          { id: 'pipe_wrench', weight: 2 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 마포구 — 홍대 클럽가 ─────────────────────────────────
  mapo: {
    name: '홍대 클럽가',
    desc: '서울의 젊음이 모이던 거리. 가게들이 밀집해 생존 물자를 찾을 수 있다.',
    icon: '🎵',
    subLocations: [
      {
        id: 'mapo_club', name: '클럽 내부',
        icon: '🎶', desc: '폐쇄된 클럽. 어둡고 음습하지만 물자가 있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'stimulant', weight: 2 }, { id: 'painkiller', weight: 3 },
          { id: 'bandage', weight: 2 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'mapo_convenience', name: '편의점',
        icon: '🏪', desc: '방치된 편의점. 식량과 의약품이 남아있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'canned_food', weight: 5 }, { id: 'painkiller', weight: 3 },
          { id: 'bandage', weight: 3 }, { id: 'purified_water', weight: 4 },
          { id: 'dried_meat', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'mapo_underground', name: '지하 창고',
        icon: '🚪', desc: '술집·가게의 지하 창고. 잡다한 물자.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'wire', weight: 3 },
          { id: 'plastic', weight: 3 }, { id: 'rope', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'mapo_parking', name: '주차장',
        icon: '🚗', desc: '대형 주차장. 차량 잔해에서 부품을 뜯을 수 있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'iron_pipe', weight: 2 },
          { id: 'crowbar', weight: 2 }, { id: 'rubber', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'mapo_cafe', name: '카페 골목',
        icon: '☕', desc: '카페가 늘어선 골목. 식량과 물이 남아있을 수 있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'canned_food', weight: 3 }, { id: 'purified_water', weight: 3 },
          { id: 'bandage', weight: 2 }, { id: 'painkiller', weight: 1 },
        ],
        lootCount: [1, 3],
      },
    ],
  },

  // ── 양천구 — 목동 경기장 ─────────────────────────────────
  yangcheon: {
    name: '목동 경기장',
    desc: '서울 서부의 종합 스포츠 경기장. 의무실과 기계실이 있다.',
    icon: '🏟️',
    subLocations: [
      {
        id: 'yangcheon_stands', name: '관중석',
        icon: '🪑', desc: '드넓은 관중석. 잔해에서 금속 부품을.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'baseball_bat', weight: 1 },
          { id: 'plastic', weight: 3 }, { id: 'rope', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'yangcheon_locker', name: '선수 라커룸',
        icon: '🏋️', desc: '선수 전용 라커룸. 의무 용품과 장비가 남아있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'bandage', weight: 4 }, { id: 'painkiller', weight: 3 },
          { id: 'work_gloves', weight: 2 }, { id: 'antiseptic', weight: 2 },
          { id: 'first_aid_kit', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'yangcheon_mechanical', name: '기계실',
        icon: '⚙️', desc: '경기장 설비 기계실. 전기·금속 부품.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'wire', weight: 3 },
          { id: 'electronic_parts', weight: 2 }, { id: 'rubber', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'yangcheon_concession', name: '매점',
        icon: '🍔', desc: '경기장 내 매점. 식량이 남아있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'canned_food', weight: 4 }, { id: 'painkiller', weight: 2 },
          { id: 'purified_water', weight: 3 }, { id: 'bandage', weight: 1 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'yangcheon_parking', name: '주차장',
        icon: '🅿️', desc: '지하 주차장. 차량 잔해',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'iron_pipe', weight: 3 },
          { id: 'rubber', weight: 2 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [1, 3],
      },
    ],
  },

  // ── 강서구 — 김포공항 ────────────────────────────────────
  gangseo: {
    name: '김포공항',
    desc: '국내선 공항. 화물터미널과 격납고에 다양한 물자가 있을 수 있다.',
    icon: '✈️',
    subLocations: [
      {
        id: 'gangseo_departure', name: '출국장',
        icon: '🛫', desc: '여행객이 버리고 간 물자들이 곳곳에 있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'canned_food', weight: 3 }, { id: 'bandage', weight: 3 },
          { id: 'flashlight', weight: 2 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangseo_cargo', name: '화물 터미널',
        icon: '📦', desc: '화물 창고. 다양한 물자가 컨테이너에 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'plastic', weight: 3 },
          { id: 'rubber', weight: 2 }, { id: 'rope', weight: 3 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangseo_hangar', name: '격납고',
        icon: '🛩️', desc: '항공기 정비 격납고. 금속 부품의 보고.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'wire', weight: 4 }, { id: 'electronic_parts', weight: 5 },
          { id: 'scrap_metal', weight: 4 }, { id: 'rubber', weight: 2 },
          { id: 'duct_tape', weight: 3 },
        ],
        lootCount: [2, 5],
      },
      {
        id: 'gangseo_dutyfree', name: '면세점',
        icon: '🛍️', desc: '약품·화장품이 남아있는 면세구역.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'painkiller', weight: 3 }, { id: 'stimulant', weight: 2 },
          { id: 'antiseptic', weight: 3 }, { id: 'antibiotics', weight: 2 },
          { id: 'vitamins', weight: 3 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangseo_tower', name: '관제탑',
        icon: '📡', desc: '공항 관제탑. 전자 장비가 가득하다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'electronic_parts', weight: 5 }, { id: 'wire', weight: 4 },
          { id: 'flashlight', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'gangseo_fuel', name: '연료 저장소',
        icon: '⛽', desc: '항공 연료 보관소. 화재 위험이 높지만 유용한 재료가.',
        dangerMod: 0.45,
        lootTable: [
          { id: 'rubber', weight: 3 }, { id: 'plastic', weight: 3 },
          { id: 'molotov_cocktail', weight: 4 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 구로구 — 구로디지털단지 ──────────────────────────────
  guro: {
    name: '구로디지털단지',
    desc: 'IT 기업이 밀집한 테크 단지. 전자 부품과 서버 장비가 있다.',
    icon: '💻',
    subLocations: [
      {
        id: 'guro_office', name: 'IT 사무실',
        icon: '🖥️', desc: '테크 기업 사무실. 전자 부품이 곳곳에.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'electronic_parts', weight: 4 }, { id: 'wire', weight: 3 },
          { id: 'plastic', weight: 2 }, { id: 'flashlight', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'guro_server', name: '서버실',
        icon: '🖧', desc: '대형 데이터센터 서버실. 최고급 전자 부품.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'electronic_parts', weight: 5 }, { id: 'wire', weight: 4 },
          { id: 'flashlight', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'guro_warehouse', name: '물류 창고',
        icon: '📦', desc: 'IT 기기 물류 창고. 포장재와 부품들.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'plastic', weight: 4 },
          { id: 'rope', weight: 2 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'guro_parts_store', name: '전자 부품 상점',
        icon: '🔌', desc: '전자 부품 전문 소매점.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'electronic_parts', weight: 5 }, { id: 'wire', weight: 4 },
          { id: 'nail', weight: 2 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'guro_parking', name: '지하 주차장',
        icon: '🅿️', desc: '지하 주차장. 차량 잔해에서 금속을.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'crowbar', weight: 2 },
          { id: 'rubber', weight: 3 }, { id: 'iron_pipe', weight: 2 },
        ],
        lootCount: [1, 3],
      },
    ],
  },

  // ── 금천구 — 독산동 공장지대 ─────────────────────────────
  geumcheon: {
    name: '독산동 공장지대',
    desc: '중공업 공장들이 밀집한 산업 단지. 금속과 화학 물자가 풍부하다.',
    icon: '🏗️',
    subLocations: [
      {
        id: 'geumcheon_metal', name: '금속 공장',
        icon: '⚒️', desc: '철제 제품 생산 공장. 금속 재료의 보고.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'scrap_metal', weight: 5 }, { id: 'nail', weight: 4 },
          { id: 'iron_pipe', weight: 3 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [2, 5],
      },
      {
        id: 'geumcheon_chemical', name: '화학 공장',
        icon: '☣️', desc: '화학 물질 제조 공장. 방호 없이 진입 위험.',
        dangerMod: 0.40,
        lootTable: [
          { id: 'rubber', weight: 3 }, { id: 'plastic', weight: 3 },
          { id: 'antiseptic', weight: 2 }, { id: 'rad_blocker', weight: 1 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'geumcheon_warehouse_complex', name: '창고 단지',
        icon: '🏚️', desc: '공장 물류 창고 군. 다양한 재료.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'wood', weight: 3 },
          { id: 'rope', weight: 3 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [2, 5],
      },
      {
        id: 'geumcheon_waste', name: '폐기물 처리장',
        icon: '♻️', desc: '산업 폐기물 처리 시설. 위험하지만 재료가 있다.',
        dangerMod: 0.40,
        lootTable: [
          { id: 'rubber', weight: 4 }, { id: 'plastic', weight: 3 },
          { id: 'contaminated_water', weight: 3 }, { id: 'scrap_metal', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'geumcheon_power', name: '발전소',
        icon: '⚡', desc: '공장 전용 발전 시설. 전기 부품이 있다.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'wire', weight: 5 }, { id: 'electronic_parts', weight: 3 },
          { id: 'scrap_metal', weight: 3 }, { id: 'rubber', weight: 2 },
        ],
        lootCount: [2, 4],
      },
    ],
  },

  // ── 영등포구 — 타임스퀘어 ────────────────────────────────
  yeongdeungpo: {
    name: '영등포 타임스퀘어',
    desc: '대형 복합 쇼핑몰. 식품관과 의류·전자제품 매장이 있다.',
    icon: '🛒',
    subLocations: [
      {
        id: 'yeongdeungpo_food', name: '식품관',
        icon: '🛒', desc: '대형 식품 코너. 통조림과 건조 식품이 많다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'canned_food', weight: 6 }, { id: 'dried_meat', weight: 3 },
          { id: 'painkiller', weight: 2 }, { id: 'purified_water', weight: 3 },
        ],
        lootCount: [3, 5],
      },
      {
        id: 'yeongdeungpo_clothing', name: '의류 매장',
        icon: '👗', desc: '의류·직물 매장. 방어구 재료를 얻을 수 있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'cloth', weight: 5 }, { id: 'leather', weight: 2 },
          { id: 'work_gloves', weight: 2 }, { id: 'rope', weight: 2 },
        ],
        lootCount: [2, 5],
      },
      {
        id: 'yeongdeungpo_electronics', name: '전자제품 매장',
        icon: '📱', desc: '전자제품 전문관. 부품을 분리할 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'electronic_parts', weight: 4 }, { id: 'wire', weight: 3 },
          { id: 'flashlight', weight: 2 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'yeongdeungpo_rooftop', name: '옥상 정원',
        icon: '🌻', desc: '쇼핑몰 옥상 정원. 식물과 물이 있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'vitamins', weight: 3 }, { id: 'purified_water', weight: 3 },
          { id: 'rope', weight: 2 }, { id: 'wood', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'yeongdeungpo_storage', name: '지하 창고',
        icon: '🗄️', desc: '쇼핑몰 지하 물류 창고.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'rope', weight: 3 },
          { id: 'plastic', weight: 3 }, { id: 'duct_tape', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'yeongdeungpo_parking_tower', name: '주차 타워',
        icon: '🚗', desc: '다층 주차 타워. 차량 잔해와 연장.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'crowbar', weight: 2 },
          { id: 'iron_pipe', weight: 3 }, { id: 'rubber', weight: 2 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 동작구 — 국립현충원 ──────────────────────────────────
  dongjak: {
    name: '국립현충원',
    desc: '국가 유공자 묘역. 조용하고 넓은 숲이 있으며 관리 시설이 있다.',
    icon: '🎖️',
    subLocations: [
      {
        id: 'dongjak_memorial', name: '현충탑',
        icon: '🏛️', desc: '추모탑 주변. 조용하고 상대적으로 안전.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'painkiller', weight: 2 },
          { id: 'cloth', weight: 2 }, { id: 'rope', weight: 1 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'dongjak_hall', name: '기념관',
        icon: '🏠', desc: '역사 기념관 내부. 의약품과 도구.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'bandage', weight: 4 }, { id: 'antiseptic', weight: 2 },
          { id: 'first_aid_kit', weight: 2 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'dongjak_storage', name: '관리 창고',
        icon: '📦', desc: '묘역 관리용 도구 창고.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'wood', weight: 4 },
          { id: 'nail', weight: 3 }, { id: 'pipe_wrench', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'dongjak_office', name: '관리소',
        icon: '🏢', desc: '묘역 관리 사무소. 도구와 비품.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'pipe_wrench', weight: 2 }, { id: 'flashlight', weight: 2 },
          { id: 'bandage', weight: 2 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'dongjak_forest', name: '묘역 숲',
        icon: '🌲', desc: '잘 가꿔진 숲. 약초와 목재.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'vitamins', weight: 4 }, { id: 'rope', weight: 3 },
          { id: 'wood', weight: 4 }, { id: 'purified_water', weight: 1 },
        ],
        lootCount: [2, 4],
      },
    ],
  },

  // ── 관악구 — 서울대학교 ──────────────────────────────────
  gwanak: {
    name: '서울대학교',
    desc: '국내 최고 명문대. 의학·화학·공학 실험실에 귀한 물자가 있다.',
    icon: '🎓',
    subLocations: [
      {
        id: 'gwanak_medschool', name: '의과대학',
        icon: '🏥', desc: '의학 교육·연구 시설. 의료 물자가 풍부.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'first_aid_kit', weight: 2 }, { id: 'antiseptic', weight: 3 },
          { id: 'surgery_kit', weight: 1 }, { id: 'antibiotics', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gwanak_chemlab', name: '화학과 실험실',
        icon: '⚗️', desc: '화학 시약과 실험 장비가 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'rad_blocker', weight: 2 }, { id: 'antidote', weight: 2 },
          { id: 'antiseptic', weight: 4 }, { id: 'plastic', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gwanak_eng_storage', name: '공대 창고',
        icon: '⚙️', desc: '공학 실험 장비 보관소. 전자 부품.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'wire', weight: 4 }, { id: 'scrap_metal', weight: 3 },
          { id: 'electronic_parts', weight: 5 }, { id: 'nail', weight: 2 },
          { id: 'duct_tape', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gwanak_dorm', name: '기숙사',
        icon: '🛏️', desc: '학생 기숙사. 일상 생활 물자.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'canned_food', weight: 4 }, { id: 'bandage', weight: 3 },
          { id: 'cloth', weight: 3 }, { id: 'purified_water', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gwanak_lib_basement', name: '도서관 지하 서고',
        icon: '📚', desc: '지하 서고. 어둡지만 간간이 물자가.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'flashlight', weight: 3 }, { id: 'electronic_parts', weight: 2 },
          { id: 'bandage', weight: 2 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'gwanak_main_lib', name: '중앙도서관',
        icon: '🏛️', desc: '대형 도서관 건물. 응급 처치함이 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'painkiller', weight: 3 }, { id: 'bandage', weight: 3 },
          { id: 'flashlight', weight: 2 }, { id: 'antiseptic', weight: 1 },
        ],
        lootCount: [1, 3],
      },
    ],
  },

  // ── 서초구 — 예술의전당 ──────────────────────────────────
  seocho: {
    name: '예술의전당',
    desc: '서울 대표 복합 문화 예술 공간. 넓은 건물과 지하 창고가 있다.',
    icon: '🎭',
    subLocations: [
      {
        id: 'seocho_opera', name: '오페라하우스',
        icon: '🎼', desc: '대형 공연장. 무대 장치와 의상이 남아있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'cloth', weight: 4 }, { id: 'leather', weight: 2 },
          { id: 'rope', weight: 3 }, { id: 'bandage', weight: 1 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seocho_backstage', name: '무대 뒷편',
        icon: '🎪', desc: '무대 배후 시설. 공구와 철제 구조물.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'rope', weight: 4 }, { id: 'wood', weight: 3 },
          { id: 'scrap_metal', weight: 3 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'seocho_dressing', name: '분장실',
        icon: '🪞', desc: '배우 분장실. 의약품과 기초 용품.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'antiseptic', weight: 3 }, { id: 'painkiller', weight: 2 },
          { id: 'cloth', weight: 3 }, { id: 'bandage', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'seocho_gallery', name: '미술관',
        icon: '🖼️', desc: '미술 전시관. 의외로 조용하다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'flashlight', weight: 2 }, { id: 'bandage', weight: 2 },
          { id: 'painkiller', weight: 2 }, { id: 'cloth', weight: 3 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'seocho_basement', name: '지하 창고',
        icon: '🗄️', desc: '공연 장치 보관 지하 창고.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'scrap_metal', weight: 4 }, { id: 'wire', weight: 3 },
          { id: 'plastic', weight: 3 }, { id: 'rope', weight: 2 },
        ],
        lootCount: [2, 4],
      },
    ],
  },

  // ── 강남구 — 강남세브란스병원 ────────────────────────────
  gangnam: {
    name: '강남세브란스병원',
    desc: '강남 최대 병원. 최신 의료 시설과 대형 약품 창고가 있다.',
    icon: '🏥',
    subLocations: [
      {
        id: 'gangnam_er', name: '응급실',
        icon: '🚨', desc: '대형 응급 처치 구역. 위험하지만 물자가 풍부.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'bandage', weight: 5 }, { id: 'first_aid_kit', weight: 3 },
          { id: 'antiseptic', weight: 4 }, { id: 'painkiller', weight: 3 },
        ],
        lootCount: [2, 5],
      },
      {
        id: 'gangnam_pharmacy', name: '약품 창고',
        icon: '💊', desc: '최고급 희귀 약품 보관소.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'antibiotics', weight: 4 }, { id: 'painkiller', weight: 3 },
          { id: 'stimulant', weight: 2 }, { id: 'rad_blocker', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangnam_or', name: '수술실',
        icon: '🔬', desc: '첨단 외과 수술 시설.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'surgery_kit', weight: 3 }, { id: 'antiseptic', weight: 4 },
          { id: 'splint', weight: 2 }, { id: 'bandage', weight: 3 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangnam_lab', name: '연구실',
        icon: '⚗️', desc: '의학 연구 실험실. 시약과 희귀 약품.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'antidote', weight: 2 }, { id: 'rad_blocker', weight: 2 },
          { id: 'antibiotics', weight: 3 }, { id: 'antiseptic', weight: 3 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangnam_morgue', name: '영안실',
        icon: '🪦', desc: '시신 안치실. 의료 도구가 있다.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'antiseptic', weight: 4 }, { id: 'splint', weight: 2 },
          { id: 'antidote', weight: 2 }, { id: 'bandage', weight: 3 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangnam_vip', name: 'VIP 병실',
        icon: '⭐', desc: '고급 VIP 병동. 최상의 의약품과 용품.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'first_aid_kit', weight: 4 }, { id: 'stimulant', weight: 3 },
          { id: 'surgery_kit', weight: 2 }, { id: 'antibiotics', weight: 3 },
          { id: 'rad_blocker', weight: 1 },
        ],
        lootCount: [2, 4],
      },
    ],
  },

  // ── 송파구 — 롯데월드타워 ────────────────────────────────
  songpa: {
    name: '롯데월드타워',
    desc: '555m 초고층 빌딩. 쇼핑몰, 호텔, 발전기실 등 다양한 구역.',
    icon: '🏙️',
    subLocations: [
      {
        id: 'songpa_lobby', name: '로비',
        icon: '🏛️', desc: '웅장한 1층 로비. 좀비가 집결해 있다.',
        dangerMod: 0.30,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'flashlight', weight: 2 },
          { id: 'scrap_metal', weight: 3 }, { id: 'painkiller', weight: 2 },
        ],
        lootCount: [2, 3],
      },
      {
        id: 'songpa_mall_basement', name: '쇼핑몰 지하',
        icon: '🛒', desc: '지하 식품관과 슈퍼마켓.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'canned_food', weight: 6 }, { id: 'dried_meat', weight: 3 },
          { id: 'painkiller', weight: 3 }, { id: 'bandage', weight: 3 },
          { id: 'purified_water', weight: 3 },
        ],
        lootCount: [3, 6],
      },
      {
        id: 'songpa_hotel', name: '호텔 객실',
        icon: '🛏️', desc: '최고급 호텔 객실. 생필품과 응급 처치함.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'purified_water', weight: 3 }, { id: 'bandage', weight: 3 },
          { id: 'stimulant', weight: 2 }, { id: 'painkiller', weight: 3 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'songpa_observatory', name: '전망대 (119F)',
        icon: '🔭', desc: '최고층 전망대. 전망은 탁월하나 적도 많다. 생존자 잔류 물자 발견.',
        dangerMod: 0.40,
        lootTable: [
          { id: 'tactical_vest', weight: 2 }, { id: 'first_aid_kit', weight: 3 },
          { id: 'electronic_parts', weight: 3 }, { id: 'pistol_ammo', weight: 2 },
          { id: 'stimulant', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'songpa_stairs', name: '비상 계단',
        icon: '🪜', desc: '비상 탈출용 계단. 도주 경로지만 좁고 위험.',
        dangerMod: 0.25,
        lootTable: [
          { id: 'crowbar', weight: 2 }, { id: 'rope', weight: 3 },
          { id: 'scrap_metal', weight: 3 }, { id: 'bandage', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'songpa_generator', name: '발전기실 (지하)',
        icon: '⚡', desc: '비상 발전 시설. 전기 부품의 보고.',
        dangerMod: 0.35,
        lootTable: [
          { id: 'wire', weight: 5 }, { id: 'electronic_parts', weight: 5 },
          { id: 'scrap_metal', weight: 3 }, { id: 'rubber', weight: 2 },
          { id: 'duct_tape', weight: 2 },
        ],
        lootCount: [3, 5],
      },
    ],
  },

  // ── 강동구 — 암사동 선사유적지 ──────────────────────────
  gangdong: {
    name: '암사동 선사유적지',
    desc: '신석기 시대 움집 복원 유적지. 한강변에 위치해 물을 구하기 쉽다.',
    icon: '🏺',
    subLocations: [
      {
        id: 'gangdong_pithouses', name: '움집 복원지',
        icon: '🛖', desc: '복원된 신석기 움집. 기초 재료를 구할 수 있다.',
        dangerMod: 0.05,
        lootTable: [
          { id: 'wood', weight: 5 }, { id: 'rope', weight: 3 },
          { id: 'cloth', weight: 3 }, { id: 'vitamins', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangdong_museum', name: '선사박물관',
        icon: '🏛️', desc: '유적 박물관 건물. 응급 처치함과 관리 물자가 남아있다.',
        dangerMod: 0.10,
        lootTable: [
          { id: 'bandage', weight: 3 }, { id: 'first_aid_kit', weight: 2 },
          { id: 'antiseptic', weight: 2 }, { id: 'flashlight', weight: 2 },
          { id: 'painkiller', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangdong_artifact_storage', name: '유물 창고',
        icon: '🗝️', desc: '유물 보관소. 뜻밖의 물자가 있을 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'scrap_metal', weight: 3 }, { id: 'leather', weight: 3 },
          { id: 'wood', weight: 3 }, { id: 'wire', weight: 2 },
        ],
        lootCount: [1, 3],
      },
      {
        id: 'gangdong_riverside', name: '한강 강변',
        icon: '🌊', desc: '유적지 앞 한강 변. 물을 구하기 좋지만 오염 주의.',
        dangerMod: 0.15,
        lootTable: [
          { id: 'purified_water', weight: 3 }, { id: 'contaminated_water', weight: 3 },
          { id: 'rope', weight: 2 }, { id: 'vitamins', weight: 2 },
        ],
        lootCount: [2, 4],
      },
      {
        id: 'gangdong_excavation', name: '고고학 발굴지',
        icon: '⛏️', desc: '발굴 작업장. 도구와 재료가 남아있다.',
        dangerMod: 0.20,
        lootTable: [
          { id: 'leather', weight: 3 }, { id: 'scrap_metal', weight: 3 },
          { id: 'sharp_blade', weight: 3 }, { id: 'crowbar', weight: 2 },
          { id: 'rope', weight: 2 },
        ],
        lootCount: [2, 3],
      },
    ],
  },

  // ── 한강 낚시터 (공용 — hasFishing 구역 전체 공유) ───────────
  hangang: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    subLocations: [
      {
        id: 'hangang_fishing_spot', name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        lootTable: [
          { id: 'contaminated_water', weight: 4 },
          { id: 'pebble',            weight: 3 },
          { id: 'rope',              weight: 2 },
          { id: 'bait_worm',         weight: 3 },
        ],
        lootCount: [1, 2],
      },
      {
        id: 'hangang_riverside', name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        lootTable: [
          { id: 'wild_garlic',       weight: 4 },
          { id: 'dandelion',         weight: 3 },
          { id: 'pebble',            weight: 4 },
          { id: 'dry_grass',         weight: 3 },
          { id: 'bait_insect',       weight: 2 },
        ],
        lootCount: [1, 3],
      },
    ],
  },
};

// ── 유틸리티 ────────────────────────────────────────────────

/**
 * 각 랜드마크 세부 장소(sublocation)에 대한 아이템 정의를 생성하여
 * GameData.items 에 등록한다.
 * main.js에서 GameData 초기화 직후 호출해야 한다.
 */
export function registerSubLocationItems() {
  const items = GameData?.items;
  if (!items) return;

  for (const [districtId, lmData] of Object.entries(LANDMARK_DATA)) {
    for (const sub of lmData.subLocations ?? []) {
      const id = `sl_${sub.id}`;
      if (items[id]) continue; // 이미 등록된 경우 스킵
      items[id] = {
        id,
        name:                  sub.name,
        type:                  'location',
        subtype:               'sublocation',
        sublocation:           true,
        districtId,
        subLocationId:         sub.id,
        icon:                  sub.icon,
        description:           sub.desc,
        rarity:                'common',
        weight:                0,
        stackable:             false,
        maxStack:              1,
        defaultDurability:     100,
        defaultContamination:  0,
        tags:                  ['location', 'sublocation'],
        requiresSlot:          'top',
        dismantle:             [],
        dangerMod:             sub.dangerMod ?? 0,
        lootTable:             sub.lootTable,
        lootCount:             sub.lootCount,
      };
    }
  }
}

/**
 * 가중치 기반 추첨으로 lootTable에서 N개 아이템을 선택한다.
 * @param {Array<{id:string, weight:number}>} table
 * @param {number} count
 * @returns {string[]} 선택된 definitionId 배열
 */
export function rollLoot(table, count) {
  if (!table || table.length === 0) return [];
  const n = Math.max(0, Math.floor(count));
  const totalWeight = table.reduce((s, e) => s + (e.weight > 0 ? e.weight : 0), 0);
  if (totalWeight <= 0) return [];
  const result = [];
  for (let i = 0; i < n; i++) {
    let r = Math.random() * totalWeight;
    for (const entry of table) {
      r -= entry.weight;
      if (r <= 0) { result.push(entry.id); break; }
    }
  }
  return result;
}

export default LANDMARK_DATA;
