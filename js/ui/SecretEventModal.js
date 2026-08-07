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
  _queue: [],

  init() {
    this._el  = document.getElementById('secret-event-modal');
    this._box = this._el?.querySelector('.er-modal-box');
    // Rest 등 다른 화면에서 트리거된 이벤트가 큐에 쌓여있을 수 있다 —
    // main 재진입(_onEnter → _buildLayout → init) 시점에 바로 드레인 시도
    this._presentNext();
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
    // 런이 끝나거나(사망/엔딩 → main_menu) 다른 세이브를 불러오면 이전 런의 큐가
    // 새 캐릭터에게 그대로 전달되어 버린다 — 싱글턴 모듈 상태이므로 여기서 끊는다
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'main_menu') {
        this._queue = [];
        this._event = null;
      }
    });
    EventBus.on('loaded', () => {
      this._queue = [];
      this._event = null;
    });
    HiddenElementSystem.setChoiceResolverActive(true);
  },

  _open(event) {
    if (!event?.choices?.length) return;
    this._queue.push(event);
    this._presentNext();
  },

  // 큐 선두를 표시한다 — main 화면이 실제로 보이는 상태가 아니면(Rest/Explore 등
  // 다른 화면이 활성인 동안) 표시를 미루고 큐는 그대로 둔다. 그렇지 않으면
  // #screen-main이 display:none인 서브트리에 .open을 붙이는 셈이라 아무것도
  // 보이지 않는데 이벤트는 이미 소비 처리된 상태가 된다.
  _presentNext() {
    if (!document.getElementById('screen-main')?.classList.contains('active')) return;
    // ESC로 pause → main 복귀하면 _buildLayout()이 모달 노드를 갈아치워 .open이
    // 사라진다 — 처리 중이던 이벤트를 잃지 않도록 큐를 건드리지 않고 다시 띄운다
    if (this._event) {
      // 이미 떠 있는 모달을 다시 그리면 읽던 스크롤 위치와 진행 중인 클릭이 날아간다
      if (!this._el?.classList.contains('open')) {
        this.render();
        this._el?.classList.add('open');
      }
      return;
    }
    if (!this._queue.length || !this._el || !this._box) return;
    this._event = this._queue.shift();
    this.render();
    this._el?.classList.add('open');
  },

  _pick(index) {
    const eventId = this._event?.id;
    if (!eventId) return;
    this._event = null;
    this._el?.classList.remove('open');
    HiddenElementSystem.resolveSecretEventChoice(eventId, index);
    this._presentNext();
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
