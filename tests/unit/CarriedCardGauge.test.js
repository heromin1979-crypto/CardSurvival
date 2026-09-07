// @vitest-environment happy-dom
// === 휴대품 카드 수량·내구도 게이지 회귀 테스트 ===
// INBOX 3군: v2 레퍼런스의 휴대품 카드는 아트 아래에 `Qty n/n` · `Durability n/n`
// 두 게이지를 갖는다.
//
// 지키는 것 넷:
//  1. 내구도는 퍼센트가 아니라 절대값이다. 채움 폭은 def.defaultDurability 로 나눠 구한다 —
//     그대로 width:N% 에 넣으면 최대치가 100이 아닌 아이템(야생 베리 20, 카타나 120)이 거짓말을 한다.
//  2. 같은 값을 한 카드에 두 번 그리지 않는다. 게이지가 이름 옆 배지(×N · N%)와
//     아트 위 스택 배지를 대신한다.
//  3. 없는 정보는 그리지 않는다 — 소모품에는 내구도 게이지가, 겹치지 않는 아이템에는
//     수량 게이지가 서지 않는다.
//  4. 589개 아이템 어느 것으로 그려도 게이지 숫자가 NaN·undefined 로 새지 않는다.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import CardFactory from '../../js/ui/CardFactory.js';
import ITEMS from '../../js/data/items.js';

const CARDS_CSS  = path.resolve(__dirname, '../../css/cards.css');
const MOBILE_CSS = path.resolve(__dirname, '../../css/mobile.css');
const FACTORY_JS = path.resolve(__dirname, '../../js/ui/CardFactory.js');

function card(defId, over = {}) {
  const def  = ITEMS[defId];
  const inst = {
    instanceId: `t_${defId}`, definitionId: defId,
    quantity: 1, durability: def.defaultDurability ?? 100, contamination: 0,
    ...over,
  };
  const box = document.createElement('div');
  box.innerHTML = CardFactory._buildInner(inst, def);
  return box;
}

const qty  = el => el.querySelector('.card-gauge--qty');
const dur  = el => el.querySelector('.card-gauge--dur');
const val  = g => g?.querySelector('.card-gauge-val')?.textContent.trim() ?? null;
const fill = g => g?.querySelector('.card-gauge-fill')?.getAttribute('style') ?? '';

describe('휴대품 카드 — 수량 게이지', () => {
  it('겹치는 소모품은 현재 수량과 최대 스택을 함께 적는다', () => {
    const el = card('bandage', { quantity: 3 });   // maxStack 10
    expect(val(qty(el))).toBe('3/10');
    expect(fill(qty(el))).toContain('width:30%');
  });

  it('가득 찬 스택은 게이지가 끝까지 찬다', () => {
    const el = card('canned_food', { quantity: 5 });  // maxStack 5
    expect(val(qty(el))).toBe('5/5');
    expect(fill(qty(el))).toContain('width:100%');
  });

  it('겹치지 않는 아이템에는 수량 게이지를 그리지 않는다', () => {
    expect(qty(card('scalpel'))).toBeNull();          // stackable: false
    expect(qty(card('combat_scalpel'))).toBeNull();
  });
});

describe('휴대품 카드 — 내구도 게이지', () => {
  it('도구의 내구도를 현재값/최대값으로 적는다', () => {
    const el = card('scalpel', { durability: 45 });   // defaultDurability 100
    expect(val(dur(el))).toBe('45/100');
    expect(fill(dur(el))).toContain('width:45%');
  });

  it('최대 내구도가 100이 아닌 아이템도 비율로 그린다', () => {
    // 야생 베리는 defaultDurability 20 이다. 절대값을 그대로 width 에 넣으면
    // 갓 딴 열매가 20% 로 보인다 (수정 전 캡처에서 실제로 그랬다).
    const el = card('wild_berry', { quantity: 7, durability: 20 });
    expect(val(dur(el))).toBe('20/20');
    expect(fill(dur(el))).toContain('width:100%');
    expect(val(qty(el))).toBe('7/20');
  });

  it('보너스로 최대치를 넘긴 내구도는 100% 에서 멈춘다', () => {
    // 엔지니어 특성은 구조물 내구도에 배율을 곱한다 (GameState.createCardInstance)
    const el = card('scalpel', { durability: 150 });
    expect(fill(dur(el))).toContain('width:100%');
  });

  it('닳은 정도에 따라 채움 색이 갈린다', () => {
    const mid  = card('katana', { durability: 60 });   // 120 중 60 → 50%
    const crit = card('combat_scalpel', { durability: 12 });
    expect(dur(mid).querySelector('.card-gauge-fill').className).toContain('low');
    expect(dur(crit).querySelector('.card-gauge-fill').className).toContain('crit');
  });

  it('닳지 않는 전설 장신구에는 내구도 게이지를 그리지 않는다', () => {
    // defaultDurability: Infinity 인 4개(crew_pass · tiger_fang_necklace · gold_watch ·
    // mothers_necklace). 남은 양이라는 개념이 없다 — 예전에는 width:Infinity% 를 내보냈다.
    for (const id of ['crew_pass', 'tiger_fang_necklace', 'gold_watch', 'mothers_necklace']) {
      expect(ITEMS[id].defaultDurability).toBe(Infinity);
      expect(dur(card(id))).toBeNull();
    }
  });

  it('소모품에는 내구도 게이지를 그리지 않는다', () => {
    // 붕대·통조림은 defaultDurability 가 100 이지만 type 이 consumable 이라
    // 게임이 내구도를 깎지 않는다. 있지도 않은 소모를 그리지 않는다.
    expect(dur(card('bandage', { quantity: 3 }))).toBeNull();
    expect(dur(card('canned_food', { quantity: 5 }))).toBeNull();
  });
});

describe('휴대품 카드 — 같은 값을 두 번 그리지 않는다', () => {
  it('수량 게이지가 이름 옆 ×N 배지와 아트 위 스택 배지를 대신한다', () => {
    const consumable = card('bandage', { quantity: 3 });
    const material   = card('wild_berry', { quantity: 7 });
    for (const el of [consumable, material]) {
      expect(el.querySelector('.card-name-qty')).toBeNull();
      expect(el.querySelector('.card-stack')).toBeNull();
    }
  });

  it('내구도 게이지가 이름 옆 N% 배지를 대신한다', () => {
    const el = card('scalpel', { durability: 45 });
    expect(el.querySelector('.card-name-dur')).toBeNull();
  });

  it('예전 이름 옆 배지와 얇은 내구도 바는 코드에서 사라졌다', () => {
    // 남겨 두면 다음 바퀴가 "왜 안 보이지" 하며 되살린다.
    const js = fs.readFileSync(FACTORY_JS, 'utf8');
    expect(js).not.toContain('card-name-qty');
    expect(js).not.toContain('card-name-dur');
    expect(js).not.toContain('card-stack');
    expect(js).not.toContain('card-durability');
  });
});

describe('휴대품 카드 — 순서와 안전성', () => {
  it('아트 다음에 수량, 그다음 내구도가 온다', () => {
    const html = CardFactory._buildInner(
      { instanceId: 't_berry', definitionId: 'wild_berry', quantity: 7, durability: 20, contamination: 0 },
      ITEMS.wild_berry,
    );
    expect(html.indexOf('card-art')).toBeLessThan(html.indexOf('card-gauge--qty'));
    expect(html.indexOf('card-gauge--qty')).toBeLessThan(html.indexOf('card-gauge--dur'));
  });

  it('589개 아이템 어느 것을 그려도 게이지 숫자가 새지 않는다', () => {
    const bad = [];
    for (const def of Object.values(ITEMS)) {
      if (def.type === 'location' || def.type === 'npc') continue;
      let el;
      try { el = card(def.id, { quantity: 2 }); }
      catch (e) { bad.push(`${def.id}: ${e.message}`); continue; }
      for (const g of el.querySelectorAll('.card-gauge')) {
        const text = g.textContent;
        if (/NaN|undefined|Infinity/.test(text)) bad.push(`${def.id}: ${text.trim()}`);
        const w = g.querySelector('.card-gauge-fill')?.getAttribute('style') ?? '';
        const pct = Number(w.match(/width:\s*([\d.]+)%/)?.[1] ?? -1);
        if (!(pct >= 0 && pct <= 100)) bad.push(`${def.id}: width ${w}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('css — 게이지 서식', () => {
  const cards  = fs.readFileSync(CARDS_CSS, 'utf8');
  const mobile = fs.readFileSync(MOBILE_CSS, 'utf8');

  it('cards.css 가 게이지 상자·트랙·채움을 정의한다', () => {
    expect(cards).toMatch(/\.card-gauge\s*\{/);
    expect(cards).toMatch(/\.card-gauge-track\s*\{/);
    expect(cards).toMatch(/\.card-gauge-fill\s*\{/);
  });

  it('죽은 규칙(.card-durability · .card-stack · 이름 옆 배지)을 남기지 않았다', () => {
    expect(cards).not.toContain('.card-durability');
    expect(cards).not.toContain('.card-stack');
    expect(cards).not.toContain('.card-name-qty');
    expect(cards).not.toContain('.card-name-dur');
  });

  it('모바일 브레이크포인트 세 곳에서 게이지를 줄인다', () => {
    // 78px~64px 카드에서 9px 글자 두 줄은 아트를 먹는다 (.lc-desc 와 같은 이유).
    const shrunk = mobile.match(/\.card-gauge-label\b/g) ?? [];
    expect(shrunk.length).toBe(3);
  });
});
