// @vitest-environment happy-dom
// === 장소 카드 모서리 배지 회귀 테스트 ===
// INBOX 3군: v2 레퍼런스의 장소 카드는 좌상단 1~2개 · 우상단 1개의 아이콘 배지를 갖는다.
//
// 지키는 것 넷:
//  1. 세 빌더(_buildSubLocationInner / _buildLandmarkInner / _buildLocationInner)가
//     같은 헤더 상자(좌·중·우 3칸)를 쓴다. 한 곳만 고치면 랜드마크 안과 구 목록이 갈린다.
//  2. 가운데 텍스트 배지(현재 위치·랜드마크·내부)는 배지를 넣으면서 사라지지 않는다.
//  3. 배지 수치는 화면이 따로 세지 않고 원본에서 읽는다 — 랜드마크의 세부장소 수는
//     ExploreSystem 이 보드에 놓는 것과 같은 getVisibleSubLocations 로 센다.
//  4. 없는 정보를 만들지 않는다 — 방사능 0인 구에는 방사능 배지가 없다.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import CardFactory from '../../js/ui/CardFactory.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';
import { DISTRICTS } from '../../js/data/districts.js';
import { getVisibleSubLocations } from '../../js/data/landmarks.js';

const CARDS_CSS  = path.resolve(__dirname, '../../css/cards.css');
const MOBILE_CSS = path.resolve(__dirname, '../../css/mobile.css');

const SUB_DEF = {
  id: 'sl_test_ward', subLocationId: 'test_ward', districtId: 'dongjak',
  name: '테스트 병동', icon: '🏥', sublocation: true,
  description: '불이 꺼진 병동. 처치 도구가 흩어져 있다.', dangerMod: 0.05,
};

// 숨겨진 세부장소 — 발견 뒤에만 카드가 나온다 (landmarks.js 의 실제 엔트리)
const HIDDEN_SUB_DEF = {
  id: 'sl_sl_jongno_royal_vault', subLocationId: 'sl_jongno_royal_vault', districtId: 'jongno',
  name: '지하 왕실 금고', icon: '👑', sublocation: true,
  description: '근정전 박석 아래 도면에 없는 계단.', dangerMod: 0.18,
};

function frag(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  return box;
}

const left  = el => [...el.querySelectorAll('.lc-corner--left .lc-badge')];
const right = el => el.querySelector('.lc-corner--right')?.firstElementChild ?? null;

describe('장소 카드 — 헤더 3칸 구조', () => {
  const builders = [
    ['세부장소', () => CardFactory._buildSubLocationInner(SUB_DEF)],
    ['현재 구 랜드마크', () => CardFactory._buildLandmarkInner(ITEMS.lm_gangnam, true)],
    ['다른 구 랜드마크', () => CardFactory._buildLandmarkInner(ITEMS.lm_gangnam, false)],
    ['구', () => CardFactory._buildLocationInner(ITEMS.loc_gangnam)],
  ];

  for (const [label, build] of builders) {
    it(`${label} 카드가 좌·중·우 3칸을 모두 그린다`, () => {
      const el = frag(build());
      expect(el.querySelector('.lc-corner--left')).not.toBeNull();
      expect(el.querySelector('.lc-corner--center')).not.toBeNull();
      expect(el.querySelector('.lc-corner--right')).not.toBeNull();
    });

    it(`${label} 카드의 우상단에 장소 성격 아이콘이 하나 선다`, () => {
      const el = frag(build());
      const icon = right(el);
      expect(icon).not.toBeNull();
      expect(icon.className).toMatch(/data-icon|ui-icon/);
      expect(el.querySelectorAll('.lc-corner--right > *').length).toBe(1);
    });

    it(`${label} 카드의 좌상단 배지는 2개를 넘지 않는다`, () => {
      expect(left(frag(build())).length).toBeLessThanOrEqual(2);
    });
  }
});

describe('장소 카드 — 가운데 텍스트 배지 보존', () => {
  it('세부장소의 `내부` 배지가 남아 있다', () => {
    const el = frag(CardFactory._buildSubLocationInner(SUB_DEF));
    expect(el.querySelector('.lc-corner--center .lm-badge')).not.toBeNull();
  });

  it('랜드마크의 `랜드마크` 배지가 남아 있다', () => {
    const el = frag(CardFactory._buildLandmarkInner(ITEMS.lm_gangnam, true));
    expect(el.querySelector('.lc-corner--center .lm-badge')).not.toBeNull();
  });

  it('현재 위치 구 카드의 `현재 위치` 배지가 남아 있다', () => {
    const prev = GameState.location.currentDistrict;
    GameState.location.currentDistrict = 'gangnam';
    try {
      const el = frag(CardFactory._buildLocationInner(ITEMS.loc_gangnam));
      expect(el.querySelector('.lc-corner--center .lc-current-badge')).not.toBeNull();
    } finally {
      GameState.location.currentDistrict = prev;
    }
  });
});

describe('구 카드 — 방사능·랜드마크 배지', () => {
  it('방사능이 있는 구만 경고 배지를 단다', () => {
    // 종로구 radiation: 10 — 도착·탐색마다 피폭되는데 카드 어디에도 없던 값이다
    const el = frag(CardFactory._buildLocationInner(ITEMS.loc_jongno));
    const warn = el.querySelector('.lc-corner--left .lc-badge--warn');
    expect(warn).not.toBeNull();
    expect(warn.textContent).toBe(String(DISTRICTS.jongno.radiation));
  });

  it('방사능 0인 구에는 경고 배지가 없다 — 없는 정보를 만들지 않는다', () => {
    expect(DISTRICTS.gangnam.radiation).toBe(0);
    const el = frag(CardFactory._buildLocationInner(ITEMS.loc_gangnam));
    expect(el.querySelector('.lc-corner--left .lc-badge--warn')).toBeNull();
  });

  it('랜드마크 수 배지가 구 데이터의 개수와 같다', () => {
    for (const districtId of ['gangnam', 'yeongdeungpo', 'gangbuk']) {
      const d = DISTRICTS[districtId];
      const expected = d.landmarks?.length ?? (d.landmark ? 1 : 0);
      const el = frag(CardFactory._buildLocationInner(ITEMS[`loc_${districtId}`]));
      const nums = left(el).map(b => b.textContent);
      expect(nums[nums.length - 1]).toBe(String(expected));
    }
  });
});

describe('랜드마크 카드 — 세부장소 수 배지', () => {
  it('보드에 실제로 놓이는 세부장소 수와 같다 — 같은 getVisibleSubLocations 로 센다', () => {
    const discovered = GameState.flags?.hiddenLocationsDiscovered ?? [];
    const el = frag(CardFactory._buildLandmarkInner(ITEMS.lm_gangnam, true));
    const badge = left(el)[0];
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe(String(getVisibleSubLocations('lm_gangnam', discovered).length));
  });

  it('숨겨진 세부장소는 발견 전에는 수에 들어가지 않는다', () => {
    const gs = GameState;
    const prev = gs.flags.hiddenLocationsDiscovered;
    try {
      gs.flags.hiddenLocationsDiscovered = [];
      const before = Number(left(frag(CardFactory._buildLandmarkInner(ITEMS.lm_jongno, true)))[0].textContent);
      gs.flags.hiddenLocationsDiscovered = ['hidden_jongno_royal_vault'];
      const after = Number(left(frag(CardFactory._buildLandmarkInner(ITEMS.lm_jongno, true)))[0].textContent);
      expect(after).toBe(before + 1);
    } finally {
      gs.flags.hiddenLocationsDiscovered = prev;
    }
  });

  it('베이스캠프는 `basecamp` 키로 센다 — 카드 id 는 basecamp_landmark 다', () => {
    const el = frag(CardFactory._buildLandmarkInner(ITEMS.basecamp_landmark, true));
    const badge = left(el)[0];
    expect(badge?.textContent).toBe(String(getVisibleSubLocations('basecamp', []).length));
  });
});

describe('세부장소 카드 — 숨겨진 장소 표시', () => {
  it('일반 세부장소에는 자물쇠 배지가 없다', () => {
    expect(left(frag(CardFactory._buildSubLocationInner(SUB_DEF))).length).toBe(0);
  });

  it('숨겨진 세부장소에만 자물쇠 배지가 붙는다', () => {
    const el = frag(CardFactory._buildSubLocationInner(HIDDEN_SUB_DEF));
    const badge = left(el)[0];
    expect(badge).not.toBeNull();
    expect(badge.querySelector('.ui-icon--lock')).not.toBeNull();
  });
});

describe('장소 카드 — 기존 정보 보존', () => {
  it('설명·요구치·위험도가 배지 때문에 사라지지 않는다', () => {
    const el = frag(CardFactory._buildLocationInner(ITEMS.loc_gangnam));
    expect(el.querySelector('.lc-desc')).not.toBeNull();
    expect(el.querySelector('.lc-req')).not.toBeNull();
    expect(el.querySelector('.lc-danger')).not.toBeNull();
    expect(el.querySelector('.lc-scene')).not.toBeNull();
  });
});

describe('cards.css — 헤더 정렬', () => {
  const css = fs.readFileSync(CARDS_CSS, 'utf8');
  const block = css.match(/\.lc-header\s*\{[^}]*\}/)?.[0] ?? '';

  it('좌·중·우 3열 그리드다 — 배지 개수가 달라도 가운데가 같은 자리에 선다', () => {
    expect(block).toMatch(/grid-template-columns:\s*1fr\s+auto\s+1fr/);
  });

  it('헤더 높이 하한이 그대로다 — 커지면 씬이 그만큼 줄어든다', () => {
    expect(block).toMatch(/min-height:\s*14px/);
  });
});

describe('mobile.css — 좁은 화면에서 배지를 줄인다', () => {
  const css = fs.readFileSync(MOBILE_CSS, 'utf8');

  it('설명을 접는 세 브레이크포인트 모두에서 모서리 배지 크기를 낮춘다', () => {
    // 83px 카드에서 좌 2개 + 가운데 텍스트 + 우 1개가 한 줄을 넘으면 헤더가 접힌다
    const shrunk = css.match(/\.lc-corner\s*\{[^}]*font-size/g) ?? [];
    expect(shrunk.length).toBe(3);
  });
});
