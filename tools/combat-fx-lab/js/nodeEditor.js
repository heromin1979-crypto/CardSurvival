// 노드 에디터 — DOM 노드 + SVG 와이어. 출력 포트를 끌어 입력 포트에 놓으면 연결, 와이어 클릭 = 삭제.
import { NODE_TYPES, defaultParams, nid } from './fxNodes.js';

const PORT_Y = 14;

export class NodeEditor {
  constructor(root, { onChange }) {
    this.root = root;
    this.onChange = onChange;
    this.graph = null;
    this.sel = null;
    this.pan = { x: 20, y: 10 };
    root.classList.add('ne');
    root.innerHTML = '<div class="ne-world"><svg width="4000" height="3000"></svg><div class="ne-nodes"></div></div><div class="ne-err"></div>';
    this.world = root.querySelector('.ne-world');
    this.svg = root.querySelector('svg');
    this.nodesEl = root.querySelector('.ne-nodes');
    this.errEl = root.querySelector('.ne-err');
    this._bindPan();
    this._keys = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && this.sel && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName ?? '')) {
        this.removeNode(this.sel);
      }
    };
    window.addEventListener('keydown', this._keys);
  }

  destroy() { window.removeEventListener('keydown', this._keys); }

  load(graph) {
    this.graph = graph;
    this.sel = null;
    this.render();
  }

  setErrors(errs) { this.errEl.textContent = errs.length ? `⚠ ${errs.join(' · ')}` : ''; }

  changed() { this.onChange?.(this.graph); }

  _applyPan() { this.world.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px)`; }

  _bindPan() {
    this.root.addEventListener('pointerdown', (e) => {
      if (e.target !== this.root && e.target !== this.world && e.target !== this.nodesEl) return;
      this.sel = null;
      this.nodesEl.querySelectorAll('.ne-node.sel').forEach((n) => n.classList.remove('sel'));
      const sx = e.clientX, sy = e.clientY, ox = this.pan.x, oy = this.pan.y;
      this.root.classList.add('panning');
      const move = (ev) => { this.pan.x = ox + ev.clientX - sx; this.pan.y = oy + ev.clientY - sy; this._applyPan(); };
      const up = () => { this.root.classList.remove('panning'); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  addNode(type) {
    const rect = this.root.getBoundingClientRect();
    const n = { id: nid(), type, x: rect.width / 2 - this.pan.x - 88 + Math.random() * 40, y: 30 - this.pan.y + Math.random() * 40, p: defaultParams(type) };
    this.graph.nodes.push(n);
    this.sel = n.id;
    this.render();
    this.changed();
  }

  removeNode(id) {
    const n = this.graph.nodes.find((x) => x.id === id);
    if (!n || n.type === 'output') return;
    this.graph.nodes = this.graph.nodes.filter((x) => x.id !== id);
    this.graph.links = this.graph.links.filter((l) => l.from !== id && l.to !== id);
    this.sel = null;
    this.render();
    this.changed();
  }

  connect(from, to) {
    if (from === to) return;
    const toNode = this.graph.nodes.find((n) => n.id === to);
    if (!toNode) return;
    // 단일 입력 노드는 기존 입력을 대체, 출력 포트도 하나만 나간다(체인 구조)
    this.graph.links = this.graph.links.filter((l) => l.from !== from);
    if (!NODE_TYPES[toNode.type].multiIn) this.graph.links = this.graph.links.filter((l) => l.to !== to);
    // 순환 방지
    const reach = (a, b, seen = new Set()) => {
      if (a === b) return true;
      if (seen.has(a)) return false;
      seen.add(a);
      return this.graph.links.filter((l) => l.from === a).some((l) => reach(l.to, b, seen));
    };
    if (reach(to, from)) return;
    this.graph.links.push({ from, to });
    this.drawWires();
    this.changed();
  }

  render() {
    this._applyPan();
    this.nodesEl.innerHTML = '';
    for (const n of this.graph.nodes) this.nodesEl.appendChild(this._nodeEl(n));
    this.drawWires();
  }

  _nodeEl(n) {
    const T = NODE_TYPES[n.type];
    const el = document.createElement('div');
    el.className = `ne-node${this.sel === n.id ? ' sel' : ''}`;
    el.dataset.id = n.id;
    el.style.left = `${n.x}px`;
    el.style.top = `${n.y}px`;
    const hasIn = T.in !== false;
    const hasOut = T.out !== false;
    el.innerHTML = `<header style="background:${T.color}">${T.label}${n.type !== 'output' ? '<span class="x" title="삭제">✕</span>' : ''}</header><div class="body"></div>`
      + (hasIn ? '<div class="ne-port in" title="입력"></div>' : '')
      + (hasOut ? '<div class="ne-port out" title="출력 — 끌어서 연결"></div>' : '');
    const body = el.querySelector('.body');
    if (n.type === 'output') body.innerHTML = '<span style="color:var(--muted)">체인을 여러 개 연결 = 레이어 합성</span>';
    for (const d of T.params) {
      const row = document.createElement('label');
      row.className = 'prm';
      row.innerHTML = `<span title="${d.label}">${d.label}</span>`;
      let inp;
      if (d.type === 'sel') {
        inp = document.createElement('select');
        inp.innerHTML = d.opts.map((o) => `<option ${o === n.p[d.k] ? 'selected' : ''}>${o}</option>`).join('');
        inp.onchange = () => { n.p[d.k] = inp.value; this.changed(); };
      } else if (d.type === 'color') {
        inp = document.createElement('input');
        inp.type = 'color';
        inp.value = n.p[d.k] ?? d.def;
        inp.oninput = () => { n.p[d.k] = inp.value; this.changed(); };
      } else {
        inp = document.createElement('input');
        inp.type = 'number';
        Object.assign(inp, { min: d.min, max: d.max, step: d.step });
        inp.value = n.p[d.k] ?? d.def;
        inp.oninput = () => { const v = parseFloat(inp.value); if (!Number.isNaN(v)) { n.p[d.k] = v; this.changed(); } };
      }
      row.appendChild(inp);
      body.appendChild(row);
    }
    el.addEventListener('pointerdown', () => {
      this.sel = n.id;
      this.nodesEl.querySelectorAll('.ne-node.sel').forEach((x) => x.classList.remove('sel'));
      el.classList.add('sel');
    });
    el.querySelector('.x')?.addEventListener('click', (e) => { e.stopPropagation(); this.removeNode(n.id); });
    const head = el.querySelector('header');
    head.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('x')) return;
      e.preventDefault();
      const sx = e.clientX, sy = e.clientY, ox = n.x, oy = n.y;
      const move = (ev) => {
        n.x = Math.round(ox + ev.clientX - sx); n.y = Math.round(oy + ev.clientY - sy);
        el.style.left = `${n.x}px`; el.style.top = `${n.y}px`;
        this.drawWires();
      };
      const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    const out = el.querySelector('.ne-port.out');
    out?.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); e.preventDefault();
      const start = this._portPos(n.id, 'out');
      const temp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      temp.classList.add('temp');
      this.svg.appendChild(temp);
      const rootRect = this.root.getBoundingClientRect();
      let hot = null;
      const move = (ev) => {
        const x = ev.clientX - rootRect.left - this.pan.x, y = ev.clientY - rootRect.top - this.pan.y;
        temp.setAttribute('d', this._curve(start.x, start.y, x, y));
        const t = document.elementFromPoint(ev.clientX, ev.clientY);
        if (hot && hot !== t) hot.classList.remove('hot');
        hot = t?.classList?.contains('in') ? t : null;
        hot?.classList.add('hot');
      };
      const up = (ev) => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        temp.remove();
        hot?.classList.remove('hot');
        const t = document.elementFromPoint(ev.clientX, ev.clientY);
        if (t?.classList?.contains('in')) this.connect(n.id, t.closest('.ne-node').dataset.id);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    return el;
  }

  _portPos(id, kind) {
    const n = this.graph.nodes.find((x) => x.id === id);
    const el = this.nodesEl.querySelector(`[data-id="${id}"]`);
    const w = el?.offsetWidth ?? 176;
    return { x: n.x + (kind === 'out' ? w : 0), y: n.y + PORT_Y };
  }

  _curve(x1, y1, x2, y2) {
    const dx = Math.max(40, Math.abs(x2 - x1) * 0.5);
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }

  drawWires() {
    this.svg.querySelectorAll('path:not(.temp)').forEach((p) => p.remove());
    for (const l of this.graph.links) {
      const a = this._portPos(l.from, 'out');
      const b = this._portPos(l.to, 'in');
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', this._curve(a.x, a.y, b.x, b.y));
      const from = this.graph.nodes.find((n) => n.id === l.from);
      p.style.setProperty('--c', NODE_TYPES[from?.type]?.color ?? '#7d8aa0');
      p.innerHTML = '<title>클릭하면 연결 해제</title>';
      p.addEventListener('click', () => {
        this.graph.links = this.graph.links.filter((x) => x !== l);
        this.drawWires();
        this.changed();
      });
      this.svg.appendChild(p);
    }
  }
}
