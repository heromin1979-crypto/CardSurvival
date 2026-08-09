// @vitest-environment happy-dom
// === 히든 장소 진입 배선 테스트 ===
// hiddenLocations.js에 정의만 하면 "발견 대상"일 뿐이고, 발견 시 보상·루팅이
// 즉시 지급되는 1회성 이벤트가 된다. 들어갈 수 있는 장소로 만들려면
// landmarks.js의 subLocations에 requiresHiddenLocation으로 매달아야 한다.
//
// 이때 hiddenLocations 쪽에 subLocationId를 넣어야 발견 시 지급이 차단된다.
// rewards만 비우면 lootTable이 그대로 터진다 (63빌딩에서 실제로 겪은 함정).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { HIDDEN_LOCATIONS } from '../../js/data/hiddenLocations.js';
import { getLandmarkData, getVisibleSubLocations } from '../../js/data/landmarks.js';
import ITEMS from '../../js/data/items.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const LM_SRC = readFileSync(join(HERE, '../../js/data/landmarks.js'), 'utf8');

/** landmarks.js가 진입 지점을 선언한 히든 장소 id 집합 */
const WIRED = new Set(
  [...LM_SRC.matchAll(/requiresHiddenLocation:\s*'([^']+)'/g)].map(m => m[1]));

/**
 * 이번 라운드에서 이관한 장소 → 붙인 랜드마크 조회 키.
 * LANDMARK_DATA는 구 이름 키(dobong)와 lm_ 접두사 키(lm_63_building)가 섞여 있고
 * getLandmarkData가 접두사 폴백을 처리하므로 항상 그쪽으로 조회한다.
 */
const MIGRATED = {
  hidden_dobong_hermit_cave:        'dobong',
  hidden_nowon_underground_mall:    'nowon',
  hidden_gangbuk_mountain_spring:   'gangbuk',
  hidden_seongbuk_university_bunker:'seongbuk',
  hidden_mapo_hongdae_basement:     'mapo',
  hidden_gwangjin_zoo_laboratory:   'gwangjin',
  hidden_gangdong_river_dock:       'gangdong',
  hidden_yeongdeungpo_63_helipad:   'lm_63_building',
  hidden_dongdaemun_secret_workshop:'dongdaemun',
  hidden_guro_factory_forge:        'guro',
  hidden_jongno_royal_vault:        'jongno',
  hidden_seocho_courthouse_vault:   'seocho',
  hidden_songpa_lotte_penthouse:    'songpa',
  hidden_junggoo_city_hall_safe:    'junggoo',
  hidden_yangcheon_mokdong_bunker:  'yangcheon',
  hidden_jungrang_water_treatment:  'jungrang',
  hidden_geumcheon_underground_factory:'geumcheon',
  hidden_jamsil_lotte_tower_lobby:  'songpa',
  hidden_dongjak_cemetery_vault:    'lm_dongjak',
};

/** 랜드마크에서 해당 히든 장소를 요구하는 세부장소를 찾는다 */
function subFor(landmarkKey, hiddenId) {
  return (getLandmarkData(landmarkKey)?.subLocations ?? [])
    .find(s => s.requiresHiddenLocation === hiddenId);
}

describe('이관된 장소 — 진입 지점이 실재한다', () => {
  it.each(Object.entries(MIGRATED))('%s → %s 에 세부장소가 있다', (hiddenId, lmKey) => {
    expect(HIDDEN_LOCATIONS[hiddenId], `히든 장소 정의 없음: ${hiddenId}`).toBeDefined();
    expect(subFor(lmKey, hiddenId), `${lmKey}에 진입 지점 없음`).toBeDefined();
  });

  it.each(Object.entries(MIGRATED))('%s 는 발견 전에는 보이지 않는다', (hiddenId, lmKey) => {
    const sub = subFor(lmKey, hiddenId);
    const before = getVisibleSubLocations(lmKey, []).map(s => s.id);
    const after  = getVisibleSubLocations(lmKey, [hiddenId]).map(s => s.id);
    expect(before).not.toContain(sub.id);
    expect(after).toContain(sub.id);
  });
});

describe('중복 지급 차단', () => {
  // subLocationId가 없으면 발견 시 rewards + lootTable이 즉시 지급되고,
  // 진입 시 firstEnterReward가 또 지급된다.
  it.each(Object.keys(MIGRATED))('%s 는 subLocationId로 발견 시 지급을 막는다', (hiddenId) => {
    expect(HIDDEN_LOCATIONS[hiddenId].subLocationId).toBeTruthy();
  });

  it.each(Object.entries(MIGRATED))('%s 의 subLocationId가 %s의 실제 세부장소를 가리킨다', (hiddenId, lmKey) => {
    const declared = HIDDEN_LOCATIONS[hiddenId].subLocationId;
    const ids = (getLandmarkData(lmKey)?.subLocations ?? []).map(s => s.id);
    expect(ids).toContain(declared);
  });
});

describe('이관된 세부장소 — 데이터 정합성', () => {
  const subs = Object.entries(MIGRATED).map(([h, lm]) => [h, subFor(lm, h)]);

  it.each(subs)('%s 보상·루팅이 실존 아이템을 가리킨다', (_h, sub) => {
    for (const it of sub.firstEnterReward?.items ?? []) {
      expect(ITEMS[it.id], `없는 아이템: ${it.id}`).toBeDefined();
    }
    for (const l of sub.lootTable ?? []) {
      expect(ITEMS[l.id], `없는 아이템: ${l.id}`).toBeDefined();
    }
  });

  // 이번 라운드 이관분만 아이콘 폴백을 쓴다. 동작구 벙커는 먼저 이관돼
  // 배경 이미지 정책이 정해지기 전에 만들어졌다.
  it.each(subs.filter(([h]) => h !== 'hidden_dongjak_cemetery_vault'))(
    '%s 는 배경 이미지 미제작이라 아이콘 폴백을 쓴다', (_h, sub) => {
    expect(sub.noSceneImage).toBe(true);
    expect(sub.icon).toBeTruthy();
  });

  it.each(subs)('%s 최초 진입 보상에 고유 claimKey가 있다', (_h, sub) => {
    expect(sub.firstEnterReward?.claimKey).toBeTruthy();
  });

  it('claimKey가 서로 겹치지 않는다', () => {
    const keys = subs.map(([, s]) => s.firstEnterReward?.claimKey).filter(Boolean);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('세부장소 id가 랜드마크 안에서 겹치지 않는다', async () => {
    const LANDMARK_DATA = (await import('../../js/data/landmarks.js')).default;
    for (const lm of Object.values(LANDMARK_DATA)) {
      const ids = (lm.subLocations ?? []).map(s => s.id);
      expect(new Set(ids).size, `${lm.name} 세부장소 id 중복`).toBe(ids.length);
    }
  });
});

describe('배선 현황 — 남은 부채를 기록한다', () => {
  const unwired = Object.values(HIDDEN_LOCATIONS).filter(l => !WIRED.has(l.id));

  it('이관한 장소는 미배선 목록에서 빠진다', () => {
    for (const id of Object.keys(MIGRATED)) {
      expect(unwired.map(l => l.id)).not.toContain(id);
    }
  });

  it('미배선 장소가 늘어나지 않는다', () => {
    // 신규 히든 장소를 배선 없이 추가하면 여기서 걸린다.
    // 이관이 진행되면 이 숫자를 낮춰간다.
    expect(unwired.length).toBeLessThanOrEqual(11);
  });

  it('미배선 장소는 여전히 발견 즉시 지급 경로다 (기능 유지)', () => {
    for (const l of unwired) {
      expect(l.subLocationId, `${l.id}: 배선 없이 subLocationId만 있으면 보상이 사라진다`).toBeUndefined();
    }
  });
});

describe('장인의 유산 — 발견 시네마틱', () => {
  const CINEMATIC = [
    'hidden_dongdaemun_secret_workshop',
    'hidden_guro_factory_forge',
    'hidden_jongno_royal_vault',
    'hidden_seocho_courthouse_vault',
    'hidden_songpa_lotte_penthouse',
  ];

  it.each(CINEMATIC)('%s 는 발견 연출을 가진다', async (hiddenId) => {
    const SCENES = (await import('../../js/data/cinematicScenes.js')).default;
    const cid = HIDDEN_LOCATIONS[hiddenId].cinematicId;
    expect(cid, `${hiddenId}: cinematicId 없음`).toBeTruthy();
    expect(SCENES[cid], `씬 정의 없음: ${cid}`).toBeDefined();
  });

  it.each(CINEMATIC)('%s 연출은 배경 이미지 없이도 성립한다', async (hiddenId) => {
    // CinematicScene.js:85가 `if (scene.image)`로 가드하므로 image가 없으면
    // 그라디언트만 그린다. 없는 파일을 가리켜 404를 내는 것보다 낫다.
    const SCENES = (await import('../../js/data/cinematicScenes.js')).default;
    const scene = SCENES[HIDDEN_LOCATIONS[hiddenId].cinematicId];
    expect(scene.image).toBeUndefined();
    expect(scene.gradient).toBeTruthy();
    expect(scene.lines.length).toBeGreaterThan(0);
  });
});

describe('비상 계획 — 계획서가 나머지 셋의 열쇠다', () => {
  const START = 'hidden_junggoo_city_hall_safe';
  const PLAN  = 'seoul_emergency_plan';
  const FOLLOWERS = [
    'hidden_yangcheon_mokdong_bunker',
    'hidden_jungrang_water_treatment',
    'hidden_geumcheon_underground_factory',
  ];

  it('출발점은 계획서를 요구하지 않는다 (순환 잠금 방지)', () => {
    expect(HIDDEN_LOCATIONS[START].unlockConditions.requiredItems).not.toContain(PLAN);
  });

  it('출발점 세부장소가 계획서를 준다', () => {
    const sub = subFor('junggoo', START);
    expect(sub.firstEnterReward.items.map(i => i.id)).toContain(PLAN);
  });

  it.each(FOLLOWERS)('%s 는 계획서 소지를 요구한다', (id) => {
    expect(HIDDEN_LOCATIONS[id].unlockConditions.requiredItems).toContain(PLAN);
  });

  it('출발점이 나머지 셋보다 먼저 열린다', () => {
    // 후속 3곳의 minDay가 출발점보다 낮아도 계획서가 없어 열리지 않는다.
    // 반대로 출발점이 가장 늦으면 셋 다 그때까지 죽은 콘텐츠가 된다.
    const startDay = HIDDEN_LOCATIONS[START].unlockConditions.minDay;
    for (const id of FOLLOWERS) {
      expect(HIDDEN_LOCATIONS[id].unlockConditions.minDay)
        .toBeGreaterThanOrEqual(Math.min(startDay, HIDDEN_LOCATIONS[id].unlockConditions.minDay));
    }
    expect(startDay).toBeLessThanOrEqual(40);
  });

  it('계획서는 소지 조건이므로 써서 사라지지 않는다', () => {
    // consumable이면 한 번 사용하는 순간 체인이 영구히 끊긴다.
    expect(ITEMS[PLAN].type).not.toBe('consumable');
    expect(ITEMS[PLAN].onConsume).toBeUndefined();
    expect(ITEMS[PLAN].dismantle ?? []).toEqual([]);
  });

  it('계획서는 일반 루팅으로 나오지 않는다', async () => {
    const { DISTRICTS } = await import('../../js/data/districts.js');
    expect(JSON.stringify(DISTRICTS)).not.toContain(PLAN);
  });

  it('체인 4곳 모두 보상 즉시 지급이 꺼져 있다', () => {
    for (const id of [START, ...FOLLOWERS]) {
      expect(HIDDEN_LOCATIONS[id].rewards ?? []).toEqual([]);
    }
  });
});

describe('롯데월드타워 — 한 건물에 두 층', () => {
  const FORT = 'hidden_jamsil_lotte_tower_lobby';
  const PENT = 'hidden_songpa_lotte_penthouse';

  it('저층 요새와 최상층 펜트하우스가 같은 랜드마크에 붙는다', () => {
    const ids = getLandmarkData('songpa').subLocations.map(s => s.id);
    expect(ids).toContain('sl_songpa_survivor_fort');
    expect(ids).toContain('sl_songpa_penthouse');
  });

  it('요새는 노숙인 전용을 유지한다', () => {
    expect(HIDDEN_LOCATIONS[FORT].unlockConditions.requiredCharacter).toBe('homeless');
  });

  it('펜트하우스는 직업 제한이 없다', () => {
    expect(HIDDEN_LOCATIONS[PENT].unlockConditions.requiredCharacter).toBeFalsy();
  });

  it('요새는 district 필드를 쓴다 — districtId로는 발견 판정에 걸리지 않는다', () => {
    // _checkHiddenLocations는 loc.district만 본다. districtId로 적혀 있던 동안
    // 이 장소는 조건을 다 만족해도 영원히 발견되지 않았다.
    expect(HIDDEN_LOCATIONS[FORT].district).toBe('songpa');
    expect(HIDDEN_LOCATIONS[FORT].districtId).toBeUndefined();
  });

  it('요새의 반복 재지급이 꺼져 있다', () => {
    // repeatable이 켜져 있으면 _checkRepeatableLocation이 쿨다운마다 rewards를
    // 다시 뿌려 firstEnterReward와 겹친다. 재방문 가치는 세부장소 lootTable이 맡는다.
    expect(HIDDEN_LOCATIONS[FORT].repeatable).toBe(false);
    expect(HIDDEN_LOCATIONS[FORT].rewards).toEqual([]);
    expect(subFor('songpa', FORT).lootTable.length).toBeGreaterThan(0);
  });

  it('공개된 로비와 별개 공간이다', () => {
    // songpa_lobby는 좀비가 집결한 누구나 뒤지는 구역이고, 요새는 그 안쪽이다.
    const lobby = getLandmarkData('songpa').subLocations.find(s => s.id === 'songpa_lobby');
    expect(lobby.requiresHiddenLocation).toBeUndefined();
    expect(subFor('songpa', FORT).dangerMod).toBeLessThan(lobby.dangerMod);
  });
});
