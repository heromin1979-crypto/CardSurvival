// === MAIN QUESTS: 한소희 (pharmacist) — B경로: 정대한 실험실 구축 ===
// 분기 조건: pharma_branch_b 플래그
// Q11~Q15: 정대한과 설비 구축 후 대량 합성
// Q15 분기점: 생산 방향 선택 → 3가지 엔딩

const PHARMACIST_BRANCH_B = {

  // ── B경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_pharma_b_11: {
    id: 'mq_pharma_b_11', title: '정대한 합류',
    desc: '성동구에 도달하라. 정대한이 실험실 설비를 구축하고 있다.',
    icon: '🏭', characterId: 'pharmacist', dayTrigger: 65,
    prerequisite: 'mq_pharma_10', requiresFlag: 'pharma_branch_b',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '정대한이 성수동 공장에서 실험실 설비를 만들고 있다고 했다. 합성 장비만 있으면 생산량이 달라진다.',
      complete: '성수동 공장. 정대한이 설비를 조립하고 있었다. "약사님이 오셨군요. 장비는 내가 만들 테니 합성법은 당신이 맡아요." 창고에서 전자부품도 발견했다.',
    },
  },

  mq_pharma_b_12: {
    id: 'mq_pharma_b_12', title: '실험실 설비 구축',
    desc: '전자부품 4개를 수집하라. 정대한이 설비를 조립하는 데 필요하다.',
    icon: '💡', characterId: 'pharmacist', dayTrigger: 95,
    prerequisite: 'mq_pharma_b_11', requiresFlag: 'pharma_branch_b',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'wire', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '원심분리기와 가열장치. 정대한이 폐전자제품에서 부품을 추출해 만들고 있다. 전자부품이 더 필요하다.',
      complete: '전자부품 확보. 수집 중 배선용 전선도 발견했다. 정대한: "이 정도면 가열 제어 장치를 완성할 수 있어요."',
    },
  },

  mq_pharma_b_13: {
    id: 'mq_pharma_b_13', title: '실험실 장비 완성',
    desc: '고철 5개를 수집하라. 정대한이 실험대 프레임을 만든다.',
    icon: '🔩', characterId: 'pharmacist', dayTrigger: 125,
    prerequisite: 'mq_pharma_b_12', requiresFlag: 'pharma_branch_b',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 5 },
    reward: { morale: 12, items: [{ definitionId: 'whetstone', qty: 1 }, { definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '실험대 프레임에 고철이 필요하다. 정대한의 금속 가공 기술로 단단한 실험대를 만들 수 있다.',
      complete: '실험대 완성. 공장 작업 도구함에서 숫돌과 여분 고철도 발견했다. 정대한: "진동 없이 합성할 수 있어요. 이제 본격적으로 해봅시다."',
    },
  },

  mq_pharma_b_14: {
    id: 'mq_pharma_b_14', title: '합성 물자 확보',
    desc: '의료 아이템 4개를 수집하라. 대량 합성에 기본 약품 재료가 필요하다.',
    icon: '⚗️', characterId: 'pharmacist', dayTrigger: 155,
    prerequisite: 'mq_pharma_b_13', requiresFlag: 'pharma_branch_b',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'stamina_tonic', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '설비가 갖춰졌다. 이제 원료가 필요하다. 설비가 좋아진 만큼 더 많이 만들 수 있다.',
      complete: '물자 확보. 한소희는 첫 번째 대량 합성을 시작했다. 강장제가 첫 결과물로 나왔다. 정대한: "장비가 맞게 작동하고 있어요."',
    },
  },

  mq_pharma_b_15: {
    id: 'mq_pharma_b_15', title: '생산 방향 분기점',
    desc: '180일 이상 생존하라. 합성 결과를 어떻게 활용할지 결정해야 한다.',
    icon: '⚖️', characterId: 'pharmacist', dayTrigger: 185,
    prerequisite: 'mq_pharma_b_14', requiresFlag: 'pharma_branch_b',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'antibiotics', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '대규모 생산라인 완성',
        desc: '정대한의 설비를 최대로 활용해 대량 생산라인을 완성한다.',
        setsFlag: 'pharma_end_b1',
      },
      {
        label: '소규모 배포 시작',
        desc: '큰 규모보다 확실한 소규모 배포를 선택한다.',
        setsFlag: 'pharma_end_b2',
      },
      {
        label: '제조법과 함께 탈출',
        desc: '서울 밖에서 다시 시작한다.',
        setsFlag: 'pharma_end_b3',
      },
    ],
    narrative: {
      start: '180일. 정대한과 한소희의 실험실에서 합성이 본격화됐다. 방향을 정해야 한다.',
      complete: '180일 합성 결과로 항생제 1세트가 완성됐다. 정대한: "소희씨, 이 설비로 어디까지 할 건가요?" 한소희는 합성 결과물을 바라봤다.',
    },
  },

  // ── B1 엔딩: 대규모 생산라인 완성 ────────────────────────────

  mq_pharma_end_b1: {
    id: 'mq_pharma_end_b1', title: '생산라인 완성',
    desc: '구조물 3개를 제작하라. 대규모 생산라인의 설비를 완성한다.',
    icon: '🏭', characterId: 'pharmacist', dayTrigger: 205,
    prerequisite: 'mq_pharma_b_15', requiresFlag: 'pharma_end_b1',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 20, items: [{ definitionId: 'antibiotics', qty: 2 }, { definitionId: 'stimulant', qty: 1 }], flags: { mainQuestComplete_pharmacist: true, pharmacist_ending: 'b1_production' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '정대한의 설비 + 한소희의 합성법. 대량 생산라인을 완성한다.',
      complete: 'D+100. 성수동 합성 공장. 하루 20세트 생산. 첫 완전 가동 배치에서 항생제 2세트와 각성제가 나왔다. 정대한: "엔지니어와 약사가 만나면 이렇게 됩니다." 한소희: "맞아요."',
    },
  },

  // ── B2 엔딩: 소규모 배포 시작 ────────────────────────────────

  mq_pharma_end_b2: {
    id: 'mq_pharma_end_b2', title: '소규모 배포',
    desc: '강남구를 방문하라. 확실한 소규모 배포를 시작한다.',
    icon: '📦', characterId: 'pharmacist', dayTrigger: 205,
    prerequisite: 'mq_pharma_b_15', requiresFlag: 'pharma_end_b2',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'herbal_tea', qty: 3 }], flags: { mainQuestComplete_pharmacist: true, pharmacist_ending: 'b2_small_dist' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '큰 규모보다 확실한 것이 낫다. 소규모로 직접 배포를 시작한다.',
      complete: 'D+100. 강남 배포 거점. 항생제와 허브차를 들고 직접 배포했다. 정대한: "작게 시작해도 괜찮아요. 지속할 수 있으면 됩니다." 한소희: "그게 맞아요."',
    },
  },

  // ── B3 엔딩: 제조법과 함께 탈출 ─────────────────────────────

  mq_pharma_end_b3: {
    id: 'mq_pharma_end_b3', title: '제조법과 탈출',
    desc: '식량 8개를 비축하라. 제조법을 들고 서울 밖으로 탈출한다.',
    icon: '🚶', characterId: 'pharmacist', dayTrigger: 205,
    prerequisite: 'mq_pharma_b_15', requiresFlag: 'pharma_end_b3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 15, items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'antidote', qty: 1 }], flags: { mainQuestComplete_pharmacist: true, pharmacist_ending: 'b3_escape' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '서울 밖에서 다시 시작한다. 정대한이 함께 가겠다고 했다. 제조법 노트와 식량을 챙긴다.',
      complete: 'D+100. 한소희와 정대한은 서울을 떠났다. 제조법 노트를 가방에 넣고. 항생제와 해독제도 마지막으로 챙겼다. 어디서든 다시 시작할 수 있다.',
    },
  },
};

export default PHARMACIST_BRANCH_B;
