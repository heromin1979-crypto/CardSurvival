// @vitest-environment happy-dom
// === 심리 특성 테이블 무결성 테스트 ===
// MENTAL_TRAITS에 chef가 두 번 정의돼 있었다. 객체 리터럴은 뒤 값이 조용히
// 이기므로 앞의 { anxietyResist: 1.0, lonelinessBase: 1.3 }은 죽은 값이었고,
// 파일만 봐서는 어느 쪽이 적용되는지 알 수 없었다. CardImageMapping의 중복 키
// 검사는 CARD_IMAGES만 보기 때문에 잡히지 않는다.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MENTAL_TRAITS } from '../../js/systems/MentalSystem.js';
import CHARACTERS from '../../js/data/characters.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '../../js/systems/MentalSystem.js'), 'utf8');

/** 소스에서 MENTAL_TRAITS 블록의 키를 선언 순서대로 추출 (중복 포함) */
function declaredKeys() {
  const start = SRC.indexOf('const MENTAL_TRAITS = {');
  expect(start).toBeGreaterThan(-1);
  const body = SRC.slice(start, SRC.indexOf('\n};', start));
  return [...body.matchAll(/^\s{2}(\w+):\s*\{/gm)].map(m => m[1]);
}

const characterIds = (Array.isArray(CHARACTERS) ? CHARACTERS : Object.values(CHARACTERS))
  .map(c => c?.id).filter(Boolean);

describe('MENTAL_TRAITS — 중복 키', () => {
  it('같은 직업 키를 두 번 선언하지 않는다', () => {
    const keys = declaredKeys();
    const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    expect(dup).toEqual([]);
  });

  it('선언 개수와 실제 키 개수가 일치한다', () => {
    expect(declaredKeys().length).toBe(Object.keys(MENTAL_TRAITS).length);
  });
});

describe('MENTAL_TRAITS — 값 보존', () => {
  // 중복 제거로 동작이 바뀌지 않았음을 고정한다. 살아 있던 값은 뒤에 선언된
  // 0.85 / 1.0 / 0.8 쪽이다.
  it('chef 특성이 기존 실효값을 유지한다', () => {
    expect(MENTAL_TRAITS.chef).toEqual({
      anxietyResist: 0.85,
      traumaRecovery: 1.0,
      lonelinessBase: 0.8,
      ability: 'comfort_food',
    });
  });
});

describe('MENTAL_TRAITS — 직업 커버리지', () => {
  it('실제 플레이 가능한 직업이 모두 특성을 가진다', () => {
    expect(characterIds.filter(id => !MENTAL_TRAITS[id])).toEqual([]);
  });

  it('모든 특성이 필수 필드를 갖춘다', () => {
    for (const [id, t] of Object.entries(MENTAL_TRAITS)) {
      expect(typeof t.anxietyResist,  `${id}.anxietyResist`).toBe('number');
      expect(typeof t.traumaRecovery, `${id}.traumaRecovery`).toBe('number');
      expect(typeof t.lonelinessBase, `${id}.lonelinessBase`).toBe('number');
      expect(typeof t.ability,        `${id}.ability`).toBe('string');
    }
  });
});
