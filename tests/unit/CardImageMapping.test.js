// === 카드 이미지·스택 설정 중복 키 테스트 ===
// regression: CARD_IMAGES에 같은 키가 두 번 선언된 항목이 56종 있었다. 앞쪽은
// 전용 아트가 나오기 전 임시로 깔아둔 대체 이미지(raw_meat.png 등)였고 뒤쪽이
// 전용 아트였다. 객체 리터럴은 뒤 값이 이기므로 화면에는 옳은 그림이 나왔지만,
// 앞줄 19건은 존재하지도 않는 경로를 가리키고 있었다.
// stackConfig의 bibimbap도 maxStack 5와 3이 함께 선언돼 있었다.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import STACK_CONFIG from '../../js/data/stackConfig.js';

/** 소스에서 `  key: 'assets/...'` 형태를 순서대로 뽑는다 */
function cardImageLines() {
  const src = fs.readFileSync('js/ui/CardFactory.js', 'utf8').split(/\r?\n/);
  const out = [];
  src.forEach((line, i) => {
    const m = line.match(/^\s{2}([a-z0-9_]+):\s*'(assets\/[^']+)'/);
    if (m) out.push({ key: m[1], value: m[2], line: i + 1 });
  });
  return out;
}

/** stackConfig의 `['id', bool, n]` 항목을 순서대로 뽑는다 */
function stackConfigLines() {
  const src = fs.readFileSync('js/data/stackConfig.js', 'utf8').split(/\r?\n/);
  const out = [];
  src.forEach((line, i) => {
    const m = line.match(/^\s*\[\s*'([a-z0-9_]+)'\s*,/);
    if (m) out.push({ key: m[1], line: i + 1 });
  });
  return out;
}

function duplicates(entries) {
  const seen = new Map();
  for (const e of entries) {
    if (!seen.has(e.key)) seen.set(e.key, []);
    seen.get(e.key).push(e.line);
  }
  return [...seen.entries()]
    .filter(([, lines]) => lines.length > 1)
    .map(([key, lines]) => `${key}(L${lines.join(',L')})`);
}

describe('CARD_IMAGES — 중복 키', () => {
  it('같은 카드 id가 두 번 선언되지 않는다', () => {
    const dups = duplicates(cardImageLines());
    expect(dups, `중복 선언: ${dups.join(', ')}`).toEqual([]);
  });

  it('매핑된 이미지 파일이 모두 실재한다', () => {
    const missing = cardImageLines()
      .filter(e => !fs.existsSync(e.value))
      .map(e => `${e.key} → ${e.value}`);
    expect(missing, `없는 파일: ${missing.join(', ')}`).toEqual([]);
  });

  it('키 하나당 경로 하나로 정리되어 있다', () => {
    const entries = cardImageLines();
    expect(new Set(entries.map(e => e.key)).size).toBe(entries.length);
  });
});

describe('STACK_CONFIG — 중복 id', () => {
  it('같은 아이템 id가 두 번 선언되지 않는다', () => {
    const dups = duplicates(stackConfigLines());
    expect(dups, `중복 선언: ${dups.join(', ')}`).toEqual([]);
  });

  it('비빔밥은 확장 요리 묶음과 같은 스택 상한을 쓴다', () => {
    // kimchi_stew·galbi_jjim 등 Phase 4 요리와 동일한 3이 적용값이다.
    expect(STACK_CONFIG.bibimbap.maxStack).toBe(3);
    expect(STACK_CONFIG.kimchi_stew.maxStack).toBe(3);
  });
});
