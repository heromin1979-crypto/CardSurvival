// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameState from '../../js/core/GameState.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import CombatUI from '../../js/ui/CombatUI.js';
import { ENEMIES, instantiateEnemy } from '../../js/data/enemies.js';

function setupCombat(enemy, { withNurse = false } = {}) {
  document.body.innerHTML = '<div id="screen-combat"></div>';
  CombatUI._screen = document.getElementById('screen-combat');

  GameState.player.hp = { current: 100, max: 100 };
  GameState.player.characterId = 'doctor';
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.flags = GameState.flags ?? {};
  GameState.ui = { ...GameState.ui, currentState: 'combat' };
  GameState.companions = withNurse ? ['npc_nurse'] : [];
  GameState.npcs = {
    states: withNurse
      ? { npc_nurse: { hp: 80, maxHp: 80, isCompanion: true } }
      : {},
  };

  CombatSystem._setupCombat({
    enemies: [enemy],
    dangerLevel: 1,
    nodeId: 'normal-enemy-intent-test',
  });
  return GameState.combat;
}

describe('일반 몬스터 committed action intent 통합', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('의도 결정 뒤 난수가 바뀌어도 runner_rush를 기본 공격으로 재추첨하지 않는다', () => {
    const enemy = instantiateEnemy(ENEMIES.zombie_runner);
    enemy.attack = { damage: [4, 4], accuracy: 1 };
    enemy.specialSkills = [{
      id: 'runner_rush',
      name: '돌진',
      damage: [10, 10],
      cooldown: 3,
      telegraph: { turns: 1 },
      effect: { multiHit: 2 },
    }];

    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    const combat = setupCombat(enemy);
    const shownIntent = combat.enemies[0]._nextIntent;

    expect(shownIntent).toMatchObject({
      actionId: 'runner_rush',
      targetIds: ['player'],
      hitCount: 2,
    });

    random.mockReturnValue(0.99);
    CombatSystem._runSingleEnemyTurn(0);
    expect(GameState.player.hp.current).toBe(100);
    expect(combat.enemies[0]._nextIntent.actionId).toBe('runner_rush');

    CombatSystem._runSingleEnemyTurn(0);

    expect(GameState.player.hp.current).toBe(80);
  });

  it('zombie_horde는 두 대상과 hitCount 2를 view model과 UI에 표시한다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const combat = setupCombat(instantiateEnemy(ENEMIES.zombie_horde), {
      withNurse: true,
    });
    const intent = combat.enemies[0]._nextIntent;

    expect(new Set(intent.targetIds)).toEqual(new Set(['player', 'npc_nurse']));
    expect(intent.hitCount).toBe(2);
    expect(intent.targetNames).toEqual(expect.arrayContaining(['플레이어', '간호사']));

    CombatUI.render();
    const badge = document.querySelector('.combatant-piece.enemy .combat-intent');

    expect(badge).not.toBeNull();
    expect(badge.textContent).toContain('플레이어');
    expect(badge.textContent).toContain('간호사');
    expect(badge.textContent).toContain('×2');
  });
});
