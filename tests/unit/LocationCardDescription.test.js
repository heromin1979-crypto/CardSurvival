// @vitest-environment happy-dom
// === 장소 카드 설명·요구치 회귀 테스트 ===
// INBOX 3군: 장소 카드에 설명 2줄과 목표의 `Requirement: N` 자리를 넣었다.
//
// 지키는 것 셋:
//  1. 장소 카드 본문 빌더가 셋이다 (_buildSubLocationInner / _buildLandmarkInner /
//     _buildLocationInner). 한 곳만 고치면 랜드마크 안에서는 설명이 나오고 구 목록에서는
//     안 나온다 — 화면이 갈리므로 셋을 함께 고정한다.
//  2. 요구치를 넣으면서 기존 위험도·조우 확률을 지우지 않는다 (INBOX 명시).
//  3. 설명은 두 줄에서 말줄임되므로 전문은 카드 title 툴팁이 받는다.
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import CardFactory from '../../js/ui/CardFactory.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

const CARDS_CSS  = path.resolve(__dirname, '../../css/cards.css');
const MOBILE_CSS = path.resolve(__dirname, '../../css/mobile.css');

const SUB_DEF = {
  id: 'sl_test_ward', subLocationId: 'test_ward', districtId: 'dongjak',
  name: '테스트 병동', icon: '🏥', sublocation: true,
  description: '불이 꺼진 병동. 처치 도구가 흩어져 있다.', dangerMod: 0.05,
};

function frag(html) {
  const box = document.createElement('div');
  box.innerHTML = html;
  return box;
}

describe('장소 카드 — 설명 2줄', () => {
  it('세부장소 카드가 설명을 그린다', () => {
    const el = frag(CardFactory._buildSubLocationInner(SUB_DEF));
    expect(el.querySelector('.lc-desc')?.textContent).toBe(SUB_DEF.description);
  });

  it('구 카드가 설명을 그린다', () => {
    const def = ITEMS.loc_gangnam;
    const el = frag(CardFactory._buildLocationInner(def));
    expect(el.querySelector('.lc-desc')?.textContent).toBe(def.description);
  });

  it('현재 구 랜드마크 카드가 설명을 그린다', () => {
    const def = ITEMS.lm_gangnam;
    const el = frag(CardFactory._buildLandmarkInner(def, true));
    expect(el.querySelector('.lc-desc')?.textContent).toBe(def.description);
    // 랜드마크 보너스는 설명에 밀려나지 않는다
    expect(el.querySelector('.lm-bonus')?.textContent).toBe(def.landmarkBonus);
  });

  it('다른 구 랜드마크 카드가 설명을 그린다', () => {
    const def = ITEMS.lm_gangnam;
    const el = frag(CardFactory._buildLandmarkInner(def, false));
    expect(el.querySelector('.lc-desc')?.textContent).toBe(def.description);
  });

  it('설명이 없는 정의도 빈 줄로 자리를 지킨다 — 카드 높이가 갈리면 안 된다', () => {
    const el = frag(CardFactory._buildSubLocationInner({ ...SUB_DEF, description: undefined }));
    expect(el.querySelector('.lc-desc')).not.toBeNull();
    expect(el.querySelector('.lc-desc').textContent).toBe('');
  });
});

describe('장소 카드 — 요구치(TP)', () => {
  it('세부장소는 1 TP — ExploreSystem.enterSubLocation 이 쓰는 값이다', () => {
    const el = frag(CardFactory._buildSubLocationInner(SUB_DEF));
    expect(el.querySelector('.lc-req')?.textContent).toBe('요구 1TP');
  });

  it('구 카드는 그 구의 이동 비용을 쓴다', () => {
    const def = ITEMS.loc_gangnam;
    const el = frag(CardFactory._buildLocationInner(def));
    expect(el.querySelector('.lc-req')?.textContent).toBe(`요구 ${def.travelCostTP}TP`);
  });

  it('현재 구 랜드마크는 1 TP — 진입이 첫 세부장소로 자동 진입하며 1 TP 를 쓴다', () => {
    const el = frag(CardFactory._buildLandmarkInner(ITEMS.lm_gangnam, true));
    expect(el.querySelector('.lc-req')?.textContent).toBe('요구 1TP');
  });

  it('베이스캠프 랜드마크만 요구 없음 — 자동 진입에서 제외된다', () => {
    const el = frag(CardFactory._buildLandmarkInner(ITEMS.basecamp_landmark, true));
    expect(el.querySelector('.lc-req')?.textContent).toBe('요구 없음');
  });
});

describe('장소 카드 — 기존 정보 보존', () => {
  it('세부장소의 위험도와 탐색 표시가 남아 있다', () => {
    const el = frag(CardFactory._buildSubLocationInner(SUB_DEF));
    expect(el.querySelector('.lc-danger')?.textContent.trim()).toContain('5');
    expect(el.querySelector('.lc-meta')?.textContent).toContain('탐색');
  });

  it('구 카드의 위험도 점과 조우 확률이 남아 있다', () => {
    const def = ITEMS.loc_gangnam;
    const el = frag(CardFactory._buildLocationInner(def));
    expect(el.querySelector('.lc-danger')?.textContent.trim()).toMatch(/[●○]{3}/);
    expect(el.querySelector('.lc-meta')?.textContent)
      .toContain(String(Math.round(def.encounterChance * 100)));
  });
});

describe('장소 카드 — 말줄임된 설명의 전문', () => {
  beforeEach(() => {
    GameState.cards = {};
    GameState.board = {
      top: Array(10).fill(null), environment: Array(3).fill(null),
      middle: Array(20).fill(null), bottom: Array(20).fill(null),
    };
    document.body.innerHTML = '';
  });

  it('구 카드의 title 에 설명 전문이 들어간다', () => {
    const inst = GameState.createCardInstance('loc_gangnam');
    const el = CardFactory.build(inst.instanceId);
    expect(el.title).toBe(ITEMS.loc_gangnam.description);
  });
});

describe('cards.css — 설명 줄의 높이 고정', () => {
  const css = fs.readFileSync(CARDS_CSS, 'utf8');
  const block = css.match(/\.lc-desc\s*\{[^}]*\}/)?.[0] ?? '';

  it('두 줄에서 자른다', () => {
    expect(block).toMatch(/-webkit-line-clamp:\s*2/);
  });

  it('높이가 고정이다 — 한 줄짜리 설명 카드만 아래 정보가 위로 올라오면 8장이 어긋난다', () => {
    expect(block).toMatch(/height:\s*\d+px/);
  });
});

describe('mobile.css — 좁은 화면에서는 설명을 접는다', () => {
  const css = fs.readFileSync(MOBILE_CSS, 'utf8');

  it('모바일 브레이크포인트 세 곳에서 .lc-desc 를 감춘다', () => {
    // 78px~104px 카드에 24px 설명 줄을 넣으면 씬이 사라진다.
    // (≤600px · ≤480px · 가로 모드) — 가로 모드는 폭이 480 을 넘어 따로 필요하다.
    const hidden = css.match(/\.lc-desc\s*\{\s*display:\s*none/g) ?? [];
    expect(hidden.length).toBe(3);
  });
});
