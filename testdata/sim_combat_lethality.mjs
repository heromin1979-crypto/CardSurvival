#!/usr/bin/env node
// === 적별 치사율 분석 시뮬레이션 ===
// node testdata/sim_combat_lethality.mjs

const ENEMIES = {
  zombie_common:  { name: '감염 좀비',     dmg:[8,15],   acc:0.60, atkPR:1, def:0, infChance:0.20, bleed:null,          onHit:null,                  special:null },
  zombie_runner:  { name: '러너 좀비',     dmg:[12,20],  acc:0.75, atkPR:1, def:0, infChance:0.30, bleed:{dmg:3,dur:3},  onHit:null,                  special:null },
  zombie_brute:   { name: '거대 좀비',     dmg:[20,35],  acc:0.55, atkPR:1, def:3, infChance:0.40, bleed:null,          onHit:null,                  special:{dmg:[30,45],acc:0.55,cooldown:3,stunChance:0.5} },
  zombie_horde:   { name: '좀비 무리',     dmg:[6,12],   acc:0.65, atkPR:2, def:0, infChance:0.30, bleed:null,          onHit:null,                  special:null },
  zombie_acid:    { name: '특수 감염자',   dmg:[8,14],   acc:0.72, atkPR:1, def:0, infChance:0.45, bleed:null,          onHit:{infection:15,rad:8},   special:{type:'acid_burn',dmg:5,dur:2,infPerRound:5} },
  rabid_dog:      { name: '광견병 걸린 개', dmg:[10,18],  acc:0.80, atkPR:2, def:0, infChance:0.35, bleed:{dmg:4,dur:2},  onHit:{infection:8},         special:null },
  raider:         { name: '약탈자',        dmg:[14,22],  acc:0.68, atkPR:1, def:2, infChance:0,    bleed:null,          onHit:null,                  special:null },
  raider_elite:   { name: '정예 약탈자',   dmg:[18,28],  acc:0.72, atkPR:1, def:4, infChance:0,    bleed:null,          onHit:null,                  special:{dmg:[25,40],acc:0.72,cooldown:3,stunChance:0.3} },
};

// 캐릭터별 스탯 (시뮬레이션: 군인 기준)
const CHARACTERS = {
  soldier:    { name: '군인 (강민준)',      hp:110, defBonus:0.24, acc:0.82, dmg:[14,28], hasWeapon:true },
  doctor:     { name: '의사 (이지수)',      hp: 95, defBonus:0.08, acc:0.65, dmg:[8,16],  hasWeapon:true },
  firefighter:{ name: '소방관 (박영철)',    hp:120, defBonus:0.16, acc:0.78, dmg:[12,25], hasWeapon:true },
  homeless:   { name: '노숙인 (최형식)',    hp: 65, defBonus:0.08, acc:0.58, dmg:[7,14],  hasWeapon:false },
};

const NUM_SIMS = 10000;

function rand(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function simOneCombat(char, enemy) {
  let hp = char.hp;
  let infection = 0;
  let bleedTurns = 0;
  let bleedDmg = 0;
  let acidTurns = 0;
  let stunned = false;
  let specialCd = 0;

  const enemyHpMax = rand(enemy.hp?.[0] ?? enemy.dmg[0], enemy.hp?.[1] ?? enemy.dmg[1]);
  // 적 HP는 별도 정의가 없으면 dmg range로 대체 (단순화)
  const ENEMY_HP = {
    zombie_common:25+Math.floor(Math.random()*16), zombie_runner:18+Math.floor(Math.random()*11),
    zombie_brute:60+Math.floor(Math.random()*31),  zombie_horde:80+Math.floor(Math.random()*41),
    zombie_acid:28+Math.floor(Math.random()*18),   rabid_dog:20+Math.floor(Math.random()*16),
    raider:35+Math.floor(Math.random()*21),        raider_elite:55+Math.floor(Math.random()*26),
  };

  let enemyId = Object.keys(ENEMIES).find(k => ENEMIES[k] === enemy);
  let enemyHp = ENEMY_HP[enemyId] ?? 40;

  let rounds = 0;
  const MAX_ROUNDS = 30;

  while (hp > 0 && enemyHp > 0 && rounds < MAX_ROUNDS) {
    rounds++;

    // ── 플레이어 공격 ─────────────────────────
    if (!stunned) {
      if (Math.random() < char.acc) {
        const dmg = rand(char.dmg[0], char.dmg[1]);
        enemyHp -= Math.max(1, dmg - enemy.def);
      }
    }
    stunned = false;

    if (enemyHp <= 0) break;

    // ── 특수 스킬 (브루트 강타 / 엘리트 정조준) ──
    if (enemy.special && specialCd <= 0) {
      if (enemy.special.type === 'acid_burn') {
        // 산성 화상은 onHit에서 처리
      } else {
        if (Math.random() < enemy.special.acc) {
          const sdmg = rand(enemy.special.dmg[0], enemy.special.dmg[1]);
          const reduced = Math.max(1, Math.floor(sdmg * (1 - char.defBonus)));
          hp -= reduced;
          if (Math.random() < (enemy.special.stunChance ?? 0)) stunned = true;
        }
        specialCd = enemy.special.cooldown ?? 3;
      }
    }
    if (specialCd > 0) specialCd--;

    // ── 적 기본 공격 ──────────────────────────
    for (let a = 0; a < enemy.atkPR; a++) {
      if (hp <= 0) break;
      if (Math.random() < enemy.acc) {
        const dmg = rand(enemy.dmg[0], enemy.dmg[1]);
        const reduced = Math.max(1, Math.floor(dmg * (1 - char.defBonus)));
        hp -= reduced;

        // 출혈 부여
        if (enemy.bleed && Math.random() < 0.5) {
          bleedTurns = Math.max(bleedTurns, enemy.bleed.dur);
          bleedDmg   = enemy.bleed.dmg;
        }
        // onHit 감염
        if (enemy.onHit?.infection) infection += enemy.onHit.infection;

        // 산성 화상
        if (enemy.special?.type === 'acid_burn' && Math.random() < 0.5) {
          acidTurns = Math.max(acidTurns, enemy.special.dur);
        }

        // 기본 infectionChance
        if (Math.random() < enemy.infChance) infection += 5;
      }
    }

    // ── DoT 처리 ─────────────────────────────
    if (bleedTurns > 0) { hp -= bleedDmg; bleedTurns--; }
    if (acidTurns > 0)  { hp -= enemy.special.dmg; infection += (enemy.special.infPerRound ?? 0); acidTurns--; }
    if (infection >= 100) { hp = 0; break; } // 패혈증
  }

  return {
    survived: hp > 0,
    hpLeft: Math.max(0, hp),
    infection: Math.min(100, infection),
    rounds,
    killedByDoT: hp <= 0 && enemyHp > 0, // DoT에 의한 사망 추정
  };
}

// ── 분석 실행 ─────────────────────────────────────────────────
const lines = [];
lines.push('╔══════════════════════════════════════════════════════════════════════════╗');
lines.push('║              적별 치사율 분석 (캐릭터×적 10,000회 시뮬레이션)           ║');
lines.push('╚══════════════════════════════════════════════════════════════════════════╝');
lines.push('');

// ── 1. DPS 이론치 ─────────────────────────────────────────────
lines.push('══ 1. 적별 이론 DPS 분석 ═══════════════════════════════════════════════════');
lines.push('');
lines.push(`  ${'적'.padEnd(16)} ${'평균 데미지'.padStart(10)} ${'명중률'.padStart(7)} ${'공격/라운드'.padStart(10)} ${'라운드DPS'.padStart(10)} ${'DoT'.padStart(8)} ${'감염률'.padStart(7)}`);
lines.push('  ' + '─'.repeat(73));

const dpsData = {};
for (const [id, e] of Object.entries(ENEMIES)) {
  const avgDmg = (e.dmg[0] + e.dmg[1]) / 2;
  const dps = avgDmg * e.acc * e.atkPR;
  let dotDesc = '-';
  if (e.bleed) dotDesc = `출혈${e.bleed.dmg}×${e.bleed.dur}`;
  else if (e.special?.type === 'acid_burn') dotDesc = `산성${e.special.dmg}×${e.special.dur}`;
  const infPct = Math.round(e.infChance * 100);
  dpsData[id] = dps;
  lines.push(
    `  ${e.name.padEnd(16)} ` +
    `${((e.dmg[0]+e.dmg[1])/2).toFixed(1).padStart(10)} ` +
    `${(e.acc*100).toFixed(0).padStart(6)}% ` +
    `${String(e.atkPR).padStart(10)} ` +
    `${dps.toFixed(1).padStart(10)} ` +
    `${dotDesc.padStart(8)} ` +
    `${(infPct+'%').padStart(7)}`
  );
}
lines.push('');
lines.push('  ※ DPS = 평균피해 × 명중률 × 공격횟수/라운드');
lines.push('');

// ── 2. 캐릭터별 치사율 ────────────────────────────────────────
lines.push('══ 2. 캐릭터별 × 적별 전사율 (10,000회) ════════════════════════════════════');
lines.push('');

const charKillMatrix = {}; // charId → enemyId → deathRate

for (const [charId, char] of Object.entries(CHARACTERS)) {
  charKillMatrix[charId] = {};
  for (const [eid, enemy] of Object.entries(ENEMIES)) {
    let deaths = 0, totalHpLeft = 0, totalInf = 0, totalRounds = 0;
    for (let i = 0; i < NUM_SIMS; i++) {
      const r = simOneCombat(char, enemy);
      if (!r.survived) deaths++;
      totalHpLeft += r.hpLeft;
      totalInf    += r.infection;
      totalRounds += r.rounds;
    }
    charKillMatrix[charId][eid] = {
      deathRate: deaths / NUM_SIMS,
      avgHpLeft: totalHpLeft / NUM_SIMS,
      avgInf:    totalInf / NUM_SIMS,
      avgRounds: totalRounds / NUM_SIMS,
    };
  }
}

// 캐릭터별 표 출력
for (const [charId, char] of Object.entries(CHARACTERS)) {
  lines.push(`  ── ${char.name} (HP ${char.hp}) ──`);
  lines.push(`  ${'적'.padEnd(16)} ${'전사율'.padStart(7)} ${'평균잔여HP'.padStart(10)} ${'평균감염'.padStart(9)} ${'평균라운드'.padStart(10)}`);
  lines.push('  ' + '─'.repeat(56));
  const sorted = Object.entries(charKillMatrix[charId]).sort((a,b) => b[1].deathRate - a[1].deathRate);
  for (const [eid, data] of sorted) {
    const pct = (data.deathRate * 100).toFixed(1);
    const danger = data.deathRate >= 0.30 ? '🔴' : data.deathRate >= 0.10 ? '🟡' : '🟢';
    lines.push(
      `  ${danger} ${ENEMIES[eid].name.padEnd(14)} ` +
      `${(pct+'%').padStart(7)} ` +
      `${data.avgHpLeft.toFixed(1).padStart(10)} ` +
      `${data.avgInf.toFixed(1).padStart(9)} ` +
      `${data.avgRounds.toFixed(1).padStart(10)}`
    );
  }
  lines.push('');
}

// ── 3. 위험도 종합 순위 (4캐릭터 평균) ───────────────────────
lines.push('══ 3. 위험도 종합 순위 (4캐릭터 평균 전사율) ═══════════════════════════════');
lines.push('');
const avgKillByEnemy = {};
for (const eid of Object.keys(ENEMIES)) {
  const avg = Object.values(charKillMatrix).reduce((s, cData) => s + cData[eid].deathRate, 0) / Object.keys(CHARACTERS).length;
  avgKillByEnemy[eid] = avg;
}
const rankedEnemies = Object.entries(avgKillByEnemy).sort((a,b) => b[1]-a[1]);
lines.push(`  ${'순위'.padEnd(5)} ${'적'.padEnd(16)} ${'평균 전사율'.padStart(11)} ${'DPS'.padStart(8)} ${'주요 위협'.padStart(16)}`);
lines.push('  ' + '─'.repeat(62));
rankedEnemies.forEach(([eid, rate], i) => {
  const e = ENEMIES[eid];
  let threat = '';
  if (e.bleed) threat = '출혈 DoT';
  else if (e.special?.type === 'acid_burn') threat = '산성화상+감염';
  else if (e.atkPR === 2) threat = '2회 연속 공격';
  else if (e.special) threat = '특수 스킬';
  else threat = '고명중률';
  const bar = '█'.repeat(Math.round(rate * 30));
  lines.push(
    `  ${String(i+1)+'위'.padEnd(5)} ` +
    `${e.name.padEnd(16)} ` +
    `${((rate*100).toFixed(1)+'%').padStart(11)} ` +
    `${dpsData[eid].toFixed(1).padStart(8)} ` +
    `${threat.padStart(16)}`
  );
});
lines.push('');

// ── 4. 노이즈별 적 그룹 위험도 ────────────────────────────────
lines.push('══ 4. 구역 위험도(DL)별 조우 시 예상 피해 (군인 기준) ═════════════════════');
lines.push('');
const ENCOUNTER_TABLES = {
  1: [{id:'zombie_common',w:65},{id:'rabid_dog',w:20},{id:'zombie_runner',w:10},{id:'zombie_acid',w:5}],
  2: [{id:'zombie_common',w:30},{id:'zombie_runner',w:25},{id:'raider',w:20},{id:'rabid_dog',w:15},{id:'zombie_acid',w:10}],
  3: [{id:'zombie_runner',w:20},{id:'zombie_common',w:15},{id:'zombie_brute',w:15},{id:'zombie_acid',w:15},{id:'raider',w:15},{id:'zombie_horde',w:10},{id:'raider_elite',w:5},{id:'rabid_dog',w:5}],
  4: [{id:'zombie_brute',w:25},{id:'zombie_horde',w:20},{id:'zombie_acid',w:15},{id:'raider_elite',w:15},{id:'zombie_runner',w:15},{id:'raider',w:5},{id:'rabid_dog',w:5}],
  5: [{id:'zombie_brute',w:30},{id:'zombie_horde',w:30},{id:'raider_elite',w:20},{id:'zombie_acid',w:15},{id:'zombie_runner',w:5}],
};

const soldier = CHARACTERS.soldier;
lines.push(`  ${'DL'.padEnd(5)} ${'가중평균 전사율'.padStart(15)} ${'가중평균 DPS'.padStart(13)} ${'최다 출현 적'.padStart(16)}`);
lines.push('  ' + '─'.repeat(55));
for (const [dl, table] of Object.entries(ENCOUNTER_TABLES)) {
  const totalW = table.reduce((s,e) => s+e.w, 0);
  let wDeathRate = 0, wDps = 0, topEnemy = '';
  let maxW = 0;
  for (const entry of table) {
    const w = entry.w / totalW;
    wDeathRate += w * (charKillMatrix.soldier[entry.id]?.deathRate ?? 0);
    wDps       += w * dpsData[entry.id];
    if (entry.w > maxW) { maxW = entry.w; topEnemy = ENEMIES[entry.id].name; }
  }
  const danger = wDeathRate >= 0.25 ? '🔴' : wDeathRate >= 0.10 ? '🟡' : '🟢';
  lines.push(
    `  ${danger} DL${dl.padEnd(3)} ` +
    `${((wDeathRate*100).toFixed(1)+'%').padStart(15)} ` +
    `${wDps.toFixed(1).padStart(13)} ` +
    `${topEnemy.padStart(16)}`
  );
}
lines.push('');

// ── 5. 사망 패턴 분석 (군인) ─────────────────────────────────
lines.push('══ 5. 군인 기준 — 위험 시나리오 요약 ══════════════════════════════════════');
lines.push('');
lines.push('  [즉사 위협 — 단일 전투에서 30%+ 전사율]');
for (const [eid, data] of Object.entries(charKillMatrix.soldier)) {
  if (data.deathRate >= 0.30) {
    lines.push(`    🔴 ${ENEMIES[eid].name}: ${(data.deathRate*100).toFixed(1)}% 전사 | 잔여HP ${data.avgHpLeft.toFixed(0)} | 평균 ${data.avgRounds.toFixed(1)} 라운드`);
  }
}
lines.push('');
lines.push('  [누적 위협 — 감염률 높은 적 (onHit 감염)]');
for (const [eid, e] of Object.entries(ENEMIES)) {
  if (e.infChance >= 0.35 || e.onHit?.infection) {
    const inf = charKillMatrix.soldier[eid].avgInf.toFixed(1);
    lines.push(`    🟡 ${e.name}: 조우당 평균 감염 +${inf} | infChance ${(e.infChance*100).toFixed(0)}%${e.onHit?.infection ? ` + 명중 시 추가 +${e.onHit.infection}` : ''}`);
  }
}
lines.push('');

const output = lines.join('\n');
import { writeFileSync } from 'fs';
writeFileSync('testdata/sim_combat_lethality_result.txt', output, 'utf-8');
console.log(output);
console.log('\n결과 저장: testdata/sim_combat_lethality_result.txt');
