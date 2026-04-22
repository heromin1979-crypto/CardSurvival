// === ENCOUNTER SCREEN ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import StateMachine  from '../core/StateMachine.js';
import I18n          from '../core/I18n.js';
import ExploreSystem from '../systems/ExploreSystem.js';
import HospitalSiegeSystem from '../systems/HospitalSiegeSystem.js';
import { rollEnemyGroup } from '../data/enemies.js';
import StatSystem  from '../systems/StatSystem.js';

const Encounter = {
  _el:     null,
  _data:   null,

  init() {
    this._el = document.getElementById('screen-encounter');
    // 게임 시작 시 screen-encounter DOM을 완전 초기화 (브라우저가 이전 세션 내용을 캐시할 가능성 차단)
    if (this._el) {
      this._el.innerHTML = '';
      this._el.classList.remove('active');
      console.log('[Encounter] init: DOM 초기화 완료');
    }
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'encounter') {
        this._data = data;
        this._render();
      } else if (this._el) {
        // 조우 화면 종료 시 DOM 내용을 비워 잔존 이벤트 리스너 제거
        this._el.innerHTML = '';
        this._el.classList.remove('active');
        this._data = null;
      }
    });
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _render() {
    if (!this._el) return;
    const d       = this._data ?? {};
    const noise   = d.noiseLevel ?? GameState.noise?.level ?? 0;

    // enemies 배열 — 없으면 현재 소음으로 새로 생성
    const enemies = d.enemies?.length
      ? d.enemies
      : rollEnemyGroup(d.dangerLevel ?? 2, noise);

    const count     = enemies.length;
    const leader    = enemies[0];   // 대표 적 (가장 강한 놈)
    const noiseTag  = noise < 30  ? `<span style="color:var(--text-good);">${I18n.t('encounter.lowNoise')}</span>`
                    : noise < 65  ? `<span style="color:var(--text-warn);">${I18n.t('encounter.midNoise')}</span>`
                    : `<span style="color:var(--text-danger);">${I18n.t('encounter.highNoise')}</span>`;

    const iconsHtml = enemies.map((e, i) =>
      `<span style="font-size:${count === 1 ? 64 : count === 2 ? 52 : 42}px;
        filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));
        ${i > 0 ? 'opacity:0.85;' : ''}">${e.icon ?? '👾'}</span>`
    ).join('');

    this._el.innerHTML = `
      <div class="encounter-title">${I18n.t('encounter.title')}</div>
      <div style="display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;">
        ${iconsHtml}
      </div>
      <div class="encounter-desc">
        <strong>${I18n.t('encounter.appeared', { name: count > 1 ? I18n.t('encounter.appearedPlural', { leader: I18n.enemyName(leader.id, leader.name), rest: count - 1 }) : I18n.enemyName(leader.id, leader.name) })}</strong><br>
        ${leader.description ?? I18n.t('encounter.defaultDesc')}<br><br>
        ${noiseTag}<br>
        ${d.noiseInflux ? `<span style="color:var(--text-danger);">${I18n.t('encounter.noiseInflux')}</span>` : ''}
      </div>
      <div class="encounter-choices">
        <button class="toolbar-btn" id="enc-fight">${I18n.t('encounter.fight')}</button>
        <button class="toolbar-btn" id="enc-stealth">${I18n.t('encounter.stealth')}</button>
        <button class="toolbar-btn" id="enc-flee">${I18n.t('encounter.flee')}</button>
        ${GameState.player.characterId === 'soldier' ? `<button class="toolbar-btn" id="enc-ambush" style="border-color:var(--text-warn)">⚡ 선제 제압</button>` : ''}
        ${(GameState.player.characterId === 'doctor' && d.isSiege === true)
          ? `<button class="toolbar-btn" id="enc-evacuate" style="border-color:var(--text-good)">🏥 환자 대피 지휘</button>`
          : ''}
      </div>
    `;

    const nodeId      = d.nodeId ?? null;
    const dangerLevel = d.dangerLevel ?? 2;

    // 버튼 중복 실행 방지: 첫 클릭 이후 또는 이미 다른 상태면 무시
    let _handled = false;
    const self = this;
    const guard = () => {
      if (_handled) return false;
      if (GameState.ui.currentState !== 'encounter') {
        console.warn('[Encounter] guard: state is no longer "encounter", current:', GameState.ui.currentState);
        console.warn('[Encounter] 호출 스택:', new Error().stack);
        console.warn('[Encounter] screen-encounter 상태:', {
          hasActiveClass: self._el?.classList.contains('active'),
          innerHTMLLength: self._el?.innerHTML?.length ?? 0,
          buttonsFound: self._el?.querySelectorAll('button').length ?? 0,
        });
        if (self._el) {
          self._el.innerHTML = '';
          self._el.classList.remove('active');
        }
        const currentScreenId = 'screen-' + GameState.ui.currentState.replace(/_/g, '-');
        const currentScreen = document.getElementById(currentScreenId);
        if (currentScreen) currentScreen.classList.add('active');
        return false;
      }
      _handled = true;
      return true;
    };

    // 전투 — 전체 enemies 배열 전달
    this._el.querySelector('#enc-fight')?.addEventListener('click', () => {
      if (!guard()) return;
      StateMachine.transition('combat', { enemies, dangerLevel, nodeId });
    });

    // 은신 — 그룹 중 최고 stealthDifficulty 사용
    this._el.querySelector('#enc-stealth')?.addEventListener('click', () => {
      if (!guard()) return;
      const maxDiff = Math.max(...enemies.map(e => e.stealthDifficulty ?? 0.5));
      const success = Math.random() > maxDiff;
      if (success) {
        EventBus.emit('notify', { message: I18n.t('encounter.stealthOk'), type: 'good' });
        StateMachine.transition('main');
      } else {
        EventBus.emit('notify', { message: I18n.t('encounter.stealthFail'), type: 'danger' });
        StateMachine.transition('combat', { enemies, dangerLevel, nodeId });
      }
    });

    // 도주 (노숙인 거리 감각 fleeBonus 적용)
    this._el.querySelector('#enc-flee')?.addEventListener('click', () => {
      if (!guard()) return;
      const fleeBonus = GameState.player.fleeBonus ?? 0;
      const success = Math.random() < (0.65 + fleeBonus);
      if (success) {
        EventBus.emit('notify', { message: I18n.t('encounter.fleeOk'), type: 'good' });
        GameState.modStat('fatigue', 10);
        // 랜드마크 안에서 도망쳤으면 보드/위치 상태 복원
        if (GameState.location?.currentLandmark) {
          ExploreSystem.arriveAfterCombat(nodeId ?? GameState.location.currentNode ?? GameState.location.currentDistrict);
        }
        StateMachine.transition('main');
      } else {
        EventBus.emit('notify', { message: I18n.t('encounter.fleeFail'), type: 'danger' });
        StateMachine.transition('combat', { enemies, dangerLevel, nodeId });
      }
    });

    // W3-3 의사 전용: 환자 대피 지휘 — 2단계 체인 선택 (분류 + 대피로)
    this._el.querySelector('#enc-evacuate')?.addEventListener('click', () => {
      if (!guard()) return;
      const siegeId = d.siegeId ?? null;
      this._renderEvacuationStage1({ enemies, dangerLevel, nodeId, siegeId });
    });

    // 군인 전용: 선제 제압 — 근접/비무장 스킬 레벨 합산으로 첫 타 확률 상승
    this._el.querySelector('#enc-ambush')?.addEventListener('click', () => {
      if (!guard()) return;
      const melee    = GameState.player.skills?.melee?.level    ?? 0;
      const unarmed  = GameState.player.skills?.unarmed?.level  ?? 0;
      const combined = melee + unarmed;
      // 스킬 합 8이면 70%, 최소 40%
      const hitChance = Math.min(0.70, 0.40 + combined * 0.04);
      const roll = Math.random();
      GameState.modStat('fatigue', 5);
      if (roll < hitChance) {
        const bonusDmg = 10 + Math.floor(combined * 1.5);
        EventBus.emit('notify', {
          message: `⚡ 선제 제압 성공! 적에게 ${bonusDmg} 추가 피해를 입히고 전투를 시작합니다.`,
          type: 'good',
        });
        StateMachine.transition('combat', { enemies, dangerLevel, nodeId, ambushBonus: bonusDmg });
      } else {
        EventBus.emit('notify', {
          message: '⚡ 선제 제압 실패! 적이 먼저 반응했습니다. 전투로 돌입합니다.',
          type: 'danger',
        });
        StateMachine.transition('combat', { enemies, dangerLevel, nodeId, ambushFailed: true });
      }
    });
  },

  // ── W3-3 의사 대피 2단계 체인 ──────────────────────────
  // Stage 1: 분류 — 약품 우선(A) vs 부상자 우선(B)
  _renderEvacuationStage1(ctx) {
    if (!this._el) return;
    this._el.innerHTML = `
      <div class="encounter-title">🏥 환자 대피 지휘 · 1/2</div>
      <div class="encounter-desc">
        <strong>무엇을 먼저 챙깁니까?</strong><br>
        약탈자들이 로비로 진입 중이다. 시간은 제한적이다.
      </div>
      <div class="encounter-choices">
        <button class="toolbar-btn" id="evac-a">💊 약품 캐비닛 확보 (A)</button>
        <button class="toolbar-btn" id="evac-b">🩼 부상자 부축 (B)</button>
      </div>
    `;
    let _s1Handled = false;
    const pick = (choice1) => {
      if (_s1Handled) return;
      _s1Handled = true;
      this._renderEvacuationStage2({ ...ctx, choice1 });
    };
    this._el.querySelector('#evac-a')?.addEventListener('click', () => pick('A'));
    this._el.querySelector('#evac-b')?.addEventListener('click', () => pick('B'));
  },

  // Stage 2: 대피로 — 복도(C) vs 계단(D)
  _renderEvacuationStage2(ctx) {
    if (!this._el) return;
    const choice1Label = ctx.choice1 === 'A' ? '💊 약품 캐비닛' : '🩼 부상자 부축';
    this._el.innerHTML = `
      <div class="encounter-title">🏥 환자 대피 지휘 · 2/2</div>
      <div class="encounter-desc">
        <strong>대피로를 선택합니다.</strong><br>
        1단계 선택: ${choice1Label}
      </div>
      <div class="encounter-choices">
        <button class="toolbar-btn" id="evac-c">🚪 복도 (빠름 / 노출)</button>
        <button class="toolbar-btn" id="evac-d">🪜 계단 (느림 / 은폐)</button>
      </div>
    `;
    let _s2Handled = false;
    const pick = (choice2) => {
      if (_s2Handled) return;
      _s2Handled = true;
      this._resolveEvacuation({ ...ctx, choice2 });
    };
    this._el.querySelector('#evac-c')?.addEventListener('click', () => pick('C'));
    this._el.querySelector('#evac-d')?.addEventListener('click', () => pick('D'));
  },

  // 점수 계산 → siegeResolved 발행 → 메인 복귀
  _resolveEvacuation(ctx) {
    const medicineLevel    = GameState.player?.skills?.medicine?.level ?? 0;
    const trustedNpcCount  = HospitalSiegeSystem._countTrustedNpcs();
    const score   = HospitalSiegeSystem.calculateEvacuationScore({
      choice1: ctx.choice1,
      choice2: ctx.choice2,
      medicineLevel,
      trustedNpcCount,
    });
    const outcome = HospitalSiegeSystem.getEvacuationOutcome(score);

    EventBus.emit('siegeResolved', {
      outcome,
      casualties:    0,
      defenseRating: 0,
      threat:        0,
      siegeId:       ctx.siegeId ?? null,
    });

    const detailMsg = outcome === 'partial_victory'
      ? `✅ 대피 성공 — 환자들을 안전하게 빼냈다. (점수 ${score})`
      : `❌ 대피 실패 — 출구를 찾지 못했다. 약탈자들이 응급실을 휩쓸었다. (점수 ${score})`;
    EventBus.emit('notify', { message: detailMsg, type: outcome === 'partial_victory' ? 'good' : 'danger' });

    // 현장 복귀 (combat 안 거치므로 직접 main 전환)
    if (GameState.location?.currentLandmark) {
      ExploreSystem.arriveAfterCombat(ctx.nodeId ?? GameState.location.currentNode ?? GameState.location.currentDistrict);
    }
    StateMachine.transition('main');
  },
};

export default Encounter;
