import fs from 'node:fs';
import ITEMS from '../js/data/items.js';
import NPCS from '../js/data/npcs.js';
import PATIENTS from '../js/data/patientPool.js';
import QUESTS from '../js/data/mainQuests/index.js';
import LANDMARKS from '../js/data/landmarks.js';
import ENEMIES from '../js/data/secretEnemies.js';
import EVENTS from '../js/data/secretEvents.js';
import COMBINATIONS from '../js/data/secretCombinations.js';
import { INTERACTION_RULES } from '../js/data/interactions.js';

const targets = ['rotor_blade','generator_core','circuit_module','electric_motor','copper_coil','circuit_board','fuel_can','water_filter','salt','soil_bag','herb_seed','grain_seed','vegetable_seed','purified_medicine','concentrated_serum','electronic_parts','wire','battery','wood','rope','cloth','bandage','antiseptic','herb','scrap_metal'];
const records = Object.fromEntries(targets.map(id => [id, []]));
function add(kind, source, rows, gates = {}) {
  for (const item of rows ?? []) {
    const id = item.definitionId ?? item.id ?? item.itemId;
    if (records[id]) records[id].push({ kind, source, item, ...gates });
  }
}
for (const [id, item] of Object.entries(ITEMS)) add('분해', id, item.dismantle);
for (const [id, npc] of Object.entries(NPCS)) {
  for (const [index, trade] of (npc.trades ?? []).entries()) add('NPC 교환', `${id}:${index}`, [trade.receive], { cost: trade.give });
  add('NPC 신뢰 선물', id, npc.gifts);
  add('NPC 수집', id, npc.forageItems);
  for (const event of npc.trustEvents ?? []) add('NPC 신뢰 이벤트', `${id}:${event.id}`, event.effect?.giveItems, { trust: event.trust });
  for (const quest of npc.quests ?? []) add('NPC 의뢰', `${id}:${quest.id}`, quest.reward?.items);
}
for (const [id, patient] of Object.entries(PATIENTS)) {
  for (const contribution of [patient.contributionOnCure, ...(patient.altContributions ?? [])].filter(Boolean)) {
    add('완치 즉시 기여', `${id}:${contribution.type}`, contribution.immediate);
    add('완치 파견', id, contribution.dispatch?.yield, { intervalDays: contribution.dispatch?.intervalDays, maxRuns: contribution.dispatch?.maxRuns });
    add('완치 후원', id, contribution.recurring?.items, { intervalDays: contribution.recurring?.intervalDays, maxCount: contribution.recurring?.maxCount });
  }
}
for (const [id, quest] of Object.entries(QUESTS)) add('메인 퀘스트', id, quest.reward?.items, { characterId: quest.characterId, prerequisite: quest.prerequisite });
for (const [id, enemy] of Object.entries(ENEMIES)) add('비밀 적 전리품', id, enemy.lootTable);
for (const event of EVENTS) for (const choice of event.choices ?? []) for (const [index, outcome] of (choice.outcomes ?? []).entries()) add('비밀 이벤트', `${event.id}:${choice.id}:${index}`, outcome.effects?.items, { triggerConditions: event.triggerConditions, choiceConditions: choice.conditions, weight: outcome.weight });
for (const combo of COMBINATIONS) if (typeof combo.result?.spawnItem === 'string') add('비밀 조합', combo.id, [{ id: combo.result.spawnItem, qty: combo.result.spawnQty ?? 1 }], { input: combo.source, target: combo.target, extra: combo.additionalReq, skill: combo.requiredSkill, consumes: combo.result });
for (const rule of INTERACTION_RULES) {
  const source = rule.apply?.toString() ?? '';
  for (const match of source.matchAll(/(?:transformSrc|transformTgt|spawnItem):\s*'([^']+)'/g)) add('상호작용 정적 출력 후보', rule.id, [{ id: match[1] }], { input: rule.source, target: rule.target, note: '함수의 문자열 리터럴만 추출. 실행 조건·수량·소비는 해당 apply와 런타임 검사 필요.' });
}
for (const [id, landmark] of Object.entries(LANDMARKS)) {
  add('로비 드랍', id, landmark.lootTable);
  add('로비 첫방문', id, landmark.firstEnterReward?.items);
  for (const sub of landmark.subLocations ?? []) {
    add('세부장소 드랍', `${id}:${sub.id}`, sub.lootTable);
    add('세부장소 첫방문', `${id}:${sub.id}`, sub.firstEnterReward?.items);
  }
}
const out = { scope: '최종 병합 정의의 명시적 산출 필드만 집계. 일반 지역/확정보상/새 공급처는 작업5 별도. 확률은 실제 종합확률이 아니며 경로의 자연 도달가능성을 보증하지 않음. 동적 함수 산출은 별도 확인 필요.', records };
fs.writeFileSync('docs/analysis/progression-execution/task-5-alternative-sources.json', JSON.stringify(out,null,2)+'\n');
console.log(Object.entries(records).map(([id, entries])=>`${id}: ${entries.length}`).join('\n'));
