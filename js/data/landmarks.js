// GameData는 본 모듈 init 시점에 import하지 않는다.
// (cycle: landmarks → GameData → items → locationCardFactory → ...)
// registerSubLocationItems()는 호출자(main.js)가 items 사전을 주입한다.

// === LANDMARK SUB-LOCATION DATA ===
// 25개 구별 랜드마크 세부 장소 (4~6개씩)
// lootTable: [{id, weight}] — weight 합산 기반 가중치 추첨

// 한강이 접하는 10개 구 — hasFishing:true 구역과 1:1 대응.
// 다른 모듈이 한강 대상 구 목록을 직접 참조하므로 named export로 공개한다.
export const HANGANG_DISTRICTS = [
  'gangnam','gangdong','gwangjin','mapo','seocho',
  'seongdong','songpa','yeongdeungpo','yongsan','junggoo',
];

export const LANDMARK_DATA = {
  basecamp: {
    name: '베이스캠프',
    desc: '직접 건설한 안전 거점. 업그레이드와 휴식이 가능하다.',
    icon: '🏕',
    isBasecampLandmark: true,
    subLocations: [
      {
        id: 'basecamp_start',
        name: '시작장소',
        icon: '📍',
        desc: '도대체 무슨 일이야?',
        dangerMod: 0,
        lootTable: [],
        lootCount: [
          1,
          2,
        ],
      },
    ],
  },
  jongno: {
    name: '경복궁',
    desc: '조선 왕조의 법궁. 광활한 궁역에 유물과 역사의 흔적이 남아 있다.',
    icon: '🏯',
    subLocations: [
      {
        id: 'jongno_gwanghwamun',
        name: '광화문 광장',
        icon: '🏛️',
        desc: '넓은 광장. 군 최후 방어선 잔해. 위험하지만 군용 물자가 흩어져 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'nail',
            weight: 3,
          },
          {
            id: 'pistol_ammo',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
        isEntrance: true,
      },
      {
        id: 'sl_jongno_royal_vault',
        name: '지하 왕실 금고',
        icon: '👑',
        desc: '근정전 박석 아래 도면에 없는 계단. 항온항습 설비가 여태 돌고 있다.',
        dangerMod: 0.18,
        requiresHiddenLocation: 'hidden_jongno_royal_vault',
        firstEnterReward: {
          claimKey: 'jongno_vault_first',
          items: [
            {
              id: 'royal_katana',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'cloth',
            weight: 4,
          },
          {
            id: 'map_fragment',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
        ],
      },
      {
        id: 'jongno_geunjeongjeon',
        name: '근정전',
        icon: '🏛️',
        desc: '정전(正殿). 넓은 광장 주변에 좀비 무리가 배회한다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'wood',
            weight: 4,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'jongno_gyeonghoeru',
        name: '경회루',
        icon: '🌊',
        desc: '연못 위 누각. 물을 구할 수 있지만 오염됐을지 모른다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 1,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'wood',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'jongno_storage',
        name: '지하 유물 보관소',
        icon: '🗝️',
        desc: '박물관 지하 창고. 자물쇠가 걸려 있고 어둡다. 방사선 오염 차단 용품 발견.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'electronic_parts',
            weight: 2,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'rad_blocker',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'jongno_folklore',
        name: '국립민속박물관',
        icon: '🏺',
        desc: '민속 유물 전시관. 의약품 상자가 남아있을 수도 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'antiseptic',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'leather',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
    ],
    lootTable: [
      {
        id: 'wood',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'firestone',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'herb',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  junggoo: {
    name: '남대문시장',
    desc: '서울 최대 재래시장. 식료품, 의류, 잡화 등 온갖 생존 물자가 있을 수 있다.',
    icon: '🏪',
    subLocations: [
      {
        id: 'junggu_market_gate',
        name: '남대문 초입',
        icon: '⛩️',
        desc: '숭례문 아래 시장 초입. 뒤집힌 좌판이 길을 반쯤 막았다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 35,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'empty_bottle',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'canned_food',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_junggoo.png',
      },
      {
        id: 'sl_junggoo_cold_storage',
        name: '냉동 창고',
        icon: '❄️',
        desc: '시장 지하 대형 냉동고. 발전기가 아직 돌아 안쪽만 영하로 남아 있다.',
        dangerMod: 0.3,
        bossId: 'boss_chef_nemesis',
        requiresHiddenLocation: 'hidden_namdaemun_cold_storage',
        firstEnterReward: {
          claimKey: 'cold_storage_first',
          items: [
            {
              id: 'virus_sample',
              qty: 1,
            },
            {
              id: 'immunity_serum',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'antidote',
            weight: 5,
          },
          {
            id: 'antibiotics',
            weight: 5,
          },
          {
            id: 'rad_blocker',
            weight: 4,
          },
          {
            id: 'surgery_kit',
            weight: 4,
          },
        ],
      },
      {
        id: 'sl_junggoo_hotel_pantry',
        name: '호텔 주방 저장고',
        icon: '🍳',
        desc: '장충동 호텔 지하. 출입 코드를 아는 사람만 들어간다. 선반에 재고 목록이 손 글씨로 붙어 있다.',
        dangerMod: 0.1,
        requiresHiddenLocation: 'hidden_junggoo_hotel_kitchen',
        firstEnterReward: {
          claimKey: 'sofitel_pantry_first',
          items: [
            {
              id: 'canned_food',
              qty: 4,
            },
            {
              id: 'purified_water',
              qty: 3,
            },
            {
              id: 'herb',
              qty: 3,
            },
            {
              id: 'salt',
              qty: 2,
            },
          ],
        },
        lootTable: [
          {
            id: 'herb',
            weight: 6,
          },
          {
            id: 'salt',
            weight: 6,
          },
          {
            id: 'vitamins',
            weight: 4,
          },
          {
            id: 'alcohol_solution',
            weight: 4,
          },
        ],
      },
      {
        id: 'sl_junggoo_city_hall_safe',
        name: '시장실 금고',
        icon: '🏛️',
        desc: '시장 북쪽 태평로 건너 시청 본관. 시장실 벽 뒤에 금고가 통째로 박혀 있다.',
        dangerMod: 0.3,
        requiresHiddenLocation: 'hidden_junggoo_city_hall_safe',
        firstEnterReward: {
          claimKey: 'city_hall_safe_first',
          items: [
            {
              id: 'seoul_emergency_plan',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'survivor_note',
            weight: 6,
          },
          {
            id: 'map_fragment',
            weight: 5,
          },
          {
            id: 'emergency_kit',
            weight: 3,
          },
        ],
      },
      {
        id: 'junggu_food',
        name: '식료품 구역',
        icon: '🥫',
        desc: '식품 가게들이 밀집한 구역. 상한 음식과 온전한 식량이 뒤섞여 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'canned_food',
            weight: 5,
          },
          {
            id: 'dried_meat',
            weight: 4,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 1,
          },
        ],
        lootCount: [
          3,
          5,
        ],
      },
      {
        id: 'junggu_clothing',
        name: '의류 창고',
        icon: '🧣',
        desc: '의류·직물 창고. 방어구 제작 재료를 구할 수 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'cloth',
            weight: 5,
          },
          {
            id: 'leather',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'work_gloves',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'junggu_electronics',
        name: '전자제품 코너',
        icon: '📻',
        desc: '배터리, 부품 등 전자기기 관련 잔해.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'junggu_underground',
        name: '지하 창고',
        icon: '🚪',
        desc: '시장 지하 물류 창고. 어둡고 좁다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'crowbar',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'junggu_subway',
        name: '지하철 연결 통로',
        icon: '🚇',
        desc: '시장 지하 지하철 연결 통로. 좀비 떼가 집결해 있다.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'crowbar',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 3,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'canned_food',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'leather',
        weight: 15,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'empty_bottle',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  yongsan: {
    name: '전쟁기념관',
    desc: '한국 전쟁사 기념관. 군사 장비 전시물과 지하 벙커가 있다.',
    icon: '🪖',
    subLocations: [
      {
        id: 'yongsan_front_gate',
        name: '기념관 정문',
        icon: '🎖️',
        desc: '전차 두 대가 지키던 정문. 한 대는 포탑이 돌아간 채 멈춰 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 35,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'cloth',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'duct_tape',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_yongsan.png',
      },
      {
        id: 'sl_yongsan_armory',
        name: '미군기지 무기고',
        icon: '🔫',
        desc: '기념관 담장 너머 옛 기지 구역. 전자식 잠금이 예비 전원으로 버티고 있다.',
        dangerMod: 0.35,
        requiresHiddenLocation: 'hidden_yongsan_us_armory',
        firstEnterReward: {
          claimKey: 'yongsan_armory_first',
          items: [
            {
              id: 'm4_carbine',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'pistol_ammo',
            weight: 6,
          },
          {
            id: 'shotgun_ammo',
            weight: 4,
          },
          {
            id: 'military_ration',
            weight: 4,
          },
          {
            id: 'flashbang',
            weight: 3,
          },
        ],
      },
      {
        id: 'yongsan_outdoor',
        name: '야외 전시장',
        icon: '⚓',
        desc: '탱크·전투기 실물 전시 구역. 잔해에서 금속 재료를.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'iron_pipe',
            weight: 2,
          },
          {
            id: 'wire',
            weight: 2,
          },
          {
            id: 'nail',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'yongsan_history',
        name: '전쟁역사관',
        icon: '🏛️',
        desc: '전쟁 역사 전시관. 의무 물자가 남아있을 가능성.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'yongsan_weapons',
        name: '무기 전시실',
        icon: '⚔️',
        desc: '소화기·도검 전시 구역. 일부 전시품은 실물일 수 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'knife',
            weight: 2,
          },
          {
            id: 'baseball_bat',
            weight: 2,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'crowbar',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'yongsan_bunker',
        name: '지하 벙커',
        icon: '🔒',
        desc: '비상용 군사 벙커. 보급품이 비축돼 있을 수 있다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'first_aid_kit',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'tactical_vest',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'yongsan_arsenal',
        name: '무기고',
        icon: '💣',
        desc: '실제 무기가 보관된 구역. 극도로 위험하다.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'machete',
            weight: 3,
          },
          {
            id: 'knife',
            weight: 3,
          },
          {
            id: 'pistol_ammo',
            weight: 3,
          },
          {
            id: 'molotov_cocktail',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'empty_cartridge',
        weight: 18,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'duct_tape',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'kevlar_fabric',
        weight: 6,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  seongdong: {
    name: '성수 공장지대',
    desc: '서울의 산업 심장부. 가죽 공방, 금속 가공소 등이 밀집해 있다.',
    icon: '🏭',
    subLocations: [
      {
        id: 'seongdong_gateway',
        name: '공장지대 진입로',
        icon: '🏭',
        desc: '철제 아치 아래 진입로. 바닥에 절삭유가 굳어 미끄럽다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 35,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'nail',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'wire',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_seongdong.png',
      },
      {
        id: 'sl_seongdong_master_workshop',
        name: '장인의 작업실',
        icon: '🔨',
        desc: '공장지대 안쪽 3층. 문패 없이 공구만 벽 한 면을 채운 방.',
        dangerMod: 0.15,
        requiresHiddenLocation: 'hidden_seongdong_forge_master',
        firstEnterReward: {
          claimKey: 'master_workshop_first',
          items: [
            {
              id: 'master_toolkit',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'pipe_wrench',
            weight: 4,
          },
          {
            id: 'duct_tape',
            weight: 5,
          },
          {
            id: 'spring',
            weight: 4,
          },
        ],
      },
      {
        id: 'sl_seongdong_bridge_shelter',
        name: '다리 아래 은신처',
        icon: '🌉',
        desc: '공장지대 서쪽 강변길 끝, 동호대교 교각 사이. 플라스틱 박스와 낡은 침낭이 2년치 자리를 지키고 있다.',
        dangerMod: 0.05,
        requiresHiddenLocation: 'hidden_yangcheon_dongho_bridge',
        firstEnterReward: {
          claimKey: 'dongho_shelter_first',
          items: [
            {
              id: 'survival_journal',
              qty: 1,
            },
            {
              id: 'canned_food',
              qty: 3,
            },
            {
              id: 'rope',
              qty: 2,
            },
          ],
        },
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 7,
          },
          {
            id: 'cloth',
            weight: 6,
          },
          {
            id: 'empty_bottle',
            weight: 6,
          },
          {
            id: 'rope',
            weight: 4,
          },
        ],
      },
      {
        id: 'seongdong_metal',
        name: '금속 가공 공장',
        icon: '⚙️',
        desc: '철제 부품·금속 재료의 보고.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'nail',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'iron_pipe',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seongdong_leather',
        name: '가죽 공방',
        icon: '👜',
        desc: '핸드메이드 가죽 제품 공방. 방어구 재료 확보 가능.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'leather',
            weight: 5,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'work_gloves',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seongdong_chemical',
        name: '화학 저장소',
        icon: '🧪',
        desc: '유해 화학 물질 저장소. 방호 장비 없이 진입 위험.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'rad_blocker',
            weight: 1,
          },
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'seongdong_warehouse',
        name: '창고 지구',
        icon: '📦',
        desc: '대형 물류 창고. 다양한 재료가 쌓여 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'wood',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seongdong_workshop',
        name: '작업장',
        icon: '🔧',
        desc: '공구와 부품이 가득한 작업실.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'whetstone',
            weight: 15,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'nail',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'duct_tape',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'wire',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'nail',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'refined_metal',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  gwangjin: {
    name: '어린이대공원',
    desc: '서울 동부의 대형 공원. 동물원, 식물원, 유원지가 있다.',
    icon: '🎡',
    subLocations: [
      {
        id: 'gwangjin_gate',
        name: '정문 광장',
        icon: '🚪',
        desc: '공원 입구. 좀비가 집결해 있지만 넘어온 물자도 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'baseball_bat',
            weight: 2,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        isEntrance: true,
      },
      {
        id: 'sl_gwangjin_zoo_lab',
        name: '동물 연구소',
        icon: '🐯',
        desc: '사육사 구역 안쪽 검역동. 우리 문이 안에서 뜯겨 있다.',
        dangerMod: 0.2,
        bossId: 'boss_mutant_alpha_tiger',
        requiresHiddenLocation: 'hidden_gwangjin_zoo_laboratory',
        firstEnterReward: {
          claimKey: 'gwangjin_zoolab_first',
          items: [
            {
              id: 'veterinary_tranquilizer',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'hide',
            weight: 5,
          },
          {
            id: 'bone',
            weight: 5,
          },
        ],
      },
      {
        id: 'gwangjin_zoo',
        name: '동물원 구역',
        icon: '🦁',
        desc: '탈출한 동물들이 배회하는 위험 구역.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'rope',
            weight: 4,
          },
          {
            id: 'leather',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'bamboo_shoot',
            weight: 18,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gwangjin_botanical',
        name: '식물원',
        icon: '🌿',
        desc: '약용 식물이 자생하는 온실. 의료 재료 획득 가능.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'vitamins',
            weight: 5,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
          {
            id: 'wild_strawberry',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gwangjin_kiosk',
        name: '공원 매점',
        icon: '🍿',
        desc: '공원 내 편의 시설. 식량이 남아있을 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gwangjin_rides',
        name: '놀이기구 구역',
        icon: '🎢',
        desc: '방치된 놀이시설. 기계 부품을 얻을 수 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 2,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'wild_berry',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  dongdaemun: {
    name: '경희의료원',
    desc: '대형 종합병원. 의약품과 의료 장비의 보고지만 감염 위험이 높다.',
    icon: '🏥',
    subLocations: [
      {
        id: 'dongdaemun_lobby',
        name: '의료원 현관',
        icon: '🏥',
        desc: '회전문이 반쯤 열린 채 멈췄다. 접수대 유리에 손자국이 겹겹이 남았다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'bandage',
            weight: 30,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'cloth',
            weight: 28,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'plastic',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_dongdaemun.png',
      },
      {
        id: 'sl_dongdaemun_workshop',
        name: '재단사의 공방',
        icon: '🧵',
        desc: '의료원 뒤편 봉제골목 안쪽. 셔터가 반쯤 내려간 작업실에 재봉틀 여섯 대가 그대로 있다.',
        dangerMod: 0.08,
        requiresHiddenLocation: 'hidden_dongdaemun_secret_workshop',
        firstEnterReward: {
          claimKey: 'dongdaemun_workshop_first',
          items: [
            {
              id: 'kevlar_fabric',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'cloth',
            weight: 6,
          },
          {
            id: 'thread',
            weight: 6,
          },
          {
            id: 'large_cloth',
            weight: 3,
          },
        ],
      },
      {
        id: 'dongdaemun_er',
        name: '응급실',
        icon: '🚨',
        desc: '응급 처치 구역. 의료 물자가 풍부하지만 좀비가 많다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'bandage',
            weight: 5,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'dongdaemun_pharmacy',
        name: '약품 창고',
        icon: '💊',
        desc: '병원 의약품 보관실. 자물쇠가 걸려있지만 내부엔 귀한 약이.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'antibiotics',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 4,
          },
          {
            id: 'rad_blocker',
            weight: 1,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'dongdaemun_or',
        name: '수술실',
        icon: '🔬',
        desc: '외과 수술 설비. 정밀 의료 도구가 남아있을 수 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'surgery_kit',
            weight: 1,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'splint',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'dongdaemun_icu',
        name: '중환자실',
        icon: '❤️',
        desc: '중환자 병동. 생존 물자가 가장 풍부하나 가장 위험하다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'stimulant',
            weight: 2,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'antibiotics',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'dongdaemun_records',
        name: '의무기록실',
        icon: '📋',
        desc: '환자 기록 서류가 쌓인 조용한 구역. 처방약 샘플이 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'antibiotics',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'stimulant',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'dongdaemun_basement',
        name: '지하 창고',
        icon: '🗄️',
        desc: '병원 지하 물자 창고. 유지보수 공구와 의료 자재.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'duct_tape',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'pipe_wrench',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'bandage',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'antiseptic',
        weight: 22,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'painkiller',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'alcohol_solution',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  jungrang: {
    name: '용마랜드 폐유원지',
    desc: '수십 년째 방치된 유원지. 녹슨 놀이기구와 음산한 분위기.',
    icon: '🎠',
    subLocations: [
      {
        id: 'jungnang_ticket',
        name: '매표소',
        icon: '🎫',
        desc: '유원지 입구 매표소. 조용한 편이다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        isEntrance: true,
      },
      {
        id: 'sl_jungrang_water_control',
        name: '정수장 컨트롤룸',
        icon: '💧',
        desc: '용마산 능선 너머 배수지 계통의 중앙 제어실. 급수 도면이 벽 전체를 덮고 있다.',
        dangerMod: 0.15,
        requiresHiddenLocation: 'hidden_jungrang_water_treatment',
        firstEnterReward: {
          claimKey: 'jungrang_control_first',
          items: [
            {
              id: 'industrial_purifier',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'purified_water',
            weight: 8,
          },
          {
            id: 'water_filter',
            weight: 5,
          },
          {
            id: 'electronic_parts',
            weight: 4,
          },
        ],
      },
      {
        id: 'jungnang_ferris',
        name: '관람차 주변',
        icon: '🎡',
        desc: '거대한 관람차 기저부. 녹슨 금속이 가득하다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
          {
            id: 'iron_pipe',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'jungnang_ride_storage',
        name: '놀이기구 창고',
        icon: '🔩',
        desc: '유지보수용 부품이 쌓인 창고.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'jungnang_control',
        name: '구 관리실',
        icon: '🖥️',
        desc: '유원지 통합 관리 시설. 전기 부품이 남아있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'electronic_parts',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'jungnang_boiler',
        name: '지하 보일러실',
        icon: '🔥',
        desc: '고온 위험 구역. 물자는 풍부하나 유독 가스 주의.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'plastic',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'spring',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  seongbuk: {
    name: '고려대학교',
    desc: '명문 대학 캠퍼스. 법학·의학·체육 시설이 혼재하며 물자가 다양하다.',
    icon: '🎓',
    subLocations: [
      {
        id: 'seongbuk_main_gate',
        name: '대학 정문',
        icon: '🎓',
        desc: '돌기둥 사이 정문. 게시판에 대피 안내문이 빗물에 번져 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'plastic',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'thread',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_seongbuk.png',
      },
      {
        id: 'sl_seongbuk_research_bunker',
        name: '지하 연구 벙커',
        icon: '🔬',
        desc: '이공대 건물 아래 봉인된 실험실. 배양기 전원이 아직 들어와 있다.',
        dangerMod: 0.12,
        requiresHiddenLocation: 'hidden_seongbuk_university_bunker',
        firstEnterReward: {
          claimKey: 'seongbuk_bunker_first',
          items: [
            {
              id: 'experimental_antiviral',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'antibiotics',
            weight: 4,
          },
          {
            id: 'antiseptic',
            weight: 5,
          },
          {
            id: 'electronic_parts',
            weight: 4,
          },
        ],
      },
      {
        id: 'seongbuk_medschool',
        name: '의과대학',
        icon: '🏥',
        desc: '의학 교육 시설. 실습용 의약품이 남아있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'surgery_kit',
            weight: 1,
          },
          {
            id: 'antibiotics',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'seongbuk_sports',
        name: '화정체육관',
        icon: '🏟️',
        desc: '대형 실내 체육 시설. 스포츠 장비와 의무용품이 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'leather',
            weight: 2,
          },
          {
            id: 'work_gloves',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seongbuk_law',
        name: '법학전문대학원',
        icon: '⚖️',
        desc: '고려대 명물 법대. 사무용품·의약품·비상식량이 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'canned_food',
            weight: 2,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'seongbuk_dorm',
        name: '학생 기숙사',
        icon: '🛏️',
        desc: '학생 기숙사. 생활 물자와 식량이 남아있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seongbuk_cafeteria',
        name: '학생식당',
        icon: '🍱',
        desc: '대형 학생 식당. 식량 재고와 주방 도구.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'canned_food',
            weight: 5,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'knife',
            weight: 2,
          },
          {
            id: 'vitamins',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
    ],
    lootTable: [
      {
        id: 'glass_shard',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'plastic',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'thread',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'alcohol_solution',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  gangbuk: {
    name: '북한산성',
    desc: '조선 시대 산성. 산 위에 위치해 물자는 적지만 안전하고 전망이 좋다.',
    icon: '🏔️',
    subLocations: [
      {
        id: 'gangbuk_gate',
        name: '성문',
        icon: '🚪',
        desc: '오래된 성문. 금속 부품을 뜯어낼 수 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'nail',
            weight: 3,
          },
          {
            id: 'wood',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
        isEntrance: true,
      },
      {
        id: 'sl_gangbuk_hidden_spring',
        name: '숨겨진 샘',
        icon: '💧',
        desc: '비가 와야 물길이 드러나는 바위 아래 샘. 마르면 흔적도 남지 않는다.',
        dangerMod: 0,
        requiresHiddenLocation: 'hidden_gangbuk_mountain_spring',
        firstEnterReward: {
          claimKey: 'gangbuk_spring_first',
          items: [
            {
              id: 'pristine_spring_water',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'purified_water',
            weight: 8,
          },
          {
            id: 'mountain_water',
            weight: 6,
          },
        ],
      },
      {
        id: 'gangbuk_beacon',
        name: '봉수대',
        icon: '🔭',
        desc: '산 정상 봉화대. 조망은 좋으나 노출이 심하다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'wood',
            weight: 5,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'pine_nut',
            weight: 20,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'herb',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gangbuk_barracks',
        name: '군사 막사 터',
        icon: '⛺',
        desc: '옛 군사 시설 터. 군용 물자가 남아 있을 수도.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'knife',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'wild_root',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'gangbuk_well',
        name: '우물',
        icon: '💧',
        desc: '성 내부 우물. 물을 구할 수 있지만 오염 여부 불명.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
          {
            id: 'vitamins',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gangbuk_arsenal',
        name: '무기고 터',
        icon: '⚔️',
        desc: '과거 무기 보관소 터. 녹슨 무기 잔해.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'machete',
            weight: 1,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'nail',
            weight: 4,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
    ],
    lootTable: [
      {
        id: 'wood',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'hide',
        weight: 15,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'firestone',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  dobong: {
    name: '도봉산 등산로',
    desc: '울창한 산림과 암벽이 있는 등산 명소. 야생 약초와 자원이 풍부하다.',
    icon: '⛰️',
    subLocations: [
      {
        id: 'dobong_entrance',
        name: '등산 초입부',
        icon: '🌲',
        desc: '등산로 입구. 목재와 로프를 구할 수 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'wood',
            weight: 5,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'vitamins',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          4,
        ],
        isEntrance: true,
      },
      {
        id: 'sl_dobong_hermit_cave',
        name: '은자의 동굴',
        icon: '🕯',
        desc: '등산로에서 벗어난 바위 틈. 마른 약초 다발과 손때 묻은 절구가 그대로 놓여 있다.',
        dangerMod: 0.05,
        requiresHiddenLocation: 'hidden_dobong_hermit_cave',
        firstEnterReward: {
          claimKey: 'dobong_hermit_first',
          items: [
            {
              id: 'hermit_elixir',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'herb',
            weight: 6,
          },
          {
            id: 'herbal_tea',
            weight: 4,
          },
          {
            id: 'cloth',
            weight: 3,
          },
        ],
      },
      {
        id: 'dobong_lodge',
        name: '산장',
        icon: '🏠',
        desc: '산 중턱 등산객 쉼터. 비상 용품이 있을 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'chestnut',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'dobong_shelter',
        name: '정상 대피소',
        icon: '🏕️',
        desc: '산 정상 비상 대피소. 귀한 의료품이 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'wild_grape',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'splint',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'dobong_valley',
        name: '계곡',
        icon: '🌊',
        desc: '맑은 계곡물. 약초도 자란다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'purified_water',
            weight: 4,
          },
          {
            id: 'vitamins',
            weight: 4,
          },
          {
            id: 'contaminated_water',
            weight: 1,
          },
          {
            id: 'acorn',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'dobong_cliff',
        name: '암벽 지대',
        icon: '🧗',
        desc: '가파른 암벽 지역. 오르기 어렵지만 로프 등 장비가 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'rope',
            weight: 4,
          },
          {
            id: 'leather',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'pine_cone',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
    ],
    lootTable: [
      {
        id: 'wood',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'herb',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'mushroom_edible',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wild_berry',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  nowon: {
    name: '태릉선수촌',
    desc: '1966년 설립된 국가 대표 엘리트 훈련 기지. 폐허가 됐지만 시설이 견고하다.',
    icon: '🏅',
    subLocations: [
      {
        id: 'nowon_main_gate',
        name: '선수촌 정문',
        icon: '🏅',
        desc: '차단기가 내려간 정문. 경비실 안에 방문자 명부가 펼쳐져 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'canned_food',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'rope',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_nowon.png',
      },
      {
        id: 'sl_nowon_hidden_depot',
        name: '지하 비축 창고',
        icon: '🔐',
        desc: '선수촌 지하 통로가 노원역 상가까지 이어진다. 누군가 이 끝에 물자를 차곡차곡 쌓아두었다.',
        dangerMod: 0.05,
        requiresHiddenLocation: 'hidden_nowon_underground_mall',
        firstEnterReward: {
          claimKey: 'nowon_depot_first',
          items: [
            {
              id: 'survivors_cache',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'canned_food',
            weight: 5,
          },
          {
            id: 'water_bottle',
            weight: 5,
          },
          {
            id: 'bandage',
            weight: 4,
          },
        ],
      },
      {
        id: 'nowon_gym',
        name: '실내 체육관',
        icon: '🏋️',
        desc: '격투·역도 전용 체육관. 운동 장비와 의무용품이 남아있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'leather',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'work_gloves',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'nowon_pool',
        name: '실내 수영장',
        icon: '🏊',
        desc: '50m 실내 수영장. 물을 구할 수 있지만 오염됐을 가능성이 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'nowon_dorm',
        name: '선수 기숙사',
        icon: '🛏️',
        desc: '국가 대표 선수들의 합숙 공간. 개인 물품과 식량이 남아있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'nowon_medical',
        name: '의무실',
        icon: '🩺',
        desc: '스포츠 의학 전문 의무실. 재활 치료 물자가 풍부하다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'splint',
            weight: 3,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'nowon_cafeteria',
        name: '급식소',
        icon: '🍽️',
        desc: '선수단 전용 식당. 대용량 비축 식품과 영양제가 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'canned_food',
            weight: 5,
          },
          {
            id: 'vitamins',
            weight: 4,
          },
          {
            id: 'dried_meat',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          5,
        ],
      },
      {
        id: 'nowon_field',
        name: '야외 훈련장',
        icon: '🏃',
        desc: '육상 트랙과 야외 기구. 시야가 트여있어 감시에 유리하다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'rope',
            weight: 4,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'canned_food',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'duct_tape',
        weight: 18,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  eunpyeong: {
    name: '진관사',
    desc: '북한산 자락의 천년 고찰. 고요하고 약초원이 잘 보존돼 있다.',
    icon: '⛩️',
    subLocations: [
      {
        id: 'eunpyeong_iljumun',
        name: '일주문',
        icon: '⛩️',
        desc: '기둥 넷이 떠받친 산문. 풍경 소리 대신 바람만 지난다.',
        dangerMod: 0,
        isEntrance: true,
        lootTable: [
          {
            id: 'herb',
            weight: 35,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'wood',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'cloth',
            weight: 20,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_eunpyeong.png',
      },
      {
        id: 'sl_eunpyeong_fire_station',
        name: '불광 소방서',
        icon: '🚒',
        desc: '진관사에서 내려오는 길목, 불광동 초입. 차고 문이 반쯤 열린 채 멈춰 있다.',
        dangerMod: 0.15,
        requiresHiddenLocation: 'hidden_eunpyeong_fire_station',
        firstEnterReward: {
          claimKey: 'eunpyeong_station_first',
          items: [
            {
              id: 'rope_ladder',
              qty: 1,
            },
            {
              id: 'crowbar',
              qty: 1,
            },
            {
              id: 'first_aid_kit',
              qty: 2,
            },
            {
              id: 'firefighter_badge',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'rope',
            weight: 7,
          },
          {
            id: 'wire',
            weight: 6,
          },
          {
            id: 'scrap_metal',
            weight: 6,
          },
          {
            id: 'bandage',
            weight: 4,
          },
        ],
      },
      {
        id: 'eunpyeong_main_hall',
        name: '대웅전',
        icon: '🏯',
        desc: '사찰 중심 법당. 조용하고 상대적으로 안전하다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'cloth',
            weight: 4,
          },
          {
            id: 'herb',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'lighter',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'eunpyeong_storage',
        name: '사찰 창고',
        icon: '📦',
        desc: '사찰 용품 창고. 다양한 물자가 보관돼 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'wood',
            weight: 3,
          },
          {
            id: 'apple_wild',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'eunpyeong_quarters',
        name: '스님 거처',
        icon: '🛏️',
        desc: '승려 거주 공간. 생활 물자가 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'eunpyeong_dining',
        name: '공양 식당',
        icon: '🍱',
        desc: '사찰 식당. 식량이 남아 있을 수 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'dried_meat',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'vegetable',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'eunpyeong_herb',
        name: '약초원',
        icon: '🌿',
        desc: '약용 식물을 재배하던 약초원. 의료 재료의 보고.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'vitamins',
            weight: 7,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'antidote',
            weight: 3,
          },
          {
            id: 'pine_needle',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          3,
          5,
        ],
      },
    ],
    lootTable: [
      {
        id: 'herb',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'cloth',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'dandelion',
        weight: 15,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  seodaemun: {
    name: '신촌 세브란스병원',
    desc: '연세대 부속 종합병원. 감염 위험이 높으나 의약품이 풍부하다.',
    icon: '🏥',
    subLocations: [
      {
        id: 'seodaemun_lobby',
        name: '병원 정문',
        icon: '🏥',
        desc: '응급 차량 진입로가 들것으로 막혔다. 자동문은 전원이 끊겼다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'bandage',
            weight: 30,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'glass_shard',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'cloth',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_seodaemun.png',
      },
      {
        id: 'sl_seodaemun_p4_lab',
        name: 'P4 연구실',
        icon: '🧫',
        desc: '본관 지하 4층, 이중 기밀문 안쪽. 음압 경보가 아직 낮게 울리고 있다.',
        dangerMod: 0.3,
        requiresHiddenLocation: 'hidden_seodaemun_severance_lab',
        firstEnterReward: {
          claimKey: 'p4_lab_first',
          items: [
            {
              id: 'virus_sample',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'antibiotics',
            weight: 5,
          },
          {
            id: 'rad_blocker',
            weight: 4,
          },
          {
            id: 'first_aid_kit',
            weight: 5,
          },
          {
            id: 'antiseptic',
            weight: 5,
          },
        ],
      },
      {
        id: 'seodaemun_er',
        name: '응급실',
        icon: '🚨',
        desc: '응급 처치 구역. 혼잡하고 위험하다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'bandage',
            weight: 5,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seodaemun_pharmacy',
        name: '약품 창고',
        icon: '💊',
        desc: '희귀 의약품 보관 냉장 창고.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'antibiotics',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'stimulant',
            weight: 2,
          },
          {
            id: 'rad_blocker',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'seodaemun_or',
        name: '수술실',
        icon: '🔬',
        desc: '외과 수술 시설. 전문 의료 도구.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'surgery_kit',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'splint',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'seodaemun_lab',
        name: '연구실',
        icon: '⚗️',
        desc: '의학 연구 실험실. 시약과 희귀 약품.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'rad_blocker',
            weight: 2,
          },
          {
            id: 'antidote',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'antibiotics',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'seodaemun_morgue',
        name: '영안실',
        icon: '🪦',
        desc: '시신 안치실. 으스스하지만 의료 도구가 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'antidote',
            weight: 1,
          },
          {
            id: 'splint',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'seodaemun_basement',
        name: '지하 물자 창고',
        icon: '🗄️',
        desc: '병원 지하 종합 창고. 의료 소모품과 유지보수 도구.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'flashlight',
            weight: 3,
          },
          {
            id: 'duct_tape',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'bandage',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'antiseptic',
        weight: 22,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'painkiller',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'glass_shard',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  mapo: {
    name: '홍대 클럽가',
    desc: '서울의 젊음이 모이던 거리. 가게들이 밀집해 생존 물자를 찾을 수 있다.',
    icon: '🎵',
    subLocations: [
      {
        id: 'mapo_street_entry',
        name: '클럽가 초입',
        icon: '🎸',
        desc: '네온 간판이 죽은 골목 초입. 깨진 병이 카펫처럼 깔려 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'empty_bottle',
            weight: 35,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'cloth',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'plastic',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_mapo.png',
      },
      {
        id: 'sl_mapo_club_basement',
        name: '라이브클럽 지하',
        icon: '🎸',
        desc: '방음벽이 두 겹인 지하 공연장. 바깥 소리가 들어오지 않고, 안쪽 소리도 새어나가지 않는다.',
        dangerMod: 0.08,
        requiresHiddenLocation: 'hidden_mapo_hongdae_basement',
        firstEnterReward: {
          claimKey: 'mapo_club_first',
          items: [
            {
              id: 'sound_dampener',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 5,
          },
          {
            id: 'cloth',
            weight: 4,
          },
        ],
      },
      {
        id: 'mapo_club',
        name: '클럽 내부',
        icon: '🎶',
        desc: '폐쇄된 클럽. 어둡고 음습하지만 물자가 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'stimulant',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'mapo_convenience',
        name: '편의점',
        icon: '🏪',
        desc: '방치된 편의점. 식량과 의약품이 남아있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'canned_food',
            weight: 5,
          },
          {
            id: 'purified_water',
            weight: 4,
          },
          {
            id: 'matches',
            weight: 18,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'mapo_underground',
        name: '지하 창고',
        icon: '🚪',
        desc: '술집·가게의 지하 창고. 잡다한 물자.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'mapo_parking',
        name: '주차장',
        icon: '🚗',
        desc: '대형 주차장. 차량 잔해에서 부품을 뜯을 수 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 2,
          },
          {
            id: 'crowbar',
            weight: 2,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'mapo_cafe',
        name: '카페 골목',
        icon: '☕',
        desc: '카페가 늘어선 골목. 식량과 물이 남아있을 수 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'empty_bottle',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'plastic',
        weight: 22,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'battery',
        weight: 8,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  yangcheon: {
    name: '목동 경기장',
    desc: '서울 서부의 종합 스포츠 경기장. 의무실과 기계실이 있다.',
    icon: '🏟️',
    subLocations: [
      {
        id: 'yangcheon_ticket_gate',
        name: '경기장 매표소',
        icon: '🎫',
        desc: '회전식 개찰구가 줄줄이 잠겼다. 매표 창구 유리가 깨져 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'plastic',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'rope',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_yangcheon.png',
      },
      {
        id: 'sl_yangcheon_civil_shelter',
        name: '민방위 대피소',
        icon: '🛡️',
        desc: '경기장 맞은편 아파트 단지 지하. 계획서에 적힌 비축 규격 그대로 쌓여 있다.',
        dangerMod: 0.05,
        requiresHiddenLocation: 'hidden_yangcheon_mokdong_bunker',
        firstEnterReward: {
          claimKey: 'mokdong_shelter_first',
          items: [
            {
              id: 'civil_defense_cache',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'canned_food',
            weight: 8,
          },
          {
            id: 'water_bottle',
            weight: 7,
          },
          {
            id: 'bandage',
            weight: 5,
          },
        ],
      },
      {
        id: 'yangcheon_stands',
        name: '관중석',
        icon: '🪑',
        desc: '드넓은 관중석. 잔해에서 금속 부품을.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'baseball_bat',
            weight: 1,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'yangcheon_locker',
        name: '선수 라커룸',
        icon: '🏋️',
        desc: '선수 전용 라커룸. 의무 용품과 장비가 남아있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'work_gloves',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'yangcheon_mechanical',
        name: '기계실',
        icon: '⚙️',
        desc: '경기장 설비 기계실. 전기·금속 부품.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'electronic_parts',
            weight: 2,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'yangcheon_concession',
        name: '매점',
        icon: '🍔',
        desc: '경기장 내 매점. 식량이 남아있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'yangcheon_parking',
        name: '주차장',
        icon: '🅿️',
        desc: '지하 주차장. 차량 잔해',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'plastic',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'canned_food',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  gangseo: {
    name: '김포공항',
    desc: '국내선 공항. 화물터미널과 격납고에 다양한 물자가 있을 수 있다.',
    icon: '✈️',
    subLocations: [
      {
        id: 'gangseo_terminal_entry',
        name: '국내선 청사 입구',
        icon: '✈️',
        desc: '캐리어가 뒤엉킨 출입구. 안내 전광판이 마지막 편명을 붙들고 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'duct_tape',
            weight: 25,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'cloth',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_gangseo.png',
      },
      {
        id: 'sl_gangseo_hangar',
        name: '격납고',
        icon: '✈️',
        desc: '활주로 끝 정비 격납고. 반쯤 분해된 기체가 잭에 올라간 채 멈춰 있다.',
        dangerMod: 0.25,
        requiresHiddenLocation: 'hidden_gangseo_airport_hangar',
        firstEnterReward: {
          claimKey: 'gimpo_hangar_first',
          items: [
            {
              id: 'aircraft_parts',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 6,
          },
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'rope',
            weight: 4,
          },
          {
            id: 'fuel_can',
            weight: 3,
          },
        ],
      },
      {
        id: 'gangseo_departure',
        name: '출국장',
        icon: '🛫',
        desc: '여행객이 버리고 간 물자들이 곳곳에 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangseo_cargo',
        name: '화물 터미널',
        icon: '📦',
        desc: '화물 창고. 다양한 물자가 컨테이너에 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangseo_hangar',
        name: '격납고',
        icon: '🛩️',
        desc: '항공기 정비 격납고. 금속 부품의 보고.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'duct_tape',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          5,
        ],
      },
      {
        id: 'gangseo_dutyfree',
        name: '면세점',
        icon: '🛍️',
        desc: '약품·화장품이 남아있는 면세구역.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'vitamins',
            weight: 3,
          },
          {
            id: 'stimulant',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangseo_tower',
        name: '관제탑',
        icon: '📡',
        desc: '공항 관제탑. 전자 장비가 가득하다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'gangseo_fuel',
        name: '연료 저장소',
        icon: '⛽',
        desc: '항공 연료 보관소. 화재 위험이 높지만 유용한 재료가.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'molotov_cocktail',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'duct_tape',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wire',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'brass_fragment',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  guro: {
    name: '구로디지털단지',
    desc: 'IT 기업이 밀집한 테크 단지. 전자 부품과 서버 장비가 있다.',
    icon: '💻',
    subLocations: [
      {
        id: 'guro_complex_entry',
        name: '단지 진입로',
        icon: '🏢',
        desc: '사원증 게이트가 열린 채다. 자전거 거치대가 통째로 넘어져 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 28,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'wire',
            weight: 25,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'plastic',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_guro.png',
      },
      {
        id: 'sl_guro_secret_forge',
        name: '비밀 대장간',
        icon: '🔥',
        desc: '데이터센터 지하 기계실을 개조한 대장간. 송풍구에서 아직 열기가 올라온다.',
        dangerMod: 0.1,
        requiresHiddenLocation: 'hidden_guro_factory_forge',
        firstEnterReward: {
          claimKey: 'guro_forge_first',
          items: [
            {
              id: 'master_forge',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 6,
          },
          {
            id: 'charcoal',
            weight: 5,
          },
          {
            id: 'sharp_blade',
            weight: 3,
          },
        ],
      },
      {
        id: 'guro_office',
        name: 'IT 사무실',
        icon: '🖥️',
        desc: '테크 기업 사무실. 전자 부품이 곳곳에.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 2,
          },
          {
            id: 'flashlight',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'guro_server',
        name: '서버실',
        icon: '🖧',
        desc: '대형 데이터센터 서버실. 최고급 전자 부품.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'guro_warehouse',
        name: '물류 창고',
        icon: '📦',
        desc: 'IT 기기 물류 창고. 포장재와 부품들.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 4,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'guro_parts_store',
        name: '전자 부품 상점',
        icon: '🔌',
        desc: '전자 부품 전문 소매점.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'nail',
            weight: 2,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'guro_parking',
        name: '지하 주차장',
        icon: '🅿️',
        desc: '지하 주차장. 차량 잔해에서 금속을.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'crowbar',
            weight: 2,
          },
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'iron_pipe',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'electronic_parts',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wire',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'plastic',
        weight: 22,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'copper_coil',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  geumcheon: {
    name: '독산동 공장지대',
    desc: '중공업 공장들이 밀집한 산업 단지. 금속과 화학 물자가 풍부하다.',
    icon: '🏗️',
    subLocations: [
      {
        id: 'geumcheon_front_gate',
        name: '공장지대 정문',
        icon: '🏭',
        desc: '철망 정문이 안쪽으로 휘었다. 수위실 창에 금이 갔다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 35,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'nail',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'wire',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_geumcheon.png',
      },
      {
        id: 'sl_geumcheon_secret_factory',
        name: '지하 군수 라인',
        icon: '⚙️',
        desc: '계획서에 폐쇄로 적힌 하청 공장. 지하 2층에서 탄약 압착기가 아직 기름칠된 채로 서 있다.',
        dangerMod: 0.35,
        requiresHiddenLocation: 'hidden_geumcheon_underground_factory',
        firstEnterReward: {
          claimKey: 'geumcheon_line_first',
          items: [
            {
              id: 'ammo_press',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'pistol_ammo',
            weight: 7,
          },
          {
            id: 'gunpowder',
            weight: 5,
          },
          {
            id: 'scrap_metal',
            weight: 6,
          },
        ],
      },
      {
        id: 'geumcheon_metal',
        name: '금속 공장',
        icon: '⚒️',
        desc: '철제 제품 생산 공장. 금속 재료의 보고.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'nail',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          5,
        ],
      },
      {
        id: 'geumcheon_chemical',
        name: '화학 공장',
        icon: '☣️',
        desc: '화학 물질 제조 공장. 방호 없이 진입 위험.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
          {
            id: 'rad_blocker',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'geumcheon_warehouse_complex',
        name: '창고 단지',
        icon: '🏚️',
        desc: '공장 물류 창고 군. 다양한 재료.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'wood',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          5,
        ],
      },
      {
        id: 'geumcheon_waste',
        name: '폐기물 처리장',
        icon: '♻️',
        desc: '산업 폐기물 처리 시설. 위험하지만 재료가 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'rubber',
            weight: 4,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'contaminated_water',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'geumcheon_power',
        name: '발전소',
        icon: '⚡',
        desc: '공장 전용 발전 시설. 전기 부품이 있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'wire',
            weight: 5,
          },
          {
            id: 'electronic_parts',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 35,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'nail',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'spring',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'refined_metal',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  yeongdeungpo: {
    name: '영등포 타임스퀘어',
    desc: '대형 복합 쇼핑몰. 식품관과 의류·전자제품 매장이 있다.',
    icon: '🛒',
    subLocations: [
      {
        id: 'yeongdeungpo_mall_gate',
        name: '쇼핑몰 정문',
        icon: '🛍️',
        desc: '회전문 앞에 쇼핑카트가 바리케이드처럼 쌓였다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'canned_food',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'empty_can',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_yeongdeungpo.png',
      },
      {
        id: 'yeongdeungpo_food',
        name: '식품관',
        icon: '🛒',
        desc: '대형 식품 코너. 통조림과 건조 식품이 많다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'canned_food',
            weight: 6,
          },
          {
            id: 'dried_meat',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
        ],
        lootCount: [
          3,
          5,
        ],
      },
      {
        id: 'yeongdeungpo_clothing',
        name: '의류 매장',
        icon: '👗',
        desc: '의류·직물 매장. 방어구 재료를 얻을 수 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'cloth',
            weight: 5,
          },
          {
            id: 'leather',
            weight: 2,
          },
          {
            id: 'work_gloves',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          5,
        ],
      },
      {
        id: 'yeongdeungpo_electronics',
        name: '전자제품 매장',
        icon: '📱',
        desc: '전자제품 전문관. 부품을 분리할 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'yeongdeungpo_rooftop',
        name: '옥상 정원',
        icon: '🌻',
        desc: '쇼핑몰 옥상 정원. 식물과 물이 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'vitamins',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'herb',
            weight: 2,
          },
          {
            id: 'herbal_tea',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'yeongdeungpo_storage',
        name: '지하 창고',
        icon: '🗄️',
        desc: '쇼핑몰 지하 물류 창고.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'duct_tape',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'yeongdeungpo_parking_tower',
        name: '주차 타워',
        icon: '🚗',
        desc: '다층 주차 타워. 차량 잔해와 연장.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'crowbar',
            weight: 2,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'canned_food',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'plastic',
        weight: 22,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'empty_can',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_kbs: {
    name: 'KBS 본관',
    desc: '여의도 방송국. 로비 전광판이 마지막 자막에서 멈춰 있다. 송신탑은 아직 서 있다.',
    icon: '📺',
    districts: [
      'yeongdeungpo',
    ],
    subLocations: [
      {
        id: 'sl_kbs_lobby',
        name: '로비·분장실',
        icon: '🎬',
        desc: '출입증이 바닥에 흩어져 있다. 분장실 거울 앞 의자가 아직 돌아간 채다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'cloth',
            weight: 6,
          },
          {
            id: 'battery',
            weight: 5,
          },
          {
            id: 'flashlight',
            weight: 3,
          },
        ],
        isEntrance: true,
        noSceneImage: true,
      },
      {
        id: 'sl_yeongdeungpo_kbs_studio',
        name: 'KBS 비밀 방송실',
        icon: '📡',
        desc: '본관 지하 3층 비상 스튜디오. 정규 계통과 분리된 송출 설비가 예비 전원으로 살아 있다.',
        dangerMod: 0.15,
        requiresHiddenLocation: 'hidden_yeongdeungpo_kbs_broadcast',
        firstEnterReward: {
          claimKey: 'kbs_studio_first',
          items: [
            {
              id: 'broadcast_equipment',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 6,
          },
          {
            id: 'wire',
            weight: 5,
          },
          {
            id: 'radio',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 4,
          },
        ],
      },
      {
        id: 'sl_kbs_newsroom',
        name: '보도국',
        icon: '🗞',
        desc: '모니터 수십 대가 꺼진 채 늘어서 있다. 화이트보드에 마지막 큐시트가 남아 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'survivor_note',
            weight: 6,
          },
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'kindling',
            weight: 4,
            minQty: 2,
            maxQty: 4,
          },
        ],
      },
      {
        id: 'sl_kbs_antenna',
        name: '송신탑 기저부',
        icon: '📶',
        desc: '옥상으로 이어지는 철제 계단. 급전선이 아직 팽팽하다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'wire',
            weight: 7,
          },
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'copper_wire',
            weight: 3,
          },
        ],
      },
    ],
    lootTable: [
      {
        id: 'electronic_parts',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'copper_coil',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'wire',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'battery',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_63_building: {
    name: '63빌딩',
    desc: '여의도 63빌딩. 금빛 외벽이 그을렸지만 구조물은 성하다. 상층에서 한강 이남까지 내려다보인다.',
    icon: '🏢',
    districts: [
      'yeongdeungpo',
    ],
    subLocations: [
      {
        id: 'sl_63_lobby',
        name: '1층 로비',
        icon: '🛎',
        desc: '대리석 로비. 관광객 안내 데스크와 기념품 매대가 뒤집혀 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'cloth',
            weight: 5,
          },
          {
            id: 'plastic',
            weight: 4,
          },
          {
            id: 'glass_shard',
            weight: 4,
          },
          {
            id: 'canned_food',
            weight: 3,
          },
        ],
        isEntrance: true,
      },
      {
        id: 'sl_63_observatory',
        name: '60층 전망대',
        icon: '🔭',
        desc: '통유리 전망대. 서울 서남부가 한눈에 들어온다. 망원경 거치대가 남아 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'binoculars',
            weight: 4,
          },
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'glass_shard',
            weight: 5,
          },
        ],
      },
      {
        id: 'sl_63_helipad',
        name: '옥상 헬리패드',
        icon: '🚁',
        desc: '기체는 없지만 포장과 H 도색은 멀짱하다. 유도등만 살리면 구조기가 내려앉을 수 있다.',
        dangerMod: 0.15,
        requiresHiddenLocation: 'hidden_yeongdeungpo_63_helipad',
        firstEnterReward: {
          claimKey: 'yeongdeungpo_63_helipad_first',
          items: [
            {
              id: 'military_radio_kit',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'battery',
            weight: 4,
          },
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 5,
          },
        ],
      },
    ],
    lootTable: [
      {
        id: 'glass_shard',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'scrap_metal',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'battery',
        weight: 8,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_boramae_hospital: {
    name: '보라매병원',
    desc: '서울시립 보라매병원. 응급실·수술실·약품 창고가 남아있고 감염 위험은 비교적 낮다.',
    icon: '🏥',
    districts: [
      'dongjak',
    ],
    subLocations: [
      {
        id: 'boramae_desk',
        name: '병원접수처',
        icon: '📍',
        desc: '불이 꺼진 병원 데스크. 접수 전용 설비 — 병원 입구, 의료 접수처로 이곳을 통해 병원 내부로 들어간다.',
        dangerMod: 0.01,
        lootTable: [
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'gauze',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        isEntrance: true,
        sceneImage: 'assets/images/landmarks/lm_boramae_hospital.png',
      },
      {
        id: 'boramae_emergency',
        name: '응급실',
        icon: '🚑',
        desc: '이지수가 마지막까지 지킨 응급실. 깨진 유리와 흩어진 처치 도구 — 초기 응급 약품의 기본.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'bandage',
            weight: 6,
          },
          {
            id: 'alcohol_swab',
            weight: 4,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'boramae_surgery',
        name: '수술실',
        icon: '🔪',
        desc: '무영등이 꺼진 수술실. 외과 전용 도구 — 메스와 수술키트가 잠겨 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'scalpel',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'combat_scalpel',
            weight: 6,
            minQty: 1,
            maxQty: 1,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'boramae_pharmacy',
        name: '약품 창고',
        icon: '💊',
        desc: '의약품 전용 창고. 처방약이 선반에 분류돼 있다 — 항생제·각성제·해독제가 공존한다.',
        dangerMod: 0.12,
        lootTable: [
          {
            id: 'antibiotics',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 4,
          },
          {
            id: 'vitamins',
            weight: 3,
          },
          {
            id: 'stimulant',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'boramae_morgue',
        name: '영안실',
        icon: '⚰️',
        desc: '지하 영안실. 오염된 공기, 방치된 시신 — 위험하지만 정맥주사와 강화 붕대가 남아있는 유일한 공간.',
        dangerMod: 0.18,
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'tattered_rags',
            weight: 4,
          },
          {
            id: 'iv_saline',
            weight: 2,
          },
          {
            id: 'reinforced_bandage',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'boramae_rooftop',
        name: '옥상 약초정원',
        icon: '🌿',
        desc: '헬리포트 옆 방치된 병원 약초정원. 삼백초·질경이가 자라고 있다 — 의사만이 알아볼 수 있는 천연 약재.',
        dangerMod: 0.08,
        lootTable: [
          {
            id: 'herb',
            weight: 6,
          },
          {
            id: 'herbal_tea',
            weight: 2,
          },
          {
            id: 'withered_tree',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'boramae_cafeteria',
        name: '병원 식당',
        icon: '🍱',
        desc: '직원·환자용 구내식당. 급식 카트와 저장고에 통조림·쌀·라면이 남아있다 — 의사라면 위생적으로 확보할 수 있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'canned_food',
            weight: 30,
          },
          {
            id: 'rice',
            weight: 25,
          },
          {
            id: 'instant_noodles',
            weight: 20,
          },
          {
            id: 'water_bottle',
            weight: 15,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'bandage',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'antiseptic',
        weight: 22,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'painkiller',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'alcohol_solution',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_dongjak: {
    name: '국립현충원',
    desc: '국가 유공자 묘역. 조용하고 넓은 숲이 있으며 관리 시설이 있다.',
    icon: '🎖️',
    subLocations: [
      {
        id: 'dongjak_hyeonchungmun',
        name: '현충문',
        icon: '🕊️',
        desc: '거대한 문 아래 헌화대. 시든 국화가 그대로 쌓여 있다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 28,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'wood',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'herb',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_dongjak.png',
      },
      {
        id: 'dongjak_memorial',
        name: '현충탑',
        icon: '🏛️',
        desc: '추모탑 주변. 조용하고 상대적으로 안전.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'dongjak_hall',
        name: '기념관',
        icon: '🏠',
        desc: '역사 기념관 내부. 의약품과 도구.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'dongjak_storage',
        name: '관리 창고',
        icon: '📦',
        desc: '묘역 관리용 도구 창고.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'wood',
            weight: 4,
          },
          {
            id: 'nail',
            weight: 3,
          },
          {
            id: 'pipe_wrench',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'dongjak_office',
        name: '관리소',
        icon: '🏢',
        desc: '묘역 관리 사무소. 도구와 비품.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'pipe_wrench',
            weight: 2,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'dongjak_forest',
        name: '묘역 숲',
        icon: '🌲',
        desc: '잘 가꿔진 숲. 약초와 목재.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'vitamins',
            weight: 4,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'wood',
            weight: 4,
          },
          {
            id: 'purified_water',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'dongjak_bunker',
        name: '지하 벙커',
        icon: '🚪',
        desc: '관리 창고 뒤편 철문 아래. 군용 통신 장비가 남아 있는 비상 벙커.',
        dangerMod: 0.15,
        requiresHiddenLocation: 'hidden_dongjak_cemetery_vault',
        firstEnterReward: {
          claimKey: 'dongjak_bunker_first',
          items: [
            {
              id: 'military_radio_kit',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'pistol_ammo',
            weight: 4,
          },
          {
            id: 'military_ration',
            weight: 4,
          },
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'radio',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'herb',
        weight: 22,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'empty_cartridge',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  gwanak: {
    name: '서울대학교',
    desc: '국내 최고 명문대. 의학·화학·공학 실험실에 귀한 물자가 있다.',
    icon: '🎓',
    subLocations: [
      {
        id: 'gwanak_main_plaza',
        name: '정문 광장',
        icon: '🎓',
        desc: '샤 모양 정문 앞 광장. 셔틀버스가 인도에 올라탄 채 멈췄다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'glass_shard',
            weight: 28,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'plastic',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'cloth',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_gwanak.png',
      },
      {
        id: 'sl_gwanak_reactor',
        name: '연구용 원자로',
        icon: '☢️',
        desc: '공대 뒤편 격납 건물. 노심은 정지했지만 계기판에는 아직 불이 들어온다.',
        dangerMod: 0.35,
        requiresHiddenLocation: 'hidden_gwanak_snu_reactor',
        firstEnterReward: {
          claimKey: 'snu_reactor_first',
          items: [
            {
              id: 'nuclear_battery',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 6,
          },
          {
            id: 'rad_blocker',
            weight: 4,
          },
          {
            id: 'scrap_metal',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
        ],
      },
      {
        id: 'gwanak_medschool',
        name: '의과대학',
        icon: '🏥',
        desc: '의학 교육·연구 시설. 의료 물자가 풍부.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'surgery_kit',
            weight: 1,
          },
          {
            id: 'antibiotics',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gwanak_chemlab',
        name: '화학과 실험실',
        icon: '⚗️',
        desc: '화학 시약과 실험 장비가 남아있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'rad_blocker',
            weight: 2,
          },
          {
            id: 'antidote',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'plastic',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gwanak_eng_storage',
        name: '공대 창고',
        icon: '⚙️',
        desc: '공학 실험 장비 보관소. 전자 부품.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'nail',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gwanak_dorm',
        name: '기숙사',
        icon: '🛏️',
        desc: '학생 기숙사. 일상 생활 물자.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gwanak_lib_basement',
        name: '도서관 지하 서고',
        icon: '📚',
        desc: '지하 서고. 어둡지만 간간이 물자가.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'flashlight',
            weight: 3,
          },
          {
            id: 'electronic_parts',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'gwanak_main_lib',
        name: '중앙도서관',
        icon: '🏛️',
        desc: '대형 도서관 건물. 응급 처치함이 남아있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 1,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'glass_shard',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'plastic',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'alcohol_solution',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'charcoal_filter',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  seocho: {
    name: '예술의전당',
    desc: '서울 대표 복합 문화 예술 공간. 넓은 건물과 지하 창고가 있다.',
    icon: '🎭',
    subLocations: [
      {
        id: 'seocho_plaza',
        name: '전당 앞 광장',
        icon: '🎭',
        desc: '분수는 말랐고 공연 포스터가 반쯤 뜯겨 나부낀다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'plastic',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'thread',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_seocho.png',
      },
      {
        id: 'sl_seocho_evidence_vault',
        name: '법원 증거물 보관소',
        icon: '⚖',
        desc: '예술의전당 건너편 법조타운 지하. 봉인 테이프가 하나도 뜯기지 않은 캐비닛 300여 개.',
        dangerMod: 0.12,
        requiresHiddenLocation: 'hidden_seocho_courthouse_vault',
        firstEnterReward: {
          claimKey: 'seocho_evidence_first',
          items: [
            {
              id: 'confiscated_sniper',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'pistol_ammo',
            weight: 6,
          },
          {
            id: 'lockpick',
            weight: 4,
          },
          {
            id: 'survivor_note',
            weight: 4,
          },
        ],
      },
      {
        id: 'seocho_opera',
        name: '오페라하우스',
        icon: '🎼',
        desc: '대형 공연장. 무대 장치와 의상이 남아있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'cloth',
            weight: 4,
          },
          {
            id: 'leather',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 1,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seocho_backstage',
        name: '무대 뒷편',
        icon: '🎪',
        desc: '무대 배후 시설. 공구와 철제 구조물.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'rope',
            weight: 4,
          },
          {
            id: 'wood',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'seocho_dressing',
        name: '분장실',
        icon: '🪞',
        desc: '배우 분장실. 의약품과 기초 용품.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'seocho_gallery',
        name: '미술관',
        icon: '🖼️',
        desc: '미술 전시관. 의외로 조용하다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'seocho_basement',
        name: '지하 창고',
        icon: '🗄️',
        desc: '공연 장치 보관 지하 창고.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'plastic',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 30,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'large_cloth',
        weight: 12,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'thread',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'plastic',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  gangnam: {
    name: '강남세브란스병원',
    desc: '강남 최대 병원. 최신 의료 시설과 대형 약품 창고가 있다.',
    icon: '🏥',
    subLocations: [
      {
        id: 'gangnam_front_gate',
        name: '병원 정문',
        icon: '🏥',
        desc: '발레파킹 부스가 넘어져 있다. 자동문 틈에 휠체어가 끼었다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'bandage',
            weight: 30,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'glass_shard',
            weight: 25,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'cloth',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_gangnam.png',
      },
      {
        id: 'sl_gangnam_sealed_pharmacy',
        name: '봉인 약제실',
        icon: '💊',
        desc: '마약류 관리 구역. 셔터가 안에서 잠겼고 봉인 스티커가 그대로다.',
        dangerMod: 0.2,
        requiresHiddenLocation: 'hidden_gangnam_samsung_pharmacy',
        firstEnterReward: {
          claimKey: 'sealed_pharmacy_first',
          items: [
            {
              id: 'surgical_grade_kit',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'first_aid_kit',
            weight: 5,
          },
          {
            id: 'antibiotics',
            weight: 4,
          },
          {
            id: 'surgery_kit',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 5,
          },
        ],
      },
      {
        id: 'gangnam_er',
        name: '응급실',
        icon: '🚨',
        desc: '대형 응급 처치 구역. 위험하지만 물자가 풍부.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'bandage',
            weight: 5,
          },
          {
            id: 'first_aid_kit',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          5,
        ],
      },
      {
        id: 'gangnam_pharmacy',
        name: '약품 창고',
        icon: '💊',
        desc: '최고급 희귀 약품 보관소.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'antibiotics',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'stimulant',
            weight: 2,
          },
          {
            id: 'rad_blocker',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangnam_or',
        name: '수술실',
        icon: '🔬',
        desc: '첨단 외과 수술 시설.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'surgery_kit',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'splint',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangnam_lab',
        name: '연구실',
        icon: '⚗️',
        desc: '의학 연구 실험실. 시약과 희귀 약품.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'antidote',
            weight: 2,
          },
          {
            id: 'rad_blocker',
            weight: 2,
          },
          {
            id: 'antibiotics',
            weight: 3,
          },
          {
            id: 'antiseptic',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gangnam_morgue',
        name: '영안실',
        icon: '🪦',
        desc: '시신 안치실. 의료 도구가 있다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'antiseptic',
            weight: 4,
          },
          {
            id: 'splint',
            weight: 2,
          },
          {
            id: 'antidote',
            weight: 2,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gangnam_vip',
        name: 'VIP 병실',
        icon: '⭐',
        desc: '고급 VIP 병동. 최상의 의약품과 용품.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'first_aid_kit',
            weight: 4,
          },
          {
            id: 'stimulant',
            weight: 3,
          },
          {
            id: 'antibiotics',
            weight: 3,
          },
          {
            id: 'surgery_kit',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
    ],
    lootTable: [
      {
        id: 'bandage',
        weight: 30,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'antiseptic',
        weight: 22,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'painkiller',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'glass_shard',
        weight: 20,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  songpa: {
    name: '롯데월드타워',
    desc: '555m 초고층 빌딩. 쇼핑몰, 호텔, 발전기실 등 다양한 구역.',
    icon: '🏙️',
    subLocations: [
      {
        id: 'songpa_lobby',
        name: '로비',
        icon: '🏛️',
        desc: '웅장한 1층 로비. 좀비가 집결해 있다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
        isEntrance: true,
      },
      {
        id: 'sl_songpa_survivor_fort',
        name: '생존자 요새',
        icon: '🏢',
        desc: '좀비가 들어찬 로비 너머, 아케이드를 바리케이드로 막아 만든 구역. 여기서는 사람이 산다.',
        dangerMod: 0.05,
        requiresHiddenLocation: 'hidden_jamsil_lotte_tower_lobby',
        firstEnterReward: {
          claimKey: 'songpa_fort_first',
          items: [
            {
              id: 'battle_ration',
              qty: 3,
            },
            {
              id: 'first_aid_kit',
              qty: 2,
            },
            {
              id: 'debt_ledger',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'canned_food',
            weight: 7,
          },
          {
            id: 'bandage',
            weight: 6,
          },
          {
            id: 'battery',
            weight: 4,
          },
          {
            id: 'rope',
            weight: 4,
          },
        ],
      },
      {
        id: 'sl_songpa_penthouse',
        name: '123층 펜트하우스',
        icon: '🏙',
        desc: '계단 123층 끝. 통유리 앞에 망원경과 압정 꽂힌 서울 지도가 놓여 있다.',
        dangerMod: 0.2,
        bossId: 'boss_penthouse_survivor',
        requiresHiddenLocation: 'hidden_songpa_lotte_penthouse',
        firstEnterReward: {
          claimKey: 'songpa_penthouse_first',
          items: [
            {
              id: 'father_schematic',
              qty: 1,
            },
            {
              id: 'binoculars_pro',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'premium_ration',
            weight: 4,
          },
          {
            id: 'first_aid_kit',
            weight: 4,
          },
          {
            id: 'stimulant',
            weight: 3,
          },
        ],
      },
      {
        id: 'songpa_mall_basement',
        name: '쇼핑몰 지하',
        icon: '🛒',
        desc: '지하 식품관과 슈퍼마켓.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'canned_food',
            weight: 6,
          },
          {
            id: 'dried_meat',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
        ],
        lootCount: [
          3,
          6,
        ],
      },
      {
        id: 'songpa_hotel',
        name: '호텔 객실',
        icon: '🛏️',
        desc: '최고급 호텔 객실. 생필품과 응급 처치함.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'songpa_observatory',
        name: '전망대 (119F)',
        icon: '🔭',
        desc: '최고층 전망대. 전망은 탁월하나 적도 많다. 생존자 잔류 물자 발견.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'first_aid_kit',
            weight: 3,
          },
          {
            id: 'electronic_parts',
            weight: 3,
          },
          {
            id: 'tactical_vest',
            weight: 2,
          },
          {
            id: 'pistol_ammo',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'songpa_stairs',
        name: '비상 계단',
        icon: '🪜',
        desc: '비상 탈출용 계단. 도주 경로지만 좁고 위험.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'crowbar',
            weight: 2,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'bandage',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'songpa_generator',
        name: '발전기실 (지하)',
        icon: '⚡',
        desc: '비상 발전 시설. 전기 부품의 보고.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'wire',
            weight: 5,
          },
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          3,
          5,
        ],
      },
    ],
    lootTable: [
      {
        id: 'glass_shard',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'scrap_metal',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'cloth',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'battery',
        weight: 8,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  gangdong: {
    name: '암사동 선사유적지',
    desc: '신석기 시대 움집 복원 유적지. 한강변에 위치해 물을 구하기 쉽다.',
    icon: '🏺',
    subLocations: [
      {
        id: 'gangdong_ticket_office',
        name: '유적지 매표소',
        icon: '🏺',
        desc: '목조 매표소. 발굴 안내 팸플릿이 젖어 뭉쳤다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'wood',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'bone',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'herb',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_gangdong.png',
      },
      {
        id: 'sl_gangdong_secret_dock',
        name: '비밀 선착장',
        icon: '⛴',
        desc: '선사유적지 강변 끝, 갈대에 가려진 콘크리트 경사로. 계류 고리에 밧줄 자국이 선명하다.',
        dangerMod: 0.05,
        requiresHiddenLocation: 'hidden_gangdong_river_dock',
        firstEnterReward: {
          claimKey: 'gangdong_dock_first',
          items: [
            {
              id: 'river_boat',
              qty: 1,
            },
            {
              id: 'waterproof_container',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'rope',
            weight: 6,
          },
          {
            id: 'plastic',
            weight: 5,
          },
          {
            id: 'fuel_can',
            weight: 3,
          },
        ],
      },
      {
        id: 'gangdong_pithouses',
        name: '움집 복원지',
        icon: '🛖',
        desc: '복원된 신석기 움집. 기초 재료를 구할 수 있다.',
        dangerMod: 0.05,
        lootTable: [
          {
            id: 'wood',
            weight: 5,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'soil_bag',
            weight: 18,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangdong_museum',
        name: '선사박물관',
        icon: '🏛️',
        desc: '유적 박물관 건물. 응급 처치함과 관리 물자가 남아있다.',
        dangerMod: 0.1,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'antiseptic',
            weight: 2,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gangdong_artifact_storage',
        name: '유물 창고',
        icon: '🗝️',
        desc: '유물 보관소. 뜻밖의 물자가 있을 수 있다.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'leather',
            weight: 3,
          },
          {
            id: 'wood',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
      {
        id: 'gangdong_riverside',
        name: '한강 강변',
        icon: '🌊',
        desc: '유적지 앞 한강 변. 물을 구하기 좋지만 오염 주의.',
        dangerMod: 0.15,
        lootTable: [
          {
            id: 'purified_water',
            weight: 3,
          },
          {
            id: 'contaminated_water',
            weight: 3,
          },
          {
            id: 'sand',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'vitamins',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'gangdong_excavation',
        name: '고고학 발굴지',
        icon: '⛏️',
        desc: '발굴 작업장. 도구와 재료가 남아있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'leather',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'sharp_blade',
            weight: 3,
          },
          {
            id: 'wild_wheat',
            weight: 20,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'firestone',
        weight: 18,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'bone',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'herb',
        weight: 22,
        minQty: 2,
        maxQty: 4,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_gangnam: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_gangnam',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_gangnam',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'gangnam',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_gangdong: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_gangdong',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_gangdong',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'gangdong',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_gwangjin: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_gwangjin',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_gwangjin',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'gwangjin',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_mapo: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_mapo',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_mapo',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'mapo',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_seocho: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_seocho',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_seocho',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'seocho',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_seongdong: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_seongdong',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_seongdong',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'seongdong',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_songpa: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    subLocations: [
      {
        id: 'hangang_fishing_spot_songpa',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_songpa',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'songpa',
    hasFishing: true,
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_yeongdeungpo: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_yeongdeungpo',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_yeongdeungpo',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'yeongdeungpo',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_yongsan: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_yongsan',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_yongsan',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'yongsan',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  hangang_junggoo: {
    name: '한강',
    desc: '서울을 가로지르는 한강. 오염된 강물이지만 물고기는 살아있다.',
    icon: '🌊',
    hasFishing: true,
    subLocations: [
      {
        id: 'hangang_fishing_spot_junggoo',
        name: '낚시터',
        icon: '🎣',
        desc: '낚시꾼들이 즐겨 찾던 자리. 낚싯대로 물고기를 낚거나 통발을 설치할 수 있다.',
        dangerMod: 0.05,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
          {
            id: 'bait_worm',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
      },
      {
        id: 'hangang_riverside_junggoo',
        name: '강변 산책로',
        icon: '🌿',
        desc: '강변을 따라 이어진 산책로. 잡초와 돌멩이, 버려진 물건이 있다.',
        dangerMod: 0.08,
        isFishing: true,
        firstEnterReward: {
          claimKey: 'hangang_rod',
          items: [
            {
              id: 'fishing_rod',
              qty: 1,
            },
          ],
        },
        lootTable: [
          {
            id: 'wild_garlic',
            weight: 4,
          },
          {
            id: 'pebble',
            weight: 4,
          },
          {
            id: 'bait_insect',
            weight: 10,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'dry_grass',
            weight: 3,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    districtId: 'junggoo',
    lootTable: [
      {
        id: 'raw_fish',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'wood',
        weight: 25,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'rope',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_raider_camp_small: {
    name: '소규모 약탈자 캠프',
    desc: '도봉산 기슭에 자리 잡은 약탈자 임시 캠프. 인질로 잡힌 민간인이 숨겨져 있다.',
    icon: '🏴',
    districts: [
      'dobong',
    ],
    dangerLevel: 3,
    enemyCount: [
      3,
      4,
    ],
    enemyType: 'raider',
    rescueNpcId: 'npc_rescued_civilian',
    subLocations: [
      {
        id: 'raider_small_gate',
        name: '바리케이드 게이트',
        icon: '🚧',
        desc: '드럼통과 철판으로 엮은 입구. 감시 구멍이 뚫려 있다.',
        dangerMod: 0.15,
        isEntrance: true,
        lootTable: [
          {
            id: 'cloth',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'rope',
            weight: 25,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'canned_food',
            weight: 22,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_raider_camp_small.png',
      },
      {
        id: 'raider_small_search',
        name: '캠프 수색',
        icon: '🔦',
        desc: '천막과 야전 보급함이 흩어진 캠프 중심부. 식량과 잡화가 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'sharpened_knife',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'raider_small_hostage',
        name: '인질 수용실',
        icon: '⛓️',
        desc: '천막 한쪽에 결박된 민간인이 갇혀 있다. 경비를 제거해야 접근할 수 있다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
          {
            id: 'canned_food',
            weight: 2,
          },
          {
            id: 'cloth',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'cloth',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'canned_food',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'rope',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'empty_cartridge',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_raider_camp_medium: {
    name: '중형 약탈자 거점',
    desc: '광화문 인근의 폐건물을 개조한 약탈자 중간 거점. 리더와 호위대가 주둔한다.',
    icon: '⚠️',
    districts: [
      'jongno',
    ],
    dangerLevel: 5,
    enemyCount: [
      5,
      7,
    ],
    enemyType: 'raider',
    hasLeader: true,
    rescueNpcId: 'npc_rescued_civilian',
    subLocations: [
      {
        id: 'raider_medium_perimeter',
        name: '외곽 경계선',
        icon: '🛡️',
        desc: '철조망과 바리케이드로 둘러싼 외곽. 보초가 지키고 있다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'pistol_ammo',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
        isEntrance: true,
      },
      {
        id: 'raider_medium_armory',
        name: '무기고',
        icon: '🗡️',
        desc: '약탈한 무기와 탄약이 쌓인 방. 리더의 호위가 배치되어 있다.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'pistol_ammo',
            weight: 5,
          },
          {
            id: 'shotgun_ammo',
            weight: 3,
          },
          {
            id: 'combat_knife',
            weight: 12,
            minQty: 1,
            maxQty: 2,
          },
          {
            id: 'shotgun',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'raider_medium_prison',
        name: '포로 감금실',
        icon: '⛓️',
        desc: '지하 포로 감금실. 구출 대상 민간인이 쇠사슬에 묶여 있다.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
          {
            id: 'canned_food',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'canned_food',
        weight: 22,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'duct_tape',
        weight: 20,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'empty_cartridge',
        weight: 18,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_power_station: {
    name: '구로 발전소',
    desc: '구로 화력 발전소. 붕괴 전 서울 서남부 전력 공급의 핵심 시설. 약탈자 무리와 냉각탑 내부의 좀비 군집이 점거 중이다.',
    icon: '⚡',
    districts: [
      'guro',
    ],
    dangerLevel: 6,
    enemyCount: [
      6,
      9,
    ],
    enemyType: 'raider',
    hasLeader: true,
    subLocations: [
      {
        id: 'power_station_perimeter',
        name: '외부 방어선',
        icon: '🛡️',
        desc: '발전소 외곽 철조망과 경비 초소. 약탈자 보초가 교대로 지키고 있다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'pistol_ammo',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
        isEntrance: true,
      },
      {
        id: 'power_station_cooling',
        name: '냉각탑',
        icon: '🌀',
        desc: '거대한 냉각탑 내부. 습기와 이끼로 미끄럽고 좀비 군집이 벽을 타고 이동한다.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'electronic_parts',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'power_station_control',
        name: '제어실',
        icon: '🖥️',
        desc: '발전 제어반이 늘어선 중앙 관제실. 약탈자 리더가 배전 시스템을 장악하고 있다.',
        dangerMod: 0.45,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'pistol_ammo',
            weight: 3,
          },
          {
            id: 'circuit_board',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'power_station_generator',
        name: '발전실',
        icon: '⚡',
        desc: '거대 발전 터빈이 멈춘 채 놓인 심장부. 재가동에 필요한 부품이 남아있다.',
        dangerMod: 0.5,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 4,
          },
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'rubber',
            weight: 3,
          },
        ],
        lootCount: [
          3,
          5,
        ],
      },
    ],
    lootTable: [
      {
        id: 'copper_coil',
        weight: 18,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'wire',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'scrap_metal',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'electric_motor',
        weight: 6,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_water_plant: {
    name: '은평 정수장',
    desc: '은평구 상수도 정수장. 펌프와 배관이 파손돼 수도 공급이 끊긴 상태. 비교적 약한 감염자들이 배회하지만 복구에는 정밀 작업이 필요하다.',
    icon: '💧',
    districts: [
      'eunpyeong',
    ],
    dangerLevel: 4,
    enemyCount: [
      4,
      6,
    ],
    enemyType: 'zombie',
    subLocations: [
      {
        id: 'water_plant_gate',
        name: '정수장 정문',
        icon: '💧',
        desc: '염소 냄새가 밴 정문. 수질 경고판이 붉게 바랬다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'plastic',
            weight: 30,
            minQty: 2,
            maxQty: 4,
          },
          {
            id: 'wire',
            weight: 25,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'water_bottle',
            weight: 25,
            minQty: 1,
            maxQty: 3,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_water_plant.png',
      },
      {
        id: 'water_plant_pump',
        name: '펌프실',
        icon: '⚙️',
        desc: '지하 펌프실. 거대한 취수 펌프와 제어 밸브가 늘어서 있다. 수리 부품이 필요하다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'iron_pipe',
            weight: 4,
          },
          {
            id: 'rubber',
            weight: 3,
          },
          {
            id: 'wire',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'water_plant_reservoir',
        name: '정수조',
        icon: '🌊',
        desc: '대형 정수 탱크. 오염된 물이 고여있지만 필터와 배관 부품을 회수할 수 있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'contaminated_water',
            weight: 4,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'water_filter',
            weight: 2,
          },
          {
            id: 'rubber',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'water_plant_chemistry',
        name: '화학실',
        icon: '🧪',
        desc: '정수용 약품 보관실. 염소 소독제와 활성탄 필터 원료가 남아있다.',
        dangerMod: 0.25,
        lootTable: [
          {
            id: 'antiseptic',
            weight: 3,
          },
          {
            id: 'charcoal',
            weight: 3,
          },
          {
            id: 'purified_water',
            weight: 2,
          },
          {
            id: 'water_filter',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          3,
        ],
      },
      {
        id: 'water_plant_admin',
        name: '관리실',
        icon: '📋',
        desc: '정수장 관리동. 비상 공구와 작업자 보급품이 남아있다.',
        dangerMod: 0.2,
        lootTable: [
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'flashlight',
            weight: 2,
          },
          {
            id: 'painkiller',
            weight: 2,
          },
        ],
        lootCount: [
          1,
          3,
        ],
      },
    ],
    lootTable: [
      {
        id: 'charcoal_filter',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'plastic',
        weight: 28,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'wire',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'water_bottle',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_comms_tower: {
    name: 'N서울타워',
    desc: '남산 N서울타워. 붕괴 전 서울 통신 백본의 중계 거점. 고층부는 감염자가 뒤엉켜 있고 계단부 일부가 무너졌다.',
    icon: '📡',
    districts: [
      'yongsan',
    ],
    dangerLevel: 5,
    enemyCount: [
      5,
      8,
    ],
    enemyType: 'zombie',
    hasLeader: true,
    subLocations: [
      {
        id: 'comms_tower_approach',
        name: '타워 진입로',
        icon: '📡',
        desc: '케이블카가 멈춰 선 진입로. 안테나 소음만 낮게 깔린다.',
        dangerMod: 0.05,
        isEntrance: true,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 28,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'wire',
            weight: 25,
            minQty: 1,
            maxQty: 3,
          },
          {
            id: 'scrap_metal',
            weight: 22,
            minQty: 2,
            maxQty: 4,
          },
        ],
        lootCount: [
          1,
          2,
        ],
        sceneImage: 'assets/images/landmarks/lm_comms_tower.png',
      },
      {
        id: 'comms_tower_stairs',
        name: '계단부',
        icon: '🪜',
        desc: '타워 하단 계단실. 무너진 계단 사이로 감염자 무리가 올라온다.',
        dangerMod: 0.3,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 3,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
          {
            id: 'rope',
            weight: 3,
          },
          {
            id: 'nail',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'comms_tower_observation',
        name: '전망대',
        icon: '🔭',
        desc: '전망대 층. 깨진 유리창과 흩어진 관광객 유품. 시야가 확보되지만 좀비가 밀집해 있다.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'glass_shard',
            weight: 4,
          },
          {
            id: 'cloth',
            weight: 3,
          },
          {
            id: 'compass',
            weight: 6,
            minQty: 1,
            maxQty: 1,
          },
          {
            id: 'canned_food',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'comms_tower_antenna',
        name: '안테나룸',
        icon: '📡',
        desc: '통신 중계 장비실. 안테나 복구에 필요한 송신 모듈과 배선이 남아있다.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 5,
          },
          {
            id: 'wire',
            weight: 5,
          },
          {
            id: 'circuit_board',
            weight: 3,
          },
          {
            id: 'scrap_metal',
            weight: 3,
          },
        ],
        lootCount: [
          3,
          5,
        ],
      },
      {
        id: 'comms_tower_broadcast',
        name: '방송실',
        icon: '🎙️',
        desc: '방송 송출실. 비상 방송 장비가 잠자고 있다. 감염자 중 과거 기술자 복장을 한 자가 있다.',
        dangerMod: 0.35,
        lootTable: [
          {
            id: 'electronic_parts',
            weight: 4,
          },
          {
            id: 'wire',
            weight: 3,
          },
          {
            id: 'duct_tape',
            weight: 3,
          },
          {
            id: 'first_aid_kit',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
    ],
    lootTable: [
      {
        id: 'electronic_parts',
        weight: 28,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'copper_coil',
        weight: 15,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'wire',
        weight: 25,
        minQty: 1,
        maxQty: 3,
      },
      {
        id: 'battery',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
  lm_raider_camp_large: {
    name: '대형 약탈자 요새',
    desc: '영등포의 폐쇄된 공장을 요새화한 약탈자 본거지. 보스와 중무장 부대가 주둔한다.',
    icon: '💀',
    districts: [
      'yeongdeungpo',
    ],
    dangerLevel: 7,
    enemyCount: [
      8,
      12,
    ],
    enemyType: 'raider',
    hasBoss: true,
    rescueNpcId: 'npc_rescued_civilian',
    subLocations: [
      {
        id: 'raider_large_gate',
        name: '정문 방어 시설',
        icon: '🚧',
        desc: '콘크리트 장벽과 기관총좌가 놓인 정문. 가장 경비가 삼엄하다.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'scrap_metal',
            weight: 4,
          },
          {
            id: 'pistol_ammo',
            weight: 4,
          },
          {
            id: 'rifle_ammo',
            weight: 3,
          },
          {
            id: 'iron_pipe',
            weight: 3,
          },
        ],
        lootCount: [
          3,
          5,
        ],
        isEntrance: true,
      },
      {
        id: 'raider_large_barracks',
        name: '중앙 병영',
        icon: '🏚️',
        desc: '약탈자들이 생활하는 공간. 침상과 개인 사물함에 물자가 숨겨져 있다.',
        dangerMod: 0.45,
        lootTable: [
          {
            id: 'canned_food',
            weight: 4,
          },
          {
            id: 'gas_mask',
            weight: 8,
            minQty: 1,
            maxQty: 1,
          },
          {
            id: 'bandage',
            weight: 3,
          },
          {
            id: 'pistol_ammo',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'raider_large_vault',
        name: '보스 집무실',
        icon: '👑',
        desc: '요새의 심장부. 약탈로 모은 희귀 물자와 보스가 기다리고 있다.',
        dangerMod: 0.5,
        lootTable: [
          {
            id: 'rifle_ammo',
            weight: 4,
          },
          {
            id: 'shotgun_ammo',
            weight: 4,
          },
          {
            id: 'first_aid_kit',
            weight: 3,
          },
          {
            id: 'military_ration',
            weight: 2,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
      {
        id: 'raider_large_holding',
        name: '포로 수용동',
        icon: '⛓️',
        desc: '여러 민간인이 갇혀 있는 수용동. 구출 시 일부는 생존자로 합류할 수 있다.',
        dangerMod: 0.4,
        lootTable: [
          {
            id: 'bandage',
            weight: 4,
          },
          {
            id: 'painkiller',
            weight: 3,
          },
          {
            id: 'canned_food',
            weight: 3,
          },
          {
            id: 'cloth',
            weight: 3,
          },
        ],
        lootCount: [
          2,
          4,
        ],
      },
    ],
    lootTable: [
      {
        id: 'scrap_metal',
        weight: 26,
        minQty: 2,
        maxQty: 4,
      },
      {
        id: 'empty_cartridge',
        weight: 22,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'black_powder',
        weight: 10,
        minQty: 1,
        maxQty: 2,
      },
      {
        id: 'kevlar_fabric',
        weight: 6,
        minQty: 1,
        maxQty: 2,
      },
    ],
    lootCount: [
      1,
      2,
    ],
  },
};

// ── 유틸리티 ────────────────────────────────────────────────

/**
 * LANDMARK_DATA 조회 헬퍼.
 * 키로 먼저 시도, 없으면 `lm_` 접두사를 제거한 키로 폴백.
 * 예) `lm_gangnam` → `gangnam`로 자동 폴백 (district-keyed 엔트리 호환)
 * @param {string} key - 랜드마크 아이템 ID 또는 LANDMARK_DATA 키
 * @returns {object|null} 랜드마크 데이터 또는 null
 */
export function getLandmarkData(key) {
  if (!key) return null;
  if (LANDMARK_DATA[key]) return LANDMARK_DATA[key];
  const stripped = key.replace(/^lm_/, '');
  return LANDMARK_DATA[stripped] ?? null;
}

/**
 * 랜드마크 키를 비교·저장용 단일 표기로 정규화한다.
 * 런타임 진입 키는 카드 아이템 ID(`lm_*`)인데 LANDMARK_DATA는 대부분 접두사 없는 구 키라
 * 같은 랜드마크가 두 문자열로 돌아다닌다. getLandmarkData와 같은 규칙(`lm_` 제거)을 쓴다.
 * @param {string} key - 랜드마크 아이템 ID 또는 LANDMARK_DATA 키
 * @returns {string} 정규화된 키 ('' if falsy)
 */
export function normalizeLandmarkKey(key) {
  return key ? String(key).replace(/^lm_/, '') : '';
}

/**
 * 랜드마크의 세부 장소 중 현재 플레이어에게 노출해야 할 것만 반환한다.
 * `requiresHiddenLocation`이 지정된 세부 장소는 해당 숨겨진 장소를 발견한 뒤에만 나타난다.
 * 본 모듈은 GameState를 import하지 않으므로(순환 의존 방지) 발견 목록을 인자로 받는다.
 * @param {string} key - 랜드마크 아이템 ID 또는 LANDMARK_DATA 키
 * @param {string[]} discoveredLocationIds - GameState.flags.hiddenLocationsDiscovered
 * @returns {Array<object>} 노출 대상 세부 장소 배열
 */
export function getVisibleSubLocations(key, discoveredLocationIds = []) {
  const subs = getLandmarkData(key)?.subLocations ?? [];
  return subs.filter(sub =>
    !sub.requiresHiddenLocation || discoveredLocationIds.includes(sub.requiresHiddenLocation)
  );
}

/**
 * 주어진 랜드마크 키에서 낚시/통발 사용이 가능한지 판정한다 (hasFishing 플래그).
 * `lm_` 접두사 폴백을 포함하므로 아이템 ID를 그대로 전달해도 동작한다.
 */
export function landmarkHasFishing(key) {
  return !!getLandmarkData(key)?.hasFishing;
}

/**
 * 각 랜드마크 세부 장소(sublocation)에 대한 아이템 정의를 생성하여
 * 호출자가 넘긴 items 사전에 등록한다.
 * main.js에서 GameData 초기화 직후 `registerSubLocationItems(GameData.items)`로 호출한다.
 * GameData를 본 모듈 상단에서 import하지 않으므로 순환 의존이 발생하지 않는다.
 */
export function registerSubLocationItems(items) {
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
        noSceneImage:          sub.noSceneImage,
        sceneImage:            sub.sceneImage,
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
