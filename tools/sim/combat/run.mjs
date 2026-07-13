// 전투 밸런스 시뮬레이터 — combat-test.html을 헤드리스로 구동해
// (무기 × 조우) 매트릭스를 N회씩 완주하고 승률/평균 라운드/피해 리포트를 남긴다.
//
// 실행: node tools/sim/combat/run.mjs [--n 100] [--out docs/analysis/COMBAT_SIM_REPORT.md]
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const args = process.argv.slice(2);
const argValue = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const RUNS_PER_CELL = Number(argValue('--n', 100));
const OUT_PATH = path.resolve(argValue('--out', 'docs/analysis/COMBAT_SIM_REPORT.md'));
// stuck 런의 사유·전장 스냅샷을 JSON으로 남길 디렉토리 (미지정 시 덤프 생략)
const DUMP_STUCK_DIR = args.includes('--dump-stuck')
  ? path.resolve(argValue('--dump-stuck', 'tmp/stuck-dumps'))
  : null;

const PORT = 43555;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// 무기 축 — null은 맨손. 탄약은 def.combat.requiresAmmo에서 자동 파생.
const WEAPONS = [null, 'knife', 'reinforced_bat', 'machete', 'pistol', 'rifle'];

// 조우 축 — ids가 있으면 고정 편성, dangerLevel이면 인카운터 테이블 롤.
// noise는 조우 규모 축: rollEnemyGroup이 소음 0→1마리(DL-1) / 30~64→2마리(DL) / 65+→3마리(DL+1).
// 정숙(0) 셀만 재면 항상 최저 난이도 구성이 측정되므로 소음 45 셀을 함께 잰다.
const ENCOUNTERS = [
  { key: 'DL1 조우 롤(정숙)', dangerLevel: 1, noise: 0 },
  { key: 'DL3 조우 롤(정숙)', dangerLevel: 3, noise: 0 },
  { key: 'DL3 조우 롤(소음45)', dangerLevel: 3, noise: 45 },
  { key: 'DL5 조우 롤(정숙)', dangerLevel: 5, noise: 0 },
  { key: 'DL5 조우 롤(소음45)', dangerLevel: 5, noise: 45 },
  { key: '거대 좀비 단독', ids: ['zombie_brute'] },
  { key: '약탈자 2인조', ids: ['raider', 'raider_elite'] },
];

// 실플레이 조건 플래그 — 하한선(무방어구·단독)과 별도 리포트를 뜰 때 사용
const WITH_ARMOR = args.includes('--armor');
const WITH_COMPANION = args.includes('--companion');

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch (err) {
    throw new Error(`playwright가 필요합니다: ${err.message}`);
  }
}

function startServer() {
  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  return spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    stdio: ['ignore', 'ignore', 'ignore'],
  });
}

async function waitForServer(timeoutMs = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/combat-test.html`);
      if (res.ok) return;
    } catch { /* 부팅 대기 */ }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('vite dev 서버가 뜨지 않았습니다');
}

// 페이지 컨텍스트에서 한 셀(무기×조우)을 N회 시뮬레이션
async function simulateCell(page, weaponId, encounter, runs, conditions) {
  return page.evaluate(async ({ weaponId, encounter, runs, conditions }) => {
    const gs = window.GameState;
    const CS = window.CombatSystem;
    const SM = window.StateMachine;
    const skillsSnapshot = JSON.stringify(gs.skills ?? null);

    const stats = {
      wins: 0, defeats: 0, fleds: 0, stuck: 0,
      totalRounds: 0, totalHpLoss: 0, totalStress: 0, samples: 0,
      stuckReasons: {}, stuckDumps: [],
    };

    const cleanupIds = [];
    const cleanupBoard = () => {
      for (const id of cleanupIds.splice(0)) {
        if (gs.cards?.[id]) gs.removeCardInstanceSilent?.(id) ?? gs.removeCardInstance?.(id);
      }
      for (const id of (gs.combat?.rewards ?? [])) {
        if (gs.cards?.[id]) gs.removeCardInstanceSilent?.(id) ?? gs.removeCardInstance?.(id);
      }
      gs.pendingLoot = [];
    };

    const resetPlayer = () => {
      gs.player.hp = { current: 100, max: 100 };
      gs.player.isAlive = true;
      gs.player.equipped = gs.player.equipped ?? {};
      gs.player.equipped.weapon_main = null;
      gs.player.equipped.weapon_sub = null;
      gs.player.xp = 0;
      gs.stats.stamina = { current: 100, max: 100, decayPerTP: 0 };
      gs.stats.morale = { current: 50, max: 100 };
      if (gs.stats.fatigue) gs.stats.fatigue.current = 0;
      if (gs.noise) gs.noise.level = encounter.noise ?? 0;
      if (skillsSnapshot) gs.skills = JSON.parse(skillsSnapshot);
      gs.combatRespawn = gs.combatRespawn ?? {};

      if (conditions.armor) {
        const vest = gs.createCardInstance('tactical_vest', { quantity: 1 });
        if (vest) {
          cleanupIds.push(vest.instanceId);
          gs.player.equipped.body = vest.instanceId;
        }
      } else {
        gs.player.equipped.body = null;
      }

      if (conditions.companion) {
        gs.companions = ['npc_nurse'];
        gs.npcs = gs.npcs ?? { states: {} };
        gs.npcs.states = gs.npcs.states ?? {};
        gs.npcs.states.npc_nurse = {
          hp: 50, maxHp: 50, isCompanion: true, statusEffects: [],
        };
      } else {
        gs.companions = [];
      }
    };

    const equipWeapon = () => {
      if (!weaponId) return;
      const inst = gs.createCardInstance(weaponId, { quantity: 1 });
      if (!inst) return;
      cleanupIds.push(inst.instanceId);
      gs.player.equipped.weapon_main = inst.instanceId;
      const def = gs.getCardDef(inst.instanceId);
      const ammoId = def?.combat?.requiresAmmo;
      if (ammoId) {
        const ammo = gs.createCardInstance(ammoId, { quantity: 40 });
        if (ammo) {
          const placed = gs.placeCardInRow(ammo.instanceId, 'bottom');
          cleanupIds.push(placed?.instanceId ?? ammo.instanceId);
        }
      }
    };

    const buildEnemies = () => {
      if (!encounter.ids) return null;
      return encounter.ids
        .map(id => window.__GAME_DATA__.enemies[id])
        .filter(Boolean)
        .map(def => CS._instantiateEnemyFromDefinition(def));
    };

    for (let run = 0; run < runs; run++) {
      cleanupBoard();
      resetPlayer();
      equipWeapon();
      gs.ui.currentState = 'encounter';
      const enemies = buildEnemies();
      SM.transition('combat', {
        ...(enemies ? { enemies } : {}),
        dangerLevel: encounter.dangerLevel ?? 3,
        nodeId: 'sim',
      });

      let guard = 0;
      let stuckReason = null;
      let lastFailDetail = null;
      const trace = [];
      const pushTrace = (event) => {
        trace.push(`${gs.combat?.roundNumber ?? '?'}:${gs.combat?.phase ?? '?'}:${gs.combat?.activeCombatantId ?? '?'}:${event}`);
        if (trace.length > 16) trace.shift();
      };
      while (gs.combat?.active && guard++ < 120) {
        if (gs.combat.phase !== 'await_ally_input') {
          const progressed = CS.processUntilAllyTurn();
          pushTrace(`process→${progressed}`);
          continue;
        }
        const active = gs.combat.combatants?.[gs.combat.activeCombatantId];
        const dmgSkill = (active?.skillIds ?? [])
          .map(id => gs.combat.skillsById[id])
          .find(s => (s?.effects ?? []).some(e => e.type === 'damage'));
        const target = Object.values(gs.combat.combatants ?? {})
          .find(c => c.side === 'enemy' && !c.dead && (c.hp ?? 0) > 0
            && CS._validateRankedSkillPosition(active.id, c.id, dmgSkill)?.ok);
        if (!dmgSkill) { stuckReason = 'no_skill'; break; }
        if (!target) {
          // 사거리 밖 — 이동 시도 후 재개
          const moved = CS.useActiveSkillByEffect('move');
          pushTrace(`move→${moved?.ok}`);
          if (!moved?.ok) {
            stuckReason = 'move_failed';
            lastFailDetail = moved?.reason ?? moved?.error ?? null;
            break;
          }
          continue;
        }
        CS.selectSkill(dmgSkill.id);
        CS.selectTarget(target.id);
        const result = CS.confirmAction();
        pushTrace(`act→${result?.ok}/${result?.turnConsumed}`);
        if (!result?.ok && !result?.turnConsumed) {
          stuckReason = 'confirm_failed';
          lastFailDetail = result?.reason ?? result?.error ?? null;
          break;
        }
      }
      if (gs.combat?.active && !stuckReason && guard >= 120) stuckReason = 'guard_exceeded';

      const outcome = gs.combat?.outcome ?? null;
      if (outcome === 'victory') stats.wins++;
      else if (outcome === 'defeat') stats.defeats++;
      else if (outcome === 'fled') stats.fleds++;
      else {
        stats.stuck++;
        const reason = stuckReason ?? 'unknown';
        stats.stuckReasons[reason] = (stats.stuckReasons[reason] ?? 0) + 1;
        const c = gs.combat;
        stats.stuckDumps.push({
          run, reason, detail: lastFailDetail,
          round: c?.roundNumber ?? null,
          phase: c?.phase ?? null,
          activeId: c?.activeCombatantId ?? null,
          activeIdx: c?.activeIdx ?? null,
          playerHp: gs.player.hp?.current ?? null,
          turnQueue: (c?.turnQueue ?? []).map(e => ({
            type: e?.type, enemyIdx: e?.enemyIdx, id: e?.id,
          })),
          enemies: (c?.enemies ?? []).map(e => ({
            id: e?.id, hp: e?.currentHp, row: e?.row ?? e?.position ?? null,
            charge: e?._chargeRemaining ?? null,
          })),
          trace,
          combatants: Object.values(c?.combatants ?? {}).map(u => ({
            id: u.id, side: u.side, rank: u.rank, hp: u.hp, dead: !!u.dead,
            stunned: !!u.stunned, skillIds: u.skillIds ?? [],
            tokens: u.tokens ?? null,
          })),
        });
        if (gs.combat) gs.combat.active = false;
      }

      stats.totalRounds += gs.combat?.roundNumber ?? 0;
      stats.totalHpLoss += Math.max(0, 100 - (gs.player.hp?.current ?? 0));
      stats.totalStress += gs.combat?.combatants?.player?.stress ?? 0;
      stats.samples++;
    }

    cleanupBoard();
    return stats;
  }, { weaponId, encounter, runs, conditions });
}

function formatRow(weaponLabel, stats) {
  const pct = value => `${Math.round((value / Math.max(1, stats.samples)) * 100)}%`;
  const avg = value => (value / Math.max(1, stats.samples)).toFixed(1);
  const reasons = Object.entries(stats.stuckReasons ?? {})
    .map(([k, v]) => `${k} ${v}`).join(' · ');
  return `| ${weaponLabel} | ${pct(stats.wins)} | ${pct(stats.defeats)} | ${avg(stats.totalRounds)} | ${avg(stats.totalHpLoss)} | ${avg(stats.totalStress)} |${stats.stuck > 0 ? ` ⚠ stuck ${stats.stuck} (${reasons})` : ''}`;
}

async function main() {
  const { chromium } = await loadPlaywright();
  const server = startServer();
  let browser;
  const startedAt = new Date().toISOString();
  try {
    await waitForServer();
    browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', err => console.error('[page]', String(err)));
    await page.goto(`${BASE_URL}/combat-test.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => !!window.StateMachine && !!window.GameState?.combat);

    const weaponLabels = await page.evaluate((weapons) => (
      weapons.map(id => id ? (window.__GAME_DATA__.items[id]?.name ?? id) : '맨손')
    ), WEAPONS);

    const sections = [];
    const allDumps = [];
    for (const encounter of ENCOUNTERS) {
      const rows = [];
      for (let w = 0; w < WEAPONS.length; w++) {
        const stats = await simulateCell(page, WEAPONS[w], encounter, RUNS_PER_CELL, {
          armor: WITH_ARMOR,
          companion: WITH_COMPANION,
        });
        rows.push(formatRow(weaponLabels[w], stats));
        if (DUMP_STUCK_DIR && stats.stuckDumps?.length) {
          allDumps.push(...stats.stuckDumps.map(d => ({
            cell: `${encounter.key} × ${weaponLabels[w]}`, ...d,
          })));
        }
        console.log(`${encounter.key} × ${weaponLabels[w]} — 승률 ${Math.round((stats.wins / stats.samples) * 100)}% (${stats.samples}회)`);
      }
      sections.push([
        `### ${encounter.key}`,
        '',
        '| 무기 | 승률 | 패배율 | 평균 라운드 | 평균 HP 손실 | 평균 스트레스 |',
        '|------|------|--------|-------------|--------------|----------------|',
        ...rows,
        '',
      ].join('\n'));
    }

    const report = [
      '# 전투 밸런스 시뮬레이션 리포트',
      '',
      `> 생성: ${startedAt} · 셀당 ${RUNS_PER_CELL}회 · tools/sim/combat/run.mjs`,
      `> 조건: ${WITH_COMPANION ? '동료 1(간호사)' : '플레이어 단독'}, ${WITH_ARMOR ? '전술조끼 착용' : '무방어구'}, HP 100, 사기 50(normal), 스킬 레벨 초기화, 무기 매 전투 새 인스턴스`,
      `> 소음은 조우 규모 축(섹션명에 표기): 0→1마리(DL-1) / 45→2마리(DL) / 65+→3마리(DL+1)`,
      '',
      ...sections,
      '## 해석 가이드',
      '',
      '- 목표 지표(마스터플랜): DL1 90%+, DL3 동티어 60~75%, DL5/보스급 40~60%, 평균 4~7라운드.',
      '- `stuck`은 완주 실패 런 — 사유(no_skill/move_failed/confirm_failed/guard_exceeded)가 함께 표기된다.',
      '- guard_exceeded는 드라이버 한계가 아니라 엔진 교착일 수 있다 — `--dump-stuck`으로 스냅샷을 떠서 분류할 것.',
      '',
    ].join('\n');

    await mkdir(path.dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, report, 'utf8');
    console.log(`report written: ${OUT_PATH}`);

    if (DUMP_STUCK_DIR && allDumps.length) {
      await mkdir(DUMP_STUCK_DIR, { recursive: true });
      const dumpPath = path.join(DUMP_STUCK_DIR, `stuck-${startedAt.replace(/[:.]/g, '-')}.json`);
      await writeFile(dumpPath, JSON.stringify(allDumps, null, 2), 'utf8');
      console.log(`stuck dumps (${allDumps.length}): ${dumpPath}`);
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
