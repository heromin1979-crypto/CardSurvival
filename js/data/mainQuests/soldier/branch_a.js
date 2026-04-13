// === MAIN QUESTS: 강민준 (soldier) — A경로: 박영철과 구조 작전 ===
// 분기 조건: soldier_branch_a 플래그
// Q11~Q15: 서대문 구조 작전
// Q15 분기점: 작전 결과 선택 → 3가지 엔딩

const SOLDIER_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_soldier_a_11: {
    id: 'mq_soldier_a_11', title: '박영철과 합류',
    desc: '서대문구로 이동하라. 박영철 소방관이 구조 작전을 준비 중이다.',
    icon: '🚒', characterId: 'soldier', dayTrigger: 65,
    prerequisite: 'mq_soldier_10', requiresFlag: 'soldier_branch_a',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '박영철의 무전. "강민준 하사, 서대문 쪽에 생존자가 갇혔습니다. 전술 지원이 필요합니다." 군인의 자리는 여기다.',
      complete: '서대문 소방서. 박영철 소방위가 구조 장비를 챙기고 있었다. "와줬군요. 군인이 옆에 있으니 든든합니다." 소방서 장비함에서 손전등도 받았다. 구조 작전이 시작됐다.',
    },
  },

  mq_soldier_a_12: {
    id: 'mq_soldier_a_12', title: '구조 의료 물자',
    desc: '붕대 6개를 수집하라. 구조 작전 중 부상자 치료가 필요하다.',
    icon: '🩹', characterId: 'soldier', dayTrigger: 95,
    prerequisite: 'mq_soldier_a_11', requiresFlag: 'soldier_branch_a',
    objective: { type: 'collect_item', definitionId: 'bandage', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '박영철: "구조된 사람 중에 부상자가 많아요. 붕대가 부족합니다." 전술 지원만큼 의료 물자도 중요하다.',
      complete: '붕대를 확보했다. 수색 중 구급키트도 발견했다. 박영철과 함께 부상자를 처치했다. "역시 군인 손이 다릅니다."',
    },
  },

  mq_soldier_a_13: {
    id: 'mq_soldier_a_13', title: '임시 대피소',
    desc: '구조물 2개를 제작하라. 구조 생존자를 위한 임시 대피소가 필요하다.',
    icon: '🏕️', characterId: 'soldier', dayTrigger: 125,
    prerequisite: 'mq_soldier_a_12', requiresFlag: 'soldier_branch_a',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'spike_trap', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '구조된 생존자들이 임시로 머물 곳이 없다. 방어선 구축은 군인의 전문 분야다.',
      complete: '임시 대피소 완성. 입구에 가시 트랩도 설치했다. 박영철: "구조대원과 군인의 조합이 이렇게 효율적일 줄 몰랐어요."',
    },
  },

  mq_soldier_a_14: {
    id: 'mq_soldier_a_14', title: '구조 생존자 보급',
    desc: '식량 8개를 수집하라. 구조된 생존자 50명에게 보급한다.',
    icon: '🥫', characterId: 'soldier', dayTrigger: 155,
    prerequisite: 'mq_soldier_a_13', requiresFlag: 'soldier_branch_a',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10, items: [{ definitionId: 'battle_ration', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '구조 생존자가 50명을 넘었다. 박영철: "밥이 없으면 살려도 죽어요." 보급이 전술이다.',
      complete: '식량 배급 완료. 군용 전투 식량도 따로 챙겼다. 박영철: "강민준 하사, 덕분에 50명이 살았어요." 그 말이 어떤 명령보다 무겁게 들렸다.',
    },
  },

  mq_soldier_a_15: {
    id: 'mq_soldier_a_15', title: '작전 분기점',
    desc: '180일 이상 생존하라. 구조 작전의 다음 단계를 결정한다.',
    icon: '⚖️', characterId: 'soldier', dayTrigger: 185,
    prerequisite: 'mq_soldier_a_14', requiresFlag: 'soldier_branch_a',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'stimulant', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '서울 전역 대규모 구조',
        desc: '박영철과 함께 서울 전역으로 작전을 확대한다.',
        setsFlag: 'soldier_end_a1',
      },
      {
        label: '은평 거점 방어 집중',
        desc: '확보한 구역을 철저히 지킨다.',
        setsFlag: 'soldier_end_a2',
      },
      {
        label: '박영철과 함께 탈출',
        desc: '서울을 벗어나 더 안전한 곳으로 이동한다.',
        setsFlag: 'soldier_end_a3',
      },
    ],
    narrative: {
      start: '180일. 박영철과 함께한 구조 작전이 성과를 냈다.',
      complete: '박영철: "강 하사, 이제 어쩌면 좋겠어요? 더 넓힐 수도 있고, 지킬 수도 있고, 아니면..." 각성제를 꺼내 마셨다. 세 가지 길이 보인다.',
    },
  },

  // ── A1 엔딩: 서울 전역 대규모 구조 ──────────────────────────

  mq_soldier_end_a1: {
    id: 'mq_soldier_end_a1', title: '서울 집결 완성',
    desc: '구조물 4개를 제작하라. 서울 전역 구조 작전의 기반을 완성한다.',
    icon: '🏙️', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_a_15', requiresFlag: 'soldier_end_a1',
    objective: { type: 'craft_item', category: 'structure', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'radio', qty: 1 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'a1_rescue' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '박영철과 전술을 짰다. 서울 구 단위 구조망. 소방관의 현장 경험 + 군인의 전술 체계.',
      complete: 'D+100. 서울 전역 구조망 완성. 서울 전역 통신을 위한 무전기가 지급됐다. 박영철: "우리가 해냈어요." 강민준: "같이 해냈습니다." 박상현, 들었냐.',
    },
  },

  // ── A2 엔딩: 은평 거점 방어 ───────────────────────────────────

  mq_soldier_end_a2: {
    id: 'mq_soldier_end_a2', title: '은평 거점 완성',
    desc: '영등포구를 방문하라. 외곽 위협을 확인하고 방어선을 완성한다.',
    icon: '🏰', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_a_15', requiresFlag: 'soldier_end_a2',
    objective: { type: 'visit_district', districtId: 'yeongdeungpo', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'gas_mask', qty: 1 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'a2_defend' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '영등포에서 위협이 오고 있다. 확인하고 방어선을 완성한다. 지키는 것도 전술이다.',
      complete: 'D+100. 은평-서대문 방어 거점 완성. 마지막 정찰에서 방독면을 확보했다. 박영철: "이 구역은 우리가 지킵니다." 강민준: "맞습니다." 진지가 완성됐다.',
    },
  },

  // ── A3 엔딩: 박영철과 탈출 ────────────────────────────────────

  mq_soldier_end_a3: {
    id: 'mq_soldier_end_a3', title: '공동 탈출',
    desc: '식량 5개를 확보하라. 박영철과 함께 서울을 벗어난다.',
    icon: '🚗', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_a_15', requiresFlag: 'soldier_end_a3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 15, items: [{ definitionId: 'pistol', qty: 1 }, { definitionId: 'pistol_ammo', qty: 5 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'a3_escape' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '박영철의 가족이 기다리고 있다. 함께 이동하는 것이 더 안전하다. 군인 한 명이 보호막이 된다.',
      complete: 'D+100. 서울 외곽. 기지 창고에서 권총과 탄약을 꺼냈다. 마지막 전투를 위해 아껴둔 것이다. 박영철의 가족과 합류했다. "강 하사, 고마워요." 강민준은 처음으로 웃었다.',
    },
  },

};

export default SOLDIER_BRANCH_A;
