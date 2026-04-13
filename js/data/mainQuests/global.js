// === GLOBAL QUESTS — 모든 캐릭터 공통 튜토리얼 ===
// 카테고리별 기초 생존 학습 퀘스트 (20개)
// deadline/penalty 없음 — 언제든 완료 가능
// characterId: null → 캐릭터 무관 자동 시작

const GLOBAL_QUESTS = {

  // ── 1. 식량 (Food) ──────────────────────────────────────────────

  gq_food_1: {
    id: 'gq_food_1',
    title: '첫 끼니',
    desc: '음식을 3개 확보하라. 굶주리면 아무것도 할 수 없다.',
    icon: '🍱',
    characterId: null,
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 10 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '배가 고프다. 일단 먹을 것을 찾아야 한다. 도시 어딘가에 남은 음식이 있을 것이다.',
      complete: '일단 살았다. 먹어야 움직이고, 움직여야 살아남는다.',
    },
  },

  gq_food_2: {
    id: 'gq_food_2',
    title: '직접 만든 밥',
    desc: '음식을 직접 조리해보자. 조리 음식은 날것보다 회복력이 높다.',
    icon: '🍳',
    characterId: null,
    dayTrigger: 5,
    prerequisite: 'gq_food_1',
    objective: { type: 'craft_item', category: 'food', count: 1 },
    reward: { morale: 12 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '날것만 먹다 보면 몸이 망가진다. 불을 피우고 조리하는 법을 익혀야 한다.',
      complete: '조리한 음식은 다르다. 몸도 마음도 조금 나아진 것 같다.',
    },
  },

  gq_food_3: {
    id: 'gq_food_3',
    title: '장기 비축',
    desc: '음식을 10개 비축하라. 내일을 위한 준비가 오늘을 지킨다.',
    icon: '🥫',
    characterId: null,
    dayTrigger: 15,
    prerequisite: 'gq_food_2',
    objective: { type: 'collect_item_type', itemType: 'food', count: 10 },
    reward: { morale: 20 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '하루하루 연명하는 건 한계가 있다. 비축분이 있어야 진짜 생존이다.',
      complete: '비축 완료. 당분간은 식량 걱정을 덜 수 있다.',
    },
  },

  // ── 2. 음료/물 (Water) ──────────────────────────────────────────

  gq_water_1: {
    id: 'gq_water_1',
    title: '깨끗한 물',
    desc: '깨끗한 물 3개를 확보하라. 오염된 물은 독이다.',
    icon: '💧',
    characterId: null,
    dayTrigger: 2,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 10 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '수도가 끊겼다. 오염된 물을 그냥 마시면 병에 걸린다. 깨끗한 물을 확보해야 한다.',
      complete: '물이 있다. 이걸로 며칠은 버틸 수 있다.',
    },
  },

  gq_water_2: {
    id: 'gq_water_2',
    title: '물 확보 루틴',
    desc: '깨끗한 물 8개를 비축하라. 물 없이는 아무것도 없다.',
    icon: '🪣',
    characterId: null,
    dayTrigger: 20,
    prerequisite: 'gq_water_1',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 8 },
    reward: { morale: 18 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '물 한 모금이 생사를 가른다. 비축량을 늘려야 한다.',
      complete: '물 비축 완료. 기본이 갖춰졌다.',
    },
  },

  // ── 3. 의료 (Medical) ────────────────────────────────────────────

  gq_medical_1: {
    id: 'gq_medical_1',
    title: '응급처치 준비',
    desc: '붕대 2개를 확보하라. 상처는 방치하면 죽는다.',
    icon: '🩹',
    characterId: null,
    dayTrigger: 3,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'bandage', count: 2 },
    reward: { morale: 10 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '전투, 사고, 감염 — 부상은 언제든 온다. 최소한의 치료 도구가 필요하다.',
      complete: '붕대를 확보했다. 이제 최소한의 처치는 할 수 있다.',
    },
  },

  gq_medical_2: {
    id: 'gq_medical_2',
    title: '의약품 비축',
    desc: '의료 아이템을 5개 모아라. 버티는 것도 실력이다.',
    icon: '💊',
    characterId: null,
    dayTrigger: 18,
    prerequisite: 'gq_medical_1',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    reward: { morale: 15 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '약이 없으면 작은 감염도 목숨을 앗아간다. 의약품을 모아야 한다.',
      complete: '어느 정도 의료 비축분이 생겼다. 조금은 안심된다.',
    },
  },

  gq_medical_3: {
    id: 'gq_medical_3',
    title: '직접 만드는 치료제',
    desc: '의료 아이템을 직접 제작해보자. 조합법을 익혀두면 오래 살아남는다.',
    icon: '🧪',
    characterId: null,
    dayTrigger: 35,
    prerequisite: 'gq_medical_2',
    objective: { type: 'craft_item', category: 'medical', count: 1 },
    reward: { morale: 20 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '약국이 없는 세상. 직접 만드는 법을 배워야 한다.',
      complete: '직접 만든 치료제. 이제 자급자족이 가능하다.',
    },
  },

  // ── 4. 건축/방어 (Building) ──────────────────────────────────────

  gq_build_1: {
    id: 'gq_build_1',
    title: '첫 번째 방어선',
    desc: '방어 구조물을 1개 세워라. 안전한 기지가 있어야 잠을 잘 수 있다.',
    icon: '🪵',
    characterId: null,
    dayTrigger: 8,
    prerequisite: null,
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 15 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '사방이 열려 있으면 버틸 수 없다. 최소한의 방어선이 필요하다.',
      complete: '구조물이 세워졌다. 이제 조금은 안전하다.',
    },
  },

  gq_build_2: {
    id: 'gq_build_2',
    title: '기지 강화',
    desc: '구조물을 3개 추가로 세워라. 기지를 단단히 만들어야 한다.',
    icon: '🏗️',
    characterId: null,
    dayTrigger: 25,
    prerequisite: 'gq_build_1',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 20 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '하나로는 부족하다. 기지를 더 강화해야 군집의 다음 공격을 버틸 수 있다.',
      complete: '방어선이 두터워졌다. 이 정도면 웬만한 위협은 막을 수 있다.',
    },
  },

  gq_build_3: {
    id: 'gq_build_3',
    title: '요새화',
    desc: '구조물을 총 6개 확보하라. 이 기지는 쉽게 무너지지 않는다.',
    icon: '🏰',
    characterId: null,
    dayTrigger: 45,
    prerequisite: 'gq_build_2',
    objective: { type: 'craft_item', category: 'structure', count: 6 },
    reward: { morale: 25 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '군집이 더 강해지고 있다. 완전한 요새가 필요하다.',
      complete: '요새가 완성됐다. 이제 이곳은 쉽게 무너지지 않는다.',
    },
  },

  // ── 5. 장비/무장 (Equipment) ─────────────────────────────────────

  gq_equip_1: {
    id: 'gq_equip_1',
    title: '무기를 갖춰라',
    desc: '주무기 슬롯에 무기를 장착하라. 맨손으로 싸우는 건 자살행위다.',
    icon: '⚔️',
    characterId: null,
    dayTrigger: 4,
    prerequisite: null,
    objective: { type: 'equip_slot', slot: 'weapon_main' },
    reward: { morale: 12 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '감염자든 약탈자든 — 무기 없이는 살아남을 수 없다. 뭐든 손에 쥐어야 한다.',
      complete: '무기를 갖췄다. 이제 싸울 수 있다.',
    },
  },

  gq_equip_2: {
    id: 'gq_equip_2',
    title: '몸을 보호하라',
    desc: '방어구 슬롯에 갑옷/의복을 장착하라. 맞지 않는 것이 최선이다.',
    icon: '🛡️',
    characterId: null,
    dayTrigger: 10,
    prerequisite: 'gq_equip_1',
    objective: { type: 'equip_slot', slot: 'body' },
    reward: { morale: 12 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '공격을 완전히 피할 수는 없다. 맞더라도 버틸 수 있어야 한다.',
      complete: '방어구를 갖췄다. 이제 조금은 더 버틸 수 있다.',
    },
  },

  // ── 6. 자원 채집 (Gathering) ─────────────────────────────────────

  gq_gather_1: {
    id: 'gq_gather_1',
    title: '자원 수집',
    desc: '각종 재료를 5개 모아라. 모든 제작의 시작은 재료 수집이다.',
    icon: '🔩',
    characterId: null,
    dayTrigger: 6,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'material', count: 5 },
    reward: { morale: 10 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '버려진 도시엔 자원이 넘쳐난다. 눈을 뜨고 다니면 뭔가 찾을 수 있다.',
      complete: '재료를 모았다. 이걸로 뭔가 만들 수 있겠다.',
    },
  },

  gq_gather_2: {
    id: 'gq_gather_2',
    title: '약초 채집',
    desc: '허브/약초를 3개 채집하라. 자연은 훌륭한 약국이다.',
    icon: '🌿',
    characterId: null,
    dayTrigger: 12,
    prerequisite: 'gq_gather_1',
    objective: { type: 'collect_item', definitionId: 'herb', count: 3 },
    reward: { morale: 12 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '공원과 산기슭에는 아직 약초가 남아있다. 알아보고 채집하는 법을 익혀야 한다.',
      complete: '약초를 채집했다. 이걸로 간단한 치료제를 만들 수 있다.',
    },
  },

  // ── 7. 고철/원자재 (Raw Materials) ──────────────────────────────

  gq_raw_1: {
    id: 'gq_raw_1',
    title: '고철 수집',
    desc: '고철 5개를 모아라. 고철은 이 세상의 화폐다.',
    icon: '🔧',
    characterId: null,
    dayTrigger: 7,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 5 },
    reward: { morale: 10 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '고철이 있으면 무기도, 구조물도, 도구도 만들 수 있다. 보이는 대로 챙겨라.',
      complete: '고철을 모았다. 제작의 핵심 재료가 생겼다.',
    },
  },

  gq_raw_2: {
    id: 'gq_raw_2',
    title: '목재 확보',
    desc: '목재 5개를 확보하라. 나무는 건축과 연료의 기본이다.',
    icon: '🪵',
    characterId: null,
    dayTrigger: 7,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'wood', count: 5 },
    reward: { morale: 10 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '공원, 가구, 건물 잔해 — 나무는 어디에나 있다. 잘 활용하면 무엇이든 만들 수 있다.',
      complete: '목재를 확보했다. 이걸로 기본 구조물을 세울 수 있다.',
    },
  },

  // ── 8. 생존 마일스톤 (Survival) ──────────────────────────────────

  gq_survive_1: {
    id: 'gq_survive_1',
    title: '첫 주 생존',
    desc: '7일을 버텨라. 첫 일주일이 가장 힘들다.',
    icon: '📅',
    characterId: null,
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'survive_days', count: 7 },
    reward: { morale: 15 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '재난 첫 날. 어디서부터 시작해야 할지 막막하다. 일단 오늘을 버텨라.',
      complete: '일주일을 살아남았다. 이 도시에서 살아남을 수 있다는 걸 증명했다.',
    },
  },

  gq_survive_2: {
    id: 'gq_survive_2',
    title: '한 달 생존',
    desc: 'Day 30까지 버텨라. 살아남은 자가 강한 자다.',
    icon: '🌙',
    characterId: null,
    dayTrigger: 7,
    prerequisite: 'gq_survive_1',
    objective: { type: 'survive_days', count: 30 },
    reward: { morale: 20 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '한 달. 대부분은 이 정도면 포기하거나 쓰러진다. 넌 아직 서 있다.',
      complete: '한 달을 버텼다. 이 도시의 리듬을 알기 시작했다.',
    },
  },

  gq_survive_3: {
    id: 'gq_survive_3',
    title: '두 달 생존',
    desc: 'Day 60까지 버텨라. 여기까지 온 사람은 많지 않다.',
    icon: '🌟',
    characterId: null,
    dayTrigger: 30,
    prerequisite: 'gq_survive_2',
    objective: { type: 'survive_days', count: 60 },
    reward: { morale: 25 },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '두 달째. 초기의 혼란이 가라앉고 진짜 생존이 시작됐다.',
      complete: '두 달을 버텼다. 서울은 여전히 위험하지만, 이제 여기가 집이다.',
    },
  },

};

export default GLOBAL_QUESTS;
