import fs from 'node:fs';
import GameState from '../js/core/GameState.js';
import EventBus from '../js/core/EventBus.js';
import StateMachine from '../js/core/StateMachine.js';
import CharCreate from '../js/screens/CharCreate.js';
import Rest from '../js/screens/Rest.js';
import { CHARACTERS } from '../js/data/characters.js';
import { DISTRICTS } from '../js/data/districts.js';
import GameData from '../js/data/GameData.js';
import PROJECTS from '../js/data/careerProjects.js';
import ExploreSystem from '../js/systems/ExploreSystem.js';
import StatSystem from '../js/systems/StatSystem.js';
import NightSystem from '../js/systems/NightSystem.js';
import QuestSystem from '../js/systems/QuestSystem.js';
import Career from '../js/systems/CareerProjectSystem.js';
import Patient from '../js/systems/PatientTreatmentSystem.js';
import Craft from '../js/systems/CraftSystem.js';
import Encumbrance from '../js/systems/EncumbranceSystem.js';
import Ecology from '../js/systems/EcologySystem.js';
import Skill from '../js/systems/SkillSystem.js';
import Board from '../js/board/BoardManager.js';
import Hidden from '../js/systems/HiddenElementSystem.js';
import Dismantle from '../js/systems/DismantleSystem.js';
import Dialogues from '../js/systems/CareerDialogueSystem.js';
import { LANDMARK_DATA } from '../js/data/landmarks.js';

globalThis.window = {};
globalThis.document = {getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
globalThis.requestAnimationFrame = fn => fn();
const targets = {doctor: 'npc_wounded_soldier', homeless: 'homeless_reclaim', soldier: 'soldier_radio', firefighter: 'fire_relief', chef: 'chef_first_meal', engineer: 'engineer_workbench'};
const midTargets = {doctor:'patient_lee_junho_16',homeless:'homeless_storage',soldier:'soldier_relay',firefighter:'fire_access',chef:'chef_pantry',engineer:'engineer_power'};
const results = [];
const economic = process.argv.includes('--economic');
const rawMeal = process.argv.includes('--raw-meal');
const loseWorkbench = process.argv.includes('--lose-workbench');
const earlyDialogue = process.argv.includes('--early-dialogues');
const arrival = ExploreSystem._arriveAtDistrict;
if(economic){for(const d of Object.values(DISTRICTS))d.encounterChance=0;for(const lm of Object.values(LANDMARK_DATA))for(const sl of lm.subLocations??[])sl.dangerMod=0;Hidden.checkBossSpawn=()=>false;}
let record;
const originalLog = console.log;
console.log = () => {};
EventBus.on('notify', e => { if(record) record.messages.push(e.message); });
EventBus.on('openingScene', e => e.onChoice?.('treat'));
for (const system of [StatSystem,NightSystem,QuestSystem,Career,Encumbrance,Ecology,Skill]) system.init();
if (earlyDialogue) Dialogues.init();
EventBus.on('tpAdvance',()=>Hidden._checkRecipeUnlocks());
const snapshot = () => ({tp:GameState.time.totalTP,day:GameState.time.day,hp:GameState.player.hp.current,hydration:GameState.stats.hydration.current,nutrition:GameState.stats.nutrition.current,fatigue:GameState.stats.fatigue.current,stamina:GameState.stats.stamina.current,infection:GameState.stats.infection.current,radiation:GameState.stats.radiation.current,temperature:GameState.stats.temperature.current,weightPct:GameState.player.encumbrance.weightPct,district:GameState.location.currentDistrict,alive:GameState.player.isAlive});
const inventory = () => GameState.getBoardCards().map(c=>({id:c.definitionId,qty:c.quantity??1}));
function action(kind,id,fn) { const before=snapshot(); const result=fn(); const after=snapshot(); record.actions.push({kind,id,before,after,result}); record.tp[kind]=(record.tp[kind]??0)+after.tp-before.tp; return result; }
function path(from,to) {const queue=[[from]],seen=new Set();while(queue.length){const p=queue.shift(),last=p.at(-1);if(last===to)return p.slice(1);if(seen.has(last))continue;seen.add(last);for(const n of DISTRICTS[last].adjacentDistricts)queue.push([...p,n]);}return [];}
function pickUseful() {for(const id of [...GameState.board.middle]){const c=GameState.cards[id];if(!c)continue;const def=GameData.items[c.definitionId];if(['location','npc','structure','environment'].includes(def?.type))continue;const slot=GameState.board.bottom.indexOf(null);if(slot<0)break;action('pickup',c.definitionId,()=>Board.moveCard(id,'bottom',slot));}}
function carryMeal(){for(const id of [...GameState.board.middle]){const c=GameState.cards[id];if(c?.definitionId!=='garden_salad')continue;let slot=GameState.board.bottom.indexOf(null);if(slot<0)slot=GameState.board.bottom.findIndex(id=>['wood','vitamins','gauze','empty_can','empty_bottle'].includes(GameState.cards[id]?.definitionId));if(slot>=0)action('pickup','garden_salad-priority-swap',()=>Board.moveCard(id,'bottom',slot));}}
function maintain(){
  for(const [stat,ids,threshold] of [['hydration',['water_bottle','purified_water','boiled_water'],70],['nutrition',['canned_food','energy_bar','instant_noodles'],25]]){
    if(GameState.stats[stat].current<threshold){const c=GameState.getBoardCards().find(c=>ids.includes(c.definitionId));if(c)action('consume',c.definitionId,()=>StatSystem.consumeCard(c.instanceId));}
  }
  if(GameState.stats.hydration.current<45){const c=GameState.getBoardCards().find(c=>c.definitionId==='contaminated_water');if(c)action('consume','contaminated_water-emergency',()=>StatSystem.consumeCard(c.instanceId));}
  if(GameState.stats.morale.current<25)action('rest','meditate',()=>{StateMachine.transition('rest');Rest._doRest({id:'meditate',tpCost:2,effect:{morale:20,fatigue:-10,stamina:15}});});
  if(GameState.stats.stamina.current<20||GameState.stats.fatigue.current>65||!NightSystem.canActAtNight('explore').allowed){
    action('rest','sleep',()=>{StateMachine.transition('rest');Rest._doRest({id:'sleep',tpCost:8,effect:{fatigue:-80,stamina:70,hp:30}});});
  }
}
function tryCraft(id){const bp=GameData.blueprints[id];if(!bp)return false;let entry=GameState.crafting.activeQueue.find(e=>e.blueprintId===id);if(entry?.awaitingNext)return action('craft',id+':next',()=>Craft.advanceCraftStage(entry.craftCardId));if(bp.hidden&&!GameState.flags.hiddenRecipesUnlocked?.includes(id))return false;if(!Craft.canStartBlueprint(id).ok)return false;action('craft',id,()=>Craft.startBlueprint(id));entry=GameState.crafting.activeQueue.find(e=>e.blueprintId===id);if(entry?.awaitingNext)action('craft',id+':next',()=>Craft.advanceCraftStage(entry.craftCardId));return true;}
function prepareFire() {
  if (GameState.countOnBoard('campfire')) return false;
  if (tryCraft('campfire')) return true;
  for (const [id, qty, recipes] of [['wood_plank',3,['make_wood_plank']],['kindling',3,['make_kindling']],['tinder_bundle',1,['make_tinder_from_leaves','make_tinder_from_grass']],['fire_ember',1,['make_fire_by_friction']],['flame_token',1,['make_ember_to_flame']]]) {
    if (GameState.countOnBoard(id)<qty) for(const recipe of recipes) if(tryCraft(recipe)) return true;
  }
  const salvage=GameState.getBoardCards().find(c=>['broken_chair','collapsed_shelf','tree_log','withered_tree','rubble_pile','weed_patch'].includes(c.definitionId) && (GameData.items[c.definitionId]?.dismantle??[]).some(o=>['wood','pebble','dry_wood_stick','dry_leaves'].includes(o.definitionId)) && Dismantle.canDismantleNow(c.instanceId).ok);
  return salvage ? action('dismantle',salvage.definitionId,()=>Dismantle.dismantle(salvage.instanceId)) : false;
}
for(const char of CHARACTERS) for(const winter of [false,true]) for(const adverse of [false,true]){
 if(rawMeal&&char.id!=='chef')continue;
 if(loseWorkbench&&(char.id!=='engineer'||winter))continue;
 let seed=20260920; Math.random=(!economic&&adverse)?()=>0.99:()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 let failedSearches=economic&&adverse?3:0;
 ExploreSystem._arriveAtDistrict=function(...args){if(failedSearches>0){failedSearches--;record.messages.push('경제시험 외생조건: 첫3회 탐색 수확과 탐사도 미발생');return;}return arrival.apply(this,args);};
 record={character:char.id,season:winter?'winter-date-fixture':'spring-new-game',rng:adverse?(economic?'first-three-empty-then-lcg':'constant-0.99-stress'):'lcg-20260920',target:targets[char.id],midTarget:midTargets[char.id],tp:{},actions:[],messages:[],firstComplete:false};
 CharCreate._selectedChar=char;CharCreate._selectedDistrict=char.homeDist;GameState.ui.currentState='char_create';CharCreate._startGame(char.name);
 if(winter)GameState.time.day=271;
 record.start=snapshot();record.startItems=inventory();record.startSkills=structuredClone(GameState.player.skills);
 if(rawMeal){for(const id of ['chef_meal_kit','hearty_stew']){const c=GameState.getBoardCards().find(c=>c.definitionId===id);if(c)action('consume',id+'-exclude-starting-meal',()=>StatSystem.consumeCard(c.instanceId));}}
 const target=targets[char.id];const project=PROJECTS[target];
 if (earlyDialogue) {
   const choices = { doctor: 'assess', soldier: 'detour', firefighter: 'detour', homeless: 'trade', chef: 'concentrate', engineer: 'bypass' };
   action('dialogue', char.id+'_core', () => Dialogues.choose(char.id+'_core', choices[char.id]));
   const life = Dialogues.list().find(t => t.kind === 'life');
   const option = life.choices.find(c => !Object.keys(c.costs).length) ?? life.choices[0];
   Dialogues.choose(life.id, option.id);
   action('dialogue-life', option.id, () => Dialogues.perform(life.id));
 }
 if(economic&&project&&!earlyDialogue){GameState.quests.active=[{id:project.questId,progress:0,startDay:GameState.time.day,startTP:0,deadline:Infinity}];record.gateFixture='Only target quest access granted; no skipped predecessor rewards, materials, skills or crafted evidence injected; actual initial quest event rewards remain';}
 const needed=project?.actions.flatMap(a=>a.items).map(i=>i.definitionId)??[];
 for(let step=0;step<600&&GameState.time.totalTP<(economic?1000:180);step++){
   if(!GameState.player.isAlive||GameState.player.hp.current<=0){record.stop='death';break;}
   if(['encounter','combat'].includes(GameState.ui.currentState)){record.stop='encounter-requires-combat-policy';break;}
   maintain();
   if (earlyDialogue && !NightSystem.canActAtNight('explore').allowed) continue;
   if (earlyDialogue && !GameState.player.isAlive) { record.stop='death'; break; }
   if (earlyDialogue && ['doctor','soldier','firefighter','homeless','chef'].includes(char.id)) {
     pickUseful();
     const topicId = char.id+'_core';
     if (!Dialogues.inspect(topicId).actionReason) action('dialogue-perform', topicId, () => Dialogues.perform(topicId));
     if (Dialogues.inspect(topicId).state.status === 'completed') { record.firstComplete=true; record.stop='early-dialogue-completed'; break; }
     if (['doctor','firefighter'].includes(char.id)) {
       const patientId = char.id==='doctor' ? 'npc_wounded_soldier' : 'npc_early_resident';
       const info=Patient.inspect(patientId), treatment=info.actions.find(a=>a.ok);
       if (treatment) { action('treatment',patientId,()=>Patient.treat(patientId,treatment.id)); continue; }
       if (tryCraft('bandage')) continue;
     } else {
       if (prepareFire()) continue;
       if (char.id==='chef' && tryCraft('cook_rice')) continue;
       if (tryCraft('make_boiled_water')) continue;
     }
     const before=GameState.time.totalTP; action('explore',char.homeDist,()=>ExploreSystem.exploreCurrentDistrict());
     if (before===GameState.time.totalTP) { record.stop='action-blocked'; break; }
     continue;
   }
   if(!NightSystem.canActAtNight('explore').allowed)continue;
   if(char.id==='doctor'){
     const state=Patient.inspect(target), choice=state.actions.find(a=>a.ok);
     if(choice)action('treatment',choice.id,()=>Patient.treat(target,choice.id));
     else {record.stop=state.reason??state.actions.map(a=>a.reason).join(';');break;}
     if(GameState.npcs.states[target].healed){record.firstComplete=true;record.stop='first-treatment-completed';break;}
     continue;
   }
   if(rawMeal)carryMeal();
   pickUseful();
   if(rawMeal&&!GameState.countOnBoard('garden_salad')){
     if(GameState.countOnBoard('herb')>=3&&GameState.countOnBoard('wild_berry')>=2){if(tryCraft('cook_garden_salad'))continue;}
     if(GameState.location.currentDistrict!=='gangbuk'){const next=path(GameState.location.currentDistrict,'gangbuk')[0];action('travel',next,()=>ExploreSystem.travelToDistrict(next));continue;}
     action('explore','gangbuk-raw-food',()=>ExploreSystem.exploreCurrentDistrict());continue;
   }
   if(loseWorkbench&&!record.toolLoss&&GameState.countOnBoard('workbench')){
     const c=GameState.getBoardCards().find(c=>c.definitionId==='workbench');record.toolLoss={item:'workbench',before:snapshot()};record.toolLoss.result=action('tool-loss','dismantle-workbench',()=>Dismantle.dismantle(c.instanceId));record.toolLoss.remaining=GameState.countOnBoard('workbench');continue;
   }
   if(economic&&['firefighter','engineer'].includes(char.id)&&!GameState.flags.careerProjects.projects[target]?.installedInputs?.install){
     if (earlyDialogue) {
       const salvage=GameState.getBoardCards().find(c=>['broken_chair','collapsed_shelf','tree_log','withered_tree','destroyed_kiosk'].includes(c.definitionId)&&(GameData.items[c.definitionId]?.dismantle??[]).some(o=>['wood','nail'].includes(o.definitionId)&&GameState.countOnBoard(o.definitionId)<5)&&Dismantle.canDismantleNow(c.instanceId).ok);
       if (salvage) { action('dismantle',salvage.definitionId,()=>Dismantle.dismantle(salvage.instanceId)); continue; }
     }
     const woodNeed=char.id==='engineer'?5:3;
     const queued=GameState.crafting.activeQueue.some(e=>e.blueprintId==='workbench');
     const needsWood=GameState.countOnBoard('wood')<woodNeed&&!GameState.countOnBoard('workbench')&&!queued;
     const needsNails=char.id==='engineer'&&GameState.countOnBoard('nail')<5&&!GameState.countOnBoard('workbench');
     const needsRope=(earlyDialogue||loseWorkbench)&&char.id==='engineer'&&GameState.countOnBoard('rope')<1&&!GameState.countOnBoard('workbench');
     const needsCloth=char.id==='firefighter'&&GameState.countOnBoard('cloth')<2;
     const needsWater=char.id==='firefighter'&&!GameState.countOnBoard('purified_water');
     const waterSources=Object.entries(LANDMARK_DATA).filter(([id])=>DISTRICTS[id]).flatMap(([district,lm])=>(lm.subLocations??[]).filter(sl=>!sl.requiresHiddenLocation&&sl.lootTable?.some(e=>e.id==='purified_water')&&!(GameState.location.subLocationsLooted??[]).some(k=>k.endsWith(':'+sl.id))).map(sl=>({district,id:sl.id}))).sort((a,b)=>path(GameState.location.currentDistrict,a.district).length-path(GameState.location.currentDistrict,b.district).length);
     const source=waterSources[0];
     let destination=needsWood?((GameState.flags.districtExploration?.eunpyeong??0)>=30?'gangbuk':'eunpyeong'):needsNails?(earlyDialogue||record.toolLoss?'yangcheon':'jongno'):needsRope?'seongbuk':needsCloth?'seongbuk':needsWater?(source?.district??'eunpyeong'):project.districtId;
     if(GameState.location.currentDistrict!==destination){const next=path(GameState.location.currentDistrict,destination)[0];action('travel',next,()=>ExploreSystem.travelToDistrict(next));continue;}
     if(needsWater&&!needsWood&&!needsCloth){
       if(!GameState.location.currentLandmark)action('survey','lm_'+destination,()=>ExploreSystem.enterLandmark('lm_'+destination,{autoEnterSub:false}));
       if(source){action('survey',source.id,()=>ExploreSystem.enterSubLocation(destination,source.id));continue;}
       record.stop='water-source-exhausted-policy';break;
     }
     if(needsWood){const timber=GameState.getBoardCards().find(c=>['tree_log','withered_tree','broken_chair'].includes(c.definitionId)&&(GameData.items[c.definitionId]?.dismantle??[]).some(o=>o.definitionId==='wood')&&Dismantle.canDismantleNow(c.instanceId).ok);if(timber){action('dismantle',timber.definitionId+'-wood-recovery',()=>Dismantle.dismantle(timber.instanceId));continue;}}
     if(needsWood||needsNails||needsRope||needsCloth){action('explore',destination,()=>ExploreSystem.exploreCurrentDistrict());continue;}
   }
   if(GameState.location.currentDistrict!==project.districtId){const next=path(GameState.location.currentDistrict,project.districtId)[0];action('travel',next,()=>ExploreSystem.travelToDistrict(next));continue;}
   const inspect=Career.inspect(target);
   for(const a of inspect.actions.filter(a=>a.ok))action('project',a.id,()=>Career.contribute(target,a.id));
   if(Career.inspect(target).canActivate){action('project','activate',()=>Career.activate(target));
     if (earlyDialogue) { const result=action('dialogue-perform',char.id+'_core',()=>Dialogues.perform(char.id+'_core')); record.firstComplete=result.ok; record.stop=result.ok?'early-dialogue-completed':result.reason; }
     else { record.firstComplete=true;record.stop='project-completed'; } break;}
   if(char.id==='engineer'&&tryCraft('workbench'))continue;
   if(economic){
     const required=char.id==='engineer'?['wood','scrap_metal','rope','nail']:needed;
     const salvage=GameState.getBoardCards().find(c=>!required.includes(c.definitionId)&&(GameData.items[c.definitionId]?.dismantle??[]).some(o=>required.includes(o.definitionId)&&GameState.countOnBoard(o.definitionId)<(o.definitionId==='wood'?5:3))&&Dismantle.canDismantleNow(c.instanceId).ok);
     if(salvage)action('dismantle',salvage.definitionId,()=>Dismantle.dismantle(salvage.instanceId));
   }
   if(['homeless','chef'].includes(char.id)&&!GameState.countOnBoard('campfire'))tryCraft('campfire');
   if(char.id==='chef')for(const id of ['cook_rice','cook_noodles','cooked_rice','cooked_noodles'])tryCraft(id);
   const before=GameState.time.totalTP;action('explore',GameState.location.currentDistrict,()=>ExploreSystem.exploreCurrentDistrict());
   if(before===GameState.time.totalTP){record.stop='action-blocked';break;}
 }
 record.stop??='bounded-policy-limit';record.end=snapshot();record.endItems=inventory();record.visited=GameState.location.districtsVisited;record.exploration=structuredClone(GameState.flags.districtExploration??{});record.activeQuests=structuredClone(GameState.quests.active);record.completedQuests=[...GameState.quests.completed];record.projectInspection=project?Career.inspect(target):null;record.midStatus='not-run';results.push(record);
}
console.log=originalLog;
fs.writeFileSync(earlyDialogue ? `docs/analysis/early-interaction-execution/supply-${economic?'economic':'natural'}-traces.json` : 'docs/analysis/progression-execution/task-6-'+(rawMeal?'raw-meal':loseWorkbench?'tool-loss':economic?'economic':'start')+'-traces.json',JSON.stringify({scope:earlyDialogue ? `실제 시작 물자·기술·메인퀘스트 조건·TP 사용. 물자 주입 없음. 겨울은 날짜 fixture. ${economic?'수급 분리 검사: 무작위 전투/보스 제외, 불리 조건은 첫3회 탐색 공백.':'기본 조우 유지: 전투 정책 없이 첫 조우에서 중단. 0.99 고정은 확률적 최악 증명이 아님.'} 전체 캠페인 완주/자연 난수 무조건 성공 주장 아님.` : economic?'Economy phase fixture: actual CharCreate start inventory/skills and TP stats; target quest access only unlocked; random combat/boss excluded; first three searches empty in adverse case then seeded normal; no material injection; no campaign completion claim.':'Actual starts; combat encounter stops rather than suppresses; bounded acquisition policy; no material injection; winter date fixture; fixed 0.99 stress is not a probabilistic worst-case proof; no full campaign claim.',results},null,2));
console.log(results.map(r=>({job:r.character,season:r.season,rng:r.rng,tp:r.end.tp,done:r.firstComplete,stop:r.stop,visited:r.visited.length})));
