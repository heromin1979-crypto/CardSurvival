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

const PORT = 43555;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// 무기 축 — null은 맨손. 탄약은 def.combat.requiresAmmo에서 자동 파생.
const WEAPONS = [null, 'knife', 'reinforced_bat', 'machete', 'pistol', 'rifle'];

// 조우 축 — ids가 있으면 고정 편성, dangerLevel이면 인카운터 테이블 롤.
const ENCOUNTERS = [
  { key: 'DL1 조우 롤', dangerLevel: 1 },
  { key: 'DL3 조우 롤', dangerLevel: 3 },
  { key: 'DL5 조우 롤', dangerLevel: 5 },
  { key: '거대 좀비 단독', ids: ['zombie_brute'] },
  { key: '약탈자 2인조', ids: ['raider', 'raider_elite'] },
];

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
async function simulateCell(page, weaponId, encounter, runs) {
  return page.evaluate(async ({ weaponId, encounter, runs }) => {
    const gs = window.GameState;
    const CS = window.CombatSystem;
    const SM = window.StateMachine;
    const skillsSnapshot = JSON.stringify(gs.skills ?? null);

    const stats = {
      wins: 0, defeats: 0, fleds: 0, stuck: 0,
      totalRounds: 0, totalHpLoss: 0, totalStress: 0, samples: 0,
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
      if (gs.noise) gs.noise.level = 0;
      if (skillsSnapshot) gs.skills = JSON.parse(skillsSnapshot);
      gs.combatRespawn = gs.combatRespawn ?? {};
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
      while (gs.combat?.active && guard++ < 120) {
        if (gs.combat.phase !== 'await_ally_input') {
          CS.processUntilAllyTurn();
          continue;
        }
        const active = gs.combat.combatants?.[gs.combat.activeCombatantId];
        const dmgSkill = (active?.skillIds ?? [])
          .map(id => gs.combat.skillsById[id])
          .find(s => (s?.effects ?? []).some(e => e.type === 'damage'));
        const target = Object.values(gs.combat.combatants ?? {})
          .find(c => c.side === 'enemy' && !c.dead && (c.hp ?? 0) > 0
            && CS._validateRankedSkillPosition(active.id, c.id, dmgSkill)?.ok);
        if (!dmgSkill) break;
        if (!target) {
          // 사거리 밖 — 이동 시도 후 재개
          const moved = CS.useActiveSkillByEffect('move');
          if (!moved?.ok) break;
          continue;
        }
        CS.selectSkill(dmgSkill.id);
        CS.selectTarget(target.id);
        const result = CS.confirmAction();
        if (!result?.ok && !result?.turnConsumed) break;
      }

      const outcome = gs.combat?.outcome ?? null;
      if (outcome === 'victory') stats.wins++;
      else if (outcome === 'defeat') stats.defeats++;
      else if (outcome === 'fled') stats.fleds++;
      else { stats.stuck++; if (gs.combat) gs.combat.active = false; }

      stats.totalRounds += gs.combat?.roundNumber ?? 0;
      stats.totalHpLoss += Math.max(0, 100 - (gs.player.hp?.current ?? 0));
      stats.totalStress += gs.combat?.combatants?.player?.stress ?? 0;
      stats.samples++;
    }

    cleanupBoard();
    return stats;
  }, { weaponId, encounter, runs });
}

function formatRow(weaponLabel, stats) {
  const pct = value => `${Math.round((value / Math.max(1, stats.samples)) * 100)}%`;
  const avg = value => (value / Math.max(1, stats.samples)).toFixed(1);
  return `| ${weaponLabel} | ${pct(stats.wins)} | ${pct(stats.defeats)} | ${avg(stats.totalRounds)} | ${avg(stats.totalHpLoss)} | ${avg(stats.totalStress)} |${stats.stuck > 0 ? ` ⚠ stuck ${stats.stuck}` : ''}`;
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
    for (const encounter of ENCOUNTERS) {
      const rows = [];
      for (let w = 0; w < WEAPONS.length; w++) {
        const stats = await simulateCell(page, WEAPONS[w], encounter, RUNS_PER_CELL);
        rows.push(formatRow(weaponLabels[w], stats));
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
      `> 조건: 플레이어 단독(동료 없음), HP 100, 사기 50(normal), 소음 0, 스킬 레벨 초기화, 무기 매 전투 새 인스턴스`,
      '',
      ...sections,
      '## 해석 가이드',
      '',
      '- 목표 지표(마스터플랜): DL1 90%+, DL3 동티어 60~75%, DL5/보스급 40~60%, 평균 4~7라운드.',
      '- `stuck`은 유효 행동을 찾지 못해 중단된 런 — AI 드라이버 한계이며 밸런스 문제와 구분할 것.',
      '',
    ].join('\n');

    await mkdir(path.dirname(OUT_PATH), { recursive: true });
    await writeFile(OUT_PATH, report, 'utf8');
    console.log(`report written: ${OUT_PATH}`);
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
