import fs from 'node:fs';
import assert from 'node:assert/strict';
import G from '../js/core/GameState.js';
import E from '../js/core/EventBus.js';
import CharCreate from '../js/screens/CharCreate.js';
import {CHARACTERS} from '../js/data/characters.js';
import Data from '../js/data/GameData.js';
import Projects from '../js/data/careerProjects.js';
import Career from '../js/systems/CareerProjectSystem.js';
import Patient from '../js/systems/PatientTreatmentSystem.js';
import NPCS from '../js/data/npcs.js';
import Craft from '../js/systems/CraftSystem.js';
import Explore from '../js/systems/ExploreSystem.js';
import Stat from '../js/systems/StatSystem.js';
import Hidden from '../js/systems/HiddenElementSystem.js';
import Rest from '../js/screens/Rest.js';
import Night from '../js/systems/NightSystem.js';
import StateMachine from '../js/core/StateMachine.js';
import Board from '../js/board/BoardManager.js';
import {LEVEL_XP_TABLE} from '../js/data/skillDefs.js';
globalThis.window={};globalThis.requestAnimationFrame=fn=>fn();
globalThis.document={getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
Career.init();Stat.init();Night.init();
let run;
const originalLog=console.log;console.log=()=>{};
const rows=[];
const targets={doctor:'patient_lee_junho_16',homeless:'homeless_storage',soldier:'soldier_relay',firefighter:'fire_access',chef:'chef_pantry',engineer:'engineer_power'};
function add(id,qty=1){const c=G.createCardInstance(id,{quantity:qty});assert(c,id);G.placeCardInRow(c.instanceId,Data.items[id].type==='structure'?'middle':'bottom');run.fixtureItems.push({id,qty});}
function act(kind,id,fn){const tp=G.time.totalTP;const result=fn();run.actions.push({kind,id,tp:G.time.totalTP-tp,result});return result;}
function save(){const before=JSON.stringify({project:G.flags.careerProjects,patients:G.npcs.states,claims:G.flags.explorationSupply});G.deserialize(G.serialize());assert.equal(JSON.stringify({project:G.flags.careerProjects,patients:G.npcs.states,claims:G.flags.explorationSupply}),before);run.saveChecks++;}
function craft(id,quantity=1){for(let i=0;i<quantity;i++){const output=Data.blueprints[id].output[0].definitionId;let attempts=0;while(attempts++<8){if(!Night.canActAtNight('craft').allowed)act('rest','sleep',()=>{StateMachine.transition('rest');Rest._doRest({id:'sleep',tpCost:8,effect:{fatigue:-80,stamina:70,hp:30}});});if(!Night.canActAtNight('craft').allowed){attempts--;continue;}Hidden._checkRecipeUnlocks();assert(G.flags.hiddenRecipesUnlocked.includes(id)||!Data.blueprints[id].hidden,`locked:${id}`);const count=G.countOnBoard(output);const check=Craft.canStartBlueprint(id);assert(check.ok,check.reason);act('craft',id,()=>Craft.startBlueprint(id));if(G.countOnBoard(output)>count)break;assert(attempts<8,`failed:${id}`);}}}
for(const char of CHARACTERS)for(const winter of [false,true])for(const adverse of [false,true]){
 let seed=adverse?19:20260920;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 run={character:char.id,target:targets[char.id],season:winter?'winter-day271':'spring-day30',rng:adverse?'lcg19-second-sample-not-worst-case':'lcg20260920',fixtureItems:[],fixtureSkills:{},actions:[],saveChecks:0};
 CharCreate._selectedChar=char;CharCreate._selectedDistrict=char.homeDist;G.ui.currentState='char_create';CharCreate._startGame(char.name);G.time.day=winter?271:30;
 G.cards={};G.board={top:Array(5).fill(null),environment:Array(5).fill(null),middle:Array(27).fill(null),bottom:Array(20).fill(null)};G.pendingLoot=[];
 G.location.currentLandmark=null;G.location.currentSubLocation=null;G.ui.currentState='main';
 const target=targets[char.id],def=Projects[target];G.location.currentDistrict=def?.districtId??'dongjak';
 if(def){G.quests.active=[{id:def.questId,progress:0,startDay:G.time.day,startTP:0}];for(const id of def.requires??[])G.flags.careerProjects.projects[id]={projectId:id,active:true,installedInputs:{},uses:0};}
 function skill(id,level){G.player.skills[id].level=level;G.player.skills[id].xp=LEVEL_XP_TABLE[level];run.fixtureSkills[id]=level;}
 if(char.id==='doctor'){
   G.npcs.states[target]={spawned:true,dismissed:false,woundLevel:NPCS[target].woundLevel,hp:100,trust:0};
   add('medical_station');add('campfire');add('rice',4);add('purified_water',8);add('salt',4);add('boiled_water');skill('cooking',2);
   craft('cook_rice_porridge');
   for(const action of ['diagnose','hydrate','nutrition','recover']){assert(act('treatment',action,()=>Patient.treat(target,action)).ok);save();}
   run.complete=G.npcs.states[target].healed;
 }else{
   if(char.id==='soldier'){
     add('scrap_metal',3);add('wire',4);add('battery');G.location.currentDistrict='yongsan';assert(act('supply','yongsan_recovery',()=>Explore.useSupply('yongsan_recovery')).ok);for(const id of [...G.board.middle].filter(Boolean))Board.moveCard(id,'bottom',G.board.bottom.indexOf(null));act('travel','jongno',()=>Explore.travelToDistrict('jongno'));const recovered=act('recovery','copper_coil',()=>Career.recover(target,'copper_coil'));assert(recovered.ok,recovered.reason);
   }
   if(char.id==='firefighter'){skill('crafting',1);add('rope',8);add('wood',12);add('crowbar');craft('make_rope_ladder');}
   if(['homeless','chef'].includes(char.id)){skill('building',1);add('wood',15);add('nail',20);if(char.id==='homeless')add('rope',2);else{add('kitchen_knife');add('salt',2);}craft('storage_box');}
   if(char.id==='engineer'){
     skill('crafting',8);add('field_forge');add('workbench');add('copper_wire',36);add('scrap_metal',30);add('wire',10);add('spring',5);
     assert(act('supply','yongsan_recovery',()=>Explore.useSupply('yongsan_recovery')).ok);craft('wind_copper_coil',3);craft('build_electric_motor');assert(act('supply','yongsan_fuel',()=>Explore.useSupply('yongsan_fuel')).ok);
   }
   for(const a of def.actions){assert(act('project',a.id,()=>Career.contribute(target,a.id)).ok);save();}
   assert(act('project','activate',()=>Career.activate(target)).ok);save();run.complete=G.flags.careerProjects.projects[target].active;
   if(char.id==='engineer'){run.powerBefore=G.flags.careerProjects.districtPower.yongsan;G.quests.completed.push('mq_eng_02');assert(act('operation','engineer_workbench',()=>Career.operate('engineer_workbench')).ok);save();run.powerAfter=G.flags.careerProjects.districtPower.yongsan;}
 }
 run.tp=G.time.totalTP;run.endStats={hydration:G.stats.hydration.current,nutrition:G.stats.nutrition.current,fatigue:G.stats.fatigue.current};rows.push(run);
}
console.log=originalLog;fs.writeFileSync('docs/analysis/progression-execution/task-6-middle-traces.json',JSON.stringify({scope:'Prepared middle stage fixture, including listed tools/materials/skills, predecessor activation and target quest. No initial-to-middle campaign or acquisition claim. Real craft/supply/recovery/patient/project APIs and TP stats. Two seeds are sample variation, not adverse guarantee.',rows},null,2));console.log(rows.map(r=>({job:r.character,season:r.season,seed:r.rng,tp:r.tp,complete:r.complete,saves:r.saveChecks})));
