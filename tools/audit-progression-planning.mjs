import fs from 'node:fs';
import { DISTRICTS } from '../js/data/districts.js';
import LANDMARKS from '../js/data/landmarks.js';
import ITEMS from '../js/data/items.js';
import BASE from '../js/data/blueprints.js';
import ADV from '../js/data/blueprints_advanced.js';
import HIDDEN from '../js/data/hiddenRecipes.js';
import QUESTS from '../js/data/mainQuests/index.js';

const recipes = Object.values({ ...BASE, ...ADV, ...HIDDEN });
const producers = new Map();
const consumers = new Map();
for (const r of recipes) {
  for (const o of r.output ?? []) {
    if (!producers.has(o.definitionId)) producers.set(o.definitionId, []);
    producers.get(o.definitionId).push(r.id);
  }
  for (const id of new Set(r.stages.flatMap(s => s.requiredItems.map(i => i.definitionId)))) {
    if (!consumers.has(id)) consumers.set(id, []);
    consumers.get(id).push(r.id);
  }
}
const name = id => `${ITEMS[id]?.name ?? id} (${id})`;
const amount = e => e.qty ?? `${e.minQty ?? 1}~${e.maxQty ?? e.minQty ?? 1}`;
const entries = es => (es ?? []).map(e => `${name(e.definitionId ?? e.id)} ×${amount(e)}`).join('、');
const lines = ['# 제작·지역 수급 전수 데이터 — 2026-09-17', '',
  '> 재생성: `node tools/audit-progression-planning.mjs`。 현재 데이터 스냅샷이며 개선안과 구분한다. 제작 가능 항목은 원재료가 아니라는 뜻이 아니며, 수급 확률은 실제 조우·고갈·보너스를 합산한 실측값이 아니다.', '',
  `청사진 ${recipes.length}개 / 의료 카테고리 ${recipes.filter(r => r.category === 'medical').length}개 / 지역 ${Object.keys(DISTRICTS).length}개.`, '',
  '## 25개 구의 일반 드랍과 확정 보상', '',
  '| 지역·위험도 | 일반 드랍 (가중치) | 30% | 60% | 100% |', '|---|---|---|---|---|'];
for (const d of Object.values(DISTRICTS)) lines.push(`| ${d.name} / ${d.dangerLevel} | ${d.lootTable.map(e => `${name(e.definitionId)}:${e.weight}`).join('、')} | ${[30,60,100].map(at => entries(d.explorationYields?.find(y => y.at === at)?.items)).join(' | ')} |`);
lines.push('', '## 확정 보상별 제작·소비처', '', '| 지역·탐색도 | 보상 | 제작 경로 | 청사진 소비처 |', '|---|---|---|---|');
for (const d of Object.values(DISTRICTS)) for (const y of d.explorationYields ?? []) for (const i of y.items) lines.push(`| ${d.name} ${y.at}% | ${entries([i])} | ${(producers.get(i.definitionId) ?? []).join(', ') || '청사진 없음'} | ${(consumers.get(i.definitionId) ?? []).join(', ') || '청사진 소비 없음; 사용/교환 별도 확인'} |`);
lines.push('', '## 의료 제작 전체', '', '| 청사진 | 출력 | 투입 | 설비 | 스킬 |', '|---|---|---|---|---|');
for (const r of recipes.filter(r => r.category === 'medical')) lines.push(`| ${r.id} | ${entries(r.output)} | ${entries(r.stages.flatMap(s => s.requiredItems))} | ${(r.requiredTools ?? []).join(', ')} | ${JSON.stringify(r.requiredSkills ?? {})} |`);
lines.push('', '## 직업별 퀘스트 목표 분포', '', '| 직업 | 퀘스트 수 | 목표 유형 |', '|---|---|---|');
for (const c of ['doctor','soldier','firefighter','chef','engineer','homeless']) {
  const qs = Object.values(QUESTS).filter(q => q.characterId === c);
  const types = {};
  for (const q of qs) types[q.objective?.type] = (types[q.objective?.type] ?? 0) + 1;
  lines.push(`| ${c} | ${qs.length} | ${JSON.stringify(types)} |`);
}
lines.push('', '## 랜드마크·세부장소 드랍 전체', '', '> 구 탐색도와 별도 경로. 랜드마크 로비와 세부장소의 재고 처리는 서로 다르다.', '', '| 장소 키 | 계층 | 드랍 (가중치) |', '|---|---|---|');
let locations = 0;
for (const [key,lm] of Object.entries(LANDMARKS)) {
  for (const [id,kind,table] of [[key,'랜드마크',lm.lootTable], ...(lm.subLocations ?? []).map(s => [s.id,'세부장소',s.lootTable])]) {
    if (!table?.length) continue;
    locations++;
    lines.push(`| ${id} | ${kind} | ${table.map(e => `${name(e.id ?? e.definitionId)}:${e.weight}`).join('、')} |`);
  }
}
const target = 'docs/analysis/2026-09-17-progression-data-audit.md';
fs.mkdirSync('docs/analysis', { recursive: true });
fs.writeFileSync(target, lines.join('\n') + '\n');
console.log(JSON.stringify({ target, recipes: recipes.length, medicalRecipes: recipes.filter(r => r.category === 'medical').length, districts: Object.keys(DISTRICTS).length, guaranteedTiers: Object.values(DISTRICTS).reduce((n,d) => n + (d.explorationYields?.length ?? 0),0), lootLocations: locations }));
