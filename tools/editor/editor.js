// === DATA EDITOR — main app ===
import {
  DATA_FILES,
  extractValue,
  spliceObjectLiteral,
  diffValue,
} from './serialize.js';
import {
  getInfo,
  getFileText,
  saveFiles,
  pushChanges,
} from './api.js';

const state = {
  branch: '?',          // current local git branch (from serve.js)
  gitAvailable: false,  // git executable found on server PATH
  gitReason: '',        // why git unavailable (if so)
  commitMsg: 'data: 에디터에서 데이터 수정',
  files: {},            // key -> { text, data }
  itemIds: new Set(),   // valid item definition ids (for validation/autocomplete)
  itemNames: new Map(), // item id -> 표시 이름
  dirty: new Set(),     // file keys with unsaved changes
  tab: 'districts',
  sel: {},              // tab -> selected sub-key
};

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c) node.append(c.nodeType ? c : document.createTextNode(c));
  }
  return node;
}

function status(msg, kind = 'info') {
  const s = $('#status');
  s.hidden = false;
  s.className = `status ${kind}`;
  s.textContent = msg;
}

function markDirty(fileKey) {
  state.dirty.add(fileKey);
  $('#dirty').hidden = false;
  $('#save-btn').disabled = false;
  refreshChangeCount();
}

// id → 표시 이름 헬퍼
function itemName(id) {
  return id && state.itemNames.get(id) ? state.itemNames.get(id) : '';
}
function districtName(id) {
  return state.files.districts?.data?.[id]?.name || '';
}
// 'name (id)' 형태로 라벨링
function labelWithId(name, id) {
  return name ? `${name} (${id})` : id;
}

function refreshChangeCount() {
  const n = computeChanges().reduce((s, g) => s + g.changes.length, 0);
  const badge = $('#change-count');
  if (badge) badge.textContent = n ? `(${n})` : '';
  const vn = collectIssues().length;
  const vbadge = $('#validate-count');
  if (vbadge) vbadge.textContent = vn ? `(${vn})` : '';
}

// ─── tab switching ───────────────────────────────────────────
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});
function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.tab').forEach((b) =>
    b.classList.toggle('active', b.dataset.tab === tab));
  render();
}

// ─── data loading (로컬 파일에서) ────────────────────────────
async function loadAll() {
  status('로컬 데이터 불러오는 중…', 'info');
  // serve.js 연결 확인 (git이 없어도 읽기/저장은 가능)
  let info;
  try {
    info = await getInfo();
  } catch (e) {
    status(`serve.js에 연결할 수 없습니다. 저장소 루트에서 'node serve.js' 실행 후 http://localhost:8080/tools/editor/ 로 접속하세요. (${e.message})`, 'err');
    return;
  }
  state.gitAvailable = info.git !== false && !!info.branch;
  state.branch = info.branch || '(git 없음)';
  state.gitReason = info.reason || '';
  // valid item ids + 표시 이름 (로컬 items.js — 자동완성/검증/이름표시용)
  try {
    const items = (await import('../../js/data/items.js')).default;
    state.itemIds = new Set(Object.keys(items));
    state.itemNames = new Map(Object.entries(items).map(([id, it]) => [id, it?.name || id]));
    const dl = $('#item-ids');
    dl.innerHTML = '';
    for (const id of [...state.itemIds].sort()) {
      dl.append(el('option', { value: id, label: state.itemNames.get(id) || id }));
    }
  } catch (e) {
    console.warn('item id 목록 로드 실패 (검증 비활성):', e);
  }
  // editable data blocks (로컬 파일 원문 → 파싱). original = 원본 스냅샷(되돌리기용)
  try {
    for (const [key, cfg] of Object.entries(DATA_FILES)) {
      const text = await getFileText(cfg.path);
      const data = extractValue(text, cfg.decl);
      state.files[key] = { text, data, original: structuredClone(data) };
    }
  } catch (e) {
    status(`데이터 로드 실패: ${e.message}`, 'err');
    return;
  }
  state.dirty.clear();
  $('#dirty').hidden = true;
  $('#save-btn').disabled = true;
  refreshChangeCount();
  if (state.gitAvailable) {
    status(`불러오기 완료 (브랜치: ${state.branch}). 탭에서 편집하세요.`, 'ok');
  } else {
    status(`불러오기 완료. ⚠️ git 사용 불가(${state.gitReason}) — 저장은 로컬 디스크에만 기록되고 푸시는 생략됩니다. 수동 커밋이 필요합니다.`, 'info');
  }
  render();
}

// ─── 저장 + 커밋 + 푸시 (로컬 git) ───────────────────────────
async function saveAll() {
  if (state.dirty.size === 0) return;
  const issues = collectIssues();
  if (issues.length) {
    const ok = confirm(
      `검증 문제 ${issues.length}건이 있습니다.\n` +
      issues.slice(0, 5).map((i) => `· ${entityTitle(i.fileKey, i.entityKey)} ▸ ${i.path}: ${i.msg} (${i.id})`).join('\n') +
      (issues.length > 5 ? `\n… 외 ${issues.length - 5}건` : '') +
      '\n\n[확인]=무시하고 저장/푸시,  [취소]=⚠️검증 탭에서 위치 확인');
    if (!ok) { switchTab('validate'); return; }
  }
  $('#save-btn').disabled = true;
  status('로컬 파일 기록 중…', 'info');
  try {
    // 1) 변경된 파일을 스플라이스해 디스크에 기록
    const files = [];
    for (const key of state.dirty) {
      const cfg = DATA_FILES[key];
      const f = state.files[key];
      const newText = spliceObjectLiteral(f.text, cfg.decl, f.data);
      if (newText === f.text) continue;
      f.text = newText;
      files.push({ path: cfg.path, content: newText });
    }
    if (!files.length) { state.dirty.clear(); $('#dirty').hidden = true; status('변경 사항 없음.', 'info'); return; }
    await saveFiles(files);
    state.dirty.clear();
    $('#dirty').hidden = true;

    // 2) git이 없으면 디스크 기록까지만
    if (!state.gitAvailable) {
      status(`💾 로컬 파일 ${files.length}개 저장 완료. git 사용 불가로 푸시 생략 — 수동으로 커밋/푸시하세요.`, 'info');
      return;
    }

    // 3) git add/commit/push
    status('git 커밋 & 푸시 중…', 'info');
    const result = await pushChanges(state.commitMsg, files.map((f) => f.path));
    if (result.pushed) {
      status(`✅ 저장 + 푸시 완료 → ${result.branch}  (${files.length}개 파일)`, 'ok');
    } else {
      status(`저장 완료 (커밋할 변경 없음): ${result.message || ''}`, 'info');
    }
  } catch (e) {
    // 파일은 이미 디스크에 기록된 상태 — 푸시 단계 실패만 알림
    status(`파일은 저장됨. 단계 실패: ${e.message}`, 'err');
  }
}
$('#save-btn').addEventListener('click', saveAll);

// 데이터 무결성 검사 — 위치(파일/엔티티/필드)까지 포함한 상세 이슈 목록
// 각 이슈: { fileKey, entityKey, path, id, msg }
function collectIssues() {
  const issues = [];
  const itemsKnown = state.itemIds.size > 0;
  const badItem = (id) => itemsKnown && id && !state.itemIds.has(id);

  const d = state.files.districts?.data || {};
  for (const [key, dist] of Object.entries(d)) {
    (dist.lootTable || []).forEach((r, i) => {
      if (badItem(r.definitionId)) issues.push({ fileKey: 'districts', entityKey: key, path: `lootTable[${i}].definitionId`, id: r.definitionId, msg: '존재하지 않는 아이템 ID' });
    });
  }

  const lm = state.files.landmarks?.data || {};
  for (const [key, m] of Object.entries(lm)) {
    (m.subLocations || []).forEach((sub, si) => {
      (sub.lootTable || []).forEach((r, i) => {
        if (badItem(r.id)) issues.push({ fileKey: 'landmarks', entityKey: key, path: `${sub.name || `세부장소#${si}`} ▸ lootTable[${i}].id`, id: r.id, msg: '존재하지 않는 아이템 ID' });
      });
    });
  }

  const q = state.files.quests?.data || {};
  const qIds = new Set(Object.keys(q));
  for (const [key, quest] of Object.entries(q)) {
    if (badItem(quest.objective?.definitionId)) issues.push({ fileKey: 'quests', entityKey: key, path: 'objective.definitionId', id: quest.objective.definitionId, msg: '존재하지 않는 아이템 ID' });
    if (quest.objective?.districtId && !d[quest.objective.districtId]) issues.push({ fileKey: 'quests', entityKey: key, path: 'objective.districtId', id: quest.objective.districtId, msg: '존재하지 않는 구(district) ID' });
    (quest.reward?.items || []).forEach((it, i) => {
      if (badItem(it.definitionId)) issues.push({ fileKey: 'quests', entityKey: key, path: `reward.items[${i}].definitionId`, id: it.definitionId, msg: '존재하지 않는 아이템 ID' });
    });
    if (quest.prerequisite && !qIds.has(quest.prerequisite)) issues.push({ fileKey: 'quests', entityKey: key, path: 'prerequisite', id: quest.prerequisite, msg: '존재하지 않는 선행 퀘스트 ID' });
  }
  return issues;
}

// 해당 엔티티가 있는 탭으로 이동 + 선택
function gotoEntity(fileKey, entityKey) {
  state.sel[fileKey] = entityKey;
  switchTab(fileKey);
}

function renderValidationTab() {
  const issues = collectIssues();
  const wrap = el('div', { class: 'detail' });
  wrap.append(el('h2', { text: `⚠️ 검증 (${issues.length})` }));
  if (state.itemIds.size === 0) {
    wrap.append(el('p', { class: 'hint', text: '※ items.js 로드 실패로 아이템 ID 검증이 비활성화돼 있습니다.' }));
  }
  if (!issues.length) {
    wrap.append(el('div', { class: 'empty', text: '문제가 없습니다. 👍' }));
    view.append(wrap);
    return;
  }
  for (const it of issues) {
    const loc = `[${DATA_FILES[it.fileKey].label.split(' ')[0]}] ${entityTitle(it.fileKey, it.entityKey)}`;
    const row = el('fieldset', {}, [
      el('legend', { text: it.msg }),
      el('div', {}, [el('code', { text: it.id || '(빈 값)' })]),
      el('div', { class: 'hint', text: `${loc}  ▸  ${it.path}` }),
      el('button', { class: 'ghost', text: '→ 해당 위치로 이동', onclick: () => gotoEntity(it.fileKey, it.entityKey) }),
    ]);
    wrap.append(row);
  }
  view.append(wrap);
}

// ─── 변경 사항(diff) + 되돌리기 ──────────────────────────────
// original 스냅샷과 현재 data를 비교해 엔티티(구/랜드마크/퀘스트)별 변경 목록 생성
// (diffValue는 serialize.js의 순수 함수)
function entityTitle(fileKey, key) {
  const e = state.files[fileKey].data[key] || state.files[fileKey].original[key] || {};
  if (fileKey === 'quests') return `${e.icon || ''} ${e.title || key} · ${e.characterId || ''}`;
  return `${e.icon || ''} ${e.name || key}`;
}

function computeChanges() {
  const groups = [];
  for (const fileKey of Object.keys(DATA_FILES)) {
    const f = state.files[fileKey];
    if (!f) continue;
    const keys = new Set([...Object.keys(f.original || {}), ...Object.keys(f.data || {})]);
    for (const key of keys) {
      const diffs = [];
      diffValue(f.original?.[key], f.data?.[key], '', diffs);
      if (diffs.length) groups.push({ fileKey, entityKey: key, title: entityTitle(fileKey, key), changes: diffs });
    }
  }
  return groups;
}

function fmtVal(v) {
  if (v === undefined) return '(없음)';
  if (v === null) return 'null';
  if (v === Infinity) return '∞';
  if (typeof v === 'object') return Array.isArray(v) ? `[${v.length}개]` : '{객체}';
  if (typeof v === 'string') return v.length > 40 ? `"${v.slice(0, 40)}…"` : `"${v}"`;
  return String(v);
}

function recomputeDirty(fileKey) {
  const changed = computeChanges().some((g) => g.fileKey === fileKey);
  if (changed) state.dirty.add(fileKey); else state.dirty.delete(fileKey);
  $('#dirty').hidden = state.dirty.size === 0;
  $('#save-btn').disabled = state.dirty.size === 0;
  refreshChangeCount();
}

function revertEntity(fileKey, key) {
  const f = state.files[fileKey];
  if (f.original && key in f.original) f.data[key] = structuredClone(f.original[key]);
  else delete f.data[key];
  recomputeDirty(fileKey);
  render();
}

function revertAll() {
  for (const fileKey of Object.keys(DATA_FILES)) {
    const f = state.files[fileKey];
    if (f) f.data = structuredClone(f.original);
  }
  state.dirty.clear();
  $('#dirty').hidden = true;
  $('#save-btn').disabled = true;
  refreshChangeCount();
  render();
}

function changeRow(g, c) {
  const parts = [];
  if (c.kind === 'added') parts.push('➕ ');
  if (c.kind === 'removed') parts.push('➖ ');
  parts.push(el('code', { text: c.path || '(항목)' }));
  // lootTable 행이면 해당 아이템 이름 표시
  const m = /lootTable\[(\d+)\]/.exec(c.path || '');
  if (m) {
    const row = state.files[g.fileKey].data[g.entityKey]?.lootTable?.[m[1]]
      || state.files[g.fileKey].original[g.entityKey]?.lootTable?.[m[1]];
    const id = row?.definitionId || row?.id;
    if (id) parts.push(el('span', { class: 'chain-badge', text: itemName(id) || id }));
  }
  parts.push(`  ${fmtVal(c.old)} → `);
  parts.push(el('b', { text: fmtVal(c.new) }));
  return el('div', { class: 'hint' }, parts);
}

function renderChangesTab() {
  const groups = computeChanges();
  const total = groups.reduce((s, g) => s + g.changes.length, 0);
  const wrap = el('div', { class: 'detail' });
  wrap.append(el('h2', { text: `🔧 변경 사항 (${total})` }));
  if (!groups.length) {
    wrap.append(el('div', { class: 'empty', text: '변경된 내용이 없습니다.' }));
    view.append(wrap);
    return;
  }
  wrap.append(el('div', { class: 'field-row' }, [
    el('button', { class: 'ghost danger', text: '⟲ 전체 되돌리기',
      onclick: () => { if (confirm('모든 변경을 원본으로 되돌릴까요?')) revertAll(); } }),
  ]));
  for (const g of groups) {
    const fs = el('fieldset', {}, el('legend', {
      text: `[${DATA_FILES[g.fileKey].label.split(' ')[0]}] ${g.title}`,
    }));
    fs.append(el('button', { class: 'ghost', text: '↩ 이 항목 되돌리기',
      onclick: () => revertEntity(g.fileKey, g.entityKey) }));
    for (const c of g.changes) fs.append(changeRow(g, c));
    wrap.append(fs);
  }
  view.append(wrap);
}

// ─── reusable loot-table editor ──────────────────────────────
// rows: array of objects. idKey = 'definitionId' (districts) | 'id' (landmarks).
// extraCols: list of {key, label} numeric columns to show.
function lootTableEditor(rows, idKey, extraCols, fileKey) {
  const total = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0) || 1;
  const tbl = el('table', { class: 'loot' });
  const head = el('tr', {}, [
    el('th', { text: '아이템 ID' }),
    el('th', { text: '이름' }),
    el('th', { text: 'weight' }),
    ...extraCols.map((c) => el('th', { text: c.label })),
    el('th', { text: '%' }),
    el('th', {}),
  ]);
  tbl.append(el('thead', {}, head));
  const body = el('tbody');

  const redrawPct = () => {
    const t = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0) || 1;
    [...body.querySelectorAll('tr')].forEach((tr, i) => {
      const pct = ((Number(rows[i].weight) || 0) / t) * 100;
      tr.querySelector('.pct').textContent = pct.toFixed(1) + '%';
    });
  };

  rows.forEach((row, idx) => {
    const idInput = el('input', { class: 'id', value: row[idKey] ?? '', list: 'item-ids' });
    if (state.itemIds.size && row[idKey] && !state.itemIds.has(row[idKey])) {
      idInput.classList.add('ref-bad');
    }
    const nameCell = el('td', { class: 'name-cell', text: itemName(row[idKey]) });
    idInput.addEventListener('input', () => {
      row[idKey] = idInput.value.trim();
      idInput.classList.toggle('ref-bad',
        state.itemIds.size && row[idKey] && !state.itemIds.has(row[idKey]));
      nameCell.textContent = itemName(row[idKey]);
      markDirty(fileKey);
    });
    const wInput = el('input', { class: 'num', type: 'number', value: row.weight ?? 0 });
    wInput.addEventListener('input', () => {
      row.weight = Number(wInput.value); markDirty(fileKey); redrawPct();
    });
    const tr = el('tr', {}, [
      el('td', {}, idInput),
      nameCell,
      el('td', {}, wInput),
      ...extraCols.map((c) => {
        const inp = el('input', { class: 'num', type: 'number', step: 'any', value: row[c.key] ?? '' });
        inp.addEventListener('input', () => {
          if (inp.value === '') delete row[c.key];
          else row[c.key] = Number(inp.value);
          markDirty(fileKey);
        });
        return el('td', {}, inp);
      }),
      el('td', { class: 'pct', text: (((Number(row.weight) || 0) / total) * 100).toFixed(1) + '%' }),
      el('td', {}, el('button', {
        class: 'ghost danger', text: '✕',
        onclick: () => { rows.splice(idx, 1); markDirty(fileKey); rerenderDetail(); },
      })),
    ]);
    body.append(tr);
  });
  tbl.append(body);

  const addBtn = el('button', {
    class: 'ghost row-add', text: '+ 행 추가',
    onclick: () => {
      const nr = { [idKey]: '', weight: 1 };
      for (const c of extraCols) if (c.required) nr[c.key] = 1;
      rows.push(nr); markDirty(fileKey); rerenderDetail();
    },
  });
  return el('div', {}, [tbl, addBtn]);
}

// ─── generic scalar / object field editors ───────────────────
function scalarInput(obj, key, fileKey) {
  const v = obj[key];
  const isNum = typeof v === 'number' && v !== Infinity && v !== -Infinity;
  const inp = el('input', {
    type: isNum ? 'number' : 'text',
    step: 'any',
    value: v === Infinity ? '' : (v ?? ''),
  });
  if (v === Infinity) inp.placeholder = '∞ (Infinity)';
  inp.addEventListener('input', () => {
    obj[key] = isNum ? Number(inp.value) : inp.value;
    markDirty(fileKey);
  });
  return el('div', { class: 'field' }, [el('label', { text: key }), inp]);
}

// item-reward rows: [{definitionId, qty}]
function itemRows(arr, fileKey) {
  const wrap = el('div');
  arr.forEach((it, idx) => {
    const id = el('input', { class: 'id', value: it.definitionId ?? '', list: 'item-ids' });
    const nm = el('span', { class: 'chain-badge', text: itemName(it.definitionId) });
    id.addEventListener('input', () => {
      it.definitionId = id.value.trim(); nm.textContent = itemName(it.definitionId); markDirty(fileKey);
    });
    const qty = el('input', { class: 'num', type: 'number', value: it.qty ?? 1 });
    qty.addEventListener('input', () => { it.qty = Number(qty.value); markDirty(fileKey); });
    wrap.append(el('div', { class: 'field-row' }, [
      el('div', { class: 'field' }, [el('label', { text: 'item' }), id]),
      el('div', { class: 'field' }, [el('label', { text: '이름' }), nm]),
      el('div', { class: 'field' }, [el('label', { text: 'qty' }), qty]),
      el('button', { class: 'ghost danger', text: '✕',
        onclick: () => { arr.splice(idx, 1); markDirty(fileKey); rerenderDetail(); } }),
    ]));
  });
  wrap.append(el('button', { class: 'ghost row-add', text: '+ 아이템',
    onclick: () => { arr.push({ definitionId: '', qty: 1 }); markDirty(fileKey); rerenderDetail(); } }));
  return wrap;
}

// render an arbitrary object's fields (scalars + special 'items' array)
function objectFields(obj, fileKey) {
  if (!obj) return el('div', { class: 'hint', text: '(없음)' });
  const wrap = el('div');
  const scalars = el('div', { class: 'field-row' });
  for (const key of Object.keys(obj)) {
    if (key === 'items' && Array.isArray(obj.items)) continue;
    scalars.append(scalarInput(obj, key, fileKey));
  }
  if (scalars.children.length) wrap.append(scalars);
  if (Array.isArray(obj.items)) {
    wrap.append(el('div', { class: 'hint', text: 'items' }));
    wrap.append(itemRows(obj.items, fileKey));
  }
  return wrap;
}

// ─── rendering ───────────────────────────────────────────────
function render() {
  view.innerHTML = '';
  if (state.tab === 'settings') return renderSettings();
  if (state.tab === 'changes') return renderChangesTab();
  if (state.tab === 'validate') return renderValidationTab();
  if (!state.files[state.tab]) {
    view.append(el('div', { class: 'empty', text: '데이터 불러오는 중… (serve.js가 떠 있어야 합니다)' }));
    return;
  }
  if (state.tab === 'districts') return renderListTab('districts', (d) => d.name);
  if (state.tab === 'landmarks') return renderListTab('landmarks', (d) => d.name);
  if (state.tab === 'quests') return renderQuestsTab();
}

let rerenderDetail = () => {};

function renderListTab(fileKey, labelFn) {
  const data = state.files[fileKey].data;
  const keys = Object.keys(data);
  if (!state.sel[fileKey] || !data[state.sel[fileKey]]) state.sel[fileKey] = keys[0];

  const sidebar = el('div', { class: 'sidebar' },
    keys.map((k) => el('button', {
      class: 'side-item' + (k === state.sel[fileKey] ? ' active' : ''),
      text: `${data[k].icon ? data[k].icon + ' ' : ''}${labelFn(data[k]) || k}`,
      onclick: () => { state.sel[fileKey] = k; rerenderDetail(); },
    })));

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b, i) =>
      b.classList.toggle('active', keys[i] === state.sel[fileKey]));
    detailWrap.innerHTML = '';
    if (fileKey === 'districts') renderDistrictDetail(detailWrap, data[state.sel[fileKey]]);
    else renderLandmarkDetail(detailWrap, data[state.sel[fileKey]]);
  };
  rerenderDetail();
  view.append(el('div', { class: 'list-layout' }, [sidebar, detailWrap]));
}

function renderDistrictDetail(root, dist) {
  root.append(el('h2', { text: `${dist.icon || ''} ${dist.name || dist.id}` }));
  root.append(el('div', { class: 'sub', text: dist.description || '' }));

  const numKeys = ['dangerLevel', 'travelCostTP', 'radiation', 'encounterChance', 'noiseGen', 'fishingQuality'];
  const fr = el('div', { class: 'field-row' });
  for (const k of numKeys) if (k in dist) fr.append(scalarInput(dist, k, 'districts'));
  root.append(fr);

  const fs = el('fieldset', {}, el('legend', { text: 'lootTable (탐색 드랍 가중치)' }));
  fs.append(lootTableEditor(
    dist.lootTable || (dist.lootTable = []),
    'definitionId',
    [{ key: 'minQty', label: 'min' }, { key: 'maxQty', label: 'max' }, { key: 'contamChance', label: '오염%' }],
    'districts',
  ));
  root.append(fs);
}

function renderLandmarkDetail(root, lm) {
  root.append(el('h2', { text: `${lm.icon || ''} ${lm.name || ''}` }));
  root.append(el('div', { class: 'sub', text: lm.desc || '' }));
  const subs = lm.subLocations || [];
  if (!subs.length) {
    root.append(el('div', { class: 'hint', text: '세부 장소 없음.' }));
    return;
  }
  for (const sub of subs) {
    const fs = el('fieldset', {}, el('legend', { text: `${sub.icon || ''} ${sub.name || sub.id}` }));
    const fr = el('div', { class: 'field-row' });
    if ('dangerMod' in sub) fr.append(scalarInput(sub, 'dangerMod', 'landmarks'));
    // lootCount is a [min,max] tuple
    if (Array.isArray(sub.lootCount)) {
      const mk = (i, label) => {
        const inp = el('input', { type: 'number', value: sub.lootCount[i] ?? 0 });
        inp.addEventListener('input', () => { sub.lootCount[i] = Number(inp.value); markDirty('landmarks'); });
        return el('div', { class: 'field' }, [el('label', { text: label }), inp]);
      };
      fr.append(mk(0, 'lootCount min'), mk(1, 'lootCount max'));
    }
    fs.append(fr);
    fs.append(lootTableEditor(
      sub.lootTable || (sub.lootTable = []),
      'id', [], 'landmarks',
    ));
    root.append(fs);
  }
}

// ─── quests tab ──────────────────────────────────────────────
function renderQuestsTab() {
  const data = state.files.quests.data;
  const ids = Object.keys(data);
  // group by characterId
  const groups = {};
  for (const id of ids) {
    const c = data[id].characterId || '(공통)';
    (groups[c] = groups[c] || []).push(id);
  }
  if (!state.sel.quests || !data[state.sel.quests]) state.sel.quests = ids[0];

  const sidebar = el('div', { class: 'sidebar' });
  for (const [char, qids] of Object.entries(groups)) {
    sidebar.append(el('div', { class: 'side-group', text: char }));
    for (const id of qids) {
      sidebar.append(el('button', {
        class: 'side-item' + (id === state.sel.quests ? ' active' : ''),
        text: `${data[id].icon || ''} ${data[id].title || id}`,
        onclick: () => { state.sel.quests = id; rerenderDetail(); },
      }));
    }
  }

  const detailWrap = el('div', { class: 'detail' });
  rerenderDetail = () => {
    sidebar.querySelectorAll('.side-item').forEach((b) => b.classList.remove('active'));
    detailWrap.innerHTML = '';
    renderQuestDetail(detailWrap, data[state.sel.quests], data);
    // re-highlight
    [...sidebar.querySelectorAll('.side-item')].forEach((b) => {
      if (b.textContent.includes(data[state.sel.quests].title || state.sel.quests)) {
        b.classList.add('active');
      }
    });
  };
  rerenderDetail();
  view.append(el('div', { class: 'list-layout' }, [sidebar, detailWrap]));
}

function renderQuestDetail(root, q, allQuests) {
  root.append(el('h2', { html: `${q.icon || ''} ${q.title || q.id} <span class="chain-badge">${q.id}</span>` }));
  root.append(el('div', { class: 'sub', text: `캐릭터: ${q.characterId || '-'}` }));

  // basic fields
  const fr1 = el('div', { class: 'field-row' });
  for (const k of ['title', 'icon', 'dayTrigger']) {
    if (k in q) fr1.append(scalarInput(q, k, 'quests'));
  }
  // deadlineDays with ∞ toggle
  if ('deadlineDays' in q) {
    const isInf = q.deadlineDays === Infinity;
    const num = el('input', { type: 'number', value: isInf ? '' : q.deadlineDays, disabled: isInf });
    const chk = el('input', { type: 'checkbox', ...(isInf ? { checked: true } : {}) });
    chk.addEventListener('change', () => {
      if (chk.checked) { q.deadlineDays = Infinity; num.disabled = true; num.value = ''; }
      else { q.deadlineDays = Number(num.value) || 0; num.disabled = false; }
      markDirty('quests');
    });
    num.addEventListener('input', () => { q.deadlineDays = Number(num.value); markDirty('quests'); });
    fr1.append(el('div', { class: 'field' }, [
      el('label', { text: 'deadlineDays' }),
      el('div', { class: 'field-row' }, [num, el('label', { class: 'hint' }, [chk, ' ∞'])]),
    ]));
  }
  root.append(fr1);

  // desc
  if ('desc' in q) {
    const ta = el('textarea', { text: q.desc });
    ta.addEventListener('input', () => { q.desc = ta.value; markDirty('quests'); });
    root.append(el('div', { class: 'field grow' }, [el('label', { text: 'desc' }), ta]));
  }

  // prerequisite (chain linkage)
  const sameChar = Object.keys(allQuests).filter((id) => allQuests[id].characterId === q.characterId && id !== q.id);
  const sel = el('select');
  sel.append(el('option', { value: '', ...(q.prerequisite == null ? { selected: true } : {}) }, '(없음)'));
  for (const id of sameChar) {
    sel.append(el('option', { value: id, ...(q.prerequisite === id ? { selected: true } : {}) },
      `${allQuests[id].title || id}`));
  }
  sel.addEventListener('change', () => {
    q.prerequisite = sel.value || null; markDirty('quests');
  });
  // downstream (what depends on this)
  const downstream = Object.values(allQuests).filter((x) => x.prerequisite === q.id).map((x) => x.title || x.id);
  root.append(el('fieldset', {}, [
    el('legend', { text: '연계 (체인)' }),
    el('div', { class: 'field' }, [el('label', { text: 'prerequisite (선행 퀘스트)' }), sel]),
    el('div', { class: 'hint', text: `→ 이 퀘스트를 선행으로 하는 후속: ${downstream.length ? downstream.join(', ') : '없음'}` }),
  ]));

  // objective (condition)
  root.append(el('fieldset', {}, [
    el('legend', { text: '목표 조건 (objective)' }),
    objectiveEditor(q),
  ]));

  // reward + failPenalty
  root.append(el('fieldset', {}, [
    el('legend', { text: '보상 (reward)' }),
    objectFields(q.reward, 'quests'),
  ]));
  if (q.failPenalty) {
    root.append(el('fieldset', {}, [
      el('legend', { text: '실패 패널티 (failPenalty)' }),
      objectFields(q.failPenalty, 'quests'),
    ]));
  }
}

const OBJ_TYPES = ['collect_item', 'collect_item_type', 'craft_item', 'build_structure', 'survive_days', 'visit_district'];
function objectiveEditor(q) {
  const o = q.objective || (q.objective = { type: 'collect_item', count: 1 });
  const wrap = el('div');
  const typeSel = el('select');
  for (const t of OBJ_TYPES) {
    typeSel.append(el('option', { value: t, ...(o.type === t ? { selected: true } : {}) }, t));
  }
  if (!OBJ_TYPES.includes(o.type)) {
    typeSel.append(el('option', { value: o.type, selected: true }, o.type));
  }
  typeSel.addEventListener('change', () => { o.type = typeSel.value; markDirty('quests'); rerenderDetail(); });
  wrap.append(el('div', { class: 'field' }, [el('label', { text: 'type' }), typeSel]));

  // render all non-type keys generically (preserves any variant fields)
  const fr = el('div', { class: 'field-row' });
  for (const key of Object.keys(o)) {
    if (key === 'type') continue;
    if (key === 'definitionId') {
      const inp = el('input', { class: 'id', value: o[key] ?? '', list: 'item-ids' });
      const nm = el('span', { class: 'chain-badge', text: itemName(o[key]) });
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); nm.textContent = itemName(o[key]); markDirty('quests'); });
      fr.append(el('div', { class: 'field' }, [el('label', { text: key }), el('div', { class: 'field-row' }, [inp, nm])]));
    } else if (key === 'districtId') {
      const inp = el('input', { class: 'id', value: o[key] ?? '' });
      const nm = el('span', { class: 'chain-badge', text: districtName(o[key]) });
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); nm.textContent = districtName(o[key]); markDirty('quests'); });
      fr.append(el('div', { class: 'field' }, [el('label', { text: key }), el('div', { class: 'field-row' }, [inp, nm])]));
    } else {
      fr.append(scalarInput(o, key, 'quests'));
    }
  }
  wrap.append(fr);
  return wrap;
}

// ─── settings tab ────────────────────────────────────────────
function renderSettings() {
  const box = el('div', { class: 'detail settings-box' });
  box.append(el('h2', { text: '⚙️ 설정 (로컬)' }));

  box.append(el('div', { class: 'field' }, [
    el('label', { text: '현재 git 브랜치 (로컬)' }),
    el('input', { value: state.branch, disabled: true }),
  ]));

  if (!state.gitAvailable) {
    box.append(el('p', { class: 'hint', html:
      `⚠️ <b>git을 찾을 수 없습니다</b> (${state.gitReason || '미설치/PATH 미설정'}).<br>` +
      '저장하면 로컬 파일에는 기록되지만 <b>자동 푸시는 생략</b>됩니다. ' +
      '아래 중 하나로 해결하세요:<br>' +
      '· <b>Windows</b>: <a href="https://git-scm.com/download/win" target="_blank">Git for Windows</a> 설치 시 ' +
      '"Git from the command line…" 옵션 선택 → <b>터미널을 새로 열고</b> <code>node serve.js</code> 재실행<br>' +
      '· 이미 설치했다면 <code>git --version</code>이 되는 터미널에서 serve.js를 실행<br>' +
      '· 또는 저장 후 직접 <code>git add -A && git commit && git push</code>' }));
  }

  const msg = el('input', { value: state.commitMsg });
  msg.addEventListener('input', () => { state.commitMsg = msg.value; });
  box.append(el('div', { class: 'field' }, [el('label', { text: '커밋 메시지' }), msg]));

  box.append(el('div', { class: 'field-row' }, [
    el('button', { class: 'primary', text: '🔄 로컬에서 다시 불러오기', onclick: () => loadAll() }),
  ]));

  box.append(el('p', { class: 'hint', html:
    '이 에디터는 <b>로컬 serve.js</b>를 통해 동작합니다. 저장소 루트에서 ' +
    '<code>node serve.js</code> 실행 후 <code>http://localhost:8080/tools/editor/</code> 로 접속하세요.<br><br>' +
    '· 데이터는 로컬 파일에서 읽고, 수정 후 <b>[저장 (커밋&푸시)]</b>를 누르면 ' +
    '로컬 디스크에 기록 → 현재 브랜치로 <code>git commit</code> + <code>git push</code> 합니다.<br>' +
    '· 변경된 데이터 블록만 재직렬화됩니다(헤더·함수·export 보존). ' +
    '⚠️ 데이터 블록 내부의 인라인 주석은 보존되지 않습니다 — push 후 <code>git diff</code> 확인 권장.<br>' +
    '· 무결성 검증: <code>node js/data/validate.js</code>' }));
  view.append(box);
}

// 상단 "변경됨" 배지 클릭 → 변경 탭으로 이동
const dirtyFlag = $('#dirty');
if (dirtyFlag) { dirtyFlag.style.cursor = 'pointer'; dirtyFlag.addEventListener('click', () => switchTab('changes')); }

// ─── boot ────────────────────────────────────────────────────
switchTab('districts');
loadAll();
