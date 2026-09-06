// @vitest-environment happy-dom
// === 우측 동료 패널 (#bc-companion) ===
// 3컬럼 골격은 CSS 선언으로, 패널 내용은 DOM으로 나눠 확인한다.
// happy-dom은 레이아웃을 계산하지 않아 "보드가 좁아졌는지"를 좌표로 잴 수 없으므로,
// 슬롯 폭 토큰이 줄어든 보드 폭(1540)에 맞는지는 산술로 검사한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path             from 'node:path';
import GameState        from '../../js/core/GameState.js';
import CompanionPanel   from '../../js/ui/CompanionPanel.js';

const LAYOUT_CSS = readFileSync(path.resolve('css/layout.css'), 'utf8');
const VARS_CSS   = readFileSync(path.resolve('css/variables.css'), 'utf8');

const SCREEN_W    = 1920;   // 고정 해상도 (Scale 방식)
const SIDEBAR_W   = 200;
const COMPANION_W = 180;

function cssVar(name) {
  return Number(VARS_CSS.match(new RegExp(`${name}:\\s*(\\d+)px`))[1]);
}

function mountPanel() {
  document.body.innerHTML = '<aside id="bc-companion"></aside>';
  CompanionPanel.render();
  return document.getElementById('bc-companion');
}

beforeEach(() => {
  GameState.ui        = { currentState: 'main' };
  GameState.companions = [];
  GameState.npcs       = { states: {} };
});

describe('동료 패널 — 3컬럼 골격', () => {
  it('메인 화면 그리드에 동료 컬럼이 있다', () => {
    const block = LAYOUT_CSS.match(/#screen-main\.active\s*\{([^}]*)\}/)[1];

    expect(block).toMatch(new RegExp(`grid-template-columns:\\s*${SIDEBAR_W}px\\s+1fr\\s+${COMPANION_W}px`));
    expect(block).toMatch(/grid-template-areas:[\s\S]*companion/);
  });

  it('그레인·비네팅 레이어가 동료 컬럼을 덮지 않는다', () => {
    const insets = [...LAYOUT_CSS.matchAll(/inset:\s*([^;]+);/g)].map(m => m[1]);
    const mainLayers = insets.filter(v => v.includes(`${SIDEBAR_W}px`));

    expect(mainLayers.length).toBeGreaterThan(0);
    for (const inset of mainLayers) {
      expect(inset).toContain(`${COMPANION_W}px`);
    }
  });

  it('슬롯·카드 폭이 좁아진 보드 폭 안에 10칸으로 들어간다', () => {
    const boardW = SCREEN_W - SIDEBAR_W - COMPANION_W;
    // board-row padding 12×2 + slots padding 4×2 + border 1×2 + gap 8×9
    const usable = boardW - 24 - 8 - 2 - 72;

    expect(cssVar('--slot-w')).toBeLessThanOrEqual(Math.floor(usable / 10));
    expect(cssVar('--card-w')).toBeLessThanOrEqual(cssVar('--slot-w'));
  });
});

describe('동료 패널 — 내용', () => {
  it('동료가 없으면 빈 패널을 안내와 함께 보여준다', () => {
    const el = mountPanel();

    expect(el.querySelector('.bc-comp-header')).not.toBeNull();
    expect(el.querySelector('.bc-comp-empty')).not.toBeNull();
    expect(el.querySelector('.bc-comp-card')).toBeNull();
  });

  it('동행 중인 동료의 HP·상태·장비·액티브 스킬을 보여준다', () => {
    GameState.companions = ['npc_nurse'];
    GameState.npcs.states = {
      npc_nurse: { spawned: true, hp: 50, trust: 3, woundLevel: 0, infectionLevel: 0 },
    };

    const el = mountPanel();
    const card = el.querySelector('.bc-comp-card');

    expect(card).not.toBeNull();
    expect(card.dataset.npcId).toBe('npc_nurse');
    // 간호사 maxHp 100 → 50/100
    expect(card.querySelector('.bc-comp-hp').textContent).toContain('50%');
    expect(card.querySelector('.bc-comp-status-value').textContent).toBe('양호');
    expect(card.querySelectorAll('.bc-comp-slot')).toHaveLength(3);
    expect(card.querySelector('.bc-comp-skill:not(.empty)')).not.toBeNull();
  });

  it('상태를 잃은 동료 id는 건너뛴다', () => {
    GameState.companions = ['npc_nurse'];
    GameState.npcs.states = {};

    const el = mountPanel();

    expect(el.querySelector('.bc-comp-card')).toBeNull();
    expect(el.querySelector('.bc-comp-empty')).not.toBeNull();
  });
});
