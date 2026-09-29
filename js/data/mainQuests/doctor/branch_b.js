// === MAIN QUESTS: 이지수 (doctor) — B경로: 강민준 군의관 합류 ===
// 분기 조건: doctor_branch_b 플래그
// Q11~Q15: 군 의료팀 활동
// Q15: 군 의료본부 설립 엔딩으로 직결 (Settle)

const DOCTOR_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_doctor_b_11: {
    id: 'mq_doctor_b_11', title: '용산 기지 합류',
    desc: '용산구에 도달하라. 강민준이 기다리고 있다.',
    icon: '🪖', characterId: 'doctor', dayTrigger: 25,
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
    id: 'mq_doctor_b_12', title: '야전 의무실 — 부상자 치료',
    desc: '부상 생존자 3명을 처치하여 완치시켜라.',
    icon: '🩺', characterId: 'doctor', dayTrigger: 25,
    prerequisite: 'mq_doctor_b_11', requiresFlag: 'doctor_branch_b',
    objective: { type: 'treat_npc', count: 3 },
    reward: { morale: 12, items: [{ definitionId: 'first_aid_kit', qty: 1 }, { definitionId: 'bandage', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '강민준이 진료 기록을 펼쳤다. "어디서 온 사람이든 부상자를 살리는 게 먼저입니다." 환자에게 필요한 물품을 확인하고 처치하라.',
      complete: '세 명의 완치 기록을 보고했다. 강민준: "군의관 혼자였다면 한 명도 못 살렸을 겁니다. 역시 민간 전문의입니다." 군 의무대가 진짜 의료팀으로 재편된다.',
    },
  },

  mq_doctor_b_13: {
    id: 'mq_doctor_b_13', title: '군 의무실 구축',
    desc: '용산구에서 용산 군 의무실 공정에 재료를 투입하고 가동하라. 설비 설치 → 운영 물자 투입.',
    icon: '🏥', characterId: 'doctor', dayTrigger: 25,
    prerequisite: 'mq_doctor_b_12', requiresFlag: 'doctor_branch_b',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'doctor_military', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'military_ration', qty: 2 }, { definitionId: 'antiseptic', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '강민준이 보급로를 열었다. 이지수는 청사진을 펼쳤다 — 의료 스테이션과 격리 병동. 군 기지가 제대로 된 의무실로 탈바꿈한다. (권장: medical_station / medical_ward)',
      complete: '의무 거점 제작을 마쳤다. 강민준: "진료 설비를 마련했군요. 이제 설치와 운영을 준비합시다."',
    },
  },

  mq_doctor_b_14: {
    id: 'mq_doctor_b_14', title: '야전 조제',
    desc: '용산구에서 군 야전 처치 운영 공정에 재료를 투입하고 가동하라. 운영 물자 투입.',
    icon: '⚗️', characterId: 'doctor', dayTrigger: 25,
    prerequisite: 'mq_doctor_b_13', requiresFlag: 'doctor_branch_b',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'doctor_field_care', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'painkiller', qty: 2 }, { definitionId: 'alcohol_swab', qty: 2 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '강민준의 전술 지원 + 이지수의 의료 판단. 군이 가져온 원료로 이지수가 직접 약품을 조제해야 한다. 수집이 아닌 제작 — 의사의 정체성이다.',
      complete: '야전 의무실 조제대에서 마취제 두 묶음을 완성했다. 부상자 이송 물자가 보충됐다. 강민준: "민간 전문의의 손이 다르군요. 이 조합이 맞는 것 같습니다."',
    },
  },

  mq_doctor_b_15: {
    id: 'mq_doctor_b_15', title: '군 상황 평가',
    desc: '용산구에서 군 의무실 운영 검증 공정에 재료를 투입하고 가동하라. 운영 물자 투입.',
    icon: '⚖️', characterId: 'doctor', dayTrigger: 25,
    prerequisite: 'mq_doctor_b_14', requiresFlag: 'doctor_branch_b',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'doctor_military_handover', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'stimulant', qty: 1 }], flags: { doctor_end_b1: true } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '180일이 지났다. 강민준과의 협력이 자리를 잡았다. 한 달만 더 지켜보자 — 병상 회전율, 보급선 안정성, 외곽 감염 압력. 이 세 지표가 맞아떨어지면 군 의료본부 설립을 공식화할 수 있다.',
      complete: '한 달간의 운영 데이터가 완성됐다. 강민준이 각성제를 건넸다. "박사님, 결론은 분명합니다. 용산을 서울의 의료 사령부로 만들어야 해요."',
    },
  },

  // ── B1 엔딩: 군 의료본부 설립 ────────────────────────────────

  mq_doctor_end_b1: {
    id: 'mq_doctor_end_b1', title: '군 의료본부 완성',
    desc: '용산구에서 군 의료본부 수술실 공정에 재료를 투입하고 가동하라. 설비 설치 → 운영 물자 투입.',
    icon: '🏛️', characterId: 'doctor', dayTrigger: 25,
    prerequisite: 'mq_doctor_b_15', requiresFlag: 'doctor_end_b1',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'doctor_surgery', stageId: 'commissioned', districtId: 'yongsan', count: 1 },
    reward: { morale: 22, items: [{ definitionId: 'surgery_kit', qty: 1 }, { definitionId: 'iv_saline', qty: 2 }], flags: { mainQuestComplete_doctor: true, doctor_ending: 'b1_military_hub' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '군 의료본부. 민간 전문의와 군 의무병이 함께하는 새로운 형태. 야전병원과 수술대, 약품 보관장 — 이 세 가지가 있어야 중환자실 수준의 진료가 가능하다.',
      complete: 'D+100. 용산 군 의료본부 공식 출범. 야전병원 3개 구조물이 가동된다. 하루 치료 환자 15명. 강민준이 수술 도구 세트와 수액을 지급했다. "이제 여기서 어떤 수술도 할 수 있어요." 이지수: "맞아요."',
    },
  },

};

export default DOCTOR_BRANCH_B;
