// === NPC↔NPC RELATIONSHIP WEB ===
// NPC들끼리의 감정 관계. 플레이어 없이 NPC끼리 영향을 주고받는다.
// key: 'npcA|npcB' (alphabetical order)
// dailyBonus: 두 NPC 모두 동반자일 때 매일 적용
// onEvent: 특정 이벤트 발생 시 반응

export const NPC_RELATIONS = {

  'npc_soldier_deserter|npc_child': {
    type:        'protective',
    label:       '보호 본능',
    icon:        '🛡️',
    description: '탈영병이 아이를 보호하려 한다.',
    dailyBonus:  { childMoraleDelta: 3, soldierMoraleDelta: 2 },
    onEvents: [
      {
        event:     'npcDamaged',
        npcFilter: 'npc_child',
        reaction:  { emotionChange: { npcId: 'npc_soldier_deserter', emotion: 'trauma' }, trustDelta: -1 },
      },
      {
        event:     'npcDismissed',
        npcFilter: 'npc_child',
        reaction:  { emotionChange: { npcId: 'npc_soldier_deserter', emotion: 'trauma' } },
      },
    ],
  },

  'npc_nurse|npc_old_survivor': {
    type:        'caregiver',
    label:       '의료 유대',
    icon:        '🏥',
    description: '간호사가 노인의 건강을 챙긴다.',
    dailyBonus:  { oldHealPerDay: 2, nurseMoraleDelta: 1 },
    onEvents: [
      {
        event:     'npcDamaged',
        npcFilter: 'npc_old_survivor',
        reaction:  { emotionChange: { npcId: 'npc_nurse', emotion: 'anxious' } },
      },
    ],
  },

  'npc_dog|npc_child': {
    type:        'playmates',
    label:       '놀이 친구',
    icon:        '🎈',
    description: '개와 아이가 서로 위안이 된다.',
    dailyBonus:  { childMoraleDelta: 5, dogMoraleDelta: 3, groupMoraleDelta: 2 },
    onEvents: [],
  },

  'npc_student|npc_mechanic': {
    type:        'knowledge',
    label:       '지식 공유',
    icon:        '📚',
    description: '학생과 정비사가 서로 배운다.',
    dailyBonus:  { craftBonusTick: 0.01, groupCohesionDelta: 1 },
    onEvents: [],
  },

  'npc_old_survivor|npc_trader': {
    type:        'old_friends',
    label:       '오랜 지인',
    icon:        '🤝',
    description: '두 사람은 오래된 지인이다.',
    dailyBonus:  { traderTrustBonus: 0.5, oldMoraleDelta: 2 },
    triggerDays: 3,
    onTrigger: {
      message: '👴🧳 노인과 상인이 오래전 이웃이었음이 밝혀졌다. 거래 시 재료 1개 추가 절약.',
      effect:  { tradeSaveExtra: 1 },
    },
    onEvents: [],
  },

  'npc_nurse|npc_dog': {
    type:        'comfort',
    label:       '서로의 위안',
    icon:        '💕',
    description: '간호사와 개가 서로 정서적 지지가 된다.',
    dailyBonus:  { nurseMoraleDelta: 2, dogMoraleDelta: 2 },
    onEvents: [],
  },

  'npc_soldier_deserter|npc_old_survivor': {
    type:        'respect',
    label:       '세대 간 존중',
    icon:        '🎖️',
    description: '노인의 경험을 탈영병이 존중한다.',
    dailyBonus:  { soldierMoraleDelta: 1, oldMoraleDelta: 1 },
    onEvents: [
      {
        event:     'combatEnd',
        npcFilter: null,
        reaction:  { groupCohesionDelta: 1 },
      },
    ],
  },
};
