// === MAIN QUESTS: 박영철 (firefighter) — B경로: 정대한과 대형 대피소 ===
// 분기 조건: fire_branch_b 플래그
// Q11~Q15: 구로 공장 대피소 건설
// Q15 분기점: 정대한과 탈출 → 1가지 엔딩 (Escape)

const FIREFIGHTER_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_fire_b_11: {
    id: 'mq_fire_b_11', title: '정대한의 공장',
    desc: '성동구로 이동하라. 정대한 기계공의 성수동 공장이 있다.',
    icon: '🏭', characterId: 'firefighter', dayTrigger: 25,
    prerequisite: 'mq_fire_10', requiresFlag: 'fire_branch_b',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '불광동을 등지고 돌아섰다. 쌍안경 속 빨간 현관문이 점점 작아졌다. 정대한의 무전. "소방관이라면서요? 성수동에 제 공장이 있어요. 같이 대피소 만들 수 있어요." 가족은 나중에. 지금은 더 많은 사람. 스스로에게 그렇게 말했다.',
      complete: '성수동 공장. 정대한이 이미 작업을 시작하고 있었다. "왔군요. 소방관 손이 필요했어요." 공장 창고에서 손전등도 발견했다. 가족 생각이 떠오를 때마다 손을 더 빨리 움직였다.',
    },
  },

  mq_fire_b_12: {
    id: 'mq_fire_b_12', title: '대피소 자재',
    desc: '고철 6개를 수집하라. 대형 대피소의 뼈대가 될 자재다.',
    icon: '🔧', characterId: 'firefighter', dayTrigger: 25,
    prerequisite: 'mq_fire_b_11', requiresFlag: 'fire_branch_b',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'duct_tape', qty: 2 }, { definitionId: 'nail', qty: 5 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '정대한: "철근이 있으면 벽을 세울 수 있어요. 공단 주변에 고철이 많아요." 소방관의 눈에는 구조가 보인다.',
      complete: '고철을 확보했다. 공단에서 덕트 테이프와 못도 함께 발견했다. 정대한이 설계를 그렸다. "다 지으면 수십 명은 들일 수 있어요. 지금은 첫 구역부터." 영철은 도면을 보며 비상구 동선부터 점검했다.',
    },
  },

  mq_fire_b_13: {
    id: 'mq_fire_b_13', title: '대피소 골격',
    desc: '성동구에서 성수 대형 대피소 공정에 재료를 투입하고 가동하라. 설비 설치 → 운영 물자 투입.',
    icon: '🏗️', characterId: 'firefighter', dayTrigger: 25,
    prerequisite: 'mq_fire_b_12', requiresFlag: 'fire_branch_b',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_large', stageId: 'commissioned', districtId: 'seongdong', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'rope', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '정대한의 기계 지식 + 박영철의 구조 안전 감각. 두 사람이 함께하니 속도가 두 배가 됐다.',
      complete: '첫 구역 골격이 섰다. 작업 중 로프도 발견했다. 한 번에 수십 명은 아니다. 한 구역씩, 사람이 오는 만큼 늘려간다. 정대한: "소방관이 옆에 있으니 안전하게 잘 됩니다." 박영철: "기계공이 있으니 빠르게 됩니다."',
    },
  },

  mq_fire_b_14: {
    id: 'mq_fire_b_14', title: '발전기 설치',
    desc: '성동구에서 대피소 전력 가동 공정에 재료를 투입하고 가동하라. 설비 설치 → 운영 물자 투입.',
    icon: '⚡', characterId: 'firefighter', dayTrigger: 25,
    prerequisite: 'mq_fire_b_13', requiresFlag: 'fire_branch_b',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_power', stageId: 'commissioned', districtId: 'seongdong', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '정대한: "발전기만 있으면 조명도 되고 의료 장비도 쓸 수 있어요. 전자 부품이 필요해요." 빛이 있어야 사람이 모인다.',
      complete: '발전기 가동. 공장에 빛이 들어왔다. 부품 수집 중 여분 전자부품도 챙겼다. 정대한: "이제 진짜 대피소가 됐어요."',
    },
  },

  mq_fire_b_15: {
    id: 'mq_fire_b_15', title: '대피소를 맡기다',
    desc: '성동구에서 대피소 급수와 운영 인계 공정에 재료를 투입하고 가동하라. 설비 설치 → 조리한 식사 제공.',
    icon: '🤝', characterId: 'firefighter', dayTrigger: 25,
    prerequisite: 'mq_fire_b_14', requiresFlag: 'fire_branch_b',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_handover', stageId: 'commissioned', districtId: 'seongdong', count: 1 },
    // 선택지가 하나뿐인 분기점이었다. isBranchPoint는 "⚡ 선택의 갈림길 —
    // 이 선택은 이후 스토리를 결정합니다" 모달을 닫을 수 없게 띄우는데,
    // 버튼이 하나면 선택이 아니라 확인 절차가 된다. 다른 A-15/B-15처럼
    // reward.flags로 진행 플래그를 심는다.
    reward: {
      morale: 8,
      items: [{ definitionId: 'stamina_tonic', qty: 1 }],
      flags: { fire_end_b3: true },
    },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '100일. 정대한과 함께 공장이 대피소로 변했다. 이제 여기를 누구에게 넘길지 정할 때다.',
      complete: '정대한이 강장제를 건넸다. "박 소방관, 여기는 생존자들에게 맡기고, 우리는 더 안전한 곳으로 갑시다." 함께 떠날 길이 보인다.',
    },
  },

  // ── B3 엔딩: 정대한과 탈출 ────────────────────────────────────

  mq_fire_end_b3: {
    id: 'mq_fire_end_b3', title: '함께 탈출',
    desc: '성동구에서 탈출 전 보급 인계 공정에 재료를 투입하고 가동하라. 운영 물자 투입.',
    icon: '🚗', characterId: 'firefighter', dayTrigger: 25,
    prerequisite: 'mq_fire_b_15', requiresFlag: 'fire_end_b3',
    actionHint: '행동 메뉴의 프로젝트 또는 퀘스트 목표의 공정 보기에서 부족 재료를 확인하세요. 재료는 제작·분해·지역 탐사로 마련합니다. 설치물은 이 구역에 남습니다.',
    objective: { type: 'career_project', projectId: 'fire_departure', stageId: 'commissioned', districtId: 'seongdong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'battle_ration', qty: 3 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'b3_escape' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '대피소를 생존자들에게 맡긴다. 정대한: "더 안전한 곳을 찾아야죠. 같이 가요." 소방관과 기계공. 어디서든 살아남을 수 있다.',
      complete: 'D+100. 서울 외곽. 정대한이 전투 식량 3팩을 챙겼다. "가는 길에 먹읍시다." 영철은 마지막으로 북쪽을 봤다. 은평. 끝내 가보지 못한 빨간 현관문. "나중에, 길이 안전해지면, 꼭 가볼 겁니다." 정대한은 말없이 고개를 끄덕였다. 박영철: "이재훈도 살아남았으면 같이 갔을 텐데." 두 사람은 걸었다.',
    },
  },

};

export default FIREFIGHTER_BRANCH_B;
