#!/usr/bin/env node
// === trace.mjs ===
// 단일 런(캐릭터 + 시드)을 일자별 행동 타임라인으로 추적해 JSON을 stdout으로 출력.
// 시뮬 뷰어의 "행동 히스토리"가 이 결과를 사용한다. baseline은 결정론적이라
// 같은 (char, seed)는 항상 같은 타임라인을 재현한다.
//
// 사용: node tools/sim/v2/trace.mjs --char doctor --seed 0

import { runSingleRun } from './runner.mjs';
import { getStrategy } from './strategies.mjs';
import ITEMS from '../../../js/data/items.js';
import { DISTRICTS } from '../../../js/data/districts.js';
import DISEASES from '../../../js/data/diseases.js';

function arg(name, def) {
  const i = process.argv.indexOf(name);
  return (i !== -1 && process.argv[i + 1] != null) ? process.argv[i + 1] : def;
}

// ── 행동/이벤트 한글 변환 ────────────────────────────────────
const itemName = (id) => ITEMS[id]?.name ?? id;
const distName = (id) => DISTRICTS[id]?.name ?? id;

const EVENT_LABELS = {
  siegeTriggered: '🏥 병원 공성 발생',
  hospitalRewards: '🎁 병원 방어 보상',
  hospitalDamaged: '💢 병원 피해',
  patientDied: '⚰️ 환자 사망',
  bossKilled: '👹 보스 처치',
  hiddenLocationDiscovered: '🗺️ 숨겨진 장소 발견',
  recipeUnlocked: '📖 레시피 해금',
  secretEventTriggered: '✨ 비밀 이벤트',
};

// 이벤트 문자열 → 한글 라벨 (disease:<id>는 질병명으로)
function humanizeEvent(e) {
  if (typeof e === 'string' && e.startsWith('disease:')) {
    const id = e.slice('disease:'.length);
    return `🦠 ${DISEASES[id]?.name ?? id} 발병`;
  }
  return EVENT_LABELS[e] ?? e;
}

// 스탯 키 → 한글 라벨
const STAT_KO = {
  hydration: '수분', nutrition: '영양', morale: '사기', fatigue: '피로',
  hp: 'HP', temperature: '체온', infection: '감염', stamina: '스태미나', radiation: '방사능',
};
// onConsume 객체 → "영양 +30, 수분 +10" (부호 포함)
function fmtDeltas(obj) {
  if (!obj) return '';
  const parts = Object.entries(obj).map(([k, v]) => `${STAT_KO[k] ?? k} ${v >= 0 ? '+' : ''}${v}`);
  return parts.join(', ');
}
// 아이템의 섭취 효과 문자열 (괄호 포함). 없으면 ''
function consumeEffect(id) {
  const d = fmtDeltas(ITEMS[id]?.onConsume);
  return d ? ` (${d})` : '';
}

// 원시 행동 문자열 → { icon, text(한글), raw }
function humanizeAction(a) {
  let m;
  if (a === 'sleep') return { icon: '😴', text: '수면 — 피로 회복 (HP +10, 피로 → 10)', raw: a };
  if (a === 'buildCampfire') return { icon: '🏕️', text: '캠프파이어 건설 (요리 가능)', raw: a };
  if ((m = /^build:(.+)$/.exec(a))) return { icon: '🏗️', text: `구조물 건설 — ${m[1]} (매일 자동 생산)`, raw: a };
  if ((m = /^heal:(.+)$/.exec(a))) return { icon: '🩹', text: `치료 — ${itemName(m[1])}${consumeEffect(m[1])}`, raw: a };
  if ((m = /^restItem:(.+)$/.exec(a))) return { icon: '☕', text: `피로 회복 — ${itemName(m[1])}${consumeEffect(m[1])}`, raw: a };
  if ((m = /^poi:(.+):\+(\d+)$/.exec(a))) return { icon: '✨', text: `숨겨진 장소 발견 — ${m[1]} (자원 ${m[2]}개)`, raw: a };
  if (a === 'fish_large') return { icon: '🎣', text: '낚시 — 대형 물고기 획득', raw: a };
  if ((m = /^combat:(승리|사망|도주)\((\d+)\)$/.exec(a))) {
    const icon = m[1] === '사망' ? '💀' : m[1] === '도주' ? '🏃' : '⚔️';
    return { icon, text: `전투 — ${m[1]} (적 ${m[2]}마리)`, raw: a };
  }
  if (a === 'drinkContaminated') return { icon: '🤢', text: '오염수 음용 — 깨끗한 물 없음 (수분 +60 · 방사선 +10 · 감염 +15 · 콜레라/이질 위험)', raw: a };
  if ((m = /^drink:(.+)$/.exec(a)))            return { icon: '💧', text: `수분 보충 — ${itemName(m[1])}${consumeEffect(m[1])}`, raw: a };
  if ((m = /^eat:(.+)$/.exec(a)))              return { icon: '🍖', text: `식사 — ${itemName(m[1])}${consumeEffect(m[1])}`, raw: a };
  if ((m = /^cook:(.+)->(.+)$/.exec(a)))       return { icon: '🍳', text: `요리 — ${itemName(m[2])} 제작${cookHint(m[2])}`, raw: a };
  if ((m = /^t1Convert:(.+)->(.+)$/.exec(a)))  return { icon: '🍳', text: `가공 — ${itemName(m[2])} 제작${cookHint(m[2])}`, raw: a };
  if ((m = /^moraleBoost:(.+?)\(\+?(.+)\)$/.exec(a))) {
    const eff = consumeEffect(m[1]) || ` (사기 +${m[2]})`;
    return { icon: '😊', text: `사기 회복 — ${itemName(m[1])} 사용${eff}`, raw: a };
  }
  if ((m = /^explore:(.+):\+(\d+)$/.exec(a)))  return { icon: '🔍', text: `탐색 — ${distName(m[1])}에서 자원 ${m[2]}개 획득`, raw: a };
  if ((m = /^subExplore:(.+):\+(\d+)$/.exec(a))) return { icon: '🏛️', text: `세부장소 — ${m[1]}에서 자원 ${m[2]}개 획득`, raw: a };
  if ((m = /^move:(.+)->(.+)$/.exec(a)))       return { icon: '🚶', text: `이동 — ${distName(m[1])} → ${distName(m[2])}`, raw: a };
  if ((m = /^fish:\+\d+:(.+)@(.+)$/.exec(a)))  return { icon: '🎣', text: `낚시 — ${itemName(m[1])} 획득 (${distName(m[2])})`, raw: a };
  return { icon: '•', text: a, raw: a };
}
// 요리/가공: 만든 음식을 섭취하면 얻는 효과 (행동 자체가 아닌 산출물 효과임을 명시)
function cookHint(outId) {
  const d = fmtDeltas(ITEMS[outId]?.onConsume);
  return d ? ` (섭취 시 ${d})` : '';
}

const characterId = arg('--char', 'doctor');
const seed = Number.parseInt(arg('--seed', '0'), 10) || 0;
const strategyId = arg('--strategy', null);
const strategy = strategyId ? (getStrategy(strategyId)?.cfg ?? {}) : {};

// 시스템 init/run 중 console 출력이 stdout JSON을 오염시키지 않도록 잠시 무음 처리
const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
console.log = console.info = console.warn = console.error = () => {};

let r;
try {
  r = runSingleRun({ characterId, seed, runId: seed, traceDaily: true, strategy });
} finally {
  Object.assign(console, orig);
}

const dailyTrace = (r.dailyTrace ?? []).map((d) => ({
  ...d,
  actions: (d.actions || []).map(humanizeAction),
  events: (d.events || []).map(humanizeEvent),
}));

const out = {
  character: r.character,
  seed: r.seed,
  strategy: strategyId,
  alive: r.alive,
  survivedDays: r.survivedDays,
  deathDay: r.deathDay,
  deathCause: r.deathCause,
  dailyTrace,
};

process.stdout.write(JSON.stringify(out));
