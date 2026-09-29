import { writeFile } from 'node:fs/promises';
import BASE from '../js/data/blueprints.js';
import ADV from '../js/data/blueprints_advanced.js';
import HIDDEN from '../js/data/hiddenRecipes.js';
import ITEMS from '../js/data/items.js';

const recipes = Object.values({ ...BASE, ...ADV, ...HIDDEN });
const targets = ['bandage', 'sterile_kit', 'surgical_anesthetic', 'broad_antibiotic', 'purified_medicine', 'plague_vaccine', 'water_filter', 'copper_coil', 'circuit_module', 'electric_motor', 'generator_core', 'reinforced_fabric'];
const producers = new Map();
for (const recipe of recipes) for (const output of [].concat(recipe.output ?? [])) {
  if (!producers.has(output.definitionId)) producers.set(output.definitionId, []);
  producers.get(output.definitionId).push({ recipe, output });
}
function add(target, source) {
  for (const [id, qty] of Object.entries(source)) target[id] = (target[id] ?? 0) + qty;
}
const unresolved = new Set();
function expand(id, quantity = 1, ancestors = []) {
  if (ancestors.includes(id)) { unresolved.add(`순환 재료: ${[...ancestors, id].join(' → ')}`); return null; }
  const candidates = producers.get(id) ?? [];
  if (!candidates.length) return { tp: 0, depth: 0, batches: 0, leaves: { [id]: quantity }, tools: [], skills: {}, chain: [] };
  const options = [];
  for (const { recipe, output } of candidates) {
    const batches = Math.ceil(quantity / (output.qty ?? 1));
    const result = { tp: 0, depth: 1, batches, leaves: {}, tools: [...(recipe.requiredTools ?? [])], skills: { ...recipe.requiredSkills }, chain: [recipe.id] };
    let supported = true;
    const inputs = {};
    for (const stage of recipe.stages ?? []) {
      result.tp += (stage.tpCost ?? 0) * batches;
      for (const item of stage.requiredItems ?? []) {
        if (!item.definitionId || !Number.isFinite(item.qty)) { unresolved.add(`지원하지 않는 재료 형식: ${recipe.id}`); supported = false; break; }
        inputs[item.definitionId] = (inputs[item.definitionId] ?? 0) + item.qty * batches;
      }
    }
    for (const [input, qty] of Object.entries(inputs)) {
      const child = expand(input, qty, [...ancestors, id]);
      if (!child) { supported = false; break; }
      result.tp += child.tp;
      result.depth = Math.max(result.depth, child.depth + 1);
      result.batches += child.batches;
      add(result.leaves, child.leaves);
      result.tools.push(...child.tools);
      result.chain.push(...child.chain);
      for (const [skill, level] of Object.entries(child.skills)) result.skills[skill] = Math.max(result.skills[skill] ?? 0, level);
    }
    if (supported) options.push(result);
  }
  options.sort((a, b) => a.tp - b.tp || a.batches - b.batches);
  const result = options[0];
  if (!result) return null;
  result.tools = [...new Set(result.tools)];
  result.chain = [...new Set(result.chain)];
  return result;
}
const results = targets.filter(id => ITEMS[id]).map(id => {
  unresolved.clear();
  const result = expand(id);
  return { id, name: ITEMS[id].name, ...result, unresolved: result ? [] : [...unresolved] };
});
const lines = [
  '# 제작 체인의 정적 비용 확인', '',
  '재생성: `node tools/analyze-progression-costs.mjs`.', '',
  '이 표는 실제 플레이 기록이 아니다. 각 목표 1개를 만드는 청사진 재료 트리를 펼치고, 순환을 제외한 후보 중 명시된 제작 TP 합이 작은 경로를 선택한다. 도구 건설·이동·조우·숙련 상승·날씨·연료 유지비·비밀 조합·분해·거래는 비용에 포함하지 않는다. 부산물과 남은 중간재를 다른 분기에서 재사용하지 않아 전체 경제의 최적해도 아니다. 제작 경로가 없는 물품은 공급 경로가 필요한 말단으로 표시한다.', '',
  '| 목표 | 최장 재료 가공 단계 | 제작 배치 | 명시 제작 TP | 스킬 상한 | 필요한 도구 |',
  '|---|---:|---:|---:|---|---|',
];
for (const r of results) lines.push(`| ${r.name} (${r.id}) | ${r.depth ?? '계산 불가'} | ${r.batches ?? '-'} | ${r.tp ?? '-'} | ${JSON.stringify(r.skills ?? {})} | ${(r.tools ?? []).join(', ')} |`);
for (const r of results) lines.push('', `## ${r.name}`, '', `경로: ${(r.chain ?? []).join(' → ') || '청사진 없음/계산 불가'}`, '', `외부 공급이 필요한 말단: ${Object.entries(r.leaves ?? {}).map(([id, qty]) => `${ITEMS[id]?.name ?? id} (${id}) ×${qty}`).join(', ')}`, ...(r.unresolved.length ? ['', '자동 계산 제외 사유(실제 공급 불가능을 뜻하지 않음):', ...r.unresolved.map(reason => `- ${reason}`)] : []));
await writeFile('docs/analysis/2026-09-17-progression-crafting-costs.md', lines.join('\n') + '\n');
console.log(JSON.stringify(results.map(({ id, depth, tp, batches }) => ({ id, depth, tp, batches }))));
