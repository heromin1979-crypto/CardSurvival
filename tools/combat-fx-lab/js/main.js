// 전투 FX 랩 — 진입점: 월드 2개(개선 전/후) + 비교 뷰 + 탭 패널
import { loadManifest, classifySheets, fxSpriteMap, img, imgReady } from './assets.js';
import { World, W, H, SOCKET_LABELS, preloadScene } from './world.js';
import { BASELINE, IMPROVED, IMPROVED_BINDINGS, LEGACY_BINDINGS, BACKDROPS, ACTIONS, WEATHERS, TIMES, LEGACY_FX_MAP, clone } from './presets.js';
import { builtinLibrary } from './fxLibrary.js';
import { buildGraph, compileGraph, NODE_TYPES } from './fxNodes.js';
import { NodeEditor } from './nodeEditor.js';
import { mountTimeline } from './timeline.js';

const LS_KEY = 'cfx-lab-v1';
const $ = (s) => document.querySelector(s);

const state = {
  view: 'split', scope: 'tab', tab: 'bg', split: 0.5,
  action: 'attack', loop: true, crit: false, kill: false,
  preview: { on: true, target: 'target_center', interval: 1100 },
  currentFx: 'slash_arc', bindAction: 'attack', selEvent: null,
};
const scene = { backdrop: 'jongno', player: 'soldier_m', enemy: 'zombie_common', enemy2: 'zombie_runner', speed: 1 };

let AFTER = clone(IMPROVED);
let LIBRARY = builtinLibrary();
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
  if (saved?.config) AFTER = mergeCfg(clone(IMPROVED), saved.config);
  if (Array.isArray(saved?.library) && saved.library.length) LIBRARY = mergeLibrary(saved.library);
  if (saved?.scene) Object.assign(scene, saved.scene);
} catch { /* 저장 없음 */ }

function mergeCfg(base, over) {
  for (const k of Object.keys(base)) if (over[k] && typeof over[k] === 'object') base[k] = k === 'bind' ? over[k] : { ...base[k], ...over[k] };
  return base;
}
function mergeLibrary(saved) {
  const byId = new Map(builtinLibrary().map((g) => [g.id, g]));
  for (const g of saved) byId.set(g.id, g);
  return [...byId.values()];
}
let saveTimer = 0;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ config: AFTER, library: LIBRARY, scene })); } catch { /* 무시 */ }
  }, 300);
}

const TAB_SECTIONS = { bg: ['bg'], env: ['env'], fx: ['fx'], node: ['fx'], bind: ['bind'], feel: ['feel'] };
function beforeCfg() {
  if (state.scope === 'all') return BASELINE;
  const out = { ...AFTER };
  for (const s of TAB_SECTIONS[state.tab]) out[s] = BASELINE[s];
  return out;
}

let worldB, worldA, manifest, sheets, editor = null, timeline = null;
const stage = $('#stage');
const sctx = stage.getContext('2d');

// ── 부팅 ─────────────────────────────────────────────────────
async function boot() {
  try {
    manifest = await loadManifest();
  } catch (e) {
    $('#loading').textContent = `매니페스트를 불러오지 못했습니다 (${e.message}). 프로젝트 루트에서 node serve.js 로 실행하세요.`;
    return;
  }
  sheets = classifySheets(manifest);
  fillSceneSelects();
  await preloadScene(manifest, scene);
  const sprites = fxSpriteMap();
  worldB = new World({ manifest, cfg: beforeCfg, scene: () => scene, sprites, label: 'before' });
  worldA = new World({ manifest, cfg: () => AFTER, scene: () => scene, sprites, label: 'after' });
  for (const w of [worldB, worldA]) w.fx.setLibrary(LIBRARY);
  $('#loading').classList.add('hide');
  window.__lab = { worldA, worldB, state, scene };
  buildActionButtons();
  bindTopbar();
  selectTab('bg');
  requestAnimationFrame(loop);
}

function fillSceneSelects() {
  const opt = (k, sel) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${k}</option>`;
  $('#sel-player').innerHTML = `<optgroup label="플레이어">${sheets.players.map((k) => opt(k, scene.player)).join('')}</optgroup><optgroup label="동료">${sheets.companions.map((k) => opt(k, scene.player)).join('')}</optgroup>`;
  $('#sel-enemy').innerHTML = sheets.enemies.map((k) => opt(k, scene.enemy)).join('');
  $('#sel-enemy2').innerHTML = `<option value="none">없음</option>${sheets.enemies.map((k) => opt(k, scene.enemy2)).join('')}`;
  const onScene = async () => {
    scene.player = $('#sel-player').value; scene.enemy = $('#sel-enemy').value; scene.enemy2 = $('#sel-enemy2').value;
    await preloadScene(manifest, scene);
    worldB.buildActors(); worldA.buildActors();
    timeline?.refresh();
    persist();
  };
  ['#sel-player', '#sel-enemy', '#sel-enemy2'].forEach((s) => $(s).addEventListener('change', onScene));
}

function buildActionButtons() {
  const box = $('#actions');
  box.innerHTML = '';
  for (const [k, a] of Object.entries(ACTIONS)) {
    const b = document.createElement('button');
    b.dataset.k = k;
    b.innerHTML = `${a.label}<kbd>${a.key}</kbd>`;
    b.onclick = () => trigger(k);
    box.appendChild(b);
  }
  markAction();
  window.addEventListener('keydown', (e) => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName ?? '')) return;
    const hit = Object.entries(ACTIONS).find(([, a]) => a.key === e.key);
    if (hit) trigger(hit[0]);
    if (e.key === ' ') { e.preventDefault(); trigger(state.action); }
  });
  $('#opt-crit').onchange = (e) => { state.crit = e.target.checked; };
  $('#opt-kill').onchange = (e) => { state.kill = e.target.checked; };
  $('#opt-loop').onchange = (e) => { state.loop = e.target.checked; };
}

function markAction() {
  document.querySelectorAll('#actions button').forEach((b) => b.classList.toggle('primary', b.dataset.k === state.action));
}

function visibleWorlds() {
  return state.view === 'before' ? [worldB] : state.view === 'after' ? [worldA] : [worldB, worldA];
}

function isDual() { return state.view === 'split' || state.view === 'sbs'; }
function resizeStage() {
  const w = state.view === 'sbs' ? W * 2 : W;
  if (stage.width !== w) stage.width = w;
  $('#stage-wrap').classList.toggle('sbs', state.view === 'sbs');
}

function trigger(key) {
  state.action = key;
  markAction();
  for (const w of visibleWorlds()) w.startAction(key, { crit: state.crit, kill: state.kill });
  idleMs = 0;
  if (state.tab === 'bind' && state.bindAction !== key) { state.bindAction = key; renderTab(); }
}

function spawnPreview(id) {
  for (const w of visibleWorlds()) {
    const t = state.preview.target;
    const e0 = w.enemies[0];
    const pos = t === 'screen' ? { x: W / 2, y: H * 0.55 } : t === 'weapon' ? w.player.socket('weapon') : t === 'target_feet' ? e0.socket('feet') : e0.socket('center');
    const mapped = w.cfg().fx.mode === 'legacy' ? LEGACY_FX_MAP[id] : id;
    if (mapped) w.fx.spawn(mapped, { x: pos.x, y: pos.y, rot: 0, flip: 1, scale: 1 });
  }
}

// ── 상단 바 ─────────────────────────────────────────────────
function bindTopbar() {
  document.querySelectorAll('#view-seg button').forEach((b) => { b.onclick = () => setView(b.dataset.v); });
  document.querySelectorAll('#scope-seg button').forEach((b) => {
    b.onclick = () => {
      state.scope = b.dataset.s;
      document.querySelectorAll('#scope-seg button').forEach((x) => x.classList.toggle('on', x === b));
      layoutSplit();
    };
  });
  $('#speed').onchange = (e) => { scene.speed = parseFloat(e.target.value); };
  document.querySelectorAll('#tabs button').forEach((b) => { b.onclick = () => selectTab(b.dataset.tab); });
  $('#export-btn').onclick = () => {
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), config: AFTER, library: LIBRARY }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'combat-fx-config.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  $('#import-file').onchange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data.config) AFTER = mergeCfg(clone(IMPROVED), data.config);
      if (Array.isArray(data.library)) { LIBRARY = mergeLibrary(data.library); for (const w of [worldB, worldA]) w.fx.setLibrary(LIBRARY); }
      worldA.cfg = () => AFTER;
      persist();
      renderTab();
    } catch (err) { alert(`불러오기 실패: ${err.message}`); }
    e.target.value = '';
  };
  // 분할 핸들
  const handle = $('#split-handle');
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = $('#stage-wrap').getBoundingClientRect();
    const move = (ev) => { state.split = Math.max(0.05, Math.min(0.95, (ev.clientX - rect.left) / rect.width)); layoutSplit(); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  });
}

function setView(v) {
  state.view = v;
  document.querySelectorAll('#view-seg button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
  layoutSplit();
}

function layoutSplit() {
  resizeStage();
  const split = state.view === 'split';
  $('#split-handle').style.display = split ? '' : 'none';
  $('#split-handle').style.left = `${state.split * 100}%`;
  $('#badge-left').style.display = state.view === 'after' ? 'none' : '';
  $('#badge-right').style.display = state.view === 'before' ? 'none' : '';
  $('#badge-left').textContent = state.scope === 'tab' && state.view !== 'before' ? `개선 전 · ${TAB_INFO[state.tab].short}` : '개선 전 (현재 게임)';
  $('#badge-right').textContent = '개선 후';
}

// ── 메인 루프 ───────────────────────────────────────────────
let last = performance.now(), idleMs = 0, previewAcc = 0, fpsAcc = 0, fpsN = 0, fps = 60;
function loop(now) {
  const dt = Math.min(50, now - last);
  last = now;
  fpsAcc += dt; fpsN += 1;
  if (fpsAcc > 500) { fps = Math.round((fpsN * 1000) / fpsAcc); fpsAcc = 0; fpsN = 0; }
  const ws = visibleWorlds();
  const previewing = state.tab === 'node' && state.preview.on;
  if (previewing) {
    previewAcc += dt * scene.speed;
    if (previewAcc >= state.preview.interval) { previewAcc = 0; spawnPreview(state.currentFx); }
  } else if (state.loop) {
    if (ws.every((w) => !w.busy)) idleMs += dt; else idleMs = 0;
    if (idleMs > 750) trigger(state.action);
  }
  for (const w of ws) { w.update(dt); w.render(); }

  sctx.setTransform(1, 0, 0, 1, 0, 0);
  if (state.view === 'sbs') {
    sctx.drawImage(worldB.canvas, 0, 0);
    sctx.drawImage(worldA.canvas, W, 0);
    sctx.fillStyle = '#000';
    sctx.fillRect(W - 2, 0, 4, H);
  } else if (state.view === 'split') {
    const sx = Math.round(W * state.split);
    sctx.drawImage(worldB.canvas, 0, 0, sx, H, 0, 0, sx, H);
    sctx.drawImage(worldA.canvas, sx, 0, W - sx, H, sx, 0, W - sx, H);
  } else {
    sctx.drawImage(ws[0].canvas, 0, 0);
  }
  const pc = ws.reduce((n, w) => n + w.fx.particleCount(), 0);
  $('#stat').textContent = `${fps} fps · 파티클 ${pc}`;
  timeline?.tick(worldA);
  requestAnimationFrame(loop);
}

// ── 탭 ──────────────────────────────────────────────────────
const TAB_INFO = {
  bg: {
    short: '배경', view: 'split',
    title: '③ 배경 개선 전후',
    lead: '현재는 배경 이미지 한 장 위에 CSS 그라데이션을 덮는 구조라 캐릭터가 배경에 “붙어” 보입니다. 원경/근경을 나누고(패럴랙스·원경 흐림), 발밑 접지 그림자·림라이트·빛줄기·안개로 깊이를 만듭니다.',
    where: '현재: <code>css/screens-combat.css</code> <code>.combat-battlefield::before/::after</code><br>반영: 전투 배경을 캔버스 레이어(<code>CombatStageRenderer</code>)로 이관, 배경 데이터에 <code>horizon·shafts·fire</code> 추가',
  },
  env: {
    short: '날씨·광원', view: 'split',
    title: '④ 실제 전투에서 보는 날씨와 광원',
    lead: '지금 전투 화면에서 날씨는 상단 칩 글자뿐입니다. 게임의 실제 날씨 id(<code>GameState.weather.id</code>)와 시간대(<code>NightSystem.isNight</code>)를 받아 비·눈·안개·번개와 어둠을 깔고, 손전등·드럼통 불·비상등·총구 화염이 그 어둠을 밝힙니다. 실내 배경은 천장 틈으로만 비가 들어옵니다.',
    where: '입력: <code>GameState.weather.id</code>, <code>isRainyWeather()</code>, <code>NightSystem.isNight()</code>, 보드의 <code>light_source</code> 태그(손전등)<br>반영: <code>CombatWeatherLayer</code> + <code>CombatLighting</code>',
  },
  fx: {
    short: '이펙트', view: 'sbs',
    title: '⑤ 전투 이펙트 개선',
    lead: '현재 이펙트는 PNG 한 장이 700ms 동안 커졌다 사라지는 방식(<code>_spawnFxOverlay</code>)입니다. 파티클(스파크·혈흔·충격파)과 동적 광원으로 바꾸고, 데미지 숫자도 튀어 오르게 합니다. 아래 버튼으로 이펙트 하나씩 전/후를 비교하세요.',
    where: '현재: <code>js/ui/combat/CombatFxPlayer.js</code> <code>_spawnFxOverlay · _spawnFloatText</code><br>반영: 같은 호출 지점에서 <code>CombatFxCanvas.spawn(id, pos)</code>',
  },
  node: {
    short: '노드', view: 'after',
    title: '⑥ 노드 기반 이펙트 제작',
    lead: '이펙트 하나 = 노드 그래프 하나. <b>생성 → 형태 → 속도 → 힘 → 색상 → 크기 → 렌더</b>를 한 줄(체인)로 잇고, 체인 여러 개를 <b>출력</b>에 모으면 레이어가 합쳐집니다. 광원·화면 노드는 단독 체인으로 붙습니다. 값을 바꾸면 즉시 무대에 반복 재생됩니다.',
    where: '저장: 브라우저 자동 저장 + 상단 <b>⤓ 내보내기</b>(JSON)<br>반영: 내보낸 <code>library</code>를 <code>js/data/combatFxLibrary.json</code>으로 두고 런타임이 그대로 읽음',
  },
  bind: {
    short: '바인딩', view: 'sbs',
    title: '⑦ 캐릭터에 공격·스킬·대시 이펙트 붙이기',
    lead: '스프라이트 시트의 모션(6프레임) 위에 이벤트를 찍습니다. <b>◆ 이펙트</b>는 무기·손·발 같은 소켓에 붙고, <b>◆ 명중</b>은 타격감(⑧)을 발동, <b>● 잔상</b> 구간은 대시 잔상을 켭니다. 마커를 드래그해 타이밍을 맞추세요.',
    where: '현재: 명중 순간 대상에 PNG 1장(발동·돌진 단계 연출 없음)<br>반영: <code>combatMotionManifest</code> 옆에 <code>combatFxBindings</code>(액션별 이벤트 목록)',
  },
  feel: {
    short: '타격감', view: 'sbs',
    title: '⑧ 타격감 — 정지·반동·잔상',
    lead: '현재: 히트스톱 70ms(치명 120ms), 흔들림은 치명·처치 때만 7px, 넉백·반동·피격 섬광·잔상 없음. 개선안은 명중마다 짧은 정지 + 대상 진동, 뒤로 밀림(넉백)과 공격자 반동, 흰 섬광, 치명 줌, 처치 슬로모션, 대시 잔상을 줍니다.',
    where: '현재: <code>CombatFxPlayer._hitstop / _shakeVisual / _critFlash</code><br>반영: 같은 함수에 <code>COMBAT_FEEL</code> 수치 테이블을 연결',
  },
};

function selectTab(tab) {
  state.tab = tab;
  document.body.className = `tab-${tab}`;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  setView(TAB_INFO[tab].view);
  if (tab === 'bind') state.bindAction = state.action;
  renderTab();
}

function head(t) {
  const i = TAB_INFO[t];
  return `<h2>${i.title}</h2><p class="lead">${i.lead}</p><div class="where">${i.where}</div>`;
}

function renderTab() {
  editor?.destroy(); editor = null; timeline = null;
  const body = $('#tab-body');
  const dock = $('#dock');
  dock.innerHTML = '';
  body.innerHTML = head(state.tab);
  ({ bg: tabBg, env: tabEnv, fx: tabFx, node: tabNode, bind: tabBind, feel: tabFeel })[state.tab](body, dock);
  layoutSplit();
}

// 컨트롤 빌더 ────────────────────────────────────────────
function group(parent, title) {
  const g = document.createElement('div');
  g.className = 'group';
  g.innerHTML = `<h4>${title}</h4>`;
  parent.appendChild(g);
  return g;
}
function range(parent, sec, k, label, min, max, step, hint, onChange) {
  const row = document.createElement('div');
  row.className = 'row';
  const base = BASELINE[sec][k];
  row.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${AFTER[sec][k]}"><span class="val">${AFTER[sec][k]}</span>${hint !== false ? `<div class="hint">현재 게임: ${base}${hint ? ` · ${hint}` : ''}</div>` : ''}`;
  const inp = row.querySelector('input');
  inp.oninput = () => { AFTER[sec][k] = parseFloat(inp.value); row.querySelector('.val').textContent = inp.value; onChange?.(); persist(); };
  parent.appendChild(row);
}
function bool(parent, sec, k, label, onChange) {
  const row = document.createElement('label');
  row.className = 'row bool';
  row.innerHTML = `<span>${label} <small style="color:var(--muted)">(현재 ${BASELINE[sec][k] ? '켜짐' : '꺼짐'})</small></span><input type="checkbox" ${AFTER[sec][k] ? 'checked' : ''}>`;
  row.querySelector('input').onchange = (e) => { AFTER[sec][k] = e.target.checked; onChange?.(); persist(); };
  parent.appendChild(row);
}
function select(parent, label, options, value, onChange) {
  const row = document.createElement('div');
  row.className = 'row';
  row.style.gridTemplateColumns = '118px 1fr';
  row.innerHTML = `<label>${label}</label><select>${options.map(([v, t]) => `<option value="${v}" ${v === value ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
  row.querySelector('select').onchange = (e) => { onChange(e.target.value); persist(); };
  parent.appendChild(row);
  return row;
}
function buttons(parent, list) {
  const b = document.createElement('div');
  b.className = 'btns';
  for (const [label, fn, cls] of list) {
    const x = document.createElement('button');
    x.textContent = label;
    if (cls) x.className = cls;
    x.onclick = fn;
    b.appendChild(x);
  }
  parent.appendChild(b);
}
function resetSection(sec) { AFTER[sec] = clone(IMPROVED[sec]); persist(); renderTab(); }

// ③ 배경
function tabBg(body) {
  const g0 = group(body, '무대');
  select(g0, '배경', Object.entries(BACKDROPS).map(([k, b]) => [k, b.label]), scene.backdrop, async (v) => { scene.backdrop = v; await imgReady(BACKDROPS[v].src); });
  const g1 = group(body, '깊이');
  bool(g1, 'bg', 'layered', '원경/근경 레이어 분리');
  range(g1, 'bg', 'parallax', '패럴랙스', 0, 1.5, 0.05, '카메라가 행동을 따라갈 때 원경이 덜 움직임');
  range(g1, 'bg', 'dof', '원경 흐림(px)', 0, 8, 0.5, '피사계 심도');
  bool(g1, 'bg', 'contactShadow', '발밑 접지 그림자');
  range(g1, 'bg', 'rimLight', '림라이트', 0, 1, 0.05, '캐릭터 윤곽을 배경에서 분리');
  const g2 = group(body, '분위기');
  range(g2, 'bg', 'grade', '색보정', 0, 1, 0.05, '시간대 색 + 지평선 안개');
  range(g2, 'bg', 'shafts', '빛줄기', 0, 1, 0.05);
  range(g2, 'bg', 'fog', '안개 띠', 0, 1, 0.05);
  range(g2, 'bg', 'wetFloor', '젖은 바닥 반사', 0, 1, 0.05, '비 올 때 강해짐');
  bool(g2, 'bg', 'dust', '떠다니는 먼지');
  range(g2, 'bg', 'vignette', '비네트', 0, 1, 0.05);
  bool(g2, 'bg', 'legacyOverlay', '기존 CSS 그라데이션 유지');
  buttons(body, [['개선안 값으로 되돌리기', () => resetSection('bg')]]);
}

// ④ 날씨·광원
function tabEnv(body) {
  const g0 = group(body, '입력 (게임 상태)');
  bool(g0, 'env', 'enabled', '날씨·광원 연출 켜기');
  const seasons = [...new Set(WEATHERS.map((w) => w.season))];
  const row = document.createElement('div');
  row.className = 'row';
  row.style.gridTemplateColumns = '118px 1fr';
  row.innerHTML = `<label>날씨 (weather.id)</label><select>${seasons.map((s) => `<optgroup label="${s}">${WEATHERS.filter((w) => w.season === s).map((w) => `<option value="${w.id}" ${w.id === AFTER.env.weather ? 'selected' : ''}>${w.name} — ${w.id}</option>`).join('')}</optgroup>`).join('')}</select>`;
  row.querySelector('select').onchange = (e) => { AFTER.env.weather = e.target.value; persist(); };
  g0.appendChild(row);
  select(g0, '시간대', Object.entries(TIMES), AFTER.env.time, (v) => { AFTER.env.time = v; });
  select(g0, '배경', Object.entries(BACKDROPS).map(([k, b]) => [k, b.label]), scene.backdrop, async (v) => { scene.backdrop = v; await imgReady(BACKDROPS[v].src); });
  range(g0, 'env', 'intensity', '강도', 0, 1.5, 0.05, false);
  range(g0, 'env', 'wind', '바람', -1, 1.5, 0.05, false);
  const g1 = group(body, '광원');
  bool(g1, 'env', 'flashlight', '손전등 (light_source 보유 시)');
  bool(g1, 'env', 'fire', '드럼통 불');
  bool(g1, 'env', 'emergency', '비상등 (실내)');
  bool(g1, 'env', 'dynamicLights', '이펙트 동적 광원 (총구·타격)');
  bool(g1, 'env', 'lightning', '번개 (폭풍)');
  range(g1, 'env', 'actorKey', '캐릭터 키라이트', 0, 1, 0.05, '어둠 속에서도 캐릭터가 먼저 읽히게');
  const tip = document.createElement('p');
  tip.className = 'lead';
  tip.innerHTML = '팁: <b>사격(4)</b>을 밤·비에서 재생하면 총구 화염이 주변과 빗줄기를 순간적으로 밝힙니다. 고가 선로(실외)로 바꾸면 비·눈이 화면 전체에 내립니다.';
  body.appendChild(tip);
  buttons(body, [['개선안 값으로 되돌리기', () => resetSection('env')]]);
}

// ⑤ 이펙트
function tabFx(body) {
  const g0 = group(body, '렌더 방식');
  select(g0, '이펙트', [['legacy', 'PNG 오버레이 (현재)'], ['particle', '파티클 + 동적 광원']], AFTER.fx.mode, (v) => { AFTER.fx.mode = v; });
  select(g0, '데미지 숫자', [['plain', '떠오르기 (현재)'], ['pop', '튀어오름 + 치명 강조']], AFTER.fx.dmgNumbers, (v) => { AFTER.fx.dmgNumbers = v; });
  range(g0, 'fx', 'quality', '파티클 밀도', 0.25, 2, 0.05, '저사양 모바일은 0.5 권장');
  const g1 = group(body, '이펙트별 전/후 (클릭 = 대상 위에 재생)');
  const t = document.createElement('table');
  t.className = 'diff';
  t.innerHTML = '<tr><th>개선 후 (노드)</th><th>개선 전 (PNG)</th><th></th></tr>'
    + LIBRARY.map((g) => `<tr><td class="a">${g.name}</td><td class="b">${LEGACY_FX_MAP[g.id]?.replace('legacy_', '') ?? '— 없음'}</td><td><button data-id="${g.id}">▶</button></td></tr>`).join('');
  t.querySelectorAll('button').forEach((b) => { b.onclick = () => { state.loop = false; $('#opt-loop').checked = false; spawnPreview(b.dataset.id); }; });
  g1.appendChild(t);
  buttons(body, [['개선안 값으로 되돌리기', () => resetSection('fx')]]);
}

// ⑥ 노드
function tabNode(body, dock) {
  const g0 = group(body, '이펙트 라이브러리');
  const list = document.createElement('div');
  list.className = 'lib-list';
  const drawList = () => {
    list.innerHTML = '';
    for (const g of LIBRARY) {
      const b = document.createElement('button');
      b.className = g.id === state.currentFx ? 'on' : '';
      b.innerHTML = `<span>${g.name}</span><small>${g.id}${g.tag ? ` · ${g.tag}` : ''}</small>`;
      b.onclick = () => { state.currentFx = g.id; drawList(); openGraph(); };
      list.appendChild(b);
    }
  };
  g0.appendChild(list);
  drawList();
  const cur = () => LIBRARY.find((g) => g.id === state.currentFx) ?? LIBRARY[0];
  buttons(g0, [
    ['+ 새 이펙트', () => {
      const id = `custom_${Date.now().toString(36)}`;
      LIBRARY.push(buildGraph(id, '새 이펙트', [[
        { type: 'emitter', p: { burst: 20 } }, { type: 'velocity', p: { dir: 'outward', spread: 360 } }, { type: 'color' }, { type: 'size' }, { type: 'render' },
      ]], { tag: '사용자' }));
      state.currentFx = id; syncLib(); drawList(); openGraph();
    }],
    ['복제', () => {
      const g = clone(cur()); g.id = `${g.id}_copy${Date.now().toString(36).slice(-3)}`; g.name += ' 사본'; g.tag = '사용자';
      LIBRARY.push(g); state.currentFx = g.id; syncLib(); drawList(); openGraph();
    }],
    ['이름 변경', () => { const n = prompt('이펙트 이름', cur().name); if (n) { cur().name = n; syncLib(); drawList(); } }],
    ['삭제', () => {
      if (builtinLibrary().some((g) => g.id === state.currentFx)) { alert('내장 이펙트는 삭제 대신 “기본값 복원”을 쓰세요.'); return; }
      LIBRARY = LIBRARY.filter((g) => g.id !== state.currentFx); state.currentFx = LIBRARY[0].id; syncLib(); drawList(); openGraph();
    }, 'danger'],
    ['기본값 복원', () => {
      const def = builtinLibrary().find((g) => g.id === state.currentFx);
      if (!def) return;
      LIBRARY = LIBRARY.map((g) => (g.id === def.id ? def : g)); syncLib(); openGraph();
    }],
    ['JSON 복사', () => navigator.clipboard?.writeText(JSON.stringify(cur(), null, 2))],
  ]);
  const g1 = group(body, '미리보기');
  const pv = document.createElement('div');
  pv.innerHTML = `<label class="row bool"><span>무대에서 반복 재생</span><input type="checkbox" ${state.preview.on ? 'checked' : ''}></label>`;
  pv.querySelector('input').onchange = (e) => { state.preview.on = e.target.checked; };
  g1.appendChild(pv);
  select(g1, '재생 위치', [['target_center', '적 중심'], ['target_feet', '적 발밑'], ['weapon', '플레이어 무기'], ['screen', '화면 중앙']], state.preview.target, (v) => { state.preview.target = v; });
  select(g1, '간격', [['600', '0.6초'], ['1100', '1.1초'], ['1800', '1.8초']], String(state.preview.interval), (v) => { state.preview.interval = +v; });
  const note = document.createElement('p');
  note.className = 'lead';
  note.innerHTML = '노드 연결: 오른쪽 ● 포트를 끌어 다음 노드 왼쪽 ●에 놓기 · 와이어 클릭 = 끊기 · 빈 곳 드래그 = 화면 이동 · 노드 선택 후 Delete = 삭제';
  g1.appendChild(note);

  dock.innerHTML = '<div class="dock-head"><h3>노드 그래프</h3><div class="ne-palette"></div></div><div class="ne-host" style="flex:1;display:flex;min-height:340px"></div>';
  const pal = dock.querySelector('.ne-palette');
  for (const [type, T] of Object.entries(NODE_TYPES)) {
    if (type === 'output') continue;
    const b = document.createElement('button');
    b.textContent = `+ ${T.label.split(' ')[0]}`;
    b.style.borderLeftColor = T.color;
    b.onclick = () => editor?.addNode(type);
    pal.appendChild(b);
  }
  const host = dock.querySelector('.ne-host');
  function openGraph() {
    editor?.destroy();
    host.innerHTML = '<div style="flex:1"></div>';
    editor = new NodeEditor(host.firstChild, {
      onChange: (g) => {
        for (const w of [worldB, worldA]) w.fx.invalidate(g.id);
        editor.setErrors(compileGraph(g).errors);
        persist();
      },
    });
    editor.load(cur());
    editor.setErrors(compileGraph(cur()).errors);
    previewAcc = state.preview.interval;
  }
  function syncLib() { for (const w of [worldB, worldA]) w.fx.setLibrary(LIBRARY); persist(); }
  openGraph();
}

// ⑦ 바인딩
function tabBind(body, dock) {
  const b = () => AFTER.bind[state.bindAction];
  const g0 = group(body, '액션');
  select(g0, '편집할 액션', Object.entries(ACTIONS).map(([k, a]) => [k, `${a.label} (${k})`]), state.bindAction, (v) => { state.bindAction = v; state.selEvent = null; renderTab(); });
  const actorKey = b().actor === 'player' ? scene.player : scene.enemy;
  const motions = Object.keys(manifest[actorKey]?.motions ?? {});
  select(g0, '모션 (시트 행)', [...(b().motion === 'attack' ? [['attack', 'attack (자동)']] : []), ...motions.map((m) => [m, m])], b().motion, (v) => { b().motion = v; timeline?.refresh(); });
  const lo = b().loco;
  select(g0, '이동', [['stationary', '제자리'], ['approach', '접근 후 복귀']], lo.kind, (v) => {
    b().loco = v === 'approach' ? { kind: 'approach', outEnd: 0.36, holdEnd: 0.72, gap: 150 } : { kind: 'stationary' };
    renderTab();
  });
  if (lo.kind === 'approach') {
    for (const [k, label, min, max, step] of [['outEnd', '접근 끝(t)', 0.05, 0.9, 0.01], ['holdEnd', '복귀 시작(t)', 0.1, 0.98, 0.01], ['gap', '대상과 간격(px)', 40, 400, 5]]) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${lo[k]}"><span class="val">${lo[k]}</span>`;
      row.querySelector('input').oninput = (e) => { lo[k] = parseFloat(e.target.value); row.querySelector('.val').textContent = e.target.value; persist(); };
      g0.appendChild(row);
    }
  }
  const g1 = group(body, '선택한 이벤트');
  const evBox = document.createElement('div');
  g1.appendChild(evBox);
  const drawEvent = () => {
    const ev = b().events[state.selEvent];
    evBox.innerHTML = '';
    if (!ev) { evBox.innerHTML = '<p class="lead">타임라인의 마커를 클릭하세요.</p>'; return; }
    const num = (k, label, min, max, step) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label>${label}</label><input type="range" min="${min}" max="${max}" step="${step}" value="${ev[k] ?? 0}"><span class="val">${ev[k] ?? 0}</span>`;
      row.querySelector('input').oninput = (e) => { ev[k] = parseFloat(e.target.value); row.querySelector('.val').textContent = e.target.value; timeline?.refresh(); persist(); };
      evBox.appendChild(row);
    };
    num('t', '시점 t', 0, 1, 0.01);
    if (ev.type === 'fx') {
      select(evBox, '이펙트', LIBRARY.map((g) => [g.id, g.name]), ev.fx, (v) => { ev.fx = v; });
      select(evBox, '소켓', Object.entries(SOCKET_LABELS), ev.socket, (v) => { ev.socket = v; });
      num('rot', '회전°', -180, 180, 1);
      num('scale', '크기', 0.2, 3, 0.05);
      num('dx', '오프셋 X', -200, 200, 1);
      num('dy', '오프셋 Y', -200, 200, 1);
    } else if (ev.type === 'hit') {
      num('power', '위력(타격감 배율)', 0.2, 3, 0.05);
      const box = document.createElement('div');
      box.innerHTML = '<div class="lead" style="margin:6px 0 4px">명중 시 대상에 재생할 이펙트</div>'
        + LIBRARY.map((g) => `<label class="row bool"><span>${g.name}</span><input type="checkbox" value="${g.id}" ${ev.fx?.includes(g.id) ? 'checked' : ''}></label>`).join('');
      box.querySelectorAll('input').forEach((i) => { i.onchange = () => { ev.fx = [...box.querySelectorAll('input:checked')].map((x) => x.value); persist(); }; });
      evBox.appendChild(box);
    } else if (ev.type === 'trail') {
      num('until', '잔상 끝 t', 0, 1, 0.01);
    }
    buttons(evBox, [['이벤트 삭제', () => { b().events.splice(state.selEvent, 1); state.selEvent = null; timeline?.refresh(); drawEvent(); persist(); }, 'danger']]);
  };
  drawEvent();
  buttons(body, [
    ['이 액션 개선안으로 되돌리기', () => { AFTER.bind[state.bindAction] = clone(IMPROVED_BINDINGS[state.bindAction]); state.selEvent = null; persist(); renderTab(); }],
    ['현재 게임 방식 보기', () => { AFTER.bind[state.bindAction] = clone(LEGACY_BINDINGS[state.bindAction]); state.selEvent = null; persist(); renderTab(); }],
  ]);

  timeline = mountTimeline(dock, {
    manifest, getBinding: b, getActorSheet: () => (b().actor === 'player' ? scene.player : scene.enemy),
    actionKey: () => state.bindAction, selected: () => state.selEvent,
    onSelect: (i) => { state.selEvent = i; drawEvent(); },
    onChange: () => { persist(); drawEvent(); },
    onPlay: () => trigger(state.bindAction),
    onAdd: (type) => {
      const ev = type === 'fx' ? { t: 0.4, type: 'fx', fx: 'slash_arc', socket: 'weapon', rot: 0, scale: 1 }
        : type === 'hit' ? { t: 0.5, type: 'hit', fx: ['impact_spark'], power: 1 }
          : { t: 0.05, type: 'trail', until: 0.5 };
      b().events.push(ev);
      state.selEvent = b().events.length - 1;
      timeline.refresh(); drawEvent(); persist();
    },
  });
}

// ⑧ 타격감
const FEEL_PRESETS = {
  '현재 게임': () => clone(BASELINE.feel),
  개선안: () => clone(IMPROVED.feel),
  '묵직하게': () => ({ ...clone(IMPROVED.feel), hitstop: 140, critHitstop: 220, knockback: 42, shake: 9, critShake: 22, shakeMs: 340, zoomPunch: 0.07, recoil: 18 }),
  '가볍고 빠르게': () => ({ ...clone(IMPROVED.feel), hitstop: 50, critHitstop: 90, knockback: 16, shake: 3, critShake: 9, shakeMs: 180, recoil: 6, ghostFade: 160 }),
};
function tabFeel(body) {
  buttons(body, Object.entries(FEEL_PRESETS).map(([k, fn]) => [k, () => { AFTER.feel = fn(); persist(); renderTab(); }]));
  const g0 = group(body, '정지 (히트스톱)');
  range(g0, 'feel', 'hitstop', '일반(ms)', 0, 250, 5);
  range(g0, 'feel', 'critHitstop', '치명(ms)', 0, 400, 5);
  range(g0, 'feel', 'targetJitter', '정지 중 대상 진동', 0, 12, 0.5, '멈춘 동안 맞은 쪽만 떨림');
  const g1 = group(body, '반동');
  range(g1, 'feel', 'knockback', '넉백(px)', 0, 80, 1, '정지가 풀린 뒤 뒤로 밀림');
  range(g1, 'feel', 'recoil', '공격자 반동(px)', 0, 40, 1);
  range(g1, 'feel', 'shake', '흔들림(px)', 0, 30, 0.5);
  range(g1, 'feel', 'critShake', '치명 흔들림(px)', 0, 40, 0.5);
  range(g1, 'feel', 'shakeMs', '흔들림 시간(ms)', 60, 700, 10);
  bool(g1, 'feel', 'shakeEveryHit', '모든 명중에 흔들림');
  range(g1, 'feel', 'zoomPunch', '치명 줌 펀치', 0, 0.12, 0.005);
  range(g1, 'feel', 'hitFlashMs', '피격 흰 섬광(ms)', 0, 200, 5);
  const g2 = group(body, '잔상');
  bool(g2, 'feel', 'afterimage', '잔상 켜기 (바인딩의 ● 구간)');
  range(g2, 'feel', 'ghostCount', '잔상 개수', 1, 12, 1);
  range(g2, 'feel', 'ghostInterval', '간격(ms)', 10, 120, 1);
  range(g2, 'feel', 'ghostFade', '사라짐(ms)', 60, 600, 10);
  const tint = document.createElement('div');
  tint.className = 'row';
  tint.innerHTML = `<label>잔상 색</label><input type="color" value="${AFTER.feel.ghostTint}"><span></span>`;
  tint.querySelector('input').oninput = (e) => { AFTER.feel.ghostTint = e.target.value; persist(); };
  g2.appendChild(tint);
  const g3 = group(body, '처치');
  range(g3, 'feel', 'killSlowmo', '슬로모션 배속', 0.1, 1, 0.05, '1 = 없음 · 액션 바의 “처치” 체크');
  range(g3, 'feel', 'killSlowmoMs', '슬로모션 시간(ms)', 0, 800, 10);
}

boot();
