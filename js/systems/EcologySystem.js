// === ECOLOGY SYSTEM ===
// 구역별 동적 생태계: 좀비 밀도, 자원 레벨, 오염도가 플레이어 행동에 반응.
// 매 TP 업데이트, 매일(72 TP) 좀비 이동 시뮬레이션.

import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import { DISTRICTS } from '../data/districts.js';

// ── 생태계 상수 ──────────────────────────────────────────────
const ECO = {
  // 좀비 밀도
  zombieKillReduction:   2,      // 처치 1회당 감소
  zombieBossKillReduct: 20,      // 보스 처치 시 감소
  zombieNoisePullRate:   0.05,   // 소음 유인 계수 (소음 × 계수 = 인접 구에서 끌어옴)
  zombieNaturalGrowth:   0.01,   // TP당 자연 증가
  zombieMigrationRate:   0.02,   // 일 1회 밀도차 확산 계수
  zombieNoiseThreshold: 40,      // 이 이상의 소음에서 유인 시작

  // 자원
  resourceExploreConsume: 5,     // 탐색 1회당 소모
  resourceRegenPerTP:    0.05,   // TP당 자연 재생
  resourceSeasonMult: {
    spring: 1.0,
    summer: 0.8,
    autumn: 1.5,
    winter: 0.5,
  },

  // 오염
  contamNaturalDecay:    0.01,   // TP당 자연 감소
  contamAcidRainAdd:     5,      // 산성비 이벤트 시 전 구역 추가
  contamRadiationRate:   0.02,   // 방사능 구역 TP당 오염 증가 계수

  // 좀비 밀도 → encounterChance 배율
  zombieDensityMult: [
    { max: 20,  mult: 0.5  },   // 안전
    { max: 40,  mult: 0.8  },   // 낮음
    { max: 60,  mult: 1.0  },   // 보통
    { max: 80,  mult: 1.3  },   // 높음
    { max: 101, mult: 1.8  },   // 위험
  ],

  // 자원 레벨 → loot 배율
  resourceLootMult: [
    { max: 20,  mult: 0.2  },   // 거의 고갈
    { max: 40,  mult: 0.4  },   // 고갈 경고
    { max: 60,  mult: 0.6  },
    { max: 80,  mult: 0.8  },
    { max: 101, mult: 1.0  },   // 풍족
  ],
};

// ── EcologySystem ────────────────────────────────────────────

const EcologySystem = {
  _lastMigrationDay: 0,

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
    // 전투 처치 시 좀비 밀도 감소
    EventBus.on('enemyKilled', ({ districtId }) => {
      this._modZombie(districtId, -ECO.zombieKillReduction);
    });
    // 보스 처치
    EventBus.on('bossKilled', ({ districtId }) => {
      this._modZombie(districtId, -ECO.zombieBossKillReduct);
    });
    // 탐색 시 자원 소모
    EventBus.on('locationExplored', ({ districtId }) => {
      this._modResource(districtId, -ECO.resourceExploreConsume);
    });
    // 산성비 이벤트
    EventBus.on('seasonalEvent', ({ eventId }) => {
      if (eventId === 'acid_rain_warning') {
        this._applyGlobalContam(ECO.contamAcidRainAdd);
      }
      if (eventId === 'zombie_migration') {
        this._applyGlobalZombie(10);
      }
    });
  },

  // ── 초기화 ───────────────────────────────────────────────────

  ensureInitialized() {
    const gs = GameState;
    if (gs.ecology) return;

    gs.ecology = { districts: {}, global: {} };

    // 구역별 초기 상태
    for (const [id, d] of Object.entries(DISTRICTS)) {
      gs.ecology.districts[id] = {
        zombiePopulation: (d.dangerLevel ?? 1) * 15,
        resourceLevel:    100,
        contamination:    (d.radiation ?? 0) * 5,
        noiseAttraction:  0,
        lastVisitDay:     0,
      };
    }

    gs.ecology.global = {
      totalZombies: Object.values(gs.ecology.districts)
        .reduce((sum, e) => sum + e.zombiePopulation, 0),
    };
  },

  // ── TP 콜백 ──────────────────────────────────────────────────

  _onTP() {
    this.ensureInitialized();
    const gs = GameState;
    const eco = gs.ecology;
    const season = gs.season?.current ?? 'spring';

    for (const [id, state] of Object.entries(eco.districts)) {
      const dist = DISTRICTS[id];
      if (!dist) continue;

      // 자연 자원 재생
      const regenMult = ECO.resourceSeasonMult[season] ?? 1.0;
      state.resourceLevel = Math.min(100,
        state.resourceLevel + ECO.resourceRegenPerTP * regenMult
      );

      // 좀비 자연 증가 (매우 느림)
      state.zombiePopulation = Math.min(100,
        state.zombiePopulation + ECO.zombieNaturalGrowth
      );

      // 방사능 구역 오염 증가
      if (dist.radiation > 0) {
        state.contamination = Math.min(100,
          state.contamination + dist.radiation * ECO.contamRadiationRate
        );
      }

      // 오염 자연 감소
      state.contamination = Math.max(0,
        state.contamination - ECO.contamNaturalDecay
      );

      // 현재 구역 소음 유인
      if (id === gs.location.currentDistrict) {
        const noise = gs.noise?.level ?? 0;
        state.noiseAttraction = noise;
      } else {
        // 비방문 구역 소음 감쇠
        state.noiseAttraction = Math.max(0, state.noiseAttraction - 0.5);
      }
    }

    // 일 1회 좀비 이동 시뮬레이션
    const day = gs.time?.day ?? 1;
    if (day !== this._lastMigrationDay) {
      this._lastMigrationDay = day;
      this._simulateMigration(eco);
    }
  },

  // ── 좀비 이동 (일 1회) ────────────────────────────────────────

  _simulateMigration(eco) {
    const changes = {};  // { distId: delta }

    for (const [distId, state] of Object.entries(eco.districts)) {
      const dist = DISTRICTS[distId];
      if (!dist) continue;
      const myPop = state.zombiePopulation;

      for (const adjId of (dist.adjacentDistricts ?? [])) {
        const adjState = eco.districts[adjId];
        if (!adjState) continue;

        const delta = myPop - adjState.zombiePopulation;
        if (delta > 10) {
          const migration = Math.floor(delta * ECO.zombieMigrationRate);
          changes[distId] = (changes[distId] ?? 0) - migration;
          changes[adjId]  = (changes[adjId] ?? 0) + migration;
        }
      }

      // 소음 유인: 인접 구에서 끌어옴
      if (state.noiseAttraction > ECO.zombieNoiseThreshold) {
        for (const adjId of (dist.adjacentDistricts ?? [])) {
          const adjState = eco.districts[adjId];
          if (!adjState) continue;
          const pull = Math.floor(state.noiseAttraction * ECO.zombieNoisePullRate);
          if (pull > 0 && adjState.zombiePopulation > pull) {
            changes[adjId]  = (changes[adjId] ?? 0) - pull;
            changes[distId] = (changes[distId] ?? 0) + pull;
          }
        }
      }
    }

    // 변화 적용
    for (const [id, delta] of Object.entries(changes)) {
      if (eco.districts[id]) {
        eco.districts[id].zombiePopulation = Math.max(0,
          Math.min(100, eco.districts[id].zombiePopulation + delta)
        );
      }
    }
  },

  // ── 공개 API ──────────────────────────────────────────────────

  /**
   * 구역의 좀비 밀도에 따른 encounterChance 배율 반환.
   */
  getEncounterMult(districtId) {
    this.ensureInitialized();
    const pop = GameState.ecology?.districts[districtId]?.zombiePopulation ?? 50;
    for (const tier of ECO.zombieDensityMult) {
      if (pop < tier.max) return tier.mult;
    }
    return 1.8;
  },

  /**
   * 구역의 자원 레벨에 따른 loot 배율 반환.
   */
  getLootMult(districtId) {
    this.ensureInitialized();
    const res = GameState.ecology?.districts[districtId]?.resourceLevel ?? 100;
    for (const tier of ECO.resourceLootMult) {
      if (res < tier.max) return tier.mult;
    }
    return 1.0;
  },

  /**
   * 구역의 오염도 반환 (0~100).
   */
  getContamination(districtId) {
    this.ensureInitialized();
    return GameState.ecology?.districts[districtId]?.contamination ?? 0;
  },

  /**
   * 구역의 생태계 상태 요약 반환 (맵 표시용).
   */
  getDistrictEcology(districtId) {
    this.ensureInitialized();
    const state = GameState.ecology?.districts[districtId];
    if (!state) return { zombie: 0, resource: 100, contam: 0 };
    return {
      zombie:   Math.round(state.zombiePopulation),
      resource: Math.round(state.resourceLevel),
      contam:   Math.round(state.contamination),
    };
  },

  // ── 내부 헬퍼 ──────────────────────────────────────────────

  _modZombie(districtId, delta) {
    this.ensureInitialized();
    const state = GameState.ecology?.districts[districtId];
    if (state) {
      state.zombiePopulation = Math.max(0, Math.min(100, state.zombiePopulation + delta));
    }
  },

  _modResource(districtId, delta) {
    this.ensureInitialized();
    const state = GameState.ecology?.districts[districtId];
    if (state) {
      state.resourceLevel = Math.max(0, Math.min(100, state.resourceLevel + delta));
    }
  },

  _applyGlobalContam(amount) {
    this.ensureInitialized();
    for (const state of Object.values(GameState.ecology.districts)) {
      state.contamination = Math.min(100, state.contamination + amount);
    }
  },

  _applyGlobalZombie(amount) {
    this.ensureInitialized();
    for (const state of Object.values(GameState.ecology.districts)) {
      state.zombiePopulation = Math.min(100, state.zombiePopulation + amount);
    }
  },
};

export { ECO };
export default EcologySystem;
