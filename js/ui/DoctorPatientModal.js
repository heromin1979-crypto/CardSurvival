// === DOCTOR PATIENT LOG MODAL ===
// 의사 플레이어 전용: 누적 환자 수·roster·마일스톤 뱃지 표시
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import { NPC_ITEMS } from '../data/npcs.js';
import QuestSystem  from '../systems/QuestSystem.js';

const MILESTONES = [
  { at: 5,  icon: '📖', label: '첫 페이지',   hint: '첫 다섯 명의 이름이 기록되었다.' },
  { at: 10, icon: '🩺', label: '의사의 손',    hint: '열 명의 기억이 쌓였다.' },
  { at: 25, icon: '🏥', label: '소문난 의사',  hint: '보라매 외곽까지 소문이 닿았다.' },
  { at: 50, icon: '🗺️', label: '생존 지도',    hint: '이지수의 수첩이 도시의 지도가 되었다.' },
];

const DoctorPatientModal = {
  _el: null,
  _box: null,
  _initialized: false,

  init() {
    this._el  = document.getElementById('doctor-patient-modal');
    this._box = this._el?.querySelector('.doctor-patient-modal-box');
    if (!this._el || this._initialized) return;
    this._initialized = true;

    this._el.addEventListener('click', e => {
      if (e.target === this._el) this.close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._el.classList.contains('open')) this.close();
    });
    EventBus.on('languageChanged', () => {
      if (this._el.classList.contains('open')) this.render();
    });
  },

  open() {
    if (!this._el) return;
    this._el.classList.add('open');
    this.render();
  },

  close() {
    this._el?.classList.remove('open');
  },

  isAvailable() {
    return GameState.player?.characterId === 'doctor';
  },

  render() {
    if (!this._box) return;
    const count = GameState.flags?.doctor_patients_treated ?? 0;
    const roster = Array.isArray(GameState.flags?.doctor_patient_roster)
      ? GameState.flags.doctor_patient_roster : [];
    const moraleBonus = QuestSystem.getPatientMoraleBonus?.() ?? 0;

    const nextIdx = MILESTONES.findIndex(m => count < m.at);
    const nextMs = nextIdx >= 0 ? MILESTONES[nextIdx] : null;
    const prevTarget = nextIdx > 0 ? MILESTONES[nextIdx - 1].at : 0;
    const progressPct = nextMs
      ? Math.round(((count - prevTarget) / (nextMs.at - prevTarget)) * 100)
      : 100;

    const badgesHtml = MILESTONES.map(m => {
      const earned = count >= m.at;
      return `
        <div class="dp-badge${earned ? ' earned' : ' locked'}">
          <div class="dp-badge-icon">${earned ? m.icon : '🔒'}</div>
          <div class="dp-badge-label">${m.label}</div>
          <div class="dp-badge-count">${m.at}명</div>
          ${earned ? `<div class="dp-badge-hint">${m.hint}</div>` : ''}
        </div>`;
    }).join('');

    const rosterHtml = roster.length === 0
      ? `<div class="dp-roster-empty">아직 기록된 환자가 없다. 보드 위 부상 NPC에게 의료 아이템을 드래그해 치료하라.</div>`
      : roster.map((npcId, i) => {
          const def = NPC_ITEMS[npcId];
          const name = def?.name ?? npcId;
          const icon = def?.icon ?? '👤';
          return `<div class="dp-roster-row"><span class="dp-roster-idx">${String(i + 1).padStart(2, '0')}</span><span class="dp-roster-icon">${icon}</span><span class="dp-roster-name">${name}</span></div>`;
        }).join('');

    const progressHtml = nextMs
      ? `<div class="dp-progress-wrap">
           <div class="dp-progress-label">다음 마일스톤까지 ${Math.max(0, nextMs.at - count)}명 · ${nextMs.icon} ${nextMs.label}</div>
           <div class="dp-progress-track"><div class="dp-progress-fill" style="width:${progressPct}%"></div></div>
         </div>`
      : `<div class="dp-progress-wrap"><div class="dp-progress-label">🏆 모든 마일스톤 달성 — 생존 지도 완성</div></div>`;

    this._box.innerHTML = `
      <div class="dp-header">
        <span class="dp-title">📖 의료 기록장</span>
        <button class="dp-close-btn" id="dp-close-btn">✕</button>
      </div>
      <div class="dp-summary">
        <div class="dp-summary-count">
          <span class="dp-count-num">${count}</span>
          <span class="dp-count-unit">누적 치료</span>
        </div>
        <div class="dp-summary-meta">
          <div class="dp-meta-row"><span>고유 환자</span><span>${roster.length}명</span></div>
          <div class="dp-meta-row"><span>엔딩 사기 보너스</span><span>+${moraleBonus}</span></div>
        </div>
      </div>
      ${progressHtml}
      <div class="dp-badges-grid">${badgesHtml}</div>
      <div class="dp-roster-section">
        <div class="dp-roster-title">환자 명단</div>
        <div class="dp-roster-list">${rosterHtml}</div>
      </div>
    `;

    this._box.querySelector('#dp-close-btn')?.addEventListener('click', () => this.close());
  },
};

export default DoctorPatientModal;
