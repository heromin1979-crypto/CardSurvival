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

  // ── 선택적 중반 퀘스트 (분기 선택 후 Q11 이전 또는 병렬 진행) ─────
  // prerequisite: mq_eng_10 완료 후 언제든 받을 수 있는 서브 미션

  mq_eng_side_01: {
    id: 'mq_eng_side_01', title: '장비 개조 도전',
    desc: '무기 한 자루와 고철 3개로 개조 작업을 시도하라. 무기 제작 1개 완료.',
    icon: '🔧', characterId: 'engineer', dayTrigger: 25, prerequisite: 'mq_eng_10',
    objective: { type: 'craft_item', category: 'weapon', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'whetstone', qty: 1 }, { definitionId: 'duct_tape', qty: 3 }] },
    failPenalty: { morale: -3 }, deadlineDays: 60,
    narrative: {
      start: '폐자재가 쌓였다. 단순히 고철로 두기엔 아깝다. 기존 무기를 업그레이드하거나 새 무기로 가공할 수 있다.',
      complete: '개조 완료. 기계공의 감각이 되살아난다. 성수 공장 시절엔 매일 하던 일.',
    },
  },

  mq_eng_side_02: {
    id: 'mq_eng_side_02', title: '전자상가 위험 탐사',
    desc: '용산 전자상가 깊숙한 곳을 탐사하라. 전자부품 5개 + 와이어 3개.',
    icon: '🔦', characterId: 'engineer', dayTrigger: 30, prerequisite: 'mq_eng_10',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'wire', qty: 3 }, { definitionId: 'battery', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 70,
    narrative: {
      start: '용산 전자상가 3~5층은 아직 손이 닿지 않았다. 감염자가 많지만 희귀 부품이 잠들어 있을 것이다.',
      complete: '전자상가 상층 탐사 완료. 희귀 반도체와 고압 배터리를 확보했다. 이건 일반 부품 수십 개 값어치.',
    },
  },

  mq_eng_side_03: {
    id: 'mq_eng_side_03', title: '폐공장 탐험',
    desc: '성수동 외곽 폐공장을 탐사하라. 성동구 방문 + 도구 2개 제작.',
    icon: '🏭', characterId: 'engineer', dayTrigger: 35, prerequisite: 'mq_eng_10',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'refined_metal', qty: 3 }, { definitionId: 'spring', qty: 4 }] },
    failPenalty: { morale: -3 }, deadlineDays: 75,
    narrative: {
      start: '아버지 공장 옆 폐공장. 예전에 같이 작업하던 곳. 희귀 부품이 남아 있을 것이다.',
      complete: '폐공장 창고 문을 열었다. 20년 전 아버지가 다듬어 놓은 합금 잉곳과 스프링 세트. 귀중한 유산.',
    },
  },

  mq_eng_side_04: {
    id: 'mq_eng_side_04', title: '군수공장 잠입',
    desc: '군수공장 위치 정보를 확보하라. 방사선 주의 지역. 종로구 방문.',
    icon: '🎯', characterId: 'engineer', dayTrigger: 40, prerequisite: 'mq_eng_10',
    objective: { type: 'visit_district', districtId: 'jongno', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'gunpowder', qty: 3 }, { definitionId: 'electronic_parts', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 85,
    narrative: {
      start: '정부청사 인근에 방치된 군수공장. 방사선 낙진이 있지만 무기·탄약 제조 부품이 대량 보관돼 있다.',
      complete: '화약과 전자 격발 장치를 확보했다. 이걸로 정식 수제 화기 제작이 가능해진다.',
    },
  },

  mq_eng_side_05: {
    id: 'mq_eng_side_05', title: '연구소 기계 분석',
    desc: '서울대 연구소에서 도면 분석 자료를 확보하라. 관악구 방문 + 구조물 1개 제작.',
    icon: '📚', characterId: 'engineer', dayTrigger: 45, prerequisite: 'mq_eng_side_02',
    objective: { type: 'visit_district', districtId: 'gwanak', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'electronic_parts', qty: 4 }, { definitionId: 'wire', qty: 5 }] },
    failPenalty: { morale: -5 }, deadlineDays: 90,
    narrative: {
      start: '서울대 공과대학 연구실. 전기공학·기계공학 도면이 남아 있다. 고급 장비 제작에 필수 지식.',
      complete: '연구실 서랍에서 정밀 설계도 10장을 회수. 아버지 설계도와 결합하면 신규 제작 블루프린트가 해금될 것이다.',
    },
  },
};

export default ENGINEER_SHARED;
