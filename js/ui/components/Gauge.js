// === GAUGE COMPONENT ===
// 공용 가로 게이지 컴포넌트. 사이드바 HUD, 캐릭터선택, 동료 패널 등에서 재사용.
// 트랙 D 인프라 (AD_GUIDE_UI_REVAMP.md).
//
// 사용법:
//   import Gauge from './components/Gauge.js';
//   const html = Gauge.html({ label: 'HP', value: 78, max: 100, color: 'hp' });
//   container.innerHTML = html;
//
// 색상 변형:
//   hp / hydration / nutrition / fatigue / morale / temperature
//   stamina / mental / medicine / combat / crafting
//   noise / weight / quest

const Gauge = {
  /** 게이지 HTML 문자열 반환
   * @param {Object} opts
   * @param {string} opts.label - 표시 라벨 (왼쪽)
   * @param {number} opts.value - 현재값
   * @param {number} [opts.max=100] - 최대값
   * @param {string} [opts.color] - 색상 변형 키 ('hp', 'noise' 등)
   * @param {string} [opts.size] - 'sm' (가는 4px) | 'md' (기본 8px) | 'lg' (12px)
   * @param {boolean} [opts.showValue=false] - 우측 N/M 노출 여부
   * @param {string} [opts.suffix] - 값 뒤 단위 ('kg', '%')
   */
  html(opts) {
    const {
      label = '',
      value = 0,
      max = 100,
      color = '',
      size = 'md',
      showValue = false,
      suffix = '',
    } = opts;
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    const trackClass = `gauge-track gauge-track--${size}`;
    const fillClass = color ? `gauge-fill gauge-fill--${color}` : 'gauge-fill';
    const valueText = showValue
      ? `<span class="gauge-value">${Math.round(value)}${suffix}${max && max !== 100 ? `/${max}${suffix}` : ''}</span>`
      : '';
    return `
      <div class="gauge-row">
        ${label ? `<span class="gauge-label">${label}</span>` : ''}
        <div class="${trackClass}">
          <div class="${fillClass}" style="width:${pct}%"></div>
        </div>
        ${valueText}
      </div>
    `;
  },

  /** DOM 노드의 게이지 fill 폭만 갱신 (재렌더 회피)
   * @param {HTMLElement} fillEl - .gauge-fill 노드
   * @param {number} value
   * @param {number} [max=100]
   */
  update(fillEl, value, max = 100) {
    if (!fillEl) return;
    const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
    fillEl.style.width = `${pct}%`;
  },
};

export default Gauge;
