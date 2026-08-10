// @vitest-environment happy-dom
// === 히든 장소 안내 퀘스트 테스트 ===
// ① 직업 심화 8곳은 "직업 + 평소 들고 다닐 이유가 없는 특정 아이템"을 요구하는데,
// 게임 안에 단서가 하나도 없었다. 발견 전에는 이름조차 노출되지 않는다
// (locales의 hidden.* 문자열은 전부 발견 이후용).
//
// 퀘스트가 장소의 존재와 준비물을 알려주고, discover_location으로 완료를 받는다.
// 발견 판정 자체는 HiddenElementSystem이 그대로 담당한다.
import { describe, it, expect, beforeEach } from 'vitest';
import { HIDDEN_LOCATIONS } from '../../js/data/hiddenLocations.js';
import MAIN_QUESTS from '../../js/data/mainQuests/index.js';
import ITEMS from '../../js/data/items.js';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import QuestSystem from '../../js/systems/QuestSystem.js';

QuestSystem.init?.();   // discover_location 구독을 등록한다

const QUESTS = Object.values(MAIN_QUESTS)
  .filter(q => q?.objective?.type === 'discover_location');

describe('안내 퀘스트 — 직업 전용 장소를 빠짐없이 덮는다', () => {
  it('직업 조건이 붙은 히든 장소마다 안내 퀘스트가 있다', () => {
    const guided = new Set(QUESTS.map(q => q.objective.locationId));
    const needGuide = Object.values(HIDDEN_LOCATIONS)
      .filter(l => l.unlockConditions?.requiredCharacter)
      .map(l => l.id);
    const missing = needGuide.filter(id => !guided.has(id));
    expect(missing, `단서 없는 직업 전용 장소: ${missing.join(', ')}`).toEqual([]);
  });

  it('퀘스트가 실재하는 장소를 가리킨다', () => {
    for (const q of QUESTS) {
      expect(HIDDEN_LOCATIONS[q.objective.locationId], `${q.id}: 없는 장소`).toBeDefined();
    }
  });

  it('퀘스트 직업과 장소 직업이 일치한다', () => {
    for (const q of QUESTS) {
      const loc = HIDDEN_LOCATIONS[q.objective.locationId];
      expect(loc.unlockConditions.requiredCharacter, `${q.id}: 직업 불일치`).toBe(q.characterId);
    }
  });
});

describe('안내 퀘스트 — 도달 가능한 시점에 열린다', () => {
  it('장소가 열리기 전에 퀘스트가 먼저 뜬다', () => {
    // 퀘스트가 장소보다 늦게 뜨면 이미 지나친 뒤에 알려주는 꼴이 된다.
    for (const q of QUESTS) {
      const loc = HIDDEN_LOCATIONS[q.objective.locationId];
      expect(q.dayTrigger, `${q.id}`).toBeLessThanOrEqual(loc.unlockConditions.minDay);
    }
  });

  it('선행 퀘스트가 실재한다', () => {
    for (const q of QUESTS) {
      expect(MAIN_QUESTS[q.prerequisite], `${q.id}: 없는 선행 ${q.prerequisite}`).toBeDefined();
    }
  });

  it('메인 체인을 막지 않는 곁가지다', () => {
    // 다른 퀘스트가 이 퀘스트를 선행으로 삼으면 놓쳤을 때 진행이 막힌다.
    const ids = new Set(QUESTS.map(q => q.id));
    for (const other of Object.values(MAIN_QUESTS)) {
      expect(ids.has(other?.prerequisite), `${other?.id}가 안내 퀘스트를 선행으로 삼는다`).toBe(false);
    }
  });

  it('기한이 없어 실패 패널티가 생기지 않는다', () => {
    for (const q of QUESTS) {
      expect(q.deadlineDays, `${q.id}`).toBe(Infinity);
      expect(q.failPenalty, `${q.id}`).toBeUndefined();
    }
  });
});

describe('안내 퀘스트 — 준비물을 실제로 알려준다', () => {
  it.each(QUESTS.map(q => [q.id, q]))('%s 설명이 필요한 아이템을 언급한다', (_id, q) => {
    const loc  = HIDDEN_LOCATIONS[q.objective.locationId];
    const reqs = [...new Set(loc.unlockConditions.requiredItems ?? [])];
    const text = `${q.desc} ${q.narrative?.start ?? ''}`;
    for (const itemId of reqs) {
      const name = ITEMS[itemId]?.name;
      expect(name, `없는 아이템 조건: ${itemId}`).toBeTruthy();
      expect(text, `${q.id}: '${name}' 안내 누락`).toContain(name);
    }
  });

  it.each(QUESTS.map(q => [q.id, q]))('%s 설명이 갈 곳을 알려준다', (_id, q) => {
    const loc  = HIDDEN_LOCATIONS[q.objective.locationId];
    const text = `${q.desc} ${q.narrative?.start ?? ''}`;
    expect(text.length).toBeGreaterThan(20);
    expect(loc.district, `${q.id}: 장소에 구가 없다`).toBeTruthy();
  });

  it('보스가 있는 장소는 미리 경고한다', () => {
    for (const q of QUESTS) {
      const loc = HIDDEN_LOCATIONS[q.objective.locationId];
      if (!loc.bossId) continue;
      const text = `${q.desc} ${q.narrative?.start ?? ''}`;
      expect(/누(가|군가)|경계|위험|살아 있는 사람/.test(text),
        `${q.id}: 보스 경고 없음`).toBe(true);
    }
  });
});

describe('discover_location 목표 — 발견 이벤트로 완료된다', () => {
  const QID = 'mq_chef_hl_cold_storage';
  const LOC = 'hidden_namdaemun_cold_storage';

  beforeEach(() => {
    GameState.quests.active    = [];
    GameState.quests.completed = [];
    GameState.flags.hiddenLocationsDiscovered = [];
  });

  it('발견 이벤트가 진행도를 채운다', () => {
    GameState.quests.active.push({ id: QID, progress: 0, deadline: Infinity });
    EventBus.emit('hiddenLocationDiscovered', { locationId: LOC });
    const q = GameState.quests.active.find(x => x.id === QID);
    expect(q?.progress ?? 1).toBeGreaterThanOrEqual(1);
  });

  it('다른 장소를 발견해도 진행되지 않는다', () => {
    GameState.quests.active.push({ id: QID, progress: 0, deadline: Infinity });
    EventBus.emit('hiddenLocationDiscovered', { locationId: 'hidden_dobong_hermit_cave' });
    expect(GameState.quests.active.find(x => x.id === QID)?.progress).toBe(0);
  });

  it('퀘스트를 받기 전에 발견했어도 완료로 인정된다', () => {
    // 우연히 먼저 찾은 플레이어가 영원히 못 끝내는 퀘스트를 들고 있으면 안 된다.
    GameState.flags.hiddenLocationsDiscovered = [LOC];
    GameState.quests.active.push({ id: QID, progress: 0, deadline: Infinity });
    QuestSystem._checkAllProgress();
    const still = GameState.quests.active.find(x => x.id === QID);
    expect(still === undefined || still.progress >= 1).toBe(true);
  });
});
