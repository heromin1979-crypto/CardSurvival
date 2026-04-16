// === MAIN QUESTS: 윤재혁 (chef) — B경로: 용산 동료 셰프 합류 (미식 복원) ===
// 분기 조건: chef_branch_b 플래그
// Q11~Q19: 용산 진출 → 동료 셰프 박민호 합류 → 전문 주방 구축 → 고급 조미료/재료 탐색
// Q20 엔딩: 미식 복원 — 최고의 요리 (Ascension 테마)

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
      complete: '전문 주방 완성. 소금도 확보했다. 박민호: "소피텔 주방보다는 작지만, 기능은 다 갖췄어요." 재혁: "여기서 미식을 되살린다."',
    },
  },

  mq_chef_b_14: {
    id: 'mq_chef_b_14', title: '고급 식재료',
    desc: '식량 8개를 수집하라. 미식 복원에 쓸 엄선된 재료가 필요하다.',
    icon: '🛒', characterId: 'chef', dayTrigger: 140,
    prerequisite: 'mq_chef_b_13', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 210,
    narrative: {
      start: '통조림과 건면만으로는 요리가 아니다. 미식으로 복원하려면 엄선된 식재료가 필요하다. 호텔 납품처와 고급 마트 창고를 노린다.',
      complete: '고급 식재료 8종 확보. 박민호: "이 정도면 풀코스를 낼 수 있어요. 살아남은 사람들에게 진짜 요리를 다시 선물할 수 있어요."',
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
      start: '통조림 죽이 아니라 제대로 된 음식을 만든다. 소피텔 셰프 두 명이 힘을 합친다. 생존 음식이 아닌 "요리".',
      complete: '셰프 특선 메뉴 3종 완성. 허브차도 만들었다. 생존자들이 줄을 섰다. "이게 진짜 음식이에요." 박민호: "형, 우리 다시 셰프가 됐어요."',
    },
  },

  mq_chef_b_16: {
    id: 'mq_chef_b_16', title: '식수 확보 체계',
    desc: '깨끗한 물 5개를 확보하라. 섬세한 조리에 안정적 식수가 필수다.',
    icon: '💧', characterId: 'chef', dayTrigger: 180,
    prerequisite: 'mq_chef_b_15', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 250,
    narrative: {
      start: '고급 요리에는 고품질 물이 필수다. 수프 스톡, 퓌레, 차의 베이스. 정수 필터를 확보해야 한다.',
      complete: '식수 확보 완료. 정수 필터도 찾았다. 박민호: "물 맛이 달라지면 요리 맛이 달라져요. 이제 진짜가 됩니다."',
    },
  },

  mq_chef_b_17: {
    id: 'mq_chef_b_17', title: '조미료 비축',
    desc: '소금 5개를 수집하라. 정교한 간 조절에 양질의 소금이 필요하다.',
    icon: '🧂', characterId: 'chef', dayTrigger: 200,
    prerequisite: 'mq_chef_b_16', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'salt', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'salt', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 270,
    narrative: {
      start: '소금은 요리의 기초이자 정점이다. 종류별로 모은다. 굵은 천일염, 가는 정제염, 허브 소금. 호텔 주방에 있던 것들을 되살린다.',
      complete: '소금 종류별로 확보. 재혁: "소금 하나로 메뉴가 열 배로 는다. 이게 셰프의 도구다."',
    },
  },

  mq_chef_b_18: {
    id: 'mq_chef_b_18', title: '다이닝 공간',
    desc: '구조물 2개를 추가 제작하라. 식사 자체를 경험으로 만든다.',
    icon: '🍽️', characterId: 'chef', dayTrigger: 230,
    prerequisite: 'mq_chef_b_17', requiresFlag: 'chef_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'cloth', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 300,
    narrative: {
      start: '주방만으로는 미식이 되지 않는다. 테이블, 조명, 공간. 앉아서 먹는다는 것 자체가 사람을 사람답게 한다.',
      complete: '다이닝 공간 완성. 천으로 테이블보를 깔았다. 이제 "식당"이다. 박민호: "다시는 못 볼 줄 알았던 풍경이에요."',
    },
  },

  mq_chef_b_19: {
    id: 'mq_chef_b_19', title: '허브 정원',
    desc: '약초 6개를 수집하라. 신선 허브 없이 미식은 완성되지 않는다.',
    icon: '🌿', characterId: 'chef', dayTrigger: 260,
    prerequisite: 'mq_chef_b_18', requiresFlag: 'chef_branch_b',
    objective: { type: 'collect_item', definitionId: 'herb', count: 6 },
    reward: { morale: 12, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 330,
    narrative: {
      start: '마지막 퍼즐은 신선 허브다. 바질, 로즈마리, 타임. 용산 주방 창가에 허브 정원을 만든다. 손끝에서 바로 뜯어 쓰는 향신료.',
      complete: '허브 6종 확보. 허브차도 추가로 만들었다. 박민호: "이제 진짜 다 갖춰졌어요. 셰프 두 명, 주방, 재료, 허브, 손님들." 재혁은 조용히 웃었다.',
    },
  },

  mq_chef_end_b1: {
    id: 'mq_chef_end_b1', title: '용산 미식 복원',
    desc: '365일을 생존하라. 두 셰프의 주방이 종말 이후 최고의 요리를 되살린다.',
    icon: '⭐', characterId: 'chef', dayTrigger: 300,
    prerequisite: 'mq_chef_b_19', requiresFlag: 'chef_branch_b',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, items: [{ definitionId: 'canned_food', qty: 3 }, { definitionId: 'herbal_tea', qty: 3 }], flags: { mainQuestComplete_chef: true, chef_ending: 'b1_ascension' } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '1년. 용산의 작은 식당에서 매일 저녁 풀코스가 나간다. 수프, 메인, 허브차. 종말 속에서 되살아난 미식. 윤재혁과 박민호의 이름이 서울 전역에 알려졌다.',
      complete: 'D+365. 용산 셰프의 주방. 하루 정찬 인원 42명. 누적 풀코스 6,800회. 박민호: "형, 소피텔 때보다 이 주방이 더 자랑스러워요." 재혁은 허브 소금을 마지막 접시에 뿌렸다. "요리가 사치가 아니라 존엄이라는 걸, 여기서 증명했다." 이것이 셰프의 정점이다.',
    },
  },
};

export default CHEF_BRANCH_B;
