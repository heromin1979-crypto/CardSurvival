// @vitest-environment happy-dom
// === 사이드바 소음·무게 블록 ===
// 목표(docs/loop/reference/ui-refs/main-screen-v2.png)의 두 블록은
// 소음 = 퍼센트 + 굵은 게이지 + 위험 경고문, 무게 = `42.1 / 60kg` + 게이지 + 구간 라벨이다.
// 구간을 가르는 값은 화면이 다시 정하지 않고 BALANCE·GameState 가 아는 것을 읽는다 —
// 화면이 임계값을 복사해 두면 밸런스를 고쳤을 때 표시만 옛 구간을 말한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import GameState         from '../../js/core/GameState.js';
import BALANCE           from '../../js/data/gameBalance.js';
import EncumbranceSystem from '../../js/systems/EncumbranceSystem.js';
import StatRenderer      from '../../js/ui/StatRenderer.js';

const MAIN_JS      = readFileSync(path.resolve('js/screens/Main.js'), 'utf8');
const STAT_RENDERER = readFileSync(path.resolve('js/ui/StatRenderer.js'), 'utf8');
const UI_CSS       = readFileSync(path.resolve('css/ui.css'), 'utf8');
const MOBILE_CSS   = readFileSync(path.resolve('css/mobile.css'), 'utf8');

// _buildLayout() 템플릿의 사이드바 조각만 떼어 DOM 으로 읽는다 (SidebarSectionOrder.test.js 와 같은 방식)
function sidebar() {
  const html = MAIN_JS
    .slice(MAIN_JS.indexOf('<aside class="bc-sidebar">'), MAIN_JS.indexOf('</aside>') + 8)
    .replace(/\$\{[^}]*\}/g, '');
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild;
}

describe('소음 블록 마크업', () => {
  it('퍼센트·게이지·경고문 세 조각을 모두 들고 있다', () => {
    const block = sidebar().querySelector('#bc-noise-section .bc-noise-block');

    expect(block.querySelector('#noise-val')).not.toBeNull();
    expect(block.querySelector('#noise-fill')).not.toBeNull();
    expect(block.querySelector('#noise-warn')).not.toBeNull();
  });

  it('경고문은 기본으로 감춰져 있다 — StatRenderer 가 임계 초과에만 연다', () => {
    expect(sidebar().querySelector('#noise-warn').hasAttribute('hidden')).toBe(true);
  });

  it('TP당 감소율 자리가 남아 있다 — 소음이 저절로 잦아든다는 유일한 단서다', () => {
    expect(sidebar().querySelector('#noise-decay')).not.toBeNull();
  });
});

describe('무게 블록 마크업', () => {
  it('값·구간 라벨·게이지 세 조각을 모두 들고 있다', () => {
    const block = sidebar().querySelector('#bc-weight-section .bc-enc-block');

    expect(block.querySelector('#hud-enc')).not.toBeNull();
    expect(block.querySelector('#hud-enc-tier')).not.toBeNull();
    expect(block.querySelector('#hud-enc-fill')).not.toBeNull();
  });
});

describe('소음 구간 판정', () => {
  // 화면에 필요한 노드만 세워 두고 render() 를 돌린다. render() 의 모든 조회는 if 로 막혀 있다.
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="noise-val"></span><span id="noise-decay"></span>
      <div id="noise-track"><div id="noise-fill"></div></div>
      <div id="noise-warn" hidden></div>`;
  });

  const renderAt = (level) => {
    GameState.noise.level = level;
    StatRenderer.render();
    return {
      pct:   document.getElementById('noise-val').textContent,
      state: document.getElementById('noise-fill').className,
      width: document.getElementById('noise-fill').style.width,
      warn:  !document.getElementById('noise-warn').hidden,
    };
  };

  it('경고 레벨 미만은 calm 이고 경고문이 없다', () => {
    const r = renderAt(BALANCE.noise.warnLevel - 1);

    expect(r.state).toBe('noise-fill calm');
    expect(r.warn).toBe(false);
  });

  it('경고 레벨부터 warn 으로 넘어가지만 아직 경고문은 없다', () => {
    const r = renderAt(BALANCE.noise.warnLevel);

    expect(r.state).toBe('noise-fill warn');
    expect(r.warn).toBe(false);
  });

  it('유입 임계에서 critical 이 되고 경고문이 열린다', () => {
    const r = renderAt(GameState.noise.influxThreshold);

    expect(r.state).toBe('noise-fill critical');
    expect(r.warn).toBe(true);
  });

  it('퍼센트는 BALANCE.noise.max 를 100%로 본다', () => {
    expect(renderAt(BALANCE.noise.max / 2).pct).toBe('50%');
    expect(renderAt(BALANCE.noise.max).width).toBe('100%');
  });

  it('TP당 감소율은 scaledDecayBreakpoints 를 따라 커진다', () => {
    const top = BALANCE.noise.scaledDecayBreakpoints.at(-1);

    renderAt(0);
    expect(document.getElementById('noise-decay').textContent)
      .toBe(`-${BALANCE.noise.baseDecayPerTP.toFixed(1)}/TP`);

    renderAt(top.threshold);
    expect(document.getElementById('noise-decay').textContent)
      .toBe(`-${(BALANCE.noise.baseDecayPerTP + top.bonusDecay).toFixed(1)}/TP`);
  });

  it('임계값을 화면이 다시 적어 두지 않는다', () => {
    const noiseBlock = STAT_RENDERER.slice(
      STAT_RENDERER.indexOf('// Noise —'),
      STAT_RENDERER.indexOf('// Encumbrance')
    );

    expect(noiseBlock).toMatch(/BALANCE\.noise\.warnLevel/);
    expect(noiseBlock).toMatch(/n\.influxThreshold/);
    expect(noiseBlock).toMatch(/BALANCE\.noise\.scaledDecayBreakpoints/);
  });
});

describe('무게 구간 판정', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="hud-enc"></span><span id="hud-enc-tier"></span>
      <div><div id="hud-enc-fill"></div></div>`;
  });

  const renderAt = (tier) => {
    Object.assign(GameState.player.encumbrance, { current: 12.5, max: 30, tier, weightPct: 0.4 });
    StatRenderer.render();
    return {
      value: document.getElementById('hud-enc').textContent,
      tier:  document.getElementById('hud-enc-tier').textContent,
      cls:   document.getElementById('hud-enc-tier').className,
      fill:  document.getElementById('hud-enc-fill').className,
    };
  };

  it('값은 목표와 같은 `12.5 / 30kg` 형식이다', () => {
    expect(renderAt(0).value).toBe('12.5 / 30kg');
  });

  it('tpMult 페널티가 붙는 tier 3 부터 색이 갈린다', () => {
    expect(renderAt(2).cls).toBe('bc-enc-tier ok');
    expect(renderAt(3).cls).toBe('bc-enc-tier warn');
    expect(renderAt(4).cls).toBe('bc-enc-tier danger');
    expect(renderAt(4).fill).toBe('bc-enc-fill danger');
  });

  it('구간 라벨은 EncumbranceSystem 이 정한 말을 쓴다', () => {
    for (const tier of [0, 1, 2, 3, 4]) {
      GameState.player.encumbrance.tier = tier;
      expect(renderAt(tier).tier).toBe(EncumbranceSystem.getTierLabel());
    }
  });
});

describe('무게 구간 라벨', () => {
  // tier 4(>200%, 이동 불가)가 표에서 빠져 있어 가장 무거운 상태가 '여유'로 표시됐다
  it('GameState 가 만드는 tier 0~4 전부에 이름이 있다', () => {
    const labels = [0, 1, 2, 3, 4].map((tier) => {
      GameState.player.encumbrance.tier = tier;
      return EncumbranceSystem.getTierLabel();
    });

    expect(new Set(labels).size).toBe(5);
  });
});

describe('블록이 차지하는 높이', () => {
  // 사이드바에 남은 세로 여백은 퀘스트 블록(INBOX 2군) 몫이다. 게이지가 두꺼워지는 것은
  // 목표대로지만 모바일은 가로 2행 HUD 바라 줄이 늘면 바 전체가 밀려 올라간다.
  it('데스크톱 게이지는 8px 로 두껍다', () => {
    expect(UI_CSS).toMatch(/\.bc-noise-block \.noise-track\s*\{[^}]*height:\s*8px/);
    expect(UI_CSS).toMatch(/\.bc-enc-block \.bc-enc-track\s*\{[^}]*height:\s*8px/);
  });

  it('모바일 HUD 바에서는 감소율·경고문 줄을 접는다', () => {
    const hides = MOBILE_CSS.match(/\.noise-decay,\s*\n\s*\.bc-noise-warn\s*\{\s*display:\s*none;\s*\}/g) ?? [];

    expect(hides.length).toBe(2);   // 세로 2단(≤480px) + 가로 랜드스케이프
  });
});
