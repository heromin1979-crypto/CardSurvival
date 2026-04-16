// === MAIN QUESTS: 윤재혁 (chef) — A경로: 한강 이남 식량 루트 개척 ===
// 분기 조건: chef_branch_a 플래그
// Q11~Q18: 강남 진출 → 대형마트 식량 확보 → 보급 루트 구축
// Q19 분기점: A1(강남 대형마트 식량 네트워크) vs A2(가락시장 농장 연계)

const CHEF_BRANCH_A = {

  mq_chef_a_11: {
    id: 'mq_chef_a_11', title: '강남 진출',
    desc: '강남구에 도달하라. 대형마트에 대량의 식재료가 남아있을 것이다.',
    icon: '🏬', characterId: 'chef', dayTrigger: 65,
    prerequisite: 'mq_chef_10', requiresFlag: 'chef_branch_a',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '한강을 건너야 한다. 강남 대형마트에는 통조림, 곡물, 조미료가 대량으로 남아있을 것이다. 먼 길이지만 가치가 있다.',
      complete: '강남에 도달했다. 대형마트 주차장에 좀비가 몰려있었지만 뒤쪽 하역장으로 진입 성공. 통조림 2박스를 먼저 챙겼다. 창고에 더 많은 것이 있다.',
    },
  },

  mq_chef_a_12: {
    id: 'mq_chef_a_12', title: '대형마트 식재료',
    desc: '식량 8개를 수집하라. 대형마트 창고에서 대량의 식재료를 확보한다.',
    icon: '🛒', characterId: 'chef', dayTrigger: 95,
    prerequisite: 'mq_chef_a_11', requiresFlag: 'chef_branch_a',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 12, items: [{ definitionId: 'salt', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '마트 창고 재고 목록을 찾았다. 통조림, 건면, 식용유, 소금. 상당량이 유통기한 내다. 전부 옮겨야 한다.',
      complete: '식재료 대량 확보. 소금도 추가로 챙겼다. 이 양이면 남대문 급식소를 한 달은 운영할 수 있다.',
    },
  },

  mq_chef_a_13: {
    id: 'mq_chef_a_13', title: '보급 루트 구축',
    desc: '로프 4개를 수집하라. 한강 도하 보급로에 필요하다.',
    icon: '🔗', characterId: 'chef', dayTrigger: 120,
    prerequisite: 'mq_chef_a_12', requiresFlag: 'chef_branch_a',
    objective: { type: 'collect_item', definitionId: 'rope', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'rope', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 180,
    narrative: {
      start: '식재료를 옮기려면 안정된 보급로가 필요하다. 다리 위를 통과하는 루트에 로프를 설치해 짐을 운반한다.',
      complete: '보급 루트 설치 완료. 여분 로프도 확보했다. 이제 정기적으로 식재료를 운반할 수 있다.',
    },
  },

  mq_chef_a_14: {
    id: 'mq_chef_a_14', title: '강남 급식소',
    desc: '구조물 2개를 제작하라. 강남에 두 번째 급식소를 건설한다.',
    icon: '🏗️', characterId: 'chef', dayTrigger: 140,
    prerequisite: 'mq_chef_a_13', requiresFlag: 'chef_branch_a',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 210,
    narrative: {
      start: '강남 생존자들도 굶고 있다. 여기에도 급식소가 필요하다. 마트 옆 빈 매장을 개조한다.',
      complete: '강남 급식소 완성. 남대문과 강남, 두 곳에서 동시에 운영한다. 고철로 보강한 조리대가 튼튼하다.',
    },
  },

  mq_chef_a_15: {
    id: 'mq_chef_a_15', title: '대규모 조리',
    desc: '음식 아이템 3개를 제작하라. 두 급식소에서 동시에 급식을 제공한다.',
    icon: '🍛', characterId: 'chef', dayTrigger: 160,
    prerequisite: 'mq_chef_a_14', requiresFlag: 'chef_branch_a',
    objective: { type: 'craft_item', category: 'food', count: 3 },
    reward: { morale: 12, items: [{ definitionId: 'canned_food', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 230,
    narrative: {
      start: '두 급식소를 동시에 운영하려면 효율적인 대규모 조리 시스템이 필요하다. 호텔 뷔페 경험이 여기서 빛을 발한다.',
      complete: '대규모 조리 시스템 가동. 한 번에 20인분. 소피텔 뷔페 때보다는 적지만 충분하다.',
    },
  },

  mq_chef_a_16: {
    id: 'mq_chef_a_16', title: '식수 정화 시설',
    desc: '깨끗한 물 5개를 확보하라. 급식소에 안정적인 식수 공급이 필요하다.',
    icon: '💧', characterId: 'chef', dayTrigger: 180,
    prerequisite: 'mq_chef_a_15', requiresFlag: 'chef_branch_a',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 250,
    narrative: {
      start: '식수가 급식소 운영의 병목이다. 정수 필터를 설치해 안정적인 식수 공급 체계를 만든다.',
      complete: '정수 시설 확보. 필터도 추가로 찾았다. 이제 깨끗한 물 걱정은 없다.',
    },
  },

  mq_chef_a_17: {
    id: 'mq_chef_a_17', title: '허브 채집 확장',
    desc: '약초 6개를 수집하라. 조미와 약용 허브를 비축한다.',
    icon: '🌱', characterId: 'chef', dayTrigger: 200,
    prerequisite: 'mq_chef_a_16', requiresFlag: 'chef_branch_a',
    objective: { type: 'collect_item', definitionId: 'herb', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 270,
    narrative: {
      start: '조미료만으로는 부족하다. 향과 약효를 겸한 허브가 필요하다. 강남 일대 공원과 골목 화단을 뒤진다.',
      complete: '허브 확보. 허브차도 만들었다. 급식에 향이 더해지면 맛이 완전히 달라진다.',
    },
  },

  mq_chef_a_18: {
    id: 'mq_chef_a_18', title: '보급 창고 강화',
    desc: '고철 4개를 수집하라. 식재료 보관 창고를 보강한다.',
    icon: '🔩', characterId: 'chef', dayTrigger: 230,
    prerequisite: 'mq_chef_a_17', requiresFlag: 'chef_branch_a',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'wood', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 300,
    narrative: {
      start: '식재료가 늘면 보관이 문제다. 약탈자로부터 지키려면 창고를 단단히 해야 한다.',
      complete: '보급 창고 강화 완료. 목재로 선반도 추가했다. 이제 한 달치 식재료를 안전하게 보관할 수 있다.',
    },
  },

  // ── A 서브 분기점 (Q19) ───────────────────────────────────────
  // 강남 거점을 확보한 뒤 두 방향 중 하나로 확장

  mq_chef_a_19: {
    id: 'mq_chef_a_19', title: '확장 방향 결정',
    desc: '250일 이상 생존하라. 식량 루트 확장 방향을 결정해야 한다.',
    icon: '⚖️', characterId: 'chef', dayTrigger: 260,
    prerequisite: 'mq_chef_a_18', requiresFlag: 'chef_branch_a',
    objective: { type: 'survive_days', count: 250 },
    reward: { morale: 10, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '강남 대형마트 식량 네트워크',
        desc: '한강 남쪽 대형마트들을 잇는 대규모 보급 네트워크를 완성한다.',
        setsFlag: 'chef_end_a1',
      },
      {
        label: '가락시장 농장 연계',
        desc: '가락시장 옥상 농장을 재가동해 자급 식량 기반을 만든다.',
        setsFlag: 'chef_end_a2',
      },
    ],
    narrative: {
      start: '강남 거점이 안정됐다. 남대문-강남 축은 탄탄하다. 이제 다음 확장이다.',
      complete: '두 가지 길이 보인다. 반포, 잠실, 서초 대형마트를 잇는 대규모 보급 네트워크. 또는 가락시장 옥상 농장을 되살려 직접 재배 기반을 구축하는 길. 셰프가 결정할 차례다.',
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  A1 엔딩: 강남 대형마트 식량 네트워크 (Expansion 테마)
  // ══════════════════════════════════════════════════════════════

  mq_chef_a1_prep: {
    id: 'mq_chef_a1_prep', title: '마트 네트워크 구축',
    desc: '식량 10개를 수집하라. 반포·잠실·서초 마트 순회 보급망의 첫 수확이다.',
    icon: '🚚', characterId: 'chef', dayTrigger: 280,
    prerequisite: 'mq_chef_a_19', requiresFlag: 'chef_end_a1',
    objective: { type: 'collect_item_type', itemType: 'food', count: 10 },
    reward: { morale: 12, items: [{ definitionId: 'canned_food', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '반포, 잠실, 서초, 논현. 강남 전역의 대형마트를 순회한다. 각 마트에 소규모 보급 거점을 만들면 한 곳이 털려도 다른 곳이 버틴다.',
      complete: '4개 마트에서 식량 10개 확보. 순회 보급망의 첫 수확이다. 이제 주간 루틴으로 돌릴 수 있다.',
    },
  },

  mq_chef_end_a1: {
    id: 'mq_chef_end_a1', title: '서울 급식 네트워크',
    desc: '365일을 생존하라. 강남 대형마트 네트워크가 서울 식량 자급 체계가 된다.',
    icon: '⭐', characterId: 'chef', dayTrigger: 320,
    prerequisite: 'mq_chef_a1_prep', requiresFlag: 'chef_end_a1',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, items: [{ definitionId: 'canned_food', qty: 3 }], flags: { mainQuestComplete_chef: true, chef_ending: 'a1_network' } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '1년. 남대문-강남 축에서 시작한 급식 네트워크가 한강 이남 전역으로 퍼지고 있다. 윤재혁의 이름은 "남대문 셰프"로 불린다.',
      complete: 'D+365. 4개 마트 + 2개 급식소 보급망. 하루 급식 인원 87명. 누적 급식 12,400끼. 윤재혁은 조리대 앞에 섰다. "음식은 생존이 아니라 희망입니다." 소피텔 호텔 주방보다 훨씬 보람찬 주방이다.',
    },
  },

  // ══════════════════════════════════════════════════════════════
  //  A2 엔딩: 가락시장 농장 연계 (Settle 테마)
  // ══════════════════════════════════════════════════════════════

  mq_chef_a2_prep: {
    id: 'mq_chef_a2_prep', title: '가락시장 옥상 농장',
    desc: '약초 씨앗 확보와 재배 기반. 약초 5개와 목재 4개를 수집하라.',
    icon: '🌾', characterId: 'chef', dayTrigger: 280,
    prerequisite: 'mq_chef_a_19', requiresFlag: 'chef_end_a2',
    objective: { type: 'collect_item', definitionId: 'herb', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'wood', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '송파 가락시장. 붕괴 전 옥상 도시농장 프로젝트가 있었다. 토양은 아직 살아있을 것이다. 허브부터 시작해 점차 작물로 확장한다.',
      complete: '허브 씨앗 5종 확보. 목재로 경작대도 만들 수 있다. 가락시장 옥상 밭의 뼈대가 잡힌다.',
    },
  },

  mq_chef_end_a2: {
    id: 'mq_chef_end_a2', title: '가락 자급 급식소',
    desc: '365일을 생존하라. 남대문 급식소와 가락 농장이 자급 체계를 이룬다.',
    icon: '🌾', characterId: 'chef', dayTrigger: 320,
    prerequisite: 'mq_chef_a2_prep', requiresFlag: 'chef_end_a2',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, items: [{ definitionId: 'herb', qty: 4 }, { definitionId: 'herbal_tea', qty: 3 }], flags: { mainQuestComplete_chef: true, chef_ending: 'a2_farm' } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '1년. 가락시장 옥상 농장이 돌아간다. 수확이 시작됐다. 외부 보급에만 의존하지 않는 최초의 급식소가 된다.',
      complete: 'D+365. 남대문 급식소 + 가락 옥상 농장. 하루 급식 인원 62명. 허브와 잎채소는 전량 자급. 윤재혁은 옥상에 올라 밭을 바라봤다. "이 도시에서 처음으로 음식을 직접 길렀습니다." 이것이 정착이다.',
    },
  },
};

export default CHEF_BRANCH_A;
