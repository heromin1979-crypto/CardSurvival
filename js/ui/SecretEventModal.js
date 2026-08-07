// === SECRET EVENT MODAL ===
// 비밀 이벤트 발생 시 선택지를 표시하고 플레이어의 선택을 시스템에 전달한다.
// 필요 물품이 부족한 선택지는 잠금 표시하며, 판정 규칙은 HiddenElementSystem이 소유한다.

import EventBus          from '../core/EventBus.js';
import GameData          from '../data/GameData.js';
import HiddenElementSystem from '../systems/HiddenElementSystem.js';

const SecretEventModal = {
  _el: null,
  _box: null,
  _initialized: false,
  _event: null,

  init() {
    this._el  = document.getElementById('secret-event-modal');
    this._box = this._el?.querySelector('.er-modal-box');
    if (!this._el || this._initialized) return;
    this._initialized = true;

    // 선택지 클릭 — document 레벨로 등록 (Main._onEnter가 매번 _buildLayout으로
    // #secret-event-modal을 통째로 재생성하므로, 엘리먼트에 직접 바인딩하면 두 번째
    // 진입부터 죽은 노드를 붙잡게 된다. LandmarkModal의 배경 클릭 패턴과 동일)
    document.addEventListener('click', e => {
      const el = document.getElementById('secret-event-modal');
      if (!el || !el.classList.contains('open')) return;
      if (e.target === el) return;   // 바깥 클릭 닫기 금지 — 반드시 선택해야 함
      const pickEl = e.target.closest?.('[data-choice-index]');
      if (!pickEl || !el.contains(pickEl) || pickEl.dataset.locked === '1') return;
      this._pick(parseInt(pickEl.dataset.choiceIndex, 10));
    });

    EventBus.on('secretEventTriggered', ({ event }) => this._open(event));
    HiddenElementSystem.setChoiceResolverActive(true);
  },

  _open(event) {
    if (!event?.choices?.length) return;
    this._event = event;
    this.render();
    this._el?.classList.add('open');
  },

  _pick(index) {
    const eventId = this._event?.id;
    if (!eventId) return;
    this._event = null;
    this._el?.classList.remove('open');
    HiddenElementSystem.resolveSecretEventChoice(eventId, index);
  },

  _itemName(id) {
    return GameData?.items?.[id]?.name ?? id;
  },

  render() {
    if (!this._box || !this._event) return;
    const ev = this._event;

    const choicesHtml = ev.choices.map((choice, idx) => {
      const { ok, missing } = HiddenElementSystem.evaluateChoiceConditions(choice);
      const lackText = missing
        .map(m => `${this._itemName(m.id)} ${m.have}/${m.need}`)
        .join(', ');
      return `
        <div class="se-choice${ok ? '' : ' locked'}"
             data-choice-index="${idx}"${ok ? '' : ' data-locked="1"'}>
          <span class="se-choice-mark">${ok ? '▶' : '🔒'}</span>
          <span class="se-choice-text">${choice.text}</span>
          ${ok ? '' : `<span class="se-choice-lack">${lackText} 부족</span>`}
        </div>`;
    }).join('');

    this._box.innerHTML = `
      <div class="er-header">
        <h2>${ev.icon ?? '❓'} ${ev.name}</h2>
      </div>
      <div class="er-body">
        <p class="se-desc">${ev.description ?? ''}</p>
        <div class="se-choices">${choicesHtml}</div>
      </div>
    `;
  },
};

export default SecretEventModal;
