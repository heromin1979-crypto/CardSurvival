// === MAIN QUESTS: 정대한 (engineer) — B경로: 박영철과 도시 재건 ===
// 분기 조건: eng_branch_b 플래그
// Q11~Q15: 박영철 소방관과 인프라 복구
// Q15 분기점: 재건 방향 선택 → 2가지 엔딩 (b1 도시 재건 / b3 헬기 탈출)

const ENGINEER_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_eng_b_11: {
    id: 'mq_eng_b_11', title: '박영철 합류',
    desc: '은평구에 도달하라. 박영철 소방관이 있는 대피소 건설 현장이다.',
    icon: '🚒', characterId: 'engineer', dayTrigger: 65,
    prerequisite: 'mq_eng_10', requiresFlag: 'eng_branch_b',
    objective: { type: 'visit_district', districtId: 'eunpyeong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'scrap_metal', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '박영철 소방관이 은평구에서 대피소를 짓고 있다. 엔지니어가 없어서 구조 설계가 안 된다고 했다.',
      complete: '은평구 도착. 박영철이 반겼다. "엔지니어가 왔군요. 이제 제대로 만들 수 있겠습니다." 현장 주변에 고철이 쌓여있었다.',
    },
  },

  mq_eng_b_12: {
    id: 'mq_eng_b_12', title: '발전기 자재',
    desc: '고철 6개를 수집하라. 발전기를 설치하기 위한 자재다.',
    icon: '🔩', characterId: 'engineer', dayTrigger: 95,
    prerequisite: 'mq_eng_b_11', requiresFlag: 'eng_branch_b',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'wire', qty: 3 }, { definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '대피소에 전력이 없다. 발전기를 설치하면 조명과 냉장이 가능해진다. 자재가 필요하다.',
      complete: '자재 확보. 수집 중 배전 배선용 전선과 전자부품도 발견했다. 박영철: "발전기가 생기면 야간 활동이 가능해지고 물자 보존도 쉬워집니다."',
    },
  },

  mq_eng_b_13: {
    id: 'mq_eng_b_13', title: '발전기 설치',
    desc: '구조물 2개를 제작하라. 발전기 설치와 배전 시스템을 구축한다.',
    icon: '⚡', characterId: 'engineer', dayTrigger: 125,
    prerequisite: 'mq_eng_b_12', requiresFlag: 'eng_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'flashlight', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '발전기 설치와 배전 패널 설계. 엔지니어 정대한의 본업이다.',
      complete: '발전기 가동. 불이 켜졌다. 창고에서 손전등도 2개 발견했다. 발전기 전에는 이것이 유일한 빛이었을 것이다. 박영철: "이게 얼마 만에 보는 불빛인지." 사람들이 모여들었다.',
    },
  },

  mq_eng_b_14: {
    id: 'mq_eng_b_14', title: '수도 복구',
    desc: '전자부품 4개를 수집하라. 펌프 시스템 복구에 필요하다.',
    icon: '💧', characterId: 'engineer', dayTrigger: 155,
    prerequisite: 'mq_eng_b_13', requiresFlag: 'eng_branch_b',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '전력 다음은 수도다. 펌프 제어 시스템을 복구하면 건물 내 수돗물이 나온다.',
      complete: '수도 복구 완료. 펌프실에서 정수 필터도 발견했다. 물을 깨끗하게 마실 수 있다. 박영철: "이제 전기, 물이 됩니다. 사람들이 버틸 수 있어요."',
    },
  },

  mq_eng_b_15: {
    id: 'mq_eng_b_15', title: '재건 방향 결정',
    desc: '100일 이상 생존하라. 도시 재건의 방향을 결정해야 한다.',
    icon: '⚖️', characterId: 'engineer', dayTrigger: 95,
    prerequisite: 'mq_eng_b_14', requiresFlag: 'eng_branch_b',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 8, items: [{ definitionId: 'pipe_wrench', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '도시 인프라 복구 완성',
        desc: '전기, 수도, 통신을 복구해 서울을 다시 살아있는 도시로 만든다.',
        setsFlag: 'eng_end_b1',
      },
      {
        label: '재건 포기, 헬기로 탈출',
        desc: '결국 도시를 고칠 수 없다는 것을 깨닫고, 아버지의 R22 설계도로 헬기를 제작해 탈출한다.',
        setsFlag: 'eng_end_b3',
        warning: '9단계 제작 체인 + 7종 신규 부품 + 항공 가솔린 정제. 추가 100일 이상의 플레이가 필요합니다.',
      },
    ],
    narrative: {
      start: '180일. 전기와 수도가 복구됐다. 박영철: "대한씨, 앞으로 어디까지 할 건가요?" 정대한은 지도를 봤다.',
      complete: '공구함에서 파이프렌치를 꺼냈다. 방향을 정해야 한다. 서울 전체 인프라 복구까지 밀어붙일 것인가, 아니면 아버지의 마지막 설계도를 꺼내 하늘로 탈출할 것인가.',
    },
  },

  // ── B1 엔딩: 도시 인프라 복구 완성 ──────────────────────────
  // 3개 랜드마크(발전소·정수장·N서울타워)를 병렬 탈환한 뒤
  // 마지막에 mq_eng_end_b1에서 완성 시설을 제작한다.
  //
  // 병렬 구조: b1_power / b1_water / b1_comms 모두 prerequisite: mq_eng_b_15
  // 서로 다른 dayTrigger(205/210/215)로 순차 해금되지만 완료 순서는 자유.
  // mq_eng_end_b1은 requiresAllFlags로 세 완료 플래그를 모두 요구한다.
  //
  // NOTE: 본격 웨이브 방어 시스템은 추후 구현. 현재는 rescue_npc objective로
  // 랜드마크 소탕을 추적하며, ExploreSystem.markLandmarkCleared()가 완료 훅이다.

  mq_eng_b1_power: {
    id: 'mq_eng_b1_power', title: '구로 발전소 탈환',
    desc: '구로 발전소를 탈환하라. 약탈자들을 몰아내고 발전 터빈을 재가동해 서울 서남부 전력을 복구한다.',
    icon: '⚡', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b1',
    objective: { type: 'rescue_npc', landmarkId: 'lm_power_station', count: 1 },
    reward: {
      morale: 15,
      items: [
        { definitionId: 'electronic_parts', qty: 3 },
        { definitionId: 'wire', qty: 4 },
        { definitionId: 'flashlight', qty: 1 },
      ],
      flags: { power_station_cleared: true },
    },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '구로 화력 발전소. 약탈자 무리가 점거하고 있다. 냉각탑에는 좀비 군집까지. 외부 방어선 돌파 → 냉각탑 정리 → 제어실 장악 → 발전실 재가동. 박영철: "전력만 다시 돌아가면 반경 10킬로가 살아납니다."',
      complete: '발전소 탈환. 터빈이 낮게 돌기 시작했다. 제어반의 적색등이 하나씩 녹색으로 바뀐다. 구로 일대에 가로등이 깜빡이며 켜졌다. 박영철: "대한씨, 진짜 됐어요." 정대한은 계기판을 다시 한 번 확인했다.',
    },
  },

  mq_eng_b1_water: {
    id: 'mq_eng_b1_water', title: '은평 정수장 복구',
    desc: '은평 정수장을 복구하라. 펌프·배관·약품 시스템을 수리해 상수도 공급을 재개한다.',
    icon: '💧', characterId: 'engineer', dayTrigger: 210,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b1',
    objective: { type: 'rescue_npc', landmarkId: 'lm_water_plant', count: 1 },
    reward: {
      morale: 12,
      items: [
        { definitionId: 'water_filter', qty: 2 },
        { definitionId: 'purified_water', qty: 3 },
        { definitionId: 'pipe_wrench', qty: 1 },
      ],
      flags: { water_plant_restored: true },
    },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '은평 정수장. 펌프실 파이프가 파열됐고 정수조는 오염됐다. 감염자들이 배회하지만 숫자는 많지 않다. 펌프실 수리 → 정수조 청소 → 화학실 약품 보충 → 관리실 배수계 점검 순으로 진행.',
      complete: '정수장 복구. 모터가 돌고 파이프가 진동한다. 수도꼭지를 여니 맑은 물이 쏟아졌다. 박영철: "마셔도 돼요?" 정대한은 필터를 다시 확인하고 고개를 끄덕였다. "끓이지 않아도 됩니다."',
    },
  },

  mq_eng_b1_comms: {
    id: 'mq_eng_b1_comms', title: 'N서울타워 통신 복구',
    desc: '남산 N서울타워 안테나룸을 탈환하라. 송신 모듈을 복구해 서울 전역 통신망을 재가동한다.',
    icon: '📡', characterId: 'engineer', dayTrigger: 215,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b1',
    objective: { type: 'rescue_npc', landmarkId: 'lm_comms_tower', count: 1 },
    reward: {
      morale: 15,
      items: [
        { definitionId: 'electronic_parts', qty: 4 },
        { definitionId: 'wire', qty: 3 },
        { definitionId: 'binoculars', qty: 1 },
      ],
      flags: { comms_tower_active: true },
    },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '남산 N서울타워. 통신 백본 중계 거점. 계단부가 무너졌고 고층은 감염자로 가득하다. 계단부 → 전망대 → 안테나룸 → 방송실 순으로 올라간다. 송신 모듈이 살아있으면 서울 전역이 다시 연결된다.',
      complete: '안테나 복구 완료. 송신기 전원 ON. 무전기에서 오래된 라디오 노이즈가 들리기 시작했다. 박영철: "서대문, 마포, 심지어 강남까지 신호가 닿아요." 정대한은 전망대 창 너머로 불빛이 하나씩 켜지는 서울을 보았다.',
    },
  },

  mq_eng_end_b1: {
    id: 'mq_eng_end_b1', title: '도시 재건 완성',
    desc: '전기·수도·통신 3대 인프라가 복구됐다. 마지막으로 구조물 4개를 제작해 서울 재건의 핵심 시설을 완성한다.',
    icon: '🏙️', characterId: 'engineer', dayTrigger: 230,
    prerequisite: 'mq_eng_b1_comms',
    requiresFlag: 'eng_end_b1',
    requiresAllFlags: ['power_station_cleared', 'water_plant_restored', 'comms_tower_active'],
    objective: { type: 'craft_item', category: 'structure', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'rope_ladder', qty: 1 }, { definitionId: 'alarm_trap', qty: 1 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'b1_rebuild' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '마지막 단계. 발전소, 정수장, 통신 타워 모두 살아났다. 이제 세 시스템을 연결할 변전 구조물과 중앙 관제 시설을 세운다. 구조물 4개 — 대용량 배전 패널, 수도 분기 허브, 통신 중계기, 중앙 관제대.',
      complete: '은평구 인프라 복구 완성. 로프 사다리와 경보 장치도 설치했다. 박영철: "불이 켜지고, 물이 나오고, 신호가 잡혀요." 정대한: "아버지가 만들려 했던 것과 다르지 않았어요."',
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  B3 엔딩: 재건 포기, 헬기 제작 탈출 (9단계)
  //  아버지의 R22 설계도 + 7종 전용 부품 + 항공 가솔린 정제
  // ══════════════════════════════════════════════════════════════

  mq_eng_b3_1: {
    id: 'mq_eng_b3_1', title: '아버지의 마지막 설계도',
    desc: '성동구 성수 공장으로 돌아가 숨겨진 설계도를 찾아라.',
    icon: '📐', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b3',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '인프라 복구는 한계에 부딪혔다. 박영철도 말했다. "이 도시는 너무 크게 부서졌어요." 정대한은 아버지의 옛 메모를 다시 펼쳤다. "대한아, 공장 서랍 가장 아래... 그건 내가 정말 만들고 싶었던 것." 성수 공장으로 돌아가야 한다.',
      complete: '공장 맨 아래 서랍. 기름에 절은 설계도 뭉치. 제목 — "경헬기 로빈슨 R22 개조안". 20년 전 아버지가 수입 헬기 정비 기술자 시절 그린 것. 손이 떨렸다. 아버지가 정말로 만들고 싶어했던 것. 그걸 대신 만든다.',
    },
  },

  mq_eng_b3_2: {
    id: 'mq_eng_b3_2', title: '항공용 합금 단조',
    desc: '헬기 부품의 기초 소재. 항공용 합금(aviation_alloy) 8개를 확보하라.',
    icon: '🛩️', characterId: 'engineer', dayTrigger: 215,
    prerequisite: 'mq_eng_b3_1', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'aviation_alloy', count: 8 },
    reward: { morale: 10, items: [{ definitionId: 'charcoal', qty: 5 }, { definitionId: 'sharp_blade', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '알루미늄 합금이 이상적이지만 없다. 고철을 용광로에서 녹여 합금화한다. 아버지의 메모: "고철 5에 숯 2. 1600도에서 20분. 식힌 뒤 단조." 작업대를 공장 용광로 옆에 세웠다.',
      complete: '항공용 합금 잉곳 8개. 두드려 보면 은은한 고음. 밀도와 강도가 항공 규격에 가깝다. 이제 이것으로 모든 부품을 깎는다.',
    },
  },

  mq_eng_b3_3: {
    id: 'mq_eng_b3_3', title: '로터 블레이드',
    desc: '주회전익(rotor_blade) 4개를 제작하라. 대칭 정밀도가 생명이다.',
    icon: '🌀', characterId: 'engineer', dayTrigger: 230,
    prerequisite: 'mq_eng_b3_2', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'rotor_blade', count: 4 },
    reward: { morale: 15, items: [{ definitionId: 'duct_tape', qty: 5 }] },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '헬기에서 가장 중요한 부품은 주회전익. 무게 균형이 1그램만 틀려도 진동이 발생하고 추락한다. 선반 작업으로 대칭 0.5mm 이내로 깎는다. 한 쌍(2개)씩 제작. 최소 2쌍(4개) — 본체용 + 예비.',
      complete: '블레이드 4개. 저울에 올려 무게 확인. 0.3g 오차. 합격. 박영철이 옆에서 거들었다. "대한씨, 이거 정말 하늘로 갑니까?" 정대한: "설계도엔 그렇게 적혀 있어요."',
    },
  },

  mq_eng_b3_4: {
    id: 'mq_eng_b3_4', title: '피스톤 엔진 조립',
    desc: '4기통 피스톤 엔진(piston_engine)을 제작하라. 가솔린 연소식.',
    icon: '⚙️', characterId: 'engineer', dayTrigger: 245,
    prerequisite: 'mq_eng_b3_3', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'piston_engine', count: 1 },
    reward: { morale: 20, items: [{ definitionId: 'wire', qty: 5 }, { definitionId: 'rubber', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '아버지의 설계는 라이커밍 O-320 방식 4기통 피스톤. 전기 모터로 바꿀까 고민했지만 중량 대비 출력이 안 맞는다. 원설계대로 간다. 실린더 블록 → 연료 분사 → 크랭크샤프트. 3단계 조립.',
      complete: '피스톤 엔진 완성. 크랭크샤프트를 손으로 돌려본다. 부드럽다. 아버지가 말했었다. "피스톤은 고전적이지만 가장 믿을 수 있어." 이제 가솔린이 필요하다.',
    },
  },

  mq_eng_b3_5: {
    id: 'mq_eng_b3_5', title: '꼬리 로터와 항공 전자',
    desc: '꼬리 로터 조립체(tail_rotor_assembly)와 항공 전자 모듈(avionics_module) 각 1개를 제작하라.',
    icon: '📟', characterId: 'engineer', dayTrigger: 260,
    prerequisite: 'mq_eng_b3_4', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'avionics_module', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'tail_rotor_assembly', qty: 1 }, { definitionId: 'glass_shard', qty: 3 }] },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '꼬리 로터 조립체는 안티 토크 장치. 없으면 기체가 제자리 회전한다. 항공 전자 모듈은 ECU + 고도계 + 인공 수평의 통합. 둘 다 정밀 작업.',
      complete: '꼬리 로터 조립체 완성. 항공 전자 모듈 기판 완성. 계기판에 전원을 넣었다. 고도계 0.00. 수평계 0°. 나침반 N. 모든 계기가 정상. 박영철: "이게 진짜 비행기 같네요."',
    },
  },

  mq_eng_b3_6: {
    id: 'mq_eng_b3_6', title: '동체 프레임',
    desc: '조종석+엔진 베드+꼬리 빔 통합 프레임(fuselage_frame) 1개를 제작하라.',
    icon: '🛸', characterId: 'engineer', dayTrigger: 275,
    prerequisite: 'mq_eng_b3_5', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'fuselage_frame', count: 1 },
    reward: { morale: 20, items: [{ definitionId: 'nail', qty: 10 }, { definitionId: 'rope', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '동체 프레임은 헬기의 뼈대. 조종석 셸 → 엔진 베드 리벳 고정 → 꼬리 빔 결합. 세 단계 용접·조립. 가장 큰 단일 부품이다.',
      complete: '동체 프레임 완성. 4미터 길이. 용접 라인 점검. 리벳 1500개. 모든 이음새가 단단하다. 박영철: "이거 눕히면 우리 대피소보다 큰데요." 정대한: "눕히면 안 됩니다. 날려야죠."',
    },
  },

  mq_eng_b3_7: {
    id: 'mq_eng_b3_7', title: '최종 조립',
    desc: '모든 부품을 결합하라. 구조물 3개를 제작한다.',
    icon: '🚁', characterId: 'engineer', dayTrigger: 290,
    prerequisite: 'mq_eng_b3_6', requiresFlag: 'eng_end_b3',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 18, items: [{ definitionId: 'duct_tape', qty: 5 }, { definitionId: 'rubber', qty: 3 }] },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '프레임 위에 엔진 장착. 로터 허브에 블레이드 4개 결합. 꼬리 로터 드라이브 샤프트 연결. 조종석에 전자 모듈 배선. 작업대·비계·연료 펌프를 세워 조립을 돕는다.',
      complete: '헬기 기체 완성. 조종석에 앉아봤다. 시야가 탁 트인다. 사이클릭, 콜렉티브, 페달. 세 가지 조종간. 아버지의 노트를 펼쳐놓고 배웠다. 이제 엔진은 돈다. 하지만 연료가 없다.',
    },
  },

  mq_eng_b3_8: {
    id: 'mq_eng_b3_8', title: '항공 가솔린 정제',
    desc: '항공 가솔린 드럼(avgas_drum) 2개를 정제하라. 자동차 연료 10통이 필요하다.',
    icon: '🛢️', characterId: 'engineer', dayTrigger: 305,
    prerequisite: 'mq_eng_b3_7', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'avgas_drum', count: 2 },
    reward: { morale: 25, items: [{ definitionId: 'charcoal_filter', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '라이커밍 O-320의 정석은 100LL 항공 가솔린. 자동차 가솔린으로는 엔진이 몇 시간 만에 망가진다. 정제해야 한다. 자동차 연료 5통 → 증류 → 알코올+활성탄 필터링 → 드럼 1개. 2드럼이면 4시간 비행 = 경기도 남부까지 여유.',
      complete: '100LL 항공 가솔린 드럼 2개 확보. 약 80리터. 납 첨가 고옥탄가. 연료 트럭에서 빼낸 차량 연료가 항공용으로 되살아났다. 아버지의 레시피대로.',
    },
  },

  mq_eng_b3_9: {
    id: 'mq_eng_b3_9', title: '호버링 테스트',
    desc: '엔진 점화·호버링 시험. 전자부품 4개로 시동 배터리 팩을 완성한다.',
    icon: '🔋', characterId: 'engineer', dayTrigger: 315,
    prerequisite: 'mq_eng_b3_8', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 4 },
    reward: { morale: 22, items: [{ definitionId: 'binoculars', qty: 1 }, { definitionId: 'compass', qty: 1 }] },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '시동 배터리 팩 — 엔진 스타터를 돌리는 전력. 시험 비행 직전 마지막 준비. 조종석 체크리스트: 연료 FULL, 오일 NORMAL, 로터 CLEAR, 페달 CENTER.',
      complete: '시동 스위치. 스타터가 엔진을 돌린다. "부르릉!" 점화. 4기통이 리듬을 탄다. 1200rpm. 로터가 회전 시작. 1500rpm... 2000rpm. 기체가 떨린다. 페달 조정. 콜렉티브 천천히 당긴다. 부양. 50cm... 1미터... 공중. "박영철씨! 됐어요!" 호버링 30초. 착륙. 된다.',
    },
  },

  mq_eng_end_b3: {
    id: 'mq_eng_end_b3', title: '하늘로 탈출',
    desc: '탈출 식량 10개를 비축하고 헬기로 서울을 떠나라.',
    icon: '🚁', characterId: 'engineer', dayTrigger: 325,
    prerequisite: 'mq_eng_b3_9', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 10 },
    reward: { morale: 30, items: [{ definitionId: 'battle_ration', qty: 5 }, { definitionId: 'flashlight', qty: 2 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'b3_heli_escape' } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '헬기 완성. 항공 가솔린 2드럼 적재. 목적지 — 경기도 남부. 2시간 비행 거리. 식량과 장비를 싣는다.',
      complete: '시동. 엔진이 굉음을 낸다. 연료 게이지 FULL. 로터 회전 최대. 콜렉티브 풀. 이륙. 10미터. 30미터. 100미터. 서울이 발 밑에 펼쳐진다. 아버지가 평생 보지 못했던 각도. 박영철이 지상에서 손을 흔든다. 점점 작아진다. 한강을 넘었다. 남쪽으로. 연료 잔량 85%. 경기도까지 여유롭다. 아버지의 설계도는 항공 가솔린을 태우며 하늘을 날았다.',
    },
  },
};

export default ENGINEER_BRANCH_B;
