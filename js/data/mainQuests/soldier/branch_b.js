// === MAIN QUESTS: 강민준 (soldier) — B경로: KBS 단독 방송 ===
// 분기 조건: soldier_branch_b 플래그
// Q11~Q15: 여의도 KBS 방송 임무
// Q15 분기점: 방송 이후 선택 → 2가지 엔딩 (Ascension: b1 전국망 / Escape: b3 수원 이동)

const SOLDIER_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_soldier_b_11: {
    id: 'mq_soldier_b_11', title: '전우의 인식표',
    desc: '나이프 2개를 수집하라. 전우들의 유품을 수습하는 의식이다.',
    icon: '🎖️', characterId: 'soldier', dayTrigger: 65,
    prerequisite: 'mq_soldier_10', requiresFlag: 'soldier_branch_b',
    objective: { type: 'collect_item', definitionId: 'knife', count: 2 },
    reward: { morale: 15, items: [{ definitionId: 'alcohol_swab', qty: 2 }, { definitionId: 'painkiller', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 120,
    narrative: {
      start: '광화문 복도에서 군번줄 3개를 더 발견했다. 박상현, 김태호, 이동훈. 유품을 찾아 수습해야 한다. 전우에 대한 예의다.',
      complete: '인식표 4개. 박상현, 김태호, 이동훈, 정재민. 살아서 전달하겠다고 약속했다. 의료품도 챙겼다. 혼자 가는 길, 부상에 대비해야 한다.',
    },
  },

  mq_soldier_b_12: {
    id: 'mq_soldier_b_12', title: '전진 거점',
    desc: '구조물 2개를 세워라. 여의도 이동 전 전진 기지가 필요하다.',
    icon: '🏕️', characterId: 'soldier', dayTrigger: 95,
    prerequisite: 'mq_soldier_b_11', requiresFlag: 'soldier_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'alarm_trap', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '여의도까지 직선 거리 3km. 중간 거점을 확보해야 한다. 진지 구축 표준 절차.',
      complete: '전진 기지 구축 완료. 경보 트랩도 설치했다. 혼자 자는 동안 접근을 알려줄 것이다. 여기서 하루 쉬고 여의도로 간다.',
    },
  },

  mq_soldier_b_13: {
    id: 'mq_soldier_b_13', title: '야간 이동 장비',
    desc: '손전등 2개를 확보하라. 야간 이동에 필수다.',
    icon: '🔦', characterId: 'soldier', dayTrigger: 125,
    prerequisite: 'mq_soldier_b_12', requiresFlag: 'soldier_branch_b',
    objective: { type: 'collect_item', definitionId: 'flashlight', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'sharpened_knife', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '야간은 감염자들의 활동이 줄어든다. 야간 이동이 더 안전하다. 손전등 2개. 하나는 주용, 하나는 예비.',
      complete: '장비 확보 완료. 야간 이동 중 고철로 날을 간 칼도 발견했다. 오늘 밤 여의도로 이동한다.',
    },
  },

  mq_soldier_b_14: {
    id: 'mq_soldier_b_14', title: '장거리 보급',
    desc: '식량 8개를 비축하라. 여의도 체류 기간을 위한 보급이다.',
    icon: '🥫', characterId: 'soldier', dayTrigger: 155,
    prerequisite: 'mq_soldier_b_13', requiresFlag: 'soldier_branch_b',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 8, items: [{ definitionId: 'military_ration', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: 'KBS 방송국 운영에는 장기 체류가 필요할 수 있다. 충분한 보급이 없으면 임무를 완수할 수 없다.',
      complete: '8일치 보급 완료. 군용 식량도 따로 챙겼다. 임무 수행 준비 완료.',
    },
  },

  mq_soldier_b_15: {
    id: 'mq_soldier_b_15', title: '약 2개월 생존',
    desc: '100일 이상 생존하라. 살아있는 것 자체가 임무다.',
    icon: '⏱️', characterId: 'soldier', dayTrigger: 95,
    prerequisite: 'mq_soldier_b_14', requiresFlag: 'soldier_branch_b',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 10, items: [{ definitionId: 'radio', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '전국 통신망 구축',
        desc: 'KBS를 거점으로 전국 생존자 통신망을 완성한다.',
        setsFlag: 'soldier_end_b1',
      },
      {
        label: '방송 후 수원 이동',
        desc: '마지막 방송을 마치고 수원으로 직접 이동한다.',
        setsFlag: 'soldier_end_b3',
      },
    ],
    narrative: {
      start: '160일. 광화문에서 팀원들이 쓰러진 날부터 160일. 혼자 살아남았다.',
      complete: '160일. 박상현이라면 뭐라고 했을까. "민준아, 그냥 살면 돼." KBS 방송이 나가고 있다. 무전기를 손에 쥐었다. 이제 결정할 시간이다.',
    },
  },

  // ── B1 엔딩: 전국 통신망 구축 ────────────────────────────────

  mq_soldier_end_b1: {
    id: 'mq_soldier_end_b1', title: '전국 통신망 완성',
    desc: '전자부품 5개를 수집하라. 전국 통신망의 마지막 증폭기를 완성한다.',
    icon: '🌐', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_b_15', requiresFlag: 'soldier_end_b1',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 5 },
    reward: { morale: 22, items: [{ definitionId: 'stimulant', qty: 2 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'b1_network' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '수원, 인천, 부산에서 신호가 잡혔다. 증폭기만 더 있으면 전국망이 완성된다.',
      complete: 'D+90. 전국 통신망 가동. 서울-수원-인천-부산. "여기는 KBS 서울. 전국 생존자 여러분, 응답해주십시오." 응답이 쏟아졌다. 박상현, 임무 완수다.',
    },
  },

  // ── B3 엔딩: 방송 후 수원 이동 ──────────────────────────────

  mq_soldier_end_b3: {
    id: 'mq_soldier_end_b3', title: '수원 이동',
    desc: '식량 8개를 확보하라. 마지막 방송을 마치고 수원으로 이동한다.',
    icon: '🚶', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_b_15', requiresFlag: 'soldier_end_b3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 15, items: [{ definitionId: 'battle_ration', qty: 3 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'b3_suwon' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '마지막 방송을 내보낸다. "서울에서 수원으로 이동합니다. 따라오는 분들을 기다리겠습니다." 이제 걷는다.',
      complete: 'D+90. 수원 외곽. 군용 전투 식량 세 팩. 뒤에서 발소리가 들렸다. 방송을 듣고 따라온 사람들이었다. 박상현, 나는 혼자가 아니야.',
    },
  },

};

export default SOLDIER_BRANCH_B;
