// === NPC NARRATIVE MEMORIES ===
// 공유 기억 트리거: 플레이어와 함께한 사건을 NPC가 기억하고 나중에 언급한다.
// trigger: EventBus 이벤트 키. delay: 발화까지 대기 TP (72=1일).

export const NPC_MEMORY_TRIGGERS = {

  npc_nurse: [
    {
      id:        'nurse_mem_healed_critical',
      trigger:   'playerHealed',
      condition: (gs) => (gs.player?.hp?.current ?? 100) / (gs.player?.hp?.max ?? 100) < 0.25,
      delay:     72,
      line:      '"그때 HP가 거의 0이었잖아. 다시는 그렇게 위험하게 하지 마. 제발."',
      effect:    { trust: 1, emotion: 'hopeful' },
    },
    {
      id:        'nurse_mem_first_combat',
      trigger:   'combatEnd',
      condition: (gs) => !gs.flags.nurse_sawFirstCombat,
      delay:     48,
      line:      '"전투를 직접 보고 나서… 이 세상이 정말 무너졌다는 게 실감 나."',
      effect:    { emotion: 'anxious' },
      setFlag:   'nurse_sawFirstCombat',
    },
    {
      id:        'nurse_mem_disease_cured',
      trigger:   'diseaseCured',
      condition: () => true,
      delay:     24,
      line:      '"치료됐다. 다행이야. 나도 최선을 다했어."',
      effect:    { trust: 1 },
    },
  ],

  npc_soldier_deserter: [
    {
      id:        'soldier_mem_victory',
      trigger:   'combatEnd',
      condition: (gs) => gs.combat?.outcome === 'victory',
      delay:     12,
      line:      '"잘 싸웠어. 군대 있을 때도 이런 동료 없었는데."',
      effect:    { trust: 1 },
    },
    {
      id:        'soldier_mem_fled',
      trigger:   'combatEnd',
      condition: (gs) => gs.combat?.outcome === 'fled',
      delay:     24,
      line:      '"후퇴가 최선일 때도 있어. 잘한 거야. 자책하지 마."',
      effect:    { emotion: 'calm' },
    },
    {
      id:        'soldier_mem_basecamp',
      trigger:   'basecampBuilt',
      condition: () => true,
      delay:     96,
      line:      '"거점이 생겼네. 오랜만에 등 뒤가 안심된다."',
      effect:    { emotion: 'hopeful', trust: 1 },
    },
  ],

  npc_old_survivor: [
    {
      id:        'old_mem_winter',
      trigger:   'seasonChanged',
      condition: (gs) => gs.season?.current === 'winter',
      delay:     48,
      line:      '"겨울이 왔구나. 나는 이 추위를 수십 번 넘겼어. 같이 버티자."',
      effect:    { trust: 1, emotion: 'calm' },
    },
    {
      id:        'old_mem_100days',
      trigger:   'dayAdvanced',
      condition: (gs) => (gs.time?.day ?? 0) === 100,
      delay:     0,
      line:      '"벌써 100일이야. 자네 덕분에 여기까지 왔어."',
      effect:    { trust: 1, emotion: 'hopeful' },
    },
  ],

  npc_dog: [
    {
      id:        'dog_mem_rain',
      trigger:   'weatherChanged',
      condition: (gs) => gs.weather?.id === 'rain',
      delay:     12,
      line:      '개가 몸을 바짝 붙여왔다. 빗소리가 두려운 것 같다.',
      effect:    { emotion: 'anxious' },
    },
    {
      id:        'dog_mem_player_sleep',
      trigger:   'playerRested',
      condition: () => true,
      delay:     6,
      line:      '잠든 사이 개가 발치에 웅크리고 경비를 섰다.',
      effect:    { emotion: 'calm' },
    },
  ],

  npc_child: [
    {
      id:        'child_mem_food',
      trigger:   'playerAte',
      condition: () => true,
      delay:     24,
      line:      '"아저씨 덕분에 오늘도 배불러요. 감사해요."',
      effect:    { trust: 1, emotion: 'hopeful' },
    },
    {
      id:        'child_mem_danger',
      trigger:   'combatEnd',
      condition: () => true,
      delay:     36,
      line:      '"무서웠어요. 그래도 아저씨 있어서 괜찮았어요."',
      effect:    { emotion: 'anxious' },
    },
  ],

  npc_mechanic: [
    {
      id:        'mechanic_mem_craft',
      trigger:   'craftCompleted',
      condition: () => true,
      delay:     18,
      line:      '"잘 만들었어. 더 좋은 재료 있으면 업그레이드도 가능해."',
      effect:    { trust: 1 },
    },
  ],

  npc_student: [
    {
      id:        'student_mem_explore',
      trigger:   'exploreCompleted',
      condition: () => true,
      delay:     36,
      line:      '"탐색 데이터 기록해뒀어. 다음엔 더 효율적으로 갈 수 있어."',
      effect:    { trust: 1 },
    },
  ],
};
