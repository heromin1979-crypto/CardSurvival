// === MAIN QUESTS: 강민준 (soldier) — B경로: KBS 단독 방송 ===
// 분기 조건: soldier_branch_b 플래그
// Q11~Q15: 여의도 KBS 방송 임무
// Q15 분기점: 방송 이후 선택 → 2가지 엔딩 (Ascension: b1 전국망 / Escape: b3 수원 이동)

const SOLDIER_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_soldier_b_11: {
    id: 'mq_soldier_b_11', title: '전우의 칼',
    desc: '나이프 2개를 수습하라. 쓰러진 전우들이 쥐고 있던 무기다.',
    icon: '🎖️', characterId: 'soldier', dayTrigger: 65,
    prerequisite: 'mq_soldier_10', requiresFlag: 'soldier_branch_b',
    objective: { type: 'collect_item', definitionId: 'knife', count: 2 },
    reward: { morale: 15, items: [{ definitionId: 'alcohol_swab', qty: 2 }, { definitionId: 'painkiller', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 120,
    narrative: {
      start: '목에 건 군번줄 네 개. 박상현, 김태호, 이동훈, 정재민. 시신은 두고 왔다. 대신 그들이 쥐고 있던 칼은 거둘 수 있다. 무기를 거두면 시신을 거둘 수 없다. 둘 다는 안 된다.',
      complete: '전우의 칼 두 자루. 내 것과 함께 챙겼다. 군번줄은 목에 그대로 둔다. 살아서 전달한다는 약속은 칼을 드는 것으로 대신한다. 혼자 가는 길, 손에 쥔 것이 늘었다.',
    },
  },

  mq_soldier_b_12: {
    id: 'mq_soldier_b_12', title: '전진 거점',
    desc: '구조물 2개를 세워라. 여의도 이동 전 전진 기지가 필요하다.',
    icon: '🏕️', characterId: 'soldier', dayTrigger: 95,
    prerequisite: 'mq_soldier_b_11', requiresFlag: 'soldier_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'spike_trap', qty: 1 }] },
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
    icon: '⏱️', characterId: 'soldier', dayTrigger: 175,
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
        label: '63빌딩 구조 유도',
        desc: '옥상 헬리패드를 확보하고 유도등을 밝혀 구조기를 불러들인다.',
        setsFlag: 'soldier_end_b2',
      },
      {
        label: '방송 후 수원 이동',
        desc: '마지막 방송을 마치고 수원으로 직접 이동한다.',
        setsFlag: 'soldier_end_b3',
      },
    ],
    narrative: {
      start: '100일. 광화문에서 팀원들이 쓰러진 날부터 100일. 혼자 살아남았다.',
      complete: '100일. 박상현이라면 뭐라고 했을까. "민준아, 그냥 살면 돼." KBS 방송이 나가고 있다. 무전기를 손에 쥐었다. 이제 결정할 시간이다.',
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

  // ── B2 엔딩: 63빌딩 구조 유도 ────────────────────────────────
  // 강민준은 정대한처럼 기체를 만들지도, 조종하지도 않는다. 그의 무기는 방송이다.
  // 좌표를 송출하고 착륙장을 밝혀 구조기를 불러들인다.

  mq_soldier_end_b2_1: {
    id: 'mq_soldier_end_b2_1', title: '착륙장 확보',
    desc: '63빌딩 옥상 헬리패드를 찾아내라. 고층 진입에 로프사다리가 필요하다.',
    icon: '🛬', characterId: 'soldier', dayTrigger: 185,
    prerequisite: 'mq_soldier_b_15', requiresFlag: 'soldier_end_b2',
    objective: { type: 'collect_item', definitionId: 'military_radio_kit', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'rope', qty: 3 }] },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '좌표를 읽는 것만으로는 부족하다. 구조기가 온다 해도 내려앉을 자리가 있어야 한다. 여의도에서 헬기가 앉을 수 있는 곳은 하나뿐 — 63빌딩 옥상. 로프사다리를 챙겼다.',
      complete: '옥상. 바람이 세다. 포장은 갈라졌지만 H 도색은 아직 읽힌다. 관제 캐비닛에서 군용 통신 키트가 나왔다. 1월 16일 이후 아무도 손대지 않은 채였다. 주파수를 맞췄다.',
    },
  },

  mq_soldier_end_b2: {
    id: 'mq_soldier_end_b2', title: '유도 착륙',
    desc: '유도등을 밝히고 좌표를 송출하라. 배터리 4개로 착륙 유도등을 세운다.',
    icon: '🚁', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_end_b2_1', requiresFlag: 'soldier_end_b2',
    objective: { type: 'collect_item', definitionId: 'battery', count: 4 },
    reward: { morale: 25, items: [{ definitionId: 'stimulant', qty: 1 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'b2_helicopter' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '착륙장은 확보했다. 이제 밤에도 보이게 만들어야 한다. 옥상 네 모서리에 유도등. 배터리 넷. KBS에서는 같은 문장을 반복 송출한다. "여의도 63빌딩 옥상. 유도등 점등. 착륙 가능."',
      complete: '사흘째 새벽, 프로펠러 소리가 강 건너에서 들려왔다. 유도등 네 개가 어둠 속에서 사각형을 그렸다. 기체가 고도를 낮춘다. 문이 열리고 누군가 손을 내밀었다. "강민준 하사님? 방송 들었습니다." 마이크를 마지막으로 껐다.',
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
      start: '마지막 방송을 내보냈다. "서울에서 수원으로 이동합니다. 따라오는 분들을 기다리겠습니다." 마이크를 끄자 KBS는 정적이 됐다. 이제 걷는 일만 남았다. 수원까지 사흘. 사흘치 식량이 없으면 도착 전에 무너진다. 따라오겠다던 사람들이 길 위에서 굶으면, 방송은 그들을 죽인 셈이 된다. 보급이 곧 약속이다.',
      complete: 'D+90. 수원 외곽. 군용 전투 식량 세 팩. 뒤에서 발소리가 들렸다. 한 명이 아니었다. 방송을 듣고 길에서 합류한 사람들이었다. 식량을 나눴다. 박상현, 나는 혼자가 아니야.',
    },
  },

};

export default SOLDIER_BRANCH_B;
