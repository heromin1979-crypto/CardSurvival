// === MAIN QUESTS: 최형식 (homeless) — A경로: 이지수 협력 ===
// 분기 조건: homeless_branch_a 플래그
// Q11~Q15: 이지수 의사와 의료+커뮤니티 거점 구축
// Q15 분기점: 이지수와 떠나기 → 1가지 엔딩 (Escape)

const HOMELESS_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_homeless_a_11: {
    id: 'mq_homeless_a_11', title: '이지수 합류',
    desc: '강남구에 도달하라. 이지수 의사가 있는 치료소다.',
    icon: '🏥', characterId: 'homeless', dayTrigger: 65,
    prerequisite: 'mq_homeless_10', requiresFlag: 'homeless_branch_a',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '이지수가 삼성병원 부근에서 치료소를 운영하고 있다. 의사와 물류 전문가가 만나면 가능성이 달라진다.',
      complete: '이지수 의사를 만났다. "최 대표님이 오신다고 들었어요. 치료소에 물자가 필요했거든요." 치료소 비상 박스에서 붕대도 꺼내줬다. 역할이 분명해졌다.',
    },
  },

  mq_homeless_a_12: {
    id: 'mq_homeless_a_12', title: '공동 거점 구축',
    desc: '구조물 2개를 제작하라. 치료소 겸 커뮤니티 거점을 만든다.',
    icon: '🏗️', characterId: 'homeless', dayTrigger: 95,
    prerequisite: 'mq_homeless_a_11', requiresFlag: 'homeless_branch_a',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'rope', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '치료소와 거주 공간을 함께 만든다. 건설회사 경험과 이지수의 의료 공간 설계 지식이 결합됐다.',
      complete: '공동 거점 완성. 작업 중 로프도 발견했다. 이지수: "이 구조라면 환자 15명은 동시에 수용 가능해요."',
    },
  },

  mq_homeless_a_13: {
    id: 'mq_homeless_a_13', title: '집단 식량 확보',
    desc: '식량 8개를 수집하라. 함께 사는 사람들을 먹여야 한다.',
    icon: '🍱', characterId: 'homeless', dayTrigger: 125,
    prerequisite: 'mq_homeless_a_12', requiresFlag: 'homeless_branch_a',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10, items: [{ definitionId: 'canned_food', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '치료소에 사람들이 모이기 시작했다. 치료뿐 아니라 식량도 필요하다. 공급망은 내 몫이다.',
      complete: '식량 확보 완료. 강남 마트에서 통조림도 여분으로 확보했다. 이지수: "이제 여기서 치료받고 머물 수 있어요." 거점이 완성되기 시작했다.',
    },
  },

  mq_homeless_a_14: {
    id: 'mq_homeless_a_14', title: '집단 치료',
    desc: '의료 아이템 5개를 수집하라. 치료소가 본격적으로 운영된다.',
    icon: '⚕️', characterId: 'homeless', dayTrigger: 155,
    prerequisite: 'mq_homeless_a_13', requiresFlag: 'homeless_branch_a',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'painkiller', qty: 2 }, { definitionId: 'antiseptic', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '소문이 퍼졌다. "강남에 의사가 있고, 물자도 있다." 하루 평균 환자 8명. 치료 물자가 빠르게 소진된다.',
      complete: '치료 물자 보충 완료. 진통제와 소독약도 챙겼다. 이지수: "덕분에 오늘 7명을 치료했어요." 시스템이 돌아간다.',
    },
  },

  mq_homeless_a_15: {
    id: 'mq_homeless_a_15', title: '커뮤니티 분기점',
    desc: '100일 이상 생존하라. 커뮤니티의 방향을 결정할 시간이다.',
    icon: '⚖️', characterId: 'homeless', dayTrigger: 185,
    prerequisite: 'mq_homeless_a_14', requiresFlag: 'homeless_branch_a',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 8, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '이지수와 함께 떠나기',
        desc: '더 좋은 곳을 찾아 함께 이동한다.',
        setsFlag: 'homeless_end_a3',
      },
    ],
    narrative: {
      start: '100일. 이지수와 최형식의 거점에 38명이 모였다. 이제 방향을 정해야 한다.',
      complete: '이지수가 구급키트를 건네며 말했다. "최 대표님, 여기를 떠나 더 좋은 곳을 찾아볼까요?" 오래 생각했다.',
    },
  },

  // ── A3 엔딩: 이지수와 함께 떠나기 ───────────────────────────

  mq_homeless_end_a3: {
    id: 'mq_homeless_end_a3', title: '함께 이주',
    desc: '식량 6개를 비축하라. 이지수와 함께 더 좋은 곳을 찾아 떠난다.',
    icon: '🚶', characterId: 'homeless', dayTrigger: 205,
    prerequisite: 'mq_homeless_a_15', requiresFlag: 'homeless_end_a3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 6 },
    reward: { morale: 15, items: [{ definitionId: 'canned_food', qty: 5 }], flags: { mainQuestComplete_homeless: true, homeless_ending: 'a3_journey' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '서울에 미련이 없다. 이지수가 함께 가겠다고 했다. 더 안전한 곳을 찾는다.',
      complete: 'D+100. 최형식과 이지수는 강남을 떠났다. 통조림 가득 든 배낭을 메고. 이번엔 혼자가 아니었다. 누군가와 함께 걷는 것이 이렇게 다른 것인지 몰랐다.',
    },
  },
};

export default HOMELESS_BRANCH_A;
