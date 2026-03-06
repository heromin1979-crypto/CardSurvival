// === ENCOUNTER SCREEN ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import { rollEnemyGroup } from '../data/enemies.js';

const Encounter = {
  _el:     null,
  _data:   null,

  init() {
    this._el = document.getElementById('screen-encounter');
    EventBus.on('stateTransition', ({ to, data }) => {
      if (to === 'encounter') {
        this._data = data;
        this._render();
      }
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
    const noiseTag  = noise < 30  ? `<span style="color:var(--text-good);">저소음 — 약한 적</span>`
                    : noise < 65  ? `<span style="color:var(--text-warn);">중간 소음 — 2마리</span>`
                    : `<span style="color:var(--text-danger);">고소음 경보! — 강한 무리 3마리</span>`;

    const iconsHtml = enemies.map((e, i) =>
      `<span style="font-size:${count === 1 ? 64 : count === 2 ? 52 : 42}px;
        filter:drop-shadow(0 2px 6px rgba(0,0,0,0.8));
        ${i > 0 ? 'opacity:0.85;' : ''}">${e.icon ?? '👾'}</span>`
    ).join('');

    this._el.innerHTML = `
      <div class="encounter-title">⚠ 조우!</div>
      <div style="display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;">
        ${iconsHtml}
      </div>
      <div class="encounter-desc">
        <strong>${count > 1 ? `${leader.name} 외 ${count - 1}마리` : leader.name}</strong>이 나타났다!<br>
        ${leader.description ?? '위험한 적.'}<br><br>
        ${noiseTag}<br>
        ${d.noiseInflux ? '<span style="color:var(--text-danger);">소음 임계치 초과로 유인됨!</span>' : ''}
      </div>
      <div class="encounter-choices">
        <button class="toolbar-btn" id="enc-fight">⚔ 전투</button>
        <button class="toolbar-btn" id="enc-stealth">🌑 은신</button>
        <button class="toolbar-btn" id="enc-flee">🏃 도주</button>
      </div>
    `;

    const nodeId      = d.nodeId ?? null;
    const dangerLevel = d.dangerLevel ?? 2;

    // 전투 — 전체 enemies 배열 전달
    this._el.querySelector('#enc-fight')?.addEventListener('click', () => {
      StateMachine.transition('combat', { enemies, dangerLevel, nodeId });
    });

    // 은신 — 그룹 중 최고 stealthDifficulty 사용
    this._el.querySelector('#enc-stealth')?.addEventListener('click', () => {
      const maxDiff = Math.max(...enemies.map(e => e.stealthDifficulty ?? 0.5));
      const success = Math.random() > maxDiff;
      if (success) {
        EventBus.emit('notify', { message: '은신 성공! 위기를 모면했다.', type: 'good' });
        StateMachine.transition('explore');
      } else {
        EventBus.emit('notify', { message: '은신 실패! 전투 돌입.', type: 'danger' });
        StateMachine.transition('combat', { enemies, dangerLevel, nodeId });
      }
    });

    // 도주
    this._el.querySelector('#enc-flee')?.addEventListener('click', () => {
      const success = Math.random() < 0.65;
      if (success) {
        EventBus.emit('notify', { message: '도주 성공! 다른 구역으로 이동하라.', type: 'good' });
        GameState.modStat('fatigue', 10);
        StateMachine.transition('explore');
      } else {
        EventBus.emit('notify', { message: '도주 실패! 전투 돌입.', type: 'danger' });
        StateMachine.transition('combat', { enemies, dangerLevel, nodeId });
      }
    });
  },
};

export default Encounter;
