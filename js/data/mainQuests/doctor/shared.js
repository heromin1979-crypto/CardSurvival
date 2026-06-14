// === MAIN QUESTS: 이지수 (doctor) — 공통 1~10 ===
// Q10 완료 시 분기 선택:
//   A (한소희 협력)  — 서울대 연구소, 합성 전문가
//   B (강민준 합류)  — 용산 군 의료본부
//   C (독자 연구)    — 보라매 고수, side_01~side_end 체인으로 백신 합성 엔딩

const DOCTOR_SHARED = {

  mq_doctor_01: {
    id: 'mq_doctor_01', title: '응급실의 첫 환자',
    desc: '응급실에 쓰러진 박상훈 하사를 완치시켜라. (붕대로 치료) ⭐ 5 TP 이내 완료 시 골든 타임 보너스.',
    icon: '🩹', characterId: 'doctor', dayTrigger: 1, prerequisite: null,
    objective: { type: 'treat_npc', npcId: 'npc_wounded_soldier', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'bandage', qty: 2 }, { definitionId: 'antiseptic', qty: 1 }] },
    bonusCondition: { type: 'completeWithinTp', count: 5 },
    bonusReward: {
      label: '골든 타임 치료 — 박상훈 하사 상태 우수. 전술 무전 조기 확보.',
      morale: 5,
      items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'painkiller', qty: 1 }],
      flags: { doctor_golden_start: true, minjun_radio_received: true },
    },
    failPenalty: { morale: -10 }, deadlineDays: 3,
    narrative: {
      start: '동작구 보라매병원 응급실. 이지수 전문의(38세)는 약품 창고에서 3일을 버텼다. 문을 열자 바닥에 박상훈 하사가 쓰러져 있다 — 현충원 경비소대 소속. 의사의 첫 환자다. 붕대를 하사 카드에 드래그해 치료하라. ⏱ 5 TP 이내에 처치를 마치면 하사의 의식이 또렷할 때 무전 정보를 얻을 수 있다.',
      complete: '박상훈 하사가 눈을 떴다. "선생님, 감사합니다..." 출혈이 멎었지만 의식이 흐릿하다. 히포크라테스 선서가 세상이 끝났다고 사라지지 않는다. 의사의 역할이 시작됐다.',
      completeBonus: '박상훈 하사가 또렷한 눈으로 일어났다. "선생님… 골든 타임이었습니다. 정말 감사합니다. 신촌에서 군 무전이 잡혔습니다 — 강민준 군의관이 의사를 찾고 있습니다. 좌표를 지금 드리겠습니다." 하사의 손이 무전 수첩을 건넸다. 감염 위험도 낮춘 항생제까지 건네받았다. 이지수의 손은 3일간의 어둠을 뚫고도 정확했다.',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원 응급실 — 박상훈 하사 카드 위',
      noteEn: 'Boramae Hospital ER — on Sgt. Park\'s card',
    },
    subObjectives: [
      {
        id: 'so_d01_01',
        text: '응급실에서 박상훈 하사 카드 찾기',
        textEn: 'Find Sgt. Park\'s card in the ER',
        hint: '바닥에 쓰러진 NPC 카드',
      },
      {
        id: 'so_d01_02',
        text: '붕대 카드를 박상훈에게 드래그',
        textEn: 'Drag bandage onto Sgt. Park',
        hint: 'bandage 사용',
        match: { type: 'use_item', definitionId: 'bandage', count: 1 },
      },
      {
        id: 'so_d01_03',
        text: '치료 완료 (5 TP 안에 끝나면 골든 타임)',
        textEn: 'Complete treatment (within 5 TP for golden time)',
        hint: '박상훈 하사 완치',
        match: { type: 'treat_npc', npcId: 'npc_wounded_soldier', count: 1 },
      },
    ],
    actionHint: '응급실 바닥의 박상훈 하사 카드에 붕대를 드래그해 치료. 5 TP 안에 끝내면 무전 정보 보너스.',
    actionHintEn: 'Drag bandage onto Sgt. Park\'s card. Finish within 5 TP for radio intel bonus.',
  },

  mq_doctor_02: {
    id: 'mq_doctor_02', title: '간호사와의 공조',
    desc: '간호사의 의뢰 "응급 환자 발생"을 완료하라. (붕대 5개 + 구급키트 2개 + 동작구 방문)',
    icon: '👩‍⚕️', characterId: 'doctor', dayTrigger: 2, prerequisite: 'mq_doctor_01',
    objective: { type: 'npc_quest_complete', npcId: 'npc_nurse', questId: 'nurse_quest_emergency', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'bandage', qty: 2 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 7,
    narrative: {
      start: '박상훈 하사를 살리는 걸 본 간호사의 눈빛이 바뀌었다. "동작구 쪽에서 부상자들이 계속 몰려와요. 혼자선 감당이 안 돼요 — 함께 해주실 수 있죠?" 의사 혼자가 아니다. 진료소가 꾸려지기 시작한다.',
      complete: '붕대와 구급키트를 간호사에게 건네고 동작구 현장을 함께 돌았다. "이제 우린 팀이에요, 선생님." 간호사가 의료팀 일원이 됐다. 항생제와 소독약, 그리고 의학 지식(+20%) 교환.',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원에서 간호사 의뢰 수령 → 동작구 현장 동행',
      noteEn: 'Take the nurse\'s request at Boramae Hospital, then accompany her into Dongjak',
    },
    subObjectives: [
      {
        id: 'so_d02_01',
        text: '붕대 5개 마련',
        textEn: 'Stock 5 bandages',
        match: { type: 'collect_item', definitionId: 'bandage', count: 5 },
      },
      {
        id: 'so_d02_02',
        text: '구급키트 2개 마련',
        textEn: 'Stock 2 first aid kits',
        match: { type: 'collect_item', definitionId: 'first_aid_kit', count: 2 },
      },
      {
        id: 'so_d02_03',
        text: '간호사와 동작구 현장 동행',
        textEn: 'Visit Dongjak with the nurse',
        match: { type: 'visit_district', districtId: 'dongjak' },
      },
    ],
    actionHint: '응급실에서 보급품을 모아 동작구로 출동. 간호사 의뢰서를 카드로 확인할 것.',
    actionHintEn: 'Stock supplies at the ER then move out into Dongjak with the nurse\'s request card.',
  },

  mq_doctor_03: {
    id: 'mq_doctor_03', title: '보라매의 환자들',
    desc: '보라매병원 잔류 환자 2명을 드래그 치료로 살려라.',
    icon: '🩺', characterId: 'doctor', dayTrigger: 4, prerequisite: 'mq_doctor_02',
    objective: { type: 'treat_npc', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'antiseptic', qty: 1 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 8,
    narrative: {
      start: '응급실 바닥에 쓰러진 환자들 — 일부는 아직 숨이 붙어 있다. 붕대와 약품으로 두 명만이라도 살려야 한다. 의사의 손에 선택이 달렸다.',
      complete: '두 생존자가 눈을 떴다. 한 명은 간호사에게 인계했고, 한 명은 진료소 보조로 남았다. "선생님이 있어서 다행이에요." 보라매에 의사가 있다는 소문이 복도를 넘었다.',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원 응급실 — 쓰러진 환자 카드 위',
      noteEn: 'Boramae Hospital ER — on collapsed patient cards',
    },
    subObjectives: [
      {
        id: 'so_d03_01',
        text: '붕대·소독약 등 처치 도구 준비',
        textEn: 'Ready bandages and antiseptic for triage',
        hint: '인벤토리 또는 응급실 보관함 확인',
      },
      {
        id: 'so_d03_02',
        text: '응급실 잔류 환자 2명 치료',
        textEn: 'Treat 2 remaining ER patients',
        match: { type: 'treat_npc', count: 2 },
      },
    ],
    actionHint: '치료 카드를 환자 NPC 카드에 드래그. 두 명 완치까지 이어서 진행.',
    actionHintEn: 'Drag treatment cards onto patient NPCs. Continue until 2 are stabilised.',
  },

  mq_doctor_04: {
    id: 'mq_doctor_04', title: '환자 수액',
    desc: '탈수 환자가 발생했다. 깨끗한 음용수 3개를 확보하라. (정수 물병 / 끓인 물 / 멸균수 등)',
    icon: '💧', characterId: 'doctor', dayTrigger: 6, prerequisite: 'mq_doctor_03',
    objective: { type: 'collect_item_type', itemType: 'clean', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'painkiller', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 16,
    narrative: {
      start: '병원 복도에서 탈수 상태의 생존자를 발견했다. 깨끗한 음용수가 필요하다. 카페테리아 물병이든, 빗물을 모아 끓인 것이든 상관없다.',
      complete: '수분을 공급했다. 환자가 눈을 떴다. 고맙다는 말을 하며 진통제를 내밀었다.',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원 카페테리아에서 물병 회수 + 옥상에 양동이를 두고 빗물 집수',
      noteEn: 'Recover bottles from the Boramae cafeteria + place a bucket on the rooftop to collect rain',
    },
    subObjectives: [
      {
        id: 'so_d04_01',
        text: '카페테리아·자판기에서 물병 회수',
        textEn: 'Recover bottles from cafeteria and vending machines',
        hint: '병원 내부 탐색 카드',
      },
      {
        id: 'so_d04_02',
        text: '양동이 물·시냇물 정수 또는 끓이기',
        textEn: 'Purify or boil bucket water / stream water',
        hint: '비 올 때 양동이로 집수하거나 물가에서 채운 뒤 정수·끓이기',
      },
      {
        id: 'so_d04_03',
        text: '깨끗한 음용수 3개 확보',
        textEn: 'Stockpile 3 clean drinking waters',
        match: { type: 'collect_item_type', itemType: 'clean', count: 3 },
      },
    ],
    actionHint: '정수·끓인 물·멸균수 어떤 것이든 clean 분류 3개를 모으면 인정된다.',
    actionHintEn: 'Any 3 items tagged "clean" (purified, boiled, or sterile water) will satisfy the goal.',
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
    companionEpilogue: {
      default: '박상훈 하사: "선생님, 저 같은 사람이 또 오는 겁니다. 제가 경비 서 드릴게요 — 이 응급실은 제가 지킵니다."',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원 응급실 — 외래로 들어온 부상 NPC 카드',
      noteEn: 'Boramae Hospital ER — newly arriving outpatient NPC card',
    },
    subObjectives: [
      {
        id: 'so_d05_01',
        text: '외래 환자 NPC 카드 확인',
        textEn: 'Identify the new outpatient NPC',
        hint: '응급실 행에 새로 등장한 카드',
      },
      {
        id: 'so_d05_02',
        text: '붕대·소독약으로 처치 1회 완료',
        textEn: 'Complete one full treatment',
        match: { type: 'treat_npc', count: 1 },
      },
    ],
    actionHint: '새로 들어온 외래 환자 카드에 치료 아이템을 드래그해 완치까지 처치.',
    actionHintEn: 'Drag medical items onto the new outpatient card until they are fully stabilised.',
  },

  mq_doctor_06: {
    id: 'mq_doctor_06', title: '약초 채취',
    desc: '병원 정원에 약초가 있다. 약초 3개를 수집하라.',
    icon: '🌿', characterId: 'doctor', dayTrigger: 10, prerequisite: 'mq_doctor_05',
    objective: { type: 'collect_item', definitionId: 'herb', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'herbal_tea', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 20,
    narrative: {
      start: '병원 약품이 바닥나기 시작했다. 천연 약재를 활용할 수밖에 없다.',
      complete: '삼백초와 질경이. 항균 효과가 있다. 끓여서 허브차로 만들었다.',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원 정원·울타리 주변 자연 채집',
      noteEn: 'Forage around the Boramae Hospital garden and fence line',
    },
    subObjectives: [
      {
        id: 'so_d06_01',
        text: '병원 정원 탐색',
        textEn: 'Scout the hospital garden',
        hint: '동작구 보라매 외곽 카드',
      },
      {
        id: 'so_d06_02',
        text: '약초 3개 채집',
        textEn: 'Forage 3 herbs',
        match: { type: 'collect_item', definitionId: 'herb', count: 3 },
      },
    ],
    actionHint: '병원 정원·울타리 카드에서 약초 채집 액션을 반복해 3개 확보.',
    actionHintEn: 'Use the foraging action on the garden tiles until 3 herbs are stocked.',
  },

  mq_doctor_07: {
    id: 'mq_doctor_07', title: '첫 번째 치료약',
    desc: '의료 아이템을 1개 제작하라. 📋 진료 요청과 일치하는 약품 제작 시 골든 타임 보너스.',
    icon: '💊', characterId: 'doctor', dayTrigger: 13, prerequisite: 'mq_doctor_06',
    objective: { type: 'craft_item', category: 'medical', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'bandage', qty: 1 }, { definitionId: 'antiseptic', qty: 1 }] },
    prescriptionOptions: {
      fever:     'antibiotics',
      bleeding:  'bandage',
      infection: 'antiseptic',
    },
    prescriptionLabels: {
      fever:     '고열 (항생제 필요)',
      bleeding:  '출혈 (붕대 필요)',
      infection: '상처 감염 (소독약 필요)',
    },
    bonusCondition: { type: 'prescriptionMatch' },
    bonusReward: {
      label: '정확한 처방 — 환자 증상 진정.',
      morale: 5,
      items: [{ definitionId: 'herb', qty: 2 }, { definitionId: 'antiseptic', qty: 1 }],
      flags: { doctor_prescription_07_success: true },
    },
    failPenalty: { morale: -5 }, deadlineDays: 23,
    narrative: {
      start: '보라매 약품 창고가 바닥을 드러냈다. 남은 약초와 잔여 약품을 혼합해 임시 치료약을 만든다. 간호사가 진료 요청서를 건넸다 — 증상과 약품이 일치하면 환자가 빠르게 안정된다.',
      complete: '첫 번째 임시 치료약 완성. 하지만 원료가 3일 안에 고갈될 것이다 — 세브란스 병원 본관 약품고가 유일한 희망이다.',
      completeBonus: '증상에 정확히 맞춘 약품이었다. 환자의 호흡이 곧 안정됐고, 간호사의 눈빛에 경의가 스쳤다. "선생님, 진료 감각이 살아 있습니다." 약초와 소독약 여분을 감사 인사와 함께 받았다. 세브란스 원정이 한 걸음 가까워졌다.',
    },
    companionEpilogue: {
      default: '간호사: "선생님, 아무거나 만드신 건 아니시겠죠… 다음엔 환자 증상부터 보실 수 있을 거예요. 제가 진료 요청서 더 가져올게요."',
      success: '간호사: "역시 선생님이세요. 이 비율, 기록해 두겠습니다 — 내일 똑같은 증상 오면 제가 먼저 준비해 놓을 수 있으니까요."',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매병원 약품 창고 — 제작대 카드 사용',
      noteEn: 'Boramae Hospital pharmacy — use the crafting bench card',
    },
    subObjectives: [
      {
        id: 'so_d07_01',
        text: '약초·천 등 의료 제작 재료 확보',
        textEn: 'Gather herbs, cloth, or other medical components',
        hint: '레시피 재료를 인벤토리에서 확인',
      },
      {
        id: 'so_d07_02',
        text: '의료 카테고리 아이템 1개 제작',
        textEn: 'Craft 1 medical-category item',
        match: { type: 'craft_item', category: 'medical', count: 1 },
      },
      {
        id: 'so_d07_03',
        text: '진료 요청 증상에 맞춘 약 만들기 (보너스)',
        textEn: 'Match the prescription request for the golden-time bonus',
        hint: '간호사 진료 요청서의 증상 → 약품 매칭 확인',
      },
    ],
    actionHint: '간호사가 건넨 진료 요청서를 펼치고 증상에 맞는 의료 아이템 1개를 제작.',
    actionHintEn: 'Open the nurse\'s prescription card and craft a medical item that matches the symptom.',
  },

  mq_doctor_08: {
    id: 'mq_doctor_08', title: '원정 의료 물자 제작',
    desc: '세브란스 원정을 위해 의료 아이템 3개를 직접 제작하라. 📋 진료 요청과 일치하는 약품 포함 시 골든 타임 보너스.',
    icon: '⚗️', characterId: 'doctor', dayTrigger: 15, prerequisite: 'mq_doctor_07',
    objective: { type: 'craft_item', category: 'medical', count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'painkiller', qty: 2 }, { definitionId: 'first_aid_kit', qty: 1 }] },
    prescriptionOptions: {
      severe_wound: 'first_aid_kit',
      poisoning:    'antidote',
      acute_pain:   'painkiller',
    },
    prescriptionLabels: {
      severe_wound: '중상 환자 (구급키트 필요)',
      poisoning:    '독성 노출 (해독제 필요)',
      acute_pain:   '급성 통증 (진통제 필요)',
    },
    bonusCondition: { type: 'prescriptionMatch' },
    bonusReward: {
      label: '원정 진료 대응 — 군 의무대 수준 배낭.',
      morale: 8,
      items: [{ definitionId: 'antibiotics', qty: 1 }, { definitionId: 'stimulant', qty: 1 }],
      flags: { doctor_prescription_08_success: true },
    },
    failPenalty: { morale: -5 }, deadlineDays: 15,
    narrative: {
      start: '신촌 세브란스까지 — 강남에서 마포까지 버틸 의료 배낭을 직접 꾸려야 한다. 수집이 아니라 제작이다. 간호사가 진료 요청서를 들고 왔다 — 이번엔 중상 환자용 대응 약품. 증상에 맞는 특수 약품이 1개라도 포함되면 원정 배낭이 한 단계 격상된다.',
      complete: '손수 제작한 의료 아이템 3종이 배낭에 정리됐다. 진통제와 구급키트도 여분으로 챙겼다. 이제 출발할 수 있다.',
      completeBonus: '증상에 맞춘 특수 약품이 배낭 최상단에 들어갔다. 강민준 군의관이 무전을 다시 보낸다 — "민간 전문의가 그런 판단을 한다면 우리도 받아들일 준비가 됐습니다." 항생제와 각성제까지 보너스로 확보됐다.',
    },
    companionEpilogue: {
      default: '박상훈 하사: "선생님, 배낭 무게 감당 되십니까? 제가 선봉에 설게요 — 적어도 소독약 상자는 제가 들고 갑니다."',
      success: '박상훈 하사: "민간 전문의의 판단이 군의관 무전까지 움직이는군요. 선생님 뒤로 경계 서겠습니다. 강민준 군의관께 선생님 쪽이 본진이라 전달해도 되겠습니까?"',
    },
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_boramae_hospital',
      note: '보라매 약품 창고에서 원정 배낭 3종 제작',
      noteEn: 'Craft 3 expedition supplies at the Boramae pharmacy',
    },
    subObjectives: [
      {
        id: 'so_d08_01',
        text: '추가 재료(약초·천·잔여 약품) 보강',
        textEn: 'Top up materials — herbs, cloth, residual medicines',
        hint: '제작 3회분 재료 확보',
      },
      {
        id: 'so_d08_02',
        text: '의료 카테고리 아이템 3개 제작',
        textEn: 'Craft 3 medical-category items',
        match: { type: 'craft_item', category: 'medical', count: 3 },
      },
      {
        id: 'so_d08_03',
        text: '중상·독성·급통 진료 요청 1건 이상 매칭 (보너스)',
        textEn: 'Match at least one prescription (severe wound / poisoning / acute pain) for bonus',
        hint: '진료 요청서 카드의 증상 → 특수 약품 1종 포함',
      },
    ],
    actionHint: '제작대를 3회 사용해 의료 아이템을 채워 넣고, 가능한 한 진료 요청에 맞는 특수 약품 1종을 포함.',
    actionHintEn: 'Run the crafting bench 3 times for medical items; include one specialty match if possible.',
  },

  mq_doctor_09: {
    id: 'mq_doctor_09', title: '홍대 약국 경유',
    desc: '마포구 홍대 약국가를 통과하며 다음 행선지의 단서를 줍는다.',
    icon: '🗺️', characterId: 'doctor', dayTrigger: 18, prerequisite: 'mq_doctor_08',
    objective: { type: 'visit_district', districtId: 'mapo', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 1 }, { definitionId: 'antidote', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 20,
    narrative: {
      start: '마포구 홍대. 약국이 늘어선 거리다. 세브란스는 여기서 강만 건너면 닿는다 — 그렇게 믿고 떠나온 길이다.',
      complete: '약국 뒷창고에서 소독약과 해독제, 그리고 메모 한 장. "약사 한소희. 세브란스는 비었다. 서울대 연구소로 간다." 같은 순간 용산 쪽 무전이 잡힌다. "군의관 강민준. 의사를 찾습니다." 두 손이 동시에 손짓한다. 둘 다 잡을 수는 없다는 걸, 이지수는 메모를 접으며 알았다.',
    },
    locationHint: {
      districtId: 'mapo',
      note: '마포구 홍대 — 약국 뒷창고 라인 우선 탐색',
      noteEn: 'Mapo — sweep the Hongdae pharmacy back rooms first',
    },
    subObjectives: [
      {
        id: 'so_d09_01',
        text: '동작구→마포구 이동 동선 확보',
        textEn: 'Plot a route from Dongjak into Mapo',
        hint: '지구 이동 카드 사용',
      },
      {
        id: 'so_d09_02',
        text: '마포구 홍대 약국가 진입',
        textEn: 'Enter the Hongdae pharmacy district in Mapo',
        match: { type: 'visit_district', districtId: 'mapo' },
      },
    ],
    actionHint: '의료 배낭을 챙긴 뒤 마포구로 이동. 홍대 약국 라인을 우선 탐색해 한소희 메모와 강민준 무전을 확인.',
    actionHintEn: 'Grab the expedition pack, move to Mapo, sweep the Hongdae pharmacy line for Sohee\'s note and Minjun\'s radio call.',
  },

  mq_doctor_10: {
    id: 'mq_doctor_10', title: '자기 처방',
    desc: '이동 중 상처가 났다. 의료 아이템 1개를 직접 제작해 스스로를 치료하라.',
    icon: '🧴', characterId: 'doctor', dayTrigger: 21, prerequisite: 'mq_doctor_09',
    objective: { type: 'craft_item', category: 'medical', count: 1 },
    reward: { morale: 8, items: [{ definitionId: 'antiseptic', qty: 1 }, { definitionId: 'stimulant', qty: 1 }] },
    failPenalty: { morale: -3 }, deadlineDays: 22,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '한소희와 서울대로 (합성을 얻고, 통제권을 잃는다)',
        desc: '관악 약학연구소의 합성 장비와 한소희의 손을 얻는다. 대신 연구의 방향은 한소희가 쥔다 — 무엇을 만들지, 누구에게 먼저 쓸지 당신이 정하지 못한다. 군의 보호도, 0번 환자 표본도 포기한다.',
        setsFlag: 'doctor_branch_a',
        recruitNpc: 'npc_sohee',
      },
      {
        label: '강민준과 용산으로 (안전을 얻고, 연구를 잃는다)',
        desc: '군의 보급로와 무장 경계를 얻어 살아남을 확률이 가장 높다. 대신 우선순위는 부상 군인이지 백신이 아니다 — 치료 프로토콜 연구는 군의 일정에 밀려 멈춘다. 한소희의 합성 지식과 단독 백신의 길을 함께 닫는다.',
        setsFlag: 'doctor_branch_b',
        recruitNpc: 'npc_minjun',
      },
      {
        label: '보라매에 남는다 (백신을 얻고, 모든 손을 잃는다)',
        desc: '0번 환자 표본까지 밀어붙여 역병 백신 자체를 합성한다 — 셋 중 유일하게 원인을 끝낸다. 대신 협력자도, 보급도, 무장 경계도 전부 없다. 한소희와 강민준의 무전에 답하지 않는 순간, 두 사람은 당신 없이 떠난다.',
        setsFlag: 'doctor_branch_c',
        warning: '고난이도 — 협력자 없이 40일 이상 단독 생존해야 하며, 0번 환자(보스)와 대면해야 한다.',
      },
    ],
    narrative: {
      start: '유리 파편에 손을 베었다. 의사가 감염으로 쓰러지면 안 된다. 다른 이의 약을 빌릴 수 없다 — 내 손으로 처방해야 한다. 이 한 개의 약이 앞으로의 정체성을 증명한다.',
      complete: '자기 처방으로 상처를 다스렸다. 비상용 각성제와 소독약이 추가로 확보됐다. 세 갈래가 동시에 손짓한다 — 한소희의 합성 장비, 강민준의 보급로, 그리고 아무도 없는 보라매의 연구대. 어느 하나를 잡는 순간 나머지 둘은 닫힌다. 이지수는 베인 손을 폈다. 무엇을 끝내고 싶은지부터 정해야 했다.',
    },
    locationHint: {
      districtId: 'mapo',
      note: '현재 위치(마포 인근) — 휴대 제작대로 즉석 처방',
      noteEn: 'On the move (around Mapo) — craft on the portable bench',
    },
    subObjectives: [
      {
        id: 'so_d10_01',
        text: '자기 상처 응급 처치 재료 확인',
        textEn: 'Check materials for self-treatment',
        hint: '약초·천·증류수 등',
      },
      {
        id: 'so_d10_02',
        text: '의료 카테고리 아이템 1개 직접 제작',
        textEn: 'Personally craft 1 medical-category item',
        match: { type: 'craft_item', category: 'medical', count: 1 },
      },
      {
        id: 'so_d10_03',
        text: '제작한 약으로 자기 처방 (분기 선택 직전)',
        textEn: 'Self-administer the crafted medicine before choosing a branch',
        hint: '완성된 약을 본인 카드에 사용',
      },
    ],
    actionHint: '이동 중에도 제작대를 열어 약 1개를 직접 만들고, 본인에게 사용한 뒤 분기 선택지로 진행.',
    actionHintEn: 'Open the bench mid-route, craft a single medicine, self-apply it, then proceed to the branching choice.',
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
    locationHint: {
      districtId: 'dongjak',
      landmarkId: 'lm_dongjak',
      note: '동작구 국립현충원 경비초소 라인',
      noteEn: 'Dongjak — Seoul National Cemetery guard post line',
    },
    subObjectives: [
      {
        id: 'so_dss_01',
        text: '박상훈 하사 동행 준비 (진료 가방·구급키트)',
        textEn: 'Pack the medical bag and first aid kit before leaving with Sgt. Park',
        hint: '동행 NPC가 따라오는지 확인',
      },
      {
        id: 'so_dss_02',
        text: '동작구 국립현충원 진입',
        textEn: 'Enter Dongjak — Seoul National Cemetery',
        match: { type: 'visit_district', districtId: 'dongjak' },
      },
      {
        id: 'so_dss_03',
        text: '소대 인식표 흔적 수습 후 무전 청취',
        textEn: 'Recover squad dog tags and listen for the radio call',
        hint: '서사 진행 — 자동 갱신',
      },
    ],
    actionHint: '박상훈 하사를 데리고 동작구 현충원으로 이동, 경비초소 카드를 따라가며 무전을 들을 것.',
    actionHintEn: 'Travel to Seoul National Cemetery in Dongjak with Sgt. Park; follow the guard post cards for the radio cue.',
  },

  mq_doctor_side_early: {
    id: 'mq_doctor_side_early', title: '임상 지식 — 감염 추적',
    desc: '감염 수치 5 이상인 상태로 3일 연속 버티며 증상 진행을 관찰하라.',
    icon: '🛡️', characterId: 'doctor', dayTrigger: 3, prerequisite: 'mq_doctor_01',
    objective: { type: 'survive_infection', minInfection: 5, count: 3 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 2 }, { definitionId: 'herb', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 15,
    narrative: {
      start: '이지수의 수첩에 적힌 메모: "임상 지식은 이론이 아닌 관찰이다. 내 몸의 감염 수치를 낮게 유지하면서 초기 증상을 3일간 기록할 것." 감염 -25% 특성을 체감으로 확인할 시간이다.',
      complete: '3일간의 관찰 기록이 완성됐다. 보통 사람이라면 벌써 중증으로 번졌을 감염 수치가 여전히 낮게 유지됐다. "임상 지식 — 내 몸이 곧 표본이다." 이지수는 스스로의 저항력을 수치로 확인했다.',
    },
    locationHint: {
      note: '거점 어디서나 — 본인 상태창 감염 수치 추적',
      noteEn: 'Anywhere — track your own infection meter on the status panel',
    },
    subObjectives: [
      {
        id: 'so_dse_01',
        text: '본인 감염 수치 5 이상 유지',
        textEn: 'Keep your own infection level at 5 or higher',
        hint: '소독약을 너무 빨리 쓰지 말 것',
      },
      {
        id: 'so_dse_02',
        text: '3일 연속 증상 진행 관찰',
        textEn: 'Observe symptom progression for 3 consecutive days',
        hint: '하루가 지나도 의사 특성으로 안정 유지',
      },
      {
        id: 'so_dse_03',
        text: '수첩에 임상 기록 정리',
        textEn: 'Write up clinical notes in the journal',
        hint: '서사 진행 — 자동 갱신',
      },
    ],
    actionHint: '감염 수치를 일부러 5 이상으로 두고 3일을 버티며, 의사 특성의 -25% 저항을 체감으로 확인.',
    actionHintEn: 'Hold your infection at 5+ for three days to feel the doctor\'s -25% resistance trait in action.',
  },

  mq_doctor_side_hygiene: {
    id: 'mq_doctor_side_hygiene', title: '날씨는 약이다 — 현장 위생',
    desc: '빗물 샤워 또는 눈 압박(젖은 천 카드 액션)을 1회 수행하라. 의사의 자기 위생은 곧 환자의 안전이다.',
    icon: '🌧️', characterId: 'doctor', dayTrigger: 5, prerequisite: 'mq_doctor_01',
    objective: { type: 'trigger_combo', comboIds: ['sc_rain_shower', 'sc_snow_compress'], count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 2 }, { definitionId: 'herb', qty: 2 }] },
    failPenalty: { morale: -3 }, deadlineDays: 35,
    narrative: {
      start: '이지수의 수첩: "보급이 끊긴 현장에서 의사의 무기는 장비가 아니라 습관이다. 비가 오면 젖은 천으로 몸을 씻고, 눈이 오면 그 냉기로 상처를 눌러라. 날씨는 약이다." 젖은 천을 카드 액션으로 사용해 빗물 샤워를 시도해 볼 것.',
      complete: '처음으로 빗속에서 몸을 씻었다. 감염 수치가 떨어지고 사기가 돌아왔다 — 의사의 손길이 자신에게 먼저 닿는다. 이제 환자 앞에서도 당당히 장갑을 낄 수 있다. 약초와 소독약도 수첩 사이에서 발견됐다.',
    },
    locationHint: {
      note: '비 또는 눈이 오는 날 — 야외 또는 옥상 카드',
      noteEn: 'On a rainy or snowy day — outdoor or rooftop tile',
    },
    subObjectives: [
      {
        id: 'so_dsh_01',
        text: '젖은 천 카드 또는 빗물 받침 준비',
        textEn: 'Have a wet cloth or rain catcher ready',
        hint: '인벤토리·제작 카드 확인',
      },
      {
        id: 'so_dsh_02',
        text: '비 또는 눈 날씨 대기',
        textEn: 'Wait for rain or snow weather',
        hint: '날씨 변화는 자동 — TP 진행으로 유도',
      },
      {
        id: 'so_dsh_03',
        text: '빗물 샤워 또는 눈 압박 콤보 1회 실행',
        textEn: 'Trigger the rain shower or snow compress combo once',
        hint: '젖은 천을 본인 카드에 사용해 빗물 샤워 또는 눈 압박 콤보 발동',
      },
    ],
    actionHint: '비 또는 눈이 오는 날 젖은 천을 본인에게 사용해 위생 콤보 1회 발동.',
    actionHintEn: 'On a rainy or snowy day, use a wet cloth on yourself to trigger the hygiene combo once.',
  },

  mq_doctor_side_01: {
    id: 'mq_doctor_side_01', title: '감염 패턴 추적',
    desc: '감염자 10마리를 처치하며 감염 진행 단계를 관찰하라.',
    icon: '🧫', characterId: 'doctor', dayTrigger: 22,
    prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',
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
    icon: '🩺', characterId: 'doctor', dayTrigger: 25,
    prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',
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
    icon: '🗺️', characterId: 'doctor', dayTrigger: 30,
    prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',
    objective: { type: 'visit_district', districtId: 'junggoo', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'antidote', qty: 1 }, { definitionId: 'herb', qty: 3 }] },
    failPenalty: { morale: -8 }, deadlineDays: 50,
    narrative: {
      start: '감염은 어디서 시작됐을까. 서울역 — 하루 수십만이 지나던 교통의 심장. 0번 환자의 동선과 겹칠 가능성이 가장 높다. 직접 들어가 보는 수밖에 없다.',
      complete: '서울역 대합실에 들어섰다. 시신은 중심에서 바깥으로 퍼진 자국을 남겼다 — 첫 관찰을 수첩에 옮겼다. 질병관리청 명찰이 붙은 메모 한 장, 해독제 샘플, 약초를 챙겨 나왔다. 조사는 이제 시작이다.',
    },
  },

  mq_doctor_side_04: {
    id: 'mq_doctor_side_04', title: '격리 거점 구축',
    desc: '감염자 격리를 위한 의료 아이템 3개를 제작하라.',
    icon: '⚗️', characterId: 'doctor', dayTrigger: 35,
    prerequisite: 'mq_doctor_10', requiresFlag: 'doctor_branch_c',
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
    icon: '🧪', characterId: 'doctor', dayTrigger: 45,
    prerequisite: 'mq_doctor_side_01', requiresFlag: 'doctor_branch_c',
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
    icon: '🏥', characterId: 'doctor', dayTrigger: 50,
    prerequisite: 'mq_doctor_side_04', requiresFlag: 'doctor_branch_c',
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

  // ── Sprint 5: 시크릿 엔딩 — 역병 백신 합성 ─────────────────

  mq_doctor_side_end: {
    id: 'mq_doctor_side_end', title: '역병의 종결 — 백신 합성',
    desc: '0번 환자 혈액 표본으로 역병 백신을 직접 합성하라. (C루트 단독 연구의 종착점)',
    icon: '💠', characterId: 'doctor', dayTrigger: 55,
    prerequisite: 'mq_doctor_side_05', requiresFlag: 'doctor_branch_c',
    objective: { type: 'craft_item', definitionId: 'plague_vaccine', count: 1 },
    reward: { morale: 35, items: [
      { definitionId: 'universal_cure', qty: 1 },
      { definitionId: 'surgery_kit',    qty: 1 },
    ], flags: {
      doctor_vaccine_synthesized:    true,
      doctor_secret_ending_unlocked: true,
      mainQuestComplete_doctor:      true,
      doctor_ending:                 'c_vaccine',
    } },
    failPenalty: { morale: -15 }, deadlineDays: 90,
    narrative: {
      start: '0번 환자의 심장 조직 샘플. 현미경 너머로 항원 구조가 드러난다 — 인간이 만든 바이러스가 아니다. 그러나 의사의 손이 닿는 한, 만들지 못할 백신도 없다. 광범위 항생제와 농축 혈청, 그리고 감염 혈액 표본. 합성의 마지막 단계다.',
      complete: '첫 번째 역병 백신. 유리병 속 은은한 빛. 이지수는 자신의 팔에 주사했다. 손끝의 떨림이 멈췄다. "이제 끝낼 수 있다." 서울의 어느 의사가 인류를 구했다 — 기록되지 않을 수도 있는, 그러나 진실한 승리.',
    },
  },
};

export default DOCTOR_SHARED;
