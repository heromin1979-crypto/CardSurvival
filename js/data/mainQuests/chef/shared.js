// === MAIN QUESTS: 윤재혁 (chef) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(한강 이남 식량 루트, 서브분기 2개) vs B(용산 동료 셰프 — 미식 복원)

const CHEF_SHARED = {

  mq_chef_01: {
    id: 'mq_chef_01', title: '식재료 확보',
    desc: '남대문시장으로 피신했다. 식량 3개를 수집하라.',
    icon: '🍳', characterId: 'chef', dayTrigger: 1, prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'canned_food', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 10,
    narrative: {
      start: '윤재혁(33세). 명동 소피텔 호텔 수석 셰프. 호텔 뷔페에서 손님이 직원을 공격했다. 주방 칼을 쥐고 지하 저장고로 피신. 이틀 후 남대문시장으로 이동했다. 식재료가 있을 것이다.',
      complete: '시장 골목에서 식재료를 찾았다. 통조림도 하나 챙겼다. 일단 오늘은 먹을 수 있다.',
    },
  },

  mq_chef_02: {
    id: 'mq_chef_02', title: '임시 조리대',
    desc: '구조물을 제작하라. 조리를 위한 안정된 공간이 필요하다.',
    icon: '🔥', characterId: 'chef', dayTrigger: 2, prerequisite: 'mq_chef_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'salt', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 12,
    narrative: {
      start: '날것은 위험하다. 제대로 조리하려면 안정된 화기와 작업대가 필요하다.',
      complete: '임시 조리대가 완성됐다. 불을 피울 수 있다. 소금도 찾았다. 이제 요리다운 요리를 할 수 있다.',
    },
  },

  mq_chef_03: {
    id: 'mq_chef_03', title: '소금 확보',
    desc: '소금 3개를 수집하라. 음식 보존과 간에 필수다.',
    icon: '🧂', characterId: 'chef', dayTrigger: 4, prerequisite: 'mq_chef_02',
    objective: { type: 'collect_item', definitionId: 'salt', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'canned_food', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 14,
    narrative: {
      start: '소금은 조리의 기본이다. 보존에도 간에도. 남대문시장 건어물 거리를 뒤진다.',
      complete: '소금 확보. 시장 건어물 가게 창고 깊숙이 남아있었다. 이것으로 음식을 오래 보존할 수 있다.',
    },
  },

  mq_chef_04: {
    id: 'mq_chef_04', title: '식수 확보',
    desc: '깨끗한 물 3개를 확보하라. 조리와 음용에 필수다.',
    icon: '💧', characterId: 'chef', dayTrigger: 6, prerequisite: 'mq_chef_03',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'herb', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 16,
    narrative: {
      start: '조리에 깨끗한 물이 없으면 아무것도 할 수 없다. 오염된 물로 끓인 국은 독이다.',
      complete: '정수된 물 확보. 채소밭 근처에서 허브도 발견했다. 물과 불과 소금. 요리의 삼위일체가 갖춰졌다.',
    },
  },

  mq_chef_05: {
    id: 'mq_chef_05', title: '허브 채집',
    desc: '약초 3개를 수집하라. 향신료 대용으로 사용한다.',
    icon: '🌿', characterId: 'chef', dayTrigger: 8, prerequisite: 'mq_chef_04',
    objective: { type: 'collect_item', definitionId: 'herb', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'herbal_tea', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 18,
    narrative: {
      start: '소피텔 셰프가 간만 맞추고 끝낼 수 없다. 허브는 향신료이자 약이다. 시장 뒷골목 화분에서 자란 것들이 있다.',
      complete: '허브 확보. 바로 허브차를 만들었다. 향이 좋다. 사람들에게 따뜻한 차 한 잔이라도 줄 수 있다.',
    },
  },

  mq_chef_06: {
    id: 'mq_chef_06', title: '첫 번째 급식',
    desc: '음식 아이템 1개를 제작하라. 생존자들에게 따뜻한 한 끼를 제공한다.',
    icon: '🍲', characterId: 'chef', dayTrigger: 10, prerequisite: 'mq_chef_05',
    objective: { type: 'craft_item', category: 'food', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'clean_water', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 20,
    narrative: {
      start: '재료가 갖춰졌다. 처음으로 제대로 된 요리를 만든다. 시장 광장에 냄새가 퍼지면 사람들이 올 것이다.',
      complete: '첫 급식 완료. 시장 골목에서 세 명이 찾아왔다. 눈물을 흘리며 먹었다. "따뜻한 밥이 이렇게 좋은 거였어요." 요리는 생존이 아니라 희망이다.',
    },
  },

  mq_chef_07: {
    id: 'mq_chef_07', title: '급식소 확장',
    desc: '구조물 1개를 추가 제작하라. 급식 규모를 늘린다.',
    icon: '🏗️', characterId: 'chef', dayTrigger: 13, prerequisite: 'mq_chef_06',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'salt', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 23,
    narrative: {
      start: '찾아오는 사람이 늘고 있다. 임시 조리대 하나로는 부족하다. 좌석과 보관 공간이 필요하다.',
      complete: '급식소가 제법 모양새를 갖췄다. 조리대, 간이 테이블, 식재료 보관함. 남대문 급식소. 이름을 붙였다.',
    },
  },

  mq_chef_08: {
    id: 'mq_chef_08', title: '식량 비축',
    desc: '식량 5개를 수집하라. 급식소 운영을 위한 비축이 필요하다.',
    icon: '📦', characterId: 'chef', dayTrigger: 15, prerequisite: 'mq_chef_07',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 8, items: [{ definitionId: 'canned_food', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 30,
    narrative: {
      start: '하루 분량으로는 급식소를 운영할 수 없다. 최소 일주일치를 비축해야 한다. 남대문시장 창고를 더 뒤진다.',
      complete: '비축 완료. 통조림도 추가로 찾았다. 일주일은 버틸 수 있다. 하지만 더 많은 식재료 루트가 필요하다.',
    },
  },

  mq_chef_09: {
    id: 'mq_chef_09', title: '동대문 탐색',
    desc: '동대문구에 도달하라. 시장 주변에 추가 식재료가 있을 것이다.',
    icon: '📍', characterId: 'chef', dayTrigger: 18, prerequisite: 'mq_chef_08',
    objective: { type: 'visit_district', districtId: 'dongdaemun', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'cloth', qty: 2 }], flags: { chef_supply_route_east: true } },
    failPenalty: { morale: -5 }, deadlineDays: 35,
    narrative: {
      start: '남대문 식재료가 바닥나고 있다. 동대문시장 쪽으로 가면 포장재와 추가 물자를 찾을 수 있다.',
      complete: '동대문에 도달했다. 시장 창고에서 천과 포장재를 발견했다. 음식 포장에 사용할 수 있다. 동쪽 보급로가 열렸다.',
    },
  },

  mq_chef_10: {
    id: 'mq_chef_10', title: '급식소 안정화',
    desc: '식량 5개를 추가 비축하라. 급식소 운영이 안정기에 접어든다.',
    icon: '🍽️', characterId: 'chef', dayTrigger: 21, prerequisite: 'mq_chef_09',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 12, items: [{ definitionId: 'herbal_tea', qty: 2 }, { definitionId: 'salt', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 40,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '한강 이남 식량 루트',
        desc: '강남 대형마트로 진출해 한강 이남 보급망을 개척한다. 이후 네트워크와 농장 연계로 다시 갈린다.',
        setsFlag: 'chef_branch_a',
      },
      {
        label: '용산 동료 셰프 — 미식 복원',
        desc: '용산에서 소피텔 동료 박민호를 찾아 전문 주방을 세우고, 종말 이후의 미식을 되살린다.',
        setsFlag: 'chef_branch_b',
      },
    ],
    narrative: {
      start: '급식소가 안정기에 접어들었다. 매일 열 명 이상이 찾아온다. 더 큰 그림을 그려야 한다.',
      complete: '식량 비축 완료. 허브차와 소금도 챙겼다. 이제 선택의 기로다. 강남 대형마트로 진출해 한강 이남 식량 루트를 개척할 것인가, 용산에서 동료 셰프 박민호를 찾아 전문 주방을 세우고 미식을 복원할 것인가.',
    },
  },
};

export default CHEF_SHARED;
