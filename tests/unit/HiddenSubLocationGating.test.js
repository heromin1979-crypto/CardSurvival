import { describe, expect, it } from 'vitest';
import { DISTRICTS } from '../../js/data/districts.js';
import { getVisibleSubLocations } from '../../js/data/landmarks.js';
import { HIDDEN_LOCATIONS } from '../../js/data/hiddenLocations.js';
import CINEMATIC_SCENES from '../../js/data/cinematicScenes.js';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import HiddenElementSystem from '../../js/systems/HiddenElementSystem.js';

describe('세부장소 가시성 필터', () => {
  it('requiresHiddenLocation이 없는 세부장소는 발견 목록과 무관하게 노출된다', () => {
    const visible = getVisibleSubLocations('lm_dongjak', []);
    const ids = visible.map(s => s.id);
    expect(ids).toContain('dongjak_memorial');
    expect(ids).toContain('dongjak_hall');
    expect(ids).toContain('dongjak_storage');
    expect(ids).toContain('dongjak_office');
    expect(ids).toContain('dongjak_forest');
  });

  it('발견 목록 인자를 생략해도 동작한다', () => {
    expect(getVisibleSubLocations('lm_dongjak').length).toBeGreaterThan(0);
  });

  it('존재하지 않는 랜드마크 키는 빈 배열을 반환한다', () => {
    expect(getVisibleSubLocations('lm_does_not_exist', [])).toEqual([]);
    expect(getVisibleSubLocations(null, [])).toEqual([]);
  });

  it('district-keyed 랜드마크는 lm_ 접두사를 붙여도 조회된다', () => {
    expect(getVisibleSubLocations('gangnam', []).length).toBeGreaterThan(0);
    expect(getVisibleSubLocations('lm_gangnam', []).length)
      .toBe(getVisibleSubLocations('gangnam', []).length);
  });

  it('지하 벙커는 발견 전 노출되지 않는다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', []).map(s => s.id);
    expect(ids).not.toContain('dongjak_bunker');
  });

  it('지하 벙커는 벙커를 발견한 뒤 노출된다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', ['hidden_dongjak_cemetery_vault']).map(s => s.id);
    expect(ids).toContain('dongjak_bunker');
  });

  it('무관한 장소를 발견해도 지하 벙커는 잠긴 채다', () => {
    const ids = getVisibleSubLocations('lm_dongjak', ['hidden_jongno_royal_vault']).map(s => s.id);
    expect(ids).not.toContain('dongjak_bunker');
  });
});

describe('숨겨진 장소의 세부장소 · 컷씬 연결', () => {
  it('벙커는 세부장소와 컷씬이 연결되어 있다', () => {
    const loc = HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault;
    expect(loc.subLocationId).toBe('dongjak_bunker');
    expect(loc.cinematicId).toBe('cin_discover_dongjak_bunker');
  });

  it('연결된 컷씬 장면이 실제로 정의되어 있다', () => {
    for (const loc of Object.values(HIDDEN_LOCATIONS)) {
      if (!loc.cinematicId) continue;
      expect(CINEMATIC_SCENES[loc.cinematicId], loc.id).toBeDefined();
    }
  });

  it('연결된 세부장소가 실제로 존재하고 잠겨 있다', () => {
    for (const loc of Object.values(HIDDEN_LOCATIONS)) {
      if (!loc.subLocationId) continue;
      // 한 구가 랜드마크를 여럿 가질 수 있다(예: 영등포 = 타임스퀘어 + 63빌딩).
      // 진입 지점이 대표 랜드마크에 있다고 가정하지 않고 구 전체를 훑는다.
      const dist = DISTRICTS[loc.district];
      const keys = Array.isArray(dist?.landmarks) ? dist.landmarks
                 : (dist?.landmark ? [dist.landmark] : []);
      const sub = [...keys, loc.district, `lm_${loc.district}`]
        .flatMap(k => getVisibleSubLocations(k, [loc.id]))
        .find(s => s.id === loc.subLocationId);
      expect(sub, loc.id).toBeDefined();
      expect(sub.requiresHiddenLocation, loc.id).toBe(loc.id);
    }
  });

  it('발견 메시지가 새 톤으로 교체되어 있다', () => {
    const msg = HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault.discoveryMessage;
    expect(msg).toContain('동작구를 꼼꼼히 뒤진 끝에');
    expect(msg).not.toContain('참배로 아래에서');
  });
});

describe('발견 시 보상 위임', () => {
  function freshFlags() {
    GameState.flags.hiddenLocationsDiscovered = [];
    GameState.flags.legendaryItemsFound = [];
    GameState.flags.hiddenRecipesUnlocked = [];
  }

  it('세부장소가 연결된 장소는 발견 즉시 카드를 놓지 않는다', () => {
    freshFlags();
    const before = GameState.getBoardCards().length;
    HiddenElementSystem._discoverHiddenLocation(
      'hidden_dongjak_cemetery_vault',
      HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault,
    );
    expect(GameState.getBoardCards().length).toBe(before);
  });

  it('세부장소가 연결된 장소도 컷씬을 발행한다', () => {
    freshFlags();
    const seen = [];
    const off = EventBus.on('showCinematic', p => seen.push(p.sceneId));
    HiddenElementSystem._discoverHiddenLocation(
      'hidden_dongjak_cemetery_vault',
      HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault,
    );
    off();
    expect(seen).toContain('cin_discover_dongjak_bunker');
  });

  it('세부장소가 없는 장소는 기존대로 보상을 지급한다', () => {
    // 30곳 모두 이관돼 실제 데이터에는 이 경로를 타는 장소가 없다. 코드는
    // 남아 있으므로 합성 장소로 즉시 지급 분기가 살아 있는지 확인한다.
    freshFlags();
    const synthetic = {
      id: 'test_legacy_location', name: '테스트 즉시지급 장소',
      district: 'junggoo', unlockConditions: {},
      rewards: [{ definitionId: 'bandage', qty: 1 }],
      lootTable: [], bossId: null,
    };
    const before = GameState.getBoardCards().length;
    HiddenElementSystem._discoverHiddenLocation(synthetic.id, synthetic);
    expect(GameState.getBoardCards().length).toBeGreaterThan(before);
  });

  it('위임 경로에서도 히든 레시피 해금 검사가 실행된다', () => {
    freshFlags();
    const prevLevel = GameState.player.skills.building.level;
    GameState.player.skills.building.level = 8;
    HiddenElementSystem._discoverHiddenLocation(
      'hidden_dongjak_cemetery_vault',
      HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault,
    );
    GameState.player.skills.building.level = prevLevel;
    expect(GameState.flags.hiddenRecipesUnlocked).toContain('reinforced_shelter');
  });

  it('위임 경로에서도 발견·보드변경 이벤트가 발행된다', () => {
    freshFlags();
    const seen = [];
    const offA = EventBus.on('hiddenLocationDiscovered', p => seen.push(`discovered:${p.locationId}`));
    const offB = EventBus.on('boardChanged', () => seen.push('boardChanged'));
    HiddenElementSystem._discoverHiddenLocation(
      'hidden_dongjak_cemetery_vault',
      HIDDEN_LOCATIONS.hidden_dongjak_cemetery_vault,
    );
    offA();
    offB();
    expect(seen).toContain('discovered:hidden_dongjak_cemetery_vault');
    expect(seen).toContain('boardChanged');
  });
});
