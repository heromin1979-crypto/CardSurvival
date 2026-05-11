// === globalShim ===
// 시뮬 환경에서 게임 시스템이 의존하는 브라우저 글로벌(window·document·localStorage 등)을 stub.
// 시뮬 시작 시 1회 호출 권장.

let installed = false;

export function installGlobalShim() {
  if (installed) return;

  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }

  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {
      getElementById: () => null,
      querySelector:  () => null,
      querySelectorAll: () => [],
      createElement:  () => ({
        style: {},
        classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
        appendChild: () => {},
        addEventListener: () => {},
      }),
      body: { appendChild: () => {} },
      head: { appendChild: () => {} },
      addEventListener: () => {},
    };
  }

  if (typeof globalThis.localStorage === 'undefined') {
    const _store = {};
    globalThis.localStorage = {
      getItem(k)        { return _store[k] ?? null; },
      setItem(k, v)     { _store[k] = String(v); },
      removeItem(k)     { delete _store[k]; },
      clear()           { for (const k of Object.keys(_store)) delete _store[k]; },
      get length()      { return Object.keys(_store).length; },
      key(i)            { return Object.keys(_store)[i] ?? null; },
    };
  }

  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 0);
    globalThis.cancelAnimationFrame  = (id) => clearTimeout(id);
  }

  if (typeof globalThis.HTMLElement === 'undefined') {
    globalThis.HTMLElement = class {};
  }

  installed = true;
}

export function isGlobalShimInstalled() {
  return installed;
}
