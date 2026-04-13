// === MAIN QUESTS: 최형식 (homeless) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(이지수 협력) vs B(롯데타워 자력)

const HOMELESS_SHARED = {

  mq_homeless_01: {
    id: 'mq_homeless_01', title: '다리 아래 생존',
    desc: '세상이 끝나는 날에도 다리 아래에 있었다. 식량 3개를 수집하라.',
    icon: '🌉', characterId: 'homeless', dayTrigger: 1, prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'cloth', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 10,
    narrative: {
      start: '최형식(52세). 한때 중견 건설회사 대표. 지금은 동호대교 아래. 세상이 끝나는 날 밤에도 여기에 있었다. 겁이 나지 않았다. 이미 한 번 다 잃었으니까.',
      complete: '식량을 찾았다. 다리 기둥 옆에 버려진 천 두 조각도 챙겼다. 없어도 사는 법을 알지만, 있으면 좋다.',
    },
  },

  mq_homeless_02: {
    id: 'mq_homeless_02', title: '첫 번째 불',
    desc: '밤이 추워졌다. 구조물을 제작해 캠프파이어를 만들어라.',
    icon: '🔥', characterId: 'homeless', dayTrigger: 2, prerequisite: 'mq_homeless_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'lighter', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 12,
    narrative: {
      start: '2년간 다리 아래서 살았다. 불 피우는 것은 이미 몸이 기억한다.',
      complete: '불이 피워졌다. 불 옆 쓰레기 더미에서 라이터도 발견했다. 이것만으로도 충분하다.',
    },
  },

  mq_homeless_03: {
    id: 'mq_homeless_03', title: '거리의 기술',
    desc: '쓸모 있는 재료 5개를 수집하라. 남들이 버린 것에서 가치를 찾는다.',
    icon: '🔍', characterId: 'homeless', dayTrigger: 4, prerequisite: 'mq_homeless_02',
    objective: { type: 'collect_item_type', itemType: 'material', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 14,
    narrative: {
      start: '쓰레기통 속에서 보물을 찾는 법을 안다. 2년의 거리 생활이 가르쳐준 것. 이제 이 기술이 진짜 생존에 쓰인다.',
      complete: '재료가 모였다. 남들이 버린 것 중에 쓸 만한 고철도 따로 챙겼다. 이게 거리의 기술이다.',
    },
  },

  mq_homeless_04: {
    id: 'mq_homeless_04', title: '한강 정수',
    desc: '깨끗한 물 3개를 확보하라. 한강변에서 정수하는 법을 안다.',
    icon: '🌊', characterId: 'homeless', dayTrigger: 6, prerequisite: 'mq_homeless_03',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'charcoal', qty: 2 }, { definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 16,
    narrative: {
      start: '한강은 오염됐지만, 정수하는 법이 있다. 숯과 천. 2년 동안 이 방법으로 마셨다.',
      complete: '깨끗한 물이 생겼다. 정수하면서 숯도 만들었고, 버려진 정수 필터도 발견했다. 사업할 때 몰랐던 사실이다.',
    },
  },

  mq_homeless_05: {
    id: 'mq_homeless_05', title: '광진 낚시 거점',
    desc: '광진구로 이동하라. 한강 상류에 2년간 알고 지낸 낚시꾼 집단이 있다.',
    icon: '🎣', characterId: 'homeless', dayTrigger: 8, prerequisite: 'mq_homeless_04',
    objective: { type: 'visit_district', districtId: 'gwangjin', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'canned_food', qty: 2 }, { definitionId: 'rope', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 22,
    narrative: {
      start: '다리 아래서 2년 동안 한강을 거슬러 올라가며 생존자들과 네트워크를 만들었다. 광진 어귀에 낚시꾼 집단이 있다. 그들이 식량 정보를 갖고 있다.',
      complete: '광진 낚시 집단. 4명이 강가에 텐트를 치고 있었다. "최 형, 아직 살아 있었어요?" 거리의 인맥은 끊기지 않았다. 통조림과 로프를 얻었다.',
    },
  },

  mq_homeless_06: {
    id: 'mq_homeless_06', title: '고철 채집',
    desc: '고철 3개를 수집하라. 거처를 강화하고 물물교환에 쓸 수 있다.',
    icon: '♻️', characterId: 'homeless', dayTrigger: 10, prerequisite: 'mq_homeless_05',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'nail', qty: 3 }, { definitionId: 'wire', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 24,
    narrative: {
      start: '건설회사 대표 시절, 고철의 시세를 줄줄이 외웠다. 지금은 고철이 돈보다 쓸모 있다.',
      complete: '고철을 모았다. 함께 쏟아진 못과 철사도 챙겼다. 아이러니하게도 이게 더 편하다.',
    },
  },

  mq_homeless_07: {
    id: 'mq_homeless_07', title: '임시 거점',
    desc: '구조물 2개를 제작하라. 한강변에 좀 더 나은 거처를 만든다.',
    icon: '⛺', characterId: 'homeless', dayTrigger: 13, prerequisite: 'mq_homeless_06',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'rope', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 23,
    narrative: {
      start: '저 위, 롯데타워에서 사람들이 손을 흔드는 것 같았다. 거기 가기 전에 제대로 된 거처가 필요하다.',
      complete: '거처가 완성됐다. 구조물 만들면서 쓰고 남은 로프도 챙겼다. 2년 전 다리 아래보다 훨씬 낫다.',
    },
  },

  mq_homeless_08: {
    id: 'mq_homeless_08', title: '잠실대교 도하',
    desc: '구조물을 1개 제작하라. 파손된 교량 구간에 임시 발판을 만든다.',
    icon: '🌉', characterId: 'homeless', dayTrigger: 15, prerequisite: 'mq_homeless_07',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'crowbar', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 32,
    narrative: {
      start: '잠실대교 중간 구간이 무너져 있다. 건설회사 대표 출신이 이것을 못 건너면 말이 안 된다. 남은 자재로 임시 발판을 만든다.',
      complete: '발판을 세우고 건넜다. 강남. 작업하면서 쇠지렛대도 발견했다. 드디어 강을 건넜다.',
    },
  },

  mq_homeless_09: {
    id: 'mq_homeless_09', title: '이동 식량',
    desc: '식량 8개를 비축하라. 송파까지의 여정에 필요하다.',
    icon: '🎒', characterId: 'homeless', dayTrigger: 18, prerequisite: 'mq_homeless_08',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 8, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 33,
    narrative: {
      start: '강남에서 잠실까지. 회사 다닐 때는 차로 20분이었다. 지금은 하루 이상 걸린다.',
      complete: '8일치 식량. 강남 건물에서 손전등도 발견했다. 두 가지 제안이 들려왔다. 의사 이지수가 치료소를 함께 운영하자고 한다. 롯데타워에서 누군가가 혼자 버티고 있다는 소문도 들렸다.',
    },
  },

  mq_homeless_10: {
    id: 'mq_homeless_10', title: '집단 생활 준비',
    desc: '의료 아이템 3개를 수집하라. 함께 살려면 기본 치료가 필요하다.',
    icon: '🏥', characterId: 'homeless', dayTrigger: 21, prerequisite: 'mq_homeless_09',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 3 },
    reward: { morale: 8, items: [{ definitionId: 'painkiller', qty: 2 }, { definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 38,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '이지수 의사와 협력',
        desc: '의료+커뮤니티 결합. 의사가 있으면 살아남을 확률이 높아진다.',
        setsFlag: 'homeless_branch_a',
        recruitNpc: 'npc_jisu',
      },
      {
        label: '롯데타워 자력 커뮤니티',
        desc: '내 방식대로. 아무것도 없어도 버텨온 사람이다.',
        setsFlag: 'homeless_branch_b',
      },
    ],
    narrative: {
      start: '혼자든 여럿이든 다친 사람은 생기게 마련이다. 기본 치료 물자는 있어야 한다.',
      complete: '진통제와 붕대까지 갖췄다. 선택의 시간이 왔다. 이지수 의사와 합류할 것인가, 내 방식대로 롯데타워를 만들 것인가.',
    },
  },
};

export default HOMELESS_SHARED;
