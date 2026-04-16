// === MAIN QUESTS: 윤재혁 (chef) — B경로: 용산 동료 셰프 합류 ===
// 분기 조건: chef_branch_b 플래그
// Q11~Q20: 용산 진출 → 동료 셰프 박민호 합류 → 전문 주방 구축 → 대량 급식

const CHEF_BRANCH_B = {

  mq_chef_b_11: {
    id: 'mq_chef_b_11', title: '용산 탐색',
    desc: '용산구에 도달하라. 소피텔 동료 셰프 박민호가 용산에 있다는 소문이다.',
    icon: '🔍', characterId: 'chef', dayTrigger: 65,
    prerequisite: 'mq_chef_10', requiresFlag: 'chef_branch_b',
    objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '용산에 소피텔 동료 박민호가 있다는 소문을 들었다. 호텔 셰프 두 명이면 전문 주방을 만들 수 있다.',
      complete: '용산에 도달했다. 전자상가 뒤편 건물에서 박민호를 찾았다. "재혁이형! 살아있었어요." 고철도 챙겼다. 이제 둘이서 시작한다.',
    },
  },

  mq_chef_b_12: {
    id: 'mq_chef_b_12', title: '주방 설비 수집',
    desc: '고철 5개를 수집하라. 박민호와 전문 주방 설비를 만든다.',
    icon: '🔩', characterId: 'chef', dayTrigger: 95,
    prerequisite: 'mq_chef_b_11', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 5 },
    reward: { morale: 12, items: [{ definitionId: 'wood', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '호텔 주방을 재현하려면 제대로 된 설비가 필요하다. 박민호가 설계를 맡고 재혁이 재료를 모은다.',
      complete: '고철 확보. 목재도 찾았다. 박민호: "이 정도면 가스레인지 3구를 만들 수 있어요."',
    },
  },

  mq_chef_b_13: {
    id: 'mq_chef_b_13', title: '전문 주방 건설',
    desc: '구조물 2개를 제작하라. 호텔급 주방을 만든다.',
    icon: '🏗️', characterId: 'chef', dayTrigger: 120,
    prerequisite: 'mq_chef_b_12', requiresFlag: 'chef_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'salt', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 180,
    narrative: {
      start: '셰프 두 명의 경험을 합치면 폐허에서도 호텔 주방을 만들 수 있다. 조리대, 화구, 환기 시스템.',
      complete: '전문 주방 완성. 소금도 확보했다. 박민호: "소피텔 주방보다는 작지만, 기능은 다 갖췄어요." 재혁: "여기서 100인분은 만들 수 있다."',
    },
  },

  mq_chef_b_14: {
    id: 'mq_chef_b_14', title: '대량 식재료',
    desc: '식량 8개를 수집하라. 전문 주방을 가동할 식재료가 필요하다.',
    icon: '🛒', characterId: 'chef', dayTrigger: 140,
    prerequisite: 'mq_chef_b_13', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 210,
    narrative: {
      start: '주방은 완성됐지만 식재료가 부족하다. 용산과 중구 일대를 샅샅이 뒤진다.',
      complete: '대량 식재료 확보. 통조림도 추가로 발견. 박민호: "이 정도면 일주일 대규모 급식이 가능해요."',
    },
  },

  mq_chef_b_15: {
    id: 'mq_chef_b_15', title: '셰프 특선 메뉴',
    desc: '음식 아이템 3개를 제작하라. 전문 주방에서 본격적인 요리를 시작한다.',
    icon: '👨‍🍳', characterId: 'chef', dayTrigger: 160,
    prerequisite: 'mq_chef_b_14', requiresFlag: 'chef_branch_b',
    objective: { type: 'craft_item', category: 'food', count: 3 },
    reward: { morale: 12, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 230,
    narrative: {
      start: '통조림 죽이 아니라 제대로 된 음식을 만든다. 소피텔 셰프 두 명이 힘을 합친다.',
      complete: '셰프 특선 메뉴 3종 완성. 허브차도 만들었다. 생존자들이 줄을 섰다. "이게 진짜 음식이에요." 박민호: "형, 우리 다시 셰프가 됐어요."',
    },
  },

  mq_chef_b_16: {
    id: 'mq_chef_b_16', title: '식수 확보 체계',
    desc: '깨끗한 물 5개를 확보하라. 대량 조리를 위한 안정적 식수가 필요하다.',
    icon: '💧', characterId: 'chef', dayTrigger: 180,
    prerequisite: 'mq_chef_b_15', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 250,
    narrative: {
      start: '대량 조리에는 대량의 깨끗한 물이 필수다. 정수 시스템을 확보해야 한다.',
      complete: '식수 확보 완료. 정수 필터도 찾았다. 박민호: "물 걱정 없이 조리에 집중할 수 있겠어요."',
    },
  },

  mq_chef_b_17: {
    id: 'mq_chef_b_17', title: '조미료 비축',
    desc: '소금 5개를 수집하라. 대량 조리에 소금이 대량으로 필요하다.',
    icon: '🧂', characterId: 'chef', dayTrigger: 200,
    prerequisite: 'mq_chef_b_16', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'salt', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'salt', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 270,
    narrative: {
      start: '소금이 바닥나고 있다. 대량 조리에는 조미료도 대량으로 필요하다. 남대문시장 소금 창고를 다시 뒤진다.',
      complete: '소금 대량 확보. 여분도 챙겼다. 재혁: "소금이 있으면 뭐든 만들 수 있다."',
    },
  },

  mq_chef_b_18: {
    id: 'mq_chef_b_18', title: '급식 확장',
    desc: '구조물 2개를 추가 제작하라. 급식 규모를 두 배로 확장한다.',
    icon: '🏛️', characterId: 'chef', dayTrigger: 230,
    prerequisite: 'mq_chef_b_17', requiresFlag: 'chef_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'cloth', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 300,
    narrative: {
      start: '찾아오는 사람이 50명을 넘었다. 좌석과 배식대를 늘려야 한다.',
      complete: '급식 시설 확장 완료. 천으로 차양도 만들었다. 이제 100명까지 동시에 급식할 수 있다.',
    },
  },

  mq_chef_b_19: {
    id: 'mq_chef_b_19', title: '식량 자급 체계',
    desc: '약초 5개를 수집하라. 허브 재배와 식량 자급 체계의 기반을 만든다.',
    icon: '🌱', characterId: 'chef', dayTrigger: 260,
    prerequisite: 'mq_chef_b_18', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'herb', count: 5 },
    reward: { morale: 12, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 330,
    narrative: {
      start: '외부 식재료에만 의존할 수 없다. 허브부터 시작해서 직접 재배 체계를 만든다.',
      complete: '허브 씨앗 확보. 허브차도 만들었다. 박민호: "3개월 뒤면 허브는 자급할 수 있어요. 그 다음은 채소."',
    },
  },

  mq_chef_b_20: {
    id: 'mq_chef_b_20', title: '용산 셰프의 주방',
    desc: '365일을 생존하라. 두 셰프의 주방이 서울의 희망이 된다.',
    icon: '⭐', characterId: 'chef', dayTrigger: 300,
    prerequisite: 'mq_chef_b_19', requiresFlag: 'chef_branch_b',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, items: [{ definitionId: 'canned_food', qty: 3 }], flags: { mainQuestComplete_chef: true } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '1년. 용산 전문 주방에서 매일 100인분의 급식이 나간다. 윤재혁과 박민호, 두 셰프의 이름이 서울 전역에 알려졌다.',
      complete: 'D+365. 용산 셰프의 주방. 하루 급식 인원 103명. 누적 급식 15,200끼. 박민호: "형, 소피텔보다 많은 사람을 먹이고 있어요." 재혁은 조리대를 닦으며 웃었다. "이게 진짜 셰프의 일이다."',
    },
  },
};

export default CHEF_BRANCH_B;
