// === MAIN QUESTS: 이지수 (doctor) — B경로: 강민준 군의관 합류 ===
// 분기 조건: doctor_branch_b 플래그
// Q11~Q15: 군 의료팀 활동
// Q15: 군 의료본부 설립 엔딩으로 직결 (Settle)

const DOCTOR_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_doctor_b_11: {
    id: 'mq_doctor_b_11', title: '용산 기지 합류',
    desc: '용산구에 도달하라. 강민준이 기다리고 있다.',
    icon: '🪖', characterId: 'doctor', dayTrigger: 65,
    prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_b',
    objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'bandage', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '강민준의 무전이 계속 잡혔다. "의사가 필요합니다. 부상자가 있습니다." 거부할 수 없었다.',
      complete: '용산 기지. 강민준이 부상자 7명을 돌보고 있었다. "와줬군요." 군 의무대 비상 물품에서 붕대를 꺼냈다. 간단한 말이지만, 신뢰가 담겨 있었다.',
    },
  },

  mq_doctor_b_12: {
    id: 'mq_doctor_b_12', title: '야전 의무실',
    desc: '붕대 6개를 확보하라. 부상자들의 치료가 급하다.',
    icon: '🩹', characterId: 'doctor', dayTrigger: 95,
    prerequisite: 'mq_doctor_b_11', requiresFlag: 'doctor_branch_b',
    objective: { type: 'collect_item', definitionId: 'bandage', count: 6 },
    reward: { morale: 12, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '군 의무대 물자가 이미 소진됐다. 이지수의 의료 지식과 강민준의 군 네트워크가 결합되어야 한다.',
      complete: '붕대를 조달했다. 수색 중 구급키트도 발견했다. 부상자 5명 처치 완료. 강민준: "역시 전문의가 다르군요."',
    },
  },

  mq_doctor_b_13: {
    id: 'mq_doctor_b_13', title: '군 보급로',
    desc: '구조물 2개를 제작하라. 기지를 의무실로 개조한다.',
    icon: '🏥', characterId: 'doctor', dayTrigger: 125,
    prerequisite: 'mq_doctor_b_12', requiresFlag: 'doctor_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'military_ration', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '강민준이 보급로를 열었다. 군 창고에서 의료 물자를 가져올 수 있게 됐다.',
      complete: '야전 의무실 완성. 군 보급로 개척 중 군용 식량도 챙겼다. 강민준: "이제 의사도 있고 시설도 있다. 사람들이 몰려올 것입니다."',
    },
  },

  mq_doctor_b_14: {
    id: 'mq_doctor_b_14', title: '합동 순찰',
    desc: '의료 아이템 5개를 수집하라. 부상자 이송을 위한 물자다.',
    icon: '🚑', characterId: 'doctor', dayTrigger: 155,
    prerequisite: 'mq_doctor_b_13', requiresFlag: 'doctor_branch_b',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'painkiller', qty: 2 }, { definitionId: 'alcohol_swab', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '강민준의 전술 지원 + 이지수의 의료 판단. 합동 순찰로 생존자를 찾아 치료한다.',
      complete: '순찰 중 생존자 11명 발견, 9명 치료 완료. 진통제와 소독 솜도 부상자 처치에 썼고, 여분을 챙겼다. 강민준: "이 조합이 맞는 것 같습니다."',
    },
  },

  mq_doctor_b_15: {
    id: 'mq_doctor_b_15', title: '군 상황 평가',
    desc: '100일 이상 생존하라. 군 상황이 변하고 있다.',
    icon: '⚖️', characterId: 'doctor', dayTrigger: 95,
    prerequisite: 'mq_doctor_b_14', requiresFlag: 'doctor_branch_b',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 8, items: [{ definitionId: 'stimulant', qty: 1 }], flags: { doctor_end_b1: true } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '180일이 지났다. 강민준과의 협력이 자리를 잡았다.',
      complete: '강민준이 각성제를 건넸다. "박사님, 결론은 분명합니다. 용산을 서울의 의료 사령부로 만들어야 해요."',
    },
  },

  // ── B1 엔딩: 군 의료본부 설립 ────────────────────────────────

  mq_doctor_end_b1: {
    id: 'mq_doctor_end_b1', title: '군 의료본부 완성',
    desc: '구조물 3개를 더 제작하라. 공식 의료본부 구조를 갖춘다.',
    icon: '🏛️', characterId: 'doctor', dayTrigger: 205,
    prerequisite: 'mq_doctor_b_15', requiresFlag: 'doctor_end_b1',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 22, items: [{ definitionId: 'surgery_kit', qty: 1 }], flags: { mainQuestComplete_doctor: true, doctor_ending: 'b1_military_hub' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '군 의료본부. 민간 전문의와 군 의무병이 함께하는 새로운 형태.',
      complete: 'D+100. 용산 군 의료본부 공식 출범. 하루 치료 환자 15명. 강민준이 수술 도구 세트를 지급했다. "이제 여기서 어떤 수술도 할 수 있어요." 이지수: "맞아요."',
    },
  },

};

export default DOCTOR_BRANCH_B;
