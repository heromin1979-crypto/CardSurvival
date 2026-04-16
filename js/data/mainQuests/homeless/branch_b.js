// === MAIN QUESTS: 최형식 (homeless) — B경로: 롯데타워 자력 커뮤니티 ===
// 분기 조건: homeless_branch_b 플래그
// 낙인 CEO → 생존 커뮤니티 수장. 두 번째 사업.
// Q11~Q15: 롯데타워 거점 구축
// Q15 분기점: 운영 방향 선택 → 2가지 엔딩 (Settle / Ascension)

const HOMELESS_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_homeless_b_11: {
    id: 'mq_homeless_b_11', title: '롯데타워 입주',
    desc: '송파구에 도달하라. 타워를 본거지로 삼는다.',
    icon: '🗼', characterId: 'homeless', dayTrigger: 65,
    prerequisite: 'mq_homeless_10', requiresFlag: 'homeless_branch_b',
    objective: { type: 'visit_district', districtId: 'songpa', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'rope', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '롯데타워. 서울에서 가장 높은 건물. 옛날엔 사업 미팅 때 내려다봤다. 지금은 오른다. 이 타워가 두 번째 사업의 본거지가 된다.',
      complete: '타워에 사람들이 모여있었다. 10여 명. 눈빛이 흔들렸다. 리더도 없었다. "저 건설회사 출신입니다. 여기 구조 알아요." 로프도 발견했다. 비상구 탈출에 쓸 수 있다. 그 한 마디로 충분했다.',
    },
  },

  mq_homeless_b_12: {
    id: 'mq_homeless_b_12', title: '타워 구조 점검',
    desc: '구조물 2개를 제작하라. 건설 전문가의 눈으로 타워의 취약 구간을 보강한다.',
    icon: '🏗️', characterId: 'homeless', dayTrigger: 95,
    prerequisite: 'mq_homeless_b_11', requiresFlag: 'homeless_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'nail', qty: 5 }, { definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '타워 1~4층 구조를 점검했다. 비상계단 3번 출입구가 취약하다. 주차장 쪽 철문 경첩이 부식됐다. 현장 소장 시절처럼 꼼꼼하게 본다. 사람이 살 곳은 안전해야 한다.',
      complete: '보강 완료. 작업 중 못과 고철 자재도 발견했다. 타워 사람들이 신뢰하기 시작했다. "어떻게 이런 걸 아세요?" 건설회사 대표가 뭔지 보여줄 시간이다.',
    },
  },

  mq_homeless_b_13: {
    id: 'mq_homeless_b_13', title: '외부 공급망 구축',
    desc: '강남구에 도달하라. 타워만으로는 자급자족이 불가능하다. 외부 물자 루트를 확보한다.',
    icon: '🔗', characterId: 'homeless', dayTrigger: 125,
    prerequisite: 'mq_homeless_b_12', requiresFlag: 'homeless_branch_b',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'canned_food', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '건설회사 때 배운 것 중 가장 중요한 것은 공급망이다. 최고의 빌딩도 자재가 없으면 못 짓는다. 강남구 일대를 정찰하며 물자 루트를 만든다. 2년간 쌓은 거리 인맥이 여기서 빛을 발한다.',
      complete: '강남구 생존자 집단 3곳과 접선했다. 물물교환 네트워크 구성. CEO 시절 계약처럼 손을 잡았다. 통조림도 첫 교환품으로 받았다. 타워는 안전, 그들은 식량을 제공한다.',
    },
  },

  mq_homeless_b_14: {
    id: 'mq_homeless_b_14', title: '인원 비축',
    desc: '식량 10개를 수집하라. 타워 거주자 30명의 2주치 식량이다. 직원을 먹이는 것도 대표의 일이다.',
    icon: '🍱', characterId: 'homeless', dayTrigger: 155,
    prerequisite: 'mq_homeless_b_13', requiresFlag: 'homeless_branch_b',
    objective: { type: 'collect_item_type', itemType: 'food', count: 10 },
    reward: { morale: 10, items: [{ definitionId: 'painkiller', qty: 2 }, { definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '타워 인원이 30명을 넘었다. 먹는 것부터 해결해야 리더가 된다. 회사 다닐 때 직원 월급이 제일 먼저였다. 지금은 식량이 월급이다.',
      complete: '식량 비축 완료. 30명 분. 배분 중 진통제와 붕대도 커뮤니티 의료용으로 챙겼다. 배분을 시작하자 사람들이 최형식을 중심으로 모였다. "여기서는 굶지 않는다."',
    },
  },

  mq_homeless_b_15: {
    id: 'mq_homeless_b_15', title: '두 번째 회사',
    desc: '100일 이상 생존하라. 타워 커뮤니티의 방향을 결정할 시간이다.',
    icon: '⚖️', characterId: 'homeless', dayTrigger: 185,
    prerequisite: 'mq_homeless_b_14', requiresFlag: 'homeless_branch_b',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 8, items: [{ definitionId: 'lighter', qty: 1 }, { definitionId: 'flashlight', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '롯데타워 왕국',
        desc: '서울 최대 커뮤니티로 키운다. 이번엔 절대 무너지지 않는다.',
        setsFlag: 'homeless_end_b1',
      },
      {
        label: '서울 네트워크 허브',
        desc: '한곳에 머물지 않는다. 서울 전역의 생존자들을 연결하는 중개자가 된다.',
        setsFlag: 'homeless_end_b3',
      },
    ],
    narrative: {
      start: '100일. 타워 커뮤니티 인원 40명. 외부 공급망 3개. 첫 번째 회사를 만들 때와 비슷한 느낌이다. 이제 어디로 갈 것인가.',
      complete: '타워 창고에서 라이터와 손전등을 발견했다. 타워 사람들이 기다리고 있었다. "최 대표, 앞으로 어떻게 합니까?" 두 가지 길이 보인다.',
    },
  },

  // ── B1 엔딩: 롯데타워 왕국 ─────────────────────────────────

  mq_homeless_end_b1: {
    id: 'mq_homeless_end_b1', title: '두 번째 제국',
    desc: '구조물 4개를 더 제작하라. 롯데타워를 서울 최대 자치 커뮤니티로 완성한다.',
    icon: '🏯', characterId: 'homeless', dayTrigger: 205,
    prerequisite: 'mq_homeless_b_15', requiresFlag: 'homeless_end_b1',
    objective: { type: 'craft_item', category: 'structure', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'crowbar', qty: 1 }, { definitionId: 'rope_ladder', qty: 1 }], flags: { mainQuestComplete_homeless: true, homeless_ending: 'b1_kingdom' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '첫 번째 회사. 부채 때문에 무너졌다. 이번엔 다르다. 부채도 없고, 경쟁자도 없고, 법인세도 없다. 타워 최종 확장을 시작한다.',
      complete: 'D+250. 롯데타워 자치 커뮤니티. 거주 인원 55명. 공급망 5개 구역 연결. 쇠지렛대와 로프 사다리, 건설 도구가 이것을 만들었다. 최형식은 창문으로 서울을 내려다봤다. "이번엔 무너지지 않는다."',
    },
  },

  // ── B3 엔딩: 서울 네트워크 허브 ─────────────────────────────

  mq_homeless_end_b3: {
    id: 'mq_homeless_end_b3', title: '서울 중개자',
    desc: '종로구로 이동하라. 서울 전역 생존자를 연결하는 물자 중개 네트워크를 완성한다.',
    icon: '🕸️', characterId: 'homeless', dayTrigger: 205,
    prerequisite: 'mq_homeless_b_15', requiresFlag: 'homeless_end_b3',
    objective: { type: 'visit_district', districtId: 'jongno', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'compass', qty: 1 }, { definitionId: 'binoculars', qty: 1 }], flags: { mainQuestComplete_homeless: true, homeless_ending: 'b3_network' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '타워에 머물지 않기로 했다. 한곳에 있으면 회사처럼 된다. 돌아다니며 연결하는 것이 내 방식이다. 광진 낚시꾼, 강남 의사, 서대문 소방관. 이 사람들을 연결한다.',
      complete: 'D+250. 광화문 광장. 나침반과 쌍안경. 중개자에게 필요한 도구다. 어깨에 짐이 있다. 각 구역에서 모은 물자 교환 목록. 최형식은 서울의 중개자가 됐다.',
    },
  },
};

export default HOMELESS_BRANCH_B;
