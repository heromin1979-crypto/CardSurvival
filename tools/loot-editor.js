// District Loot Editor — Card Survival: Ruined City
// Standalone tool that loads js/data/* via File System Access API,
// allows editing lootTable weights / quantities / contamChance per district,
// and writes back to districts.js with surgical replacement.

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const DL_CLASS = { 1: 'dl-1', 2: 'dl-2', 3: 'dl-3', 4: 'dl-4', 5: 'dl-5' };

const state = {
  mode: 'fsa',           // 'server' | 'fsa' | 'drop'
  dirHandle: null,
  districtsHandle: null,
  originalDistrictsText: '',
  districts: [],
  itemsMap: new Map(),   // id -> name
  lootCount: { min: 1, max: 3 },
  selectedKey: null,
  dirty: new Set(),      // district keys with unsaved edits
  baseline: new Map(),   // key -> deep-cloned original entries array (for revert)
};

// ─── Parsers ────────────────────────────────────────────────────────────────

function skipStringsAndComments(src, i) {
  const c = src[i];
  if (c === "'" || c === '"') {
    const q = c;
    i++;
    while (i < src.length && src[i] !== q) {
      if (src[i] === '\\') i++;
      i++;
    }
    return i + 1;
  }
  if (c === '/' && src[i + 1] === '/') {
    while (i < src.length && src[i] !== '\n') i++;
    return i;
  }
  if (c === '/' && src[i + 1] === '*') {
    i += 2;
    while (i < src.length - 1 && !(src[i] === '*' && src[i + 1] === '/')) i++;
    return i + 2;
  }
  return -1;
}

function findBalancedEnd(src, start, openCh, closeCh) {
  let depth = 1;
  let i = start;
  while (i < src.length && depth > 0) {
    const skipped = skipStringsAndComments(src, i);
    if (skipped >= 0) { i = skipped; continue; }
    if (src[i] === openCh) depth++;
    else if (src[i] === closeCh) depth--;
    i++;
  }
  return i - 1;
}

function parseDistricts(src) {
  const districts = [];
  const re = /^ {2}(\w+):\s*\{/gm;
  let m;
  while ((m = re.exec(src)) !== null) {
    const key = m[1];
    const blockStart = m.index + m[0].length;
    const blockEnd = findBalancedEnd(src, blockStart, '{', '}');
    const block = src.slice(blockStart, blockEnd);
    if (!block.includes('lootTable')) continue;

    const pick = (pat) => {
      const r = new RegExp(pat).exec(block);
      return r ? r[1] : null;
    };
    const name = pick("name:\\s*'([^']+)'");
    const icon = pick("icon:\\s*'([^']+)'");
    const desc = pick("description:\\s*'([^']+)'") || '';
    const dl = parseInt(pick('dangerLevel:\\s*(\\d+)') || '0', 10);
    const enc = parseFloat(pick('encounterChance:\\s*([0-9.]+)') || '0');
    const rad = parseInt(pick('radiation:\\s*(\\d+)') || '0', 10);
    const tp = parseInt(pick('travelCostTP:\\s*(\\d+)') || '0', 10);
    const noise = parseInt(pick('noiseGen:\\s*(\\d+)') || '0', 10);
    const hasFishing = pick('hasFishing:\\s*(true|false)') === 'true';
    const fq = parseInt(pick('fishingQuality:\\s*(\\d+)') || '0', 10);
    const sp = pick("special:\\s*'([^']+)'");
    const special = sp;

    // Locate lootTable [...] range within FULL src (not block) for save reuse
    const range = findLootTableRange(src, key);
    const entries = [];
    if (range) {
      const arrText = src.slice(range.start, range.end);
      const entryRe = /\{\s*definitionId:\s*'([^']+)',\s*weight:\s*(\d+),\s*minQty:\s*(\d+),\s*maxQty:\s*(\d+)(?:,\s*contamChance:\s*([0-9.]+))?\s*\}/g;
      let em;
      while ((em = entryRe.exec(arrText)) !== null) {
        entries.push({
          id: em[1],
          weight: parseInt(em[2], 10),
          minQty: parseInt(em[3], 10),
          maxQty: parseInt(em[4], 10),
          contam: em[5] ? parseFloat(em[5]) : 0,
        });
      }
    }

    districts.push({
      key, name, icon, desc,
      dangerLevel: dl, encounterChance: enc, radiation: rad,
      travelCostTP: tp, noiseGen: noise,
      hasFishing, fishingQuality: fq, special,
      entries,
    });
  }
  return districts;
}

function findLootTableRange(src, key) {
  const re = new RegExp(`^ {2}${key}:\\s*\\{`, 'm');
  const m = re.exec(src);
  if (!m) return null;
  const ltIdx = src.indexOf('lootTable:', m.index);
  if (ltIdx < 0) return null;
  const openBracket = src.indexOf('[', ltIdx);
  if (openBracket < 0) return null;
  const closeBracket = findBalancedEnd(src, openBracket + 1, '[', ']');
  return { start: openBracket + 1, end: closeBracket };
}

function parseItemsMap(textsByName) {
  const map = new Map();
  for (const text of textsByName.values()) {
    const re = /id:\s*'([a-z_0-9]+)',\s*name:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      map.set(m[1], m[2]);
    }
  }
  return map;
}

function parseLootCount(src) {
  const min = parseInt((/lootCountMin:\s*(\d+)/.exec(src) || [])[1] || '1', 10);
  const max = parseInt((/lootCountMax:\s*(\d+)/.exec(src) || [])[1] || '3', 10);
  return { min, max };
}

// ─── Serialization (save) ──────────────────────────────────────────────────

function serializeEntries(entries) {
  const lines = entries.map((e) => {
    const idPart = `'${e.id}',`.padEnd(28, ' ');
    const contam = e.contam > 0 ? `, contamChance: ${formatFloat(e.contam)}` : '';
    return `      { definitionId: ${idPart} weight: ${e.weight}, minQty: ${e.minQty}, maxQty: ${e.maxQty}${contam} },`;
  });
  return '\n' + lines.join('\n') + '\n    ';
}

function formatFloat(n) {
  if (Number.isInteger(n)) return String(n);
  // keep up to 2 decimals, trim trailing zeros
  return n.toFixed(2).replace(/\.?0+$/, '') || '0';
}

function applyEdits(originalText, editedKeys, districts) {
  const replacements = [];
  for (const key of editedKeys) {
    const d = districts.find((x) => x.key === key);
    if (!d) continue;
    const range = findLootTableRange(originalText, key);
    if (!range) continue;
    replacements.push({
      start: range.start,
      end: range.end,
      text: serializeEntries(d.entries),
    });
  }
  replacements.sort((a, b) => b.start - a.start);
  let result = originalText;
  for (const r of replacements) {
    result = result.slice(0, r.start) + r.text + result.slice(r.end);
  }
  return result;
}

// ─── File System Access ────────────────────────────────────────────────────

async function openDataDir() {
  if (!window.showDirectoryPicker) {
    toast('이 브라우저는 FSA를 지원하지 않습니다. 드롭/폴더선택 모드를 사용하세요.', 'err');
    return;
  }
  try {
    const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
    state.dirHandle = dir;

    // Read districts.js
    const districtsFile = await dir.getFileHandle('districts.js');
    state.districtsHandle = districtsFile;
    const f = await districtsFile.getFile();
    const districtsText = await f.text();

    // Read items_*.js
    const itemTexts = new Map();
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind !== 'file') continue;
      if (/^items_.+\.js$/.test(name)) {
        const file = await handle.getFile();
        itemTexts.set(name, await file.text());
      }
    }

    // Read gameBalance.js
    let gbText = null;
    try {
      const gbHandle = await dir.getFileHandle('gameBalance.js');
      const gbFile = await gbHandle.getFile();
      gbText = await gbFile.text();
    } catch (e) { /* optional */ }

    state.mode = 'fsa';
    finalizeLoad(districtsText, itemTexts, gbText);
  } catch (err) {
    console.error(err);
    if (err.name === 'AbortError') return;
    toast('폴더 로드 실패: ' + err.message, 'err');
  }
}

async function tryServerMode() {
  try {
    const ping = await fetch('/api/ping', { cache: 'no-store' });
    if (!ping.ok) return false;
    const res = await fetch('/api/data', { cache: 'no-store' });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('GET /api/data ' + res.status + ': ' + txt);
    }
    const json = await res.json();
    state.mode = 'server';
    state.dirHandle = null;
    state.districtsHandle = null;
    const itemTexts = new Map(Object.entries(json.itemTexts || {}));
    finalizeLoad(json.districtsText, itemTexts, json.gameBalanceText);
    return true;
  } catch (err) {
    if (err && err.message && !err.message.includes('Failed to fetch')) {
      console.warn('[server-mode] ' + err.message);
    }
    return false;
  }
}

async function loadFromFileList(files) {
  let districtsText = null;
  const itemTexts = new Map();
  let gbText = null;
  for (const f of files) {
    const name = f.name;
    if (name === 'districts.js') districtsText = await f.text();
    else if (/^items_.+\.js$/.test(name)) itemTexts.set(name, await f.text());
    else if (name === 'gameBalance.js') gbText = await f.text();
  }
  if (!districtsText) {
    toast('districts.js가 폴더에 없습니다.', 'err');
    return;
  }
  state.mode = 'drop';
  state.dirHandle = null;
  state.districtsHandle = null;
  finalizeLoad(districtsText, itemTexts, gbText);
}

function finalizeLoad(districtsText, itemTexts, gbText) {
  state.originalDistrictsText = districtsText;
  state.itemsMap = parseItemsMap(itemTexts);
  state.lootCount = gbText ? parseLootCount(gbText) : { min: 1, max: 3 };
  state.districts = parseDistricts(districtsText);
  state.baseline.clear();
  state.dirty.clear();
  state.selectedKey = null;
  for (const d of state.districts) {
    state.baseline.set(d.key, deepCloneEntries(d.entries));
  }
  if (state.districts.length === 0) {
    toast('districts.js에서 구를 인식하지 못했습니다.', 'err');
    return;
  }
  enterApp();
  const modeLabel = state.mode === 'fsa' ? 'FSA (덮어쓰기)' : '드롭 (다운로드)';
  toast(`로드 완료 [${modeLabel}]: ${state.districts.length}개 구, ${state.itemsMap.size}개 아이템`, 'ok');
}

async function collectFilesFromEntry(entry, out) {
  if (entry.isFile) {
    const f = await new Promise((res, rej) => entry.file(res, rej));
    out.push(f);
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const readAll = () => new Promise((res, rej) => {
      const all = [];
      const step = () => reader.readEntries((entries) => {
        if (entries.length === 0) res(all);
        else { all.push(...entries); step(); }
      }, rej);
      step();
    });
    const entries = await readAll();
    for (const e of entries) await collectFilesFromEntry(e, out);
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

async function saveAll() {
  if (state.dirty.size === 0) return;
  try {
    const newText = applyEdits(
      state.originalDistrictsText,
      Array.from(state.dirty),
      state.districts,
    );

    // Validate: re-parse to ensure structural integrity
    const reparsed = parseDistricts(newText);
    if (reparsed.length !== state.districts.length) {
      throw new Error(`구 개수 불일치 (저장 전 ${state.districts.length}, 재파싱 후 ${reparsed.length})`);
    }
    for (const dk of state.dirty) {
      const before = state.districts.find((d) => d.key === dk).entries;
      const after = reparsed.find((d) => d.key === dk).entries;
      if (before.length !== after.length) {
        throw new Error(`${dk}: 항목 수 불일치 (${before.length} vs ${after.length})`);
      }
    }

    let savedMsg;
    if (state.mode === 'server') {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ districtsText: newText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      const j = await res.json();
      savedMsg = `서버 저장 완료 (${j.bytes} bytes)`;
    } else if (state.mode === 'fsa' && state.districtsHandle) {
      const w = await state.districtsHandle.createWritable();
      await w.write(newText);
      await w.close();
      savedMsg = '저장 완료 (덮어쓰기)';
    } else {
      downloadText('districts.js', newText);
      savedMsg = 'districts.js 다운로드됨 — js/data/에 교체하세요';
    }

    state.originalDistrictsText = newText;
    for (const dk of state.dirty) {
      const d = state.districts.find((x) => x.key === dk);
      state.baseline.set(dk, deepCloneEntries(d.entries));
    }
    state.dirty.clear();

    renderSidebar();
    updateSaveButton();
    updateRevertButton();
    toast(savedMsg, 'ok');
  } catch (err) {
    console.error(err);
    toast('저장 실패: ' + err.message, 'err');
  }
}

async function reloadFile() {
  if (state.mode === 'drop') {
    toast('드롭 모드에서는 다시 로드 불가 — 인트로로 돌아가서 다시 드롭하세요.', 'err');
    return;
  }
  if (state.dirty.size > 0) {
    if (!confirm('편집 중인 변경사항이 있습니다. 모두 버리고 다시 로드할까요?')) return;
  }
  try {
    let text;
    if (state.mode === 'server') {
      const res = await fetch('/api/data', { cache: 'no-store' });
      if (!res.ok) throw new Error('GET /api/data ' + res.status);
      const json = await res.json();
      text = json.districtsText;
    } else if (state.mode === 'fsa' && state.districtsHandle) {
      const f = await state.districtsHandle.getFile();
      text = await f.text();
    } else {
      throw new Error('reload 불가 모드: ' + state.mode);
    }
    state.originalDistrictsText = text;
    state.districts = parseDistricts(text);
    state.baseline.clear();
    state.dirty.clear();
    for (const d of state.districts) {
      state.baseline.set(d.key, deepCloneEntries(d.entries));
    }
    renderSidebar();
    if (state.selectedKey) selectDistrict(state.selectedKey);
    updateSaveButton();
    toast('다시 로드함', 'info');
  } catch (err) {
    toast('다시 로드 실패: ' + err.message, 'err');
  }
}

// ─── State helpers ─────────────────────────────────────────────────────────

function deepCloneEntries(arr) {
  return arr.map((e) => ({ ...e }));
}

function entriesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    if (x.id !== y.id || x.weight !== y.weight || x.minQty !== y.minQty || x.maxQty !== y.maxQty || x.contam !== y.contam) return false;
  }
  return true;
}

function markDirty(key) {
  const d = state.districts.find((x) => x.key === key);
  const base = state.baseline.get(key);
  if (d && base && entriesEqual(d.entries, base)) {
    state.dirty.delete(key);
  } else {
    state.dirty.add(key);
  }
  renderSidebar();
  updateSaveButton();
  updateRevertButton();
}

function revertDistrict(key) {
  const base = state.baseline.get(key);
  if (!base) return;
  const d = state.districts.find((x) => x.key === key);
  d.entries = deepCloneEntries(base);
  state.dirty.delete(key);
  renderEditor();
  renderSidebar();
  updateSaveButton();
  updateRevertButton();
  toast('되돌렸습니다', 'info');
}

// ─── UI rendering ──────────────────────────────────────────────────────────

function enterApp() {
  $('#intro').style.display = 'none';
  $('#app').classList.add('active');
  const chip = $('#mode-chip');
  chip.className = 'chip ' + state.mode;
  const labels = {
    server: '⚡ 서버 (자동 저장)',
    fsa: '🚀 FSA 덮어쓰기',
    drop: '📁 다운로드',
  };
  const titles = {
    server: '로컬 서버 모드 — 저장 시 disk에 즉시 기록됩니다.',
    fsa: '저장 시 원본 파일을 직접 덮어씁니다.',
    drop: '저장 시 districts.js가 다운로드됩니다. js/data/에 수동 교체하세요.',
  };
  chip.textContent = labels[state.mode] || state.mode;
  chip.title = titles[state.mode] || '';
  $('#btn-reload').disabled = state.mode === 'drop';
  renderSidebar();
}

function renderSidebar() {
  const sorted = [...state.districts].sort((a, b) => {
    if (a.dangerLevel !== b.dangerLevel) return a.dangerLevel - b.dangerLevel;
    return a.key.localeCompare(b.key);
  });
  const list = $('#district-list');
  list.innerHTML = '';
  for (const d of sorted) {
    const row = document.createElement('div');
    row.className = 'district-row';
    if (d.key === state.selectedKey) row.classList.add('selected');
    if (state.dirty.has(d.key)) row.classList.add('dirty');
    row.innerHTML = `
      <span class="icon">${d.icon || '🏙️'}</span>
      <span class="name">${d.name}</span>
      <span class="dl ${DL_CLASS[d.dangerLevel]}">DL${d.dangerLevel}</span>
      <span class="dirty-dot" title="저장되지 않은 변경"></span>
    `;
    row.addEventListener('click', () => selectDistrict(d.key));
    list.appendChild(row);
  }
}

function selectDistrict(key) {
  state.selectedKey = key;
  renderSidebar();
  renderEditor();
}

function renderEditor() {
  const d = state.districts.find((x) => x.key === state.selectedKey);
  if (!d) {
    $('#main-empty').style.display = 'flex';
    $('#editor').classList.remove('active');
    return;
  }
  $('#main-empty').style.display = 'none';
  $('#editor').classList.add('active');

  $('#ed-title').innerHTML = `${d.icon || '🏙️'} ${d.name} <span style="font-family: Consolas, monospace; font-size: 13px; color: var(--muted);">(${d.key})</span>`;
  $('#ed-desc').textContent = d.desc;

  const meta = $('#editor-meta');
  meta.innerHTML = '';
  const chips = [
    `위험도 ${d.dangerLevel}`,
    `조우 ${(d.encounterChance * 100).toFixed(0)}%`,
    `방사선 ${d.radiation}`,
    `이동 ${d.travelCostTP}TP`,
    `소음 ${d.noiseGen}`,
    d.hasFishing ? `🎣 낚시 Q${d.fishingQuality}` : null,
    d.special ? `⭐ ${d.special}` : null,
  ].filter(Boolean);
  for (const c of chips) {
    const el = document.createElement('span');
    el.className = 'chip';
    el.textContent = c;
    meta.appendChild(el);
  }

  renderLootTable(d);
  updateStats(d);
  updateRevertButton();
}

function renderLootTable(d) {
  const tbody = $('#loot-tbody');
  tbody.innerHTML = '';
  const total = d.entries.reduce((s, e) => s + e.weight, 0);
  const maxW = Math.max(1, ...d.entries.map((e) => e.weight));

  for (let idx = 0; idx < d.entries.length; idx++) {
    const e = d.entries[idx];
    const tr = document.createElement('tr');
    tr.dataset.idx = idx;
    const kname = state.itemsMap.get(e.id) || e.id;
    const p1 = total > 0 ? e.weight / total : 0;
    const pe = expectedAppear(p1);
    const barPct = (e.weight / maxW) * 100;

    tr.innerHTML = `
      <td>
        <span class="item-name">${kname}</span>
        <span class="item-id">${e.id}</span>
      </td>
      <td class="num"><input type="number" min="0" step="1" data-field="weight" value="${e.weight}"></td>
      <td class="num pct1">${(p1 * 100).toFixed(2)}%</td>
      <td class="num pctE">${(pe * 100).toFixed(2)}%</td>
      <td class="bar-cell">
        <div class="bar"><div class="bar-fill" style="width: ${barPct}%"></div></div>
      </td>
      <td class="num"><input type="number" min="1" step="1" data-field="minQty" value="${e.minQty}"></td>
      <td class="num"><input type="number" min="1" step="1" data-field="maxQty" value="${e.maxQty}"></td>
      <td class="num"><input type="number" min="0" max="100" step="1" class="contam" data-field="contam" value="${Math.round(e.contam * 100)}"></td>
      <td class="center row-actions">
        <button class="danger" data-action="delete" title="삭제">✕</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // Bind input listeners
  tbody.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('input', onEntryChange);
    inp.addEventListener('change', onEntryChange);
  });
  tbody.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', onDeleteRow);
  });
}

function onEntryChange(ev) {
  const tr = ev.target.closest('tr');
  const idx = parseInt(tr.dataset.idx, 10);
  const field = ev.target.dataset.field;
  const d = state.districts.find((x) => x.key === state.selectedKey);
  const e = d.entries[idx];
  let v = ev.target.value;

  if (field === 'contam') {
    const n = Math.max(0, Math.min(100, parseInt(v || '0', 10)));
    e.contam = n / 100;
  } else {
    const n = Math.max(0, parseInt(v || '0', 10));
    e[field] = n;
    // sanity: minQty <= maxQty
    if (field === 'minQty' && e.minQty > e.maxQty) e.maxQty = e.minQty;
    if (field === 'maxQty' && e.maxQty < e.minQty) e.minQty = e.maxQty;
  }
  // Re-render probability columns (without re-binding all inputs to avoid focus loss)
  refreshComputedCells(d);
  updateStats(d);
  markDirty(d.key);
}

function refreshComputedCells(d) {
  const tbody = $('#loot-tbody');
  const total = d.entries.reduce((s, e) => s + e.weight, 0);
  const maxW = Math.max(1, ...d.entries.map((e) => e.weight));
  Array.from(tbody.children).forEach((tr, idx) => {
    const e = d.entries[idx];
    const p1 = total > 0 ? e.weight / total : 0;
    const pe = expectedAppear(p1);
    tr.querySelector('.pct1').textContent = (p1 * 100).toFixed(2) + '%';
    tr.querySelector('.pctE').textContent = (pe * 100).toFixed(2) + '%';
    tr.querySelector('.bar-fill').style.width = ((e.weight / maxW) * 100) + '%';
    // sync minQty/maxQty inputs if auto-adjusted
    const minInp = tr.querySelector('input[data-field="minQty"]');
    const maxInp = tr.querySelector('input[data-field="maxQty"]');
    if (minInp && document.activeElement !== minInp) minInp.value = e.minQty;
    if (maxInp && document.activeElement !== maxInp) maxInp.value = e.maxQty;
  });
}

function onDeleteRow(ev) {
  const tr = ev.target.closest('tr');
  const idx = parseInt(tr.dataset.idx, 10);
  const d = state.districts.find((x) => x.key === state.selectedKey);
  const e = d.entries[idx];
  const kname = state.itemsMap.get(e.id) || e.id;
  if (!confirm(`"${kname}" (${e.id}) 항목을 삭제할까요?`)) return;
  d.entries.splice(idx, 1);
  renderLootTable(d);
  updateStats(d);
  markDirty(d.key);
}

function updateStats(d) {
  const total = d.entries.reduce((s, e) => s + e.weight, 0);
  $('#stat-count').textContent = d.entries.length;
  $('#stat-total').textContent = total;
  $('#stat-picks').textContent = `${state.lootCount.min}~${state.lootCount.max}`;
}

function updateSaveButton() {
  $('#btn-save').disabled = state.dirty.size === 0;
  const verb = state.mode === 'drop' ? '⬇ 다운로드' : '💾 저장';
  $('#btn-save').textContent = state.dirty.size > 0 ? `${verb} (${state.dirty.size})` : verb;
}

function updateRevertButton() {
  const dirty = state.dirty.has(state.selectedKey);
  $('#btn-revert').disabled = !dirty;
}

function expectedAppear(p) {
  const { min, max } = state.lootCount;
  let sum = 0;
  for (let k = min; k <= max; k++) sum += 1 - Math.pow(1 - p, k);
  return sum / (max - min + 1);
}

// ─── Add item suggest ──────────────────────────────────────────────────────

let suggestActiveIdx = 0;
let suggestList = [];

function onAddInput() {
  const q = $('#add-input').value.trim().toLowerCase();
  const sug = $('#add-row-suggest');
  if (!q) { sug.style.display = 'none'; return; }
  const d = state.districts.find((x) => x.key === state.selectedKey);
  const existingIds = new Set(d.entries.map((e) => e.id));
  const matches = [];
  for (const [id, name] of state.itemsMap.entries()) {
    if (existingIds.has(id)) continue;
    if (id.includes(q) || name.toLowerCase().includes(q)) {
      matches.push({ id, name });
      if (matches.length >= 30) break;
    }
  }
  suggestList = matches;
  suggestActiveIdx = 0;
  sug.innerHTML = matches.map((m, i) => `
    <div class="opt ${i === 0 ? 'active' : ''}" data-id="${m.id}">
      <span>${m.name}</span>
      <span class="id">${m.id}</span>
    </div>
  `).join('');
  sug.style.display = matches.length > 0 ? 'block' : 'none';
  sug.querySelectorAll('.opt').forEach((opt) => {
    opt.addEventListener('click', () => addItemById(opt.dataset.id));
  });
}

function onAddKeydown(ev) {
  const sug = $('#add-row-suggest');
  if (sug.style.display === 'none') return;
  if (ev.key === 'ArrowDown') {
    suggestActiveIdx = Math.min(suggestList.length - 1, suggestActiveIdx + 1);
    highlightSuggest();
    ev.preventDefault();
  } else if (ev.key === 'ArrowUp') {
    suggestActiveIdx = Math.max(0, suggestActiveIdx - 1);
    highlightSuggest();
    ev.preventDefault();
  } else if (ev.key === 'Enter') {
    if (suggestList[suggestActiveIdx]) addItemById(suggestList[suggestActiveIdx].id);
    ev.preventDefault();
  } else if (ev.key === 'Escape') {
    sug.style.display = 'none';
    $('#add-input').value = '';
  }
}

function highlightSuggest() {
  const opts = $('#add-row-suggest').querySelectorAll('.opt');
  opts.forEach((o, i) => o.classList.toggle('active', i === suggestActiveIdx));
}

function addItemById(id) {
  const d = state.districts.find((x) => x.key === state.selectedKey);
  d.entries.push({ id, weight: 5, minQty: 1, maxQty: 1, contam: 0 });
  $('#add-input').value = '';
  $('#add-row-suggest').style.display = 'none';
  renderLootTable(d);
  updateStats(d);
  markDirty(d.key);
}

// ─── Toast ─────────────────────────────────────────────────────────────────

let toastTimer = null;
function toast(msg, type) {
  const el = $('#toast');
  el.className = 'show ' + (type || 'info');
  el.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3000);
}

// ─── Boot ──────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  // Try server mode first (loot-editor-server.mjs running)
  const serverHit = await tryServerMode();
  if (serverHit) {
    bindCommonHandlers();
    return;
  }
  // FSA button — only enable if API available
  const fsaBtn = $('#btn-open');
  if (!window.showDirectoryPicker) {
    fsaBtn.disabled = true;
    fsaBtn.textContent = '📂 FSA 미지원 브라우저';
    fsaBtn.title = 'Chrome/Edge/Brave에서 localhost 서빙 시 사용 가능';
  } else {
    fsaBtn.addEventListener('click', openDataDir);
  }

  // Folder picker (works in all browsers, file:// included)
  $('#btn-pick-folder').addEventListener('click', () => $('#folder-input').click());
  $('#folder-input').addEventListener('change', async (ev) => {
    const files = Array.from(ev.target.files);
    if (files.length > 0) await loadFromFileList(files);
    ev.target.value = '';
  });

  // Drag-drop folder
  const dz = $('#drop-zone');
  ['dragenter', 'dragover'].forEach((evt) => {
    dz.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dz.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dz.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (evt === 'dragleave' && e.target !== dz) return;
      dz.classList.remove('drag-over');
    });
  });
  dz.addEventListener('drop', async (e) => {
    const items = e.dataTransfer.items ? Array.from(e.dataTransfer.items) : [];
    const collected = [];
    if (items.length > 0 && items[0].webkitGetAsEntry) {
      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) await collectFilesFromEntry(entry, collected);
      }
    } else {
      // fallback: flat file list
      collected.push(...Array.from(e.dataTransfer.files || []));
    }
    if (collected.length > 0) await loadFromFileList(collected);
    else toast('파일이 드롭되지 않았습니다.', 'err');
  });

  bindCommonHandlers();
});

function bindCommonHandlers() {
  $('#btn-save').addEventListener('click', saveAll);
  $('#btn-reload').addEventListener('click', reloadFile);
  $('#btn-revert').addEventListener('click', () => {
    if (state.selectedKey) revertDistrict(state.selectedKey);
  });
  $('#add-input').addEventListener('input', onAddInput);
  $('#add-input').addEventListener('keydown', onAddKeydown);
  $('#add-input').addEventListener('blur', () => {
    setTimeout(() => { $('#add-row-suggest').style.display = 'none'; }, 200);
  });

  // Ctrl+S to save
  window.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') {
      ev.preventDefault();
      saveAll();
    }
  });
}
