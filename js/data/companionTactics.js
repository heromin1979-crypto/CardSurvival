export const COMPANION_TACTICS = {
  npc_old_survivor: {
    preferredStance: 'hold',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_nurse: {
    preferredStance: 'heal',
    priorities: [
      { role: 'heal', when: 'ally_below_60' },
      { role: 'support', when: 'ally_stress_6_plus' },
      { role: 'damage' },
    ],
  },
  npc_soldier_deserter: {
    preferredStance: 'support',
    priorities: [
      { role: 'control' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_child: {
    preferredStance: 'support',
    priorities: [
      { role: 'support' },
      { role: 'guard', when: 'ally_below_60' },
      { role: 'damage' },
    ],
  },
  npc_mechanic: {
    preferredStance: 'support',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'control' },
      { role: 'damage' },
    ],
  },
  npc_student: {
    preferredStance: 'support',
    priorities: [
      { role: 'heal', when: 'ally_below_60' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_dog: {
    preferredStance: 'support',
    priorities: [
      { role: 'control' },
      { role: 'guard', when: 'ally_below_60' },
      { role: 'damage' },
    ],
  },
  npc_former_colleague: {
    preferredStance: 'hold',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_minjun: {
    preferredStance: 'support',
    priorities: [
      { role: 'support', when: 'ally_stress_6_plus' },
      { role: 'heal', when: 'ally_below_60' },
      { role: 'damage' },
    ],
  },
  npc_sohee: {
    preferredStance: 'support',
    priorities: [
      { role: 'support' },
      { role: 'guard', when: 'ally_below_60' },
      { role: 'damage' },
    ],
  },
  npc_jisu: {
    preferredStance: 'heal',
    priorities: [
      { role: 'heal', when: 'ally_below_60' },
      { role: 'control' },
      { role: 'damage' },
    ],
  },
  npc_yeongcheol: {
    preferredStance: 'support',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'support', when: 'ally_stress_6_plus' },
      { role: 'damage' },
    ],
  },
  npc_daehan: {
    preferredStance: 'hold',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_tower_security: {
    preferredStance: 'hold',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_tower_merchant: {
    preferredStance: 'support',
    priorities: [
      { role: 'control' },
      { role: 'damage' },
    ],
  },
  npc_tower_cook: {
    preferredStance: 'support',
    priorities: [
      { role: 'support', when: 'ally_stress_6_plus' },
      { role: 'damage' },
    ],
  },
  npc_tower_engineer: {
    preferredStance: 'hold',
    priorities: [
      { role: 'guard', when: 'ally_below_60' },
      { role: 'control' },
      { role: 'damage' },
    ],
  },
  npc_tower_doctor: {
    preferredStance: 'heal',
    priorities: [
      { role: 'heal', when: 'ally_below_60' },
      { role: 'support' },
      { role: 'damage' },
    ],
  },
  npc_sous_chef: {
    preferredStance: 'support',
    priorities: [
      { role: 'control' },
      { role: 'damage' },
    ],
  },
  npc_kitchen_helper: {
    preferredStance: 'support',
    priorities: [
      { role: 'support' },
      { role: 'damage' },
    ],
  },
};
