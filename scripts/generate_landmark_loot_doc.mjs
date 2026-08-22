// 랜드마크 드랍 문서 생성기 — 랜드마크 자체 lootTable + 세부장소(sublocation) lootTable
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
  // 한강은 접하는 10개 구별로 키가 나뉘어 있다 (hangang_gangnam …)
  const hangang = key.match(/^hangang_(.+)$/);
  if (hangang) return `${districtName(hangang[1])} (한강 접경)`;
  if (Array.isArray(lm.districts) && lm.districts.length) return lm.districts.map(districtName).join('·');
  if (DISTRICTS?.[key]) return districtName(key);
  const stripped = key.replace(/^lm_/, '');
  if (DISTRICTS?.[stripped]) return districtName(stripped);
  if (lm.districtId) return districtName(lm.districtId);
  return null;
}

// 전투/구출 랜드마크 판정
function isCombat(lm) {
  return !!(lm.dangerLevel || lm.rescueNpcId || lm.enemyCount || lm.hasBoss || lm.hasLeader);
}

/** 수량 표기 — rollQty(ExploreSystem.js) 규칙: minQty 없으면 qty ?? 1 고정. */
function qtyText(e) {
  if (!Number.isFinite(e.minQty)) return `${e.qty ?? 1}`;
  const max = Number.isFinite(e.maxQty) ? e.maxQty : e.minQty;
  return e.minQty === max ? `${e.minQty}` : `${e.minQty}~${max}`;
}

/** 가중치 표 1개를 마크다운 표로. 세부장소·랜드마크 자체 표가 같은 형식을 쓴다. */
function lootRows(table, minC, maxC) {
  const lines = [];
  const total = (table ?? []).reduce((s, e) => s + (e.weight ?? 0), 0);
  lines.push(`| 아이템 | weight | 수량 | 1픽 확률 | 기대 등장(${minC}~${maxC}픽) |`);
  lines.push('|---|---:|---:|---:|---:|');
  const sorted = [...(table ?? [])].sort((a, b) => b.weight - a.weight);
  for (const e of sorted) {
    const p = total > 0 ? e.weight / total : 0;
    const undef = ITEMS[e.id] ? '' : ' ⚠️';
    lines.push(`| **${itemName(e.id)}** \`${e.id}\`${undef} | ${e.weight} | ${qtyText(e)} | ${pct(p)} | ${pct(expectedAppear(p, minC, maxC))} |`);
  }
  return lines.join('\n');
}

/**
 * 랜드마크 자체 드랍 표 블록 — 랜드마크 안에서 「탐색」을 눌렀을 때 쓰는 표.
 * 세부장소 표와 별개이고, 반복 탐색으로 매번 다시 굴린다.
 */
function landmarkLootBlock(lm) {
  const lines = [];
  lines.push('#### 🎯 랜드마크 자체 드랍 (`LANDMARK_DATA.<key>.lootTable`)');
  lines.push('');
  if (!(lm.lootTable ?? []).length) {
    lines.push('> 자체 드랍 표 없음 — 랜드마크에서 「탐색」을 눌러도 아무것도 나오지 않는다.');
    lines.push('');
    return lines.join('\n');
  }
  const [minC, maxC] = lm.lootCount ?? [1, 3];
  const total = lm.lootTable.reduce((s, e) => s + (e.weight ?? 0), 0);
  lines.push(`- **루팅 픽 수(lootCount):** ${minC}~${maxC} — 재고·1회 제한 없음(탐색마다 반복)`);
  lines.push(`- **총 가중치:** ${total}`);
  lines.push('');
  lines.push(lootRows(lm.lootTable, minC, maxC));
  lines.push('');
  return lines.join('\n');
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
  lines.push(lootRows(sub.lootTable, minC, maxC));
  lines.push('');
  return lines.join('\n');
}

// ── 랜드마크 분류 ──
const entries = Object.entries(LANDMARK_DATA)
  // 베이스캠프는 탐색 대상이 아니다 — 자체 표가 없고, 코드도 landmarkKey !== 'basecamp'로 제외한다.
  .filter(([key, lm]) => key !== 'basecamp' && (lm.subLocations ?? []).length > 0);

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
out.push('# 랜드마크 드랍 아이템 및 확률 — 자체 표 + 세부장소 표');
out.push('');
out.push('> **출처:** `js/data/landmarks.js` (LANDMARK_DATA — `lootTable`/`lootCount`, `subLocations[].lootTable`/`lootCount`)');
out.push('> **추첨 로직:** `js/systems/ExploreSystem.js` (`rollWeightedLoot`, `_generateLandmarkLoot`, `_generateSubLocationLoot`, `_grantFirstEnterReward`)');
out.push('> **생성 스크립트:** `scripts/generate_landmark_loot_doc.mjs` (데이터 변경 후 재실행하면 이 문서가 갱신된다)');
out.push('');
out.push('---');
out.push('');
out.push('## 1. 드랍 표는 3계층으로 완전히 분리돼 있다');
out.push('');
out.push('탐색 버튼은 하나(`exploreCurrentDistrict`)지만, **어디에 서 있느냐**에 따라 서로 다른 표를 굴린다.');
out.push('세 표는 데이터·코드 모두 분리돼 있어 한쪽을 고쳐도 나머지는 영향을 받지 않는다.');
out.push('');
out.push('| 계층 | 데이터 위치 | 추첨 함수 | 언제 쓰이나 |');
out.push('|---|---|---|---|');
out.push('| **구(표면)** | `districts.js` → `DISTRICTS[구].lootTable` | `generateDistrictLoot` | 구에 서서 탐색 |');
out.push('| **랜드마크 자체** | `landmarks.js` → `LANDMARK_DATA[키].lootTable` | `_generateLandmarkLoot` | 랜드마크 안(세부장소 밖)에서 탐색 |');
out.push('| **세부장소** | `landmarks.js` → `...subLocations[].lootTable` | `_generateSubLocationLoot` | 세부장소에 처음 진입 |');
out.push('');
out.push('### 공통 추첨 절차 (`rollWeightedLoot`)');
out.push('');
out.push('랜드마크 자체 표와 세부장소 표는 **같은 함수**를 쓴다.');
out.push('');
out.push('1. `lootCount` `[min,max]` 범위에서 픽 수를 균등 추첨한다 (세부장소는 여기에 `stockRatio`를 곱한다).');
out.push('2. 각 픽마다 `weight / totalWeight` 비율로 항목 1개를 뽑는다.');
out.push('3. 수량은 `rollQty` — `minQty`가 있으면 `[minQty,maxQty]` 균등, 없으면 `qty ?? 1` 고정.');
out.push('4. `contamChance`가 있으면 그 확률로 오염도 60이 붙는다 (코드는 지원, 현재 데이터에는 미사용).');
out.push('5. 뽑힌 항목의 아이템 정의가 없으면 그 픽은 버려진다 (아래 표의 ⚠️ 항목).');
out.push('');
out.push('### 세 계층의 결정적 차이');
out.push('');
out.push('| 항목 | 구 표면 (`generateDistrictLoot`) | 랜드마크 자체 (`_generateLandmarkLoot`) | 세부장소 (`_generateSubLocationLoot`) |');
out.push('|---|---|---|---|');
out.push('| 재획득 | 탐색할 때마다 반복 | **탐색할 때마다 반복** (제한·재고 없음) | **첫 방문 1회만** (`subLocationsLooted`, 리스폰 없음) |');
out.push('| 픽 수 | 전역 `explore.lootCountMin~Max` (1~3) | 랜드마크별 `lootCount` | 세부장소별 `lootCount` |');
out.push('| 재고 | 없음 | 없음 | **W3-2 재고** — `lootCount[1]`을 baseStock으로 두고 루팅 수만큼 차감, `stockRatio`로 픽 수 보정 |');
out.push('| 수량 | `[minQty,maxQty]` | `[minQty,maxQty]` | `[minQty,maxQty]` |');
out.push('| 자원 레벨(EcologySystem) | 표면 항목(`cls:surface`)에 배율 적용 | **미적용** | 미적용 |');
out.push('| 제철 필터(`seasons`) | 적용 | **미적용** | 미적용 |');
out.push('| 오염 | `contamChance` → 오염 50~100 | `contamChance` → 오염 60 | `contamChance` → 오염 60 |');
out.push('| 도구·특성·스킬 보너스 픽 | 적용 (`exploreBonus`, `scavenger`, `scavenging`, 마스터리, 계절 보너스) | **전부 미적용** | 미적용 |');
out.push('| 구 탐사도 | 1회분 누적 + 임계값 특수자원(`explorationYields`) | **누적 안 함** | 누적 안 함 |');
out.push('| 1회 보상 | 없음 | 없음 | `firstEnterReward` (캐릭터당 1회 자동 지급) |');
out.push('');
out.push('> ⚠️ 랜드마크 안에서 누른 탐색은 **구 자원·구 탐사도를 건드리지 않는다** — 같은 자리에서 구를 반복 채집해 구별 자원 모델을 무의미하게 만드는 것을 막기 위한 설계다 (`ExploreSystem._arriveAtDistrict` 조기 반환).');
out.push('> 대신 소음·방사선·조우·보스 판정과 TP/스태미나 소모는 **서 있는 구의 수치를 그대로** 쓴다. 즉 랜드마크 자체 표는 "1 TP당 무제한 반복 채집"이 가능하니 가중치·수량을 올릴 때 주의한다.');
out.push('> 자체 표가 비어 있으면 「이미 다 뒤졌다」 알림만 뜬다.');
out.push('');
out.push('> **기대 등장(min~max픽)** = `(Σ_{k=min..max} 1-(1-p)^k) / (max-min+1)`. 세부장소는 재고가 가득 찬 첫 방문 기준이며, 재고 소진 시 실제 픽 수는 줄어든다.');
out.push('');
out.push('### 데이터 에디터에서 편집하는 위치');
out.push('');
out.push('| 표 | 에디터 위치 |');
out.push('|---|---|');
out.push('| 구 표면 | **장소** 탭 → 구 선택 → `lootTable (탐색 드랍 가중치)` — 자원(`cls`)·제철(`seasons`)·오염% 열 포함 |');
out.push('| 랜드마크 자체 | **랜드마크** 탭 → 랜드마크 선택 → `lootTable (랜드마크 전용 드랍)` + `lootCount min/max` |');
out.push('| 세부장소 | **세부장소** 탭 → 세부장소 선택 → `lootTable (세부장소 드랍)` + `lootCount min/max` |');
out.push('');
out.push('> 세 표 모두 weight 옆에 실시간 드랍 %가 표시되고, 존재하지 않는 아이템 ID는 빨간 테두리 + 검증 탭에 잡힌다.');
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
out.push('## 3. 랜드마크 자체 드랍 표 한눈에');
out.push('');
out.push('세부장소와 무관하게, 랜드마크 안에서 탐색할 때 나오는 표. 수량은 `weight%×min~max` 표기.');
out.push('');
out.push('| 랜드마크 | 키 | 픽 수 | 항목 (확률×수량) |');
out.push('|---|---|---:|---|');
for (const [key, lm] of entries) {
  const t = lm.lootTable ?? [];
  if (!t.length) {
    out.push(`| ${lm.name} | \`${key}\` | — | **(자체 표 없음)** |`);
    continue;
  }
  const tot = t.reduce((s, e) => s + (e.weight ?? 0), 0);
  const cells = [...t]
    .sort((a, b) => b.weight - a.weight)
    .map(e => `${itemName(e.id)} ${((e.weight / tot) * 100).toFixed(0)}%×${qtyText(e)}`)
    .join(', ');
  out.push(`| ${lm.name} | \`${key}\` | ${(lm.lootCount ?? [1, 3]).join('~')} | ${cells} |`);
}
out.push('');
out.push('---');
out.push('');
out.push('## 4. 일반 탐색 랜드마크 상세');
out.push('');
for (const [key, lm] of explore) {
  const owner = ownerDistrict(key, lm);
  out.push(`### ${lm.icon ?? ''} ${lm.name} \`${key}\`${owner ? ` — ${owner}` : ''}`);
  out.push('');
  out.push(`> ${lm.desc ?? ''}`);
  out.push('');
  out.push(landmarkLootBlock(lm));
  out.push(`#### 세부장소 (${lm.subLocations.length})`);
  out.push('');
  for (const sub of lm.subLocations) out.push(subLocBlock(sub));
}
out.push('---');
out.push('');
out.push('## 5. 전투·구출·인프라 랜드마크 상세');
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
  out.push(landmarkLootBlock(lm));
  out.push(`#### 세부장소 (${lm.subLocations.length})`);
  out.push('');
  for (const sub of lm.subLocations) out.push(subLocBlock(sub));
}
out.push('---');
out.push('');
out.push('## 6. `firstEnterReward` 1회 한정 보상 목록');
out.push('');
out.push('| 랜드마크 | 키 | 세부장소 | 보상 | claimKey |');
out.push('|---|---|---|---|---|');
for (const [key, lm] of entries) {
  for (const sub of lm.subLocations) {
    if (!sub.firstEnterReward) continue;
    const rw = sub.firstEnterReward.items.map(it => `${itemName(it.id)}×${it.qty ?? 1}`).join(', ');
    out.push(`| ${lm.name} | \`${key}\` | ${sub.name} | ${rw} | \`${sub.firstEnterReward.claimKey ?? sub.id}\` |`);
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
