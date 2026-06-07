// === 전투 시뮬레이터 오케스트레이터 ===
// 실제 게임을 iframe(/?tool=combat)으로 띄우고, window.__combatTool 핸들로
// 파티(캐릭터+NPC+장비) vs 몬스터 전투를 셋업·구동한다. 전투 진행·렌더는 실제 게임이 담당.

const $ = (s) => document.querySelector(s);
const frame      = $('#game-frame');
const statusEl   = $('#status');
const startBtn   = $('#start-btn');
const charSelect = $('#char-select');
const charInfo   = $('#char-info');
const npcList    = $('#npc-list');
const enemyChosen= $('#enemy-chosen');
const enemyPalette = $('#enemy-palette');
const equipGrid  = $('#equip-grid');
const presetSelect = $('#preset-select');
const logBody    = $('#log-body');
const logOutcome = $('#log-outcome');

// 슬롯별 장착 규칙 (EquipmentSystem.SLOT_RULES 미러 — 드롭다운 필터용)
const SLOT_RULES = {
  weapon_main: { label: '주무기',   accepts: [{ type: 'weapon', subtypes: ['melee', 'firearm', 'ranged'] }] },
  weapon_sub:  { label: '보조무기',  accepts: [{ type: 'weapon', subtypes: ['melee', 'firearm', 'ranged', 'throwable'] }, { type: 'armor', subtypes: ['offhand'] }] },
  head:        { label: '머리',     accepts: [{ type: 'armor', subtypes: ['head'] }] },
  face:        { label: '얼굴',     accepts: [{ type: 'tool', subtypes: ['protection'] }], requiresOnWear: true },
  body:        { label: '몸통',     accepts: [{ type: 'armor', subtypes: ['vest', 'fullbody', 'clothing'] }] },
  hands:       { label: '손',       accepts: [{ type: 'armor', subtypes: ['hands'] }] },
  backpack:    { label: '가방',     accepts: [{ type: 'tool', subtypes: ['bag'] }] },
  boots:       { label: '신발',     accepts: [{ type: 'armor', subtypes: ['boots'] }] },
};
const SLOT_ORDER = ['weapon_main', 'weapon_sub', 'head', 'face', 'body', 'hands', 'backpack', 'boots'];
const PRESET_KEY = 'combatToolPresets';
const MAX_NPCS = 2;
const MAX_ENEMIES = 5;

// 셋업 상태
const setup = { characterId: null, npcs: [], enemies: [], equipment: {} };

let API = null;       // 현재 iframe의 __combatTool
let pollTimer = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function setStatus(msg, kind = 'info') {
  if (!msg) { statusEl.hidden = true; return; }
  statusEl.hidden = false; statusEl.className = `status ${kind}`; statusEl.textContent = msg;
}

// ── iframe 준비 대기 ─────────────────────────────────────────
function waitForGame() {
  return new Promise((resolve, reject) => {
    const w = frame.contentWindow;
    let tries = 0;
    const check = () => {
      try {
        if (w.__combatToolReady && w.__combatTool) return resolve(w.__combatTool);
      } catch (e) { /* cross-origin 일시 — 무시 */ }
      if (++tries > 200) return reject(new Error('게임 초기화 시간 초과 (10초)'));
      setTimeout(check, 50);
    };
    check();
  });
}

function reloadGame() {
  return new Promise((resolve, reject) => {
    frame.onload = () => waitForGame().then(resolve, reject);
    // 캐시버스트로 확실히 새 부팅
    frame.src = `/?tool=combat&cb=${Date.now()}`;
  });
}

// ── 초기화 ───────────────────────────────────────────────────
async function init() {
  try {
    API = await waitForGame();   // index.html이 이미 src 지정 → 첫 로드 대기
  } catch (e) {
    setStatus('게임을 불러오지 못했습니다. serve.js 실행 여부를 확인하세요.\n' + e.message, 'err');
    return;
  }
  buildForms();
  wireControls();
  refreshPresetList();
  setStatus(null);
  startBtn.disabled = false;
}

// ── 폼 구성 (데이터는 API.GameData / API.NPCS 에서) ──────────
function buildForms() {
  const GameData = API.GameData;

  // 캐릭터
  const chars = GameData.characters || [];
  charSelect.innerHTML = chars.map((c) => `<option value="${esc(c.id)}">${esc(c.name)} — ${esc(c.title ?? c.id)}</option>`).join('');
  setup.characterId = chars[0]?.id ?? null;
  charSelect.value = setup.characterId;
  charSelect.onchange = () => { setup.characterId = charSelect.value; renderCharInfo(); };
  renderCharInfo();

  // NPC (companion.canRecruit)
  const NPCS = API.NPCS || {};
  const recruitable = Object.entries(NPCS).filter(([, d]) => d?.companion?.canRecruit);
  npcList.innerHTML = recruitable.map(([id, d]) =>
    `<label><input type="checkbox" value="${esc(id)}" /> <span>${esc(npcLabel(id, d))}</span></label>`).join('')
    || '<div class="hint">영입 가능한 NPC가 없습니다.</div>';
  npcList.querySelectorAll('input[type=checkbox]').forEach((cb) => {
    cb.onchange = () => {
      if (cb.checked) setup.npcs.push(cb.value);
      else setup.npcs = setup.npcs.filter((x) => x !== cb.value);
      enforceNpcLimit();
    };
  });

  // 몬스터 팔레트
  const enemies = GameData.enemies || {};
  enemyPalette.innerHTML = Object.entries(enemies)
    .filter(([, d]) => d && d.hp && d.attack)   // 전투 가능한 정의만
    .map(([id, d]) => `<button data-id="${esc(id)}" title="${esc(id)}">${esc(d.icon ?? '')} ${esc(d.name ?? id)}</button>`).join('');
  enemyPalette.querySelectorAll('button').forEach((b) => {
    b.onclick = () => { if (setup.enemies.length < MAX_ENEMIES) { setup.enemies.push(b.dataset.id); renderEnemies(); } };
  });
  renderEnemies();

  // 장비 슬롯
  const items = GameData.items || {};
  equipGrid.innerHTML = SLOT_ORDER.map((slot) => {
    const rule = SLOT_RULES[slot];
    const opts = ['<option value="">— 없음 —</option>'].concat(
      Object.entries(items)
        .filter(([, def]) => itemFitsSlot(def, rule))
        .sort((a, b) => (a[1].name || '').localeCompare(b[1].name || ''))
        .map(([id, def]) => `<option value="${esc(id)}">${esc(def.icon ?? '')} ${esc(def.name ?? id)}</option>`)
    ).join('');
    return `<div class="equip-row"><label>${esc(rule.label)}</label><select data-slot="${slot}">${opts}</select></div>`;
  }).join('');
  equipGrid.querySelectorAll('select').forEach((sel) => {
    sel.onchange = () => { setup.equipment[sel.dataset.slot] = sel.value || null; };
  });
}

function itemFitsSlot(def, rule) {
  if (!def) return false;
  const ok = rule.accepts.some((a) => a.type === def.type && a.subtypes.includes(def.subtype));
  if (!ok) return false;
  if (rule.requiresOnWear && !def.onWear) return false;
  return true;
}

function npcLabel(id, d) {
  const name = (id || '').replace(/^npc_/, '');
  const role = d?.companion?.healBonus > 1 ? '🩹' : d?.companion?.combatDmg > 0 ? '⚔️' : '';
  return `${role} ${name} (HP ${d?.maxHp ?? '?'})`;
}

function renderCharInfo() {
  const c = (API.GameData.characters || []).find((x) => x.id === setup.characterId);
  if (!c) { charInfo.textContent = ''; return; }
  const abilities = (c.abilities || []).map((a) => a.name).join(', ');
  charInfo.innerHTML = `HP ${c.maxHp} · 力 ${c.strength} · 耐 ${c.endurance}<br>능력: ${esc(abilities || '—')}`;
}

function enforceNpcLimit() {
  const boxes = [...npcList.querySelectorAll('input[type=checkbox]')];
  const atMax = setup.npcs.length >= MAX_NPCS;
  boxes.forEach((cb) => { cb.disabled = atMax && !cb.checked; });
}

function renderEnemies() {
  const enemies = API.GameData.enemies || {};
  if (!setup.enemies.length) {
    enemyChosen.innerHTML = '<div class="empty">선택된 몬스터 없음 (팔레트에서 추가)</div>';
  } else {
    enemyChosen.innerHTML = setup.enemies.map((id, i) => {
      const d = enemies[id] || {};
      return `<div class="chosen"><span>${esc(d.icon ?? '')} ${esc(d.name ?? id)}</span><button data-i="${i}" title="제거">✕</button></div>`;
    }).join('');
    enemyChosen.querySelectorAll('button').forEach((b) => {
      b.onclick = () => { setup.enemies.splice(Number(b.dataset.i), 1); renderEnemies(); };
    });
  }
  // 팔레트 버튼 활성/비활성
  const atMax = setup.enemies.length >= MAX_ENEMIES;
  enemyPalette.querySelectorAll('button').forEach((b) => { b.disabled = atMax; });
}

// ── 전투 시작 ────────────────────────────────────────────────
async function startCombat() {
  if (!setup.characterId) { setStatus('캐릭터를 선택하세요.', 'err'); return; }
  if (!setup.enemies.length) { setStatus('몬스터를 1마리 이상 선택하세요.', 'err'); return; }
  startBtn.disabled = true;
  stopPolling();
  setStatus('깨끗한 상태로 게임 리로드 중…', 'info');
  try {
    API = await reloadGame();   // 매 전투마다 fresh state
  } catch (e) {
    setStatus('리로드 실패: ' + e.message, 'err'); startBtn.disabled = false; return;
  }
  try {
    applySetup();
    setStatus('전투 시작 — 우측 화면에서 진행하세요.', 'ok');
    startPolling();
  } catch (e) {
    console.error(e);
    setStatus('전투 셋업 실패: ' + e.message, 'err');
  } finally {
    startBtn.disabled = false;
  }
}

function applySetup() {
  const { GameState, StateMachine, CharCreate, EquipmentSystem, GameData, NPCS, instantiateEnemy } = API;

  // 1) 캐릭터 — 실제 CharCreate._startGame 재사용 (전투 스탯/스킬/능력 적용, 보드 초기화)
  const char = (GameData.characters || []).find((c) => c.id === setup.characterId);
  CharCreate._selectedChar = char;
  CharCreate._selectedDistrict = char.homeDist;
  CharCreate._startGame('테스터');

  // 2) 장비 — 정의로 카드 인스턴스 생성 후 장착
  for (const slot of SLOT_ORDER) {
    const defId = setup.equipment[slot];
    if (!defId) continue;
    const inst = GameState.createCardInstance(defId);
    if (inst) EquipmentSystem.equip(inst.instanceId, slot);
  }

  // 3) NPC 동료 — companion state 주입
  GameState.companions = [];
  if (!GameState.npcs) GameState.npcs = { states: {} };
  for (const npcId of setup.npcs.slice(0, MAX_NPCS)) {
    const d = NPCS[npcId];
    GameState.npcs.states[npcId] = {
      ...(GameState.npcs.states[npcId] || {}),
      spawned: true, dismissed: false, isCompanion: true,
      hp: d?.maxHp ?? 50, trust: 5, bond: 0,
      companionSince: 0, lastTreatDay: -1, woundLevel: 0,
      stance: 'attack', skillCooldowns: {}, combatBuffs: {},
    };
    GameState.companions.push(npcId);
  }

  // 4) 몬스터 인스턴스
  const enemyInsts = setup.enemies.map((id) => instantiateEnemy(GameData.enemies[id])).filter(Boolean);

  // 5) encounter → combat 전이 (유효 전이 경로)
  GameState.ui.currentState = 'encounter';
  StateMachine.transition('combat', { enemies: enemyInsts, dangerLevel: 2, nodeId: '__combatTool' });
}

// ── 전투 로그 ────────────────────────────────────────────────
function startPolling() {
  stopPolling();
  pollTimer = setInterval(renderLog, 300);
  renderLog();
}
function stopPolling() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }

function renderLog() {
  const c = API?.GameState?.combat;
  if (!c) return;
  const lines = c.log || [];
  logBody.innerHTML = lines.length
    ? lines.map((l) => `<div class="logline">${esc(l)}</div>`).join('')
    : '<div class="hint">…</div>';
  logBody.scrollTop = logBody.scrollHeight;
  const oc = c.outcome;
  if (oc) {
    logOutcome.textContent = oc === 'victory' ? '— 승리' : oc === 'defeat' ? '— 패배' : '— 도주';
    logOutcome.className = `outcome ${oc}`;
    stopPolling();   // 전투 종료 — 로그 동결
  } else {
    logOutcome.textContent = ''; logOutcome.className = 'outcome';
  }
}

// ── 컨트롤 ───────────────────────────────────────────────────
function wireControls() {
  startBtn.onclick = startCombat;
  $('#expand-btn').onclick = () => {
    const layout = document.querySelector('.layout');
    const on = layout.classList.toggle('expanded');
    $('#expand-btn').textContent = on ? '⛶ 축소' : '⛶ 확대';
    document.querySelector('.preset-bar')?.classList.toggle('dim', on);
  };
  $('#log-copy').onclick = () => {
    const text = [...logBody.querySelectorAll('.logline')].map((d) => d.textContent).join('\n');
    navigator.clipboard?.writeText(text).then(
      () => setStatus('로그를 클립보드에 복사했습니다.', 'ok'),
      () => setStatus('복사 실패 — 권한을 확인하세요.', 'err'));
  };
  $('#preset-save').onclick = savePreset;
  $('#preset-delete').onclick = deletePreset;
  presetSelect.onchange = () => { if (presetSelect.value) loadPreset(presetSelect.value); };
}

// ── 프리셋 (localStorage) ────────────────────────────────────
function getPresets() { try { return JSON.parse(localStorage.getItem(PRESET_KEY)) || {}; } catch { return {}; } }
function setPresets(p) { localStorage.setItem(PRESET_KEY, JSON.stringify(p)); }

function refreshPresetList() {
  const names = Object.keys(getPresets());
  presetSelect.innerHTML = '<option value="">— 불러오기 —</option>' + names.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
}

function savePreset() {
  const name = prompt('프리셋 이름:');
  if (!name) return;
  const presets = getPresets();
  presets[name] = JSON.parse(JSON.stringify({ characterId: setup.characterId, npcs: setup.npcs, enemies: setup.enemies, equipment: setup.equipment }));
  setPresets(presets);
  refreshPresetList();
  presetSelect.value = name;
  setStatus(`프리셋 "${name}" 저장됨.`, 'ok');
}

function deletePreset() {
  const name = presetSelect.value;
  if (!name) { setStatus('삭제할 프리셋을 선택하세요.', 'err'); return; }
  const presets = getPresets();
  delete presets[name];
  setPresets(presets);
  refreshPresetList();
  setStatus(`프리셋 "${name}" 삭제됨.`, 'ok');
}

function loadPreset(name) {
  const p = getPresets()[name];
  if (!p) return;
  setup.characterId = p.characterId;
  setup.npcs = [...(p.npcs || [])];
  setup.enemies = [...(p.enemies || [])];
  setup.equipment = { ...(p.equipment || {}) };
  // 폼 반영
  charSelect.value = setup.characterId; renderCharInfo();
  npcList.querySelectorAll('input[type=checkbox]').forEach((cb) => { cb.checked = setup.npcs.includes(cb.value); });
  enforceNpcLimit();
  equipGrid.querySelectorAll('select').forEach((sel) => { sel.value = setup.equipment[sel.dataset.slot] || ''; });
  renderEnemies();
  setStatus(`프리셋 "${name}" 불러옴.`, 'ok');
}

init();
