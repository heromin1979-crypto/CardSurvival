// === DATA EDITOR — main app ===
import {
  DATA_FILES,
  extractValue,
  spliceObjectLiteral,
} from './serialize.js';
import {
  getInfo,
  getFileText,
  saveFiles,
  pushChanges,
} from './api.js';

const state = {
  branch: '?',          // current local git branch (from serve.js)
  commitMsg: 'data: 에디터에서 데이터 수정',
  files: {},            // key -> { text, data }
  itemIds: new Set(),   // valid item definition ids (for validation/autocomplete)
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
  // serve.js 연결 확인 + 현재 브랜치
  try {
    const info = await getInfo();
    state.branch = info.branch || '?';
  } catch (e) {
    status(`serve.js에 연결할 수 없습니다. 저장소 루트에서 'node serve.js' 실행 후 http://localhost:8080/tools/editor/ 로 접속하세요. (${e.message})`, 'err');
    return;
  }
  // valid item ids (로컬 items.js — 자동완성/검증용)
  try {
    const items = (await import('../../js/data/items.js')).default;
    state.itemIds = new Set(Object.keys(items));
    const dl = $('#item-ids');
    dl.innerHTML = '';
    for (const id of [...state.itemIds].sort()) dl.append(el('option', { value: id }));
  } catch (e) {
    console.warn('item id 목록 로드 실패 (검증 비활성):', e);
  }
  // editable data blocks (로컬 파일 원문 → 파싱)
  try {
    for (const [key, cfg] of Object.entries(DATA_FILES)) {
      const text = await getFileText(cfg.path);
      state.files[key] = { text, data: extractValue(text, cfg.decl) };
    }
  } catch (e) {
    status(`데이터 로드 실패: ${e.message}`, 'err');
    return;
  }
  state.dirty.clear();
  $('#dirty').hidden = true;
  $('#save-btn').disabled = true;
  status(`불러오기 완료 (브랜치: ${state.branch}). 탭에서 편집하세요.`, 'ok');
  render();
}

// ─── 저장 + 커밋 + 푸시 (로컬 git) ───────────────────────────
async function saveAll() {
  if (state.dirty.size === 0) return;
  const bad = collectBadRefs();
  if (bad.length) {
    const ok = confirm(
      `존재하지 않는 아이템 ID ${bad.length}건이 있습니다:\n` +
      bad.slice(0, 8).join(', ') + (bad.length > 8 ? ' …' : '') +
      '\n\n그래도 저장/푸시할까요?');
    if (!ok) return;
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

    // 2) git add/commit/push
    status('git 커밋 & 푸시 중…', 'info');
    const result = await pushChanges(state.commitMsg, files.map((f) => f.path));
    state.dirty.clear();
    $('#dirty').hidden = true;
    if (result.pushed) {
      status(`✅ 저장 + 푸시 완료 → ${result.branch}  (${files.length}개 파일)`, 'ok');
    } else {
      status(`저장 완료 (커밋할 변경 없음): ${result.message || ''}`, 'info');
    }
  } catch (e) {
    status(`실패: ${e.message}`, 'err');
    $('#save-btn').disabled = false;
  }
}
$('#save-btn').addEventListener('click', saveAll);

// scan loaded data for item-id references that don't exist
function collectBadRefs() {
  if (state.itemIds.size === 0) return [];
  const bad = new Set();
  const checkId = (id) => { if (id && !state.itemIds.has(id)) bad.add(id); };
  const d = state.files.districts?.data || {};
  for (const dist of Object.values(d)) {
    for (const r of dist.lootTable || []) checkId(r.definitionId);
  }
  const lm = state.files.landmarks?.data || {};
  for (const m of Object.values(lm)) {
    for (const sub of m.subLocations || []) {
      for (const r of sub.lootTable || []) checkId(r.id);
    }
  }
  const q = state.files.quests?.data || {};
  for (const quest of Object.values(q)) {
    if (quest.objective?.definitionId) checkId(quest.objective.definitionId);
    for (const it of quest.reward?.items || []) checkId(it.definitionId);
  }
  return [...bad];
}

// ─── reusable loot-table editor ──────────────────────────────
// rows: array of objects. idKey = 'definitionId' (districts) | 'id' (landmarks).
// extraCols: list of {key, label} numeric columns to show.
function lootTableEditor(rows, idKey, extraCols, fileKey) {
  const total = rows.reduce((s, r) => s + (Number(r.weight) || 0), 0) || 1;
  const tbl = el('table', { class: 'loot' });
  const head = el('tr', {}, [
    el('th', { text: '아이템 ID' }),
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
    idInput.addEventListener('input', () => {
      row[idKey] = idInput.value.trim();
      idInput.classList.toggle('ref-bad',
        state.itemIds.size && row[idKey] && !state.itemIds.has(row[idKey]));
      markDirty(fileKey);
    });
    const wInput = el('input', { class: 'num', type: 'number', value: row.weight ?? 0 });
    wInput.addEventListener('input', () => {
      row.weight = Number(wInput.value); markDirty(fileKey); redrawPct();
    });
    const tr = el('tr', {}, [
      el('td', {}, idInput),
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
    id.addEventListener('input', () => { it.definitionId = id.value.trim(); markDirty(fileKey); });
    const qty = el('input', { class: 'num', type: 'number', value: it.qty ?? 1 });
    qty.addEventListener('input', () => { it.qty = Number(qty.value); markDirty(fileKey); });
    wrap.append(el('div', { class: 'field-row' }, [
      el('div', { class: 'field' }, [el('label', { text: 'item' }), id]),
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
      inp.addEventListener('input', () => { o[key] = inp.value.trim(); markDirty('quests'); });
      fr.append(el('div', { class: 'field' }, [el('label', { text: key }), inp]));
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

// ─── boot ────────────────────────────────────────────────────
switchTab('districts');
loadAll();
