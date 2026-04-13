// === MAIN QUESTS: 정대한 (engineer) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(아버지 설계도 탈출) vs B(박영철과 도시 재건)

const ENGINEER_SHARED = {

  mq_eng_01: {
    id: 'mq_eng_01', title: '기본 고철',
    desc: '용산 전자상가에서 고철 3개를 수집하라.',
    icon: '⚙️', characterId: 'engineer', dayTrigger: 1, prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'nail', qty: 5 }] },
    failPenalty: { morale: -5 }, deadlineDays: 10,
    narrative: {
      start: '정대한(35세). 성수동 금속 가공 공장 기술 이사. 세상이 무너진 날 용산 전자상가로 이동해 부품을 확보했다. 머릿속으로 계산했다. 고철 × 8. 로프 × 3. 이동수단을 만든다.',
      complete: '고철을 확보했다. 바닥에 흩어진 못도 한 움큼 챙겼다. 이동수단 재료 계획의 첫 번째 단계.',
    },
  },

  mq_eng_02: {
    id: 'mq_eng_02', title: '작업장 확보',
    desc: '구조물을 제작하라. 안전한 작업 공간이 필요하다.',
    icon: '🏗️', characterId: 'engineer', dayTrigger: 2, prerequisite: 'mq_eng_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 12,
    narrative: {
      start: '작업할 공간 없이는 아무것도 만들 수 없다. 바리케이드를 세워 작업장을 확보한다.',
      complete: '작업장 완성. 이제 조용히 작업할 수 있다.',
    },
  },

  mq_eng_03: {
    id: 'mq_eng_03', title: '전자부품 수거',
    desc: '전자 부품 3개를 수집하라. 발전기 수리에 필요하다.',
    icon: '💡', characterId: 'engineer', dayTrigger: 4, prerequisite: 'mq_eng_02',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'wire', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 14,
    narrative: {
      start: '전자상가 3층에 부품이 남아있다. 발전기를 고치려면 제어 회로 교체가 필요하다.',
      complete: '전자 부품 확보. 전선도 함께 챙겼다. 발전기 수리 준비 완료.',
    },
  },

  mq_eng_04: {
    id: 'mq_eng_04', title: '배선 재료',
    desc: '철사 3개를 수집하라. 전기 배선 작업의 기본 재료다.',
    icon: '🔌', characterId: 'engineer', dayTrigger: 6, prerequisite: 'mq_eng_03',
    objective: { type: 'collect_item', definitionId: 'wire', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'duct_tape', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 16,
    narrative: {
      start: '이동수단의 전기 계통에 철사 배선이 필수다. 전자상가 창고에서 구할 수 있다.',
      complete: '철사 확보. 절연 덕테이프도 챙겼다. 배선 작업 준비 완료.',
    },
  },

  mq_eng_05: {
    id: 'mq_eng_05', title: '밀봉재 확보',
    desc: '천 3개를 수집하라. 차체 방수 패킹과 진동 흡수재로 쓴다.',
    icon: '🧵', characterId: 'engineer', dayTrigger: 8, prerequisite: 'mq_eng_04',
    objective: { type: 'collect_item', definitionId: 'cloth', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'rubber', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 18,
    narrative: {
      start: '전기 모터 차량의 약점은 방수와 진동이다. 아버지의 설계에도 그 점이 명시돼 있었다. "패킹 소재를 아끼지 마라." 천을 구한다.',
      complete: '천 확보. 방수용 고무 패킹도 함께 발견했다. 전기 계통 방수 완성.',
    },
  },

  mq_eng_06: {
    id: 'mq_eng_06', title: '목재 프레임',
    desc: '목재 5개를 수집하라. 차체 보조 프레임에 사용한다.',
    icon: '🪵', characterId: 'engineer', dayTrigger: 10, prerequisite: 'mq_eng_05',
    objective: { type: 'collect_item', definitionId: 'wood', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'hand_axe', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 20,
    narrative: {
      start: '경량화를 위해 금속 프레임 일부를 목재로 대체한다. 무게 대 강도 계산. 최적 비율 70:30.',
      complete: '목재 확보. 목재 가공에 필요한 손도끼도 발견했다. 경량화 설계 가능.',
    },
  },

  mq_eng_07: {
    id: 'mq_eng_07', title: '아버지의 메모',
    desc: '로프 2개를 수집하라. 성수 공장으로 가기 전 기초 재료를 준비한다.',
    icon: '📐', characterId: 'engineer', dayTrigger: 13, prerequisite: 'mq_eng_06',
    objective: { type: 'collect_item', definitionId: 'rope', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'compass', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 23,
    narrative: {
      start: '발전기를 수리하다가 아버지의 메모를 발견했다. 작은 노트. "대한아, 성수 공장 서랍 안에 설계도가 있다. 아버지가 20년 전에 그린 것." 가야 한다.',
      complete: '로프 확보. 성수 공장 이동을 위한 나침반도 챙겼다. 갈 준비가 됐다.',
    },
  },

  mq_eng_08: {
    id: 'mq_eng_08', title: '발전기 부품 수집',
    desc: '전자 부품 3개를 수집하라. 발전기 제어 회로 교체에 필요하다.',
    icon: '🔋', characterId: 'engineer', dayTrigger: 15, prerequisite: 'mq_eng_07',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 3 },
    reward: { morale: 8, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 30,
    narrative: {
      start: '성수 공장 발전기를 완전히 수리하면 전력을 쓸 수 있다. 전동 공구가 없으면 이동수단 제작이 느려진다.',
      complete: '발전기 수리 완료. 이제 전력이 들어온다. 어두운 공장에서 쓸 손전등도 챙겼다.',
    },
  },

  mq_eng_09: {
    id: 'mq_eng_09', title: '성수동 공장 첫 방문',
    desc: '성동구에 도달하라. 아버지가 일하던 공장이 거기 있다.',
    icon: '🏭', characterId: 'engineer', dayTrigger: 18, prerequisite: 'mq_eng_08',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'whetstone', qty: 1 }, { definitionId: 'scrap_metal', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 38,
    narrative: {
      start: '아버지의 메모에 적힌 주소. 성수동 금속 가공 공장. 아버지가 20년간 일하던 곳. 거기 서랍에 설계도가 있다고 했다. 가야 한다.',
      complete: '성수동 공장. 문을 열었다. 아버지 냄새가 났다. 기름과 쇠 냄새. 서랍을 열었다. 설계도가 있었다. 공장 창고에서 숫돌과 고철도 발견했다. 두 가지 길이 보인다.',
    },
  },

  mq_eng_10: {
    id: 'mq_eng_10', title: '성수동 복귀',
    desc: '고철 3개를 수집하라. 성수 공장으로 가기 위한 마지막 준비다.',
    icon: '🏭', characterId: 'engineer', dayTrigger: 21, prerequisite: 'mq_eng_09',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 3 },
    reward: { morale: 8, items: [{ definitionId: 'pipe_wrench', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 42,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '아버지 설계도로 탈출',
        desc: '탈출 차량을 완성해 서울을 빠져나간다. 아버지의 마지막 선물을 완성한다.',
        setsFlag: 'eng_branch_a',
      },
      {
        label: '박영철과 도시 재건',
        desc: '나가는 것보다 남아서 고치는 것이 맞을 수도 있다. 소방관과 함께 인프라를 복구한다.',
        setsFlag: 'eng_branch_b',
        recruitNpc: 'npc_yeongcheol',
      },
    ],
    narrative: {
      start: '고철이 더 필요하다. 어떤 길을 가든 재료는 필요하다.',
      complete: '고철을 확보했다. 공장 작업대에서 파이프렌치도 찾았다. 성수 공장이 눈앞이다. 선택해야 한다. 아버지의 설계도로 탈출할 것인가, 박영철과 함께 이 도시를 고칠 것인가.',
    },
  },
};

export default ENGINEER_SHARED;
