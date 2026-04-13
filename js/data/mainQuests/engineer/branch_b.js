// === MAIN QUESTS: 정대한 (engineer) — B경로: 박영철과 도시 재건 ===
// 분기 조건: eng_branch_b 플래그
// Q11~Q15: 박영철 소방관과 인프라 복구
// Q15 분기점: 재건 방향 선택 → 3가지 엔딩

const ENGINEER_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_eng_b_11: {
    id: 'mq_eng_b_11', title: '박영철 합류',
    desc: '은평구에 도달하라. 박영철 소방관이 있는 대피소 건설 현장이다.',
    icon: '🚒', characterId: 'engineer', dayTrigger: 65,
    prerequisite: 'mq_eng_10', requiresFlag: 'eng_branch_b',
    objective: { type: 'visit_district', districtId: 'eunpyeong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'scrap_metal', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '박영철 소방관이 은평구에서 대피소를 짓고 있다. 엔지니어가 없어서 구조 설계가 안 된다고 했다.',
      complete: '은평구 도착. 박영철이 반겼다. "엔지니어가 왔군요. 이제 제대로 만들 수 있겠습니다." 현장 주변에 고철이 쌓여있었다.',
    },
  },

  mq_eng_b_12: {
    id: 'mq_eng_b_12', title: '발전기 자재',
    desc: '고철 6개를 수집하라. 발전기를 설치하기 위한 자재다.',
    icon: '🔩', characterId: 'engineer', dayTrigger: 95,
    prerequisite: 'mq_eng_b_11', requiresFlag: 'eng_branch_b',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'wire', qty: 3 }, { definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '대피소에 전력이 없다. 발전기를 설치하면 조명과 냉장이 가능해진다. 자재가 필요하다.',
      complete: '자재 확보. 수집 중 배전 배선용 전선과 전자부품도 발견했다. 박영철: "발전기가 생기면 야간 활동이 가능해지고 물자 보존도 쉬워집니다."',
    },
  },

  mq_eng_b_13: {
    id: 'mq_eng_b_13', title: '발전기 설치',
    desc: '구조물 2개를 제작하라. 발전기 설치와 배전 시스템을 구축한다.',
    icon: '⚡', characterId: 'engineer', dayTrigger: 125,
    prerequisite: 'mq_eng_b_12', requiresFlag: 'eng_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 12, items: [{ definitionId: 'flashlight', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '발전기 설치와 배전 패널 설계. 엔지니어 정대한의 본업이다.',
      complete: '발전기 가동. 불이 켜졌다. 창고에서 손전등도 2개 발견했다. 발전기 전에는 이것이 유일한 빛이었을 것이다. 박영철: "이게 얼마 만에 보는 불빛인지." 사람들이 모여들었다.',
    },
  },

  mq_eng_b_14: {
    id: 'mq_eng_b_14', title: '수도 복구',
    desc: '전자부품 4개를 수집하라. 펌프 시스템 복구에 필요하다.',
    icon: '💧', characterId: 'engineer', dayTrigger: 155,
    prerequisite: 'mq_eng_b_13', requiresFlag: 'eng_branch_b',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '전력 다음은 수도다. 펌프 제어 시스템을 복구하면 건물 내 수돗물이 나온다.',
      complete: '수도 복구 완료. 펌프실에서 정수 필터도 발견했다. 물을 깨끗하게 마실 수 있다. 박영철: "이제 전기, 물이 됩니다. 사람들이 버틸 수 있어요."',
    },
  },

  mq_eng_b_15: {
    id: 'mq_eng_b_15', title: '재건 방향 결정',
    desc: '180일 이상 생존하라. 도시 재건의 방향을 결정해야 한다.',
    icon: '⚖️', characterId: 'engineer', dayTrigger: 185,
    prerequisite: 'mq_eng_b_14', requiresFlag: 'eng_branch_b',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'pipe_wrench', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '도시 인프라 복구 완성',
        desc: '전기, 수도, 통신을 복구해 서울을 다시 살아있는 도시로 만든다.',
        setsFlag: 'eng_end_b1',
      },
      {
        label: '발전기 거점 완성',
        desc: '대규모 복구보다 확실한 발전기 거점에 집중한다.',
        setsFlag: 'eng_end_b2',
      },
      {
        label: '재건 포기, 탈출',
        desc: '결국 도시를 고칠 수 없다는 것을 깨닫고 탈출을 선택한다.',
        setsFlag: 'eng_end_b3',
      },
    ],
    narrative: {
      start: '180일. 전기와 수도가 복구됐다. 박영철: "대한씨, 앞으로 어디까지 할 건가요?" 정대한은 지도를 봤다.',
      complete: '공구함에서 파이프렌치를 꺼냈다. 방향을 정해야 한다. 더 큰 도시 복구인가, 확실한 거점 완성인가, 아니면 탈출인가.',
    },
  },

  // ── B1 엔딩: 도시 인프라 복구 완성 ──────────────────────────

  mq_eng_end_b1: {
    id: 'mq_eng_end_b1', title: '도시 재건 완성',
    desc: '구조물 4개를 제작하라. 서울 인프라 복구의 핵심 시설을 완성한다.',
    icon: '🏙️', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b1',
    objective: { type: 'craft_item', category: 'structure', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'rope_ladder', qty: 1 }, { definitionId: 'alarm_trap', qty: 1 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'b1_rebuild' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '도시 인프라 복구. 전기, 수도, 통신. 세 가지가 돌아가면 서울이 다시 살아난다.',
      complete: 'D+100. 은평구 인프라 복구 완성. 인프라 확장용 로프 사다리와 경보 장치도 설치했다. 박영철: "불이 켜지고, 물이 나오고, 신호가 잡혀요." 정대한: "아버지가 만들려 했던 것과 다르지 않았어요."',
    },
  },

  // ── B2 엔딩: 발전기 거점 완성 ─────────────────────────────

  mq_eng_end_b2: {
    id: 'mq_eng_end_b2', title: '발전기 거점 완성',
    desc: '서대문구를 방문하라. 발전기 거점을 확장한다.',
    icon: '🔋', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b2',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'flashlight', qty: 3 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'b2_generator' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '대규모보다 확실한 발전기 거점. 서대문구로 확장한다.',
      complete: 'D+100. 서대문 발전기 거점 완성. 발전기 운영 인원에게 손전등 3개를 지급했다. 박영철: "이 거점이 서울 북쪽의 허브가 될 거예요." 정대한: "시작은 작았지만, 이게 더 확실했어요."',
    },
  },

  // ── B3 엔딩: 재건 포기, 최종 탈출 ───────────────────────────

  mq_eng_end_b3: {
    id: 'mq_eng_end_b3', title: '최종 탈출',
    desc: '식량 8개를 비축하라. 재건을 포기하고 탈출을 선택한다.',
    icon: '🚶', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_b_15', requiresFlag: 'eng_end_b3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 15, items: [{ definitionId: 'binoculars', qty: 1 }, { definitionId: 'compass', qty: 1 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'b3_late_escape' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '도시를 고칠 수 없다는 것을 깨달았다. 아버지의 설계도를 챙기고 탈출을 선택한다.',
      complete: 'D+100. 박영철이 쌍안경과 나침반을 건넸다. "길 찾는 데 쓰세요." 박영철: "가는 거예요?" 정대한: "네. 거기서도 뭔가를 만들 수 있을 거예요." 악수했다. 그리고 서울을 떠났다.',
    },
  },
};

export default ENGINEER_BRANCH_B;
