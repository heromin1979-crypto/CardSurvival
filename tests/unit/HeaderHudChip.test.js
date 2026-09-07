// @vitest-environment happy-dom
// === 상단 중앙 HUD 칩 (#game-header) ===
// 이 칩은 마크업이 있는데도 화면에 뜨지 않았다. Main._buildLayout()이 #screen-main의
// innerHTML을 통째로 갈아 끼워 헤더 노드를 지웠고, HeaderBar가 init 때 잡아 둔 참조는
// 떨어져 나간 노드를 계속 가리켰다. 그래서 (1) 레이아웃이 헤더를 다시 만드는지
// (2) HeaderBar가 매 render마다 노드를 다시 찾는지 둘 다 검사한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path             from 'node:path';
import GameState        from '../../js/core/GameState.js';
import HeaderBar        from '../../js/ui/HeaderBar.js';
import WeatherSystem    from '../../js/systems/WeatherSystem.js';

const MAIN_JS = readFileSync(path.resolve('js/screens/Main.js'), 'utf8');

function mountHeader() {
  document.body.innerHTML = '<div id="screen-main"><header id="game-header"></header></div>';
  HeaderBar.render();
  return document.getElementById('game-header');
}

beforeEach(() => {
  GameState.time    = { day: 18, hour: 14, tpInDay: 26, totalTP: 0 };
  GameState.weather = { id: 'sunny', tempJitter: 0 };
  GameState.season  = { current: 'winter' };
});

describe('상단 중앙 HUD 칩', () => {
  it('Day · 시각 · 온도 세 값을 중앙 칩 하나에 담는다', () => {
    const chip = mountHeader().querySelector('.game-header__center');

    expect(chip).not.toBeNull();
    expect(chip.querySelector('.game-header__day').textContent).toBe('Day 18');
    expect(chip.querySelector('.game-header__time').textContent).toMatch(/^\d{2}:\d{2}$/);
    expect(chip.querySelector('.game-header__temp').textContent).toContain('°C');
  });

  it('분을 TP에서 계산한다 — 3 TP가 1시간이므로 00·20·40만 나온다', () => {
    for (const [tpInDay, mm] of [[24, '00'], [25, '20'], [26, '40']]) {
      GameState.time.tpInDay = tpInDay;
      const time = mountHeader().querySelector('.game-header__time').textContent;
      expect(time).toBe(`14:${mm}`);
    }
  });

  it('온도가 사이드바(#outdoor-temp)와 같은 계산에서 나온다', () => {
    const temp = mountHeader().querySelector('.game-header__temp').textContent;

    expect(temp).toBe(`${WeatherSystem.getOutdoorTemperature()}°C`);
  });

  it('헤더 노드가 통째로 갈려도 다시 찾아 그린다', () => {
    mountHeader();
    // Main._buildLayout()이 하는 일과 같다 — 기존 헤더 노드를 버리고 새로 만든다
    document.getElementById('screen-main').innerHTML = '<header id="game-header"></header>';
    HeaderBar.render();

    expect(document.querySelector('#game-header .game-header__day').textContent).toBe('Day 18');
  });

  it('시간대를 #screen-main 에 표시해 배경 틴트가 따라온다', () => {
    mountHeader();

    expect(document.getElementById('screen-main').dataset.timeOfDay).toBe('day');
  });
});

describe('헤더 띠의 자리 다툼', () => {
  it('레이아웃을 다시 만들 때 헤더 껍데기도 같이 만든다', () => {
    const layout = MAIN_JS.match(/_buildLayout\(\)\s*\{[\s\S]*?\n  \},/)[0];

    expect(layout).toMatch(/id="game-header"/);
  });

  it('레이아웃을 만든 뒤 헤더를 다시 채운다', () => {
    const onEnter = MAIN_JS.match(/_onEnter\(\)\s*\{[\s\S]*?\n  \},/)[0];

    expect(onEnter.indexOf('HeaderBar.render()')).toBeGreaterThan(onEnter.indexOf('this._buildLayout()'));
  });

  it('띠의 좌우를 점유하지 않는다 — 왼쪽은 온보딩 칩, 오른쪽은 알림 패널 자리다', () => {
    const html = mountHeader().innerHTML;

    expect(html).not.toMatch(/game-header__(left|right)/);
  });
});
