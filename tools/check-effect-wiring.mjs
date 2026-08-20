// === 효과 키 배선 커버리지 체커 ===
// 이 프로젝트에서 반복되는 사고는 "데이터에 효과를 선언했는데 읽는 코드가 없는" 경우다.
// 경고도 에러도 없이 조용히 아무 일도 일어나지 않으므로 플레이 중에는 드러나지 않고,
// 카드 설명문만 거짓말을 하게 된다 (CLAUDE.md의 '조용히 실패하는 배선 누락').
//
// 이 스크립트는 아이템·전설 아이템의 효과 블록에서 하위 키를 전부 뽑아
// js/ 소스 어딘가가 그 키를 실제로 읽는지 대조한다.
//
// 사용:  node tools/check-effect-wiring.mjs
//   - 소비처가 없는 키가 있으면 목록 출력 + exit 1
//   - ALLOWLIST에 사유와 함께 등록된 키는 통과
//
// 검사 대상 블록: onUse / onWear / onTick / effect / onConsume / onTrigger / flight / escapeVehicle
// 데이터 블록(dismantle·harvest 등 소비처가 명확한 것)은 대상이 아니다.

import { readFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, relative } from 'path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

const EFFECT_BLOCKS = [
  'onUse', 'onWear', 'onTick', 'effect', 'onConsume', 'onTrigger', 'flight', 'escapeVehicle',
];

// 소비처가 없어도 통과시킬 키. 반드시 사유를 적는다 — 사유 없이 늘어나면 이 게이트는 무의미해진다.
// 여기 등록한다는 것은 "지금은 아무 동작도 하지 않는다"를 명시적으로 인정한다는 뜻이다.
// 카드 설명문이 그 효과를 약속하고 있지 않은지 반드시 함께 확인할 것.
const ALLOWLIST = {
  damage: '무기 combat.damage와 이름이 겹친다. CombatSystem이 배열 구조분해로 읽는다',

  // ── 전력 시스템 미도입 (보류 결정) ────────────────────────
  // 전력이라는 자원 개념 자체가 게임에 없다. 도입할지, 각 아이템에 직접 효과를
  // 얹을지 결정되지 않았다. 결정 전까지 아래 키는 선언만 남는다.
  powerGeneration:    '전력 시스템 미도입 — 태양광 발전기·비상 발전기',
  structurePowerDays: '전력 시스템 미도입 — 핵 배터리·태양광 발전기·비상 발전기',
  autoDefense:        '전력 시스템 미도입 — 자동 터렛',
  baseDamagePerAttack:'전력 시스템 미도입 — 자동 터렛',

  // ── 상위 호환 판정 미도입 ─────────────────────────────────
  // 히든 장소 진입 조건이 기본 lockpick만 인정한다. 상위 도구를 하위 도구로
  // 인정하려면 HiddenElementSystem이 providesTool을 거쳐야 한다.
  unlockBonus:     '잠금 해제 보정 축 미도입 — 자물쇠따개 계열 3종',
  electronicUnlock:'전자 잠금 구분 미도입 — 전자 락픽',

  // ── "가능해진다" 계열 게이트 미도입 ───────────────────────
  // 시설을 보드에 두면 레시피가 열리는 것은 requiredTools가 이미 처리한다.
  // 아래 키들은 그와 별개로 선언된 중복 게이트라 읽는 쪽이 없다.
  enablesLegendaryCraft:   'requiredTools로 충족됨 — 장인의 대장간',
  enablesAmmoCraft:        'requiredTools로 충족됨 — 탄약 프레스',
  enablesAdvancedMedical:  'requiredTools로 충족됨 — 야전 연구실 (craftSuccessBonus는 정상 동작)',
  enablesWaterPurification:'미배선 — 산업용 정수기',
  purifyRate:              '미배선 — 산업용 정수기',
  enablesBroadcast:        '미배선 — 방송 장비',
  enablesMilitaryComm:     '미배선 — 군용 통신 키트',
  fireStart:               '라이터 점화는 interactions.js 규칙이 처리한다 — 이 키는 잔재',

  // ── 기타 미배선 ───────────────────────────────────────────
  shelterBonus:     '수용·방어 보정 축 미도입 — 강화 쉘터',
  maxOccupants:     '수용 인원 개념 미도입 — 강화 쉘터',
  highGroundAccess: '특수 탐색 축 미도입 — 로프사다리 (히든 장소 진입 조건으로는 정상 동작)',
};

/** js/ 아래 모든 .js 소스를 한 덩어리로 읽는다 (데이터 파일은 선언부라 제외) */
function readSourceCorpus() {
  const chunks = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!name.endsWith('.js')) continue;
      const rel = relative(ROOT, full).replace(/\\/g, '/');
      // 데이터 파일은 '선언하는 쪽'이므로 소비처 근거가 될 수 없다
      if (rel.startsWith('js/data/')) continue;
      chunks.push(readFileSync(full, 'utf8'));
    }
  };
  walk(join(ROOT, 'js'));
  return chunks.join('\n');
}

/** 효과 블록 안의 하위 키를 임의 깊이로 수집 */
function collectEffectKeys(def, into) {
  for (const block of EFFECT_BLOCKS) {
    const value = def?.[block];
    if (!value || typeof value !== 'object') continue;
    collectKeys(value, into);
  }
}

function collectKeys(value, into) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) { value.forEach(v => collectKeys(v, into)); return; }
  for (const k of Object.keys(value)) {
    into.add(k);
    collectKeys(value[k], into);
  }
}

const ITEMS = (await import(pathToFileURL(join(ROOT, 'js/data/items.js')).href)).default;

const keys = new Set();
for (const def of Object.values(ITEMS)) collectEffectKeys(def, keys);

const corpus = readSourceCorpus();

// 키를 '읽는' 흔적: 점 접근(.key), 대괄호 접근('key'), 구조분해({ key ), 문자열 비교
const isRead = (key) => {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(\\.${k}\\b)|(['"\`]${k}['"\`])|(\\{[^}]*\\b${k}\\b[^}]*\\}\\s*=)`).test(corpus);
};

const orphans = [...keys].filter(k => !ALLOWLIST[k] && !isRead(k)).sort();

if (orphans.length > 0) {
  console.log(`\n❌ 읽는 코드가 없는 효과 키 ${orphans.length}개:\n`);
  for (const k of orphans) {
    const owners = Object.values(ITEMS)
      .filter(d => EFFECT_BLOCKS.some(b => d?.[b] && JSON.stringify(d[b]).includes(`"${k}"`)))
      .map(d => `${d.name}(${d.id})`);
    console.log(`   ${k}\n      선언: ${owners.slice(0, 6).join(', ')}${owners.length > 6 ? ` 외 ${owners.length - 6}건` : ''}`);
  }
  console.log('\n→ 소비처를 배선하거나, 효과를 데이터에서 지우거나, 의도적 미배선이면');
  console.log('  tools/check-effect-wiring.mjs 의 ALLOWLIST에 사유와 함께 등록하세요.\n');
  process.exit(1);
}

console.log(`✅ 효과 키 ${keys.size}개 모두 읽는 코드가 있습니다.`);
