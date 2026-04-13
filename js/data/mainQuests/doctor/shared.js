// === MAIN QUESTS: 이지수 (doctor) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(한소희 협력) vs B(강민준 합류)

const DOCTOR_SHARED = {

  mq_doctor_01: {
    id: 'mq_doctor_01', title: '삼성병원 생존자',
    desc: '약품 창고에서 탈출했다. 식량 3개를 확보하라.',
    icon: '🏥', characterId: 'doctor', dayTrigger: 1, prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 10,
    narrative: {
      start: '강남 삼성서울병원 응급실. 이지수 전문의(38세)는 약품 창고에서 3일을 버텼다. 밖에 나왔을 때 병원은 지옥이 되어 있었다. 먼저 식량을 확보해야 한다.',
      complete: '식량을 확보했다. 약품 창고에서 나오면서 붕대도 챙겼다. 여기서 오래 있으면 안 된다.',
    },
  },

  mq_doctor_02: {
    id: 'mq_doctor_02', title: '처치실 방벽',
    desc: '처치실을 임시 거점으로 만들어라. 구조물을 제작하라.',
    icon: '🏗️', characterId: 'doctor', dayTrigger: 2, prerequisite: 'mq_doctor_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 12,
    narrative: {
      start: '매일 밤 잠을 설친다. 처치실 문을 막아야 한다.',
      complete: '바리케이드가 세워졌다. 오늘 밤은 안전하다.',
    },
  },

  mq_doctor_03: {
    id: 'mq_doctor_03', title: '응급 처치 준비',
    desc: '붕대 3개를 확보하라.',
    icon: '🩹', characterId: 'doctor', dayTrigger: 4, prerequisite: 'mq_doctor_02',
    objective: { type: 'collect_item', definitionId: 'bandage', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'antiseptic', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 14,
    narrative: {
      start: '의사로서 최소한의 준비는 해야 한다. 붕대, 소독약. 아무리 세상이 끝나도 다친 사람은 생기게 마련이다.',
      complete: '응급 처치 키트를 꾸렸다. 붕대와 소독약 세트가 갖춰졌다.',
    },
  },

  mq_doctor_04: {
    id: 'mq_doctor_04', title: '환자 수액',
    desc: '탈수 환자가 발생했다. 깨끗한 물 3개를 확보하라.',
    icon: '💧', characterId: 'doctor', dayTrigger: 6, prerequisite: 'mq_doctor_03',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'painkiller', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 16,
    narrative: {
      start: '병원 복도에서 탈수 상태의 생존자를 발견했다. 깨끗한 물이 필요하다.',
      complete: '수분을 공급했다. 환자가 눈을 떴다. 고맙다는 말을 하며 진통제를 내밀었다.',
    },
  },

  mq_doctor_05: {
    id: 'mq_doctor_05', title: '임시 의무실',
    desc: '의료 아이템 3개를 수집하라.',
    icon: '⚕️', characterId: 'doctor', dayTrigger: 8, prerequisite: 'mq_doctor_04',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 3 },
    reward: { morale: 8, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 18,
    narrative: {
      start: '소문이 퍼졌다. "4층에 의사가 있다." 생존자들이 찾아오기 시작했다.',
      complete: '의무실이 갖춰졌다. 생존자 중 한 명이 구급키트를 가져왔다. "의사 선생님이 제일 필요한 거 아닌가요?"',
    },
  },

  mq_doctor_06: {
    id: 'mq_doctor_06', title: '약초 채취',
    desc: '병원 정원에 약초가 있다. 약초 2개를 수집하라.',
    icon: '🌿', characterId: 'doctor', dayTrigger: 10, prerequisite: 'mq_doctor_05',
    objective: { type: 'collect_item', definitionId: 'herb', count: 2 },
    reward: { morale: 5, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 20,
    narrative: {
      start: '병원 약품이 바닥나기 시작했다. 천연 약재를 활용할 수밖에 없다.',
      complete: '삼백초와 질경이. 항균 효과가 있다. 끓여서 허브차로 만들었다.',
    },
  },

  mq_doctor_07: {
    id: 'mq_doctor_07', title: '첫 번째 치료약',
    desc: '의료 아이템을 1개 제작하라.',
    icon: '💊', characterId: 'doctor', dayTrigger: 13, prerequisite: 'mq_doctor_06',
    objective: { type: 'craft_item', category: 'medical', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'bandage', qty: 1 }, { definitionId: 'antiseptic', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 23,
    narrative: {
      start: '약초와 남은 약품을 혼합한다.',
      complete: '첫 번째 임시 치료약 완성. 제작 과정에서 쓰고 남은 소독약과 붕대도 챙겼다. 세브란스에 가야 한다.',
    },
  },

  mq_doctor_08: {
    id: 'mq_doctor_08', title: '원정 의료 물자',
    desc: '세브란스까지의 여정에 의료 물자 5개가 필요하다.',
    icon: '🎒', characterId: 'doctor', dayTrigger: 15, prerequisite: 'mq_doctor_07',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    reward: { morale: 8, items: [{ definitionId: 'painkiller', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 30,
    narrative: {
      start: '신촌 세브란스까지. 강남에서 마포를 거쳐야 한다.',
      complete: '의료 배낭이 가득 찼다. 진통제도 여분으로 챙겼다. 이제 출발할 수 있다.',
    },
  },

  mq_doctor_09: {
    id: 'mq_doctor_09', title: '홍대 약국 경유',
    desc: '마포구를 통과하라.',
    icon: '🗺️', characterId: 'doctor', dayTrigger: 18, prerequisite: 'mq_doctor_08',
    objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 1 }, { definitionId: 'antidote', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 35,
    narrative: {
      start: '마포구 홍대 입구. 약국들이 있는 곳이다.',
      complete: '홍대 약국 뒷창고에서 소독약, 해독제, 그리고 메모 한 장 발견. "약사 한소희. 서울대 연구소로 갑니다." 용산 방향에서 무전도 잡혔다 — 군의관 강민준 하사. "의사를 찾습니다."',
    },
  },

  mq_doctor_10: {
    id: 'mq_doctor_10', title: '야전 소독',
    desc: '이동 중 상처가 났다. 소독약 2개를 확보하라.',
    icon: '🧴', characterId: 'doctor', dayTrigger: 21, prerequisite: 'mq_doctor_09',
    objective: { type: 'collect_item', definitionId: 'antiseptic', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'stimulant', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 38,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '한소희 약사와 협력',
        desc: '서울대 연구소로 함께 간다. 합성 전문가와 백신을 연구한다.',
        setsFlag: 'doctor_branch_a',
        recruitNpc: 'npc_sohee',
      },
      {
        label: '강민준 군의관과 합류',
        desc: '군 의료팀에 합류한다. 군 보급로와 전투 지원을 확보한다.',
        setsFlag: 'doctor_branch_b',
        recruitNpc: 'npc_minjun',
      },
    ],
    narrative: {
      start: '유리 파편에 손을 베었다. 의사가 감염으로 쓰러지면 안 된다.',
      complete: '상처를 소독했다. 비상용 각성제도 확보했다. 두 가지 제안이 기다리고 있다. 한소희의 메모와 강민준의 무전. 선택을 해야 한다.',
    },
  },
};

export default DOCTOR_SHARED;
