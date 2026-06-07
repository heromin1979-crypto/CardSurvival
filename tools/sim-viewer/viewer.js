// 시뮬 결과 뷰어 — baseline JSON을 읽어 KPI 표로 렌더
// serve.js의 /api/sim/list로 사용 가능한 baseline 목록을 받고,
// 선택한 파일을 정적 경로에서 fetch한다. (읽기 전용)

const $ = (sel) => document.querySelector(sel);
const statusEl = $('#status');
const viewEl = $('#view');
const selectEl = $('#baseline-select');
const rerunBtn = $('#rerun-btn');

function setStatus(msg, kind = 'info') {
  if (!msg) { statusEl.hidden = true; return; }
  statusEl.hidden = false;
  statusEl.className = `status ${kind}`;
  statusEl.textContent = msg;
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pct = (n) => (n == null ? '—' : `${Number(n).toFixed(1)}%`);

// ── 데이터 로드 ──────────────────────────────────────────────
// baseline 목록을 받아 드롭다운을 다시 채운다. selectPath가 목록에 있으면 그것을 선택.
async function refreshList(selectPath) {
  const r = await fetch('/api/sim/list');
  const j = await r.json();
  const baselines = j.baselines || [];
  selectEl.innerHTML = baselines
    .map((b) => `<option value="${esc(b.path)}">v${b.version}</option>`)
    .join('');
  if (selectPath && baselines.some((b) => b.path === selectPath)) selectEl.value = selectPath;
  return baselines;
}

async function init() {
  selectEl.onchange = () => load(selectEl.value);
  rerunBtn.onclick = rerun;
  $('#trace-btn').onclick = runTrace;
  let baselines;
  try {
    baselines = await refreshList();
  } catch (e) {
    setStatus('목록을 불러오지 못했습니다. serve.js가 실행 중인지 확인하세요.\n' + e.message, 'err');
    return;
  }
  if (!baselines.length) {
    setStatus('baseline 결과 파일이 없습니다. ▶ 다시 측정 버튼을 누르거나 node tools/sim/v2/run_baseline.mjs 로 먼저 측정하세요.', 'err');
    return;
  }
  await load(baselines[0].path); // 최신
}

// ── 다시 측정 ────────────────────────────────────────────────
// 현재 디스크의 데이터로 run_baseline.mjs를 실행하고 결과를 다시 렌더한다.
async function rerun() {
  const startedAt = Date.now();
  rerunBtn.disabled = true;
  selectEl.disabled = true;
  const origLabel = rerunBtn.textContent;
  rerunBtn.textContent = '측정 중…';
  let timer;
  const tick = () => {
    setStatus(`baseline 측정 중… ${Math.round((Date.now() - startedAt) / 1000)}초 경과 (보통 ~30초, 최대 3분)`, 'info');
    timer = setTimeout(tick, 1000);
  };
  tick();
  try {
    const r = await fetch('/api/sim/run', { method: 'POST' });
    const j = await r.json();
    clearTimeout(timer);
    if (!r.ok || !j.ok) {
      setStatus('측정 실패: ' + (j.error || `HTTP ${r.status}`) + (j.detail ? '\n' + j.detail : ''), 'err');
      return;
    }
    // 새 버전이 드롭다운에 나타나도록 목록을 새로고침하고, 그 버전을 선택·로드
    const sec = (j.durationMs / 1000).toFixed(1);
    await refreshList(j.file);
    await load(j.file);
    setStatus(`✅ 측정 완료 (${sec}s) — v${j.version} 생성됨`, 'ok');
  } catch (e) {
    clearTimeout(timer);
    setStatus('측정 요청 실패: ' + e.message, 'err');
  } finally {
    rerunBtn.disabled = false;
    selectEl.disabled = false;
    rerunBtn.textContent = origLabel;
  }
}

async function load(path) {
  setStatus(`${path} 불러오는 중…`, 'info');
  let data;
  try {
    const r = await fetch('/' + path.replace(/^\//, ''));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    data = await r.json();
  } catch (e) {
    setStatus('파일을 불러오지 못했습니다: ' + e.message, 'err');
    return;
  }
  setStatus(null);
  render(data);
}

// ── 렌더 ─────────────────────────────────────────────────────
function render(d) {
  const chars = d.characters || [];
  // 행동 히스토리 캐릭터 드롭다운 동기화 (선택값 보존)
  const tc = $('#trace-char');
  if (tc) {
    const prev = tc.value;
    tc.innerHTML = chars.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if (chars.includes(prev)) tc.value = prev;
  }
  const kpi = d.kpi || {};
  const meta = d.meta || {};
  const parts = [];

  // 메타 바
  const m = (k, v, mono) => `<div class="m"><span class="k">${esc(k)}</span><span class="v${mono ? ' mono' : ''}">${esc(v)}</span></div>`;
  parts.push(`<div class="meta-bar">
    ${m('build', d.buildTag ?? '—')}
    ${m('phase', d.phase ?? '—')}
    ${m('총 runs', d.totalRuns ?? '—')}
    ${m('직업당', meta.runsPerCharacter ?? '—')}
    ${m('목표일', (meta.targetDays ?? '—') + '일')}
    ${m('seed base', meta.seedBase ?? '—')}
    ${m('fingerprint', d.balanceFingerprint ?? '—', true)}
    ${m('leafHash', d.balanceLeafHash ?? '—', true)}
    ${m('leaf 개수', d.drift?.balanceLeafTotal ?? '—')}
    ${m('소요', meta.totalDurationMs != null ? (meta.totalDurationMs / 1000).toFixed(1) + 's' : '—')}
  </div>`);

  // K1 생존율
  const sr = kpi.survivalRate?.byCharacter || {};
  parts.push(section('K1 — 생존율', kpi.survivalRate?.crossCharacterGapPct != null
    ? `직업 간 격차 ${pct(kpi.survivalRate.crossCharacterGapPct)}` : '',
    tableRows(['직업', '생존율', { label: 'runs', num: true }, { label: '생존', num: true }, { label: '±95% CI', num: true }],
      chars.map((c) => {
        const x = sr[c] || {};
        return `<td class="char">${esc(c)}</td>
          <td>${bar(x.ratePct ?? 0, 100, x.ratePct > 0 ? '' : 'danger', pct(x.ratePct))}</td>
          <td class="num">${x.runs ?? '—'}</td>
          <td class="num">${x.survived ?? '—'}</td>
          <td class="num">±${(x.ci95Pct ?? 0)}p</td>`;
      }))));

  // K3 사망일
  const dd = kpi.deathDay?.byCharacter || {};
  const maxDay = Math.max(1, ...chars.map((c) => dd[c]?.meanDay || 0));
  parts.push(section('K3 — 평균 사망일', `목표 ${meta.targetDays ?? '?'}일 중`,
    tableRows(['직업', '평균 사망일', { label: '중앙값', num: true }, { label: '사망 수', num: true }],
      chars.map((c) => {
        const x = dd[c] || {};
        return `<td class="char">${esc(c)}</td>
          <td>${bar(x.meanDay ?? 0, maxDay, 'warn', 'day ' + (x.meanDay ?? '—'))}</td>
          <td class="num">day ${x.medianDay ?? '—'}</td>
          <td class="num">${x.deaths ?? '—'}</td>`;
      }))));

  // K5 사인 (전체 합산)
  const causeAll = {};
  for (const c of chars) {
    const cd = dd[c]?.causeDistribution || {};
    for (const k in cd) causeAll[k] = (causeAll[k] || 0) + cd[k];
  }
  const causeTotal = Object.values(causeAll).reduce((a, b) => a + b, 0) || 1;
  const causeRows = Object.entries(causeAll).sort((a, b) => b[1] - a[1]);
  parts.push(section('K5 — 사망 원인', `전체 ${causeTotal}건 합산`,
    tableRows(['원인', '비율', { label: '건수', num: true }],
      causeRows.map(([k, v]) =>
        `<td class="char">${esc(k)}</td>
         <td>${bar(v, causeTotal, v / causeTotal > 0.5 ? 'danger' : '', pct(100 * v / causeTotal))}</td>
         <td class="num">${v}</td>`))));

  // K6 절망 진입
  const md = kpi.moraleDespair?.byCharacter || {};
  if (Object.keys(md).length) {
    parts.push(section('K6 — 절망(데스 스파이럴) 진입', '>25% = 의심',
      tableRows(['직업', '진입률', { label: '진입 수', num: true }, { label: '탐색차단/run', num: true }, '경고'],
        chars.map((c) => {
          const x = md[c] || {};
          const warn = x.pctEntered > 25;
          return `<td class="char">${esc(c)}</td>
            <td>${bar(x.pctEntered ?? 0, 100, warn ? 'danger' : '', pct(x.pctEntered))}</td>
            <td class="num">${x.enteredDespair ?? '—'}</td>
            <td class="num">${x.avgBlockExplorePerRun ?? '—'}</td>
            <td>${x.warning ? `<span class="pill" style="color:var(--danger)">${esc(x.warning)}</span>` : '—'}</td>`;
        }))));
  }

  // 원본 JSON
  parts.push(`<details><summary>원본 JSON 보기</summary><pre>${esc(JSON.stringify(d, null, 2))}</pre></details>`);

  viewEl.innerHTML = parts.join('');
}

function section(title, sub, inner) {
  return `<section><h2>${esc(title)}${sub ? `<small>${esc(sub)}</small>` : ''}</h2>${inner}</section>`;
}

// headers: 문자열 또는 { label, num: true }(우측 정렬, 숫자 열 헤더용)
function tableRows(headers, rows) {
  const head = headers.map((h) => {
    const label = typeof h === 'string' ? h : h.label;
    const cls = (typeof h === 'object' && h.num) ? ' class="num"' : '';
    return `<th${cls}>${esc(label)}</th>`;
  }).join('');
  const body = rows.map((cells) => `<tr>${cells}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function bar(value, max, kind = '', label = '') {
  const w = Math.max(2, Math.round((value / (max || 1)) * 80));
  return `<span class="bar-cell"><span class="bar ${kind}" style="width:${w}px"></span><span>${esc(label)}</span></span>`;
}

// ── 행동 히스토리 (단일 런 추적) ─────────────────────────────
const traceOut = $('#trace-output');
const traceSummary = $('#trace-summary');

async function runTrace() {
  const char = $('#trace-char').value;
  const seed = Number.parseInt($('#trace-seed').value, 10) || 0;
  if (!char) { setStatus('캐릭터를 먼저 선택하세요 (baseline 로드 필요).', 'err'); return; }
  const btn = $('#trace-btn');
  btn.disabled = true;
  traceSummary.textContent = '추적 중…';
  traceOut.innerHTML = '';
  try {
    const r = await fetch(`/api/sim/trace?char=${encodeURIComponent(char)}&seed=${seed}`);
    const j = await r.json();
    if (!r.ok || j.error) { setStatus('추적 실패: ' + (j.error || `HTTP ${r.status}`), 'err'); traceSummary.textContent = ''; return; }
    renderTrace(j);
  } catch (e) {
    setStatus('추적 요청 실패: ' + e.message, 'err');
    traceSummary.textContent = '';
  } finally {
    btn.disabled = false;
  }
}

// 스탯 칩: 아이콘 + 한글 라벨(title) + 값 + 미니 막대 (낮은 자원=빨강, 높은 피로=노랑)
function statChip(icon, label, value, max, dangerLow) {
  const w = Math.max(2, Math.round((value / max) * 60));
  let kind = '';
  if (dangerLow && value <= max * 0.2) kind = 'low';
  else if (!dangerLow && value >= max * 0.7) kind = 'warn';
  return `<span class="stat-chip" title="${esc(label)}">${icon}<span class="sbar ${kind}" style="width:${w}px"></span><b>${value}</b></span>`;
}

// 색상 분류 (raw 문자열 기준)
const ACT_CLASS = (raw) => raw.startsWith('sleep') ? 'sleep'
  : raw.startsWith('eat') ? 'eat' : raw.startsWith('drink') ? 'drink' : (raw.startsWith('cook') || raw.startsWith('t1Convert')) ? 'cook'
  : (raw.startsWith('explore') || raw.startsWith('fish')) ? 'explore' : raw.startsWith('move') ? 'move' : '';

function renderTrace(j) {
  const aliveTxt = j.alive
    ? `<span class="alive">100일 생존</span>`
    : `<span class="dead">${j.deathDay}일째 사망 · 사인: ${esc(j.deathCause ?? '?')}</span>`;
  traceSummary.innerHTML = `${esc(j.character)} · 런 ${j.seed} — ${aliveTxt}`;

  const legend = `<div class="trace-legend">스탯: 💧 수분 · 🍖 영양 · 😊 사기 · 😴 피로 · ❤️ 체력 <span class="leg-dim">(막대 = 비율 · 빨강 = 고갈 임박 · 노랑 = 피로 높음)</span></div>`;

  const days = j.dailyTrace || [];
  traceOut.innerHTML = legend + days.map((d) => {
    const isDeath = !j.alive && d.day === j.deathDay;
    const s = d.stats || {};
    const stats = [
      statChip('💧', '수분', s.hydration ?? 0, 200, true),
      statChip('🍖', '영양', s.nutrition ?? 0, 100, true),
      statChip('😊', '사기', s.morale ?? 0, 100, true),
      statChip('😴', '피로', s.fatigue ?? 0, 100, false),
      statChip('❤️', '체력', d.hp ?? 0, 105, true),
    ].join('');
    const acts = (d.actions || []).length
      ? `<div class="day-actions">${d.actions.map((a) => `<span class="act ${ACT_CLASS(a.raw || '')}" title="${esc(a.raw || '')}">${esc(a.icon || '')} ${esc(a.text || '')}</span>`).join('')}</div>`
      : `<div class="day-empty">행동 없음 (첫날은 자동 행동을 하지 않습니다)</div>`;
    // 이벤트 종류별 카운트 (이미 한글 라벨)
    const evCount = {};
    for (const e of (d.events || [])) evCount[e] = (evCount[e] || 0) + 1;
    const evs = Object.keys(evCount).length
      ? `<div class="day-events">${Object.entries(evCount).map(([k, n]) => `<span class="ev">${esc(k)}${n > 1 ? ` ×${n}` : ''}</span>`).join('')}</div>`
      : '';
    return `<div class="day-card${isDeath ? ' death' : ''}">
      <div class="day-head">
        <span class="day-num">Day ${d.day}${isDeath ? '<span class="skull">☠</span>' : ''}</span>
        ${stats}
      </div>
      ${acts}${evs}
    </div>`;
  }).join('');
}

init();
