// === 새 게임 상태 리셋 회귀 테스트 ===
// regression: 사망 후 새로고침 없이 새 게임을 시작하면 이전 게임 상태가 남았다.
// CharCreate가 필드를 하나씩 손으로 리셋하는 구조라 quests·basecamp·locationFloors 등
// 11개 필드가 누락됐고, 모듈 싱글톤인 시스템 내부 상태는 아예 손대지 않았다.
// EndingSystem._lastCheckDay(day > 비교)와 SeasonSystem._lastEventDay(day <= 비교)는
// 이전 게임 일자가 남아 새 게임에서 엔딩·계절 이벤트가 수백 일간 차단됐다.
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import GameState, { NEW_GAME_RESET_KEYS } from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';

describe('GameState.resetForNewGame — 필드 복원', () => {
  it('퀘스트 진행도를 비운다 (제보된 현상)', () => {
    GameState.quests.active = [{ id: 'mq_doctor_1', progress: 3, startDay: 5 }];
    GameState.quests.completed = ['mq_doctor_0'];
    GameState.resetForNewGame();
    expect(GameState.quests.active).toEqual([]);
    expect(GameState.quests.completed).toEqual([]);
  });

  it('퀘스트 부가 상태(subObjectiveProgress·questProgress)를 비운다', () => {
    GameState.subObjectiveProgress = { mq_doctor_1: { so_1: true } };
    GameState.questProgress = { collected: { herb: 5 } };
    GameState.resetForNewGame();
    expect(GameState.subObjectiveProgress).toEqual({});
    expect(GameState.questProgress).toBeNull();
  });

  it('거점 건설 상태를 비운다 — 새 게임에서 이미 지어진 거점이 남지 않는다', () => {
    GameState.basecamp.built = true;
    GameState.basecamp.buildStage = 3;
    GameState.basecamp.level = 4;
    GameState.resetForNewGame();
    expect(GameState.basecamp.built).toBe(false);
    expect(GameState.basecamp.buildStage).toBe(0);
    expect(GameState.basecamp.level).toBe(0);
  });

  it('구별 바닥 아이템을 비운다 — 이동 시 이전 게임 아이템이 되살아나지 않는다', () => {
    GameState.locationFloors = { dobong: ['c1', 'c2'] };
    GameState.resetForNewGame();
    expect(GameState.locationFloors).toEqual({});
  });

  it('방문 이력·세부장소 재고를 비운다', () => {
    GameState.landmarkHistory = { lm_dobong: 4 };
    GameState.subwayStationVisits = { st_dobong: 2 };
    GameState.subLocationStock = { dobong_valley: { stock: 0, baseStock: 4 } };
    GameState.resetForNewGame();
    expect(GameState.landmarkHistory).toEqual({});
    expect(GameState.subwayStationVisits).toEqual({});
    expect(GameState.subLocationStock).toEqual({});
  });

  it('전투 상태와 런타임 보정을 비운다', () => {
    GameState.combat.active = true;
    GameState.combat.outcome = 'defeat';
    GameState.combat.log = ['a', 'b'];
    GameState.combatRespawn.active = true;
    GameState.landmarkOverrides = { lm_dobong: { dobong_valley: { dangerModDelta: 0.5 } } };
    GameState.resetForNewGame();
    expect(GameState.combat.active).toBe(false);
    expect(GameState.combat.outcome).toBeNull();
    expect(GameState.combat.log).toEqual([]);
    expect(GameState.combatRespawn.active).toBe(false);
    expect(GameState.landmarkOverrides).toEqual({});
  });

  it('두 번 연속 호출해도 초기값을 유지한다 (스냅샷이 오염되지 않는다)', () => {
    GameState.quests.active = [{ id: 'x' }];
    GameState.resetForNewGame();
    GameState.quests.active.push({ id: 'y' });
    GameState.resetForNewGame();
    expect(GameState.quests.active).toEqual([]);
  });

  it('newGameStarted 이벤트를 발행한다 — 시스템 리셋 신호', () => {
    let fired = 0;
    const off = EventBus.on('newGameStarted', () => { fired++; });
    GameState.resetForNewGame();
    if (typeof off === 'function') off();
    expect(fired).toBe(1);
  });
});

describe('리셋 대상 목록 완전성 가드', () => {
  // 이 테스트가 앞으로의 누락을 막는다. GameState에 상태 필드를 추가하면
  // CharCreate가 직접 다루거나 NEW_GAME_RESET_KEYS에 들어가야 하며, 둘 다 아니면 실패한다.
  const gsSrc = fs.readFileSync('js/core/GameState.js', 'utf8');
  const ccSrc = fs.readFileSync('js/screens/CharCreate.js', 'utf8');

  // 새 게임과 무관한 필드만 예외로 둔다. 늘릴 때는 이유를 함께 적는다.
  const INTENTIONALLY_EXEMPT = new Set([
    'debug',   // 개발용 토글 — 새 게임마다 되돌리면 오히려 방해된다
  ]);

  const topLevelStateKeys = (() => {
    const start = gsSrc.indexOf('const GameState = {');
    const keys = [...gsSrc.slice(start).matchAll(/^  ([a-zA-Z_][\w]*):/gm)].map(m => m[1]);
    return [...new Set(keys)];
  })();

  const charCreateTouched = new Set(
    [...ccSrc.matchAll(/gs\.([a-zA-Z_][\w]*)/g)].map(m => m[1])
  );

  it('GameState 최상위 상태 필드를 하나도 빠뜨리지 않는다', () => {
    const uncovered = topLevelStateKeys.filter(k =>
      !NEW_GAME_RESET_KEYS.includes(k) &&
      !charCreateTouched.has(k) &&
      !INTENTIONALLY_EXEMPT.has(k)
    );
    expect(uncovered).toEqual([]);
  });

  it('리셋 키가 실제 GameState 필드만 가리킨다 (오타·삭제된 필드 방지)', () => {
    for (const key of NEW_GAME_RESET_KEYS) {
      expect(topLevelStateKeys).toContain(key);
    }
  });

  it('CharCreate가 이미 다루는 필드를 중복으로 리셋하지 않는다', () => {
    // flags는 CharCreate가 createDefaultFlags()로 처리하고 캐릭터별 플래그를 덮어쓴다.
    expect(NEW_GAME_RESET_KEYS).not.toContain('flags');
  });
});
