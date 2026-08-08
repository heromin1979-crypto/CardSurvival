// === TP 경과 알림 i18n 테스트 ===
// regression: TickEngine._postSkip의 알림 3줄이 I18n을 거치지 않고 문자열 리터럴로
// 박혀 있었다. 첫 줄은 영어("N TP skipped"), 나머지 둘은 한국어라 어느 언어를
// 골라도 한쪽이 깨졌다. 남은 행동력 문구도 "곧 날이 저뭅니다"였는데 실제로는
// 새벽 2~5시(이미 야간)에 뜨는 알림이라 시점 설명이 틀려 있었다.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import TickEngine from '../../js/core/TickEngine.js';
import EventBus from '../../js/core/EventBus.js';
import I18n from '../../js/core/I18n.js';
import GameState from '../../js/core/GameState.js';
import { ko, en } from '../../js/data/locales.js';

const KEYS = ['tick.tpSkipped', 'tick.tpSkippedReason', 'tick.remainingWarn', 'tick.remaining'];

function resetWorld() {
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true, equipped: {}, skills: {}, diseases: [],
    hp: { current: 80, max: 100 },
  };
  GameState.flags = {};
  GameState.debug = {};
}

/** _postSkip이 내보내는 notify 메시지를 수집한다 */
function captureNotices(fn) {
  const messages = [];
  const off = EventBus.on('notify', ({ message }) => messages.push(message));
  try { fn(); } finally { off(); }
  return messages;
}

describe('TP 경과 알림 — locale 정의', () => {
  it('신규 키가 ko/en 양쪽에 모두 있다', () => {
    for (const key of KEYS) {
      expect(ko[key], `ko에 ${key} 없음`).toBeDefined();
      expect(en[key], `en에 ${key} 없음`).toBeDefined();
    }
  });

  it('한국어 문구에 영어 잔재가 남아 있지 않다', () => {
    for (const key of KEYS) {
      expect(ko[key]).not.toMatch(/skipped/i);
    }
  });

  it('영어 문구에 한글이 남아 있지 않다', () => {
    for (const key of KEYS) {
      expect(en[key]).not.toMatch(/[가-힣]/);
    }
  });

  it('남은 행동력 문구가 날이 저문다고 말하지 않는다', () => {
    // 이 알림은 새벽 2~5시(이미 야간)에 뜬다. 해가 지는 시점이 아니다.
    expect(ko['tick.remainingWarn']).not.toContain('저뭅니다');
  });
});

describe('TickEngine._postSkip — 알림 내용', () => {
  beforeEach(resetWorld);
  afterEach(() => vi.restoreAllMocks());

  it('사유가 있으면 사유를 포함해 알린다', () => {
    const msgs = captureNotices(() => TickEngine.skipTP(4, '버스 잔해 해체'));
    expect(msgs[0]).toBe(I18n.t('tick.tpSkippedReason', { n: 4, reason: '버스 잔해 해체' }));
    expect(msgs[0]).toContain('버스 잔해 해체');
    expect(msgs[0]).toContain('4');
  });

  it('사유가 없으면 경과만 알린다', () => {
    const msgs = captureNotices(() => TickEngine.skipTP(2));
    expect(msgs[0]).toBe(I18n.t('tick.tpSkipped', { n: 2 }));
  });

  it('남은 TP가 7~12면 정보 알림을 덧붙인다', () => {
    GameState.time.tpInDay = 59;
    const msgs = captureNotices(() => TickEngine.skipTP(1));  // 남은 12TP
    expect(msgs[1]).toBe(I18n.t('tick.remaining', { remain: 12 }));
  });

  it('남은 TP가 6 이하면 하루가 바뀐다고 알린다', () => {
    GameState.time.tpInDay = 65;
    const msgs = captureNotices(() => TickEngine.skipTP(1));  // 남은 6TP
    expect(msgs[1]).toBe(I18n.t('tick.remainingWarn', { remain: 6 }));
  });

  it('남은 TP가 충분하면 추가 알림이 없다', () => {
    const msgs = captureNotices(() => TickEngine.skipTP(1));  // 남은 71TP
    expect(msgs).toHaveLength(1);
  });

  it('자정을 넘겨 남은 TP가 원복되면 추가 알림이 없다', () => {
    GameState.time.tpInDay = 70;
    const msgs = captureNotices(() => TickEngine.skipTP(4));  // 다음 날 tpInDay 2 → 남은 70
    expect(msgs).toHaveLength(1);
  });
});
