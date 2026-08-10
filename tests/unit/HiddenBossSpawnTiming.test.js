// @vitest-environment happy-dom
// === 히든 보스 스폰 시점 테스트 ===
// 히든 장소 발견은 districtChanged 하나로 일어난다 — 구 경계를 넘는 순간이다.
// _spawnBoss가 발견 분기 바깥에 있어, 조건을 갖춘 채 이동하기만 하면 준비 없이
// 보스전으로 전환됐다. 탐색 중 보스(checkBossSpawn)가 TP를 쓰고 확률까지 거치는
// 것과 대비된다. 배선된 장소는 세부장소에 들어가는 순간으로 옮긴다.
import { describe, it, expect, beforeEach } from 'vitest';
import { HIDDEN_LOCATIONS } from '../../js/data/hiddenLocations.js';
import { getLandmarkData } from '../../js/data/landmarks.js';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';

/** 전투 전환 요청을 가로채 스폰 여부만 본다 */
function captureSpawn(fn) {
  const seen = [];
  const off = EventBus.on('notify', p => { if (p.type === 'danger') seen.push(p.message); });
  fn();
  off();
  return seen;
}

function freshFlags() {
  GameState.flags.hiddenLocationsDiscovered = [];
  GameState.flags.hiddenBossesSpawned       = [];
  GameState.flags.firstEnterRewardsClaimed  = [];
}

const BOSS_LOCS = Object.values(HIDDEN_LOCATIONS).filter(l => l.bossId);

describe('발견 시점 — 배선된 장소는 보스를 띄우지 않는다', () => {
  beforeEach(freshFlags);

  const wired = BOSS_LOCS.filter(l => l.subLocationId);

  it('보스를 가진 장소가 실재한다 (테스트가 빈 배열을 도는 것을 막는다)', () => {
    expect(wired.length).toBeGreaterThan(0);
  });

  it.each(wired.map(l => [l.id, l]))('%s 발견은 전투를 시작하지 않는다', (_id, loc) => {
    const danger = captureSpawn(() => HiddenElementSystem._discoverHiddenLocation(loc.id, loc));
    expect(danger).toEqual([]);
  });

  it('배선되지 않은 장소는 기존대로 발견 즉시 보스가 나온다', () => {
    const unwired = BOSS_LOCS.find(l => !l.subLocationId);
    if (!unwired) return;                        // 전부 이관되면 이 경로는 사라진다
    const danger = captureSpawn(() => HiddenElementSystem._discoverHiddenLocation(unwired.id, unwired));
    expect(danger.length).toBeGreaterThan(0);
  });
});

describe('진입 시점 — 세부장소가 보스를 넘겨받았다', () => {
  beforeEach(freshFlags);

  it.each(BOSS_LOCS.filter(l => l.subLocationId).map(l => [l.id, l]))(
    '%s 의 세부장소가 같은 보스를 선언한다', (_id, loc) => {
    const lmKey = loc.district;
    const sub = (getLandmarkData(lmKey)?.subLocations ?? [])
      .find(s => s.requiresHiddenLocation === loc.id);
    expect(sub, `${lmKey}에 진입 지점 없음`).toBeDefined();
    expect(sub.bossId).toBe(loc.bossId);
  });

  it('세부장소 보스는 한 번만 나온다', () => {
    const first  = HiddenElementSystem.spawnSubLocationBoss('boss_mutant_alpha_tiger', 'test_key');
    const second = HiddenElementSystem.spawnSubLocationBoss('boss_mutant_alpha_tiger', 'test_key');
    expect(first).toBe(true);
    expect(second).toBe(false);
  });

  it('스폰 기록이 세이브에 남는다', () => {
    HiddenElementSystem.spawnSubLocationBoss('boss_mutant_alpha_tiger', 'save_key');
    expect(JSON.parse(GameState.serialize()).flags.hiddenBossesSpawned).toContain('save_key');
  });

  it('정의되지 않은 보스 id는 무시한다', () => {
    expect(HiddenElementSystem.spawnSubLocationBoss('boss_does_not_exist', 'k')).toBe(false);
    expect(HiddenElementSystem.spawnSubLocationBoss(null, 'k')).toBe(false);
  });
});

describe('전설 아이템 무한 공급 차단', () => {
  it('쿨다운마다 보상을 재지급하는 히든 장소가 없다', () => {
    // _checkRepeatableLocation은 구에 다시 들어오기만 하면 rewards를 통째로
    // 다시 뿌린다. 조건 재검사도 TP 비용도 없다. 북한산 숨겨진 샘이 전설
    // 원시 샘물을 30일마다 무한 공급하고 있었다.
    const repeating = Object.values(HIDDEN_LOCATIONS)
      .filter(l => l.repeatable && (l.rewards ?? []).length > 0);
    expect(repeating.map(l => l.id)).toEqual([]);
  });

  it('원시 샘물은 최초 진입 1회만 지급된다', () => {
    const spring = HIDDEN_LOCATIONS.hidden_gangbuk_mountain_spring;
    expect(spring.repeatable).toBe(false);
    expect(spring.rewards).toEqual([]);
    const sub = getLandmarkData('gangbuk').subLocations
      .find(s => s.requiresHiddenLocation === spring.id);
    expect(sub.firstEnterReward.items.map(i => i.id)).toContain('pristine_spring_water');
    expect(sub.lootTable.map(l => l.id)).not.toContain('pristine_spring_water');
  });
});
