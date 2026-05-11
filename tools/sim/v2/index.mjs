#!/usr/bin/env node
// === Sim v2 entry ===
// CLI: node tools/sim/v2/index.mjs [--char <id>] [--runs <n>] [--seed <n>]
//
// PR1 phase: incomplete (no game systems). 프레임워크 검증용.
// PR2~PR4에서 systemBootstrap·reporters·drift 추가 후 baseline 라벨 부여 가능.

import { installGlobalShim } from './mocks/globalShim.mjs';
import { listCharacterIds, buildCharacterConfig } from './characterAdapter.mjs';
import { runBatch } from './runner.mjs';
import { summarizeAll } from './reporters/index.mjs';

installGlobalShim();

function parseArgs(argv) {
  const args = { char: null, runs: 1, seed: 0, list: false, info: false };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--char')      args.char = argv[++i];
    else if (a === '--runs') args.runs = Number(argv[++i]);
    else if (a === '--seed') args.seed = Number(argv[++i]);
    else if (a === '--list') args.list = true;
    else if (a === '--info') args.info = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);

  if (args.list) {
    console.log('Available characters:');
    for (const id of listCharacterIds()) {
      const cc = buildCharacterConfig(id);
      console.log(`  ${id.padEnd(12)} ${cc.name.padEnd(8)} HP ${cc.maxHp}  STA ${cc.stamina}  start ${cc.startDistrict}`);
    }
    return;
  }

  if (args.info) {
    if (!args.char) {
      console.error('--info requires --char <id>');
      process.exit(1);
    }
    const cc = buildCharacterConfig(args.char);
    console.log(JSON.stringify(cc, null, 2));
    return;
  }

  if (!args.char) {
    console.error('usage: index.mjs --char <id> [--runs n] [--seed n]');
    console.error('       index.mjs --list');
    console.error('       index.mjs --info --char <id>');
    process.exit(1);
  }

  const traces = runBatch({ characterId: args.char, runs: args.runs, seedBase: args.seed });
  const kpi = summarizeAll(traces);

  const out = {
    schemaVersion: 2,
    buildTag: 'sim-v2-PR3',
    phase: 'incomplete',
    incompleteMarker: 'PR3 framework + reporters wired. runner는 systemBootstrap 미연결 (PR4에서). baseline 라벨은 PR4 후.',
    character: args.char,
    runs: traces,
    kpi,
  };

  console.log(JSON.stringify(out, null, 2));
}

main();
