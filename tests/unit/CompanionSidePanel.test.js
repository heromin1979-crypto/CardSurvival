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
const PANEL_CSS  = readFileSync(path.resolve('css/companion-panel.css'), 'utf8');

const SCREEN_W    = 1920;   // 고정 해상도 (Scale 방식)
const SIDEBAR_W   = 240;
const COMPANION_W = 220;

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

  it('슬롯·카드 폭이 좁아진 보드 폭 안에 8칸으로 들어간다', () => {
    const boardW = SCREEN_W - SIDEBAR_W - COMPANION_W;
    // board-row padding 12×2 + slots padding 4×2 + border 1×2 + gap 8×9
    const usable = boardW - 24 - 8 - 2 - 56;   // 8칸 → 간격 7개 × 8px

    expect(cssVar('--slot-w')).toBeLessThanOrEqual(Math.floor(usable / 8));
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

describe('동료 패널 — 사기·유대 블록', () => {
  it('사기는 동료가 없어도 플레이어 전역 수치로 보인다', () => {
    GameState.stats.morale.current = 70;
    GameState.stats.morale.max     = 100;

    const el = mountPanel();
    const status = el.querySelector('#bc-comp-status');

    expect(status).not.toBeNull();
    expect(status.textContent).toContain('사기 (MORALE)');
    expect(status.textContent).toContain('70/100');
    // 동료가 없어도 사기 게이지는 남는다
    expect(status.querySelector('.bc-comp-stat .gauge-fill--morale').style.width).toBe('70%');
    expect(status.querySelector('.bc-comp-bond.empty')).not.toBeNull();
  });

  it('사기 구간이 바뀌면 설명도 바뀐다', () => {
    GameState.stats.morale.current = 5;   // gameBalance despair 구간 (< 15)
    expect(mountPanel().querySelector('.bc-comp-stat-note').textContent).toContain('절망');

    GameState.stats.morale.current = 80;  // high 구간 (>= 70)
    expect(mountPanel().querySelector('.bc-comp-stat-note').textContent).toContain('높음');
  });

  it('유대는 동료마다 이름표를 단 게이지로 나뉜다', () => {
    GameState.companions  = ['npc_nurse', 'npc_mechanic'];
    GameState.npcs.states = {
      npc_nurse:    { spawned: true, isCompanion: true, hp: 100, bond: 45, woundLevel: 0, infectionLevel: 0 },
      npc_mechanic: { spawned: true, isCompanion: true, hp: 100, bond: 0,  woundLevel: 0, infectionLevel: 0 },
    };

    const bonds = mountPanel().querySelectorAll('.bc-comp-bond');

    expect(bonds).toHaveLength(2);
    expect(bonds[0].querySelector('.bc-comp-scope').textContent.trim()).not.toBe('나');
    expect(bonds[0].textContent).toContain('45 · 우호');   // 31~60 → 우호
    expect(bonds[1].textContent).toContain('0 · 경계');
    expect(bonds[0].querySelector('.gauge-fill').style.width).toBe('45%');
  });

  it('블록은 스크롤하는 동료 목록 밖에 있다', () => {
    // 동료가 둘 이상이면 목록이 넘치는데, 블록이 목록 안에 있으면 화면 밖으로 밀린다
    GameState.companions  = ['npc_nurse', 'npc_mechanic'];
    GameState.npcs.states = {
      npc_nurse:    { spawned: true, isCompanion: true, hp: 100, bond: 0, woundLevel: 0, infectionLevel: 0 },
      npc_mechanic: { spawned: true, isCompanion: true, hp: 100, bond: 0, woundLevel: 0, infectionLevel: 0 },
    };

    const el = mountPanel();

    expect(el.querySelector('.bc-comp-list .bc-comp-card')).not.toBeNull();
    expect(el.querySelector('.bc-comp-list #bc-comp-status')).toBeNull();
    expect(el.querySelector('#bc-comp-status').parentElement).toBe(el);
  });

  it('게이지 트랙이 폭을 갖도록 공용 gauge-row 3열 그리드를 덮어쓴다', () => {
    // 공용 .gauge-row는 `auto 1fr auto`라 라벨·수치 없이 트랙만 넣으면 폭이 0이 된다.
    // happy-dom은 레이아웃을 계산하지 않아 선언 자체를 검사한다.
    expect(PANEL_CSS).toMatch(/\.bc-comp-status\s+\.gauge-row\s*\{[^}]*grid-template-columns:\s*1fr/);
  });

  it('사기가 바뀌면 동료 카드를 다시 그리지 않고 블록만 갱신한다', () => {
    GameState.companions  = ['npc_nurse'];
    GameState.npcs.states = {
      npc_nurse: { spawned: true, isCompanion: true, hp: 100, bond: 10, woundLevel: 0, infectionLevel: 0 },
    };
    GameState.stats.morale.current = 70;

    const el   = mountPanel();
    const card = el.querySelector('.bc-comp-card');

    GameState.stats.morale.current = 40;
    CompanionPanel.renderStatus();

    expect(el.querySelector('.bc-comp-card')).toBe(card);   // 같은 노드 = 재렌더 없음
    expect(el.querySelector('#bc-comp-status').textContent).toContain('40/100');
  });
});
