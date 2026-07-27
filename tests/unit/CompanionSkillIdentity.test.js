// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../../js/data/combatSkills.js';
import { COMPANION_TACTICS } from '../../js/data/companionTactics.js';
import CombatUI from '../../js/ui/CombatUI.js';

const EXPECTED_KITS = {
  npc_old_survivor: [
    ['old_survivor_cane_strike', 'damage', 'melee'],
    ['old_survivor_warning', 'support', 'support'],
    ['old_survivor_hold_line', 'guard', 'guard'],
  ],
  npc_nurse: [
    ['nurse_scalpel', 'damage', 'melee'],
    ['nurse_triage', 'heal', 'support'],
    ['nurse_encourage', 'support', 'support'],
  ],
  npc_soldier_deserter: [
    ['deserter_rifle_shot', 'damage', 'ranged'],
    ['deserter_covering_fire', 'control', 'ranged'],
    ['deserter_reposition', 'support', 'move'],
  ],
  npc_child: [
    ['child_throw_debris', 'damage', 'ranged'],
    ['child_hide', 'guard', 'guard'],
    ['child_warning', 'support', 'support'],
  ],
  npc_mechanic: [
    ['mechanic_wrench', 'damage', 'melee'],
    ['mechanic_field_repair', 'guard', 'support'],
    ['mechanic_tripwire', 'control', 'support'],
  ],
  npc_student: [
    ['student_improvised_strike', 'damage', 'melee'],
    ['student_first_aid', 'heal', 'support'],
    ['student_quick_step', 'support', 'move'],
  ],
  npc_dog: [
    ['dog_bite', 'damage', 'melee'],
    ['dog_guard', 'guard', 'guard'],
    ['dog_track_weakness', 'control', 'support'],
  ],
  npc_former_colleague: [
    ['colleague_hammer', 'damage', 'melee'],
    ['colleague_brace', 'guard', 'guard'],
    ['colleague_teamwork', 'support', 'support'],
  ],
  npc_minjun: [
    ['minjun_pistol', 'damage', 'ranged'],
    ['minjun_combat_medicine', 'heal', 'support'],
    ['minjun_command', 'support', 'support'],
  ],
  npc_sohee: [
    ['sohee_precise_shot', 'damage', 'ranged'],
    ['sohee_silent_cover', 'guard', 'guard'],
    ['sohee_focus', 'support', 'support'],
  ],
  npc_jisu: [
    ['jisu_scalpel', 'damage', 'melee'],
    ['jisu_emergency_care', 'heal', 'support'],
    ['jisu_diagnose', 'control', 'support'],
  ],
  npc_yeongcheol: [
    ['yeongcheol_axe', 'damage', 'melee'],
    ['yeongcheol_rescue', 'guard', 'guard'],
    ['yeongcheol_rally', 'support', 'support'],
  ],
  npc_daehan: [
    ['daehan_wrench', 'damage', 'melee'],
    ['daehan_barricade', 'guard', 'guard'],
    ['daehan_overcharge', 'support', 'support'],
  ],
  npc_tower_security: [
    ['security_baton', 'damage', 'melee'],
    ['security_guard', 'guard', 'guard'],
    ['security_taunt', 'support', 'support'],
  ],
  npc_tower_merchant: [
    ['merchant_hidden_blade', 'damage', 'melee'],
    ['merchant_supply', 'support', 'support'],
    ['merchant_bargain', 'control', 'support'],
  ],
  npc_tower_cook: [
    ['tower_cook_knife', 'damage', 'melee'],
    ['tower_cook_meal', 'food', 'support'],
    ['tower_cook_burn', 'damage', 'melee'],
  ],
  npc_tower_engineer: [
    ['tower_engineer_wrench', 'damage', 'melee'],
    ['tower_engineer_cover', 'guard', 'guard'],
    ['tower_engineer_trap', 'control', 'support'],
  ],
  npc_tower_doctor: [
    ['tower_doctor_scalpel', 'damage', 'melee'],
    ['tower_doctor_triage', 'heal', 'support'],
    ['tower_doctor_stimulant', 'support', 'support'],
  ],
  npc_sous_chef: [
    ['sous_chef_cleaver', 'damage', 'melee'],
    ['sous_chef_ration', 'ration', 'support'],
    ['sous_chef_intimidate', 'control', 'support'],
  ],
  npc_kitchen_helper: [
    ['kitchen_helper_pan', 'damage', 'melee'],
    ['kitchen_helper_assist', 'support', 'support'],
    ['kitchen_helper_duck', 'support', 'move'],
  ],
};

const SELF_ONLY_SKILL_IDS = [
  'child_hide',
  'deserter_reposition',
  'student_quick_step',
  'sohee_focus',
  'security_taunt',
  'kitchen_helper_duck',
];

const effectsOf = (skillId, type) => (
  COMBAT_SKILLS[skillId].effects.filter(effect => effect.type === type)
);

const hasToken = (skillId, token) => (
  effectsOf(skillId, 'token').some(effect => effect.token === token)
);

describe('동료 20종 기술 정체성', () => {
  it('20종 로드아웃이 60개 고유 기술과 전술 프로필을 정확히 연결한다', () => {
    expect(Object.keys(COMPANION_COMBAT_LOADOUTS)).toEqual(Object.keys(EXPECTED_KITS));
    expect(Object.keys(COMPANION_TACTICS)).toEqual(Object.keys(EXPECTED_KITS));

    const actualSkillIds = Object.values(COMPANION_COMBAT_LOADOUTS).flat();
    expect(actualSkillIds).toHaveLength(60);
    expect(new Set(actualSkillIds).size).toBe(60);

    for (const [companionId, identities] of Object.entries(EXPECTED_KITS)) {
      expect(COMPANION_COMBAT_LOADOUTS[companionId]).toEqual(
        identities.map(([skillId]) => skillId),
      );
    }
  });

  it('60개 기술이 평가표의 tacticalRole과 motionKey를 명시한다', () => {
    for (const identities of Object.values(EXPECTED_KITS)) {
      for (const [skillId, tacticalRole, motionKey] of identities) {
        expect(COMBAT_SKILLS[skillId]?.tacticalRole, skillId).toBe(tacticalRole);
        expect(COMBAT_SKILLS[skillId]?.motionKey, skillId).toBe(motionKey);
      }
    }
  });

  it('아이의 투척과 탈영병 엄호 사격을 소총과 다른 저피해 제어기로 만든다', () => {
    const debrisDamage = effectsOf('child_throw_debris', 'damage')[0].value;
    const rifleDamage = effectsOf('deserter_rifle_shot', 'damage')[0].value;

    expect(debrisDamage).toEqual([3, 6]);
    expect(debrisDamage[1]).toBeLessThan(rifleDamage[1]);
    expect(hasToken('child_throw_debris', 'hesitation')).toBe(true);
    expect(effectsOf('deserter_covering_fire', 'damage')[0].value).toEqual([5, 9]);
    expect(hasToken('deserter_covering_fire', 'hesitation')).toBe(true);
  });

  it('치료 능력이 없는 여섯 기술에서 획일적 HP 회복을 제거한다', () => {
    const nonHealingSkills = [
      'mechanic_field_repair',
      'yeongcheol_rescue',
      'merchant_supply',
      'tower_cook_meal',
      'sous_chef_ration',
      'kitchen_helper_assist',
    ];

    for (const skillId of nonHealingSkills) {
      expect(effectsOf(skillId, 'heal'), skillId).toEqual([]);
      expect(COMBAT_SKILLS[skillId].tacticalRole, skillId).not.toBe('heal');
    }

    expect(effectsOf('mechanic_field_repair', 'guard')).toHaveLength(1);
    expect(effectsOf('yeongcheol_rescue', 'move')).toEqual([
      { type: 'move', distance: 1 },
    ]);
    expect(effectsOf('yeongcheol_rescue', 'guard')).toHaveLength(1);
    expect(hasToken('merchant_supply', 'improvised')).toBe(true);
    expect(hasToken('kitchen_helper_assist', 'accuracy')).toBe(true);
  });

  it('식사와 배급은 HP 회복 대신 실제 전투 버프를 제공한다', () => {
    expect(effectsOf('tower_cook_meal', 'stress')).toEqual([
      { type: 'stress', value: -10 },
    ]);
    expect(hasToken('tower_cook_meal', 'strength')).toBe(true);
    expect(hasToken('sous_chef_ration', 'strength')).toBe(true);
    expect(hasToken('sous_chef_ration', 'accuracy')).toBe(true);

    for (const skill of Object.values(COMBAT_SKILLS)) {
      if (!['food', 'ration'].includes(skill.tacticalRole)) continue;
      expect(effectsOf(skill.id, 'heal'), skill.id).toEqual([]);
    }
  });

  it('부주방장의 위압은 적 stress 대신 hesitation을 건다', () => {
    expect(effectsOf('sous_chef_intimidate', 'stress')).toEqual([]);
    expect(hasToken('sous_chef_intimidate', 'hesitation')).toBe(true);
  });

  it('자기 전용 여섯 기술만 target.selfOnly 계약을 가진다', () => {
    const actualSelfOnlyIds = Object.values(COMPANION_COMBAT_LOADOUTS)
      .flat()
      .filter(skillId => COMBAT_SKILLS[skillId].target.selfOnly === true);

    expect(actualSelfOnlyIds.toSorted()).toEqual(SELF_ONLY_SKILL_IDS.toSorted());
    for (const skillId of SELF_ONLY_SKILL_IDS) {
      expect(COMBAT_SKILLS[skillId].target.side, skillId).toBe('ally');
    }
  });
});

describe('자기 전용 기술 UI 대상 필터', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="screen-combat"></div>';
    CombatUI._screen = document.getElementById('screen-combat');
    GameState.player = {
      ...(GameState.player ?? {}),
      hp: { current: 80, max: 100 },
      equipped: {},
    };
    GameState.stats = {
      stamina: { current: 10, max: 10 },
      infection: { current: 0, max: 100 },
    };
    GameState.cards = {};
    GameState.npcs = {
      states: {
        npc_child: {
          hp: 30,
          maxHp: 30,
          isCompanion: true,
          stance: 'manual',
          skillCooldowns: {},
        },
      },
    };
    GameState.combat = {
      active: true,
      phase: 'select_target',
      roundNumber: 1,
      activeCombatantId: 'npc_child',
      activeTurnIndex: 0,
      activeIdx: 0,
      selectedSkillId: 'child_hide',
      selectedTargetId: null,
      formations: {
        ally: [null, null, 'player', 'npc_child'],
        enemy: ['enemy:0', null, null, null],
      },
      combatants: {
        player: {
          id: 'player',
          side: 'ally',
          sourceType: 'player',
          hp: 80,
          maxHp: 100,
          tokens: {},
          statusEffects: [],
          skillIds: [],
        },
        npc_child: {
          id: 'npc_child',
          sourceId: 'npc_child',
          side: 'ally',
          sourceType: 'companion',
          hp: 30,
          maxHp: 30,
          stress: 0,
          tokens: {},
          statusEffects: [],
          skillIds: ['child_hide'],
        },
        'enemy:0': {
          id: 'enemy:0',
          side: 'enemy',
          sourceType: 'enemy',
          enemyIndex: 0,
          hp: 30,
          maxHp: 30,
          tokens: {},
          statusEffects: [],
        },
      },
      skillsById: {
        child_hide: {
          id: 'child_hide',
          fallbackName: '숨기',
          icon: 'guard',
          usableFrom: [1, 2, 3, 4],
          target: {
            side: 'ally',
            ranks: [1, 2, 3, 4],
            count: 1,
            selfOnly: true,
          },
          costs: {},
          accuracy: 1,
          effects: [{ type: 'guard', value: 0.5 }],
        },
      },
      turnQueue: [
        {
          combatantId: 'npc_child',
          id: 'npc_child',
          type: 'companion',
          initiative: 8,
        },
      ],
      enemies: [{
        id: 'zombie_common',
        name: '감염자',
        currentHp: 30,
        maxHp: 30,
      }],
      log: [],
      fxQueue: [],
      playerStatus: [],
      enemyStatus: [],
    };
  });

  it('선택 시 행동자만 targetable로 표시한다', () => {
    CombatUI.render();

    expect(document.querySelector('[data-combatant-id="npc_child"]').classList)
      .toContain('targetable');
    expect(document.querySelector('[data-combatant-id="player"]').classList)
      .toContain('not-targetable');
  });

  it('not-targetable 아군 클릭은 대상 선택 단계를 끝내지 않는다', () => {
    CombatUI.render();

    document.querySelector('.combatant-piece[data-combatant-id="player"]').click();

    expect(GameState.combat.phase).toBe('select_target');
    expect(GameState.combat.selectedTargetId).toBeNull();
  });
});
