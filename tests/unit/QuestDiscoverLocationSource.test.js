// discover_location subObjective 매처의 판정 원천 검증.
// _matchState()가 discoveredLocations를 채우지 않던 시절에는 `?? new Set()` 폴백에 걸려
// 항상 false였다 — 체크리스트에 이 match를 쓰면 에러도 경고도 없이 영원히 미완료로 남는다.
import { describe, it, expect, beforeEach } from 'vitest';
import GameState from '../../js/core/GameState.js';
import QuestSystem from '../../js/systems/QuestSystem.js';

const SO = { id: 'so_hidden', match: { type: 'discover_location', locationId: 'hidden_gangnam_samsung_pharmacy' } };

describe('discover_location 판정 원천', () => {
  beforeEach(() => {
    GameState.flags = { hiddenLocationsDiscovered: [] };
    QuestSystem.resetForNewGame();
  });

  it('_matchState()가 flags.hiddenLocationsDiscovered를 매처 입력으로 넘긴다', () => {
    GameState.flags.hiddenLocationsDiscovered = ['hidden_gangnam_samsung_pharmacy'];
    expect([...QuestSystem._matchState().discoveredLocations])
      .toEqual(['hidden_gangnam_samsung_pharmacy']);
  });

  it('발견한 히든 장소는 완료, 아닌 곳은 미완료', () => {
    expect(QuestSystem._matchSubObjective(SO, QuestSystem._matchState(), {})).toBe(false);

    GameState.flags.hiddenLocationsDiscovered.push('hidden_gangnam_samsung_pharmacy');
    expect(QuestSystem._matchSubObjective(SO, QuestSystem._matchState(), {})).toBe(true);
  });

  it('다른 장소만 발견한 상태로는 완료되지 않는다', () => {
    GameState.flags.hiddenLocationsDiscovered = ['hidden_seodaemun_severance_lab'];
    expect(QuestSystem._matchSubObjective(SO, QuestSystem._matchState(), {})).toBe(false);
  });

  it('flags 자체가 없는 구버전 세이브에서도 터지지 않는다', () => {
    GameState.flags = {};
    expect(QuestSystem._matchSubObjective(SO, QuestSystem._matchState(), {})).toBe(false);
  });

  it('objective 판정(_checkAllProgress)과 같은 배열을 본다', () => {
    GameState.flags.hiddenLocationsDiscovered = ['hidden_gangnam_samsung_pharmacy'];
    const objectiveSees = GameState.flags.hiddenLocationsDiscovered.includes(SO.match.locationId);
    const checklistSees = QuestSystem._matchSubObjective(SO, QuestSystem._matchState(), {});
    expect(checklistSees).toBe(objectiveSees);
  });
});
