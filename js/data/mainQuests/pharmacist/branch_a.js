// === MAIN QUESTS: 한소희 (pharmacist) — A경로: 이지수 의사 공동 연구 ===
// 분기 조건: pharma_branch_a 플래그
// Q11~Q15: 이지수와 임상+합성 공동 연구
// Q15 분기점: 연구 결과 선택 → 3가지 엔딩

const PHARMACIST_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_pharma_a_11: {
    id: 'mq_pharma_a_11', title: '이지수 합류',
    desc: '강남구에 도달하라. 이지수 의사가 있는 삼성병원 부근이다.',
    icon: '🔬', characterId: 'pharmacist', dayTrigger: 65,
    prerequisite: 'mq_pharma_10', requiresFlag: 'pharma_branch_a',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'antiseptic', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '이지수 의사의 임상 데이터 + 한소희의 합성 능력. 이 조합이 답이다. 강남으로 간다.',
      complete: '이지수를 만났다. "세브란스 데이터를 가지고 있어요. 당신의 합성 기술이 필요했어요." 병원 소독 재고에서 소독약 2개도 챙겼다. 두 사람의 연구가 시작된다.',
    },
  },

  mq_pharma_a_12: {
    id: 'mq_pharma_a_12', title: '합성 원료 수집',
    desc: '천연 합성 원료인 약초 6개를 수집하라. 이지수의 임상 데이터에 맞는 성분 배합을 찾는다.',
    icon: '⚗️', characterId: 'pharmacist', dayTrigger: 95,
    prerequisite: 'mq_pharma_a_11', requiresFlag: 'pharma_branch_a',
    objective: { type: 'collect_item', definitionId: 'herb', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '이지수의 임상 기록을 분석했다. 감염 48시간 후 세포 변이 패턴. 이것을 억제하는 천연 성분은 특정 약초 배합에 있다. 배합 비율이 핵심이다.',
      complete: '약초 확보. 채집 중 바로 허브차를 만들었다. 천연 항바이러스 성분이 들어있다. 이지수: "이 성분들이 임상 데이터와 일치해요."',
    },
  },

  mq_pharma_a_13: {
    id: 'mq_pharma_a_13', title: '합성 실증',
    desc: '의료 아이템을 2개 제작하라. 배합 이론을 실제 합성으로 증명한다.',
    icon: '🌿', characterId: 'pharmacist', dayTrigger: 125,
    prerequisite: 'mq_pharma_a_12', requiresFlag: 'pharma_branch_a',
    objective: { type: 'craft_item', category: 'medical', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'stamina_tonic', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '이론은 끝났다. 이제 실제로 만들어야 한다. 약사의 진짜 실력은 합성대에서 나온다.',
      complete: '합성 성공. 두 가지 성분의 결합 비율이 최적화됐다. 합성 부산물로 강장제도 만들어졌다. 이지수: "이게 맞아요. 환자에게 써볼 수 있어요."',
    },
  },

  mq_pharma_a_14: {
    id: 'mq_pharma_a_14', title: '대량 합성 준비',
    desc: '약초 5개를 추가 수집하라. 치료제 대량 합성을 위한 원료를 비축한다.',
    icon: '🏗️', characterId: 'pharmacist', dayTrigger: 155,
    prerequisite: 'mq_pharma_a_13', requiresFlag: 'pharma_branch_a',
    objective: { type: 'collect_item', definitionId: 'herb', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'antibiotics', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '1세트를 만들었다. 이제 대량으로 만들어야 한다. 이지수가 환자에게 쓸 만큼. 원료가 더 필요하다.',
      complete: '원료 비축 완료. 대량 합성 첫 배치에서 항생제가 만들어졌다. 이지수: "이제 20명 분은 만들 수 있어요." 한소희: "30명도 가능합니다."',
    },
  },

  mq_pharma_a_15: {
    id: 'mq_pharma_a_15', title: '연구 결과 분기점',
    desc: '180일 이상 생존하라. 연구 결과를 어떻게 활용할지 결정해야 한다.',
    icon: '⚖️', characterId: 'pharmacist', dayTrigger: 185,
    prerequisite: 'mq_pharma_a_14', requiresFlag: 'pharma_branch_a',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'antidote', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '백신 완성',
        desc: '모든 자원을 투입해 백신을 완성한다.',
        setsFlag: 'pharma_end_a1',
      },
      {
        label: '치료제 배포',
        desc: '완벽한 백신 대신 지금 당장 쓸 수 있는 치료제를 배포한다.',
        setsFlag: 'pharma_end_a2',
      },
      {
        label: '제조법 문서화',
        desc: '혼자 완성하는 것보다 제조법을 퍼뜨리는 것이 더 많은 사람을 살린다.',
        setsFlag: 'pharma_end_a3',
      },
    ],
    narrative: {
      start: '180일. 합성법이 완성에 가까워졌다. 이지수와 한소희. 의사의 임상과 약사의 합성이 만났다.',
      complete: '연구실에서 해독제를 발견했다. 이지수: "소희씨, 이제 결정해야 해요. 이 합성법으로 어디까지 갈 건가요?" 한소희는 합성 노트를 펼쳤다. 세 가지 방향이 보인다.',
    },
  },

  // ── A1 엔딩: 백신 완성 ──────────────────────────────────────

  mq_pharma_end_a1: {
    id: 'mq_pharma_end_a1', title: '백신 완성',
    desc: '의료 아이템 4개를 제작하라. 백신 대량 합성의 마지막 단계다.',
    icon: '💉', characterId: 'pharmacist', dayTrigger: 205,
    prerequisite: 'mq_pharma_a_15', requiresFlag: 'pharma_end_a1',
    objective: { type: 'craft_item', category: 'medical', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'antibiotics', qty: 2 }, { definitionId: 'stimulant', qty: 1 }], flags: { mainQuestComplete_pharmacist: true, pharmacist_ending: 'a1_vaccine' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '이지수의 임상 데이터 + 한소희의 합성 기술. 모든 것을 쏟아붓는다.',
      complete: 'D+100. 시험지가 파랗게 변했다. "항바이러스 백신 완성." 최종 합성 과정에서 항생제 2세트와 각성제도 나왔다. 이지수: "됐어요. 진짜 됐어요."',
    },
  },

  // ── A2 엔딩: 치료제 배포 ─────────────────────────────────────

  mq_pharma_end_a2: {
    id: 'mq_pharma_end_a2', title: '홍대 배포',
    desc: '홍대 약국으로 귀환하라. 처음 연구를 시작한 곳에서 치료제를 배포한다.',
    icon: '🏥', characterId: 'pharmacist', dayTrigger: 205,
    prerequisite: 'mq_pharma_a_15', requiresFlag: 'pharma_end_a2',
    objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'herbal_tea', qty: 3 }], flags: { mainQuestComplete_pharmacist: true, pharmacist_ending: 'a2_distribute' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '완벽한 백신은 아니지만, 지금 당장 사람들을 살릴 수 있는 치료제다. 가장 처음 이상 증상을 발견한 홍대로 돌아간다.',
      complete: 'D+250. 홍대 약국. 1월 14일 처음 관찰 노트를 썼던 카운터 앞. 치료제 25세트를 꺼냈다. 약장에서 항생제와 허브차도 발견했다. 이지수: "여기서 시작됐으니, 여기서 나눠줘야죠."',
    },
  },

  // ── A3 엔딩: 제조법 문서화 ───────────────────────────────────

  mq_pharma_end_a3: {
    id: 'mq_pharma_end_a3', title: '합성법 기증',
    desc: '서울대 연구소로 이동하라. 완성한 합성 공식을 연구자들에게 남긴다.',
    icon: '📖', characterId: 'pharmacist', dayTrigger: 205,
    prerequisite: 'mq_pharma_a_15', requiresFlag: 'pharma_end_a3',
    objective: { type: 'visit_district', districtId: 'gwanak', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'antidote', qty: 1 }], flags: { mainQuestComplete_pharmacist: true, pharmacist_ending: 'a3_document' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '혼자 완성하는 것보다 지식을 남기는 것이 낫다. 서울대 연구소에 합성 공식과 재료 목록을 남긴다. 다음 약사가 이어갈 것이다.',
      complete: 'D+250. 서울대 약학연구소. 실험대에 합성 노트를 올려놓았다. 연구실에서 항생제와 해독제도 발견했다. 다음 연구자를 위한 선물. 한소희: "약사는 처방을 나눠야 해요."',
    },
  },
};

export default PHARMACIST_BRANCH_A;
