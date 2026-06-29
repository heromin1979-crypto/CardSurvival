// @vitest-environment happy-dom
// === 전투 연출 fxQueue 통합 ===
// 목적:
//   - CombatSystem이 쌓은 combat.fxQueue를 CombatUI._playFxQueue가 순차 재생
//   - playerAttack/enemyAttack → 런지 + hit flash + 데미지 플로팅
//   - companion 계열 fx → 아군 스프라이트 glow/attacking + 플로팅
//   - enemyAttackCompanion → 아군 hit + 데미지 플로팅
//   - miss → MISS 플로팅
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CombatUI  from '../../js/ui/CombatUI.js';
import GameState from '../../js/core/GameState.js';

function setupDom() {
  document.body.innerHTML = `
    <div id="screen-combat">
      <div class="combat-visual"></div>
      <div class="cv-player" data-combatant-id="player" data-sprite-id="player_rifle" data-motion-state="idle"></div>
      <div class="cv-enemy-sprite" data-idx="0" data-combatant-id="enemy:0" data-sprite-id="zombie_bare" data-motion-state="idle"></div>
      <div class="cv-enemy-sprite" data-idx="1" data-combatant-id="enemy:1" data-sprite-id="zombie_rage" data-motion-state="idle"></div>
      <div class="cv-ally" data-companion-id="npc_nurse" data-combatant-id="ally:npc_nurse" style="position:relative;"></div>
      <div class="cv-ally" data-companion-id="npc_soldier" data-combatant-id="ally:npc_soldier" style="position:relative;"></div>
    </div>
  `;
  CombatUI._screen = document.getElementById('screen-combat');
}

describe('_playFx — 개별 연출 분기', () => {
  beforeEach(setupDom);

  it('playerAttack 명중 → 적 hit flash + -N 플로팅 + 플레이어 attacking 런지', () => {
    CombatUI._playFx({ kind: 'playerAttack', fx: 'slash', targetIdx: 0, dmg: 12 });
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    expect(enemy.classList.contains('hit')).toBe(true);
    expect(enemy.querySelector('.dmg-popup').textContent).toBe('-12');
    expect(document.querySelector('.cv-player').classList.contains('attacking')).toBe(true);
    expect(document.querySelector('.cv-player').classList.contains('motion-knife-slash')).toBe(true);
    expect(enemy.classList.contains('motion-zombie-hit')).toBe(true);
    expect(document.querySelector('.cv-player').dataset.motionState).toBe('attack');
    expect(enemy.dataset.motionState).toBe('hit');
    expect(enemy.querySelector('.cv-fx-slash')).not.toBeNull();
    expect(document.querySelector('.combat-visual').classList.contains('camera-ally-strike')).toBe(true);
    expect(document.querySelector('.combat-visual').classList.contains('camera-work-active')).toBe(true);
  });

  it('playerAttack 빗나감 → MISS 플로팅, hit flash 없음', () => {
    CombatUI._playFx({ kind: 'playerAttack', fx: 'slash', targetIdx: 1, miss: true });
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="1"]');
    expect(enemy.classList.contains('hit')).toBe(false);
    expect(enemy.querySelector('.dmg-popup.miss').textContent).toBe('MISS');
    expect(document.querySelector('.cv-player').classList.contains('motion-whiff')).toBe(true);
    expect(document.querySelector('.combat-visual').classList.contains('camera-ally-whiff')).toBe(true);
  });

  it('playerAttack 치명타 → combat-visual shake', () => {
    CombatUI._playFx({ kind: 'playerAttack', fx: 'blunt', targetIdx: 0, dmg: 30, crit: true });
    expect(document.querySelector('.combat-visual').classList.contains('shake')).toBe(true);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"] .dmg-popup.crit')).not.toBeNull();
  });

  it('enemyAttack → 적 lunging + 플레이어 hit + -N 플로팅', () => {
    CombatUI._playFx({ kind: 'enemyAttack', enemyIdx: 0, fx: 'claw', dmg: 9 });
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    expect(enemy.classList.contains('lunging')).toBe(true);
    expect(enemy.classList.contains('motion-zombie-lunge')).toBe(true);
    const player = document.querySelector('.cv-player');
    expect(player.classList.contains('hit')).toBe(true);
    expect(player.classList.contains('motion-player-hit')).toBe(true);
    expect(player.querySelector('.dmg-popup').textContent).toBe('-9');
    expect(player.querySelector('.cv-fx-claw')).not.toBeNull();
    expect(document.querySelector('.combat-visual').classList.contains('camera-enemy-strike')).toBe(true);
    expect(document.querySelector('.combat-visual').classList.contains('camera-work-active')).toBe(true);
  });

  it('enemyAttack rupture FX -> player impact overlay', () => {
    CombatUI._playFx({ kind: 'enemyAttack', enemyIdx: 0, fx: 'rupture', dmg: 11 });
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    const player = document.querySelector('.cv-player');
    expect(enemy.classList.contains('motion-zombie-heavy')).toBe(true);
    expect(player.classList.contains('hit')).toBe(true);
    expect(player.querySelector('.cv-fx-rupture')).not.toBeNull();
    expect(player.querySelector('.dmg-popup').textContent).toBe('-11');
  });

  it('companionAttack → 아군 attacking + 타겟 적 위 -N 플로팅', () => {
    CombatUI._playFx({ kind: 'companionAttack', npcId: 'npc_nurse', targetIdx: 1, dmg: 8, fx: 'slash' });
    const ally = document.querySelector('.cv-ally[data-companion-id="npc_nurse"]');
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="1"]');
    expect(ally.classList.contains('attacking')).toBe(true);
    expect(ally.classList.contains('motion-knife-slash')).toBe(true);
    expect(enemy.classList.contains('motion-zombie-hit')).toBe(true);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="1"] .dmg-popup').textContent).toBe('-8');
  });

  it('companionHeal → 아군 glowing + 플레이어 위 +N 녹색 플로팅', () => {
    CombatUI._playFx({ kind: 'companionHeal', npcId: 'npc_nurse', amount: 15 });
    expect(document.querySelector('.cv-ally[data-companion-id="npc_nurse"]').classList.contains('glowing')).toBe(true);
    const popup = document.querySelector('.cv-player .dmg-popup.heal');
    expect(popup).not.toBeNull();
    expect(popup.textContent).toBe('+15');
    expect(document.querySelector('.cv-player').classList.contains('motion-heal-pulse')).toBe(true);
  });

  it('companionSkill → combat-visual skill-flash + 아군 glowing', () => {
    CombatUI._playFx({ kind: 'companionSkill', npcId: 'npc_nurse', skillId: 'nurse_triage' });
    expect(document.querySelector('.combat-visual').classList.contains('skill-flash')).toBe(true);
    expect(document.querySelector('.cv-ally[data-companion-id="npc_nurse"]').classList.contains('glowing')).toBe(true);
  });

  it('enemyAttackCompanion → 아군 hit + -N 플로팅 + 적 lunging', () => {
    CombatUI._playFx({ kind: 'enemyAttackCompanion', enemyIdx: 0, npcId: 'npc_soldier', dmg: 7 });
    const ally = document.querySelector('.cv-ally[data-companion-id="npc_soldier"]');
    expect(ally.classList.contains('hit')).toBe(true);
    expect(ally.querySelector('.cv-fx-claw')).not.toBeNull();
    expect(ally.querySelector('.dmg-popup').textContent).toBe('-7');
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    expect(enemy.classList.contains('lunging')).toBe(true);
    expect(enemy.classList.contains('motion-zombie-lunge')).toBe(true);
    expect(document.querySelector('.combat-visual').classList.contains('camera-enemy-strike')).toBe(true);
  });

  it('advance → 적 advancing 슬라이드', () => {
    CombatUI._playFx({ kind: 'advance', enemyIdx: 1 });
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="1"]');
    expect(enemy.classList.contains('advancing')).toBe(true);
    expect(enemy.classList.contains('motion-zombie-advance')).toBe(true);
  });

  it('summon → 좀비 scream 모션 + 카메라 충격', () => {
    CombatUI._playFx({ kind: 'summon', enemyIdx: 0 });
    const summonEnemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    expect(summonEnemy.classList.contains('motion-zombie-scream')).toBe(true);
    expect(summonEnemy.querySelector('.cv-fx-scream')).not.toBeNull();
    expect(document.querySelector('.combat-visual').classList.contains('camera-impact-heavy')).toBe(true);
  });

  it('extended combat motion events are applied', () => {
    const player = document.querySelector('.cv-player');
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');

    CombatUI._playFx({ kind: 'guard' });
    expect(player.classList.contains('motion-guard-brace')).toBe(true);

    CombatUI._playFx({ kind: 'useItem', fx: 'heal', label: '+12' });
    expect(player.classList.contains('motion-heal-pulse')).toBe(true);

    CombatUI._playFx({ kind: 'flee', success: true });
    expect(player.classList.contains('motion-move-back')).toBe(true);

    CombatUI._playFx({ kind: 'move', target: 'player', direction: 'forward' });
    expect(player.classList.contains('motion-move-forward')).toBe(true);

    CombatUI._playFx({ kind: 'rankSwap', target: 'player' });
    expect(player.classList.contains('motion-rank-swap')).toBe(true);

    CombatUI._playFx({ kind: 'dodge', target: 'player' });
    expect(player.classList.contains('motion-dodge')).toBe(true);

    CombatUI._playFx({ kind: 'status', target: 'enemy', enemyIdx: 0, statusId: 'bleed' });
    expect(enemy.classList.contains('motion-status-bleed')).toBe(true);

    CombatUI._playFx({ kind: 'downed', target: 'player' });
    expect(player.classList.contains('motion-downed')).toBe(true);

    CombatUI._playFx({ kind: 'victory' });
    expect(player.classList.contains('motion-victory')).toBe(true);

    CombatUI._playFx({ kind: 'defeat' });
    expect(player.classList.contains('motion-defeat')).toBe(true);
  });

  it('explode image FX + shake', () => {
    CombatUI._playFx({ kind: 'explode', enemyIdx: 0, dmg: 28 });
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"] .cv-fx-explode')).not.toBeNull();
    expect(document.querySelector('.combat-visual').classList.contains('shake')).toBe(true);
    expect(document.querySelector('.combat-visual').classList.contains('camera-impact-heavy')).toBe(true);
  });

  it('camera work exposes a shared active state and clears it after the animation', () => {
    vi.useFakeTimers();

    CombatUI._cameraWork('ally-strike', 200);
    const visual = document.querySelector('.combat-visual');

    expect(visual.classList.contains('camera-work-active')).toBe(true);
    expect(visual.classList.contains('camera-ally-strike')).toBe(true);

    vi.advanceTimersByTime(220);

    expect(visual.classList.contains('camera-work-active')).toBe(false);
    expect(visual.classList.contains('camera-ally-strike')).toBe(false);
    vi.useRealTimers();
  });

  it('companionSkill maps role skills to their matching sprite motion rows', () => {
    CombatUI._playFx({ kind: 'companionSkill', npcId: 'npc_soldier', skillId: 'soldier_suppress' });
    expect(document.querySelector('.cv-ally[data-companion-id="npc_soldier"]').classList.contains('motion-firearm-shot')).toBe(true);

    CombatUI._playFx({ kind: 'companionSkill', npcId: 'npc_nurse', skillId: 'nurse_triage' });
    expect(document.querySelector('.cv-ally[data-companion-id="npc_nurse"]').classList.contains('motion-heal-pulse')).toBe(true);
  });

  it('status → combatant id 대상에 상태이상 오버레이 + glow', () => {
    CombatUI._playFx({ kind: 'status', targetId: 'enemy:0', statusId: 'bleed' });
    const enemy = document.querySelector('.cv-enemy-sprite[data-idx="0"]');
    expect(enemy.classList.contains('glowing')).toBe(true);
    expect(enemy.querySelector('.cv-fx-status-bleed')).not.toBeNull();
  });

  it('존재하지 않는 npcId/idx → 안전하게 no-op (에러 없음)', () => {
    expect(() => CombatUI._playFx({ kind: 'companionAttack', npcId: 'npc_nonexistent', targetIdx: 99 })).not.toThrow();
    expect(() => CombatUI._playFx({ kind: 'enemyAttack', enemyIdx: 99, dmg: 5 })).not.toThrow();
  });
});

describe('_playFxQueue — 큐 순차 재생', () => {
  beforeEach(setupDom);

  it('큐를 비우고 300ms 간격으로 순차 재생한다', () => {
    vi.useFakeTimers();
    GameState.combat = {
      fxQueue: [
        { kind: 'playerAttack', fx: 'slash', targetIdx: 0, dmg: 10 },
        { kind: 'enemyAttack', enemyIdx: 0, fx: 'claw', dmg: 5 },
      ],
    };
    CombatUI._playFxQueue();
    expect(GameState.combat.fxQueue).toEqual([]);

    // 첫 fx (80ms)
    vi.advanceTimersByTime(100);
    expect(document.querySelector('.cv-enemy-sprite[data-idx="0"] .dmg-popup')).not.toBeNull();
    expect(document.querySelector('.cv-player .dmg-popup')).toBeNull();

    // 두 번째 fx (380ms)
    vi.advanceTimersByTime(300);
    expect(document.querySelector('.cv-player .dmg-popup')).not.toBeNull();
    vi.useRealTimers();
  });

  it('빈 큐 → no-op', () => {
    GameState.combat = { fxQueue: [] };
    expect(() => CombatUI._playFxQueue()).not.toThrow();
  });
});

describe('_spawnFloatText — 플로팅 텍스트 생성 + 제거', () => {
  beforeEach(setupDom);

  it('heal variant → .dmg-popup.heal 클래스', () => {
    const anchor = document.querySelector('.cv-player');
    CombatUI._spawnFloatText(anchor, '+10', 'heal');
    const popup = anchor.querySelector('.dmg-popup.heal');
    expect(popup).not.toBeNull();
    expect(popup.textContent).toBe('+10');
  });

  it('dmg variant → .dmg-popup (heal 클래스 없음)', () => {
    const anchor = document.querySelector('.cv-player');
    CombatUI._spawnFloatText(anchor, '-5', 'dmg');
    const popup = anchor.querySelector('.dmg-popup');
    expect(popup).not.toBeNull();
    expect(popup.classList.contains('heal')).toBe(false);
  });

  it('900ms 후 자동 제거', () => {
    vi.useFakeTimers();
    const anchor = document.querySelector('.cv-player');
    CombatUI._spawnFloatText(anchor, '-5', 'dmg');
    expect(anchor.querySelector('.dmg-popup')).not.toBeNull();
    vi.advanceTimersByTime(950);
    expect(anchor.querySelector('.dmg-popup')).toBeNull();
    vi.useRealTimers();
  });

  it('anchor=null 이면 no-op', () => {
    expect(() => CombatUI._spawnFloatText(null, 'x', 'dmg')).not.toThrow();
  });
});
