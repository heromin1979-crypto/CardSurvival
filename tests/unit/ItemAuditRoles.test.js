// === 아이템 감사 역할 분류 테스트 ===
// audit-items.mjs는 js/data/를 훑어 아이템 ID가 놓인 자리를 '획득'과 '사용'으로 가른다.
// 자리 이름이 ROLES 표에 없으면 미분류로 빠지고, 그 경로로만 쓰이는 아이템이
// "획득 경로 없음" 또는 "사용처 없음"으로 오탐된다.
//
// 두 가지가 새고 있었다.
//  1) toolProvides(도구 역할 대행)가 표에 없어 날붙이 18종이 통째로 미분류였다.
//  2) 덫·통발은 미끼를 아이템 ID가 아니라 태그(baitTags)로 집는다. baitTags는
//     NOT_A_REFERENCE라 스윕이 건너뛰어, 코드가 id를 직접 부르는 지렁이만 통과하고
//     곤충 미끼는 "사용처도 기능도 없습니다"로 잡혔다.
import { describe, it, expect, beforeAll } from 'vitest';
import { auditItems } from '../../tools/audit-items.mjs';

let report;
beforeAll(async () => { report = await auditItems(); }, 60_000);

/** id로 감사 결과 한 줄 찾기 */
const rowFor = (id) => report.items.find(r => r.id === id);
const codesOf = (id) => (rowFor(id)?.findings ?? []).map(f => f.code);

describe('감사 도구 전제', () => {
  it('전체 아이템을 훑는다', () => {
    expect(report.items.length).toBeGreaterThan(500);
  });
});

describe('toolProvides — 도구 역할 대행', () => {
  it('미분류 경로에 남아 있지 않다', () => {
    const stray = [...(report.unclassified ?? [])]
      .map(e => (Array.isArray(e) ? e[0] : e.sig ?? String(e)))
      .filter(sig => String(sig).includes('toolProvides'));
    expect(stray, `미분류: ${stray.join(', ')}`).toEqual([]);
  });
});

describe('태그로 소비되는 미끼', () => {
  // 지렁이는 FishingSystem이 id를 직접 부르지만 곤충 미끼는 else 분기라
  // 코드에 이름이 없다. 태그 경로를 못 보면 곤충 미끼만 오탐된다.
  it.each(['bait_worm', 'bait_insect'])('%s는 사용처 없음으로 잡히지 않는다', (id) => {
    expect(rowFor(id), id).toBeDefined();
    expect(codesOf(id)).not.toContain('no-purpose');
  });

  it('덫이 선언한 미끼 태그를 실제로 가진 카드가 있다', () => {
    // 태그 수집이 빈 집합이면 위 테스트가 무의미하게 통과한다
    const bait = rowFor('bait_insect');
    expect(bait.usage?.some(u => u.role === 'baitTags')).toBe(true);
  });
});

describe('오탐 방지가 진짜 문제를 가리지 않는다', () => {
  // 미끼 태그(food 등)를 가졌다는 이유로 모든 카드가 통과해 버리면 안 된다.
  it('배선 문제 판정이 여전히 남아 있다', () => {
    const wiring = report.items.filter(r => r.findings.some(f => f.status === 'wiring'));
    expect(wiring.length).toBeGreaterThan(0);
  });
});
