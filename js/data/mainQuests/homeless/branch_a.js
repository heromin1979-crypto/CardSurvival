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
      start: '이지수가 삼성병원 부근에서 치료소를 운영하고 있다. 의사 한 명에 환자만 쌓여 있다. 약은 있어도 물자도, 사람도, 동선도 없다. 그건 내 영역이다.',
      complete: '이지수를 만났다. "최 대표님 얘기는 들었어요. 솔직히 저 혼자선 이 치료소 못 굴려요." 둘러봤다. 보급 동선이 엉켜 있었다. "치료는 의사가, 나머지는 내가 맡죠." 비상 박스에서 붕대를 챙겼다. 역할이 갈렸다.',
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
      start: '치료소와 거주 공간을 함께 짓는다. 도면은 내가 그린다. 동선, 격리 구획, 자재 순서 — 현장 소장 시절 몸에 밴 일이다. 이지수는 의료 동선만 짚어주면 된다.',
      complete: '공동 거점 완성. 작업 중 로프도 챙겼다. 이지수가 도면을 보고 말했다. "이 구조라면 환자 15명은 동시에 봐요. 저는 못 그릴 그림이네요."',
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
      start: '치료소에 사람이 모이기 시작했다. 치료만으로는 못 산다. 먹어야 산다. 강남 일대 물자 루트와 거리 인맥 — 공급망은 내가 깐다. 건설회사 때 제일 잘하던 일이다.',
      complete: '식량 확보 완료. 강남 마트에서 통조림도 여분으로 빼냈다. 이지수: "최 대표님이 오고 나서 사람이 안 굶어요." 거점이 돌아가기 시작했다. 치료소가 아니라 마을이 됐다.',
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
      start: '"강남에 의사가 있고, 물자도 있다." 소문은 내가 거리 인맥에 흘린 것이다. 하루 환자 8명. 물자가 빠르게 빈다. 보급은 끊기면 안 된다. 그게 내 책임이다.',
      complete: '치료 물자 보충 완료. 진통제와 소독약도 챙겼다. 이지수: "오늘 7명 봤어요. 형식 씨가 물자 안 끊으니까 가능한 거예요." 시스템이 돈다. 내가 설계한 시스템이.',
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
      start: '100일. 거점에 38명이 모였다. 치료소는 이지수가, 마을은 내가 세웠다. 이제 방향을 정한다.',
      complete: '이지수가 구급키트를 건넸다. "최 대표님, 여기 정리하고 더 좋은 곳을 같이 찾아볼까요? 결정은 대표님이 하세요." 오래 생각했다.',
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
