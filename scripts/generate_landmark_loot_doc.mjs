// 랜드마크 세부장소(sublocation) lootTable 문서 생성기
// 실행: node scripts/generate_landmark_loot_doc.mjs
// 출력: docs/analysis/LANDMARK_LOOT_TABLE.md
//
// 추측 배제: js/data/landmarks.js의 LANDMARK_DATA와 js/data/items.js의 한글 이름을
// 실제 import하여 가중치/확률을 계산한다.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const lmMod = await import('../js/data/landmarks.js');
const itemMod = await import('../js/data/items.js');
const distMod = await import('../js/data/districts.js');

const LANDMARK_DATA = lmMod.LANDMARK_DATA ?? lmMod.default;
const ITEMS = itemMod.ITEMS ?? itemMod.default ?? itemMod.items;
const DISTRICTS = distMod.DISTRICTS ?? distMod.default ?? distMod.districts;

const itemName = (id) => ITEMS[id]?.name ?? `(미정의: ${id})`;
const districtName = (id) => DISTRICTS?.[id]?.name ?? id;

// 기대 등장 확률: lootCount [min,max] 픽 중 해당 아이템이 최소 1번 등장할 확률 평균
// p = weight/totalWeight, E = (Σ_{k=min..max} 1-(1-p)^k) / (max-min+1)
function expectedAppear(p, minCount, maxCount) {
  let sum = 0;
  const n = maxCount - minCount + 1;
  for (let k = minCount; k <= maxCount; k++) sum += 1 - Math.pow(1 - p, k);
  return sum / n;
}

const pct = (x) => `${(x * 100).toFixed(2)}%`;

// 랜드마크 소속 구 판정
function ownerDistrict(key, lm) {
  if (key === 'hangang') return '공용 (한강 인접 구 전체)';
  if (Array.isArray(lm.districts) && lm.districts.length) return lm.districts.map(districtName).join('·');
  if (DISTRICTS?.[key]) return districtName(key);
  const stripped = key.replace(/^lm_/, '');
  if (DISTRICTS?.[stripped]) return districtName(stripped);
  return null;
}

// 전투/구출 랜드마크 판정
function isCombat(lm) {
  return !!(lm.dangerLevel || lm.rescueNpcId || lm.enemyCount || lm.hasBoss || lm.hasLeader);
}

function subLocBlock(sub) {
  const lines = [];
  const [minC, maxC] = sub.lootCount ?? [1, 3];
  const total = (sub.lootTable ?? []).reduce((s, e) => s + e.weight, 0);
  const flags = [];
  if (sub.isFishing) flags.push('🎣 낚시 가능');
  if (sub.firstEnterReward) {
    const rw = sub.firstEnterReward.items.map(it => `${itemName(it.id)}×${it.qty ?? 1}`).join(', ');
    flags.push(`🎁 첫 진입 1회: ${rw} (claimKey: \`${sub.firstEnterReward.claimKey ?? sub.id}\`)`);
  }

  lines.push(`##### ${sub.icon ?? ''} ${sub.name} \`${sub.id}\``);
  lines.push('');
  lines.push(`> ${sub.desc ?? ''}`);
  lines.push('');
  lines.push(`- **위험 가중(dangerMod):** +${((sub.dangerMod ?? 0) * 100).toFixed(0)}%`);
  lines.push(`- **루팅 픽 수(lootCount):** ${minC}~${maxC} (재고 baseStock = ${maxC})`);
  lines.push(`- **총 가중치:** ${total}`);
  if (flags.length) lines.push(`- **특수:** ${flags.join(' / ')}`);
  lines.push('');
  lines.push('| 아이템 | weight | 1픽 확률 | 기대 등장(' + minC + '~' + maxC + '픽) |');
  lines.push('|---|---:|---:|---:|');

  const sorted = [...(sub.lootTable ?? [])].sort((a, b) => b.weight - a.weight);
  for (const e of sorted) {
    const p = total > 0 ? e.weight / total : 0;
    const undef = ITEMS[e.id] ? '' : ' ⚠️';
    lines.push(`| **${itemName(e.id)}** \`${e.id}\`${undef} | ${e.weight} | ${pct(p)} | ${pct(expectedAppear(p, minC, maxC))} |`);
  }
  lines.push('');
  return lines.join('\n');
}

// ── 랜드마크 분류 ──
const entries = Object.entries(LANDMARK_DATA)
  .filter(([, lm]) => (lm.subLocations ?? []).length > 0); // basecamp 등 제외

const explore = [];
const combat = [];
for (const [key, lm] of entries) {
  (isCombat(lm) ? combat : explore).push([key, lm]);
}

// ── 메타 요약 테이블 ──
function metaRow(key, lm) {
  const subs = lm.subLocations ?? [];
  const owner = ownerDistrict(key, lm) ?? '—';
  const dmods = subs.map(s => s.dangerMod ?? 0);
  const dmodRange = `${Math.round(Math.min(...dmods) * 100)}~${Math.round(Math.max(...dmods) * 100)}%`;
  const special = [];
  if (lm.dangerLevel) special.push(`전투 Lv.${lm.dangerLevel}`);
  if (lm.enemyCount) special.push(`적 ${lm.enemyCount[0]}~${lm.enemyCount[1]}`);
  if (lm.hasBoss) special.push('보스');
  else if (lm.hasLeader) special.push('리더');
  if (lm.rescueNpcId) special.push('구출');
  if (subs.some(s => s.isFishing)) special.push('낚시');
  if (subs.some(s => s.firstEnterReward)) special.push('1회보상');
  return `| **${lm.name}** \`${key}\` | ${owner} | ${subs.length} | ${dmodRange} | ${special.join(', ') || '-'} |`;
}

// ── 문서 조립 ──
const out = [];
out.push('# 랜드마크 세부장소 드랍 아이템 및 확률');
out.push('');
out.push('> **출처:** `js/data/landmarks.js` (LANDMARK_DATA)');
out.push('> **추첨 로직:** `js/systems/ExploreSystem.js` (`_generateSubLocationLoot`, `_grantFirstEnterReward`)');
out.push('> **생성 스크립트:** `scripts/generate_landmark_loot_doc.mjs`');
out.push('');
out.push('---');
out.push('');
out.push('## 1. 드랍 시스템 동작 방식');
out.push('');
out.push('랜드마크 진입 후 세부 장소(sublocation)를 탐색하면 `_generateSubLocationLoot(sub)`가 호출된다.');
out.push('');
out.push('1. 세부 장소별 `lootCount` `[min,max]` 범위에서 픽 수를 균등 추첨한다.');
out.push('2. 각 픽마다 `weight / totalWeight` 비율로 항목 1개(수량 1 고정)를 추출한다.');
out.push('3. 추출 항목의 정의가 없으면 해당 픽은 스킵된다.');
out.push('');
out.push('### 구 표면 탐색과의 결정적 차이');
out.push('');
out.push('| 항목 | 구 표면 (`generateDistrictLoot`) | 랜드마크 세부장소 (`_generateSubLocationLoot`) |');
out.push('|---|---|---|');
out.push('| 재획득 | 탐색할 때마다 반복 | **첫 방문 1회만** (`subLocationsLooted`에 기록, 리스폰 없음) |');
out.push('| 픽 수 | 1~3 고정 | 세부장소별 `lootCount` |');
out.push('| 재고 | 없음 | **W3-2 재고 시스템** — `lootCount[1]`(max)을 baseStock으로 두고 루팅 수만큼 차감, `stockRatio`로 픽 수 보정 |');
out.push('| 수량 | `[minQty,maxQty]` | 픽당 1개 고정 |');
out.push('| 1회 보상 | 없음 | `firstEnterReward` (캐릭터당 1회 자동 지급) |');
out.push('');
out.push('> ⚠️ **기대 등장(min~max픽)** = `(Σ_{k=min..max} 1-(1-p)^k) / (max-min+1)`. 재고가 가득 찬 첫 방문 기준이며, 재고 소진 시 실제 픽 수는 줄어든다.');
out.push('');
out.push('---');
out.push('');
out.push('## 2. 랜드마크 메타 요약');
out.push('');
out.push('### 일반 탐색 랜드마크');
out.push('');
out.push('| 랜드마크 | 소속 구 | 세부장소 | dangerMod 범위 | 특수 |');
out.push('|---|---|---:|---:|---|');
for (const [key, lm] of explore) out.push(metaRow(key, lm));
out.push('');
out.push('### 전투·구출·인프라 랜드마크');
out.push('');
out.push('| 랜드마크 | 소속 구 | 세부장소 | dangerMod 범위 | 특수 |');
out.push('|---|---|---:|---:|---|');
for (const [key, lm] of combat) out.push(metaRow(key, lm));
out.push('');
out.push('---');
out.push('');
out.push('## 3. 일반 탐색 랜드마크 상세');
out.push('');
for (const [key, lm] of explore) {
  const owner = ownerDistrict(key, lm);
  out.push(`### ${lm.icon ?? ''} ${lm.name} \`${key}\`${owner ? ` — ${owner}` : ''}`);
  out.push('');
  out.push(`> ${lm.desc ?? ''}`);
  out.push('');
  for (const sub of lm.subLocations) out.push(subLocBlock(sub));
}
out.push('---');
out.push('');
out.push('## 4. 전투·구출·인프라 랜드마크 상세');
out.push('');
out.push('> 이 랜드마크들은 퀘스트(구출/인프라 재건)와 연동되며 적이 주둔한다. 모든 세부 장소를 처리한 뒤 `markLandmarkCleared()`로 완료된다.');
out.push('');
for (const [key, lm] of combat) {
  const owner = ownerDistrict(key, lm);
  const meta = [];
  if (lm.dangerLevel) meta.push(`위험도 Lv.${lm.dangerLevel}`);
  if (lm.enemyCount) meta.push(`적 ${lm.enemyCount[0]}~${lm.enemyCount[1]}`);
  if (lm.enemyType) meta.push(`유형 ${lm.enemyType}`);
  if (lm.hasBoss) meta.push('보스 주둔');
  else if (lm.hasLeader) meta.push('리더 주둔');
  if (lm.rescueNpcId) meta.push(`구출 대상 \`${lm.rescueNpcId}\``);
  out.push(`### ${lm.icon ?? ''} ${lm.name} \`${key}\`${owner ? ` — ${owner}` : ''}`);
  out.push('');
  out.push(`> ${lm.desc ?? ''}`);
  out.push('');
  if (meta.length) out.push(`- **전투 메타:** ${meta.join(' / ')}`);
  out.push('');
  for (const sub of lm.subLocations) out.push(subLocBlock(sub));
}
out.push('---');
out.push('');
out.push('## 5. `firstEnterReward` 1회 한정 보상 목록');
out.push('');
out.push('| 랜드마크 | 세부장소 | 보상 | claimKey |');
out.push('|---|---|---|---|');
for (const [key, lm] of entries) {
  for (const sub of lm.subLocations) {
    if (!sub.firstEnterReward) continue;
    const rw = sub.firstEnterReward.items.map(it => `${itemName(it.id)}×${it.qty ?? 1}`).join(', ');
    out.push(`| ${lm.name} | ${sub.name} | ${rw} | \`${sub.firstEnterReward.claimKey ?? sub.id}\` |`);
  }
}
out.push('');
out.push('> 동일 `claimKey`를 공유하는 세부장소는 합산 1회만 지급된다 (예: 한강 낚시터·강변 → 어느 쪽이든 첫 진입 시 낚싯대 1회).');
out.push('');

const target = resolve(ROOT, 'docs/analysis/LANDMARK_LOOT_TABLE.md');
writeFileSync(target, out.join('\n'), 'utf8');

// 검증용 통계 출력
let subCount = 0, undefRefs = [];
for (const [, lm] of entries) {
  for (const sub of lm.subLocations) {
    subCount++;
    for (const e of (sub.lootTable ?? [])) if (!ITEMS[e.id]) undefRefs.push(e.id);
  }
}
console.log(`WROTE ${target}`);
console.log(`landmarks=${entries.length} (explore=${explore.length}, combat=${combat.length}) sublocations=${subCount}`);
console.log(`undefined item refs: ${undefRefs.length ? undefRefs.join(', ') : 'none'}`);
