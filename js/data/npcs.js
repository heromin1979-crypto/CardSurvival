// === NPC DEFINITIONS ===
// 8 NPCs: spawn conditions, dialogues by trust level, companion stats, trade offers.
// Trust: 0-5 (0 = stranger, 5 = devoted). Each interaction can raise/lower trust.
// NPC item defs are registered in window.__GAME_DATA__.items by NPCSystem.

// ── NPC Card Item Definitions (type: 'npc') ─────────────────────
// Registered at boot so CardFactory can render them.
export const NPC_ITEMS = {
  npc_old_survivor: {
    id: 'npc_old_survivor', name: '늙은 생존자', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👴', description: '경험 많은 노인. 조심스럽지만 유용한 힌트를 준다.',
    tags: ['npc'], dismantle: [],
  },
  npc_nurse: {
    id: 'npc_nurse', name: '간호사', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👩‍⚕️', description: '전직 응급실 간호사. 치료 능력이 뛰어나다.',
    tags: ['npc'], dismantle: [],
  },
  npc_wounded_soldier: {
    id: 'npc_wounded_soldier', name: '박상훈 하사', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩹', description: '국립현충원 경비소대 소속 하사(25세). 감염자 무리에 포위돼 소대원을 잃고 보라매병원으로 도주, 응급실에서 쓰러졌다. 완치하면 든든한 전우가 된다.',
    tags: ['npc'], dismantle: [],
  },
  npc_soldier_deserter: {
    id: 'npc_soldier_deserter', name: '탈영병', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪖', description: '군대를 떠난 전투 전문가. 강하지만 시끄럽다.',
    tags: ['npc'], dismantle: [],
  },
  npc_child: {
    id: 'npc_child', name: '아이', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👧', description: '부모를 잃은 어린 아이. 전투력은 없지만 마음의 위안이 된다.',
    tags: ['npc'], dismantle: [],
  },
  npc_mechanic: {
    id: 'npc_mechanic', name: '정비사', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '자동차 정비사 출신. 제작과 수리에 능하다.',
    tags: ['npc'], dismantle: [],
  },
  npc_trader: {
    id: 'npc_trader', name: '떠돌이 상인', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧳', description: '위험을 무릅쓰고 서울을 횡단하며 물건을 거래하는 상인.',
    tags: ['npc'], dismantle: [],
  },
  npc_student: {
    id: 'npc_student', name: '대학생', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '📖', description: '서울대 생존 학생. 학습 능력이 뛰어나다.',
    tags: ['npc'], dismantle: [],
  },
  npc_dog: {
    id: 'npc_dog', name: '떠돌이 개', type: 'npc',
    rarity: 'common', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🐕', description: '충성스러운 떠돌이 개. 적은 식량으로도 든든한 동반자.',
    tags: ['npc'], dismantle: [],
  },
  npc_former_colleague: {
    id: 'npc_former_colleague', name: '전 건설 동료', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👷', description: '최형식의 옛 건설사 직원. 오래된 채무와 미안함을 함께 갖고 있다.',
    tags: ['npc'], dismantle: [],
  },
  // ── 스토리 분기 동반자 NPC ────────────────────────────────────────
  npc_minjun: {
    id: 'npc_minjun', name: '강민준 군의관', type: 'npc',
    rarity: 'epic', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🪖', description: '용산 기지 출신 군의관. 전투 전문가이자 야전 의료 전문가.',
    tags: ['npc'], dismantle: [],
  },
  npc_sohee: {
    id: 'npc_sohee', name: '한소희 약사', type: 'npc',
    rarity: 'epic', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '💊', description: '홍대 약국 원장. 항바이러스 합성 전문가.',
    tags: ['npc'], dismantle: [],
  },
  npc_jisu: {
    id: 'npc_jisu', name: '이지수 의사', type: 'npc',
    rarity: 'epic', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🩺', description: '삼성병원 응급의학과 전문의. 치료 프로토콜 개발자.',
    tags: ['npc'], dismantle: [],
  },
  npc_yeongcheol: {
    id: 'npc_yeongcheol', name: '박영철 소방관', type: 'npc',
    rarity: 'epic', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🚒', description: '용산 소방서 소방위. 구조 전문가이자 리더.',
    tags: ['npc'], dismantle: [],
  },
  npc_daehan: {
    id: 'npc_daehan', name: '정대한 기계공', type: 'npc',
    rarity: 'epic', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '성수동 금속 가공 공장 기술 이사. 무엇이든 만들고 고친다.',
    tags: ['npc'], dismantle: [],
  },
  // ── 롯데타워 NPC (최형식 Branch B) ─────────────────────────────────
  npc_tower_security: {
    id: 'npc_tower_security', name: '경비대장 김정호', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🛡️', description: '전직 타워 경비 책임자. 40대. 냉정하지만 공정하다.',
    tags: ['npc'], dismantle: [],
  },
  npc_tower_merchant: {
    id: 'npc_tower_merchant', name: '떠돌이 상인 이해진', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🎒', description: '잠실 일대를 돌며 물자를 교환하는 35세 상인.',
    tags: ['npc'], dismantle: [],
  },
  npc_tower_cook: {
    id: 'npc_tower_cook', name: '주방장 박수미', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👩‍🍳', description: '롯데타워 레스토랑 출신 주방장. 50대. 남은 재료로도 맛을 낸다.',
    tags: ['npc'], dismantle: [],
  },
  npc_tower_engineer: {
    id: 'npc_tower_engineer', name: '정비공 한지성', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🔧', description: '타워 설비 정비공. 28세. 끊긴 전력과 배관을 되살리려 한다.',
    tags: ['npc'], dismantle: [],
  },
  npc_tower_doctor: {
    id: 'npc_tower_doctor', name: '의사 최지윤', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👩‍⚕️', description: '타워 임시 진료소를 운영하는 33세 의사. 차분하고 현실적이다.',
    tags: ['npc'], dismantle: [],
  },
  // ── 셰프 팀 NPC (Phase 4) ───────────────────────────────────────
  npc_sous_chef: {
    id: 'npc_sous_chef', name: '부주방장 박민호', type: 'npc',
    rarity: 'rare', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧑‍🍳', description: '명동 소피텔 호텔 부주방장. 윤재혁의 옛 동료. 29세. 칼솜씨와 리더십.',
    tags: ['npc'], dismantle: [],
  },
  npc_kitchen_helper: {
    id: 'npc_kitchen_helper', name: '주방 보조 김지은', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👩‍🍳', description: '요리사 꿈을 꿨던 22세 학생. 남대문시장에서 만난 열정 가득한 주방 보조.',
    tags: ['npc'], dismantle: [],
  },

  // ── 보라매 응급실 잔류 환자 (Day 2~7 이지수 전용 이벤트) ────────
  npc_er_patient_child: {
    id: 'npc_er_patient_child', name: '응급실 소년', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🧒', description: '보라매 응급실 침대에 남겨진 겁에 질린 초등학생. 다리에 깊은 열상.',
    tags: ['npc'], dismantle: [],
  },
  npc_er_patient_elder: {
    id: 'npc_er_patient_elder', name: '응급실 노인', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '👴', description: '응급실 구석에서 신음하는 고령 환자. 탈수와 감염 위험이 높다.',
    tags: ['npc'], dismantle: [],
  },
  npc_er_patient_civilian: {
    id: 'npc_er_patient_civilian', name: '응급실 시민', type: 'npc',
    rarity: 'uncommon', weight: 0, stackable: false, maxStack: 1,
    defaultDurability: 100, defaultContamination: 0,
    icon: '🤕', description: '대피 직전 응급실에 들이닥친 젊은 시민. 복부 자상으로 움직이지 못한다.',
    tags: ['npc'], dismantle: [],
  },
};

// ── NPC Data Definitions ────────────────────────────────────────
const NPCS = {

  npc_old_survivor: {
    id: 'npc_old_survivor',
    personality: 'cautious',  // timid | cautious | neutral | brave | loyal
    maxHp: 35,
    spawnDistrict: 'gangbuk',
    spawnDay: 10,
    // Dialogue lines indexed by trust tier: [0-1], [2-3], [4-5]
    dialogues: {
      greet:  ['npc.old.greet0', 'npc.old.greet1', 'npc.old.greet2'],
      hint:   ['npc.old.hint0', 'npc.old.hint1', 'npc.old.hint2'],
      reject: 'npc.old.reject',
    },
    trustGainPerTalk: 1,
    // Companion bonuses (applied while in party)
    companion: {
      canRecruit:   true,
      recruitTrust: 3,          // minimum trust to recruit
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.1,
      lonelinessReduction: 0.2,
      noiseAdd:     0,
      foodCostPerDay: 0.3,      // nutrition drain per TP
      skillBonus:   null,
    },
    gifts: [
      { trust: 2, itemId: 'bandage', qty: 2 },
      { trust: 4, itemId: 'canned_food', qty: 1 },
    ],
    trades: null,
    // V-2: 동반자 자율 수집
    forageItems: [
      { id: 'wild_herb',    chance: 0.4, qty: 1 },
      { id: 'clean_water',  chance: 0.2, qty: 1 },
    ],
    // V-2: 선제 대사 (상황별)
    spontaneous: [
      { condition: 'low_hp',        line: '"많이 다쳤구나. 잠깐 쉬어야 해."' },
      { condition: 'low_nutrition', line: '"배고프지? 내 거 조금 나눠줄게."' },
      { condition: 'always',        line: '"이 길은 내가 잘 알아. 따라와."' },
    ],
    // V-4: 신뢰 5 달성 시 스킬 전수
    trustEvents: [
      {
        trust: 5,
        id:      'old_trust_5',
        message: '👴 노인이 수십 년의 생존 지혜를 전수해줬다. 모든 통계 소모 -5% 영구 적용.',
        effect:  { skillTeach: { skillId: 'survivor_wisdom', value: 0.05 } },
      },
    ],
    // V-3: 퀘스트 체인
    quests: [
      {
        id:           'old_quest_grandson',
        triggerTrust: 0,
        title:        '손자의 소식',
        description:  '"내 손자가 노원구 어딘가에 있다고 했어. 소식 좀 알아봐줄 수 있어?"',
        steps: [
          { type: 'visit', locationId: 'nowon', hint: '노원구를 탐색하면 단서를 찾을 수 있다.' },
        ],
        reward: { trust: 3, items: [{ id: 'canned_food', qty: 5 }, { id: 'bandage', qty: 3 }], skillUnlock: null },
      },
      {
        id:           'old_quest_map_north',
        triggerTrust: 3,
        title:        '피난길 지도',
        description:  '"자네가 날 도와줬으니 내 것을 줘야지. 이 강북 지도, 가져가게. 남쪽 지도는 탈영병한테 물어봐."',
        steps: [
          { type: 'day', minDay: 5, hint: '노인과 충분한 시간을 보내면 믿음이 생긴다.' },
        ],
        reward: { trust: 1, items: [{ id: 'map_fragment_north', qty: 1 }], skillUnlock: null },
      },
    ],
    // V-5: 기념일
    specialDays: [
      { day: 10, message: '👴 노인과 함께한 지 10일. "자네 믿어도 되겠구먼."', effect: { trust: 1 } },
      { day: 30, message: '👴 함께 30일을 버텼다. 노인이 조용히 고마움을 전했다.', effect: { morale: 15 } },
    ],
  },

  npc_nurse: {
    id: 'npc_nurse',
    personality: 'brave',
    maxHp: 100,
    spawnDistrict: 'dongjak',
    spawnDay: 1,
    dialogues: {
      greet:  ['npc.nurse.greet0', 'npc.nurse.greet1', 'npc.nurse.greet2'],
      hint:   ['npc.nurse.hint0', 'npc.nurse.hint1', 'npc.nurse.hint2'],
      reject: 'npc.nurse.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    1.5,        // +150% heal effectiveness
      craftBonus:   0,
      moralBonus:   0.15,
      lonelinessReduction: 0.25,
      noiseAdd:     0,
      foodCostPerDay: 0.4,
      skillBonus:   { medicine: 0.3 },
      combatDmgReduce: 0.10,   // 적 피해 10% 감소
      tauntChance:     0.15,   // 15% 확률로 적 공격을 대신 받음
    },
    gifts: [
      { trust: 1, itemId: 'bandage', qty: 3 },
      { trust: 3, itemId: 'first_aid_kit', qty: 1 },
    ],
    trades: null,
    forageItems: [
      { id: 'antiseptic',    chance: 0.35, qty: 1 },
      { id: 'bandage',       chance: 0.25, qty: 1 },
    ],
    spontaneous: [
      { condition: 'low_hp',        line: '"상처 보여줘. 내가 처치해줄게."' },
      { condition: 'low_nutrition', line: '"영양 상태가 안 좋아. 뭔가 찾아야 해."' },
      { condition: 'doctor_low_infection', line: '"선생님… 감염 수치가 놀랄 만큼 낮아요. 임상 지식이 단순한 이론이 아니었네요."' },
      { condition: 'always',        line: '"감염 조심해. 요즘 바이러스 변종이 심해."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'nurse_trust_5',
        message: '👩‍⚕️ 간호사가 응급처치 기술을 전수해줬다. 회복 아이템 효율 +15% 영구 적용.',
        effect:  { skillTeach: { skillId: 'field_medicine', value: 0.15 } },
      },
    ],
    quests: [
      {
        id:           'nurse_quest_wounded_soldier',
        triggerTrust: 0,
        title:        '부상당한 군인 치료',
        description:  '"저기 쓰러진 군인 봤지? 붕대와 소독약으로 응급처치를 해야 해. 도와줘!"',
        steps: [
          { type: 'treat_npc', npcId: 'npc_wounded_soldier', hint: '붕대와 소독약을 사용해 부상 군인을 치료한다.' },
        ],
        reward: { trust: 2, items: [{ id: 'first_aid_kit', qty: 1 }], skillUnlock: null },
      },
      {
        id:           'nurse_quest_emergency',
        triggerTrust: 2,
        title:        '응급 환자 발생',
        description:  '"동작구에서 부상자들이 몰려와. 응급 키트와 붕대가 대량으로 필요해."',
        steps: [
          { type: 'collect', itemId: 'bandage',       qty: 5, hint: '병원·약국에서 주로 발견됨.' },
          { type: 'collect', itemId: 'first_aid_kit', qty: 2, hint: '경찰서·병원 구급함.' },
          { type: 'visit',   districtId: 'dongjak',    hint: '동작구 삼성병원 응급실 방문.' },
        ],
        reward: { trust: 1, items: [{ id: 'antibiotics', qty: 2 }, { id: 'antiseptic', qty: 3 }], skillUnlock: { skillId: 'medicine', value: 0.2 } },
      },
      {
        id:           'nurse_quest_credentials',
        triggerTrust: 3,
        title:        '간호사 자격증 복원',
        description:  '"세브란스 인사 기록실에 내 자격증 사본이 있어. 함께 가서 찾아줬으면 해."',
        steps: [
          { type: 'visit',   districtId: 'seodaemun',   hint: '세브란스병원은 서대문구에 있다.' },
          { type: 'collect', itemId: 'map_fragment',    qty: 1, hint: '기록실 캐비닛에서 발견된 문서.' },
          { type: 'craft',   category: 'medical',       qty: 2, hint: '자격증 복원 후 의료품 2개 제작.' },
        ],
        reward: { trust: 1, items: [{ id: 'surgery_kit', qty: 1 }], skillUnlock: { skillId: 'medicine', value: 0.3 } },
      },
      {
        id:           'nurse_quest_team',
        triggerTrust: 4,
        title:        '의료팀 구성',
        description:  '"혼자서는 한계가 있어. 다른 생존자 중에 도울 만한 사람이 있다면 함께 해야 해."',
        steps: [
          { type: 'recruit', qty: 1, hint: '아무 NPC 동반자 한 명을 영입한다.' },
          { type: 'survive', days: 30, hint: '팀과 함께 30일을 버틴다.' },
          { type: 'craft',   category: 'medical', qty: 5, hint: '의료품 5개 제작.' },
        ],
        reward: { trust: 2, items: [{ id: 'first_aid_kit', qty: 3 }, { id: 'antibiotics', qty: 3 }] },
      },
      {
        id:           'nurse_quest_clinic',
        triggerTrust: 5,
        title:        '대규모 진료소 개설',
        description:  '"이제 우리는 진짜 진료소를 열 수 있어. 설비와 환자, 그리고 시간만 있으면."',
        steps: [
          { type: 'craft',   category: 'structure', qty: 3, hint: '의료 구조물 3개 (medical_station 등).' },
          { type: 'treat',   qty: 10,                hint: 'NPC 총 10회 치료.' },
          { type: 'survive', days: 60,               hint: '진료소 안정화 60일.' },
        ],
        reward: { trust: 3, items: [{ id: 'first_aid_kit', qty: 5 }], flag: 'nurse_clinic_open' },
      },
    ],
    specialDays: [
      { day: 7,  message: '👩‍⚕️ "같이 있으니 안심이야." 간호사가 처음으로 웃었다.', effect: { morale: 10 } },
      { day: 30, message: '👩‍⚕️ 한 달을 버텼다. 간호사가 몰래 약을 챙겨줬다.', effect: { trust: 1 } },
    ],
  },

  npc_wounded_soldier: {
    id: 'npc_wounded_soldier',
    personality: 'stoic',
    maxHp: 100,
    spawnDistrict: 'dongjak',
    spawnDay: 1,
    dialogues: {
      greet:  ['npc.wounded_soldier.greet0', 'npc.wounded_soldier.greet1'],
      hint:   ['npc.wounded_soldier.hint0'],
      reject: 'npc.wounded_soldier.reject',
    },
    trustGainPerTalk: 0,
    backstory: '국립현충원 경비소대 소속. 감염자 무리에 포위돼 소대원을 잃고 혼자 보라매병원으로 도주했다.',
    // 부상 상태: woundLevel 3→0 치료 필요, 0이 되면 군인 NPC로 변환
    woundLevel: 3,
    woundHealItem: 'bandage',   // 치료에 필요한 아이템
    woundHealQty: 1,            // 1단계당 필요 수량 (붕대 1개 = 1/3 HP)
    companion: {
      canRecruit:   false,      // 치료 완료 전에는 동료 불가
      recruitTrust: 1,          // 완치 후 즉시 영입 가능
      combatDmg:    1.3,
      carryBonus:   3,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.10,
      lonelinessReduction: 0.20,
      noiseAdd:     2,
      foodCostPerDay: 0.5,
      skillBonus:   { melee: 0.2, defense: 0.15 },
      combatDmgReduce: 0.15,
      tauntChance:     0.20,
    },
    gifts: [
      { trust: 2, itemId: 'pistol_ammo', qty: 3 },
      { trust: 4, itemId: 'knife', qty: 1 },
    ],
    trades: null,
    forageItems: [
      { id: 'scrap_metal', chance: 0.3, qty: 2 },
      { id: 'bandage',     chance: 0.2, qty: 1 },
    ],
    spontaneous: [
      { condition: 'always', line: '"으... 소대원들이 다 죽었어... 나만 살아남았다."' },
      { condition: 'low_hp',  line: '"선생님... 붕대 좀 더 줘요. 상처가 벌어졌습니다."' },
    ],
    trustEvents: [
      {
        trust: 1,
        id:      'soldier_wounded_healed',
        message: '🪖 박상훈 하사가 눈을 떴다. "신촌에서 군 무전이 잡힌 적이 있습니다. 강민준 군의관… 의사를 찾고 있다고 했습니다." — 완치 시 1회 발화.',
        effect:  {},
      },
    ],
    quests: [],
    specialDays: [
      { day: 7, message: '🪖 박상훈이 조용히 말한다. "소대원 장례를 치르고 싶습니다. 현충원에 가야 합니다."', effect: { trust: 0 } },
    ],
  },

  npc_soldier_deserter: {
    id: 'npc_soldier_deserter',
    personality: 'brave',
    maxHp: 80,
    spawnDistrict: 'yongsan',
    spawnDay: 30,
    dialogues: {
      greet:  ['npc.soldier.greet0', 'npc.soldier.greet1', 'npc.soldier.greet2'],
      hint:   ['npc.soldier.hint0', 'npc.soldier.hint1', 'npc.soldier.hint2'],
      reject: 'npc.soldier.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 3,
      combatDmg:    1.4,        // +40% combat damage
      carryBonus:   5,          // +5 carry capacity
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.05,
      lonelinessReduction: 0.15,
      noiseAdd:     3,          // makes more noise
      foodCostPerDay: 0.7,      // eats a lot
      skillBonus:   { melee: 0.2, ranged: 0.2 },
    },
    gifts: [
      { trust: 2, itemId: 'pistol_ammo', qty: 5 },
      { trust: 4, itemId: 'combat_knife', qty: 1 },
    ],
    trades: null,
    forageItems: [
      { id: 'pistol_ammo', chance: 0.3, qty: 2 },
      { id: 'metal_scrap', chance: 0.4, qty: 3 },
    ],
    spontaneous: [
      { condition: 'low_hp',        line: '"그 정도 상처는 전장에서 긁힌 거지. 계속 움직여."' },
      { condition: 'low_nutrition', line: '"식량 부족. 보급 루트 다시 짜야 해."' },
      { condition: 'rain',          line: '"비. 이동하기엔 최악이지만 적도 움직이기 싫어한다."' },
      { condition: 'always',        line: '"경계 게을리하지 마. 살아남은 자가 이기는 거야."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'soldier_trust_5',
        message: '🪖 탈영병이 전투 훈련을 시켜줬다. 전투 피해 +10% 영구 적용.',
        effect:  { skillTeach: { skillId: 'combat_training', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'soldier_quest_base',
        triggerTrust: 0,
        title:        '구 부대 복귀 시도',
        description:  '"한 번만 부대 방향으로 가보고 싶어. 남아있는 무기라도 회수하게."',
        steps: [
          { type: 'visit', locationId: 'yongsan', hint: '용산 방향에 군 관련 시설이 있을 것이다.' },
        ],
        reward: { trust: 3, items: [{ id: 'pistol_ammo', qty: 10 }, { id: 'combat_knife', qty: 1 }], skillUnlock: null },
      },
      {
        id:           'soldier_quest_map_south',
        triggerTrust: 3,
        title:        '강남 군 보급창고',
        description:  '"강남 보급창고에 군용 지도가 남아있을 거야. 거기 다녀오면 내 거 줄게. 노인한테도 지도가 있다던데."',
        steps: [
          { type: 'visit', locationId: 'gangnam', hint: '강남구를 탐색하면 군 보급창고 흔적을 찾을 수 있다.' },
        ],
        reward: { trust: 1, items: [{ id: 'map_fragment_south', qty: 1 }], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 14, message: '🪖 "2주를 같이 버텼군. 전우라고 불러도 되겠어."', effect: { morale: 10 } },
      { day: 50, message: '🪖 탈영병이 조용히 경례를 했다. "당신은 내 마지막 부대야."', effect: { trust: 1 } },
    ],
  },

  npc_child: {
    id: 'npc_child',
    personality: 'timid',
    maxHp: 30,
    spawnDistrict: 'nowon',
    spawnDay: 20,
    dialogues: {
      greet:  ['npc.child.greet0', 'npc.child.greet1', 'npc.child.greet2'],
      hint:   ['npc.child.hint0', 'npc.child.hint1', 'npc.child.hint2'],
      reject: 'npc.child.reject',
    },
    trustGainPerTalk: 2,        // children trust faster
    companion: {
      canRecruit:   true,
      recruitTrust: 1,
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.3,        // high morale bonus
      lonelinessReduction: 0.4, // strong loneliness reduction
      noiseAdd:     1,
      foodCostPerDay: 0.2,      // low food cost
      skillBonus:   null,
    },
    gifts: [
      { trust: 1, itemId: 'cloth', qty: 1 },
    ],
    trades: null,
    forageItems: [
      { id: 'cloth',       chance: 0.35, qty: 1 },
      { id: 'wild_berry',  chance: 0.3,  qty: 2 },
    ],
    spontaneous: [
      { condition: 'low_hp',        line: '"아프지 마세요. 제발요."' },
      { condition: 'low_nutrition', line: '"배고파요. 오늘 먹을 거 있어요?"' },
      { condition: 'always',        line: '"저기 나비 봤어요? 아직 이런 것도 있네요."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'child_trust_5',
        message: '👧 아이가 행운의 돌멩이를 줬다. "아저씨 지켜줄 거야." 사기 +10 영구 적용.',
        effect:  { skillTeach: { skillId: 'lucky_charm', value: 0.05 } },
      },
    ],
    quests: [
      {
        id:           'child_quest_toy',
        triggerTrust: 0,
        title:        '잃어버린 인형',
        description:  '"저기 버려진 가게에 제 인형이 있어요. 찾아줄 수 있어요?"',
        steps: [
          { type: 'collect', itemId: 'cloth', qty: 2, hint: '천 조각을 모아 인형을 만들어줄 수 있다.' },
        ],
        reward: { trust: 2, items: [], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 7,  message: '👧 아이가 그림을 그려줬다. 당신과 아이가 함께 있다.', effect: { morale: 20 } },
      { day: 21, message: '👧 아이가 밤에 악몽을 꿨다. 곁에 있어줬다. 신뢰가 깊어졌다.', effect: { trust: 1 } },
    ],
  },

  npc_mechanic: {
    id: 'npc_mechanic',
    personality: 'neutral',
    maxHp: 55,
    spawnDistrict: 'guro',
    spawnDay: 25,
    dialogues: {
      greet:  ['npc.mech.greet0', 'npc.mech.greet1', 'npc.mech.greet2'],
      hint:   ['npc.mech.hint0', 'npc.mech.hint1', 'npc.mech.hint2'],
      reject: 'npc.mech.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      carryBonus:   3,
      healBonus:    0,
      craftBonus:   1.3,        // +30% craft success
      moralBonus:   0.05,
      lonelinessReduction: 0.15,
      noiseAdd:     2,
      foodCostPerDay: 0.5,
      skillBonus:   { crafting: 0.3, building: 0.2 },
    },
    gifts: [
      { trust: 2, itemId: 'metal_scrap', qty: 3 },
      { trust: 4, itemId: 'duct_tape', qty: 2 },
    ],
    trades: null,
    forageItems: [
      { id: 'metal_scrap', chance: 0.45, qty: 2 },
      { id: 'duct_tape',   chance: 0.2,  qty: 1 },
    ],
    spontaneous: [
      { condition: 'low_hp',        line: '"잠깐, 내가 응급 처치해줄게. 앉아봐."' },
      { condition: 'always',        line: '"이 부품만 있으면 뭔가 만들 수 있을 것 같은데."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'mechanic_trust_5',
        message: '🔧 정비사가 제작 비법을 전수해줬다. 제작 성공률 영구 향상.',
        effect:  { skillTeach: { skillId: 'master_craft', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'mechanic_quest_parts',
        triggerTrust: 0,
        title:        '발전기 수리',
        description:  '"부품만 있으면 발전기를 고칠 수 있어. 고철 좀 모아다 줄 수 있어?"',
        steps: [
          { type: 'collect', itemId: 'metal_scrap', qty: 8, hint: '주변 폐차장이나 건물에서 찾을 수 있다.' },
          { type: 'collect', itemId: 'wire',        qty: 3, hint: '전선은 건물 내부에서 발견된다.' },
        ],
        reward: { trust: 2, items: [{ id: 'metal_scrap', qty: 5 }], skillUnlock: { skillId: 'master_craft', value: 0.05 } },
      },
    ],
    specialDays: [
      { day: 10, message: '🔧 정비사가 장비를 점검해줬다. 내구도가 약간 회복됐다.', effect: { morale: 8 } },
      { day: 30, message: '🔧 "당신 손재주 나쁘지 않은데. 같이 뭔가 만들어보자고."', effect: { trust: 1 } },
    ],
  },

  npc_trader: {
    id: 'npc_trader',
    personality: 'neutral',
    maxHp: 50,
    spawnDistrict: 'yeongdeungpo',
    spawnDay: 12,
    dialogues: {
      greet:  ['npc.trader.greet0', 'npc.trader.greet1', 'npc.trader.greet2'],
      hint:   ['npc.trader.hint0', 'npc.trader.hint1', 'npc.trader.hint2'],
      reject: 'npc.trader.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   false,      // trader doesn't join party
      recruitTrust: 99,
      combatDmg:    0,
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0,
      lonelinessReduction: 0.1,
      noiseAdd:     0,
      foodCostPerDay: 0,
      skillBonus:   null,
    },
    gifts: [],
    trades: [
      // { give: { id, qty }, receive: { id, qty }, trustRequired }
      { give: { id: 'canned_food', qty: 3 },   receive: { id: 'first_aid_kit', qty: 1 }, trustRequired: 0 },
      { give: { id: 'metal_scrap', qty: 5 },   receive: { id: 'pistol_ammo', qty: 3 },   trustRequired: 1 },
      { give: { id: 'cloth', qty: 4 },          receive: { id: 'bandage', qty: 5 },        trustRequired: 0 },
      { give: { id: 'water_bottle', qty: 2 },   receive: { id: 'canned_food', qty: 3 },    trustRequired: 0 },
      { give: { id: 'rope', qty: 3 },           receive: { id: 'duct_tape', qty: 2 },      trustRequired: 2 },
      // 지도 조각: 신뢰 2 이상 + 식량 5개 → 중부 지도 조각
      { give: { id: 'canned_food', qty: 5 },   receive: { id: 'map_fragment_center', qty: 1 }, trustRequired: 2,
        oneTime: true, label: '서울 중부 지도 조각' },
    ],
    spontaneous: [
      { condition: 'always', line: '"좋은 물건 있으면 알려줘. 서울 어디서든 구해올 수 있어."' },
    ],
    quests: [
      {
        id:           'trader_quest_route',
        triggerTrust: 0,
        title:        '거래 루트 개척',
        description:  '"안전한 루트를 개척해야 해. 이 물자들을 목적지까지 운반해줄 수 있어?"',
        steps: [
          { type: 'collect', itemId: 'canned_food',  qty: 5, hint: '비축 식량 5개를 모아라.' },
          { type: 'collect', itemId: 'water_bottle', qty: 3, hint: '정수된 물 3개를 준비하라.' },
        ],
        reward: { trust: 2, items: [{ id: 'rare_medicine', qty: 1 }, { id: 'canned_food', qty: 5 }], skillUnlock: { skillId: 'barter_mastery', value: 0.1 } },
      },
    ],
    specialDays: [
      { day: 5, message: '🧳 상인이 감사의 표시로 특별한 물건을 건넸다.', effect: { trust: 1 } },
    ],
  },

  npc_student: {
    id: 'npc_student',
    personality: 'cautious',
    maxHp: 40,
    spawnDistrict: 'gwanak',
    spawnDay: 18,
    dialogues: {
      greet:  ['npc.student.greet0', 'npc.student.greet1', 'npc.student.greet2'],
      hint:   ['npc.student.hint0', 'npc.student.hint1', 'npc.student.hint2'],
      reject: 'npc.student.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      carryBonus:   2,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.1,
      lonelinessReduction: 0.2,
      noiseAdd:     0,
      foodCostPerDay: 0.35,
      skillBonus:   { scavenging: 0.25, medicine: 0.15 },
    },
    gifts: [
      { trust: 2, itemId: 'water_bottle', qty: 1 },
      { trust: 4, itemId: 'water_filter', qty: 1 },
    ],
    trades: null,
    forageItems: [
      { id: 'wild_herb',    chance: 0.3, qty: 1 },
      { id: 'water_bottle', chance: 0.2, qty: 1 },
    ],
    spontaneous: [
      { condition: 'low_hp',        line: '"잠깐! 내가 응급처치 알아. 멈춰봐."' },
      { condition: 'low_nutrition', line: '"식량 현황이 심각해. 보급 계획을 다시 짜자."' },
      { condition: 'always',        line: '"저기 건물에 흥미로운 자료가 있을 것 같아."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'student_trust_5',
        message: '📖 학생이 탐색 요령을 가르쳐줬다. 희귀 아이템 발견율 +10% 영구 적용.',
        effect:  { skillTeach: { skillId: 'scent_tracking', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'student_quest_research',
        triggerTrust: 0,
        title:        '감염 데이터 수집',
        description:  '"감염 패턴을 연구하려면 샘플이 필요해. 의료 시설에서 자료 좀 구해줄 수 있어?"',
        steps: [
          { type: 'visit', locationId: 'gwanak', hint: '서울대학교 연구동을 탐색하라.' },
        ],
        reward: { trust: 2, items: [{ id: 'water_filter', qty: 1 }, { id: 'bandage', qty: 5 }], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 10, message: '📖 "함께 10일. 혼자였으면 못 버텼어요." 학생이 고마움을 전했다.', effect: { morale: 12 } },
      { day: 30, message: '📖 학생이 연구 노트를 보여줬다. 세상이 어떻게 됐는지 조금 더 이해됐다.', effect: { trust: 1 } },
    ],
  },

  npc_dog: {
    id: 'npc_dog',
    personality: 'loyal',
    maxHp: 40,
    spawnDistrict: 'dobong',
    spawnDay: 1,
    dialogues: {
      greet:  ['npc.dog.greet0', 'npc.dog.greet1', 'npc.dog.greet2'],
      hint:   ['npc.dog.hint0', 'npc.dog.hint1', 'npc.dog.hint2'],
      reject: 'npc.dog.reject',
    },
    trustGainPerTalk: 2,        // dogs trust quickly
    companion: {
      canRecruit:   true,
      recruitTrust: 1,
      combatDmg:    0.2,        // small bite damage
      carryBonus:   0,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.25,
      lonelinessReduction: 0.35,
      noiseAdd:     2,          // barking
      foodCostPerDay: 0.15,     // low food cost
      skillBonus:   { scavenging: 0.1 },
    },
    gifts: [],
    trades: null,
    forageItems: [
      { id: 'raw_meat',  chance: 0.5, qty: 1 },
      { id: 'wild_herb', chance: 0.3, qty: 1 },
    ],
    spontaneous: [
      { condition: 'low_hp',        line: '개가 걱정스럽게 킁킁거리며 다가온다.' },
      { condition: 'low_nutrition', line: '개가 무언가를 물어와 발치에 내려놓는다.' },
      { condition: 'rain',          line: '개가 몸을 맞대고 체온을 나눠준다.' },
      { condition: 'always',        line: '개가 꼬리를 흔들며 앞장선다.' },
    ],
    // 신뢰 이벤트: 특정 신뢰 등급 달성 시 1회 트리거
    trustEvents: [
      {
        trust: 2,
        id: 'dog_trust_2',
        message: '🐕 개가 낯선 냄새를 맡고 짖습니다. 덕분에 매복을 미리 알아챕니다. (은신 난이도 -0.1)',
        effect: { stealthBonus: 0.1 },   // 이 세션 동안 은신 성공률 +10%
      },
      {
        trust: 4,
        id: 'dog_trust_4',
        message: '🐕 개가 탐색 중 숨겨진 식량 창고 냄새를 맡아냈습니다! (통조림 2개 발견)',
        effect: { giveItems: [{ id: 'canned_food', qty: 2 }] },
      },
      {
        trust: 5,
        id: 'dog_trust_5',
        message: '🐕 개가 전투 중 적의 공격을 대신 받아 당신을 보호합니다. (전투 피해 -15% 패시브 활성화)',
        effect: { combatDmgReduce: 0.15 },
      },
    ],
    quests: [
      {
        id:           'dog_quest_owner',
        triggerTrust: 0,
        title:        '옛 주인의 흔적',
        description:  '개가 어딘가를 애타게 바라본다. 무언가를 찾고 있는 것 같다.',
        steps: [
          { type: 'collect', itemId: 'cloth', qty: 2, hint: '천 조각으로 개의 목줄을 만들어줄 수 있다.' },
        ],
        reward: { trust: 2, items: [], skillUnlock: { skillId: 'scent_tracking', value: 0.05 } },
      },
    ],
    specialDays: [
      { day: 7,  message: '🐕 개와 함께 일주일. 개가 밤새 곁을 지켜줬다.', effect: { morale: 15 } },
      { day: 30, message: '🐕 한 달이 됐다. 개가 가장 믿음직한 동반자다.', effect: { trust: 1 } },
    ],
  },

  // ── 노숙인 전용 NPC ──────────────────────────────────────────────────
  npc_former_colleague: {
    id: 'npc_former_colleague',
    name: '전 건설 동료',
    type: 'npc',
    personality: 'guilt',
    maxHp: 70,
    spawnDistrict: 'yangcheon',
    spawnDay: 10,
    spawnCondition: { requiredCharacter: 'homeless' },
    dialogues: {
      greet:  [
        '형식 씨… 살아계셨군요. 저예요, 김상우. 그때 일은 정말 죄송했어요.',
        '저도 다 잃었어요. 회사도, 가족도. 형식 씨가 제일 많이 잃었는데 제가 할 말이 없네요.',
        '빚 문제는… 이 세상에서 이제 의미 없지 않나요. 같이 살아남는 게 먼저겠죠.',
      ],
      hint:   [
        '저 쪽 아파트에 공구 창고가 있어요. 자물쇠만 따면 쓸만한 게 꽤 있을 것 같아요.',
        '건설 현장 다니면서 배운 게 있어요. 구조물 만들 때 도움 드릴게요.',
        '형식 씨, 잠실 쪽에 사람들이 모인다는 소문 들었어요? 롯데타워라고.',
      ],
      reject: '아직 제 편 아닌가요. 그럼 어쩔 수 없죠.',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 3,
      combatDmg:    0.4,
      carryBonus:   8,
      healBonus:    0,
      craftBonus:   0.3,  // 건설 경험
      moralBonus:   0.1,
      lonelinessReduction: 0.2,
      noiseAdd:     3,
      foodCostPerDay: 0.3,
      skillBonus:   { building: 0.4, crafting: 0.2 },
    },
    gifts: [
      { trust: 2, definitionId: 'scrap_metal', qty: 3, message: '👷 상우가 공사장에서 건진 고철을 내밀었다.' },
      { trust: 4, definitionId: 'wire', qty: 4, message: '👷 "형식 씨한테만 드리는 거예요. 전선 귀하잖아요."' },
    ],
    trades: [
      { give: 'canned_food', receive: 'scrap_metal', qty: 2 },
      { give: 'bandage', receive: 'rope', qty: 2 },
    ],
    trustEvents: [
      {
        trust: 2,
        id: 'colleague_trust_2',
        message: '👷 상우가 건설 현장 지식을 공유해줬다. (구조물 제작 재료 -1 효과 1회 획득)',
        effect: { giveItems: [{ id: 'scrap_metal', qty: 3 }] },
      },
      {
        trust: 4,
        id: 'colleague_trust_4',
        message: '👷 "형식 씨, 제가 가진 비상금이에요." 통조림 5개와 진통제를 건넸다.',
        effect: { giveItems: [{ id: 'canned_food', qty: 5 }, { id: 'painkiller', qty: 2 }] },
      },
      {
        trust: 5,
        id: 'colleague_trust_5',
        message: '👷 상우가 함께 싸우기로 했다. 전투 중 옆에 있으면 피해를 나눠 받는다. (전투 피해 -10%)',
        effect: { combatDmgReduce: 0.10 },
      },
    ],
  },

  // ── 스토리 분기 동반자 NPC 데이터 ────────────────────────────────
  npc_minjun: {
    id: 'npc_minjun',
    personality: 'disciplined',
    maxHp: 70,
    dialogues: { greet: ['npc.minjun.greet0'], hint: ['npc.minjun.hint0'], reject: 'npc.minjun.reject' },
    trustGainPerTalk: 1,
    companion: {
      canRecruit: true, recruitTrust: 0,
      combatDmg: 0.5, combatDmgReduce: 0.1, carryBonus: 0,
      healBonus: 0.1, craftBonus: 0, moralBonus: 0.2,
      lonelinessReduction: 0.2, noiseAdd: 2, foodCostPerDay: 0.3,
      skillBonus: { combat: 0.15 },
    },
    gifts: [], trades: null, forageItems: [{ id: 'bandage', chance: 0.4, qty: 2 }],
    spontaneous: [{ condition: 'always', line: '강민준: "경계를 늦추지 마십시오."' }],
    trustEvents: [],
    quests: [],
    specialDays: [{ day: 7, message: '🪖 강민준: "일주일 함께했군요. 신뢰가 생겼습니다."', effect: { morale: 10 } }],
  },

  npc_sohee: {
    id: 'npc_sohee',
    personality: 'analytical',
    maxHp: 45,
    dialogues: { greet: ['npc.sohee.greet0'], hint: ['npc.sohee.hint0'], reject: 'npc.sohee.reject' },
    trustGainPerTalk: 1,
    companion: {
      canRecruit: true, recruitTrust: 0,
      combatDmg: 0, combatDmgReduce: 0, carryBonus: 0,
      healBonus: 0.3, craftBonus: 0.2, moralBonus: 0.15,
      lonelinessReduction: 0.25, noiseAdd: 0, foodCostPerDay: 0.2,
      skillBonus: { crafting: 0.2, medical: 0.25 },
    },
    gifts: [], trades: null, forageItems: [{ id: 'herb', chance: 0.5, qty: 2 }],
    spontaneous: [{ condition: 'always', line: '한소희: "이 성분 조합이 흥미롭네요."' }],
    trustEvents: [],
    quests: [],
    specialDays: [{ day: 7, message: '💊 한소희: "함께 연구하니 속도가 두 배예요."', effect: { morale: 10 } }],
  },

  npc_jisu: {
    id: 'npc_jisu',
    personality: 'caring',
    maxHp: 50,
    dialogues: { greet: ['npc.jisu.greet0'], hint: ['npc.jisu.hint0'], reject: 'npc.jisu.reject' },
    trustGainPerTalk: 1,
    companion: {
      canRecruit: true, recruitTrust: 0,
      combatDmg: 0, combatDmgReduce: 0, carryBonus: 0,
      healBonus: 0.4, craftBonus: 0.1, moralBonus: 0.2,
      lonelinessReduction: 0.3, noiseAdd: 0, foodCostPerDay: 0.2,
      skillBonus: { medical: 0.3 },
    },
    gifts: [], trades: null, forageItems: [{ id: 'bandage', chance: 0.5, qty: 2 }],
    spontaneous: [{ condition: 'low_hp', line: '이지수: "잠깐, 내가 봐줄게요."' }],
    trustEvents: [],
    quests: [],
    specialDays: [{ day: 7, message: '🩺 이지수: "당신 곁에 의사가 있다는 게 다행이에요."', effect: { morale: 12 } }],
  },

  npc_yeongcheol: {
    id: 'npc_yeongcheol',
    personality: 'brave',
    maxHp: 65,
    dialogues: { greet: ['npc.yeongcheol.greet0'], hint: ['npc.yeongcheol.hint0'], reject: 'npc.yeongcheol.reject' },
    trustGainPerTalk: 1,
    companion: {
      canRecruit: true, recruitTrust: 0,
      combatDmg: 0.3, combatDmgReduce: 0.1, carryBonus: 5,
      healBonus: 0.1, craftBonus: 0.15, moralBonus: 0.2,
      lonelinessReduction: 0.2, noiseAdd: 1, foodCostPerDay: 0.3,
      skillBonus: { scavenging: 0.15, crafting: 0.1 },
    },
    gifts: [], trades: null, forageItems: [{ id: 'rope', chance: 0.4, qty: 1 }],
    spontaneous: [{ condition: 'always', line: '박영철: "내가 먼저 들어가지."' }],
    trustEvents: [],
    quests: [],
    specialDays: [{ day: 7, message: '🚒 박영철: "구조대원과 함께라면 뭐든 될 것 같아."', effect: { morale: 10 } }],
  },

  npc_daehan: {
    id: 'npc_daehan',
    personality: 'inventive',
    maxHp: 55,
    dialogues: { greet: ['npc.daehan.greet0'], hint: ['npc.daehan.hint0'], reject: 'npc.daehan.reject' },
    trustGainPerTalk: 1,
    companion: {
      canRecruit: true, recruitTrust: 0,
      combatDmg: 0, combatDmgReduce: 0, carryBonus: 3,
      healBonus: 0, craftBonus: 0.35, moralBonus: 0.1,
      lonelinessReduction: 0.15, noiseAdd: 3, foodCostPerDay: 0.25,
      skillBonus: { crafting: 0.35 },
    },
    gifts: [], trades: null, forageItems: [{ id: 'scrap_metal', chance: 0.5, qty: 2 }],
    spontaneous: [{ condition: 'always', line: '정대한: "이거 제가 고칠 수 있어요."' }],
    trustEvents: [],
    quests: [],
    specialDays: [{ day: 7, message: '🔧 정대한: "같이 만들면 시간이 절반이에요."', effect: { morale: 10 } }],
  },

  // ── 롯데타워 NPC 데이터 (최형식 Branch B 도착 이후) ──────────────────
  npc_tower_security: {
    id: 'npc_tower_security',
    personality: 'brave',
    maxHp: 75,
    spawnDistrict: 'songpa',
    spawnDay: 30,
    dialogues: {
      greet:  ['npc.tower_security.greet0', 'npc.tower_security.greet1', 'npc.tower_security.greet2'],
      hint:   ['npc.tower_security.hint0',  'npc.tower_security.hint1',  'npc.tower_security.hint2'],
      reject: 'npc.tower_security.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 3,
      combatDmg:    1.15,        // +15% combat damage
      combatDmgReduce: 0.12,
      carryBonus:   2,
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.1,
      lonelinessReduction: 0.15,
      noiseAdd:     1,
      foodCostPerDay: 0.5,
      skillBonus:   { melee: 0.2 },
    },
    gifts: [
      { trust: 2, itemId: 'combat_knife', qty: 1 },
      { trust: 4, itemId: 'pistol_ammo',  qty: 6 },
    ],
    trades: null,
    forageItems: [
      { id: 'pistol_ammo', chance: 0.3, qty: 1 },
      { id: 'bandage',     chance: 0.25, qty: 1 },
    ],
    spontaneous: [
      { condition: 'low_hp', line: '김정호: "뒤는 내가 맡지. 물러서."' },
      { condition: 'always', line: '김정호: "타워는 내가 지킨다. 안심해."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'tower_security_trust_5',
        message: '🛡️ 김정호 대장이 경계 요령을 전수해줬다. 전투 피해 +5% 영구 적용.',
        effect:  { skillTeach: { skillId: 'tower_guard', value: 0.05 } },
      },
    ],
    quests: [
      {
        id:           'tower_security_patrol',
        triggerTrust: 0,
        title:        '외곽 순찰',
        description:  '"타워 외곽에 이상한 흔적이 있어. 같이 순찰 돌지."',
        steps: [
          { type: 'visit', locationId: 'songpa', hint: '송파 주변을 순찰하라.' },
        ],
        reward: { trust: 2, items: [{ id: 'combat_knife', qty: 1 }], skillUnlock: null },
      },
      {
        id:           'tower_security_barricade',
        triggerTrust: 2,
        title:        '방어선 강화',
        description:  '"바리케이드를 보강해야 해. 고철과 못을 구해와."',
        steps: [
          { type: 'collect', itemId: 'scrap_metal', qty: 3, hint: '해체 가능한 구조물에서 획득.' },
          { type: 'collect', itemId: 'nail', qty: 5, hint: '공구함이나 건물 잔해에서 획득.' },
        ],
        reward: { trust: 1, items: [{ id: 'bandage', qty: 3 }], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 14, message: '🛡️ "2주를 버텼군. 믿을 만한 사람이야."', effect: { morale: 10 } },
    ],
  },

  npc_tower_merchant: {
    id: 'npc_tower_merchant',
    personality: 'neutral',
    maxHp: 50,
    spawnDistrict: 'songpa',
    spawnDay: 25,
    dialogues: {
      greet:  ['npc.tower_merchant.greet0', 'npc.tower_merchant.greet1', 'npc.tower_merchant.greet2'],
      hint:   ['npc.tower_merchant.hint0',  'npc.tower_merchant.hint1',  'npc.tower_merchant.hint2'],
      reject: 'npc.tower_merchant.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      combatDmgReduce: 0,
      carryBonus:   5,           // +5kg carry
      healBonus:    0,
      craftBonus:   0,
      moralBonus:   0.05,
      lonelinessReduction: 0.15,
      noiseAdd:     0,
      foodCostPerDay: 0.35,
      skillBonus:   { scavenging: 0.15 },
    },
    gifts: [
      { trust: 2, itemId: 'canned_food', qty: 2 },
      { trust: 4, itemId: 'rope',        qty: 2 },
    ],
    trades: [
      { give: { id: 'scrap_metal',   qty: 4 }, receive: { id: 'canned_food', qty: 2 }, trustRequired: 0 },
      { give: { id: 'cloth',         qty: 5 }, receive: { id: 'bandage',     qty: 4 }, trustRequired: 0 },
      { give: { id: 'canned_food',   qty: 3 }, receive: { id: 'rope',        qty: 2 }, trustRequired: 1 },
      { give: { id: 'wire',          qty: 3 }, receive: { id: 'duct_tape',   qty: 1 }, trustRequired: 1 },
      { give: { id: 'water_bottle',  qty: 2 }, receive: { id: 'painkiller',  qty: 2 }, trustRequired: 2 },
      { give: { id: 'charcoal',      qty: 3 }, receive: { id: 'lighter',     qty: 1 }, trustRequired: 2 },
      { give: { id: 'scrap_metal',   qty: 6 }, receive: { id: 'pistol_ammo', qty: 4 }, trustRequired: 3 },
    ],
    forageItems: [
      { id: 'cloth',        chance: 0.35, qty: 1 },
      { id: 'canned_food',  chance: 0.2,  qty: 1 },
    ],
    spontaneous: [
      { condition: 'always', line: '이해진: "좋은 거래는 양쪽 다 웃어야지."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'tower_merchant_trust_5',
        message: '🎒 이해진이 거래 요령을 전수해줬다. 교환 효율 +10% 영구 적용.',
        effect:  { skillTeach: { skillId: 'barter_mastery', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'tower_merchant_supply',
        triggerTrust: 0,
        title:        '타워 보급 루트',
        description:  '"타워 사람들한테 돌릴 물자가 부족해. 재료 좀 모아다 줄 수 있어?"',
        steps: [
          { type: 'collect', itemId: 'scrap_metal', qty: 5, hint: '송파 근처 폐차장에서 모을 수 있다.' },
        ],
        reward: { trust: 2, items: [{ id: 'canned_food', qty: 4 }], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 10, message: '🎒 이해진: "형씨, 당신이랑 거래하는 게 제일 속 편해."', effect: { morale: 8 } },
    ],
  },

  npc_tower_cook: {
    id: 'npc_tower_cook',
    personality: 'caring',
    maxHp: 45,
    spawnDistrict: 'songpa',
    spawnDay: 35,
    dialogues: {
      greet:  ['npc.tower_cook.greet0', 'npc.tower_cook.greet1', 'npc.tower_cook.greet2'],
      hint:   ['npc.tower_cook.hint0',  'npc.tower_cook.hint1',  'npc.tower_cook.hint2'],
      reject: 'npc.tower_cook.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      combatDmgReduce: 0,
      carryBonus:   1,
      healBonus:    0.1,
      craftBonus:   0.1,
      moralBonus:   0.2,
      lonelinessReduction: 0.25,
      noiseAdd:     0,
      foodCostPerDay: 0.25,       // eats less — professional
      skillBonus:   { cooking: 0.3 },
    },
    gifts: [
      { trust: 2, itemId: 'canned_food', qty: 2 },
      { trust: 4, itemId: 'wild_herb',   qty: 3 },
    ],
    trades: null,
    forageItems: [
      { id: 'wild_herb',   chance: 0.4, qty: 2 },
      { id: 'wild_berry',  chance: 0.3, qty: 2 },
    ],
    spontaneous: [
      { condition: 'low_nutrition', line: '박수미: "잠깐 쉬어, 따뜻한 거 만들어줄게."' },
      { condition: 'always',        line: '박수미: "재료만 있으면 뭐든 요리가 돼."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'tower_cook_trust_5',
        message: '👩‍🍳 박수미가 요리 비법을 전수해줬다. 음식 영양 효율 +10% 영구 적용.',
        effect:  { skillTeach: { skillId: 'master_cook', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'tower_cook_ingredients',
        triggerTrust: 0,
        title:        '주방 재료 수집',
        description:  '"타워 사람들 밥을 해먹이려면 재료가 필요해. 야생 허브 좀 구해줄래?"',
        steps: [
          { type: 'collect', itemId: 'wild_herb', qty: 6, hint: '한강변에서 자주 발견된다.' },
        ],
        reward: { trust: 2, items: [{ id: 'canned_food', qty: 4 }], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 10, message: '👩‍🍳 박수미가 따뜻한 국을 끓여줬다. "당신도 좀 쉬어요."', effect: { morale: 15 } },
    ],
  },

  npc_tower_engineer: {
    id: 'npc_tower_engineer',
    personality: 'inventive',
    maxHp: 50,
    spawnDistrict: 'songpa',
    spawnDay: 40,
    dialogues: {
      greet:  ['npc.tower_engineer.greet0', 'npc.tower_engineer.greet1', 'npc.tower_engineer.greet2'],
      hint:   ['npc.tower_engineer.hint0',  'npc.tower_engineer.hint1',  'npc.tower_engineer.hint2'],
      reject: 'npc.tower_engineer.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      combatDmgReduce: 0,
      carryBonus:   3,
      healBonus:    0,
      craftBonus:   1.25,
      moralBonus:   0.08,
      lonelinessReduction: 0.15,
      noiseAdd:     2,
      foodCostPerDay: 0.4,
      skillBonus:   { crafting: 0.3, building: 0.2 },
    },
    gifts: [
      { trust: 2, itemId: 'wire',         qty: 3 },
      { trust: 4, itemId: 'scrap_metal',  qty: 4 },
    ],
    trades: null,
    forageItems: [
      { id: 'scrap_metal', chance: 0.4, qty: 2 },
      { id: 'wire',        chance: 0.3, qty: 1 },
    ],
    spontaneous: [
      { condition: 'always', line: '한지성: "이 구조, 제가 더 튼튼하게 만들 수 있어요."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'tower_engineer_trust_5',
        message: '🔧 한지성이 정비 노하우를 전수해줬다. 제작 성공률 영구 향상.',
        effect:  { skillTeach: { skillId: 'tower_repair', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'tower_engineer_power',
        triggerTrust: 0,
        title:        '타워 전력 복구',
        description:  '"타워 하층부 발전기를 되살리려면 부품이 필요해요. 고철이랑 전선 모아다 주실래요?"',
        steps: [
          { type: 'collect', itemId: 'scrap_metal', qty: 6, hint: '송파 일대 폐차장.' },
          { type: 'collect', itemId: 'wire',        qty: 4, hint: '건물 내부 배선.' },
        ],
        reward: { trust: 2, items: [{ id: 'duct_tape', qty: 2 }], skillUnlock: { skillId: 'tower_repair', value: 0.05 } },
      },
    ],
    specialDays: [
      { day: 10, message: '🔧 한지성: "같이 작업하니 속도가 확 빨라졌어요."', effect: { morale: 10 } },
    ],
  },

  npc_tower_doctor: {
    id: 'npc_tower_doctor',
    personality: 'caring',
    maxHp: 48,
    spawnDistrict: 'songpa',
    spawnDay: 30,
    dialogues: {
      greet:  ['npc.tower_doctor.greet0', 'npc.tower_doctor.greet1', 'npc.tower_doctor.greet2'],
      hint:   ['npc.tower_doctor.hint0',  'npc.tower_doctor.hint1',  'npc.tower_doctor.hint2'],
      reject: 'npc.tower_doctor.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    0,
      combatDmgReduce: 0,
      carryBonus:   1,
      healBonus:    1.4,          // +40% heal effectiveness
      craftBonus:   0,
      moralBonus:   0.15,
      lonelinessReduction: 0.2,
      noiseAdd:     0,
      foodCostPerDay: 0.35,
      skillBonus:   { medicine: 0.3 },
    },
    gifts: [
      { trust: 2, itemId: 'bandage',      qty: 3 },
      { trust: 4, itemId: 'first_aid_kit', qty: 1 },
    ],
    trades: null,
    forageItems: [
      { id: 'bandage',    chance: 0.35, qty: 1 },
      { id: 'antiseptic', chance: 0.25, qty: 1 },
    ],
    spontaneous: [
      { condition: 'low_hp', line: '최지윤: "가만히. 상처 먼저 보게요."' },
      { condition: 'always', line: '최지윤: "다치기 전에 쉬는 게 최고의 치료예요."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'tower_doctor_trust_5',
        message: '👩‍⚕️ 최지윤이 응급 프로토콜을 전수해줬다. 회복 아이템 효율 +10% 영구 적용.',
        effect:  { skillTeach: { skillId: 'tower_triage', value: 0.1 } },
      },
    ],
    quests: [
      {
        id:           'tower_doctor_clinic',
        triggerTrust: 0,
        title:        '진료소 보급',
        description:  '"타워 진료소 재고가 비어가요. 의료품 좀 구해다 주실래요?"',
        steps: [
          { type: 'collect', itemId: 'bandage',     qty: 5, hint: '약국이나 병원.' },
          { type: 'collect', itemId: 'painkiller',  qty: 3, hint: '약국 캐비닛.' },
        ],
        reward: { trust: 2, items: [{ id: 'first_aid_kit', qty: 1 }], skillUnlock: null },
      },
    ],
    specialDays: [
      { day: 10, message: '👩‍⚕️ 최지윤: "당신 같은 사람이 있어서 진료소가 돌아가요."', effect: { morale: 12 } },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  //  셰프 팀 NPC (Phase 4) — 셰프 캐릭터 전용 동료
  // ══════════════════════════════════════════════════════════════

  npc_sous_chef: {
    id: 'npc_sous_chef',
    personality: 'confident',
    maxHp: 70,
    spawnDistrict: 'junggoo',
    spawnDay: 35,
    dialogues: {
      greet:  ['npc.sous_chef.greet0', 'npc.sous_chef.greet1', 'npc.sous_chef.greet2'],
      hint:   ['npc.sous_chef.hint0', 'npc.sous_chef.hint1', 'npc.sous_chef.hint2'],
      reject: 'npc.sous_chef.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 3,
      combatDmg:    1.1,
      carryBonus:   4,
      healBonus:    1.0,
      craftBonus:   0,
      moralBonus:   0.15,
      lonelinessReduction: 0.20,
      noiseAdd:     0,
      foodCostPerDay: 0.5,
      skillBonus:   { cooking: 0.3, melee: 0.15 },
    },
    gifts: [
      { trust: 1, itemId: 'wild_honey', qty: 1 },
      { trust: 3, itemId: 'wagyu_scrap', qty: 2 },
    ],
    trades: null,
    forageItems: [
      { id: 'herb',        chance: 0.40, qty: 2 },
      { id: 'wild_berry',  chance: 0.30, qty: 2 },
      { id: 'wild_honey',  chance: 0.10, qty: 1 },
    ],
    spontaneous: [
      { condition: 'always',        line: '🧑‍🍳 "재혁이, 오늘 메뉴는 뭐야?"' },
      { condition: 'low_nutrition', line: '🧑‍🍳 "배고프면 손이 떨려. 뭐라도 먹자."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'sous_chef_mastery',
        message: '🧑‍🍳 부주방장이 호텔 레시피 북을 건넸다. 요리 품질 +10% 영구 적용.',
        effect:  { skillTeach: { skillId: 'cooking', value: 0.15 } },
      },
    ],
    quests: [
      {
        id:           'sous_chef_reunion',
        triggerTrust: 0,
        title:        '소피텔 동료 재회',
        description:  '"호텔 주방에 두고 온 레시피 북이 있어. 같이 가서 찾자."',
        steps: [
          { type: 'visit',   districtId: 'junggoo',         hint: '소피텔 호텔이 있는 중구로.' },
          { type: 'collect', itemId: 'canned_food', qty: 5, hint: '호텔 식자재 창고.' },
        ],
        reward: { trust: 2, items: [{ id: 'truffle', qty: 1 }, { id: 'saffron_dried', qty: 1 }] },
      },
      {
        id:           'sous_chef_special_dish',
        triggerTrust: 2,
        title:        '특별한 한 끼',
        description:  '"재료만 있으면 끝내주는 걸 만들어줄게. 소금과 허브를 구해와."',
        steps: [
          { type: 'collect', itemId: 'salt', qty: 2, hint: '주방이나 식당에서 소금을 찾는다.' },
          { type: 'collect', itemId: 'herb', qty: 2, hint: '약초 텃밭이나 자연에서 채집.' },
        ],
        reward: { trust: 1, items: [{ id: 'cooked_rice', qty: 3 }] },
      },
    ],
    specialDays: [
      { day: 15, message: '🧑‍🍳 박민호: "재혁이, 우리 팀이 서울 최고의 주방이 될 거야."', effect: { morale: 10 } },
    ],
  },

  npc_kitchen_helper: {
    id: 'npc_kitchen_helper',
    personality: 'enthusiastic',
    maxHp: 55,
    spawnDistrict: 'junggoo',
    spawnDay: 25,
    dialogues: {
      greet:  ['npc.kitchen_helper.greet0', 'npc.kitchen_helper.greet1', 'npc.kitchen_helper.greet2'],
      hint:   ['npc.kitchen_helper.hint0', 'npc.kitchen_helper.hint1'],
      reject: 'npc.kitchen_helper.reject',
    },
    trustGainPerTalk: 1,
    companion: {
      canRecruit:   true,
      recruitTrust: 2,
      combatDmg:    1.0,
      carryBonus:   3,
      healBonus:    1.0,
      craftBonus:   0,
      moralBonus:   0.10,
      lonelinessReduction: 0.25,
      noiseAdd:     0,
      foodCostPerDay: 0.4,
      skillBonus:   { cooking: 0.15 },
    },
    gifts: [
      { trust: 1, itemId: 'wild_berry', qty: 3 },
      { trust: 3, itemId: 'herb', qty: 5 },
    ],
    trades: null,
    forageItems: [
      { id: 'herb',        chance: 0.50, qty: 1 },
      { id: 'wild_berry',  chance: 0.40, qty: 2 },
    ],
    spontaneous: [
      { condition: 'always',        line: '👩‍🍳 "셰프님, 오늘도 배워갑니다!"' },
      { condition: 'low_morale',    line: '👩‍🍳 "힘내세요! 요리는 사랑이에요."' },
    ],
    trustEvents: [
      {
        trust: 5,
        id:      'helper_apprentice',
        message: '👩‍🍳 주방 보조가 성장해 정식 요리사가 됐다. 요리 성공률 +15% 영구.',
        effect:  { skillTeach: { skillId: 'cooking', value: 0.10 } },
      },
    ],
    quests: [
      {
        id:           'helper_first_recipe',
        triggerTrust: 0,
        title:        '첫 레시피',
        description:  '"저한테 한식 요리 가르쳐주세요! 집에서 뭐라도 해먹고 싶어요."',
        steps: [
          { type: 'craft',   category: 'food', qty: 3, hint: '한식 요리 3개 제작 (김치찌개·된장찌개·비빔밥 등).' },
        ],
        reward: { trust: 2, items: [{ id: 'herb', qty: 8 }] },
      },
    ],
    specialDays: [
      { day: 7,  message: '👩‍🍳 김지은이 생일. 셰프가 케이크를 구워줬다.', effect: { morale: 15 } },
    ],
  },

  // ── 보라매 응급실 잔류 환자 (이지수 전용, Day 2~7 사이 서브로케이션 진입 시 랜덤 스폰) ──
  // spawnDay: 999 → 자동 스폰 비활성화, ExploreSystem이 직접 호출
  npc_er_patient_child: {
    id: 'npc_er_patient_child',
    personality: 'timid',
    maxHp: 40,
    spawnDistrict: 'dongjak',
    spawnDay: 999,
    dialogues: {
      greet:  ['npc.er_patient_child.greet0'],
      hint:   ['npc.er_patient_child.hint0'],
      reject: 'npc.er_patient_child.reject',
    },
    trustGainPerTalk: 0,
    backstory: '대피 중 부모와 헤어진 11세 소년. 보라매 응급실 침대에서 이지수를 기다렸다.',
    woundLevel: 2,
    woundHealItem: 'bandage',
    woundHealQty: 1,
    companion: null,
    gifts: [],
    trades: null,
    forageItems: [],
    spontaneous: [
      { condition: 'always', line: '"누나… 엄마 봤어요? 엄마가 여기서 기다리래요…"' },
    ],
    trustEvents: [
      {
        trust: 1,
        id:      'er_patient_child_healed',
        message: '🧒 소년이 눈물을 닦는다. "누나 주머니에 있던 거예요. 엄마가 나눠 먹으랬어요." — 사기 +10, 에너지 바 획득.',
        effect: { giveItems: [{ id: 'energy_bar', qty: 1 }], morale: 10 },
      },
    ],
    quests: [],
    specialDays: [],
  },

  npc_er_patient_elder: {
    id: 'npc_er_patient_elder',
    personality: 'stoic',
    maxHp: 35,
    spawnDistrict: 'dongjak',
    spawnDay: 999,
    dialogues: {
      greet:  ['npc.er_patient_elder.greet0'],
      hint:   ['npc.er_patient_elder.hint0'],
      reject: 'npc.er_patient_elder.reject',
    },
    trustGainPerTalk: 0,
    backstory: '보라매 단골 환자였던 72세 노인. 당뇨 합병증으로 거동이 힘들다.',
    woundLevel: 2,
    woundHealItem: 'bandage',
    woundHealQty: 1,
    companion: null,
    gifts: [],
    trades: null,
    forageItems: [],
    spontaneous: [
      { condition: 'always', line: '"선생님… 평생 저를 돌봐주셨던 교수님 따님이시죠? 여기 제 혈압약…"' },
    ],
    trustEvents: [
      {
        trust: 1,
        id:      'er_patient_elder_healed',
        message: '👴 노인이 침대 밑 서랍을 가리킨다. "교수님 유품이에요. 젊은 의사한테 물려주고 싶었다고…" — 항생제 2개 획득.',
        effect: { giveItems: [{ id: 'antibiotics', qty: 2 }], morale: 6 },
      },
    ],
    quests: [],
    specialDays: [],
  },

  npc_er_patient_civilian: {
    id: 'npc_er_patient_civilian',
    personality: 'brave',
    maxHp: 55,
    spawnDistrict: 'dongjak',
    spawnDay: 999,
    dialogues: {
      greet:  ['npc.er_patient_civilian.greet0'],
      hint:   ['npc.er_patient_civilian.hint0'],
      reject: 'npc.er_patient_civilian.reject',
    },
    trustGainPerTalk: 0,
    backstory: '대피 직전 응급실에 밀려든 28세 직장인. 복부 자상으로 의식이 흐려져 있다.',
    woundLevel: 2,
    woundHealItem: 'bandage',
    woundHealQty: 1,
    companion: null,
    gifts: [],
    trades: null,
    forageItems: [],
    spontaneous: [
      { condition: 'always', line: '"선생님… 제 가방… 약국 열쇠가 있어요. 길 건너 약국… 부탁해요."' },
    ],
    trustEvents: [
      {
        trust: 1,
        id:      'er_patient_civilian_healed',
        message: '🤕 시민이 가방을 열어 종이쪽지를 건넨다. "이거… 제 약품 창고 약도예요. 알코올 소독액도 가져가세요." — 알코올 소독액 1개 + 지도 조각 획득.',
        effect: { giveItems: [{ id: 'alcohol_solution', qty: 1 }, { id: 'map_fragment', qty: 1 }], morale: 8 },
      },
    ],
    quests: [],
    specialDays: [],
  },

};

export default NPCS;
