// === ENCOUNTER SCREEN ===
import EventBus      from '../core/EventBus.js';
import GameState     from '../core/GameState.js';
import StateMachine  from '../core/StateMachine.js';
import I18n          from '../core/I18n.js';
import ExploreSystem from '../systems/ExploreSystem.js';
import { rollEnemyGroup } from '../data/enemies.js';
import StatSystem  from '../systems/StatSystem.js';

const Encounter = {
  _el:     null,
  _data:   null,

  init() {
    this._el = document.getElementById('screen-encounter');
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'encounter') {
        this._data = data;
        this._render();
      } else if (this._el) {
        // 조우 화면 종료 시 DOM 내용을 비워 잔존 이벤트 리스너 제거
        this._el.innerHTML = '';
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
      </div>
    `;

    const nodeId      = d.nodeId ?? null;
    const dangerLevel = d.dangerLevel ?? 2;

    // 버튼 중복 실행 방지: 첫 클릭 이후 또는 이미 다른 상태면 무시
    let _handled = false;
    const guard = () => {
      if (_handled) return false;
      if (GameState.ui.currentState !== 'encounter') {
        console.warn('[Encounter] guard: state is no longer "encounter", current:', GameState.ui.currentState);
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
};

export default Encounter;
