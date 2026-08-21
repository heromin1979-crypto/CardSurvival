// === 아이템 대장 감사 엔진 (Item Ledger Audit) ===
//
// 아이템 659종을 전수 조사해 "세팅이 잘못된 카드"를 4단계로 분류한다.
// 이 프로젝트에서 반복되는 사고는 CLAUDE.md가 경고하는 '조용히 실패하는 배선 누락'이다 —
// 데이터에 필드를 선언해도 읽는 코드가 없으면 아무 일도 일어나지 않고 경고도 없다.
// 카드 설명문만 거짓말을 하게 되므로 플레이로는 절대 드러나지 않는다.
//
// 사용:
//   node tools/audit-items.mjs                  # 요약 + 문제 항목 목록
//   node tools/audit-items.mjs --json           # 전체 결과 JSON (에디터 /api/item-audit)
//   node tools/audit-items.mjs --status=info    # 특정 상태만
//   node tools/audit-items.mjs --unclassified   # 역할 미분류 경로 (엔진 사각지대 점검)
//
// ⚠️ node v16에서는 js/data/*.js의 ESM 임포트가 깨진다. v20 이상으로 실행할 것.
//
// 판정은 배타적이다 — 아이템 1개당 상태 1개. 우선순위:
//   wiring(배선 문제) > display(표시 누락) > info(참고) > ok(정상)
//
// ── 획득/사용 경로를 하드코딩하지 않는 이유 ────────────────────
// 아이템 ID는 드랍표·청사진·퀘스트 보상·적 드랍·구 탐사도 보상·NPC 거래·상자
// 내용물 등 20개가 넘는 서로 다른 구조에 흩어져 있다. 경로를 손으로 열거하면
// 반드시 빠뜨리고, 빠뜨린 경로는 "획득 경로 없음" 오탐으로 되돌아온다.
// 그래서 js/data/ 전체를 재귀로 훑어 아이템 ID가 놓인 자리의 '역할 키'로 분류한다.
// 역할 표에 없는 자리는 ROLE_UNKNOWN으로 모아 --unclassified로 점검할 수 있다.

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, relative } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DATA = join(ROOT, 'js/data');

// ─── 판정 기준 (에디터 UI가 그대로 표시한다) ──────────────────
export const CRITERIA = [
  { key: 'wiring', label: '배선 문제', tone: 'bad',
    text: '죽은 필드(코드 전체 grep 0건), 획득 경로 없음, 사용처·기능 모두 없음 중 하나에 해당.' },
  { key: 'display', label: '표시 누락', tone: 'warn',
    text: '동작은 하는데 값이 화면 어디에도 안 뜨는 경우. 도구 패시브(onUse)가 대표적입니다.' },
  { key: 'info', label: '참고', tone: 'note',
    text: '읽히지 않는 잔여 필드나 중복 미러처럼 동작에는 영향이 없는 사항. 이미지 미등록도 여기 들어갑니다.' },
  { key: 'ok', label: '정상', tone: 'good', text: '지적 사항 없음.' },
];

export const STATUS_ORDER = ['wiring', 'display', 'info', 'ok'];

// ─── 효과 블록 — 여기 안의 키는 "카드가 약속하는 기능" ────────
// check-effect-wiring.mjs와 동일 목록. 데이터 블록(dismantle·harvest 등)은 소비처가
// 명확하므로 대상이 아니다.
const EFFECT_BLOCKS = [
  'onUse', 'onWear', 'onTick', 'effect', 'onConsume', 'onTrigger', 'flight', 'escapeVehicle',
];

// ─── 소비처가 자명해 grep 판정에서 제외하는 최상위 필드 ────────
// 이 목록에 없는 최상위 필드는 "그 필드명을 읽는 코드가 있는가"를 grep으로 확인한다.
const KNOWN_TOP_FIELDS = new Set([
  'id', 'name', 'type', 'subtype', 'rarity', 'weight', 'icon', 'description', 'tags',
  'defaultDurability', 'defaultContamination',
  ...EFFECT_BLOCKS,
  'stackable', 'maxStack',
  'dismantle', 'dismantleTP', 'harvest', 'gather', 'forage', 'repairRecipe', 'repairAmount',
  'combat', 'armor', 'defense', 'weaponType', 'ammoType', 'roundsPerPack', 'ammoEffect',
  'multiTarget', 'throwableEffect', 'fragmentOf',
  'requiresSlot', 'equipSlot', 'bagSlots', 'containedItems',
  'legendary', 'landmark', 'landmarkBonus', 'districtId', 'nodeId',
  'dangerLevel', 'encounterChance', 'travelCostTP', 'hasFishing',
  'requiredForBlueprints', 'toolProvides', 'leaveOnConsume', 'nutrition',
  'diagnose', 'treatPart', 'trapData', 'isStructure',
]);

// ─── 기능 판정 제외 필드 ──────────────────────────────────────
// 모든 카드가 갖는 서술·장부 필드. 이 목록 밖의 최상위 필드가 '의미 있는 값'을
// 갖고 코드가 그 이름을 읽으면 그 카드는 기능이 있는 것으로 본다.
// 하드코딩된 기능 필드 목록(combat·armor·nutrition…)을 대체한다 — 새 필드가
// 추가돼도 목록을 손대지 않고 자동으로 반영된다.
const NON_FUNCTIONAL_FIELDS = new Set([
  'id', 'name', 'type', 'subtype', 'rarity', 'weight', 'icon', 'description', 'tags',
  'defaultDurability', 'defaultContamination', 'stackable', 'maxStack', 'dismantleTP',
  'legendary', 'isRare', 'landmarkBonus', 'districtId', 'nodeId',
]);

/** 빈 배열·빈 객체·falsy는 '값이 없다'로 본다 (dismantle: [] 은 기능이 아니다) */
function meaningful(v) {
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === 'object') return Object.keys(v).length > 0;
  return v !== undefined && v !== null && v !== false && v !== 0 && v !== '';
}

// ─── 의도적 미배선 (사유 명시) ────────────────────────────────
// check-effect-wiring.mjs의 ALLOWLIST와 같은 목록이지만, 대장에서는 통과시키지 않고
// '참고'로 내려 보이게 한다 — "지금은 아무 동작도 하지 않는다"는 사실 자체가 정보다.
const ACKNOWLEDGED = new Map(Object.entries({
  damage: '무기 combat.damage와 이름이 겹친다 — CombatSystem이 배열 구조분해로 읽는다',
  powerGeneration: '전력 시스템 미도입',
  structurePowerDays: '전력 시스템 미도입',
  autoDefense: '전력 시스템 미도입',
  baseDamagePerAttack: '전력 시스템 미도입',
  unlockBonus: '잠금 해제 보정 축 미도입',
  electronicUnlock: '전자 잠금 구분 미도입',
  enablesLegendaryCraft: 'requiredTools로 충족됨 — 중복 게이트',
  enablesAmmoCraft: 'requiredTools로 충족됨 — 중복 게이트',
  enablesAdvancedMedical: 'requiredTools로 충족됨 — 중복 게이트',
  enablesWaterPurification: '미배선 — 산업용 정수기',
  purifyRate: '미배선 — 산업용 정수기',
  enablesBroadcast: '미배선 — 방송 장비',
  enablesMilitaryComm: '미배선 — 군용 통신 키트',
  fireStart: 'interactions.js 규칙이 점화를 처리한다 — 이 키는 잔재',
  shelterBonus: '수용·방어 보정 축 미도입',
  maxOccupants: '수용 인원 개념 미도입',
  highGroundAccess: '특수 탐색 축 미도입 (히든 장소 진입 조건으로는 정상 동작)',
}));

// ══════════════════════════════════════════════════════════════
//  역할 표 — 아이템 ID가 놓인 자리가 '획득'인가 '사용'인가
// ══════════════════════════════════════════════════════════════
// 판정은 경로를 안쪽부터 바깥으로 훑어 처음 만나는 역할 키를 채택한다.
// 그래서 effects>removeItems(사용)와 effects>items(획득)가 갈린다.

const ROLES = {
  // ── 획득 ──────────────────────────────────────────────────
  lootTable:          ['acq', '드랍표'],
  output:             ['acq', '제작 결과물'],
  explorationYields:  ['acq', '구 탐사도 보상'],
  firstEnterReward:   ['acq', '세부장소 첫 진입'],
  reward:             ['acq', '보상'],
  bonusReward:        ['acq', '추가 보상'],
  victoryItems:       ['acq', '전투 승리'],
  dropGuaranteed:     ['acq', '확정 드랍'],
  masteryRarePool:    ['acq', '숙련 희귀 풀'],
  giveItems:          ['acq', '이벤트 지급'],
  gifts:              ['acq', 'NPC 선물'],
  startingItems:      ['acq', '시작 장비'],
  startingStructures: ['acq', '시작 구조물'],
  gear:               ['acq', '동료 기본 장비'],
  contributionOnCure: ['acq', '치료 기여 보상'],
  recurring:          ['acq', '반복 보상'],
  dismantle:          ['acq', '분해 산출'],
  harvest:            ['acq', '수확'],
  yield:              ['acq', '산출'],
  yields:             ['acq', '산출'],
  forageItems:        ['acq', '채집'],
  containedItems:     ['acq', '상자 내용물'],
  spawnItem:          ['acq', '조합 산출'],
  receive:            ['acq', '거래(받음)'],
  leaveOnConsume:     ['acq', '소비 후 잔여물'],
  effects:            ['acq', '이벤트 효과'],
  seasonLoot:         ['acq', '제철 드랍'],
  trapData:           ['acq', '덫 포획'],
  landmarks:          ['acq', '구 연결'],

  // ── 사용 ──────────────────────────────────────────────────
  requiredItems:      ['use', '제작 재료/조건'],
  requiredTools:      ['use', '요구 도구'],
  requiredItemQty:    ['use', '요구 수량 조건'],
  requiresAmmo:       ['use', '탄약 소비'],
  ammoType:           ['use', '탄약 규격'],
  source:             ['use', '조합 재료'],
  target:             ['use', '조합 대상'],
  additionalReq:      ['use', '추가 재료'],
  removeItems:        ['use', '이벤트 소모'],
  objective:          ['use', '퀘스트 목표'],
  subObjectives:      ['use', '퀘스트 세부 목표'],
  steps:              ['use', 'NPC 의뢰 단계'],
  cost:               ['use', '업그레이드 비용'],
  give:               ['use', '거래(지불)'],
  repairRecipe:       ['use', '수리 재료'],
  treatmentItemIds:   ['use', '치료 아이템'],
  weaponSynergies:    ['use', '무기 시너지'],
  bonusVs:            ['use', '상성'],
  requires:           ['use', '요구'],
};

// 아이템 ID를 담을 수 있는 키 이름 — 값이 문자열일 때만 대조한다
const ID_KEYS = new Set([
  'definitionId', 'id', 'itemId', 'spawnItem', 'item', 'requiresAmmo', 'ammoType', 'targetCard',
]);

// 아이템 ID와 문자열이 겹칠 뿐 참조가 아닌 자리 (태그·상태이상 이름 등)
const NOT_A_REFERENCE = new Set([
  'tags', 'statusIds', 'removeStatus', 'treatmentTags', 'baitTags', 'seasons',
  'cls', 'category', 'type', 'subtype', 'rarity', 'icon', 'skill',
]);

// ══════════════════════════════════════════════════════════════
//  소스 코퍼스 — "읽는 코드가 있는가"의 근거
// ══════════════════════════════════════════════════════════════

// js/data/ 는 '선언하는 쪽'이라 소비처 근거가 될 수 없다. 단 아래 두 파일은
// js/data/ 에 있지만 실제 로직을 담은 소비처다 (상호작용 규칙 / 카드 파생).
const DATA_DIR_CONSUMERS = new Set(['interactions.js', 'locationCardFactory.js']);

function walkJs(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walkJs(full, out); continue; }
    if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

function buildCorpus() {
  const logic = [];
  const ui = [];
  for (const full of walkJs(join(ROOT, 'js'))) {
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    const base = rel.slice(rel.lastIndexOf('/') + 1);
    if (rel.startsWith('js/data/') && !DATA_DIR_CONSUMERS.has(base)) continue;
    const src = readFileSync(full, 'utf8');
    logic.push(src);
    if (rel.startsWith('js/ui/')) ui.push(src);
  }
  return { logic: logic.join('\n'), ui: ui.join('\n') };
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 키를 '읽는' 흔적: 점 접근(.key), 문자열 리터럴('key'), 구조분해({ key } =) */
function makeReader(corpus) {
  const cache = new Map();
  return (key) => {
    if (cache.has(key)) return cache.get(key);
    const k = escapeRe(key);
    const re = new RegExp(`(\\.${k}\\b)|(['"\`]${k}['"\`])|(\\{[^}]*\\b${k}\\b[^}]*\\}\\s*=)`);
    const hit = re.test(corpus);
    cache.set(key, hit);
    return hit;
  };
}

// ══════════════════════════════════════════════════════════════
//  데이터 적재 + 전수 스윕
// ══════════════════════════════════════════════════════════════

const SKIP_MODULES = new Set(['validate.js', 'GameData.js', 'locales.js', 'interactions.js']);

async function loadDataModules() {
  const mods = [];
  for (const name of readdirSync(DATA)) {
    if (name.endsWith('.js')) {
      if (SKIP_MODULES.has(name)) continue;
      try {
        mods.push({ name, mod: await import(pathToFileURL(join(DATA, name)).href) });
      } catch { /* 임포트 불가 모듈은 스윕에서 제외 — 다른 경로로 잡힌다 */ }
    } else if (statSync(join(DATA, name)).isDirectory()) {
      const idx = join(DATA, name, 'index.js');
      try {
        mods.push({ name: `${name}/index.js`, mod: await import(pathToFileURL(idx).href) });
      } catch { /* index.js 없는 폴더는 건너뛴다 */ }
    }
  }
  return mods;
}

/**
 * js/data/ 전체에서 아이템 ID 참조를 수집한다.
 * 반환: { acq: Map<id, ref[]>, use: Map<id, ref[]>, unclassified: Map<sig, n> }
 * ref = { role, label, where }
 */
function sweepReferences(mods, itemIds) {
  const acq = new Map();
  const use = new Map();
  const unclassified = new Map();

  const record = (map, id, role, label, where) => {
    if (!map.has(id)) map.set(id, []);
    const list = map.get(id);
    if (!list.some((r) => r.role === role && r.label === label)) list.push({ role, label, where });
  };

  /** 경로를 안쪽부터 훑어 처음 만나는 역할 키를 채택 */
  const resolveRole = (crumbs) => {
    for (let i = crumbs.length - 1; i >= 0; i -= 1) {
      const hit = ROLES[crumbs[i]];
      if (hit) return { kind: hit[0], role: crumbs[i], label: hit[1] };
    }
    return null;
  };

  const hit = (id, crumbs, ctx, key) => {
    const r = resolveRole([...crumbs, key]);
    if (!r) {
      const sig = `${ctx.file}: ${crumbs.slice(-2).join('>')} > ${key}`;
      unclassified.set(sig, (unclassified.get(sig) || 0) + 1);
      return;
    }
    const label = ctx.name ? `${r.label} — ${ctx.name}` : r.label;
    record(r.kind === 'acq' ? acq : use, id, r.role, label, ctx.file);
  };

  const walk = (node, crumbs, ctx) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const v of node) walk(v, crumbs, ctx); return; }

    // 이름을 가진 객체에 들어서면 그 이름을 문맥으로 물려준다 (사람이 읽을 라벨)
    const next = typeof node.name === 'string' && node.name ? { ...ctx, name: node.name } : ctx;

    for (const [k, v] of Object.entries(node)) {
      if (NOT_A_REFERENCE.has(k)) continue;
      // 사전 키와 같은 id는 자기 식별이지 다른 아이템 참조가 아니다
      if (k === 'id' && v === crumbs[crumbs.length - 1]) continue;
      if (typeof v === 'string') {
        if (ID_KEYS.has(k) && itemIds.has(v)) hit(v, crumbs, next, k);
        continue;
      }
      if (Array.isArray(v) && v.length && v.every((x) => typeof x === 'string')) {
        for (const s of v) if (itemIds.has(s)) hit(s, crumbs, next, k);
        continue;
      }
      walk(v, [...crumbs, k], next);
    }
  };

  for (const { name, mod } of mods) {
    for (const value of Object.values(mod)) walk(value, [], { file: name, name: '' });
  }
  return { acq, use, unclassified };
}

// ══════════════════════════════════════════════════════════════
//  판정
// ══════════════════════════════════════════════════════════════

/** 효과 블록 안의 (키, 경로, 값)을 임의 깊이로 수집 */
function collectEffectEntries(def) {
  const found = [];
  const walk = (value, path) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${path}[${i}]`)); return; }
    for (const [k, v] of Object.entries(value)) {
      found.push({ key: k, path: `${path}.${k}`, value: v });
      walk(v, `${path}.${k}`);
    }
  };
  for (const block of EFFECT_BLOCKS) {
    const v = def?.[block];
    if (v && typeof v === 'object') walk(v, block);
  }
  return found;
}

/**
 * 수치가 화면에 뜨는가 — 카드 설명문에 그 숫자가 등장하면 표시된 것으로 본다.
 * 0.6 같은 배율은 설명문에서 "40% 감소"/"60%"로 표현되므로 두 형태를 함께 본다.
 */
function numberShownInText(value, text) {
  if (!Number.isFinite(value)) return false;
  const cands = new Set();
  const add = (n) => { if (Number.isFinite(n) && Math.abs(n) >= 1) cands.add(String(Math.round(Math.abs(n)))); };
  add(value);
  add(value * 100);
  add((1 - value) * 100);
  add(value * 10);
  for (const c of cands) if (new RegExp(`(^|[^0-9])${c}([^0-9]|$)`).test(text)) return true;
  return false;
}

// ══════════════════════════════════════════════════════════════
//  고치는 방법 안내 — 기획자가 읽고 바로 움직일 수 있는 문장
// ══════════════════════════════════════════════════════════════
// 대장을 보는 사람은 코드를 고치지 않는다. 그래서 지적마다
//   owner : 누가 고치는가 — 'planner'(에디터에서 직접) / 'dev'(코드 배선 필요)
//   fix   : 어느 탭 어느 필드를 어떻게 만지는가
// 를 붙인다. owner가 'dev'인 항목을 기획자가 붙들고 있으면 시간만 버리므로
// 이 구분이 안내의 핵심이다.
export const OWNER_LABEL = {
  planner: '기획에서 수정 가능',
  dev: '개발 배선 필요',
};

/** 배율·증감치를 설명문에 어떻게 쓰면 되는지 예문을 만든다 */
function phrasingHint(value) {
  if (typeof value !== 'number') return '설명문에 실제 수치를 적어 주세요';
  if (value > 0 && value < 1) {
    const pct = Math.round(value * 100);
    const cut = Math.round((1 - value) * 100);
    return `배율 ${value}입니다 — 설명문에 "${cut}% 감소" 또는 "${pct}%로 감소"처럼 적으면 플레이어가 볼 수 있습니다`;
  }
  if (value < 0) return `설명문에 "${value}"처럼 감소량을 적으면 플레이어가 볼 수 있습니다`;
  return `설명문에 "+${value}"처럼 증가량을 적으면 플레이어가 볼 수 있습니다`;
}

/**
 * 지적 하나에 owner/fix를 붙인다.
 * ctx = { id, name, def, acquisitionCount, usage }
 */
function guideFor(f, ctx) {
  const { id, def, usage } = ctx;

  switch (f.code) {
    case 'no-acquisition': {
      // 재료로 요구되는 카드가 얻을 수 없으면 그 레시피 전체가 막힌다 — 우선순위가 다르다
      const blocked = usage.filter((u) => u.role === 'requiredItems' || u.role === 'requiredTools');
      const urgency = blocked.length
        ? ` ⚠️ 지금 ${blocked.length}곳이 이 카드를 재료·도구로 요구합니다(${blocked.slice(0, 3).map((u) => u.label.replace(/^[^—]*— /, '')).join(', ')}${blocked.length > 3 ? ' 외' : ''}) — 얻을 수 없으니 그 제작도 영구히 막혀 있습니다.`
        : '';
      return { owner: 'planner', fix:
        `얻을 방법을 하나 만들어 주세요. ① 장소 탭 → 원하는 구 → \`lootTable\`에 \`${id}\` 추가 `
        + `② 랜드마크·세부장소 탭 → \`lootTable\`에 추가 ③ 제작으로 주려면 청사진의 \`output\`에 추가. `
        + `등장시킬 계획이 없으면 카드를 삭제하는 것도 정리입니다.${urgency}` };
    }

    case 'no-purpose':
      return { owner: 'planner', fix:
        `쓸 곳을 만들어 주세요. ① 다른 제작의 \`requiredItems\`에 재료로 넣기 `
        + `② 이 카드의 \`dismantle\`에 분해 산출물 넣기 ③ 효과를 주려면 \`onUse\`/\`onConsume\`/\`onWear\` 추가 `
        + `— 단 새 효과 키는 개발 배선이 필요하니 이미 쓰이는 키를 골라야 합니다(❓ 태그·필드 도움말 참고).`
        + (def.description ? ` 설명문이 "${def.description}"라고 약속하고 있으니, 그 약속을 지키는 쪽으로 맞추는 게 먼저입니다.` : '') };

    case 'dead-effect':
      return { owner: 'dev', fix:
        `\`${f.field}\` 키를 읽는 코드가 없습니다. 기획 데이터만으로는 살릴 수 없습니다 — 개발자에게 배선을 요청하거나, `
        + `이미 동작하는 키로 바꿔 주세요. 그대로 두면 카드 설명문만 거짓이 됩니다.` };

    case 'dead-field':
      return { owner: 'dev', fix:
        `\`${f.field}\`는 아무 코드도 읽지 않습니다. 개발자에게 배선을 요청하거나, 필드를 지우고 `
        + `설명문에서도 그 약속을 빼 주세요(둘 중 하나는 해야 합니다 — 지금은 설명만 맞고 동작은 없습니다).` };

    case 'dead-flag':
      return { owner: 'planner', fix:
        `동작에 영향이 없습니다. 정리하고 싶으면 \`${f.field}\` 필드를 지우세요 — 게임 동작은 그대로입니다.` };

    case 'ack-unwired':
      return { owner: 'dev', fix:
        `의도적으로 미배선인 항목입니다(${f.reason || '사유 미기재'}). 기획에서 할 일은 하나입니다 — `
        + `설명문이 이 효과를 약속하고 있으면 문구를 빼거나, 개발 일정에 올려 주세요.` };

    case 'ui-hidden':
      return { owner: 'planner', fix:
        `${phrasingHint(f.value)}. 아이템 탭 → \`description\`을 고치면 됩니다. `
        + `카드 UI에 수치를 자동으로 띄우려면 개발 작업이 필요합니다.` };

    case 'stack-mismatch':
      return { owner: 'dev', fix:
        `실제 적용값은 stackConfig.js의 \`stackable: ${f.value?.stackable}, maxStack: ${f.value?.maxStack}\`입니다. `
        + `아이템 탭에서 숫자를 바꿔도 반영되지 않습니다 — 원하는 값이 다르면 개발자에게 stackConfig.js 수정을 요청하세요.` };

    case 'stack-unregistered':
      return { owner: 'planner', fix:
        `stackConfig.js에 없어서 아이템 정의의 \`stackable\`·\`maxStack\`이 그대로 적용됩니다. `
        + `의도한 값이면 그냥 두세요 — 문제가 아니라 참고 사항입니다.` };

    case 'no-image':
      return { owner: 'dev', fix:
        `이미지가 없어 이모지 \`${def.icon || '·'}\`로 표시됩니다. 이미지를 \`assets/images/<분류>/\`에 넣고 `
        + `CardFactory의 CARD_IMAGES에 \`${id}\`를 등록해야 합니다 — 개발자에게 요청하세요.` };

    default:
      return { owner: 'dev', fix: '' };
  }
}

export async function auditItems() {
  const ITEMS = (await import(pathToFileURL(join(DATA, 'items.js')).href)).default;
  const STACK_CONFIG = (await import(pathToFileURL(join(DATA, 'stackConfig.js')).href)).default;
  const CardFactory = await import(pathToFileURL(join(ROOT, 'js/ui/CardFactory.js')).href);
  const CARD_IMAGES = CardFactory.CARD_IMAGES ?? CardFactory.default?.images ?? {};

  const itemIds = new Set(Object.keys(ITEMS));
  const mods = await loadDataModules();
  const { acq, use, unclassified } = sweepReferences(mods, itemIds);

  const corpus = buildCorpus();
  const readByLogic = makeReader(corpus.logic);
  const readByUi = makeReader(corpus.ui);

  const stackIds = new Set(Object.keys(STACK_CONFIG || {}));
  const imageIds = new Set(Object.keys(CARD_IMAGES || {}));

  // 코드가 카드를 직접 만드는 경로 — 데이터 표에 없어도 시스템이 산출한다
  const systemSpawn = (id) => new RegExp(`['"\`]${escapeRe(id)}['"\`]`).test(corpus.logic);

  const items = [];

  for (const [id, def] of Object.entries(ITEMS)) {
    const findings = [];
    const isLocation = def.type === 'location';
    const text = [def.description, def.landmarkBonus].filter(Boolean).join(' ');

    // ── 1) 기능 배선 — 효과 블록의 죽은 키 ──────────────────
    const entries = collectEffectEntries(def);
    const seenKeys = new Set();
    let liveEffectKeys = 0;
    const hiddenValues = [];
    for (const { key, path, value } of entries) {
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);

      if (!readByLogic(key)) {
        const why = ACKNOWLEDGED.get(key);
        if (why) {
          findings.push({ status: 'info', code: 'ack-unwired', field: path, reason: why,
            msg: `의도적 미배선으로 인정된 효과 키 — 지금은 아무 동작도 하지 않습니다 (${why})` });
        } else {
          findings.push({ status: 'wiring', code: 'dead-effect', field: path,
            msg: '효과 키를 읽는 코드가 없습니다 (js/ 전체 grep 0건) — 선언만 있고 동작하지 않습니다' });
        }
        continue;
      }

      liveEffectKeys += 1;
      // 배선은 됐다. 값이 화면에 뜨는가? — UI가 그 키를 읽거나, 설명문이 숫자를 말하면 뜬 것
      if (typeof value === 'number' && !readByUi(key) && !numberShownInText(value, text)) {
        hiddenValues.push({ key, path, value });
      }
    }

    // ── 2) 획득 경로 ────────────────────────────────────────
    const acquisition = [...(acq.get(id) || [])];
    if (!acquisition.length && systemSpawn(id)) {
      acquisition.push({ role: 'system', label: '시스템 산출 — 코드가 카드를 직접 만듭니다', where: 'js/' });
    }
    // 장소·랜드마크 카드는 드랍이 아니라 이동으로 등장한다 — 획득 경로 판정 대상 아님
    if (!acquisition.length && !isLocation) {
      findings.push({ status: 'wiring', code: 'no-acquisition', field: '(획득처)',
        msg: '획득 경로가 없습니다 — 드랍표·제작·보상·시스템 산출 어디에도 없어 플레이 중 등장할 수 없습니다' });
    }

    // ── 3) 사용처·기능 둘 다 없음 ───────────────────────────
    const usage = [...(use.get(id) || [])];
    // 코드가 이 아이템 id를 직접 다루면(예: WeatherSystem이 dry_stream을 되채움)
    // 필드가 없어도 전용 처리가 있는 것이다 — 환경 오브젝트가 여기 해당한다.
    const codeHandled = systemSpawn(id);
    const liveFields = Object.keys(def).filter(
      (f) => !NON_FUNCTIONAL_FIELDS.has(f) && meaningful(def[f]) && readByLogic(f));
    const hasFunction = liveEffectKeys > 0 || liveFields.length > 0 || isLocation || codeHandled;
    if (!usage.length && !hasFunction) {
      findings.push({ status: 'wiring', code: 'no-purpose', field: '(사용처)',
        msg: '사용처도 기능도 없습니다 — 재료로도 안 쓰이고 효과도 없어 존재 이유가 없는 카드입니다' });
    }

    // ── 4) 표시 누락 — 배선은 됐는데 값이 화면에 안 뜬다 ────
    for (const { path, value } of hiddenValues) {
      findings.push({ status: 'display', code: 'ui-hidden', field: path, value,
        msg: `값 ${value}이(가) js/ui/ 어디에서도 읽히지 않고 설명문에도 없습니다 — 동작은 하지만 플레이어가 볼 수 없습니다` });
    }

    // ── 5) 참고 — 읽는 코드가 없는 잔여 최상위 필드 ─────────
    // 수치·구조를 담은 필드가 죽어 있으면 카드가 약속한 값이 실현되지 않는다 → 배선 문제.
    // 불리언 플래그는 켜고 끄는 표식일 뿐이라 동작 영향이 불명확하므로 참고로 남긴다.
    for (const field of Object.keys(def)) {
      if (KNOWN_TOP_FIELDS.has(field)) continue;
      if (readByLogic(field)) continue;
      const payload = def[field];
      const carriesValue = typeof payload === 'number' || (payload && typeof payload === 'object');
      findings.push(carriesValue
        ? { status: 'wiring', code: 'dead-field', field, value: payload,
            msg: `읽는 코드가 없는 필드에 수치가 들어 있습니다 (${JSON.stringify(payload)}) — 선언만 있고 실현되지 않습니다` }
        : { status: 'info', code: 'dead-flag', field,
            msg: '읽는 코드가 없는 잔여 플래그입니다 (동작 영향 없음)' });
    }

    // ── 6) 참고 — stackConfig와 값이 어긋난 중복 미러 ───────
    // 아이템 정의에 stackable/maxStack을 함께 적는 것은 이 프로젝트의 관례다.
    // 문제가 되는 건 stackConfig.js가 런타임에 덮어쓰는 값과 어긋날 때뿐이다.
    const sc = STACK_CONFIG?.[id];
    if (sc) {
      const mismatch = [];
      if (def.stackable !== undefined && def.stackable !== sc.stackable) {
        mismatch.push(`stackable ${def.stackable} → ${sc.stackable}`);
      }
      if (def.maxStack !== undefined && sc.maxStack !== undefined && def.maxStack !== sc.maxStack) {
        mismatch.push(`maxStack ${def.maxStack} → ${sc.maxStack}`);
      }
      if (mismatch.length) {
        findings.push({ status: 'info', code: 'stack-mismatch', field: 'stackable/maxStack',
          value: { stackable: sc.stackable, maxStack: sc.maxStack },
          msg: `stackConfig.js가 런타임에 덮어써 아이템 정의값은 읽히지 않습니다 (${mismatch.join(', ')})` });
      }
    } else if (def.stackable) {
      findings.push({ status: 'info', code: 'stack-unregistered', field: 'stackable',
        msg: 'stackConfig.js 미등록 — 스택 규칙이 아이템 정의값에만 의존합니다' });
    }

    // ── 7) 참고 — 카드 이미지 미등록 ────────────────────────
    if (!imageIds.has(id) && !isLocation) {
      findings.push({ status: 'info', code: 'no-image', field: 'CARD_IMAGES',
        msg: 'CardFactory.CARD_IMAGES 미등록 — 이모지 아이콘으로 폴백됩니다' });
    }

    // 안내 문구 부착 — 지적을 다 모은 뒤에야 usage/획득처 맥락을 반영할 수 있다
    const ctx = { id, def, usage };
    for (const f of findings) Object.assign(f, guideFor(f, ctx));

    const status = STATUS_ORDER.find((s) => findings.some((f) => f.status === s)) || 'ok';
    // 이 카드를 기획자가 직접 손볼 수 있는가 — 대장의 '기획 담당' 필터가 쓴다
    const owners = new Set(findings.map((f) => f.owner));

    items.push({
      id,
      name: def.name,
      type: def.type,
      subtype: def.subtype,
      rarity: def.rarity,
      icon: def.icon,
      description: def.description,
      slot: def.requiresSlot || def.equipSlot || null,
      status,
      findings,
      acquisition,
      usage,
      effectKeyCount: seenKeys.size,
      hasImage: imageIds.has(id),
      owners: [...owners],
    });
  }

  const summary = { total: items.length };
  for (const s of STATUS_ORDER) summary[s] = items.filter((i) => i.status === s).length;
  const byType = {};
  for (const i of items) byType[i.type] = (byType[i.type] || 0) + 1;
  const byCode = {};
  for (const i of items) for (const f of i.findings) byCode[f.code] = (byCode[f.code] || 0) + 1;
  // 담당별 — 기획자가 지금 손댈 수 있는 카드가 몇 장인지 (정상 카드는 제외)
  const byOwner = { planner: 0, dev: 0 };
  for (const i of items) {
    if (i.status === 'ok') continue;
    if (i.owners.includes('planner')) byOwner.planner += 1;
    if (i.owners.includes('dev')) byOwner.dev += 1;
  }

  return {
    criteria: CRITERIA,
    summary,
    byType,
    byCode,
    byOwner,
    ownerLabels: OWNER_LABEL,
    items,
    unclassified: [...unclassified].sort((a, b) => b[1] - a[1]).map(([sig, n]) => ({ sig, n })),
  };
}

// ══════════════════════════════════════════════════════════════
//  CLI
// ══════════════════════════════════════════════════════════════

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const argv = process.argv.slice(2);
  const result = await auditItems();

  if (argv.includes('--json')) {
    // 미분류 경로는 진단용이라 기본 payload에서 뺀다 (--unclassified로 따로 본다)
    const { unclassified, ...payload } = result;
    process.stdout.write(JSON.stringify(payload));
  } else if (argv.includes('--unclassified')) {
    console.log(`\n역할 미분류 경로 ${result.unclassified.length}종 — 엔진 사각지대 후보\n`);
    for (const { sig, n } of result.unclassified) console.log(`${String(n).padStart(5)}  ${sig}`);
    console.log('');
  } else {
    const LABEL = Object.fromEntries(CRITERIA.map((c) => [c.key, c.label]));
    console.log(`\n아이템 대장 — 총 ${result.summary.total}종`);
    console.log(STATUS_ORDER.map((s) => `${LABEL[s]} ${result.summary[s]}`).join('  ·  '));
    console.log(Object.entries(result.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · '));
    console.log(`\n지적 코드별: ${Object.entries(result.byCode).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);

    const only = (argv.find((a) => a.startsWith('--status=')) || '').split('=')[1];
    for (const s of only ? [only] : ['wiring', 'display']) {
      const rows = result.items.filter((i) => i.status === s);
      if (!rows.length) continue;
      console.log(`\n── ${LABEL[s]} ${rows.length}건 ──`);
      for (const it of rows) {
        console.log(`  ${it.name} (${it.id})`);
        for (const f of it.findings.filter((f) => f.status === s)) {
          console.log(`      ${f.field} — ${f.msg}`);
          if (f.fix) console.log(`         🛠 [${OWNER_LABEL[f.owner]}] ${f.fix}`);
        }
      }
    }
    console.log('');
  }
}
