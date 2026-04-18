// === MAIN QUESTS: 이지수 (doctor) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(한소희 협력) vs B(강민준 합류)

const DOCTOR_SHARED = {

  mq_doctor_01: {
    id: 'mq_doctor_01', title: '응급실의 첫 환자',
    desc: '응급실에 쓰러진 박상훈 하사를 완치시켜라. (붕대로 치료)',
    icon: '🩹', characterId: 'doctor', dayTrigger: 1, prerequisite: null,
    objective: { type: 'treat_npc', npcId: 'npc_wounded_soldier', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'bandage', qty: 2 }, { definitionId: 'antiseptic', qty: 1 }] },
    failPenalty: { morale: -10 }, deadlineDays: 5,
    narrative: {
      start: '동작구 보라매병원 응급실. 이지수 전문의(38세)는 약품 창고에서 3일을 버텼다. 문을 열자 바닥에 박상훈 하사가 쓰러져 있다 — 현충원 경비소대 소속. 의사의 첫 환자다. 붕대를 하사 카드에 드래그해 치료하라.',
      complete: '박상훈 하사가 눈을 떴다. "선생님, 감사합니다... 신촌에서 군 무전이 잡힌 적이 있습니다. 강민준 군의관이 의사를 찾는다고 했습니다." 히포크라테스 선서가 세상이 끝났다고 사라지지 않는다. 의사의 역할이 시작됐다.',
    },
  },

  mq_doctor_02: {
    id: 'mq_doctor_02', title: '간호사와의 공조',
    desc: '간호사의 의뢰 "응급 환자 발생"을 완료하라. (붕대 5개 + 구급키트 2개 + 동작구 방문)',
    icon: '👩‍⚕️', characterId: 'doctor', dayTrigger: 2, prerequisite: 'mq_doctor_01',
    objective: { type: 'npc_quest_complete', npcId: 'npc_nurse', questId: 'nurse_quest_emergency', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'bandage', qty: 2 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 14,
    narrative: {
      start: '박상훈 하사를 살리는 걸 본 간호사의 눈빛이 바뀌었다. "동작구 쪽에서 부상자들이 계속 몰려와요. 혼자선 감당이 안 돼요 — 함께 해주실 수 있죠?" 의사 혼자가 아니다. 진료소가 꾸려지기 시작한다.',
      complete: '붕대와 구급키트를 간호사에게 건네고 동작구 현장을 함께 돌았다. "이제 우린 팀이에요, 선생님." 간호사가 의료팀 일원이 됐다. 항생제와 소독약, 그리고 의학 지식(+20%) 교환.',
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
    id: 'mq_doctor_05', title: '첫 외래 환자',
    desc: '응급실 잔류 환자 1명을 치료하라. (부상 NPC 드래그 치료)',
    icon: '🩺', characterId: 'doctor', dayTrigger: 8, prerequisite: 'mq_doctor_04',
    objective: { type: 'treat_npc', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'first_aid_kit', qty: 1 }, { definitionId: 'antibiotics', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 18,
    narrative: {
      start: '소문이 퍼졌다. "4층에 의사가 있다." 복도에 쓰러진 첫 외래 환자가 찾아왔다. 붕대와 소독약으로 치료해야 한다.',
      complete: '환자가 눈을 뜨고 의사의 손을 잡는다. "선생님… 감사합니다." 그가 남긴 구급키트와 항생제. 보라매 "의사가 있는 곳"이라는 소문이 바깥으로 퍼진다.',
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
      start: '보라매 약품 창고가 바닥을 드러냈다. 남은 약초와 잔여 약품을 혼합해 임시 치료약을 만든다.',
      complete: '첫 번째 임시 치료약 완성. 하지만 원료가 3일 안에 고갈될 것이다 — 세브란스 병원 본관 약품고가 유일한 희망이다.',
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

  // ── 사이드 퀘스트 (선택, 메인 체인 비차단) ─────────────────────
  // 대부분 mq_doctor_10 완료 후 활성화되지만, 초반 능력 체감용은 mq_doctor_01 직후 활성화.

  mq_doctor_side_soldier: {
    id: 'mq_doctor_side_soldier', title: '박상훈 하사와 현충원',
    desc: '회복한 박상훈 하사와 함께 동작구 국립현충원을 방문해 소대원의 흔적을 찾아라.',
    icon: '🎖️', characterId: 'doctor', dayTrigger: 7, prerequisite: 'mq_doctor_01',
    objective: { type: 'visit_district', districtId: 'dongjak', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'first_aid_kit', qty: 1 }, { definitionId: 'stimulant', qty: 1 }], flags: { minjun_radio_received: true } },
    failPenalty: { morale: -5 }, deadlineDays: 14,
    narrative: {
      start: '박상훈 하사가 처치실 문 앞에 서 있다. "선생님, 현충원에 가야 합니다. 소대원들 인식표를… 유가족에게 돌려줘야 해요." 이지수는 진료 가방을 챙겼다.',
      complete: '현충원 경비초소에서 소대 인식표 5개를 수습했다. 그때 라디오 노이즈 사이로 군 무전이 잡힌다. "강민준 군의관… 의사를 찾습니다. 좌표 송신 중…" 박상훈 하사가 눈물을 삼킨다. "저분이 소대장님 동기입니다." 강민준의 위치가 일기장에 적혔다.',
    },
  },

  mq_doctor_side_early: {
    id: 'mq_doctor_side_early', title: '임상 지식 — 감염 추적',
    desc: '감염 수치 5 이상인 상태로 3일 연속 버티며 증상 진행을 관찰하라.',
    icon: '🛡️', characterId: 'doctor', dayTrigger: 3, prerequisite: 'mq_doctor_01',
    objective: { type: 'survive_infection', minInfection: 5, count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 2 }, { definitionId: 'herb', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 30,
    narrative: {
      start: '이지수의 수첩에 적힌 메모: "임상 지식은 이론이 아닌 관찰이다. 내 몸의 감염 수치를 낮게 유지하면서 초기 증상을 3일간 기록할 것." 감염 -35% 특성을 체감으로 확인할 시간이다.',
      complete: '3일간의 관찰 기록이 완성됐다. 보통 사람이라면 벌써 중증으로 번졌을 감염 수치가 여전히 낮게 유지됐다. "임상 지식 — 내 몸이 곧 표본이다." 이지수는 스스로의 저항력을 수치로 확인했다.',
    },
  },

  mq_doctor_side_01: {
    id: 'mq_doctor_side_01', title: '감염 패턴 추적',
    desc: '감염자 10마리를 처치하며 감염 진행 단계를 관찰하라.',
    icon: '🧫', characterId: 'doctor', dayTrigger: 22, prerequisite: 'mq_doctor_10',
    objective: { type: 'track_infected', enemyType: 'zombie', count: 10 },
    reward: { morale: 10, items: [{ definitionId: 'herb', qty: 2 }, { definitionId: 'antiseptic', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 40,
    narrative: {
      start: '이지수의 수첩에 적힌 메모: "감염 후기 단계의 근육 경직, 안구 혼탁도, 출혈 패턴을 기록할 것." 의사의 본능이다. 관찰하고, 기록하고, 이해해야 한다.',
      complete: '10개 표본의 증상 진행도를 수첩에 정리했다. 초기 감염자는 빠르지만 후기 개체는 느려진다. 데이터가 쌓인다. 약초 시료와 소독약도 현장에서 확보했다.',
    },
  },

  mq_doctor_side_02: {
    id: 'mq_doctor_side_02', title: '환자 진료',
    desc: '부상당한 생존자 3명을 치료하라. (붕대/구급키트 사용)',
    icon: '🩺', characterId: 'doctor', dayTrigger: 25, prerequisite: 'mq_doctor_10',
    objective: { type: 'treat_npc', count: 3 },
    reward: { morale: 12, items: [{ definitionId: 'bandage', qty: 2 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 45,
    narrative: {
      start: '소문이 퍼진다. "의사가 있다." 다친 생존자들이 제 발로 찾아온다. 히포크라테스 선서는 세상이 끝났다고 사라지지 않는다.',
      complete: '세 명을 치료했다. 그들의 눈빛이 달라진다 — 경계에서 신뢰로. 한 명이 은밀하게 숨겨둔 구급키트를 꺼냈다. "이런 건 의사 선생님이 가져야 해요."',
    },
  },

  mq_doctor_side_03: {
    id: 'mq_doctor_side_03', title: '역학 조사',
    desc: '서울역 중심부(중구)에 진입해 전염병 확산 경로를 지도화하라.',
    icon: '🗺️', characterId: 'doctor', dayTrigger: 30, prerequisite: 'mq_doctor_10',
    objective: { type: 'visit_district', districtId: 'junggoo', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'antidote', qty: 1 }, { definitionId: 'herb', qty: 3 }] },
    failPenalty: { morale: -8 }, deadlineDays: 50,
    narrative: {
      start: '감염은 어디서 시작됐을까. 서울역 — 하루 수십만이 지나던 교통의 심장. 그곳이 0번 환자의 동선과 겹칠 가능성이 가장 높다. 역학 조사가 필요하다.',
      complete: '서울역 대합실에 쌓인 시신 분포를 스케치했다. 방사형 패턴 — 중심에서 바깥으로 퍼져나간 자국이 선명하다. 질병관리청 소속이 남긴 메모도 발견했다. 해독제 샘플과 약초도 챙겼다.',
    },
  },

  mq_doctor_side_04: {
    id: 'mq_doctor_side_04', title: '격리 거점 구축',
    desc: '감염자 격리를 위한 의료 아이템 3개를 제작하라.',
    icon: '⚗️', characterId: 'doctor', dayTrigger: 35, prerequisite: 'mq_doctor_10',
    objective: { type: 'craft_item', category: 'medical', count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 2 }, { definitionId: 'bandage', qty: 3 }] },
    failPenalty: { morale: -6 }, deadlineDays: 55,
    narrative: {
      start: '새로 들어오는 생존자는 반드시 격리한다. 잠복기 동안 증상이 나타나면… 결정을 내려야 한다. 격리실에 둘 소독약, 붕대, 진정제가 필요하다.',
      complete: '격리 공간이 갖춰졌다. 벽에는 비닐이 붙었고, 선반엔 제작한 약품이 놓였다. 누구도 이곳에서 죽지 않기를 — 의사의 기도다.',
    },
  },

  mq_doctor_side_05: {
    id: 'mq_doctor_side_05', title: '특수 감염자 표본',
    desc: '0번 환자(patient zero) 표본을 확보하라. 연구에 필수적이다.',
    icon: '🧪', characterId: 'doctor', dayTrigger: 45, prerequisite: 'mq_doctor_side_01',
    objective: { type: 'track_infected', enemyId: 'boss_patient_zero', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'antidote', qty: 2 }, { definitionId: 'stimulant', qty: 1 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -10 }, deadlineDays: 60,
    narrative: {
      start: '감염 패턴 기록을 보던 이지수의 손이 멈췄다. 모든 증상 진행이 한 지점으로 수렴한다 — 최초 변이체. 0번 환자. 그 조직 샘플만 있으면 역설계가 가능할지도 모른다.',
      complete: '0번 환자의 심장 조직을 채취했다. 손이 떨린다. 이건 재앙의 시작점이자, 어쩌면 종결점이다. 해독제 원형과 각성제, 구급키트도 그 소굴에서 함께 거둬왔다.',
    },
  },

  mq_doctor_side_06: {
    id: 'mq_doctor_side_06', title: '야전병원 확장',
    desc: '의료 구조물 3개를 세워 본격적인 야전병원을 구축하라.',
    icon: '🏥', characterId: 'doctor', dayTrigger: 50, prerequisite: 'mq_doctor_side_04',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 20, items: [
      { definitionId: 'reinforced_bandage', qty: 3 },
      { definitionId: 'vitamin_complex', qty: 3 },
      { definitionId: 'iv_saline', qty: 1 },
    ], flags: { doctor_field_hospital: true } },
    failPenalty: { morale: -8 }, deadlineDays: 85,
    narrative: {
      start: '격리 거점이 갖춰졌으니 이제 확장이다. 수술대, 격리 병동, 약품 보관장. 세 가지만 있어도 중환자실 수준의 진료가 가능하다. 이지수는 청사진을 그리기 시작했다.',
      complete: '야전병원이 완성됐다. 수술대 위에 무영등이 켜지고, 격리 병동 문이 닫혔다. 약품 보관장에 의약품이 정리됐다. "이제 제대로 된 병원이다." 이지수는 처음으로 의사 가운을 다시 걸쳤다.',
    },
  },
};

export default DOCTOR_SHARED;
