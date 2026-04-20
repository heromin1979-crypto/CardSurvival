// === BODY STATUS MODAL ===
// 상단 HP 클릭으로 진입. 6부위 상태 + 현재 질병 + 부상 NPC 진단 현황.
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import I18n          from '../core/I18n.js';
import DISEASES      from '../data/diseases.js';
import DiseaseSystem from '../systems/DiseaseSystem.js';
import NPCSystem     from '../systems/NPCSystem.js';
import BodySystem    from '../systems/BodySystem.js';

const INJURY_ICONS = {
  bleeding:   '🩸',
  fracture:   '🦴',
  laceration: '🔪',
  concussion: '💫',
};

const BODY_PARTS = [
  { key: 'head',     label: '머리',       icon: '🧠' },
  { key: 'torso',    label: '몸통',       icon: '🫁' },
  { key: 'leftArm',  label: '왼팔',       icon: '💪' },
  { key: 'rightArm', label: '오른팔',     icon: '💪' },
  { key: 'leftLeg',  label: '왼다리',     icon: '🦵' },
  { key: 'rightLeg', label: '오른다리',   icon: '🦵' },
];

const BodyStatusModal = {
  _initialized: false,
  _overlay:     null,

  init() {
    this._overlay = document.getElementById('body-status-modal');
    if (!this._overlay) return;

    if (!this._initialized) {
      this._initialized = true;
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this._overlay?.classList.contains('open')) this.close();
      });
      EventBus.on('bodyInjury',      () => { if (this._isOpen()) this._render(); });
      EventBus.on('diseaseChanged',  () => { if (this._isOpen()) this._render(); });
      EventBus.on('npcWoundHealed',  () => { if (this._isOpen()) this._render(); });
      EventBus.on('npcDiagnosed',    () => { if (this._isOpen()) this._render(); });
      EventBus.on('statChanged',     () => { if (this._isOpen()) this._render(); });
    }

    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });
  },

  open() {
    if (!this._initialized) this.init();
    if (!this._overlay) return;
    this._render();
    this._overlay.classList.add('open');
  },

  close() {
    this._overlay?.classList.remove('open');
  },

  _isOpen() {
    return this._overlay?.classList.contains('open') ?? false;
  },

  _render() {
    const box = this._overlay?.querySelector('.body-status-modal-box');
    if (!box) return;

    box.innerHTML = `
      <div class="body-status-header">
        <span class="body-status-title">🩻 신체 상태</span>
        <button class="body-status-close" id="body-status-close">닫기</button>
      </div>
      <div class="body-status-body">
        ${this._renderPlayerHP()}
        ${this._renderBodyParts()}
        ${this._renderDiseases()}
        ${this._renderWoundedNPCs()}
      </div>
    `;

    box.querySelector('#body-status-close')?.addEventListener('click', () => this.close());
  },

  /** 부위 치료 공개 API — DragDrop/TouchDrag에서 호출. */
  tryTreatPart(partKey, instanceId) {
    const inst = GameState.cards?.[instanceId];
    const def  = inst ? GameState.getCardDef?.(instanceId) : null;
    if (!def?.treatPart) {
      EventBus.emit('notify', { message: '해당 아이템으로 부위 치료가 불가합니다.', type: 'warn' });
      return false;
    }
    const result = BodySystem.treatInjuryWithItem(partKey, instanceId, def);
    if (!result.ok) {
      EventBus.emit('notify', { message: result.message, type: 'warn' });
    }
    return result.ok;
  },

  _renderPlayerHP() {
    const hp = GameState.player?.hp ?? { current: 0, max: 100 };
    const pct = Math.max(0, Math.min(100, (hp.current / hp.max) * 100));
    const cls = pct < 25 ? 'danger' : pct < 50 ? 'warn' : '';
    return `
      <section class="body-status-section">
        <h4>❤️ 전체 HP</h4>
        <div class="body-hp-bar">
          <div class="body-hp-fill ${cls}" style="width:${pct}%"></div>
          <span class="body-hp-text">${Math.round(hp.current)} / ${hp.max}</span>
        </div>
      </section>
    `;
  },

  _renderBodyParts() {
    const body = GameState.body ?? {};
    const cards = BODY_PARTS.map(({ key, label, icon }) => {
      const part = body[key] ?? { hp: 100, injuries: [] };
      const hpPct = Math.max(0, Math.min(100, part.hp));
      const hpCls = hpPct < 30 ? 'danger' : hpPct < 60 ? 'warn' : '';
      const injuries = part.injuries ?? [];
      const injuryHtml = injuries.length === 0
        ? '<div class="body-part-none">이상 없음</div>'
        : injuries.map(inj => {
            const ic   = INJURY_ICONS[inj.type] ?? '🩹';
            const name = I18n.t(`body.injury.${inj.type}`);
            const sev  = '★'.repeat(Math.ceil(inj.severity)) + '☆'.repeat(Math.max(0, 3 - Math.ceil(inj.severity)));
            return `<div class="body-part-injury sev-${Math.ceil(inj.severity)}">
              <span>${ic} ${name}</span><span class="body-part-sev">${sev}</span>
            </div>`;
          }).join('');
      return `
        <div class="body-part-card ${injuries.length > 0 ? 'injured' : ''}" data-body-part="${key}">
          <div class="body-part-head">
            <span class="body-part-icon">${icon}</span>
            <span class="body-part-name">${label}</span>
            <span class="body-part-hp">${Math.round(part.hp)}%</span>
          </div>
          <div class="body-part-track"><div class="body-part-fill ${hpCls}" style="width:${hpPct}%"></div></div>
          <div class="body-part-injuries">${injuryHtml}</div>
        </div>
      `;
    }).join('');

    return `
      <section class="body-status-section">
        <h4>🦴 부위별 상태</h4>
        <div class="body-parts-grid">${cards}</div>
      </section>
    `;
  },

  _renderDiseases() {
    const diseases = (GameState.player?.diseases ?? []).filter(d => (d.incubationTp ?? 0) === 0);
    if (diseases.length === 0) {
      return `
        <section class="body-status-section">
          <h4>🦠 현재 질병</h4>
          <div class="body-empty">감지된 질병이 없습니다.</div>
        </section>
      `;
    }

    const rows = diseases.map(d => {
      const def        = DISEASES[d.id];
      const discovered = d.discovered !== false;
      const icon       = discovered ? (def?.icon ?? '❓') : '❓';
      const name       = discovered ? (def?.name ?? d.id) : '???';
      const desc       = discovered ? (def?.description ?? '') : '알 수 없는 증상. 진단 도구가 필요합니다.';
      const sev        = discovered && def ? def.severity : 0;
      const sevCls     = !discovered ? 'unknown'
                         : sev >= 3 ? 'high' : sev >= 2 ? 'mid' : 'low';

      let progress = '';
      if (discovered && def?.fatal && d.fatalTp) {
        const pct = Math.min(100, Math.round((d.tpElapsed / d.fatalTp) * 100));
        progress = `<div class="body-disease-bar"><div class="body-disease-fill sev-${sevCls}" style="width:${pct}%"></div></div>`;
      }

      return `
        <div class="body-disease-row sev-${sevCls}">
          <span class="body-disease-icon">${icon}</span>
          <div class="body-disease-info">
            <div class="body-disease-name">${name}</div>
            <div class="body-disease-desc">${desc}</div>
            ${progress}
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="body-status-section">
        <h4>🦠 현재 질병</h4>
        <div class="body-diseases">${rows}</div>
      </section>
    `;
  },

  _renderWoundedNPCs() {
    const visible = NPCSystem.getVisibleNPCs?.() ?? [];
    const wounded = visible.filter(({ state }) => (state?.woundLevel ?? 0) > 0);

    if (wounded.length === 0) return '';

    const rows = wounded.map(({ npcId, state, def }) => {
      const discovered = state.woundDiscovered === true;
      const name       = I18n.itemName(npcId, def?.name ?? npcId);
      const levelText  = discovered ? `부상 ${state.woundLevel}단계` : '부상 의심 (미진단)';
      const healItem   = def?.woundHealItem ?? 'bandage';
      const hint       = discovered
        ? `${healItem} 드롭하여 치료`
        : '청진기 또는 진단 키트로 진단 필요';
      return `
        <div class="body-npc-row ${discovered ? 'known' : 'unknown'}">
          <span class="body-npc-icon">🚑</span>
          <div class="body-npc-info">
            <div class="body-npc-name">${name}</div>
            <div class="body-npc-status">${levelText}</div>
            <div class="body-npc-hint">${hint}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <section class="body-status-section">
        <h4>🚑 부상 NPC</h4>
        <div class="body-npcs">${rows}</div>
      </section>
    `;
  },
};

export default BodyStatusModal;
