// === EMERGENCY ROOM MODAL ===
// 보라매병원 응급실 허브 관리 UI.
// 4 탭 — 환자 / 구원자 / 수비대 / 파견
// Hero 스탯 — 다음 습격 D-day + 방어력

import EventBus           from '../core/EventBus.js';
import GameState          from '../core/GameState.js';
import SystemRegistry     from '../core/SystemRegistry.js';
import { NPC_ITEMS }      from '../data/npcs.js';
import PATIENT_POOL       from '../data/patientPool.js';

const TABS = [
  { id: 'patients',  label: '환자' },
  { id: 'rescued',   label: '구원자' },
  { id: 'guards',    label: '수비대' },
  { id: 'dispatch',  label: '파견' },
];

const CONTRIBUTION_LABEL = {
  sponsor:  '후원',
  dispatch: '파견',
  guard:    '수비',
  recruit:  '영입',
};

const EmergencyRoomModal = {
  _el: null,
  _box: null,
  _initialized: false,
  _activeTab: 'patients',
  _unsubscribes: [],

  init() {
    this._el  = document.getElementById('emergency-room-modal');
    this._box = this._el?.querySelector('.er-modal-box');
    if (!this._el || this._initialized) return;
    this._initialized = true;

    this._el.addEventListener('click', e => {
      if (e.target === this._el) this.close();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._el.classList.contains('open')) this.close();
    });

    const rerenderIfOpen = () => {
      if (this._el.classList.contains('open')) this.render();
    };
    ['patientAdmitted', 'patientDied', 'patientLeft', 'npcHealed',
     'guardStationed', 'guardDismissed', 'guardKilled', 'guardStarved',
     'dispatchDeployed', 'dispatchReturned', 'dispatchFailed',
     'siegeResolved', 'hospitalRewards', 'hospitalDamaged',
     'languageChanged'].forEach(ev => {
      this._unsubscribes.push(EventBus.on(ev, rerenderIfOpen));
    });
  },

  open() {
    if (!this._el) return;
    // Pull-First: 모달 진입 시 유입 시도 (조건 미충족이면 조용히 무시)
    const intake = SystemRegistry.get('PatientIntakeSystem');
    intake?.tryIntake?.();
    this._el.classList.add('open');
    this.render();
  },

  close() {
    this._el?.classList.remove('open');
  },

  isAvailable() {
    return !!GameState.flags?.er_unlocked;
  },

  // ── 렌더 ─────────────────────────────────
  render() {
    if (!this._box) return;

    const heroHtml = this._renderHero();
    const tabsHtml = TABS.map(t =>
      `<button class="er-tab${t.id === this._activeTab ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`
    ).join('');

    const bodyHtml = this._renderTabBody(this._activeTab);

    this._box.innerHTML = `
      <div class="er-header">
        <span class="er-title">🏥 보라매병원 응급실</span>
        <button class="er-close-btn" id="er-close-btn">✕</button>
      </div>
      ${heroHtml}
      <div class="er-tabs">${tabsHtml}</div>
      <div class="er-body">${bodyHtml}</div>
    `;

    this._box.querySelector('#er-close-btn')?.addEventListener('click', () => this.close());
    this._box.querySelectorAll('.er-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        this._activeTab = btn.dataset.tab;
        this.render();
      });
    });
    this._bindActionButtons();
  },

  _renderHero() {
    const day = GameState.time?.day ?? 0;
    const nextDay = GameState.flags?.nextSiegeDay;
    const dday = (nextDay != null) ? Math.max(0, nextDay - day) : null;
    const ddayText = dday == null ? '—' : (dday === 0 ? '오늘' : `D-${dday}`);

    const guardSys = SystemRegistry.get('GuardSystem');
    const defense = guardSys?.getDefenseRating?.() ?? 0;
    const stationed = guardSys?.getStationed?.().length ?? 0;

    const siegeCount = GameState.flags?.siegeCount ?? 0;

    const isDanger = dday != null && dday <= 2;

    return `
      <div class="er-hero">
        <div class="er-hero-card${isDanger ? ' danger' : ''}">
          <div class="er-hero-num">${ddayText}</div>
          <div class="er-hero-label">다음 습격</div>
        </div>
        <div class="er-hero-card">
          <div class="er-hero-num">${defense}</div>
          <div class="er-hero-label">방어력 (수비대 ${stationed}명)</div>
        </div>
        <div class="er-hero-card">
          <div class="er-hero-num">${siegeCount}</div>
          <div class="er-hero-label">격퇴 누적</div>
        </div>
      </div>`;
  },

  _renderTabBody(tabId) {
    switch (tabId) {
      case 'patients': return this._renderPatientsTab();
      case 'rescued':  return this._renderRescuedTab();
      case 'guards':   return this._renderGuardsTab();
      case 'dispatch': return this._renderDispatchTab();
      default:         return '';
    }
  },

  // ── 탭 1: 환자 (치료 중) ─────────────────
  _renderPatientsTab() {
    const intake = SystemRegistry.get('PatientIntakeSystem');
    const admitted = intake?.getActivePatients?.() ?? [];

    if (admitted.length === 0) {
      return `<div class="er-empty">현재 치료 중인 환자가 없습니다.<br/>응급실 카드와 상호작용하여 새 환자를 받을 수 있습니다.</div>`;
    }

    return admitted.map(npcId => {
      const { name, icon } = this._getNpcDisplay(npcId);
      const meta = intake?.getPatientMeta?.(npcId);
      const hp = meta?.hp ?? 100;
      const hpPct = Math.max(0, Math.min(100, hp));
      const low = hpPct < 40;
      return `
        <div class="er-row">
          <span class="er-row-icon">${icon}</span>
          <span class="er-row-name">${name}</span>
          <div class="er-hp-track"><div class="er-hp-fill${low ? ' low' : ''}" style="width:${hpPct}%"></div></div>
          <span class="er-row-meta">${hpPct}HP</span>
        </div>`;
    }).join('');
  },

  // ── 탭 2: 구원자 (완치 로스터) ───────────
  _renderRescuedTab() {
    const intake = SystemRegistry.get('PatientIntakeSystem');
    const roster = intake?.getRescuedRoster?.() ?? [];

    if (roster.length === 0) {
      return `<div class="er-empty">완치된 환자가 아직 없습니다.</div>`;
    }

    return roster.map(npcId => {
      const { name, icon } = this._getNpcDisplay(npcId);
      const info = intake?.getRescuedInfo?.(npcId);
      const typeLabel = CONTRIBUTION_LABEL[info?.type] ?? info?.type ?? '—';
      return `
        <div class="er-row">
          <span class="er-row-icon">${icon}</span>
          <span class="er-row-name">${name}</span>
          <span class="er-badge">${typeLabel}</span>
        </div>`;
    }).join('');
  },

  // ── 탭 3: 수비대 ─────────────────────────
  _renderGuardsTab() {
    const guardSys = SystemRegistry.get('GuardSystem');
    if (!guardSys) {
      return `<div class="er-empty">수비대 시스템 초기화 중...</div>`;
    }

    const registered = guardSys.getRegistered?.() ?? [];
    const stationed = new Set(guardSys.getStationed?.() ?? []);

    if (registered.length === 0) {
      return `<div class="er-empty">수비대 지원자가 없습니다.<br/>guard 타입 완치자가 필요합니다.</div>`;
    }

    return registered.map(npcId => {
      const { name, icon } = this._getNpcDisplay(npcId);
      const def = guardSys.getGuardDef?.(npcId);
      const isStationed = stationed.has(npcId);
      const meta = def
        ? `Dmg ${def.combatDmg ?? 0} · 식량 ${def.foodCostPerDay ?? 0}`
        : '';
      const btn = isStationed
        ? `<button class="er-row-btn danger" data-guard-dismiss="${npcId}">해제</button>`
        : `<button class="er-row-btn" data-guard-station="${npcId}">배치</button>`;
      return `
        <div class="er-row">
          <span class="er-row-icon">${icon}</span>
          <span class="er-row-name">${name}</span>
          <span class="er-row-meta">${meta}</span>
          ${isStationed ? '<span class="er-badge">상주</span>' : ''}
          ${btn}
        </div>`;
    }).join('');
  },

  // ── 탭 4: 파견 ──────────────────────────
  _renderDispatchTab() {
    const dispatchSys = SystemRegistry.get('DispatchSystem');
    if (!dispatchSys) {
      return `<div class="er-empty">파견 시스템 초기화 중...</div>`;
    }

    const day = GameState.time?.day ?? 0;
    const dispatchable = dispatchSys.getDispatchable?.() ?? [];
    const deployed = dispatchSys.getDeployed?.() ?? [];
    const all = [...deployed, ...dispatchable];

    if (all.length === 0) {
      return `<div class="er-empty">파견 가능한 인원이 없습니다.<br/>dispatch 타입 완치자가 필요합니다.</div>`;
    }

    return all.map(npcId => {
      const { name, icon } = this._getNpcDisplay(npcId);
      const assignment = dispatchSys.getAssignment?.(npcId);
      const isDeployed = assignment?.status === 'deployed';
      const isRetired  = assignment?.status === 'retired';

      let meta = '';
      let btn = '';
      let badge = '';

      if (isDeployed) {
        const daysLeft = Math.max(0, (assignment.returnDay ?? 0) - day);
        meta = `${assignment.deployedTo} · 복귀 D-${daysLeft}`;
        badge = '<span class="er-badge deployed">파견중</span>';
        btn = `<button class="er-row-btn danger" data-dispatch-recall="${npcId}">복귀</button>`;
      } else if (isRetired) {
        meta = `${assignment.runsCompleted}회 완료`;
        badge = '<span class="er-badge retired">퇴역</span>';
      } else {
        const pDef = PATIENT_POOL[npcId];
        const target = pDef?.contributionOnCure?.dispatch?.targetDistrict ?? '—';
        const interval = pDef?.contributionOnCure?.dispatch?.intervalDays ?? 0;
        meta = `${target} · ${interval}일`;
        btn = `<button class="er-row-btn" data-dispatch-deploy="${npcId}">파견</button>`;
      }

      return `
        <div class="er-row">
          <span class="er-row-icon">${icon}</span>
          <span class="er-row-name">${name}</span>
          <span class="er-row-meta">${meta}</span>
          ${badge}
          ${btn}
        </div>`;
    }).join('');
  },

  // ── 액션 바인딩 ──────────────────────────
  _bindActionButtons() {
    this._box.querySelectorAll('[data-guard-station]').forEach(btn => {
      btn.addEventListener('click', () => {
        SystemRegistry.get('GuardSystem')?.station(btn.dataset.guardStation);
        this.render();
      });
    });
    this._box.querySelectorAll('[data-guard-dismiss]').forEach(btn => {
      btn.addEventListener('click', () => {
        SystemRegistry.get('GuardSystem')?.dismiss(btn.dataset.guardDismiss);
        this.render();
      });
    });
    this._box.querySelectorAll('[data-dispatch-deploy]').forEach(btn => {
      btn.addEventListener('click', () => {
        SystemRegistry.get('DispatchSystem')?.deploy(btn.dataset.dispatchDeploy);
        this.render();
      });
    });
    this._box.querySelectorAll('[data-dispatch-recall]').forEach(btn => {
      btn.addEventListener('click', () => {
        SystemRegistry.get('DispatchSystem')?.recall(btn.dataset.dispatchRecall);
        this.render();
      });
    });
  },

  // ── NPC 표기 유틸 ───────────────────────
  _getNpcDisplay(npcId) {
    const poolDef = PATIENT_POOL[npcId];
    const npcDef  = NPC_ITEMS[npcId];
    const name = poolDef?.name ?? npcDef?.name ?? npcId;
    const icon = poolDef?.portraitIcon ?? npcDef?.icon ?? '👤';
    return { name, icon };
  },
};

export default EmergencyRoomModal;
