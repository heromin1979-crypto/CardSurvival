import DialogueScene, { handleDialogueKeys } from './DialogueScene.js';
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
  _subscriptions: [],
  _clickHandler: null,
  _finish: null,

  init() {
    this._el = document.getElementById('contribution-choice-modal');
    this._box = this._el?.querySelector('.er-modal-box');
    if (!this._el) return;
    this._subscriptions.forEach(off => off());
    if (this._clickHandler) document.removeEventListener('click', this._clickHandler);
    this._clickHandler = e => {
      const el = document.getElementById('contribution-choice-modal');
      if (!el?.classList.contains('open')) return;
      const pick = e.target.closest?.('[data-pick-index]');
      if (pick && el.contains(pick)) this._pick(Number(pick.dataset.pickIndex));
    };
    document.addEventListener('click', this._clickHandler);
    const endPatient = ({ npcId }) => { if (npcId === this._currentNpcId) this._finish?.(); };
    this._subscriptions = [
      EventBus.on('contributionChoiceNeeded', payload => this._onChoiceNeeded(payload)),
      EventBus.on('patientDied', endPatient),
      EventBus.on('patientLeft', endPatient),
    ];
    this._initialized = true;
    if (this._currentNpcId && this._finish) { this.render(); this._el.classList.add('open'); }
    SystemRegistry.get('PatientIntakeSystem')?.resumePendingChoices?.();
  },

  _onChoiceNeeded({ npcId, options } = {}) {
    if (!npcId || !Array.isArray(options) || !options.length) return;
    // NPC 진료·완료 대화가 끝난 뒤 같은 큐의 소유권으로 표시한다.
    DialogueScene.enqueueTask('contribution:' + npcId, done => {
      const intake = SystemRegistry.get('PatientIntakeSystem');
      if (intake?.getPendingChoice && !intake.getPendingChoice(npcId)) { done(); return; }
      this._el = document.getElementById('contribution-choice-modal');
      this._box = this._el?.querySelector('.er-modal-box');
      if (!this._box) { done(); return; }
      this._currentNpcId = npcId; this._currentOptions = options; this._finish = done;
      this.render(); this._el.classList.add('open');
      const keyHandler = e => handleDialogueKeys(e, this._box, () => {});
      document.addEventListener('keydown', keyHandler, true);
      this._box.querySelector('button')?.focus();
      return () => {
        document.removeEventListener('keydown', keyHandler, true);
        this._el?.classList.remove('open');
        this._currentNpcId = null; this._currentOptions = []; this._finish = null;
      };
    });
  },

  _pick(index) {
    if (!this._currentNpcId) return;
    SystemRegistry.get('PatientIntakeSystem')?.chooseContribution?.(this._currentNpcId, index);
    this._finish?.();
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
        <button type="button" class="er-row" data-pick-index="${idx}">
          <span class="er-row-icon">${idx === 0 ? '⭐' : '🔄'}</span>
          <span class="er-row-name">${label}</span>
          <span class="er-row-meta">${immediateText || '-'}</span>
        </button>`;
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
