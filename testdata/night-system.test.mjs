#!/usr/bin/env node
// === NightSystem 단위 테스트 ===
// 사용법: node testdata/night-system.test.mjs

// ── 의존성 목업 ─────────────────────────────────────────────
const mockState = { time: { hour: 12 }, board: { top: [], middle: [], bottom: [], environment: [] } };
const mockItems = {
  flashlight: { tags: ['tool', 'light'] },
  bandage:    { tags: ['medical'] },
};

// NightSystem이 import하는 모듈들을 전역으로 주입
globalThis.GameState = {
  get time() { return mockState.time; },
  getBoardCards() {
    return [
      ...mockState.board.top,
      ...mockState.board.middle,
      ...mockState.board.bottom,
    ].filter(Boolean);
  },
};
globalThis.window = { __GAME_DATA__: { items: mockItems } };

// BALANCE 인라인 (gameBalance.js 임포트 우회)
const BALANCE = {
  night: {
    startHour: 20, endHour: 6,
    encounterMult: 2.0, travelCostMult: 1.5,
    darkSleepFatigueMult: 0.5, darkSleepAnxietyGain: 5,
    darkNightmareBonus: 0.10, litSleepAnxietyDrop: 3,
    lightDrainPerTP: 0.5,
  },
};
globalThis.I18n = { t: (key, vars) => vars ? `[${key}:${JSON.stringify(vars)}]` : `[${key}]` };
globalThis.EventBus = { on() {}, emit() {} };

// ── NightSystem 로직 인라인 추출 (순수 함수만) ────────────────
const NightSystem = {
  isNight() {
    const hour = GameState.time?.hour ?? 12;
    const { startHour, endHour } = BALANCE.night;
    return hour >= startHour || hour < endHour;
  },
  hasLightSource() {
    const items = window.__GAME_DATA__?.items ?? {};
    return GameState.getBoardCards().some(c => {
      const def = items[c.definitionId];
      return def?.tags?.includes('light');
    });
  },
  canActAtNight(action) {
    if (!this.isNight()) return { allowed: true };
    if (this.hasLightSource()) return { allowed: true };
    return { allowed: false, reason: `[night.noLight${action}]` };
  },
  getSleepQuality() {
    if (!this.isNight()) {
      return { quality: 'day', fatigueMult: 1.0, anxietyDelta: 0, nightmareBonus: 0 };
    }
    if (this.hasLightSource()) {
      return { quality: 'lit', fatigueMult: 1.0, anxietyDelta: -BALANCE.night.litSleepAnxietyDrop, nightmareBonus: 0 };
    }
    return {
      quality: 'dark',
      fatigueMult: BALANCE.night.darkSleepFatigueMult,
      anxietyDelta: BALANCE.night.darkSleepAnxietyGain,
      nightmareBonus: BALANCE.night.darkNightmareBonus,
    };
  },
};

// ── 테스트 러너 ─────────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'assertion failed');
}

// ── isNight() ────────────────────────────────────────────────
console.log('\n[isNight]');
test('20:00 → 야간', () => { mockState.time.hour = 20; assert(NightSystem.isNight()); });
test('23:59 → 야간', () => { mockState.time.hour = 23; assert(NightSystem.isNight()); });
test('0:00 → 야간 (자정 경계)', () => { mockState.time.hour = 0; assert(NightSystem.isNight()); });
test('5:59 → 야간', () => { mockState.time.hour = 5; assert(NightSystem.isNight()); });
test('6:00 → 낮 (경계)',  () => { mockState.time.hour = 6;  assert(!NightSystem.isNight()); });
test('12:00 → 낮',       () => { mockState.time.hour = 12; assert(!NightSystem.isNight()); });
test('19:59 → 낮 (경계)',() => { mockState.time.hour = 19; assert(!NightSystem.isNight()); });

// ── hasLightSource() ─────────────────────────────────────────
console.log('\n[hasLightSource]');
test('보드 비어있음 → false', () => {
  mockState.board.top = [];
  assert(!NightSystem.hasLightSource());
});
test('flashlight 있음 → true', () => {
  mockState.board.top = [{ instanceId: 'i1', definitionId: 'flashlight' }];
  assert(NightSystem.hasLightSource());
  mockState.board.top = [];
});
test('bandage만 있음 → false', () => {
  mockState.board.middle = [{ instanceId: 'i2', definitionId: 'bandage' }];
  assert(!NightSystem.hasLightSource());
  mockState.board.middle = [];
});
test('window.__GAME_DATA__ 없음 → false (방어)', () => {
  const orig = window.__GAME_DATA__;
  window.__GAME_DATA__ = undefined;
  assert(!NightSystem.hasLightSource());
  window.__GAME_DATA__ = orig;
});

// ── canActAtNight() ──────────────────────────────────────────
console.log('\n[canActAtNight]');
test('낮 → allowed:true', () => {
  mockState.time.hour = 12;
  assert(NightSystem.canActAtNight('travel').allowed);
});
test('야간+광원 있음 → allowed:true', () => {
  mockState.time.hour = 22;
  mockState.board.top = [{ instanceId: 'i1', definitionId: 'flashlight' }];
  assert(NightSystem.canActAtNight('explore').allowed);
  mockState.board.top = [];
});
test('야간+광원 없음 → allowed:false + reason 존재', () => {
  mockState.time.hour = 22;
  const result = NightSystem.canActAtNight('craft');
  assert(!result.allowed);
  assert(typeof result.reason === 'string' && result.reason.length > 0);
});

// ── getSleepQuality() ────────────────────────────────────────
console.log('\n[getSleepQuality]');
test('낮 → quality:day, fatigueMult:1.0', () => {
  mockState.time.hour = 12;
  const q = NightSystem.getSleepQuality();
  assert(q.quality === 'day');
  assert(q.fatigueMult === 1.0);
  assert(q.anxietyDelta === 0);
});
test('야간+광원 → quality:lit, anxietyDelta:-3', () => {
  mockState.time.hour = 22;
  mockState.board.top = [{ instanceId: 'i1', definitionId: 'flashlight' }];
  const q = NightSystem.getSleepQuality();
  assert(q.quality === 'lit');
  assert(q.anxietyDelta === -3, `anxietyDelta=${q.anxietyDelta}`);
  mockState.board.top = [];
});
test('야간+무광원 → quality:dark, fatigueMult:0.5, anxietyDelta:+5', () => {
  mockState.time.hour = 22;
  const q = NightSystem.getSleepQuality();
  assert(q.quality === 'dark');
  assert(q.fatigueMult === 0.5);
  assert(q.anxietyDelta === 5);
  assert(q.nightmareBonus === 0.10);
});

// ── 결과 ────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`결과: ${passed}/${passed + failed} 통과`);
if (failed > 0) process.exit(1);
