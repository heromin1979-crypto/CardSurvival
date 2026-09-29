// === MAIN QUESTS: 박영철 (firefighter) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(가족 구출 최우선) vs B(정대한과 대형 대피소)

const FIREFIGHTER_SHARED = {

  mq_fire_01: {
    id: 'mq_fire_01',
    title: '비어 있는 은평 거처',
    desc: '용산 사고 뒤 돌아온 은평의 가족 거처가 비었다. 수색을 위해 식량 3개를 수집하라.',
    icon: '🔥',
    characterId: 'firefighter',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'lighter', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '용산 출동에서 동료 이재훈을 잃은 박영철 소방위(44세)는 은평 불광동으로 돌아왔다. 아내와 두 아이의 거처는 비어 있다. 남은 대피 흔적은 용산 소방서의 집결 기록을 가리킨다. 식량을 챙기고 가족의 다음 행선지를 확인해야 한다.',
      complete: '식량을 확보했다. 항상 지니고 다니던 라이터. 이재훈은... 이미 늦었다. 혼자 버텨야 한다. 은평구 불광동. 아내와 두 아이.',
    },
  },

  mq_fire_02: {
    id: 'mq_fire_02',
    title: '임시 구호소',
    desc: '용산구에서 소방서 임시 구호소 공정에 재료를 투입하고 가동하라. 설비 설치 → 운영 물자 투입.',
    icon: '🏗️',
    characterId: 'firefighter',
    dayTrigger: 2,
    prerequisite: 'mq_fire_01',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_relief', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'rope', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: Infinity,
    narrative: {
      start: '가족의 대피 행선지와 구조 장비를 찾으러 은평에서 용산 소방서로 향한다. 집결 기록을 찾는 동안 생존자들이 머물 임시 구호소부터 마련한다.',
      complete: '임시 구호소 완성. 소방서 창고에서 로프도 챙겼다. 10년 경력 구조대원의 손으로 만든 것이니 견고하다.',
    },
  },

  mq_fire_03: {
    id: 'mq_fire_03',
    title: '이재훈을 위해',
    desc: '의료 아이템 3개를 수집하라. 이재훈이 살아있었다면 썼을 물자다.',
    icon: '🩹',
    characterId: 'firefighter',
    dayTrigger: 4,
    prerequisite: 'mq_fire_02',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 14,
    narrative: {
      start: '은평으로 돌아오기 전, 용산에서 마지막으로 이재훈을 찾았던 기억이 떠올랐다. 그는 더 이상 말을 하지 못했다. 눈만 영철을 향했다. 소방관 둘이 지키던 규칙대로, 영철은 그를 고통 없이 보냈다. "미안하다, 재훈아." 이제 할 수 있는 건 앞으로 나아가는 것뿐이다.',
      complete: '응급 키트를 꾸렸다. 붕대도 여분으로 챙겼다. 이재훈이 살아있었다면 이걸로 누군가를 살렸을 거다. 소방관은 항상 준비돼 있어야 한다.',
    },
  },

  mq_fire_04: {
    id: 'mq_fire_04',
    title: '로프 확보',
    desc: '용산구에서 구조 접근 장비 공정에 재료를 투입하고 가동하라. 설비 설치.',
    icon: '🧗',
    characterId: 'firefighter',
    dayTrigger: 6,
    prerequisite: 'mq_fire_03',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_access', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'rope_ladder', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: Infinity,
    narrative: {
      start: '서대문까지 지상 이동은 위험하다. 옥상과 비상계단을 연결해야 한다. 로프는 현장에서 항상 쓰던 장비다.',
      complete: '로프로 구조용 사다리를 만들었다. 구조 현장에서 수백 번 써온 그 방법 그대로.',
    },
  },

  mq_fire_05: {
    id: 'mq_fire_05',
    title: '동료의 식량',
    desc: '식량 5개를 비축하라. 이재훈과 함께 먹으려던 것들이다.',
    icon: '🍱',
    characterId: 'firefighter',
    dayTrigger: 8,
    prerequisite: 'mq_fire_04',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 18,
    narrative: {
      start: '이재훈이 말했었다. "영철이 형, 이번 휴가 때 소주 한 잔 하자." 이제 혼자 마셔야겠지.',
      complete: '식량을 챙겼다. 통조림도 따로 빼놨다. 살아야 은평에 갈 수 있다.',
    },
  },

  mq_fire_06: {
    id: 'mq_fire_06',
    title: '부상자 치료',
    desc: '부상 생존자 1명을 실제로 완치시켜라. 은평에서 구조한 주민이나 동작 응급실 환자를 치료할 수 있다. 이전 완치도 인정한다.',
    icon: '💊',
    characterId: 'firefighter',
    dayTrigger: 10,
    prerequisite: 'mq_fire_05',
    objectiveRevision: 1,
    objective: { type: 'treat_npc', count: 1 },
    actionHint: '부상 NPC 카드에 요구 치료품을 드래그한다. 구조 주민을 만날 수 없으면 동작구 보라매병원 응급실에서 새 환자를 받는다. 붕대 보유만으로는 완료되지 않는다.',
    reward: { morale: 8, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 20,
    narrative: {
      start: '소방관으로 10년. 물자를 챙기는 데서 끝내지 않는다. 은평에서 구조한 주민의 상처를 살피거나 동작 응급실의 부상자를 도와 실제 처치를 마쳐야 한다.',
      complete: '한 사람의 상처가 아물었다. 현장에서 하던 그대로, 준비한 물자를 실제 처치에 썼다. 다음 구조에 쓸 구급키트도 챙겼다.',
    },
  },

  mq_fire_07: {
    id: 'mq_fire_07',
    title: '소방서 거점',
    desc: '용산구에서 소방서 출입구와 급수 공정에 재료를 투입하고 가동하라. 설비 설치 → 운영 물자 투입.',
    icon: '🏢',
    characterId: 'firefighter',
    dayTrigger: 13,
    prerequisite: 'mq_fire_06',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_station', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: Infinity,
    narrative: {
      start: '이 소방서를 기점으로 삼는다. 은평에서 돌아올 때 쓸 수도 있다. 단단히 만든다.',
      complete: '소방서 거점 완성. 소방서 장비함에서 손전등도 찾았다. 출발 준비 완료. 은평구 불광동. 아내와 두 아이.',
    },
  },

  mq_fire_08: {
    id: 'mq_fire_08',
    title: '이동 식량',
    desc: '식량 5개를 더 챙겨라. 서대문까지 이동하는 데 필요하다.',
    icon: '🎒',
    characterId: 'firefighter',
    dayTrigger: 15,
    prerequisite: 'mq_fire_07',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'stamina_tonic', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 30,
    narrative: {
      start: '서대문까지 도보로 하루. 은평까지 이틀. 최소 이만큼의 식량이 필요하다.',
      complete: '배낭을 쌌다. 장거리 이동에 활력 강장제도 챙겼다. 사진 한 장을 꺼냈다. 아내와 아이들이 웃고 있다.',
    },
  },

  mq_fire_09: {
    id: 'mq_fire_09',
    title: '서대문 돌파',
    desc: '서대문구에 도달하라. 은평이 바로 위다.',
    icon: '🏙️',
    characterId: 'firefighter',
    dayTrigger: 18,
    prerequisite: 'mq_fire_08',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'binoculars', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 35,
    narrative: {
      start: '서대문만 넘으면 은평이다. 옥상 루트로 이동한다. 구조 현장에서 수백 번 해본 방식이다.',
      complete: '서대문구 도착. 버려진 쌍안경을 발견했다. 멀리 은평 불광동 아파트가 선명히 보인다. 저기다. 두 가지 소식이 들렸다. 정대한 기계공이 대형 대피소를 만들 수 있다고 한다. 그리고 가족의 무전.',
    },
  },

  mq_fire_10: {
    id: 'mq_fire_10',
    title: '서대문 도착',
    desc: '의료 아이템 3개를 확보하라. 가족이 부상당했을 수도 있다.',
    icon: '🗺️',
    characterId: 'firefighter',
    dayTrigger: 21,
    prerequisite: 'mq_fire_09',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'splint', qty: 1 }, { definitionId: 'painkiller', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 45,
    cinematicId: 'cin_branch_firefighter',
    isBranchPoint: true,
    branchOptions: [
      {
        label: '가족 구출 최우선',
        desc: '은평 불광동. 가족이 먼저다. 더 큰 거점은 포기한다.',
        setsFlag: 'fire_branch_a',
      },
      {
        label: '정대한과 대형 대피소 건설',
        desc: '가족 확인을 미룬다. 더 많은 사람을 살리는 쪽을 택한다.',
        setsFlag: 'fire_branch_b',
        recruitNpc: 'npc_daehan',
      },
    ],
    narrative: {
      start: '서대문구. 은평구가 바로 위다. 조금만 더. 가족이 다쳤을 수도 있다. 치료 물자 없이 가면 안 된다.',
      complete: '의료 물자를 확보했다. 부목과 진통제까지 챙겼다. 무전기에서 정대한의 목소리가 다시 들렸다. "소방관님, 혼자 가족 데려오는 것보다, 같이 만들면 수십 명이 삽니다." 쌍안경 너머 불광동 아파트가 보인다. 저기 아내와 아이들이 있을지 모른다. 한 걸음이면 가족, 반대로 돌면 낯선 수십 명. 둘 다 가질 수는 없다.',
    },
  },

};

export default FIREFIGHTER_SHARED;
