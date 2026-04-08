// === NPC CHEMISTRY ===
// Synergy and conflict effects triggered when specific NPC pairs are both companions.
// Each entry fires once (flagged) after `triggerDays` days of co-companionship.

export const NPC_CHEMISTRY = [
  {
    id:           'soldier_dog_patrol',
    npcA:         'npc_soldier_deserter',
    npcB:         'npc_dog',
    type:         'synergy',
    triggerDays:  5,
    message:      '🪖🐕 민준과 개가 경계 순찰 호흡을 맞추기 시작했다. 탐색 위험 조우 확률 -15%.',
    effect:       { exploreRiskReduction: 0.15 },
  },
  {
    id:           'old_trader_old_friends',
    npcA:         'npc_old_survivor',
    npcB:         'npc_trader',
    type:         'synergy',
    triggerDays:  3,
    message:      '👴🧳 노인과 상인이 오래된 지인임이 밝혀졌다. 거래 시 재료 1개 절약.',
    effect:       { tradeSaveOne: true },
  },
  {
    id:           'nurse_mechanic_care',
    npcA:         'npc_nurse',
    npcB:         'npc_mechanic',
    type:         'synergy',
    triggerDays:  7,
    message:      '👩‍⚕️🔧 간호사와 정비사가 협력하기 시작했다. 제작 성공 시 HP 5 회복.',
    effect:       { craftHealBonus: 5 },
  },
  {
    id:           'soldier_child_protect',
    npcA:         'npc_soldier_deserter',
    npcB:         'npc_child',
    type:         'synergy',
    triggerDays:  3,
    message:      '🪖👧 민준이 아이를 보호하겠다고 결심했다. 사기(모랄) +10 영구 보너스.',
    effect:       { moraleBonus: 10 },
  },
  {
    id:           'student_nurse_research',
    npcA:         'npc_student',
    npcB:         'npc_nurse',
    type:         'synergy',
    triggerDays:  5,
    message:      '📖👩‍⚕️ 학생과 간호사가 감염 연구를 진행했다. 감염 수치 증가 속도 -10%.',
    effect:       { infectionRateReduction: 0.1 },
  },
];
