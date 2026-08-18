// === 3층 드랍 구조 (구 / 랜드마크 / 세부장소) ===
// regression: 랜드마크에는 자체 드랍 표가 없었고, 랜드마크 안에서 '탐색'을 누르면
// exploreCurrentDistrict가 currentLandmark를 보지 않아 구 lootTable이 그대로 굴렀다.
// 같은 자리에서 구 표면 자원을 무한히 채집할 수 있었고, 층 구분이 사실상 없었다.
// 또 구 lootTable이 평균 21종까지 불어나 지역색이 사라졌고, explorationYields는
// 코드·검증기·에디터가 모두 준비돼 있는데 데이터가 0건이라 통째로 사문화돼 있었다.
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { DISTRICTS } from '../../js/data/districts.js';
import { LANDMARK_DATA } from '../../js/data/landmarks.js';
import GameData from '../../js/data/GameData.js';
import GameState from '../../js/core/GameState.js';
import ExploreSystem from '../../js/systems/ExploreSystem.js';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const items = GameData.items;
const isOnceLoot = (id) => {
  const d = items[id];
  return !!d && d.districtOnce !== false && (d.type === 'environment' || !!d.tags?.includes('salvage'));
};

describe('구 — 반복 재료는 소수만 남는다', () => {
  it('반복 드랍 재료는 구마다 5종 이하다', () => {
    for (const [id, d] of Object.entries(DISTRICTS)) {
      const repeatable = (d.lootTable ?? []).filter(e => !isOnceLoot(e.definitionId));
      expect(repeatable.length, `${id} 반복 재료 ${repeatable.length}종`).toBeLessThanOrEqual(5);
      expect(repeatable.length, `${id} 반복 재료 없음`).toBeGreaterThanOrEqual(3);
    }
  });

  it('구별 1회 자원(환경물·잔해)은 종류 상한과 무관하게 유지된다', () => {
    // 개울·자판기·잔해는 바닥에 남는 설치물이라 반복 드랍이 아니다
    const withOnce = Object.values(DISTRICTS)
      .filter(d => (d.lootTable ?? []).some(e => isOnceLoot(e.definitionId)));
    expect(withOnce.length).toBe(Object.keys(DISTRICTS).length);
  });
});

describe('구 — 1회 자원은 지역색을 갖는다', () => {
  const onceOf = (d) => (d.lootTable ?? []).filter(e => isOnceLoot(e.definitionId)).map(e => e.definitionId);

  it('구마다 4~5종이다', () => {
    for (const [id, d] of Object.entries(DISTRICTS)) {
      const n = onceOf(d).length;
      expect(n, `${id} 1회 자원 ${n}종`).toBeGreaterThanOrEqual(4);
      expect(n, `${id} 1회 자원 ${n}종`).toBeLessThanOrEqual(5);
    }
  });

  it('한 항목이 6개 구 이상에 깔리지 않는다', () => {
    // regression: 고장난 라디오·소화기가 25개 구 전부에 있어 어느 구를 털어도 같은 잔해가 나왔다
    const usage = {};
    for (const [id, d] of Object.entries(DISTRICTS)) {
      for (const defId of onceOf(d)) (usage[defId] ??= []).push(id);
    }
    const overused = Object.entries(usage).filter(([, ds]) => ds.length > 5);
    expect(overused.map(([defId, ds]) => `${defId}:${ds.length}`)).toEqual([]);
  });

  it('어느 두 구도 1회 자원 3종 이상을 공유하지 않는다', () => {
    const ids = Object.keys(DISTRICTS);
    const sets = Object.fromEntries(ids.map(id => [id, onceOf(DISTRICTS[id])]));
    const heavy = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const shared = sets[ids[i]].filter(x => sets[ids[j]].includes(x));
        if (shared.length >= 3) heavy.push(`${ids[i]}↔${ids[j]}: ${shared.join(',')}`);
      }
    }
    expect(heavy).toEqual([]);
  });

  it('구마다 조합이 서로 다르다', () => {
    const keys = Object.values(DISTRICTS).map(d => [...onceOf(d)].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('잔해 가치가 위험도를 따라 오른다', () => {
    // regression: 강서구(dl2) 41 > 종로구(dl5) 45에 근접하고, 양천구(dl1) 27이
    // 강남구(dl3) 26보다 높았다. 안전한 구만 돌아도 이득인 구조였다.
    const MAT_TIER = {
      scrap_metal: 1, wood: 1, cloth: 1, cloth_scrap: 1, plastic: 1, nail: 1, glass_shard: 1,
      pebble: 1, rope: 1, brick: 1, soil_bag: 1, dry_grass: 1, dry_leaves: 1, kindling: 1,
      wire: 2, spring: 2, leather: 2, rubber: 2, duct_tape: 2, charcoal: 2,
      electronic_parts: 3, refined_metal: 3, battery: 3,
    };
    const value = (id) => (items[id]?.dismantle ?? [])
      .reduce((sum, e) => sum + e.qty * (e.chance ?? 1) * (MAT_TIER[e.definitionId] ?? 2), 0);

    const byDanger = {};
    for (const d of Object.values(DISTRICTS)) {
      const total = onceOf(d).reduce((sum, id) => sum + value(id), 0);
      (byDanger[d.dangerLevel] ??= []).push(total);
    }
    const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
    const levels = Object.keys(byDanger).map(Number).sort((a, b) => a - b);
    const means = levels.map(dl => avg(byDanger[dl]));
    for (let i = 1; i < means.length; i++) {
      expect(means[i], `dl${levels[i]} 평균 ${means[i].toFixed(1)} ≤ dl${levels[i - 1]} ${means[i - 1].toFixed(1)}`)
        .toBeGreaterThan(means[i - 1]);
    }
  });

  it('저위험 구에는 고급 잔해(가치 8 초과)를 두지 않는다', () => {
    const MAT_TIER = {
      scrap_metal: 1, wood: 1, cloth: 1, cloth_scrap: 1, plastic: 1, nail: 1, glass_shard: 1,
      pebble: 1, rope: 1, brick: 1, soil_bag: 1, dry_grass: 1, dry_leaves: 1, kindling: 1,
      wire: 2, spring: 2, leather: 2, rubber: 2, duct_tape: 2, charcoal: 2,
      electronic_parts: 3, refined_metal: 3, battery: 3,
    };
    const value = (id) => (items[id]?.dismantle ?? [])
      .reduce((sum, e) => sum + e.qty * (e.chance ?? 1) * (MAT_TIER[e.definitionId] ?? 2), 0);
    for (const [id, d] of Object.entries(DISTRICTS)) {
      if (d.dangerLevel > 1) continue;
      const rich = onceOf(d).filter(x => value(x) > 8);
      expect(rich, `${id}(dl1)에 고급 잔해`).toEqual([]);
    }
  });

  it('산·계곡 구는 물 공급원(산개울)을 유지한다', () => {
    // stream_spring을 빼면 그 구의 식수 확보 경로가 통째로 사라진다
    for (const id of ['gangbuk', 'gwanak', 'nowon', 'dobong']) {
      expect(onceOf(DISTRICTS[id]), `${id}`).toContain('stream_spring');
    }
  });
});

describe('구 — 수요 상위 재료의 공급', () => {
  // regression: 청사진 353개의 요구량은 고철 207 · 못 152 · 철사 88 · 로프 67인데,
  // 공급은 못 2개 구 · 로프 3개 구뿐이고 천은 13개 구에 깔려 있었다. 고무는
  // 반복 공급이 아예 0이라 잔해 해체로만 얻을 수 있었다.
  const districtCount = (defId) => Object.values(DISTRICTS)
    .filter(d => (d.lootTable ?? []).some(e => e.definitionId === defId)).length;

  it('수요가 큰 기초 재료는 4개 구 이상에서 나온다', () => {
    for (const id of ['scrap_metal', 'nail', 'wire', 'wood', 'rope']) {
      expect(districtCount(id), `${id} ${districtCount(id)}개 구`).toBeGreaterThanOrEqual(4);
    }
  });

  it('고무는 반복 드랍 경로를 갖는다', () => {
    expect(districtCount('rubber')).toBeGreaterThan(0);
  });

  it('천은 과잉 공급되지 않는다', () => {
    // 수요 69로 고철의 3분의 1인데 한때 13개 구에 깔려 있었다
    expect(districtCount('cloth')).toBeLessThanOrEqual(11);
  });
});

describe('구 — 탐사도 임계 보상(explorationYields)', () => {
  it('25개 구 전부가 30/60/100% 세 단계를 갖는다', () => {
    for (const [id, d] of Object.entries(DISTRICTS)) {
      expect(d.explorationYields?.map(y => y.at), `${id}`).toEqual([30, 60, 100]);
    }
  });

  it('각 임계값은 1종을 3~5개 준다', () => {
    for (const [id, d] of Object.entries(DISTRICTS)) {
      for (const y of d.explorationYields) {
        expect(y.items, `${id} ${y.at}%`).toHaveLength(1);
        const [it] = y.items;
        expect(items[it.definitionId], `${id} ${y.at}% ${it.definitionId}`).toBeTruthy();
        expect(it.minQty).toBe(3);
        expect(it.maxQty).toBe(5);
      }
    }
  });

  it('임계 보상은 흔한 기본 재료가 아니라 희귀 재료다', () => {
    const COMMON = new Set(['cloth', 'scrap_metal', 'wood', 'rope', 'plastic', 'nail', 'wire']);
    for (const [id, d] of Object.entries(DISTRICTS)) {
      for (const y of d.explorationYields) {
        expect(COMMON.has(y.items[0].definitionId), `${id} ${y.at}%`).toBe(false);
      }
    }
  });
});

describe('랜드마크 — 자체 드랍 표', () => {
  const explorable = Object.entries(LANDMARK_DATA).filter(([key]) => key !== 'basecamp');

  it('베이스캠프를 뺀 모든 랜드마크가 3~4종 표를 갖는다', () => {
    for (const [key, lm] of explorable) {
      expect(lm.lootTable?.length, `${key}`).toBeGreaterThanOrEqual(3);
      expect(lm.lootTable?.length, `${key}`).toBeLessThanOrEqual(4);
      expect(lm.lootCount, `${key}`).toEqual([1, 2]);
    }
  });

  it('구 표와 랜드마크 표는 서로 다른 배열이다', () => {
    // 같은 객체를 참조하면 한쪽 수정이 조용히 다른 층까지 바꾼다
    for (const [key, lm] of explorable) {
      const district = DISTRICTS[key];
      if (!district) continue;
      expect(lm.lootTable).not.toBe(district.lootTable);
    }
  });
});

describe('세부장소 — 종류 상한', () => {
  it('모든 세부장소 드랍 표가 4종 이하다', () => {
    for (const [key, lm] of Object.entries(LANDMARK_DATA)) {
      for (const sub of lm.subLocations ?? []) {
        expect((sub.lootTable ?? []).length, `${key}/${sub.id}`).toBeLessThanOrEqual(4);
      }
    }
  });

  it('드랍 표의 아이템 id가 모두 실재한다', () => {
    const ghosts = [];
    for (const [key, lm] of Object.entries(LANDMARK_DATA)) {
      for (const e of lm.lootTable ?? []) if (!items[e.id]) ghosts.push(`${key}:${e.id}`);
      for (const sub of lm.subLocations ?? []) {
        for (const e of sub.lootTable ?? []) if (!items[e.id]) ghosts.push(`${key}/${sub.id}:${e.id}`);
      }
    }
    expect(ghosts).toEqual([]);
  });
});

describe('랜드마크 입구', () => {
  const buildings = Object.entries(LANDMARK_DATA)
    .filter(([key]) => key !== 'basecamp' && !key.startsWith('hangang_'));

  it('건물·시설형 랜드마크 34곳의 첫 세부장소가 입구다', () => {
    expect(buildings).toHaveLength(34);
    for (const [key, lm] of buildings) {
      expect(lm.subLocations?.[0]?.isEntrance, `${key} 첫 세부장소가 입구가 아님`).toBe(true);
    }
  });

  it('입구는 랜드마크당 하나뿐이다', () => {
    for (const [key, lm] of Object.entries(LANDMARK_DATA)) {
      const n = (lm.subLocations ?? []).filter(s => s.isEntrance).length;
      expect(n, `${key}`).toBeLessThanOrEqual(1);
    }
  });

  it('입구 카드는 실제 배경을 갖거나 아이콘 폴백을 명시한다', () => {
    // CardFactory가 경로를 무조건 만들면 배경 없는 입구가 404 + 빈 카드가 된다
    for (const [key, lm] of buildings) {
      const e = lm.subLocations[0];
      const dedicated = existsSync(resolve(`assets/images/sublocations/${e.id}.png`));
      const declared  = typeof e.sceneImage === 'string' && existsSync(resolve(e.sceneImage));
      const iconOnly  = e.noSceneImage === true;
      expect(dedicated || declared || iconOnly, `${key}/${e.id} 배경 없음`).toBe(true);
    }
  });
});

describe('랜드마크 안에서의 탐색', () => {
  beforeEach(() => {
    GameState.location = {
      ...(GameState.location ?? {}),
      currentDistrict: 'dongjak',
      currentLandmark: 'lm_boramae_hospital',
      currentSubLocation: null,
      currentNode: 'dongjak',
      nodesVisited: [],
    };
    GameState.flags = { ...(GameState.flags ?? {}), districtExploration: { dongjak: 0 } };
    vi.spyOn(ExploreSystem, '_placeLoot').mockImplementation(() => {});
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('랜드마크 표에서만 뽑고 구 탐사도는 오르지 않는다', () => {
    const lmIds = new Set(LANDMARK_DATA.lm_boramae_hospital.lootTable.map(e => e.id));
    ExploreSystem._arriveAtDistrict('dongjak');

    const placed = ExploreSystem._placeLoot.mock.calls.flatMap(([loot]) => loot ?? []);
    expect(placed.length).toBeGreaterThan(0);
    for (const entry of placed) {
      expect(lmIds.has(entry.definitionId), `${entry.definitionId}는 랜드마크 표에 없음`).toBe(true);
    }
    expect(GameState.flags.districtExploration.dongjak).toBe(0);
  });

  it('랜드마크 밖에서는 구 표를 쓰고 탐사도가 오른다', () => {
    GameState.location.currentLandmark = null;
    ExploreSystem._arriveAtDistrict('dongjak');
    expect(GameState.flags.districtExploration.dongjak).toBeGreaterThan(0);
  });
});
