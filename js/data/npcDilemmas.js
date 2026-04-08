// === NPC DILEMMA SCENARIOS ===
// 생사의 기로 딜레마: 플레이어가 NPC와 자원을 두고 선택해야 하는 상황.
// condition: (gs) => boolean — 딜레마 발동 조건
// choices[].effect: 선택 시 적용될 변화

export const DILEMMAS = [

  {
    id:      'medicine_shortage',
    title:   '약이 하나뿐',
    trigger: 'itemUsed',
    condition: (gs) => {
      const injuredCompanion = (gs.companions ?? []).find(id =>
        (gs.npcs?.states?.[id]?.hp ?? 50) < 20
      );
      return !!(injuredCompanion && (gs.countOnBoard?.('first_aid_kit') ?? 0) >= 1);
    },
    getContext: (gs) => {
      const npcId = (gs.companions ?? []).find(id =>
        (gs.npcs?.states?.[id]?.hp ?? 50) < 20
      );
      return { npcId };
    },
    body: '응급키트가 하나 남았다. 당신의 HP도 위험하고, {npcName}도 중상이다. 누구에게 쓸 것인가?',
    choices: [
      {
        id:     'self',
        label:  '내가 쓴다',
        effect: { playerHeal: 30, npcTrustDelta: -1, npcEmotion: 'anxious',
                  memo: '나를 선택한 사실을 NPC가 기억한다.' },
      },
      {
        id:     'npc',
        label:  '{npcName}에게 쓴다',
        effect: { npcHeal: 30, npcTrustDelta: 2, npcEmotion: 'hopeful',
                  memo: '자기 희생을 기억해 신뢰가 깊어진다.' },
      },
    ],
    cooldownDays: 5,
  },

  {
    id:      'food_share',
    title:   '마지막 식량',
    trigger: 'statCritical',
    condition: (gs) => {
      const nutrition = gs.stats?.nutrition?.current ?? 100;
      return nutrition < 10 && (gs.companions?.length ?? 0) > 0;
    },
    getContext: (gs) => {
      const npcId = gs.companions?.[0] ?? null;
      return { npcId };
    },
    body: '식량이 거의 없다. {npcName}도 배고프다. 남은 것을 어떻게 할 것인가?',
    choices: [
      {
        id:     'share',
        label:  '반반 나눈다',
        effect: { playerNutrition: 5, npcNutrition: 5, npcTrustDelta: 1, npcEmotion: 'calm' },
      },
      {
        id:     'keep',
        label:  '내가 먹는다',
        effect: { playerNutrition: 10, npcTrustDelta: -2, npcEmotion: 'anxious' },
      },
      {
        id:     'give',
        label:  '{npcName}에게 준다',
        effect: { npcNutrition: 10, npcTrustDelta: 3, npcEmotion: 'hopeful', playerMorale: -10 },
      },
    ],
    cooldownDays: 7,
  },

  {
    id:      'dangerous_rescue',
    title:   '위험한 구출',
    trigger: 'exploreCompleted',
    condition: (gs) => {
      const hasCompanion = (gs.companions?.length ?? 0) > 0;
      const day = gs.time?.day ?? 0;
      return hasCompanion && day >= 15 && !gs.flags.rescueDilemmaShown;
    },
    getContext: (gs) => {
      const npcId = gs.companions?.[0] ?? null;
      return { npcId };
    },
    body: '탐색 중 생존자의 울음소리가 들린다. 하지만 좀비가 가득한 구역이다. {npcName}은 구하러 가자고 한다.',
    choices: [
      {
        id:     'rescue',
        label:  '구하러 간다',
        effect: { playerHpDelta: -20, npcTrustDelta: 2, npcEmotion: 'hopeful',
                  giveItems: [{ id: 'bandage', qty: 2 }], groupMoraleDelta: 15 },
      },
      {
        id:     'leave',
        label:  '포기한다',
        effect: { npcTrustDelta: -1, npcEmotion: 'anxious', groupMoraleDelta: -10,
                  memo: '포기한 선택을 NPC가 오래 기억한다.' },
      },
    ],
    setFlag:      'rescueDilemmaShown',
    cooldownDays: 99,
  },

  {
    id:      'companion_vs_stranger',
    title:   '동반자냐 낯선 자냐',
    trigger: 'npcThreatened',
    condition: (gs) => (gs.companions?.length ?? 0) >= 2,
    getContext: (gs) => {
      const npcId = gs.companions?.[0] ?? null;
      return { npcId };
    },
    body: '전투 중 두 동반자가 동시에 위험에 처했다. 한 명만 구할 수 있다.',
    choices: [
      {
        id:     'save_first',
        label:  '첫 번째를 구한다',
        effect: { saveNpc: 'first', otherNpcHpDelta: -30, otherNpcTrustDelta: 0 },
      },
      {
        id:     'save_second',
        label:  '두 번째를 구한다',
        effect: { saveNpc: 'second', otherNpcHpDelta: -30, otherNpcTrustDelta: 0 },
      },
    ],
    cooldownDays: 30,
  },
];
