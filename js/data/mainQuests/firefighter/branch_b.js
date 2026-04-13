// === MAIN QUESTS: 박영철 (firefighter) — B경로: 정대한과 대형 대피소 ===
// 분기 조건: fire_branch_b 플래그
// Q11~Q15: 구로 공장 대피소 건설
// Q15 분기점: 대피소 완성 방향 선택 → 3가지 엔딩

const FIREFIGHTER_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_fire_b_11: {
    id: 'mq_fire_b_11', title: '정대한의 공장',
    desc: '성동구로 이동하라. 정대한 기계공의 성수동 공장이 있다.',
    icon: '🏭', characterId: 'firefighter', dayTrigger: 65,
    prerequisite: 'mq_fire_10', requiresFlag: 'fire_branch_b',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '정대한의 무전. "소방관이라면서요? 저한테 성수동에 공장이 있어요. 같이 대피소 만들 수 있어요." 더 많은 사람을 살리려면 혼자로는 안 된다.',
      complete: '성수동 공장. 정대한이 이미 작업을 시작하고 있었다. "왔군요. 소방관 손이 필요했어요." 공장 창고에서 손전등도 발견했다.',
    },
  },

  mq_fire_b_12: {
    id: 'mq_fire_b_12', title: '대피소 자재',
    desc: '고철 6개를 수집하라. 대형 대피소의 뼈대가 될 자재다.',
    icon: '🔧', characterId: 'firefighter', dayTrigger: 95,
    prerequisite: 'mq_fire_b_11', requiresFlag: 'fire_branch_b',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'duct_tape', qty: 2 }, { definitionId: 'nail', qty: 5 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '정대한: "철근이 있으면 벽을 세울 수 있어요. 공단 주변에 고철이 많아요." 소방관의 눈에는 구조가 보인다.',
      complete: '고철을 확보했다. 공단에서 덕트 테이프와 못도 함께 발견했다. 정대한이 설계를 그렸다. "이 정도면 50명은 거뜬해요."',
    },
  },

  mq_fire_b_13: {
    id: 'mq_fire_b_13', title: '대피소 골격',
    desc: '구조물 3개를 제작하라. 대형 대피소의 기본 골격을 완성한다.',
    icon: '🏗️', characterId: 'firefighter', dayTrigger: 125,
    prerequisite: 'mq_fire_b_12', requiresFlag: 'fire_branch_b',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'rope', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '정대한의 기계 지식 + 박영철의 구조 안전 감각. 두 사람이 함께하니 속도가 두 배가 됐다.',
      complete: '골격 완성. 작업 중 로프도 발견했다. 정대한: "소방관이 옆에 있으니까 안전하게 잘 됩니다." 박영철: "기계공이 있으니까 빠르게 됩니다."',
    },
  },

  mq_fire_b_14: {
    id: 'mq_fire_b_14', title: '발전기 설치',
    desc: '전자부품 3개를 수집하라. 대피소에 전력을 공급할 발전기가 필요하다.',
    icon: '⚡', characterId: 'firefighter', dayTrigger: 155,
    prerequisite: 'mq_fire_b_13', requiresFlag: 'fire_branch_b',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '정대한: "발전기만 있으면 조명도 되고 의료 장비도 쓸 수 있어요. 전자 부품이 필요해요." 빛이 있어야 사람이 모인다.',
      complete: '발전기 가동. 공장에 빛이 들어왔다. 부품 수집 중 여분 전자부품도 챙겼다. 정대한: "이제 진짜 대피소가 됐어요."',
    },
  },

  mq_fire_b_15: {
    id: 'mq_fire_b_15', title: '대피소 방향 결정',
    desc: '180일 이상 생존하라. 대형 대피소의 운영 방향을 결정한다.',
    icon: '⚖️', characterId: 'firefighter', dayTrigger: 185,
    prerequisite: 'mq_fire_b_14', requiresFlag: 'fire_branch_b',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'stamina_tonic', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '대형 대피소 완성',
        desc: '구로 공장을 서울 최대 대피소로 완성한다.',
        setsFlag: 'fire_end_b1',
      },
      {
        label: '소규모 방어 거점',
        desc: '규모보다 방어력을 높인다. 작지만 철저한 거점.',
        setsFlag: 'fire_end_b2',
      },
      {
        label: '정대한과 탈출',
        desc: '대피소를 생존자들에게 맡기고 함께 더 안전한 곳으로.',
        setsFlag: 'fire_end_b3',
      },
    ],
    narrative: {
      start: '180일. 정대한과 함께 공장이 대피소로 변했다.',
      complete: '정대한이 강장제를 건넸다. "박 소방관, 이제 어떻게 할 건가요? 더 크게 키울 수도 있고, 지킬 수도 있고, 아니면..." 세 가지 길이 보인다.',
    },
  },

  // ── B1 엔딩: 대형 대피소 완성 ────────────────────────────────

  mq_fire_end_b1: {
    id: 'mq_fire_end_b1', title: '대형 대피소 완성',
    desc: '구조물 4개를 제작하라. 구로 공장을 서울 최대 대피소로 완성한다.',
    icon: '🏛️', characterId: 'firefighter', dayTrigger: 205,
    prerequisite: 'mq_fire_b_15', requiresFlag: 'fire_end_b1',
    objective: { type: 'craft_item', category: 'structure', count: 4 },
    reward: { morale: 22, items: [{ definitionId: 'first_aid_kit', qty: 2 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'b1_megashelter' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '구로 공장 대피소 최종 단계. 소방관의 안전 기준 + 기계공의 설계 능력.',
      complete: 'D+100. 구로 대형 대피소 공식 완성. 수용 인원 80명. 의무실에 구급키트 2개도 확보했다. 정대한: "이재훈 소방관이 알았으면 기뻐했을 거예요." 박영철의 눈이 붉어졌다.',
    },
  },

  // ── B2 엔딩: 소규모 방어 거점 ────────────────────────────────

  mq_fire_end_b2: {
    id: 'mq_fire_end_b2', title: '방어 거점 완성',
    desc: '영등포구를 방문하라. 외곽 위협을 확인하고 방어 체계를 완성한다.',
    icon: '🏰', characterId: 'firefighter', dayTrigger: 205,
    prerequisite: 'mq_fire_b_15', requiresFlag: 'fire_end_b2',
    objective: { type: 'visit_district', districtId: 'yeongdeungpo', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'spike_trap', qty: 1 }, { definitionId: 'alarm_trap', qty: 1 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'b2_fortress' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '영등포에서 위협이 온다. 확인하고 방어선을 짠다. 소방관의 눈으로 보면 위험 구역이 보인다.',
      complete: 'D+100. 구로-영등포 방어선 완성. 정찰 중 가시 트랩과 경보 장치도 설치했다. 소규모지만 철저하다. 정대한: "기계공과 소방관이 만들면 이래야죠."',
    },
  },

  // ── B3 엔딩: 정대한과 탈출 ────────────────────────────────────

  mq_fire_end_b3: {
    id: 'mq_fire_end_b3', title: '함께 탈출',
    desc: '식량 10개를 확보하라. 정대한과 함께 서울을 벗어난다.',
    icon: '🚗', characterId: 'firefighter', dayTrigger: 205,
    prerequisite: 'mq_fire_b_15', requiresFlag: 'fire_end_b3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 10 },
    reward: { morale: 15, items: [{ definitionId: 'battle_ration', qty: 3 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'b3_escape' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '대피소를 생존자들에게 맡긴다. 정대한: "더 안전한 곳을 찾아야죠. 같이 가요." 소방관과 기계공. 어디서든 살아남을 수 있다.',
      complete: 'D+100. 서울 외곽. 정대한이 전투 식량 3팩을 챙겼다. "가는 길에 먹읍시다." 정대한: "살아남았네요." 박영철: "이재훈도 살아남았으면 같이 갔을 텐데." 두 사람은 걸었다.',
    },
  },

};

export default FIREFIGHTER_BRANCH_B;
