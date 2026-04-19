// === MAIN QUESTS: 한소희 (pharmacist) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(이지수 의사 공동 연구) vs B(정대한 실험실 구축)

const PHARMACIST_SHARED = {

  mq_pharma_01: {
    id: 'mq_pharma_01', title: '약국 재고',
    desc: '삼성병원에 피신했다. 붕대 3개를 수집하라. (5일 내 완료 시 보너스)',
    icon: '💊', characterId: 'pharmacist', dayTrigger: 1, prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'bandage', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'antiseptic', qty: 1 }] },
    bonusCondition: { type: 'completeWithinDays', days: 5 },
    bonusReward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 10,
    narrative: {
      start: '한소희(31세). 홍대 입구 골목 작은 약국 원장. 이미 사흘 전부터 알아차렸다. 발열, 이상 행동, 희번뜩이는 눈. 삼성병원으로 피신했다. (약사의 감각: 5일 안에 재고를 확보하면 붕대 두 개가 덤으로 남는다.)',
      complete: '붕대와 소독약을 확보했다. 약국 원장이 제일 먼저 챙기는 것. 이것으로 기본 치료는 가능하다.',
    },
  },

  mq_pharma_02: {
    id: 'mq_pharma_02', title: '임시 실험실',
    desc: '구조물을 제작하라. 약품 합성을 위한 안정된 공간이 필요하다.',
    icon: '🧪', characterId: 'pharmacist', dayTrigger: 2, prerequisite: 'mq_pharma_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 12,
    narrative: {
      start: '약품 합성에는 안정된 공간이 필요하다. 진동과 오염에 민감한 작업이다.',
      complete: '임시 실험대가 완성됐다. 조악하지만, 기본 조제는 가능하다.',
    },
  },

  mq_pharma_03: {
    id: 'mq_pharma_03', title: '천연물 시료 조사',
    desc: '약초 3개를 수집하라. 대학원 시절 천연물 화학 지식이 떠올랐다.',
    icon: '🌿', characterId: 'pharmacist', dayTrigger: 4, prerequisite: 'mq_pharma_02',
    objective: { type: 'collect_item', definitionId: 'herb', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'herbal_tea', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 14,
    narrative: {
      start: '감염 패턴이 특이하다. 합성 약품이 없다면 천연에서 찾아야 한다. 대학원 시절 천연물 화학 수업. 교수가 말했다. "가장 강한 항바이러스 성분은 식물에 있다." 지금 그 말이 기억난다.',
      complete: '약초 시료 확보. 채집하면서 바로 허브차를 만들었다. 유효 성분이 눈에 보인다. 이 방향이 맞다.',
    },
  },

  mq_pharma_04: {
    id: 'mq_pharma_04', title: '초기 약품 수집',
    desc: '의료 아이템 3개를 수집하라. 기초 조제에 필요하다.',
    icon: '🩺', characterId: 'pharmacist', dayTrigger: 6, prerequisite: 'mq_pharma_03',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'painkiller', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 16,
    narrative: {
      start: '기초 조제에는 기존 약품 성분이 필요하다. 병원 약품부를 수색한다.',
      complete: '약품 확보. 진통제도 여분으로 챙겼다. 조제를 시작할 수 있다.',
    },
  },

  mq_pharma_05: {
    id: 'mq_pharma_05', title: '소독 성분 비교',
    desc: '소독약 2개를 수집하라. 합성 성분과 천연 성분의 항바이러스 효과를 비교한다.',
    icon: '🧪', characterId: 'pharmacist', dayTrigger: 8, prerequisite: 'mq_pharma_04',
    objective: { type: 'collect_item', definitionId: 'antiseptic', count: 2 },
    reward: { morale: 5, items: [{ definitionId: 'antibiotics', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 18,
    narrative: {
      start: '약초 추출물이 준비됐다. 이제 기존 소독 성분과 비교해봐야 한다. 합성 항바이러스 vs 천연 항바이러스. 데이터가 필요하다.',
      complete: '소독약 확보. 비교 실험 중 병원 약장 깊숙이 항생제를 발견했다. 비교 실험 결과: 천연 추출물이 감염 초기 단계에서 더 효과적이다.',
    },
  },

  mq_pharma_06: {
    id: 'mq_pharma_06', title: '시료 용매',
    desc: '깨끗한 물 3개를 확보하라. 시료 추출에 용매가 필요하다.',
    icon: '💧', characterId: 'pharmacist', dayTrigger: 10, prerequisite: 'mq_pharma_05',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'water_filter', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 20,
    narrative: {
      start: '정수된 물이 시료 추출의 기본 용매다. 불순물이 있으면 결과가 오염된다.',
      complete: '정수된 물 확보. 정수 작업 중 버려진 정수 필터도 발견했다. 이제 추출을 시작할 수 있다.',
    },
  },

  mq_pharma_07: {
    id: 'mq_pharma_07', title: '1차 합성 시도',
    desc: '의료 아이템 1개를 제작하라. 관찰 일지가 제안하는 표적 약물이 있다. (일치 시 보너스)',
    icon: '⚗️', characterId: 'pharmacist', dayTrigger: 13, prerequisite: 'mq_pharma_06',
    objective: { type: 'craft_item', category: 'medical', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'stamina_tonic', qty: 1 }] },
    prescriptionOptions: {
      '항바이러스 (허브차 루트)':     'herbal_tea',
      '광범위 소독 (antiseptic)':    'antiseptic',
      '즉효 진통 (painkiller_field)': 'painkiller_field',
      '항생 경로 (reinforced_bandage)': 'reinforced_bandage',
    },
    prescriptionLabels: {
      herbal_tea:           '🌿 허브차 (항바이러스)',
      antiseptic:           '🧪 소독약 (광범위)',
      painkiller_field:     '💉 야전 진통제',
      reinforced_bandage:   '🩹 강화 붕대',
    },
    bonusCondition: { type: 'prescriptionMatch' },
    bonusReward: { morale: 6, items: [{ definitionId: 'antibiotics', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 23,
    narrative: {
      start: '관찰 일지 3페이지. 감염 48시간 후 세포 변이 패턴이 달라진다. 오늘의 표적 약물이 지정됐다 — 일지의 방향과 맞추면 항생제까지 얻을 수 있다.',
      complete: '1차 합성 결과 불완전. 하지만 방향은 맞다. 합성 과정에서 체력 회복 강장제를 만들었다. 더 정제해야 한다.',
    },
    companionEpilogue: {
      default: '한소희: "합성이 통했어요. 첫 페이지의 가설이 틀린 방향은 아니었네요."',
      success: '한소희: "일지의 표적 그대로 합성했어요 — 이 루트가 본 흐름이 되겠어요."',
    },
  },

  mq_pharma_08: {
    id: 'mq_pharma_08', title: '원정 의료 물자',
    desc: '의료 아이템 5개를 챙겨라. 마포까지의 여정에 필요하다.',
    icon: '🎒', characterId: 'pharmacist', dayTrigger: 15, prerequisite: 'mq_pharma_07',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    reward: { morale: 8, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 30,
    narrative: {
      start: '홍대 약국으로 돌아가야 한다. 처음 이상 증상을 관찰하기 시작한 1월 14일부터의 기록이 거기에 있다.',
      complete: '이동 준비 완료. 구급키트도 챙겼다. 기록을 찾으면 합성법이 완성될 수 있다.',
    },
  },

  mq_pharma_09: {
    id: 'mq_pharma_09', title: '홍대 약국 귀환',
    desc: '마포구에 도달하라. 초기 관찰 기록을 회수해야 한다.',
    icon: '📍', characterId: 'pharmacist', dayTrigger: 18, prerequisite: 'mq_pharma_08',
    objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'antidote', qty: 1 }], flags: { pharmacy_records_recovered: true } },
    failPenalty: { morale: -5 }, deadlineDays: 35,
    narrative: {
      start: '홍대 입구역. 1월 14일부터 이상 증상을 기록하기 시작했다. 카운터 아래 숨겨둔 노트가 있다.',
      complete: '약국은 약탈당했지만 노트는 무사했다. 3일치 관찰 데이터. 그리고 약장 뒤쪽에 해독제도 있었다. 삼성병원 이지수 의사가 함께 연구하자고 한다. 정대한이 성수동에서 연구 설비를 구축하고 있다.',
    },
  },

  mq_pharma_10: {
    id: 'mq_pharma_10', title: '소독 연구 준비',
    desc: '소독약 2개를 수집하라. 감염 억제 메커니즘 연구의 첫 단계다.',
    icon: '🧴', characterId: 'pharmacist', dayTrigger: 21, prerequisite: 'mq_pharma_09',
    objective: { type: 'collect_item', definitionId: 'antiseptic', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 40,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '이지수 의사와 공동 연구',
        desc: '임상 데이터와 합성 능력의 결합. 더 빠르고 검증된 결과를 만들 수 있다.',
        setsFlag: 'pharma_branch_a',
        recruitNpc: 'npc_jisu',
      },
      {
        label: '정대한의 실험실 구축',
        desc: '장비와 합성 능력의 결합. 대규모 생산이 가능해진다.',
        setsFlag: 'pharma_branch_b',
        recruitNpc: 'npc_daehan',
      },
    ],
    narrative: {
      start: '소독 성분 분석. 감염 차단 메커니즘의 마지막 퍼즐이 될 수 있다.',
      complete: '소독약 확보. 분석을 시작했다. 항생제와 허브차도 챙겼다. 이지수와 임상 연구를 할 것인가, 정대한과 설비를 먼저 갖출 것인가.',
    },
  },
};

export default PHARMACIST_SHARED;
