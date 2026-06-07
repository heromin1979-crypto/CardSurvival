// === runner.mjs ===
// 단일 회차 실행 — 게임 systemBootstrap + EventBus 발화.
// PR4: 실제 게임 시스템 연결.

import { installGlobalShim } from './mocks/globalShim.mjs';
installGlobalShim();

import GameState from '../../../js/core/GameState.js';
import EventBus from '../../../js/core/EventBus.js';
import { bootstrapSystems, teardownSystems } from './systemBootstrap.mjs';
import { captureInitialState, resetGameStateForRun } from './gameStateReset.mjs';
import { makeRng } from './rng.mjs';
import { runDayAI, createSimInventoryFromCharacter } from './playerAI.mjs';
import { buildCharacterConfig } from './characterAdapter.mjs';

const TP_PER_DAY = 72;
const TARGET_DAYS = 100;
const TARGET_TP = TARGET_DAYS * TP_PER_DAY;

let initialized = false;

function setupOnce() {
  if (initialized) return;
  captureInitialState();
  initialized = true;
}

const EVENT_HOOKS = ['siegeTriggered', 'hospitalRewards', 'hospitalDamaged',
                     'patientDied', 'bossKilled', 'hiddenLocationDiscovered',
                     'recipeUnlocked', 'secretEventTriggered'];

export function runSingleRun({ characterId, seed, runId, maxTP = TARGET_TP, snapshotDays = [30, 60, 90], enableAI = true, traceDaily = false, strategy = {} }) {
  setupOnce();

  resetGameStateForRun({ characterId });
  const cc = buildCharacterConfig(characterId);
  const simInv = createSimInventoryFromCharacter(cc);
  const aiLog = [];
  const rng = makeRng(seed);
  // Math.random 우회 — 일부 시스템이 Math.random 직접 사용. 결정성 100% 보장 위해 monkey-patch.
  const origRandom = Math.random;
  Math.random = rng;

  const events = [];
  const dayStarts = [];   // traceDaily 시 매일 아침 스탯 스냅샷
  const resourceSnapshots = [];
  const moraleTierTrace = [];
  let currentTier = null;
  let tierStartTP = 0;

  // EventBus 구독 (이벤트 hook)
  const unsubs = [];
  for (const ch of EVENT_HOOKS) {
    const unsub = EventBus.on(ch, (data) => {
      events.push({ tp: GameState.time?.totalTP ?? 0, type: ch, data });
    });
    unsubs.push(unsub);
  }

  // 행동 프로파일용 카운터 — 퀘스트·전투 (questListChanged는 다발성이라 제외)
  const behaviorCounts = { questsStarted: 0, questsCompleted: 0, combats: 0 };
  unsubs.push(EventBus.on('questStarted',   () => { behaviorCounts.questsStarted += 1; }));
  unsubs.push(EventBus.on('questCompleted', () => { behaviorCounts.questsCompleted += 1; }));
  unsubs.push(EventBus.on('combatEnd',      () => { behaviorCounts.combats += 1; }));

  // morale tier trace 핸들러
  const tierUnsub = EventBus.on('tpAdvance', () => {
    const morale = GameState.stats?.morale?.current ?? 50;
    const tier = morale >= 70 ? 'high' : morale >= 30 ? 'normal' : morale >= 15 ? 'low' : 'despair';
    if (tier !== currentTier) {
      if (currentTier !== null) {
        moraleTierTrace.push({ fromTP: tierStartTP, toTP: GameState.time?.totalTP, tier: currentTier });
      }
      currentTier = tier;
      tierStartTP = GameState.time?.totalTP ?? 0;
    }
  });
  unsubs.push(tierUnsub);

  // 시스템 init
  let bootstrapErrors = 0;
  try {
    const initResults = bootstrapSystems();
    bootstrapErrors = initResults.filter(r => !r.ok).length;
  } catch (e) {
    Math.random = origRandom;
    return { runId, character: characterId, seed, alive: false, _error: `bootstrap: ${e.message}` };
  }

  // TP 루프
  let lastError = null;
  let tp = 0;
  const snapshotSet = new Set(snapshotDays);

  try {
    for (tp = 0; tp < maxTP; tp += 1) {
      GameState.time.totalTP = tp;
      GameState.time.tpInDay = tp % TP_PER_DAY;
      GameState.time.day = Math.floor(tp / TP_PER_DAY) + 1;
      GameState.time.hour = Math.floor((tp % TP_PER_DAY) / 3);

      // traceDaily: 행동 전 아침 스탯 스냅샷 (AI가 본 그날 시작 상태)
      if (traceDaily && GameState.time.tpInDay === 0) {
        const s = GameState.stats ?? {};
        dayStarts.push({
          day: GameState.time.day,
          hp: GameState.player?.hp?.current ?? 0,
          stats: {
            hydration: Math.round(s.hydration?.current ?? 0),
            nutrition: Math.round(s.nutrition?.current ?? 0),
            morale:    Math.round(s.morale?.current ?? 0),
            fatigue:   Math.round(s.fatigue?.current ?? 0),
            stamina:   Math.round(s.stamina?.current ?? 0),
          },
        });
      }

      // Player AI 1차: day 시작 시 1회 행동
      if (enableAI && GameState.time.tpInDay === 0 && GameState.time.day > 1) {
        const acts = runDayAI(simInv, strategy);
        for (const a of acts) aiLog.push({ day: GameState.time.day, action: a });
      }

      EventBus.emit('tpAdvance', { totalTP: tp });

      // 자원 스냅샷 (day 시작 시점)
      if (GameState.time.tpInDay === 0 && snapshotSet.has(GameState.time.day)) {
        resourceSnapshots.push({
          day: GameState.time.day,
          values: {
            hydration: GameState.stats?.hydration?.current ?? 0,
            nutrition: GameState.stats?.nutrition?.current ?? 0,
            morale:    GameState.stats?.morale?.current ?? 0,
            fatigue:   GameState.stats?.fatigue?.current ?? 0,
            stamina:   GameState.stats?.stamina?.current ?? 0,
          },
        });
      }

      if (!GameState.player.isAlive) break;
    }
  } catch (e) {
    lastError = e.message;
  }

  // morale tier 마지막 세그먼트 마감
  if (currentTier !== null) {
    moraleTierTrace.push({ fromTP: tierStartTP, toTP: GameState.time?.totalTP ?? 0, tier: currentTier });
  }

  // cleanup
  for (const u of unsubs) try { u(); } catch {}
  teardownSystems();
  Math.random = origRandom;

  const alive = GameState.player.isAlive && tp >= maxTP - 1;
  const deathDay = alive ? null : GameState.time.day;
  const deathCause = GameState.player.deathCause ?? null;

  // traceDaily: 일자별 타임라인 조립 (아침 스탯 + 그날 행동 + 그날 이벤트)
  let dailyTrace = null;
  if (traceDaily) {
    dailyTrace = dayStarts.map((ds) => ({
      day: ds.day,
      hp: ds.hp,
      stats: ds.stats,
      actions: aiLog.filter((a) => a.day === ds.day).map((a) => a.action),
      events: events
        .filter((e) => Math.floor((e.tp ?? 0) / TP_PER_DAY) + 1 === ds.day)
        .map((e) => e.type),
    }));
  }

  return {
    dailyTrace,
    runId,
    character: characterId,
    seed,
    alive,
    survivedDays: GameState.time.day,
    deathDay,
    deathCause,
    endingCategory: null, // PR4 후속 — EndingSystem trace 추가
    endingId: null,
    events: events.slice(0, 200), // size cap
    moraleTierTrace,
    resourceSnapshots,
    bootstrapErrors,
    _runError: lastError,
    aiLog, // 일별 행동 문자열 (behaviorProfile 리포터가 집계, baseline JSON엔 미저장)
    behavior: {
      ...behaviorCounts,
      totalKills: GameState.flags?.totalKills ?? 0,
    },
    kpi: {
      survivedDays: GameState.time.day,
      totalKills: GameState.flags?.totalKills ?? 0,
      legendaryReached: [...(GameState.flags?.legendaryItemsFound ?? [])],
      secretEnemyKilled: [...(GameState.flags?.bossesKilled ?? [])],
      aiActions: aiLog.length,
      remainingInv: { ...simInv },
    },
  };
}

export function runBatch({ characterId, runs = 100, seedBase = 0, maxTP, strategy = {} }) {
  const traces = [];
  for (let i = 0; i < runs; i += 1) {
    traces.push(runSingleRun({ characterId, seed: seedBase + i, runId: i, maxTP, strategy }));
  }
  return traces;
}
