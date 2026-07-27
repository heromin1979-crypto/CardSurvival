import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { SECRET_ENEMIES } from '../js/data/secretEnemies.js';
import {
  advanceBossAction,
  commitNextBossAction,
  completeBossAction,
  createBossActionState,
  reserveUltimateAfterDamage,
} from '../js/systems/combat/BossPatternController.js';
import { executeEnemyAction } from '../js/systems/combat/EnemyActionExecutor.js';

const DEFAULT_RUNS = 500;
const DEFAULT_SEED = 20260728;
const BOSS_TURNS_PER_RUN = 20;
const ULTIMATE_CROSSING_TURN = 7;
const EXPECTED_BOSS_COUNT = 21;
const SPECIAL_RATE_MIN = 0.27;
const SPECIAL_RATE_MAX = 0.33;

const CANDIDATES = Object.freeze([
  Object.freeze({
    id: 'player',
    side: 'ally',
    rank: 1,
    hp: 1_000_000,
    maxHp: 1_000_000,
    isExposed: true,
    statusEffects: [],
  }),
  Object.freeze({
    id: 'npc_guard',
    side: 'ally',
    rank: 2,
    hp: 1_000_000,
    maxHp: 1_000_000,
    isDefended: true,
    statusEffects: [],
  }),
]);

function parseArgs(argv) {
  const options = {
    runs: DEFAULT_RUNS,
    seed: DEFAULT_SEED,
    out: 'tmp/boss-pattern-qa.md',
  };

  for (let index = 0; index < argv.length; index++) {
    const flag = argv[index];
    if (!['--runs', '--seed', '--out'].includes(flag)) {
      throw new Error(`지원하지 않는 인자: ${flag}`);
    }

    const value = argv[++index];
    if (value === undefined) throw new Error(`${flag} 값이 필요합니다.`);
    if (flag === '--out') {
      options.out = value;
      continue;
    }

    const number = Number.parseInt(value, 10);
    if (!Number.isSafeInteger(number) || number <= 0) {
      throw new Error(`${flag}는 1 이상의 정수여야 합니다: ${value}`);
    }
    options[flag.slice(2)] = number;
  }

  if (options.runs < DEFAULT_RUNS) {
    throw new Error(`--runs는 보스별 최소 ${DEFAULT_RUNS}회여야 합니다.`);
  }
  if (options.out.trim().length === 0) {
    throw new Error('--out은 비어 있지 않은 경로여야 합니다.');
  }
  return options;
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function randomFor(seed, ...parts) {
  return mulberry32((seed ^ fnv1a(parts.join('/'))) >>> 0);
}

function actionId(definition) {
  return definition?.id ?? definition?.actionId ?? null;
}

function actionDefinitionFor(boss, action) {
  if (!action) return null;
  if (action.category === 'basic') {
    return boss.bossPattern.basicAttacks.find(
      definition => actionId(definition) === action.actionId,
    ) ?? null;
  }
  if (action.category === 'special') {
    return actionId(boss.bossPattern.specialSkill) === action.actionId
      ? boss.bossPattern.specialSkill
      : null;
  }
  if (action.category === 'ultimate') {
    return actionId(boss.bossPattern.ultimate) === action.actionId
      ? boss.bossPattern.ultimate
      : null;
  }
  return null;
}

function hasValidTargets(action) {
  if (!Array.isArray(action?.targetIds) || action.targetIds.length === 0) {
    return false;
  }
  return action.targetIds.every(targetId => CANDIDATES.some(candidate => (
    candidate.id === targetId
    && candidate.dead !== true
    && (!Number.isFinite(candidate.hp) || candidate.hp > 0)
  )));
}

function emptyBossMetrics(boss) {
  return {
    id: boss.id,
    name: boss.name,
    basicUses: Object.fromEntries(
      boss.bossPattern.basicAttacks.map(definition => [actionId(definition), 0]),
    ),
    repeatedBasics: 0,
    unavoidableBasicFallbacks: 0,
    unnecessaryBasicRepeats: 0,
    specialEligibilityOpportunities: 0,
    specialSelections: 0,
    ultimateThresholdCrossings: 0,
    ultimateReservations: 0,
    ultimateWarnings: 0,
    ultimateActivations: 0,
    ultimateCancellations: 0,
    maxUltimateUsesPerCombat: 0,
    combatsWithRepeatedUltimateUse: 0,
    unsupportedEffects: 0,
    invalidActions: 0,
  };
}

function createRuntimeBoss(definition) {
  const maxHp = definition.hp?.max ?? definition.hp?.min ?? 100;
  return {
    ...definition,
    currentHp: maxHp,
    maxHp,
    _skillCooldowns: {},
    _statusEffects: [],
  };
}

function createRunContext() {
  return {
    activeSummons: 0,
    selfStatuses: [],
  };
}

function tickRuntimeState(enemy, context) {
  for (const id of Object.keys(enemy._skillCooldowns)) {
    if (enemy._skillCooldowns[id] > 0) enemy._skillCooldowns[id] -= 1;
  }

  context.selfStatuses = context.selfStatuses
    .map(status => ({
      ...status,
      duration: Math.max(0, (status.duration ?? 1) - 1),
    }))
    .filter(status => status.duration > 0);
  enemy._statusEffects = context.selfStatuses;
}

function createExecutionServices(context) {
  return {
    damageTarget: (_targetId, amount) => ({ damage: amount, dodged: false }),
    damageParty: amount => ({
      results: CANDIDATES.map(candidate => ({
        targetId: candidate.id,
        result: { damage: amount, dodged: false },
      })),
    }),
    emitFx: () => {},
    addLog: () => {},
    addStatus: () => {},
    moveTarget: () => {},
    healSelf: amount => amount,
    addSelfStatus: status => {
      const remaining = context.selfStatuses.filter(
        current => current.id !== status.id,
      );
      context.selfStatuses = [...remaining, status];
    },
    summonEnemy: (_enemyId, count) => {
      context.activeSummons += count;
      return count;
    },
    setBattlefieldStatus: () => {},
    modifyResource: () => {},
    lockWeapon: () => {},
    addNoise: () => {},
  };
}

function isSpecialEligibilityOpportunity({ state, enemy, context }) {
  if (state.committedAction || state.ultimatePending) {
    return false;
  }

  const probe = commitNextBossAction({
    state,
    enemy,
    candidates: CANDIDATES,
    context,
    cooldowns: enemy._skillCooldowns,
    random: () => 0,
  });
  return probe.committedAction?.category === 'special';
}

function classifyRepeatedBasic({
  stateBefore,
  stateAfter,
  enemy,
  context,
  metrics,
}) {
  const selected = stateAfter.committedAction;
  if (selected?.category !== 'basic'
      || selected.actionId !== stateBefore.lastBasicActionId) {
    return;
  }

  metrics.repeatedBasics += 1;
  const probeEnemy = {
    ...enemy,
    _skillCooldowns: {
      ...enemy._skillCooldowns,
      [actionId(enemy.bossPattern.specialSkill)]: Number.POSITIVE_INFINITY,
    },
  };
  const probe = commitNextBossAction({
    state: stateBefore,
    enemy: probeEnemy,
    candidates: CANDIDATES,
    context,
    cooldowns: probeEnemy._skillCooldowns,
    random: () => 0,
  });
  if (probe.committedAction?.category === 'basic'
      && probe.committedAction.actionId !== selected.actionId) {
    metrics.unnecessaryBasicRepeats += 1;
  } else {
    metrics.unavoidableBasicFallbacks += 1;
  }
}

function recordCommittedAction({
  stateBefore,
  stateAfter,
  enemy,
  context,
  metrics,
  runMetrics,
  specialWasEligible,
}) {
  const action = stateAfter.committedAction;
  if (!action) {
    metrics.invalidActions += 1;
    return;
  }

  if (specialWasEligible) {
    metrics.specialEligibilityOpportunities += 1;
  }
  if (action.category === 'special') {
    metrics.specialSelections += 1;
  }
  if (action.category === 'ultimate') {
    metrics.ultimateWarnings += 1;
    runMetrics.ultimateUses += 1;
  }

  classifyRepeatedBasic({
    stateBefore,
    stateAfter,
    enemy,
    context,
    metrics,
  });

  const definition = actionDefinitionFor(enemy, action);
  if (!definition || !hasValidTargets(action)) {
    metrics.invalidActions += 1;
  }
}

function commitNextAction({
  state,
  enemy,
  context,
  random,
  metrics,
  runMetrics,
}) {
  const specialWasEligible = isSpecialEligibilityOpportunity({
    state,
    enemy,
    context,
  });
  const next = commitNextBossAction({
    state,
    enemy,
    candidates: CANDIDATES,
    context,
    cooldowns: enemy._skillCooldowns,
    random,
  });
  recordCommittedAction({
    stateBefore: state,
    stateAfter: next,
    enemy,
    context,
    metrics,
    runMetrics,
    specialWasEligible,
  });
  return next;
}

function crossUltimateThreshold({
  state,
  enemy,
  metrics,
}) {
  const maxHp = enemy.maxHp;
  const hpBefore = maxHp * 0.31;
  const hpAfter = maxHp * 0.30;
  metrics.ultimateThresholdCrossings += 1;
  enemy.currentHp = hpAfter;

  const reserved = reserveUltimateAfterDamage({
    state,
    hpBefore,
    hpAfter,
    maxHp,
    threshold: enemy.bossPattern.ultimate.hpThreshold,
  });
  if (reserved.ultimatePending && !state.ultimatePending) {
    metrics.ultimateReservations += 1;
  }
  return reserved;
}

function executeReadyAction({
  state,
  enemy,
  context,
  random,
  metrics,
}) {
  const action = state.committedAction;
  const definition = actionDefinitionFor(enemy, action);
  if (!definition || !hasValidTargets(action)) {
    return completeBossAction({ state });
  }

  const result = executeEnemyAction({
    enemy,
    action,
    services: createExecutionServices(context),
    random,
  });
  if (!result) {
    metrics.invalidActions += 1;
  } else {
    metrics.unsupportedEffects += result.resolvedEffects.filter(
      effect => effect?.skipped === true && effect?.reason === 'unsupported',
    ).length;
  }

  if (action.category === 'basic') {
    metrics.basicUses[action.actionId] = (metrics.basicUses[action.actionId] ?? 0) + 1;
  } else if (action.category === 'ultimate') {
    metrics.ultimateActivations += 1;
  }

  tickRuntimeState(enemy, context);
  if (action.category === 'special') {
    enemy._skillCooldowns[action.actionId] = definition.cooldown ?? 0;
  }
  return completeBossAction({ state });
}

function simulateCombat({ bossDefinition, runIndex, seed, metrics }) {
  const random = randomFor(seed, bossDefinition.id, runIndex);
  const enemy = createRuntimeBoss(bossDefinition);
  const context = createRunContext();
  const runMetrics = { ultimateUses: 0 };
  let state = createBossActionState();

  state = commitNextAction({
    state,
    enemy,
    context,
    random,
    metrics,
    runMetrics,
  });

  for (let turn = 0; turn < BOSS_TURNS_PER_RUN; turn++) {
    if (turn === ULTIMATE_CROSSING_TURN) {
      state = crossUltimateThreshold({ state, enemy, metrics });
      if (!state.committedAction) {
        state = commitNextAction({
          state,
          enemy,
          context,
          random,
          metrics,
          runMetrics,
        });
      }
    }

    const action = state.committedAction;
    if (!action) {
      metrics.invalidActions += 1;
    } else if (action.state === 'telegraphing') {
      const definition = actionDefinitionFor(enemy, action);
      if (action.category === 'ultimate'
          && definition?.telegraph?.cancelOnHit === true) {
        metrics.ultimateCancellations += 1;
        state = completeBossAction({ state });
      } else {
        state = advanceBossAction({ state });
      }
    } else {
      state = executeReadyAction({
        state,
        enemy,
        context,
        random,
        metrics,
      });
    }

    if (!state.committedAction && turn + 1 < BOSS_TURNS_PER_RUN) {
      state = commitNextAction({
        state,
        enemy,
        context,
        random,
        metrics,
        runMetrics,
      });
    }
  }

  metrics.maxUltimateUsesPerCombat = Math.max(
    metrics.maxUltimateUsesPerCombat,
    runMetrics.ultimateUses,
  );
  if (runMetrics.ultimateUses > 1) {
    metrics.combatsWithRepeatedUltimateUse += 1;
  }
}

function specialRate(metrics) {
  if (metrics.specialEligibilityOpportunities === 0) return 0;
  return metrics.specialSelections / metrics.specialEligibilityOpportunities;
}

function validateResults(results) {
  const failures = [];
  if (results.length !== EXPECTED_BOSS_COUNT) {
    failures.push(`보스 수: expected=${EXPECTED_BOSS_COUNT} actual=${results.length}`);
  }

  for (const metrics of results) {
    for (const [id, uses] of Object.entries(metrics.basicUses)) {
      if (uses === 0) failures.push(`${metrics.id}: 기본공격 ${id} 사용 0회`);
    }
    if (metrics.unnecessaryBasicRepeats > 0) {
      failures.push(
        `${metrics.id}: 불필요한 연속 기본공격 ${metrics.unnecessaryBasicRepeats}회`,
      );
    }

    const rate = specialRate(metrics);
    if (metrics.specialEligibilityOpportunities === 0
        || rate < SPECIAL_RATE_MIN
        || rate > SPECIAL_RATE_MAX) {
      failures.push(
        `${metrics.id}: 특수기 선택률 ${(rate * 100).toFixed(2)}% `
        + `(기회 ${metrics.specialEligibilityOpportunities}, 선택 ${metrics.specialSelections})`,
      );
    }
    if (metrics.ultimateReservations !== metrics.ultimateThresholdCrossings) {
      failures.push(
        `${metrics.id}: 필살기 예약 ${metrics.ultimateReservations}/`
        + `${metrics.ultimateThresholdCrossings}`,
      );
    }
    if (metrics.ultimateWarnings !== metrics.ultimateReservations) {
      failures.push(
        `${metrics.id}: 필살기 예고 ${metrics.ultimateWarnings}/`
        + `${metrics.ultimateReservations}`,
      );
    }
    const terminalUltimates = metrics.ultimateActivations
      + metrics.ultimateCancellations;
    if (terminalUltimates !== metrics.ultimateReservations) {
      failures.push(
        `${metrics.id}: 필살기 종결 ${terminalUltimates}/`
        + `${metrics.ultimateReservations} `
        + `(발동 ${metrics.ultimateActivations}, 취소 ${metrics.ultimateCancellations})`,
      );
    }
    if (metrics.maxUltimateUsesPerCombat > 1
        || metrics.combatsWithRepeatedUltimateUse > 0) {
      failures.push(
        `${metrics.id}: 전투당 필살기 최대 ${metrics.maxUltimateUsesPerCombat}회`,
      );
    }
    if (metrics.unsupportedEffects > 0) {
      failures.push(`${metrics.id}: 지원되지 않은 effect ${metrics.unsupportedEffects}회`);
    }
    if (metrics.invalidActions > 0) {
      failures.push(`${metrics.id}: 대상 없음 또는 무효 action ${metrics.invalidActions}회`);
    }
  }
  return failures;
}

function sum(results, field) {
  return results.reduce((total, metrics) => total + metrics[field], 0);
}

function formatRate(metrics) {
  return `${(specialRate(metrics) * 100).toFixed(2)}%`;
}

function formatReport({ options, results, failures }) {
  const basicTotal = results.reduce(
    (total, metrics) => total
      + Object.values(metrics.basicUses).reduce((sumValue, value) => sumValue + value, 0),
    0,
  );
  const lines = [
    '# 보스 패턴 결정적 QA',
    '',
    `- seed: \`${options.seed}\``,
    `- 보스별 전투: \`${options.runs}\`회`,
    `- 전투별 보스 턴: \`${BOSS_TURNS_PER_RUN}\`턴`,
    `- 보스 수: \`${results.length}\``,
    `- 결과: **${failures.length === 0 ? 'PASS' : 'FAIL'}**`,
    '',
    '## 전체 요약',
    '',
    '| 항목 | 결과 |',
    '|---|---:|',
    `| 기본공격 사용 | ${basicTotal} |`,
    `| 같은 기본공격 연속 선택 | ${sum(results, 'repeatedBasics')} |`,
    `| 불가피한 fallback | ${sum(results, 'unavoidableBasicFallbacks')} |`,
    `| 불필요한 연속 기본공격 | ${sum(results, 'unnecessaryBasicRepeats')} |`,
    `| 특수기 eligibility opportunity | ${sum(results, 'specialEligibilityOpportunities')} |`,
    `| 특수기 선택 | ${sum(results, 'specialSelections')} |`,
    `| 필살기 임계 통과 | ${sum(results, 'ultimateThresholdCrossings')} |`,
    `| 필살기 예약 | ${sum(results, 'ultimateReservations')} |`,
    `| 필살기 예고 | ${sum(results, 'ultimateWarnings')} |`,
    `| 필살기 발동 | ${sum(results, 'ultimateActivations')} |`,
    `| 필살기 취소 | ${sum(results, 'ultimateCancellations')} |`,
    `| 지원되지 않은 effect | ${sum(results, 'unsupportedEffects')} |`,
    `| 대상 없음 또는 무효 action | ${sum(results, 'invalidActions')} |`,
    '',
    '특수기 분모는 HP·소환 수·자기 상태·쿨다운 조건이 충족되어 '
      + '`BossPatternController`가 실제 30% 난수 판정을 수행한 커밋 기회만 센다.',
    '',
    '## 보스별 결과',
    '',
    '| 보스 | 기본 A | 기본 B | 연속 / fallback / 불필요 | 특수기 기회 / 선택 / 비율 | 필살기 임계 / 예약 / 예고 / 발동 / 취소 | 최대 사용 | unsupported | invalid |',
    '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
  ];

  for (const metrics of results) {
    const basicEntries = Object.entries(metrics.basicUses);
    lines.push(
      `| \`${metrics.id}\` `
      + `| ${basicEntries[0]?.[0] ?? '-'}: ${basicEntries[0]?.[1] ?? 0} `
      + `| ${basicEntries[1]?.[0] ?? '-'}: ${basicEntries[1]?.[1] ?? 0} `
      + `| ${metrics.repeatedBasics} / ${metrics.unavoidableBasicFallbacks} / ${metrics.unnecessaryBasicRepeats} `
      + `| ${metrics.specialEligibilityOpportunities} / ${metrics.specialSelections} / ${formatRate(metrics)} `
      + `| ${metrics.ultimateThresholdCrossings} / ${metrics.ultimateReservations} / `
      + `${metrics.ultimateWarnings} / ${metrics.ultimateActivations} / ${metrics.ultimateCancellations} `
      + `| ${metrics.maxUltimateUsesPerCombat} `
      + `| ${metrics.unsupportedEffects} `
      + `| ${metrics.invalidActions} |`,
    );
  }

  lines.push('', '## 자동 실패 기준', '');
  if (failures.length === 0) {
    lines.push('- 위반 없음');
  } else {
    lines.push(...failures.map(failure => `- ${failure}`));
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const bosses = Object.values(SECRET_ENEMIES)
    .filter(enemy => enemy.isBoss === true);
  const results = [];

  for (const boss of bosses) {
    const metrics = emptyBossMetrics(boss);
    for (let runIndex = 0; runIndex < options.runs; runIndex++) {
      simulateCombat({
        bossDefinition: boss,
        runIndex,
        seed: options.seed,
        metrics,
      });
    }
    results.push(metrics);
  }

  const failures = validateResults(results);
  const report = formatReport({ options, results, failures });
  const outputPath = path.resolve(options.out);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, report, 'utf8');

  console.log(
    `bosses=${results.length} runs=${options.runs} turns=${BOSS_TURNS_PER_RUN} `
    + `unsupported=${sum(results, 'unsupportedEffects')} `
    + `invalid=${sum(results, 'invalidActions')} result=${failures.length === 0 ? 'PASS' : 'FAIL'}`,
  );
  console.log(`report=${outputPath}`);
  if (failures.length > 0) {
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
