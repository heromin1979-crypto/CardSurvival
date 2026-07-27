import { describe, expect, it } from 'vitest';
import {
  COMBAT_SKILLS,
  COMPANION_COMBAT_LOADOUTS,
} from '../../js/data/combatSkills.js';
import { COMPANION_TACTICS } from '../../js/data/companionTactics.js';
import { planCompanionTurn } from '../../js/systems/combat/CompanionTactics.js';

describe('동료 전술 개발·데이터 QA 경계', () => {
  it('순수 planner는 실제 전술 데이터와 스킬 데이터 조합을 검증할 수 있다', () => {
    const npcId = 'npc_nurse';
    const plan = planCompanionTurn({
      npcId,
      stance: COMPANION_TACTICS[npcId].preferredStance,
      skills: COMPANION_COMBAT_LOADOUTS[npcId].map(id => COMBAT_SKILLS[id]),
      allies: [
        { id: npcId, side: 'ally', hp: 50, maxHp: 50 },
        { id: 'player', side: 'ally', hp: 10, maxHp: 100 },
      ],
      enemies: [{ id: 'enemy:0', side: 'enemy', hp: 30, maxHp: 30 }],
      canUse: () => true,
    });

    expect(plan).toEqual({
      skillId: 'nurse_triage',
      targetId: 'player',
      reason: 'lowest_hp_ally',
    });
  });
});
