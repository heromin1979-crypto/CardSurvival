import fs from 'node:fs';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../js/data/districts.js';
import GameData from '../js/data/GameData.js';
import { PROGRESSION_SUPPLIES } from '../js/data/progressionSupplies.js';
const text=fs.readFileSync('docs/analysis/2026-09-17-progression-regional-proposal.md','utf8');
const format=items=>items.map(item=>`${item.definitionId} ×${item.qty}`).join(', ');
const rows=[];
for(const [id,d] of Object.entries(DISTRICTS)) {
 const name=id==='junggoo'?'중구':d.name.replace(/구$/,'');
 const cols=text.split('\n').find(line=>line.startsWith('| '+name+' ')).split('|').map(col=>col.trim());
 d.explorationYields.forEach((reward,index)=>{
  const proposed=[...cols[index+2].split(' + ')[0].matchAll(/(\w+) (\d+)/g)].map(m=>({definitionId:m[1],qty:+m[2]}));
  assert.deepEqual(reward.items,proposed,`${id}:${reward.at}`);
  const uses=reward.items.map(item=>({item:item.definitionId,recipes:Object.values(GameData.blueprints).filter(recipe=>recipe.stages?.some(stage=>stage.requiredItems?.some(input=>input.definitionId===item.definitionId))).map(recipe=>({id:recipe.id,inputs:recipe.stages.flatMap(stage=>stage.requiredItems??[]).filter(input=>input.definitionId===item.definitionId)}))}));
  rows.push({districtId:id,at:reward.at,claimKey:`${id}:${reward.id}:${reward.version}`,proposed,actual:reward.items,discovery:reward.discovery??null,purpose:reward.purpose,uses});
 });
}
assert.equal(rows.length,75);
const lines=['# 작업5 75행 실제 대조 및 공급 목록','','재생성: `node tools/audit-regional-progression.mjs`. 제안의 25×3 묶음과 최종 데이터를 직접 비교해 75행 일치를 assert한다. 모든 수량은 제안 초기값을 유지했으며 전체 캠페인 실측 최적값으로 해석하지 않는다.','','| 구·임계값 | 제안 | 적용 | 차이 | 발견 공급처 |','|---|---|---|---|---|',...rows.map(row=>`| ${row.districtId} ${row.at}% | ${format(row.proposed)} | ${format(row.actual)} | 없음 | ${row.discovery??'—'} |`),'','## 실제 소비 최소 단위와 수량 판단','','- wrap_bandage: 천조각2→붕대2. 동작/강남30% 천조각4는 두 번 제작분이며 첫 환자 초기 붕대 지급을 대신하지 않는다.','- extract_copper_wire: 기판1; extract_microchip: 기판2+유리1. 용산30% 기판1은 추출 한 공정, 60% 기판2는 칩 추출 한 공정에 대응한다. 구로·용산 유한 초기 공급 각3묶음과 최초 장소기판2는 원래 경로로 유지한다.','- assemble_circuit_module: microchip2+wire2+plastic1; build_generator_core: electric_motor1+circuit_module1+refined_metal2. 보상에는 이 완제품을 넣지 않아 추가 투입과 공정이 남는다.','- 약초밭 흙3+약초종자2, 채소밭 흙4+채소종자2, 곡물밭 흙5+곡물종자3가 최종 청사진의 최소 단위다. 강동60/100%, 동작/관악/은평100%, 양천/노원/중구100% 묶음은 해당 흙·종자 쌍과 일치하고 판자·도구 등은 별도다.','- craft_large_cloth: cloth2+thread2. 동대문30% cloth3+thread2는 한 공정분이다. 완제품 large_cloth 일반드랍은 원료로 교체했다.','- project-region-demands.json의 배타적인 직업·분기 합계로 드랍량을 맞추지 않았다. 반복 발전은 fuel_can1→지역운영3회이며 용산·성동·은평에서 고철4→연료1,2TP,재고2/72TP 경로를 100% 이전에도 제공한다.','','## 25구 발견과 초기·연료 공급','','| 공급 ID | 구 | 조건 | 정책·재고·주기 | 산출 | 대가·시간 | 계절 |','|---|---|---|---|---|---|---|',...Object.entries(PROGRESSION_SUPPLIES).map(([id,s])=>`| ${id} | ${s.districtId} | ${s.discoveryRequired?'100%':'탐사도 무관'} | ${s.type}/${s.capacity}/${s.restockTP??'재생없음'}TP | ${format(s.items)} | ${format(s.costs??[])||'물품대가없음'} / ${s.tpCost}TP | ${s.seasons?.join(',')??'사계절'} |`)];
fs.writeFileSync('docs/analysis/progression-execution/task-5-regional-comparison.md',lines.join('\n')+'\n');
fs.writeFileSync('docs/analysis/progression-execution/task-5-regional-comparison.json',JSON.stringify({rows,supplies:PROGRESSION_SUPPLIES},null,2)+'\n');
console.log(`75행 일치 / ${Object.keys(PROGRESSION_SUPPLIES).length} 공급 / 발견 ${Object.values(PROGRESSION_SUPPLIES).filter(s=>s.discoveryRequired).length}`);


