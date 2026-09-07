// 의사 루트 감사: 퀘스트 목표 ↔ 지역 조달 가능성 교차 검증
import { DISTRICTS } from '../js/data/districts.js';
import LANDMARK_DATA from '../js/data/landmarks.js';
import ITEMS from '../js/data/items.js';
import BLUEPRINTS from '../js/data/blueprints.js';

const idOf = e => typeof e === 'string' ? e : (e?.definitionId ?? e?.id ?? e?.itemId);
function collect(node, out = new Set(), d = 0) {
  if (!node || d > 5) return out;
  if (Array.isArray(node)) { for (const e of node) { const i = idOf(e); if (i && ITEMS[i]) out.add(i); if (e && typeof e === 'object') collect(e, out, d+1); } return out; }
  if (typeof node === 'object') { for (const v of Object.values(node)) collect(v, out, d+1); }
  return out;
}
// 제작 산출물 (output 은 배열)
const craft = new Map();
for (const [bid, b] of Object.entries(BLUEPRINTS))
  for (const o of (Array.isArray(b.output) ? b.output : [b.output])) { const i = idOf(o); if (i) if (!craft.has(i)) craft.set(i, bid); }

const districtDrops = id => { const d = DISTRICTS[id]; return d ? collect([d.lootTable, d.explorationYields, d.special]) : null; };
const landmarkDrops = id => { const d = DISTRICTS[id], out = new Set(); if (!d) return out;
  for (const key of (d.landmarks ?? [])) { const lm = LANDMARK_DATA[key] ?? LANDMARK_DATA[key.replace(/^lm_/, '')]; if (!lm) continue;
    collect([lm.lootTable, lm.firstEnterReward, (lm.subLocations ?? []).map(s => [s.lootTable, s.firstEnterReward])], out); }
  return out; };
// collect_item_type 은 top-level type 또는 tag 를 본다 (QuestSystem.js:208)
const typesOf = set => { const t = new Set(); for (const i of set) { const x = ITEMS[i]; if (!x) continue;
  if (x.type) t.add(x.type); if (x.subtype) t.add(x.subtype); (x.tags ?? []).forEach(g => t.add(g)); } return t; };

const ROUTE = [
  ['동작구 · 보라매병원', 'dongjak', 'mq_doctor_01~08 + 사이드',
    ['bandage','antiseptic','herb','painkiller','first_aid_kit','antibiotics'], ['medical','clean']],
  ['마포구 · 홍대 약국',  'mapo',    'mq_doctor_09~10',
    ['antiseptic','antidote','stimulant','herb','bandage'], ['medical']],
  ['관악구 · 서울대 연구소','gwanak','분기A mq_doctor_a_11~15',
    ['herb','antibiotics','antiseptic','bandage','first_aid_kit'], ['medical','food']],
  ['용산구 · 군 기지',    'yongsan', '분기B mq_doctor_b_11~15',
    ['bandage','antibiotics','painkiller','antiseptic','stimulant'], ['medical']],
];
console.log(`구 ${Object.keys(DISTRICTS).length} / 랜드마크 ${Object.keys(LANDMARK_DATA).length} / 아이템 ${Object.keys(ITEMS).length} / 청사진 ${Object.keys(BLUEPRINTS).length} / 제작가능 산출물 ${craft.size}종\n`);
const blockers = [];
for (const [name, did, q, items, reqTypes] of ROUTE) {
  const dd = districtDrops(did), ld = landmarkDrops(did);
  if (!dd) { console.log(`## ${name} — 구 '${did}' 없음 ★`); blockers.push(`${name}: 구 데이터 없음`); continue; }
  const all = new Set([...dd, ...ld]);
  console.log(`## ${name}   [${q}]`);
  console.log(`   현지 드랍: 구 ${dd.size}종 + 랜드마크 ${ld.size}종 = ${all.size}종`);
  for (const it of items) {
    if (!ITEMS[it]) { console.log(`   ! ${it} 정의 없음`); blockers.push(`${name}: ${it} 정의 없음`); continue; }
    const src = [dd.has(it)&&'구', ld.has(it)&&'랜드마크', craft.has(it)&&`제작:${craft.get(it)}`].filter(Boolean);
    console.log(`   ${(ITEMS[it].name??it).padEnd(8)} ${it.padEnd(15)} ${src.join(' / ') || '★ 현지 조달·제작 모두 불가'}`);
    if (!src.length) blockers.push(`${name}: ${ITEMS[it].name}(${it}) 조달 경로 없음`);
  }
  const have = typesOf(all);
  for (const t of reqTypes) {
    const ok = have.has(t);
    console.log(`   [타입] ${t.padEnd(8)} ${ok ? '현지 드랍에 있음' : '★ 현지 드랍에 없음'}`);
    if (!ok) blockers.push(`${name}: 타입 '${t}' 현지 드랍 없음`);
  }
  console.log('');
}
console.log(`=== 블로커 ${blockers.length}건 ===`);
blockers.forEach(b => console.log('  ★ ' + b));
