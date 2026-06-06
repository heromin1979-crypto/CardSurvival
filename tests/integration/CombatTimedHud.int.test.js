// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import CombatUI  from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

describe('이니셔티브 바 — 타이밍 압박 카운트다운', () => {
  it('countdown 있는 적: init-countdown span + 숫자, charging 클래스(임박)', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy', enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0, roundNumber: 1,
      enemies: [{
        id: 'zombie_bloater', name: '블로터', icon: '🤰',
        currentHp: 50, maxHp: 50,
        _nextIntent: { iconEmoji: '💥', label: '1턴 후 자폭', countdown: 1 },
      }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toContain('init-countdown');
    expect(html).toContain('charging');
    expect(html).toContain('>1<');
  });

  it('countdown 없으면 init-countdown 미렌더', () => {
    const combat = {
      turnQueue: [{ type: 'player', order: 0 }, { type: 'enemy', enemyIdx: 0, order: 1 }],
      activeIdx: 0, roundNumber: 1,
      enemies: [{ id: 'e', name: '좀비', icon: '🧟', currentHp: 30, maxHp: 30,
        _nextIntent: { iconEmoji: '🗡', label: '플레이어 공격' } }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).not.toContain('init-countdown');
  });
});
