// === CHARACTER DEFINITIONS ===
// 6명의 고유 직업 캐릭터. 각자 배경 스토리·능력·시작 지역을 가진다.

export const CHARACTERS = [
  {
    id: 'doctor',
    name: '이지수',
    gender: 'F',
    maxHp: 95,      // (90 → 95 버프)
    strength: 58,   // 체력(힘) (55 → 58 버프)
    endurance: 72,  // 인내심 (70 → 72 버프, stamina ≈ 84)
    maxCarryWeight: 32, // (30 → 32 버프)
    title: '응급의학과 전문의',
    portrait: '🩺',
    story: `2026년 1월 17일, 강남 삼성서울병원 응급실. 이지수 전문의(38세)는 11시간째 수술 중이었다.
갑자기 복도에서 비명이 들렸다. ICU 환자 하나가 갑자기 일어나 간호사를 물어뜯었다.
이지수는 약품 창고에 자신을 가두고 3일을 버텼다. 밖에 나왔을 때, 병원은 지옥이 되어 있었다.
그녀의 배낭에는 훔쳐둔 약품들과 직접 손으로 적은 메모가 있었다.
"신촌 세브란스. 바이러스 연구팀. 연락 두절 D+3."`,
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
        desc: '감염 진행 속도 -35%',
        effect: { infectionRate: 0.65 },
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
        desc: '붕대, 소독약 추가 지급',
        effect: { startingItems: ['bandage', 'antiseptic'] },
      },
    ],
    startingSkills: {
      medicine:   4,  // 의사 — 의료 숙련도 최상
      scavenging: 2,  // 약품·의료재료 탐색 경험
    },
    homeDist: 'dongjak',
  },

  {
    id: 'soldier',
    name: '강민준',
    gender: 'M',
    maxHp: 110,     // (130 → 110 너프)
    strength: 75,   // 체력(힘) — 군인 (90 → 75 너프)
    endurance: 75,  // 인내심 (90 → 75 너프, stamina ≈ 113)
    maxCarryWeight: 42, // (50 → 42 너프)
    title: '특수전 부사관',
    portrait: '⚔️',
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
        desc: '나이프 추가 지급',
        effect: { startingItems: ['knife'] },
      },
    ],
    startingSkills: {
      melee:   4,  // 군인 — 근접무기 전문
      ranged:  4,  // 군인 — 총기 훈련
      defense: 3,  // 방어 전술
      unarmed: 3,  // 격투 훈련
    },
    homeDist: 'dobong',
  },

  {
    id: 'firefighter',
    name: '박영철',
    gender: 'M',
    maxHp: 120,
    strength: 80,   // 체력(힘) — 소방관: 높은 신체 능력
    endurance: 85,  // 인내심 — 현장 임무 단련 (→ stamina ≈ 136)
    maxCarryWeight: 45,
    title: '소방관',
    portrait: '🔥',
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
    homeDist: 'eunpyeong',
  },

  {
    id: 'homeless',
    name: '최형식',
    gender: 'M',
    maxHp: 65,
    strength: 50,   // 체력(힘) — 거리 생활로 단련
    endurance: 40,  // 인내심 — 야생 생존형, 지속력은 보통 (→ stamina ≈ 40)
    maxCarryWeight: 32,
    title: '전직 사업가 · 노숙인',
    portrait: '🏕️',
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
        desc: '소음 -20%, 조우 확률 -5%',
        effect: { noiseReduct: 0.2, encounterRateReduct: 0.05 },
      },
      {
        id: 'bare_start',
        name: '맨손 시작',
        icon: '✊',
        desc: '추가 지급 아이템 없음. 없어도 살아남는 법을 안다.',
        effect: {},
      },
    ],
    startingSkills: {
      scavenging:  4,  // 노숙인 — 뭐든 찾는 생존 본능
      harvesting:  3,  // 자원 채취 (거리 생활)
      cooking:     3,  // 야전 요리
    },
    homeDist: 'yangcheon',
  },

  {
    id: 'pharmacist',
    name: '한소희',
    gender: 'F',
    maxHp: 80,
    strength: 50,   // 체력(힘) — 약사: 신체적으로 약함
    endurance: 60,  // 인내심 — 집중력은 있지만 신체 지속력 낮음 (→ stamina ≈ 60)
    maxCarryWeight: 28,
    title: '약사',
    portrait: '💊',
    story: `한소희(31세)는 홍대 입구 골목 작은 약국의 원장이었다.
2026년 1월 14일, 이상한 증상의 환자들이 오기 시작했다. 발열, 이상 행동, 희번뜩이는 눈.
소희는 알아차렸다. 사흘 뒤 세상이 무너지기 전에, 그녀는 약국 창고를 비워 배낭을 쌓았다.
홍대에서 도망쳐 삼성병원으로 피신했다. 도망치면서도 그녀는 관찰했다. 감염자들의 패턴. 증상의 진행 순서.
언젠가 이 데이터가 쓸모가 있을 것이다.`,
    goal: '5종 이상의 의료 재료를 수집해 실험적 항바이러스 합성을 완성하고 감염 차단 방법을 증명한다.',
    abilities: [
      {
        id: 'pharmaceutical_expert',
        name: '약제 전문',
        icon: '🧪',
        desc: '의료 아이템 효과 +40%, 감염 회복 속도 +30%',
        effect: { healBonus: 1.4, infectionRecovery: 1.3 },
      },
      {
        id: 'ingredient_analysis',
        name: '성분 분석',
        icon: '🔍',
        desc: '의료 아이템 분해 시 재료 획득 +25%',
        effect: { dismantleBonus: 0.25 },
      },
      {
        id: 'efficient_dosing',
        name: '절약 투약',
        icon: '💉',
        desc: '소모성 의료 아이템 용량 +1회',
        effect: { medicalUsesBonus: 1 },
      },
      {
        id: 'pharmacy_stock',
        name: '약국 재고',
        icon: '🎒',
        desc: '소독약, 진통제 추가 지급',
        effect: { startingItems: ['antiseptic', 'painkiller'] },
      },
    ],
    startingSkills: {
      medicine:  3,  // 약사 — 의약품 지식
      crafting:  3,  // 조제·제조 능력
      cooking:   2,  // 약재 조합 기초
    },
    homeDist: 'gwanak',
  },

  {
    id: 'engineer',
    name: '정대한',
    gender: 'M',
    maxHp: 110,
    strength: 75,   // 체력(힘) — 엔지니어: 공장 육체 노동으로 단련
    endurance: 75,  // 인내심 — 균형 잡힌 지속력 (→ stamina ≈ 113)
    maxCarryWeight: 38,
    title: '기계공학자',
    portrait: '🔧',
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
    homeDist: 'nowon',
  },
];

export default CHARACTERS;
