// === SEOUL MAP MODAL ===
// 서울 25구 지역 지도 SVG 오버레이 모달
import GameState from '../core/GameState.js';
import I18n     from '../core/I18n.js';
import { DISTRICTS } from '../data/districts.js';

const DANGER_COLORS = ['#336633', '#4a7a33', '#886622', '#aa3333', '#771111', '#440000'];

// 한강을 건너는 다리 2개:
//   서쪽 다리: 마포(강북) ↔ 영등포(강남) — 성산대교/양화대교
//   동쪽 다리: 광진(강북) ↔ 강동(강남) — 천호대교/올림픽대교
const BRIDGE_CONNECTIONS = new Set([
  ['gwangjin', 'gangdong'].sort().join('|'),
  ['mapo', 'yeongdeungpo'].sort().join('|'),
]);

// 그리드 좌표 [row, col] — 6열 × 6행
// Row 0-3: 강북   Row 4-5: 강남   (한강은 row3과 row4 사이)
const POSITIONS = {
  // ── 강북 (rows 0-3) ────────────────────────────────
  eunpyeong:    [0, 0],
  dobong:       [0, 2],
  nowon:        [0, 3],
  seodaemun:    [1, 0],
  seongbuk:     [1, 1],
  gangbuk:      [1, 2],
  jungrang:     [1, 3],
  mapo:         [2, 0],
  jongno:       [2, 1],
  dongdaemun:   [2, 2],
  seongdong:    [2, 3],
  gwangjin:     [2, 4],
  yongsan:      [3, 1],   // 한강 바로 북쪽
  junggoo:      [3, 2],   // 한강 바로 북쪽
  // ── 강남 (rows 4-5) ────────────────────────────────
  yeongdeungpo: [4, 0],   // 서쪽 다리 남단
  seocho:       [4, 2],
  gangnam:      [4, 3],
  songpa:       [4, 4],
  gangdong:     [4, 5],   // 동쪽 다리 남단
  gangseo:      [5, 0],
  yangcheon:    [5, 1],
  guro:         [5, 2],
  dongjak:      [5, 3],
  gwanak:       [5, 4],
  geumcheon:    [5, 5],
};

// RIVER_ROW: 강북 마지막 행. 한강은 이 행과 (RIVER_ROW+1) 사이에 표시
const CW = 92, CH = 80, GAP = 6, RIVER_GAP = 32, RIVER_ROW = 3;
const SVG_W = 6 * (CW + GAP) - GAP;                    // 582
const SVG_H = 6 * (CH + GAP) - GAP + RIVER_GAP;        // 510 + 32 = 542

// rows > RIVER_ROW는 RIVER_GAP만큼 아래로 밀림
function cellRect(row, col) {
  const extraY = row > RIVER_ROW ? RIVER_GAP : 0;
  return { x: col * (CW + GAP), y: row * (CH + GAP) + extraY };
}
function cellCenter(row, col) {
  const extraY = row > RIVER_ROW ? RIVER_GAP : 0;
  return { x: col * (CW + GAP) + CW / 2, y: row * (CH + GAP) + CH / 2 + extraY };
}

const SeoulMapModal = {
  _overlay: null,

  init() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="open-seoul-map"]')) this.open();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay) this._close();
    });
  },

  open() {
    this._close();

    const gs          = GameState;
    const currentId   = gs.location.currentDistrict ?? 'mapo';
    const adjacentSet = new Set(DISTRICTS[currentId]?.adjacentDistricts ?? []);
    const visitedSet  = new Set(gs.location.districtsVisited ?? []);
    const currentName = DISTRICTS[currentId]?.name ?? currentId;

    const overlay = document.createElement('div');
    overlay.className = 'seoul-map-overlay';
    overlay.id        = 'seoul-map-overlay';
    overlay.innerHTML = `
      <div class="seoul-map-modal">

        <div class="seoul-map-header">
          <span class="seoul-map-title">${I18n.t('map.title')}</span>
          <div class="seoul-map-legend">
            <span class="sm-leg sm-leg-current">${I18n.t('map.current', { name: I18n.districtName(currentId, currentName) })}</span>
            <span class="sm-leg sm-leg-adjacent">${I18n.t('map.accessible')}</span>
            <span class="sm-leg sm-leg-visited">${I18n.t('map.visited')}</span>
            <span class="sm-leg sm-leg-fog">${I18n.t('map.unexplored')}</span>
          </div>
          <button class="seoul-map-close" id="btn-close-seoulmap">✕</button>
        </div>

        <div class="seoul-map-body">
          ${this._buildSVG(currentId, adjacentSet, visitedSet)}
        </div>

      </div>
    `;

    document.body.appendChild(overlay);
    this._overlay = overlay;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._close(); });
    overlay.querySelector('#btn-close-seoulmap')?.addEventListener('click', () => this._close());
  },

  _close() {
    this._overlay?.remove();
    this._overlay = null;
  },

  // ── SVG 빌드 ──────────────────────────────────────────────────────

  _buildSVG(currentId, adjacentSet, visitedSet) {

    // ── 연결선 (deduplicated) ──────────────────────────────────
    const pairSet = new Set();
    for (const [id, d] of Object.entries(DISTRICTS)) {
      for (const adjId of (d.adjacentDistricts ?? [])) {
        pairSet.add([id, adjId].sort().join('|'));
      }
    }

    // 한강 띠: row3 하단 이후, row4(강남) 시작 전 → RIVER_GAP 공간 안에 표시
    const riverY  = RIVER_ROW * (CH + GAP) + CH + 2;  // row3 하단 + 2px 여백
    const riverH  = RIVER_GAP - 4;                    // 위아래 2px씩 여백
    const riverMY = riverY + riverH / 2;               // 띠 중앙 y
    const hanRiver = `
  <rect x="0" y="${riverY}" width="${SVG_W}" height="${riverH}"
        fill="#1a3a6e" opacity="0.40" rx="3"/>
  <text x="${(SVG_W / 2).toFixed(1)}" y="${(riverMY + 3.5).toFixed(1)}"
        text-anchor="middle" font-size="9" fill="#88bbee" opacity="0.90"
        font-weight="bold">${I18n.t('map.hanRiver')}</text>
`;

    const lines = [...pairSet].map(key => {
      const [a, b] = key.split('|');
      if (!POSITIONS[a] || !POSITIONS[b]) return '';
      const ca = cellCenter(...POSITIONS[a]);
      const cb = cellCenter(...POSITIONS[b]);

      const isBridge = BRIDGE_CONNECTIONS.has(key);
      const active   = (a === currentId || b === currentId) ||
                       (adjacentSet.has(a) || adjacentSet.has(b));
      const stroke = isBridge ? '#ffcc55'
                   : active   ? 'rgba(200,160,96,0.5)'
                   :             'rgba(80,80,80,0.22)';
      const sw   = isBridge ? 3 : active ? 2 : 1;
      const dash = (isBridge || active) ? '' : 'stroke-dasharray="3 4"';
      return `<line x1="${ca.x.toFixed(1)}" y1="${ca.y.toFixed(1)}"
                    x2="${cb.x.toFixed(1)}" y2="${cb.y.toFixed(1)}"
                    stroke="${stroke}" stroke-width="${sw}" ${dash}/>`;
    }).join('\n');

    // ── 지역 노드 ──────────────────────────────────────────────
    const nodes = Object.entries(POSITIONS).map(([id, [row, col]]) => {
      const d = DISTRICTS[id];
      if (!d) return '';

      const isCurrent  = id === currentId;
      const isAdjacent = adjacentSet.has(id);
      const isVisited  = visitedSet.has(id);

      const { x, y } = cellRect(row, col);
      const cx        = x + CW / 2;
      const cy        = y + CH / 2;

      let fill, stroke, strokeW, groupOpacity;
      if (isCurrent) {
        fill = 'rgba(160,120,50,0.3)'; stroke = '#c8a060'; strokeW = 2.5; groupOpacity = 1;
      } else if (isAdjacent) {
        fill = 'rgba(35,70,35,0.3)'; stroke = '#4a7a33'; strokeW = 1.5; groupOpacity = 0.95;
      } else if (isVisited) {
        fill = 'rgba(30,30,30,0.65)'; stroke = 'rgba(110,110,110,0.55)'; strokeW = 1; groupOpacity = 0.75;
      } else {
        fill = 'rgba(8,8,8,0.75)'; stroke = 'rgba(50,50,50,0.4)'; strokeW = 1; groupOpacity = 0.38;
      }

      const iconOpacity = isVisited || isAdjacent || isCurrent ? '1' : '0.5';
      const nameColor = isCurrent  ? '#f0d080'
                      : isAdjacent ? '#90c070'
                      : isVisited  ? '#aaaaaa'
                      : '#555555';

      const BAR_W = 7, BAR_H = 5, BAR_GAP = 2;
      const barTotalW = 5 * BAR_W + 4 * BAR_GAP;
      const barX0     = cx - barTotalW / 2;
      const barY      = y + CH - 14;
      const dColor    = DANGER_COLORS[Math.min(d.dangerLevel, 5)];
      const dangerBars = Array.from({ length: 5 }, (_, i) => {
        const bx     = barX0 + i * (BAR_W + BAR_GAP);
        const filled = i < d.dangerLevel;
        return `<rect x="${bx.toFixed(1)}" y="${barY}"
                      width="${BAR_W}" height="${BAR_H}" rx="1"
                      fill="${filled ? dColor : 'rgba(50,50,50,0.5)'}"/>`;
      }).join('');

      const radTag = d.radiation > 0
        ? `<text x="${cx}" y="${y + CH - 1}"
                 text-anchor="middle" font-size="8" fill="#66aa44">☢ ${d.radiation}</text>`
        : '';

      const currentBadge = isCurrent
        ? `<text x="${cx}" y="${barY - 3}"
             text-anchor="middle" font-size="8" fill="#c8a060">${I18n.t('map.currentBadge')}</text>`
        : '';

      const pulseRing = isCurrent ? `
        <rect x="${x - 4}" y="${y - 4}" width="${CW + 8}" height="${CH + 8}" rx="9"
              fill="none" stroke="#c8a060" stroke-width="2" class="sm-pulse-ring"/>` : '';

      return `
        <g class="sm-node" opacity="${groupOpacity}">
          ${pulseRing}
          <rect x="${x}" y="${y}" width="${CW}" height="${CH}" rx="6"
                fill="${fill}" stroke="${stroke}" stroke-width="${strokeW}"/>
          <text x="${cx}" y="${y + 26}" text-anchor="middle" font-size="20"
                font-family="'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif"
                opacity="${iconOpacity}">${d.icon}</text>
          <text x="${cx}" y="${y + 41}" text-anchor="middle"
                font-size="11" font-weight="bold" fill="${nameColor}">${I18n.districtName(id, d.name)}</text>
          <text x="${cx}" y="${y + 52}" text-anchor="middle"
                font-size="8" fill="#666666">${d.id}</text>
          ${currentBadge}
          ${dangerBars}
          ${radTag}
        </g>`;
    }).join('\n');

    return `
      <svg width="${SVG_W}" height="${SVG_H}"
           viewBox="0 0 ${SVG_W} ${SVG_H}"
           xmlns="http://www.w3.org/2000/svg"
           class="seoul-map-svg">
        ${hanRiver}
        <g class="sm-lines">${lines}</g>
        <g class="sm-nodes">${nodes}</g>
      </svg>`;
  },
};

export default SeoulMapModal;
