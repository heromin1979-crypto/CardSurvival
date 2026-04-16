// === MAIN QUESTS: 이지수 (doctor) — A경로: 한소희 협력 ===
// 분기 조건: doctor_branch_a 플래그
// Q11~Q15: 서울대 공동 연구
// Q15 분기점: 연구 결과 선택 → 2가지 엔딩 (Ascension: a1 백신 / Escape: a3 데이터 배포)

const DOCTOR_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_doctor_a_11: {
    id: 'mq_doctor_a_11', title: '서울대 연구소',
    desc: '관악구에 도달하라. 한소희 약사가 있는 연구소다.',
    icon: '🔬', characterId: 'doctor', dayTrigger: 65,
    prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_a',
    objective: { type: 'visit_district', districtId: 'gwanak', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'herb', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '한소희가 서울대 약학연구소에 간다고 했다. 그곳의 장비와 두 사람의 지식이 만나면 가능성이 생긴다.',
      complete: '서울대 약학연구소. 한소희가 이미 실험을 시작하고 있었다. "당신 오길 기다렸어요. 세브란스 데이터가 필요했거든요." 연구실 선반에 약초 시료도 가득 있었다.',
    },
  },

  mq_doctor_a_12: {
    id: 'mq_doctor_a_12', title: '공동 연구 물자',
    desc: '연구에 필요한 의료 아이템 6개를 수집하라.',
    icon: '⚗️', characterId: 'doctor', dayTrigger: 95,
    prerequisite: 'mq_doctor_a_11', requiresFlag: 'doctor_branch_a',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '한소희의 합성 능력 + 이지수의 임상 데이터. 재료만 충분하다면 실질적인 치료제를 만들 수 있다.',
      complete: '물자를 확보했다. 한소희: "이 정도면 시작할 수 있어요." 수집 중 병원 소독약 재고도 따로 챙겼다.',
    },
  },

  mq_doctor_a_13: {
    id: 'mq_doctor_a_13', title: '1차 합성',
    desc: '의료 아이템을 2개 제작하라. 공동 연구의 첫 결과물이다.',
    icon: '💉', characterId: 'doctor', dayTrigger: 125,
    prerequisite: 'mq_doctor_a_12', requiresFlag: 'doctor_branch_a',
    objective: { type: 'craft_item', category: 'medical', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'antibiotics', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '한소희의 합성 기술은 예상보다 뛰어났다. 두 사람이 함께 작업하니 속도가 빨라졌다.',
      complete: '1차 제제 완성. 합성 과정에서 항생제도 만들어졌다. 한소희: "이 성분 비율이 핵심이에요. 세브란스 데이터가 맞았어요."',
    },
  },

  mq_doctor_a_14: {
    id: 'mq_doctor_a_14', title: '임상 시험',
    desc: '150일 이상 생존하라. 제제를 현장에서 검증한다.',
    icon: '📋', characterId: 'doctor', dayTrigger: 155,
    prerequisite: 'mq_doctor_a_13', requiresFlag: 'doctor_branch_a',
    objective: { type: 'survive_days', count: 150 },
    reward: { morale: 10, items: [{ definitionId: 'stamina_tonic', qty: 2 }] },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '이론은 완성됐다. 이제 실제 환자에게 적용해본다.',
      complete: '임상 결과: 치료 환자 22명 중 17명 회복. 회복률 77%. 환자들의 체력 회복을 돕기 위해 강장제도 제조했다. 한소희: "데이터가 쌓이고 있어요."',
    },
  },

  mq_doctor_a_15: {
    id: 'mq_doctor_a_15', title: '연구 분기점',
    desc: '약초 5개를 확보하라. 최종 합성의 재료가 된다.',
    icon: '🌿', characterId: 'doctor', dayTrigger: 185,
    prerequisite: 'mq_doctor_a_14', requiresFlag: 'doctor_branch_a',
    objective: { type: 'collect_item', definitionId: 'herb', count: 5 },
    reward: { morale: 8, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '백신 대량 생산 도전',
        desc: '모든 자원을 쏟아붓는다. 성공하면 서울을 구한다.',
        setsFlag: 'doctor_end_a1',
      },
      {
        label: '연구 데이터를 배포',
        desc: '완성하지 못해도 지식을 나눈다. 다음 사람이 완성할 것이다.',
        setsFlag: 'doctor_end_a3',
      },
    ],
    narrative: {
      start: '약초의 천연 성분이 마지막 핵심 재료다.',
      complete: '재료가 모였다. 연구실에서 구급키트도 발견했다. 한소희: "이제 결정해야 해요. 어느 방향으로 가실 건가요?"',
    },
  },

  // ── A1 엔딩: 백신 완성 ──────────────────────────────────────

  mq_doctor_end_a1: {
    id: 'mq_doctor_end_a1', title: '백신 연구 완성',
    desc: '의료 아이템 4개를 제작하라. 백신 대량 생산의 마지막 단계다.',
    icon: '💉', characterId: 'doctor', dayTrigger: 205,
    prerequisite: 'mq_doctor_a_15', requiresFlag: 'doctor_end_a1',
    objective: { type: 'craft_item', category: 'medical', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'antibiotics', qty: 2 }, { definitionId: 'surgery_kit', qty: 1 }], flags: { mainQuestComplete_doctor: true, doctor_ending: 'a1_vaccine' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '모든 것을 쏟아붓는다. 한소희와 이지수, 48시간 연속 작업.',
      complete: 'D+100. 백신 프로토타입 32세트 완성. 정밀 수술 도구 세트와 항생제도 연구실 비축분에서 나왔다. 한소희: "됐어요. 진짜 됐어요." 이제 서울에 나눠줄 일만 남았다.',
    },
  },

  // ── A3 엔딩: 데이터 배포 ─────────────────────────────────────

  mq_doctor_end_a3: {
    id: 'mq_doctor_end_a3', title: '연구 노트 완성',
    desc: '식량 8개를 비축하라. 연구 데이터를 들고 떠날 준비를 한다.',
    icon: '📖', characterId: 'doctor', dayTrigger: 205,
    prerequisite: 'mq_doctor_a_15', requiresFlag: 'doctor_end_a3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 15, items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'herbal_tea', qty: 3 }], flags: { mainQuestComplete_doctor: true, doctor_ending: 'a3_data' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '완성하지 못했다. 하지만 데이터는 가치가 있다. 다음 의사가 이 노트를 들고 계속할 것이다.',
      complete: 'D+100. 이지수는 연구 노트 세 권을 완성했다. 노트 옆에 항생제와 허브차도 챙겼다. 여정 중 치료를 위해. 한소희: "이게 더 중요한 것일 수도 있어요." 두 사람은 노트를 들고 걸었다.',
    },
  },
};

export default DOCTOR_BRANCH_A;
