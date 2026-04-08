import { describe, it, expect, beforeEach } from 'vitest';

// 각 테스트마다 fresh 모듈 인스턴스를 사용해 내부 _registry를 격리한다.
async function freshRegistry() {
  const mod = await import('../../js/core/SystemRegistry.js?t=' + Date.now());
  return mod.default;
}

describe('SystemRegistry', () => {
  it('register 후 get으로 동일 객체를 반환한다', async () => {
    const reg = await freshRegistry();
    const sys = { name: 'TestSystem' };
    reg.register('TestSystem', sys);
    expect(reg.get('TestSystem')).toBe(sys);
  });

  it('미등록 키는 null을 반환한다', async () => {
    const reg = await freshRegistry();
    expect(reg.get('Missing')).toBeNull();
  });

  it('같은 키에 register하면 최신 값으로 덮어쓴다', async () => {
    const reg = await freshRegistry();
    const first  = { id: 1 };
    const second = { id: 2 };
    reg.register('Sys', first);
    reg.register('Sys', second);
    expect(reg.get('Sys')).toBe(second);
  });

  it('다른 키는 서로 간섭하지 않는다', async () => {
    const reg = await freshRegistry();
    const a = { a: true };
    const b = { b: true };
    reg.register('A', a);
    reg.register('B', b);
    expect(reg.get('A')).toBe(a);
    expect(reg.get('B')).toBe(b);
  });
});
