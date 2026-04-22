// === CONTRIBUTION CHOICE MODAL ===
// W3-1: 환자 완치 시 플레이어가 기여 타입을 선택하는 간단 모달.
// altContributions가 있는 환자에 한해 'contributionChoiceNeeded' 이벤트 수신 → 렌더 → pick.

import EventBus       from '../core/EventBus.js';
import SystemRegistry from '../core/SystemRegistry.js';
import PATIENT_POOL   from '../data/patientPool.js';

const TYPE_LABEL = {
  sponsor:  '후원 (정기 물자)',
  dispatch: '파견 (지역 원정)',
  guard:    '수비 (거점 상주)',
  recruit:  '영입 (동료)',
};

const ContributionChoiceModal = {
  _el: null,
  _box: null,
  _initialized: false,
  _currentNpcId: null,
  _currentOptions: [],

  init() {
    this._el  = document.getElementById('contribution-choice-modal');
    this._box = this._el?.querySelector('.er-modal-box');
    if (!this._el || this._initialized) return;
    this._initialized = true;

    this._el.addEventListener('click', e => {
      if (e.target === this._el) return;   // 바깥 클릭 닫기 금지 — 반드시 선택해야 함
      const pickEl = e.target.closest?.('[data-pick-index]');
      if (pickEl) {
        const idx = parseInt(pickEl.dataset.pickIndex, 10);
        this._pick(idx);
      }
    });

    EventBus.on('contributionChoiceNeeded', (payload) => this._onChoiceNeeded(payload));
  },

  _onChoiceNeeded({ npcId, options } = {}) {
    if (!npcId || !Array.isArray(options) || options.length === 0) return;
    this._currentNpcId = npcId;
    this._currentOptions = options;
    this.render();
    this._el?.classList.add('open');
  },

  _pick(index) {
    if (!this._currentNpcId) return;
    const intake = SystemRegistry.get('PatientIntakeSystem');
    intake?.chooseContribution?.(this._currentNpcId, index);
    this._currentNpcId = null;
    this._currentOptions = [];
    this._el?.classList.remove('open');
  },

  render() {
    if (!this._box) return;
    const def = PATIENT_POOL[this._currentNpcId] ?? {};
    const name = def.name ?? this._currentNpcId;
    const portrait = def.portraitIcon ?? '👤';

    const optionsHtml = this._currentOptions.map((opt, idx) => {
      const type = opt?.type ?? 'sponsor';
      const label = opt?.label ?? TYPE_LABEL[type] ?? type;
      const immediateText = (opt?.immediate ?? []).map(x => `${x.id}×${x.qty}`).join(', ');
      return `
        <div class="er-row" data-pick-index="${idx}" style="cursor:pointer">
          <span class="er-row-icon">${idx === 0 ? '⭐' : '🔄'}</span>
          <span class="er-row-name">${label}</span>
          <span class="er-row-meta">${immediateText || '-'}</span>
        </div>`;
    }).join('');

    this._box.innerHTML = `
      <div class="er-header">
        <h2>${portrait} ${name} — 기여 방식 선택</h2>
      </div>
      <div class="er-body">
        <div class="er-empty" style="margin-bottom:8px">완치 감사의 뜻으로 어떻게 돕기를 바라겠습니까?</div>
        ${optionsHtml}
      </div>`;
  },
};

export default ContributionChoiceModal;
