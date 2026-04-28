// === CHARACTER DEFINITIONS ===
// 6명의 고유 직업 캐릭터. 각자 배경 스토리·능력·시작 지역·특화 스킬을 가진다.

export const CHARACTERS = [
  {
    id: 'doctor',
    name: '이지수',
    gender: 'F',
    age: 38,
    maxHp: 105,     // (90 → 95 → 105 버프)
    strength: 58,   // 체력(힘) (55 → 58 버프)
    endurance: 72,  // 인내심 (70 → 72 버프, stamina ≈ 84)
    maxCarryWeight: 32, // (30 → 32 버프)
    title: '응급의학과 전문의',
    englishLabel: 'MEDICAL',
    portrait: '🩺',
    portraitFull:  'assets/images/characters/lee_jisoo_full.png',
    portraitSmall: 'assets/images/characters/lee_jisoo_portrait.png',
    // I-2 트랙 — 캐릭터선택 강점/약점 (가상 이미지 정렬)
    strengths: ['전문 의료 지식', '냉철한 판단력', '의약품 소지'],
    weaknesses: ['비전투 성향', '체력 한계', '과거의 트라우마'],
    story: `2026년 1월 17일, 동작구 보라매병원 응급실. 이지수 전문의(38세)는 밤새 밀려드는 환자를 치료하고 있었다.
새벽, 병원 밖에서 폭발음이 울렸다. 통신이 끊기고, 전기가 나갔다. 응급실은 순식간에 아수라장이 됐다.
대부분의 의료진은 도망쳤지만, 이지수는 남았다. 간호사 한 명과 중상을 입은 군인 한 명이 남아있었다.
"살릴 수 있는 사람은 살린다." 그녀는 마지막 남은 약품을 챙기고 응급 거점을 차렸다.`,
    goal: '신촌 세브란스병원 연구소에서 감염 패턴 데이터를 확보하고, 생존자들을 위한 치료 프로토콜을 수립한다.',
    abilities: [
      {
        id: 'trauma_expert',
        name: '외상 전문가',
        icon: '💉',
        desc: '의료 아이템 치료 효과 +50%',
        effect: { healBonus: 1.5 },
      },
      {
        id: 'clinical_knowledge',
        name: '임상 지식',
        icon: '🔬',
        desc: '감염 진행 속도 -25%',
        effect: { infectionRate: 0.75 },
      },
      {
        id: 'emergency_care',
        name: '응급 처치',
        icon: '🩹',
        desc: '붕대 사용 시 HP +5 추가 회복',
        effect: { bandageHpBonus: 5 },
      },
      {
        id: 'medical_supply',
        name: '의료 물자',
        icon: '🎒',
        desc: '붕대 4개, 소독약, 청진기, 메스, 통조림 2개, 에너지바 2개 추가 지급',
        effect: { startingItems: ['bandage', 'bandage', 'bandage', 'bandage', 'antiseptic', 'stethoscope', 'combat_scalpel', 'canned_food', 'canned_food', 'energy_bar', 'energy_bar'] },
      },
    ],
    startingSkills: {
      medicine:   4,  // 의사 — 의료 숙련도 최상
      scavenging: 2,  // 약품·의료재료 탐색 경험
      defense:    1,  // 기본 방어 능력
      crafting:   1,  // 기본 제작 능력
    },
    specialtySkills: ['medicine', 'scavenging'],
    homeDist: 'dongjak',
    startingStructures: ['medical_station'],
    startingNPCs: ['npc_wounded_soldier', 'npc_nurse'],
  },

  {
    id: 'soldier',
    name: '강민준',
    gender: 'M',
    age: 29,
    maxHp: 110,     // (130 → 110 너프)
    strength: 75,   // 체력(힘) — 군인 (90 → 75 너프)
    endurance: 75,  // 인내심 (90 → 75 너프, stamina ≈ 113)
    maxCarryWeight: 42, // (50 → 42 너프)
    title: '특수전 부사관',
    englishLabel: 'COMBAT',
    portrait: '⚔️',
    portraitFull:  'assets/images/characters/kang_minjun_full.png',
    portraitSmall: 'assets/images/characters/kang_minjun_portrait.png',
    strengths: ['전투 훈련', '전술적 판단', '높은 운반력'],
    weaknesses: ['의료 지식 부족', '동료 상실 트라우마', '제작 미숙'],
    story: `2026년 1월 16일, 종로 광화문정부청사. 강민준 하사(29세)는 비상사태 격상 직전 VIP 경호 임무를 받았다.
청사에서 불과 200미터 거리에서, 팀원 4명이 차례로 쓰러졌다.
광화문에서 후퇴해 용산 미군기지로 철수했다. 무전기는 잡음뿐이었지만, 끊기지 않는 음성이 하나 있었다.
"여기는 여의도 KBS. 아직 방송 중입니다. 살아계신 분들은 신호를 들어주세요."`,
    goal: '여의도 KBS 방송국에 도달해 비상 방송 장비를 가동하고, 전국의 생존자들에게 서울 집결 좌표를 송출한다.',
    abilities: [
      {
        id: 'combat_training',
        name: '전투 훈련',
        icon: '⚔️',
        desc: '전투 데미지 +20%, 크리티컬 확률 +8%',
        effect: { combatDmgBonus: 1.2, critBonus: 0.08 },
      },
      {
        id: 'tactical_movement',
        name: '전술 이동',
        icon: '👣',
        desc: '탐색 소음 -40%',
        effect: { noiseReduct: 0.4 },
      },
      {
        id: 'field_endurance',
        name: '야전 단련',
        icon: '🏃',
        desc: '피로 감소 속도 -30%',
        effect: { fatigueDecay: -0.3 },
      },
      {
        id: 'tactical_gear',
        name: '전술 장비',
        icon: '🎒',
        desc: '나이프 + 알코올 솜 + 붕대 지급',
        effect: { startingItems: ['knife', 'alcohol_swab', 'alcohol_swab', 'bandage'] },
      },
      {
        id: 'comrade_bond',
        name: '전우의 유대',
        icon: '🐕',
        desc: '강아지 동반 시 사기 감소 -20%',
        effect: { companionMoraleDecayReduct: 0.20 },
      },
    ],
    startingSkills: {
      melee:   4,  // 군인 — 근접무기 전문
      ranged:  4,  // 군인 — 총기 훈련
      defense: 3,  // 방어 전술
      unarmed: 3,  // 격투 훈련
    },
    specialtySkills: ['melee', 'ranged'],
    homeDist: 'dobong',
    startingCompanion: 'npc_dog',
  },

  {
    id: 'firefighter',
    name: '박영철',
    gender: 'M',
    age: 44,
    maxHp: 120,
    strength: 80,   // 체력(힘) — 소방관: 높은 신체 능력
    endurance: 85,  // 인내심 — 현장 임무 단련 (→ stamina ≈ 136)
    maxCarryWeight: 45,
    title: '소방관',
    englishLabel: 'RESCUE',
    portrait: '🔥',
    portraitFull:  'assets/images/characters/park_youngchul_full.png',
    portraitSmall: 'assets/images/characters/park_youngchul_portrait.png',
    strengths: ['뛰어난 체력', '구조 기술', '도구 숙련'],
    weaknesses: ['총기 미숙', '가족 걱정 (사기)', '의료 한계'],
    story: `2026년 1월 16일 새벽 3시. 용산에서 대형 화재 신고가 들어왔다.
박영철 소방위(44세)는 10년 경력의 구조대원으로 먼저 진입했다.
그런데 화재가 아니었다. 건물 안에 불길은 없었고 쓰러진 사람들만 있었다.
동료 이재훈이 무언가에 물렸다. "영철아, 나 좀 이상한 것 같아."
박영철은 지하 주차장으로 탈출했다. 은평구 불광동, 거기에 그의 아내와 두 아이가 있다.`,
    goal: '은평구 집으로 돌아가 가족의 생사를 확인하고, 생존자들을 위한 거점 거주지를 구축한다.',
    abilities: [
      {
        id: 'physical_conditioning',
        name: '체력 단련',
        icon: '💪',
        desc: '피로 감소 속도 -20%',
        effect: { fatigueDecay: -0.2 },
      },
      {
        id: 'rescue_technique',
        name: '구조 기술',
        icon: '🚑',
        desc: '의료 아이템 HP 회복 +20%',
        effect: { healBonus: 1.2 },
      },
      {
        id: 'tool_proficiency',
        name: '도구 숙련',
        icon: '🔨',
        desc: '제작 시 30% 확률로 재료 1개 절약',
        effect: { craftSaveChance: 0.3 },
      },
      {
        id: 'rescue_kit',
        name: '구조 키트',
        icon: '🎒',
        desc: '로프 추가 지급',
        effect: { startingItems: ['rope', 'hand_axe'] },
      },
    ],
    startingSkills: {
      unarmed:    3,  // 소방관 — 신체 단련, 격투
      building:   3,  // 구조물 지식, 현장 경험
      scavenging: 2,  // 구조 현장 탐색 경험
    },
    specialtySkills: ['unarmed', 'building'],
    homeDist: 'eunpyeong',
  },

  {
    id: 'homeless',
    name: '최형식',
    gender: 'M',
    age: 52,
    maxHp: 75,      // (65 → 75 버프)
    strength: 50,   // 체력(힘) — 거리 생활로 단련
    endurance: 40,  // 인내심 — 야생 생존형, 지속력은 보통 (→ stamina ≈ 40)
    maxCarryWeight: 32,
    title: '전직 사업가 · 노숙인',
    englishLabel: 'SURVIVAL',
    portrait: '🏕️',
    portraitFull:  'assets/images/characters/choi_hyungsik_full.png',
    portraitSmall: 'assets/images/characters/choi_hyungsik_portrait.png',
    strengths: ['생존 본능', '거리 감각', '절약형 신체'],
    weaknesses: ['낮은 HP', '저질 체력', '사회적 신뢰도 낮음'],
    story: `최형식(52세)은 한때 중견 건설회사 대표였다. 2023년 보증 실패로 모든 것을 잃었다.
동호대교 아래에서 2년을 살았다. 아무것도 없이 버티는 법을 배웠다.
2026년 1월, 세상이 끝나는 날 밤에도 그는 다리 아래에 있었다. 강남 쪽으로 이동해 삼성병원 근처에서 버텼다.
아침이 되자 세상이 끝나 있었다. 그런데 이상하게도, 겁이 나지 않았다.
이미 한 번 다 잃었으니까. 저 위, 롯데타워에서 사람들이 손을 흔드는 것 같았다.`,
    goal: '잠실 롯데타워의 생존자 요새에 합류하고, 거리 생존 노하우를 공유해 집단 생존 체계를 구축한다.',
    abilities: [
      {
        id: 'survival_instinct',
        name: '생존 본능',
        icon: '👁️',
        desc: '탐색 아이템 발견 +1',
        effect: { exploreBonus: 1 },
      },
      {
        id: 'frugal_body',
        name: '절약형 신체',
        icon: '🌿',
        desc: '수분·영양 감소 -20%',
        effect: { hydrationDecay: 0.80, nutritionDecay: 0.80 },
      },
      {
        id: 'street_sense',
        name: '거리 감각',
        icon: '🌆',
        desc: '소음 -20%, 조우 확률 -5%, 도주 성공률 +15%',
        effect: { noiseReduct: 0.2, encounterRateReduct: 0.05, fleeBonus: 0.15 },
      },
      {
        id: 'street_tools',
        name: '거리의 도구',
        icon: '🧰',
        desc: '양철통·낡은 담요·신문지·박스커터 지급. 2년 노숙 생활의 살림살이.',
        effect: { startingItems: ['battered_can', 'old_blanket', 'newspaper_bundle', 'box_cutter'] },
      },
    ],
    startingSkills: {
      scavenging:  4,  // 노숙인 — 뭐든 찾는 생존 본능
      harvesting:  3,  // 자원 채취 (거리 생활)
      cooking:     3,  // 야전 요리
    },
    specialtySkills: ['scavenging', 'harvesting', 'cooking'],
    homeDist: 'gwangjin',  // 동호대교 인근 — 스토리 일치
  },

  {
    id: 'chef',
    name: '윤재혁',
    gender: 'M',
    age: 33,
    maxHp: 95,
    strength: 65,   // 체력(힘) — 셰프: 주방 체력
    endurance: 65,  // 인내심 — 장시간 조리 경험 (→ stamina ≈ 85)
    maxCarryWeight: 35,
    title: '호텔 셰프',
    englishLabel: 'COOK',
    portrait: '🍳',
    portraitFull:  'assets/images/characters/yoon_jaehyuk_full.png',
    portraitSmall: 'assets/images/characters/yoon_jaehyuk_portrait.png',
    strengths: ['미식 감각', '식재료 감별', '칼 다루기'],
    weaknesses: ['전투 경험 부족', '낯선 환경 약함', '제작 한계'],
    story: `윤재혁(33세)은 명동 소피텔 호텔의 수석 셰프였다.
2026년 1월 16일, 호텔 뷔페에서 이상한 손님이 나타났다. 식기를 깨물고 직원을 공격했다.
재혁은 주방 칼을 집어 들고 지하 식품 저장고로 피신했다. 이틀 뒤 밖에 나왔을 때, 호텔은 텅 비어 있었다.
남대문시장으로 이동했다. 그곳에 아직 쓸 만한 식재료가 있을 것이다.
사람들이 굶고 있었다. 재혁은 알고 있었다. 음식은 단순한 생존이 아니라, 희망이라는 것을.`,
    goal: '남대문시장에서 식재료를 확보하고 생존자 급식소를 운영해, 서울 생존자들의 식량 자급 체계를 구축한다.',
    abilities: [
      {
        id: 'gourmet_sense',
        name: '미식 감각',
        icon: '👨‍🍳',
        desc: '요리 아이템 효과 +60%',
        effect: { cookingEffectBonus: 1.6 },
      },
      {
        id: 'ingredient_eye',
        name: '식재료 감별',
        icon: '🔍',
        desc: '독성 음식 섭취 전 경고',
        effect: { toxinDetect: true },
      },
      {
        id: 'warm_meal',
        name: '따뜻한 한 끼',
        icon: '🍲',
        desc: '요리 완료 시 동료 사기 +10',
        effect: { companionMoraleOnCook: 10 },
      },
      {
        id: 'knife_mastery',
        name: '칼 다루기',
        icon: '🔪',
        desc: '나이프/칼 무기 데미지 +25%',
        effect: { knifeDmgBonus: 1.25 },
      },
    ],
    startingSkills: {
      cooking:     4,  // 셰프 — 요리 전문
      harvesting:  3,  // 식재료 감별·채취
      melee:       2,  // 주방 칼 다루기
    },
    specialtySkills: ['cooking', 'harvesting', 'melee'],
    homeDist: 'junggoo',
  },

  {
    id: 'engineer',
    name: '정대한',
    gender: 'M',
    age: 35,
    maxHp: 110,
    strength: 75,   // 체력(힘) — 엔지니어: 공장 육체 노동으로 단련
    endurance: 75,  // 인내심 — 균형 잡힌 지속력 (→ stamina ≈ 113)
    maxCarryWeight: 38,
    title: '기계공학자',
    englishLabel: 'ENGINEER',
    portrait: '🔧',
    portraitFull:  'assets/images/characters/jeong_daehan_full.png',
    portraitSmall: 'assets/images/characters/jeong_daehan_portrait.png',
    strengths: ['공학적 직관', '분해 전문가', '구조물 강화'],
    weaknesses: ['전투 미숙', '의료 지식 한계', '독자적 성향'],
    story: `정대한(35세)은 성수동 소규모 금속 가공 공장의 기술 이사였다.
세상이 무너진 날, 성수동에서 용산 전자상가로 이동해 부품을 확보했다.
머릿속으로 계산했다. 경유 120리터. 1일 최소 가동 시 15일치.
하루하루 줄어드는 연료통을 보며 그는 설계도를 그리기 시작했다.
연료 없이도 달릴 수 있는 무언가. 아니면 연료를 찾을 수 있는 탈것.`,
    goal: 'scrap_metal 8개·rope 3개를 수집해 이동 수단을 제작하고 서울 외곽 탈출 루트를 개척한다.',
    abilities: [
      {
        id: 'engineering_intuition',
        name: '공학적 직관',
        icon: '⚙️',
        desc: '제작 성공률 +30%, 제작 속도 -20%',
        effect: { craftSuccessBonus: 0.3 },
      },
      {
        id: 'dismantle_expert',
        name: '분해 전문가',
        icon: '🔩',
        desc: '분해 시 재료 +1개 추가 획득',
        effect: { dismantleExtraItem: 1 },
      },
      {
        id: 'structure_reinforcement',
        name: '구조물 강화',
        icon: '🏗️',
        desc: '구조물 카드 최대 내구도 +50%',
        effect: { structureDurabilityBonus: 1.5 },
      },
      {
        id: 'factory_materials',
        name: '공장 자재',
        icon: '🎒',
        desc: '고철, 전선 추가 지급',
        effect: { startingItems: ['scrap_metal', 'wire'] },
      },
    ],
    startingSkills: {
      crafting:    4,  // 엔지니어 — 핵심 제작 능력
      building:    4,  // 공학 설계·건설
      weaponcraft: 3,  // 금속 가공 → 무기 제작
      armorcraft:  2,  // 기초 방어구 제작
    },
    specialtySkills: ['crafting', 'building'],
    homeDist: 'yongsan',
  },
];

// I-2 트랙 — 캐릭터선택 화면 능력치 5종 게이지 (가상 이미지 정렬)
// GameState 1:1 매핑 (사용자 결정 2026-04-28):
//   정신건강 → mental 시스템
//   스테미나 → stamina (endurance × 1.5 근사)
//   의료스킬 → skills.medicine
//   전투스킬 → skills.melee + ranged + unarmed 합
//   제작스킬 → skills.crafting + weaponcraft + armorcraft + building 합
export const CHAR_GAUGE_KEYS = [
  { id: 'mental',   label: '정신건강', labelEn: 'MENTAL'   },
  { id: 'stamina',  label: '스테미나', labelEn: 'STAMINA'  },
  { id: 'medicine', label: '의료스킬', labelEn: 'MEDICAL'  },
  { id: 'combat',   label: '전투스킬', labelEn: 'COMBAT'   },
  { id: 'crafting', label: '제작스킬', labelEn: 'CRAFT'    },
];

/** 캐릭터의 5종 게이지 값 계산 (0-100 정규화, 클램프) */
export function getCharacterGauges(character) {
  const skills = character.startingSkills ?? {};
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  return {
    mental:   100, // 시작 시점 기본값 (실제 게임에서는 mental 시스템이 변동)
    stamina:  clamp((character.endurance ?? 0) * 1.5),
    medicine: clamp((skills.medicine ?? 0) * 20),
    combat:   clamp(((skills.melee ?? 0) + (skills.ranged ?? 0) + (skills.unarmed ?? 0)) * 10),
    crafting: clamp(((skills.crafting ?? 0) + (skills.weaponcraft ?? 0) + (skills.armorcraft ?? 0) + (skills.building ?? 0)) * 8),
  };
}

export default CHARACTERS;
