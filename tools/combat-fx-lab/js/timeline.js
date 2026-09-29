// 바인딩 타임라인 — 모션 6프레임 썸네일 + 이벤트 마커(드래그로 시점 조정) + 재생 헤드
import { img } from './assets.js';

export function mountTimeline(dock, o) {
  dock.innerHTML = `
    <div class="dock-head">
      <h3>타임라인</h3>
      <button data-a="play" class="primary">▶ 이 액션 재생</button>
      <button data-a="fx">+ ◆ 이펙트</button>
      <button data-a="hit">+ ◆ 명중</button>
      <button data-a="trail">+ ● 잔상 구간</button>
      <div class="spacer"></div>
      <div class="tl-legend"><span><i style="background:#f0a040"></i>이펙트</span><span><i style="background:#ff5a5a"></i>명중(타격감)</span><span><i style="background:#7fd4ff"></i>잔상</span></div>
    </div>
    <div class="tl">
      <div class="tl-frames"></div>
      <div class="tl-track"><div class="tl-play" style="left:0"></div></div>
      <div class="dock-note" style="padding:0"></div>
    </div>`;
  const frames = dock.querySelector('.tl-frames');
  const track = dock.querySelector('.tl-track');
  const play = dock.querySelector('.tl-play');
  const note = dock.querySelector('.dock-note');
  dock.querySelector('[data-a=play]').onclick = o.onPlay;
  for (const k of ['fx', 'hit', 'trail']) dock.querySelector(`[data-a=${k}]`).onclick = () => o.onAdd(k);

  let sheetKey = null;
  function drawFrames() {
    const key = o.getActorSheet();
    const def = o.manifest[key];
    const b = o.getBinding();
    frames.innerHTML = '';
    if (!def) return;
    let mName = b.motion;
    if (!def.motions[mName]) {
      mName = def.aliases?.[mName] ?? (mName === 'attack' ? (['basic_attack', 'basic_a', 'melee'].find((x) => def.motions[x]) ?? Object.keys(def.motions).find((x) => /attack|basic/.test(x))) : 'idle');
    }
    const m = def.motions[mName] ?? def.motions.idle;
    const im = img(def.src);
    const paint = () => {
      frames.querySelectorAll('canvas').forEach((cv, i) => {
        const g = cv.getContext('2d');
        const fw = im.naturalWidth / def.cols, fh = im.naturalHeight / def.rows;
        g.clearRect(0, 0, cv.width, cv.height);
        g.drawImage(im, i * fw, m.row * fh, fw, fh, 0, 0, cv.width, cv.height);
        g.fillStyle = 'rgba(255,255,255,0.55)'; g.font = '11px sans-serif'; g.fillText(`F${i + 1}`, 5, 13);
      });
    };
    for (let i = 0; i < def.cols; i += 1) {
      const cv = document.createElement('canvas');
      cv.width = 128; cv.height = 128;
      frames.appendChild(cv);
    }
    frames.style.gridTemplateColumns = `repeat(${def.cols}, 1fr)`;
    if (im.complete && im.naturalWidth) paint(); else im.addEventListener('load', paint, { once: true });
    note.textContent = `${key} · 모션 "${mName}" · ${m.durationMs}ms · ${def.cols}프레임 (한 칸 ≈ ${Math.round(m.durationMs / def.cols)}ms)`;
    sheetKey = key;
  }

  function drawMarkers() {
    track.querySelectorAll('.tl-ev, .tl-range, .tick').forEach((e) => e.remove());
    const def = o.manifest[o.getActorSheet()];
    const cols = def?.cols ?? 6;
    for (let i = 0; i <= cols; i += 1) {
      const t = document.createElement('div');
      t.className = 'tick';
      t.style.left = `${(i / cols) * 100}%`;
      if (i < cols) t.innerHTML = `<span>F${i + 1}</span>`;
      track.appendChild(t);
    }
    const b = o.getBinding();
    b.events.forEach((ev, i) => {
      if (ev.type === 'trail') {
        const r = document.createElement('div');
        r.className = 'tl-range';
        r.style.left = `${ev.t * 100}%`;
        r.style.width = `${Math.max(0, (ev.until ?? ev.t) - ev.t) * 100}%`;
        track.appendChild(r);
      }
      const m = document.createElement('div');
      m.className = `tl-ev ${ev.type}${o.selected() === i ? ' sel' : ''}`;
      m.style.left = `${ev.t * 100}%`;
      m.title = ev.type === 'fx' ? `${ev.fx} @ ${ev.socket}` : ev.type === 'hit' ? `명중 · ${(ev.fx ?? []).join(', ')}` : '잔상 시작';
      m.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        o.onSelect(i);
        drawMarkers();
        const rect = track.getBoundingClientRect();
        const move = (ev2) => {
          const t = Math.max(0, Math.min(1, (ev2.clientX - rect.left) / rect.width));
          const d = Math.round(t * 100) / 100;
          if (ev.type === 'trail' && ev.until != null) ev.until = Math.min(1, Math.max(d, ev.until + (d - ev.t)));
          ev.t = d;
          drawMarkers();
        };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); o.onChange(); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
      track.appendChild(m);
    });
  }

  function refresh() { drawFrames(); drawMarkers(); }
  refresh();

  return {
    refresh,
    tick(world) {
      if (sheetKey !== o.getActorSheet()) refresh();
      const a = world?.action;
      if (a && a.key === o.actionKey()) {
        play.style.display = '';
        play.style.left = `${Math.min(1, a.t / a.dur) * 100}%`;
      } else play.style.display = 'none';
    },
  };
}
