// 공유 모듈 — 게임 런타임과 tools/combat-fx-lab 이 같은 파일을 쓴다. 수정 시 랩에서 확인할 것.
// 노드 기반 이펙트 — 노드 타입 정의 + 그래프 컴파일러
// 그래프: { id, name, nodes:[{id,type,x,y,p:{...}}], links:[{from,to}] }
// 체인: 시작 노드(emitter | light | screen) → 수정 노드들 → (render) → output

export const NODE_TYPES = {
  emitter: {
    label: '생성 Emitter', color: '#e0a34a', start: true, in: false, out: true,
    params: [
      { k: 'burst', label: '버스트 수', type: 'num', min: 0, max: 400, step: 1, def: 12 },
      { k: 'rate', label: '초당 생성', type: 'num', min: 0, max: 600, step: 1, def: 0 },
      { k: 'duration', label: '지속(ms)', type: 'num', min: 0, max: 3000, step: 10, def: 0 },
      { k: 'delay', label: '지연(ms)', type: 'num', min: 0, max: 2000, step: 10, def: 0 },
      { k: 'lifeMin', label: '수명 최소', type: 'num', min: 10, max: 4000, step: 10, def: 200 },
      { k: 'lifeMax', label: '수명 최대', type: 'num', min: 10, max: 4000, step: 10, def: 400 },
    ],
  },
  shape: {
    label: '형태 Shape', color: '#6fa8dc', params: [
      { k: 'kind', label: '모양', type: 'sel', opts: ['point', 'circle', 'ring', 'arc', 'line', 'box'], def: 'point' },
      { k: 'radius', label: '반지름', type: 'num', min: 0, max: 400, step: 1, def: 40 },
      { k: 'arcStart', label: '호 시작°', type: 'num', min: -360, max: 360, step: 1, def: -60 },
      { k: 'arcSweep', label: '호 각도°', type: 'num', min: 0, max: 360, step: 1, def: 120 },
      { k: 'length', label: '길이', type: 'num', min: 0, max: 800, step: 1, def: 100 },
      { k: 'angle', label: '선 각도°', type: 'num', min: -180, max: 180, step: 1, def: 0 },
    ],
  },
  velocity: {
    label: '속도 Velocity', color: '#76c28f', params: [
      { k: 'dir', label: '방향', type: 'sel', opts: ['angle', 'outward', 'inward', 'tangent'], def: 'angle' },
      { k: 'angle', label: '각도°', type: 'num', min: -180, max: 180, step: 1, def: 0 },
      { k: 'spread', label: '퍼짐°', type: 'num', min: 0, max: 360, step: 1, def: 60 },
      { k: 'speedMin', label: '속력 최소', type: 'num', min: 0, max: 6000, step: 10, def: 100 },
      { k: 'speedMax', label: '속력 최대', type: 'num', min: 0, max: 6000, step: 10, def: 300 },
    ],
  },
  force: {
    label: '힘 Force', color: '#58b4a8', params: [
      { k: 'gravity', label: '중력', type: 'num', min: -3000, max: 3000, step: 10, def: 0 },
      { k: 'drag', label: '감속', type: 'num', min: 0, max: 20, step: 0.1, def: 0 },
      { k: 'wind', label: '날씨 바람 영향', type: 'num', min: 0, max: 2, step: 0.05, def: 0 },
    ],
  },
  turbulence: {
    label: '난류 Noise', color: '#58b4a8', params: [
      { k: 'amp', label: '세기', type: 'num', min: 0, max: 2000, step: 10, def: 200 },
      { k: 'freq', label: '주파수', type: 'num', min: 0.1, max: 30, step: 0.1, def: 4 },
    ],
  },
  color: {
    label: '색상 Color', color: '#d17bd1', params: [
      { k: 'c0', label: '시작', type: 'color', def: '#ffffff' },
      { k: 'c1', label: '중간', type: 'color', def: '#ffc060' },
      { k: 'c2', label: '끝', type: 'color', def: '#ff4020' },
      { k: 'a0', label: '알파 시작', type: 'num', min: 0, max: 1, step: 0.05, def: 1 },
      { k: 'a1', label: '알파 끝', type: 'num', min: 0, max: 1, step: 0.05, def: 0 },
    ],
  },
  size: {
    label: '크기 Size', color: '#c9a86b', params: [
      { k: 's0', label: '시작', type: 'num', min: 0, max: 600, step: 0.5, def: 6 },
      { k: 's1', label: '끝', type: 'num', min: 0, max: 600, step: 0.5, def: 0 },
      { k: 'stretch', label: '속도 늘림', type: 'num', min: 0, max: 0.3, step: 0.005, def: 0.03 },
    ],
  },
  spin: {
    label: '회전 Spin', color: '#c9a86b', params: [
      { k: 'rot', label: '초기 각°', type: 'num', min: -180, max: 180, step: 1, def: 0 },
      { k: 'rotRand', label: '랜덤°', type: 'num', min: 0, max: 180, step: 1, def: 0 },
      { k: 'spin', label: '회전속도°/s', type: 'num', min: -2000, max: 2000, step: 10, def: 0 },
    ],
  },
  render: {
    label: '렌더 Render', color: '#e06b6b', params: [
      { k: 'mode', label: '모드', type: 'sel', opts: ['spark', 'dot', 'crescent', 'ring', 'smoke', 'streak', 'sprite'], def: 'spark' },
      { k: 'blend', label: '블렌드', type: 'sel', opts: ['add', 'normal'], def: 'add' },
      { k: 'glow', label: '글로우', type: 'num', min: 0, max: 2, step: 0.05, def: 0.5 },
      { k: 'sprite', label: '스프라이트', type: 'sel', opts: ['slash', 'impact', 'claw', 'shot', 'acid'], def: 'impact' },
      { k: 'arc', label: '초승달 각°', type: 'num', min: 10, max: 300, step: 1, def: 130 },
      { k: 'thick', label: '초승달 두께', type: 'num', min: 0.02, max: 0.6, step: 0.01, def: 0.18 },
    ],
  },
  light: {
    label: '광원 Light', color: '#f3d36b', start: true, in: false, out: true,
    params: [
      { k: 'radius', label: '반경', type: 'num', min: 10, max: 900, step: 5, def: 240 },
      { k: 'color', label: '색', type: 'color', def: '#ffc27a' },
      { k: 'intensity', label: '세기', type: 'num', min: 0, max: 2, step: 0.05, def: 1 },
      { k: 'duration', label: '지속(ms)', type: 'num', min: 10, max: 3000, step: 10, def: 160 },
      { k: 'delay', label: '지연(ms)', type: 'num', min: 0, max: 2000, step: 10, def: 0 },
      { k: 'flicker', label: '깜빡임', type: 'num', min: 0, max: 1, step: 0.05, def: 0 },
    ],
  },
  screen: {
    label: '화면 Screen', color: '#9b8cff', start: true, in: false, out: true,
    params: [
      { k: 'shake', label: '흔들림 px', type: 'num', min: 0, max: 40, step: 0.5, def: 0 },
      { k: 'flash', label: '섬광 알파', type: 'num', min: 0, max: 1, step: 0.05, def: 0 },
      { k: 'flashColor', label: '섬광 색', type: 'color', def: '#ffffff' },
      { k: 'delay', label: '지연(ms)', type: 'num', min: 0, max: 2000, step: 10, def: 0 },
    ],
  },
  output: { label: '출력 Output', color: '#cfd6e4', in: true, out: false, multiIn: true, params: [] },
};

export function defaultParams(type) {
  const p = {};
  for (const d of NODE_TYPES[type].params) p[d.k] = d.def;
  return p;
}

// 그래프 → 실행 가능한 체인 목록
export function compileGraph(graph) {
  const errors = [];
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const out = graph.nodes.find((n) => n.type === 'output');
  if (!out) return { chains: [], errors: ['출력(Output) 노드가 없습니다'] };
  const incoming = (id) => graph.links.filter((l) => l.to === id).map((l) => byId.get(l.from)).filter(Boolean);
  const chains = [];
  for (const tail of incoming(out.id)) {
    const seq = [];
    let cur = tail;
    const seen = new Set();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      seq.unshift(cur);
      if (NODE_TYPES[cur.type]?.start) break;
      cur = incoming(cur.id)[0];
    }
    const head = seq[0];
    if (!head || !NODE_TYPES[head.type]?.start) {
      errors.push(`'${NODE_TYPES[tail.type]?.label ?? tail.type}' 체인에 시작 노드(생성/광원/화면)가 없습니다`);
      continue;
    }
    const chain = { kind: head.type, head: { ...head.p }, mods: {} };
    for (const n of seq.slice(1)) {
      if (NODE_TYPES[n.type]?.start) continue;
      chain.mods[n.type] = { ...defaultParams(n.type), ...n.p };
    }
    if (head.type === 'emitter' && !chain.mods.render) chain.mods.render = defaultParams('render');
    chains.push(chain);
  }
  if (!chains.length && !errors.length) errors.push('출력에 연결된 체인이 없습니다');
  return { chains, errors };
}

// ── 그래프 빌더 (내장 라이브러리 작성용) ──────────────────────
let _seq = 0;
export function nid() { _seq += 1; return `n${Date.now().toString(36)}${_seq}`; }

// chains: [[{type,p}, ...], ...] → 좌→우 자동 배치 그래프
export function buildGraph(id, name, chains, meta = {}) {
  const nodes = [];
  const links = [];
  const outId = 'out';
  let row = 0;
  let maxCol = 0;
  let y = 20;
  for (const chain of chains) {
    let prev = null;
    const rowH = Math.max(...chain.map((spec) => NODE_TYPES[spec.type].params.length)) * 23 + 50;
    chain.forEach((spec, col) => {
      const id2 = `${id}_${row}_${col}`;
      nodes.push({ id: id2, type: spec.type, x: 20 + col * 196, y, p: { ...defaultParams(spec.type), ...(spec.p ?? {}) } });
      if (prev) links.push({ from: prev, to: id2 });
      prev = id2;
      maxCol = Math.max(maxCol, col);
    });
    links.push({ from: prev, to: outId });
    row += 1;
    y += rowH;
  }
  nodes.push({ id: outId, type: 'output', x: 20 + (maxCol + 1) * 196, y: Math.max(20, y / 2 - 40), p: {} });
  return { id, name, ...meta, nodes, links };
}
