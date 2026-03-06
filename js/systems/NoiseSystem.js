// === NOISE SYSTEM ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import { rollEnemyGroup } from '../data/enemies.js';
import TraitSystem from './TraitSystem.js';

const NoiseSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.onTP());
  },

  onTP() {
    const n = GameState.noise;
    if (!GameState.player.isAlive) return;

    // Passive noise from structures on board
    let structureNoise = 0;
    for (const card of GameState.getBoardCards()) {
      const def = GameState.getCardDef(card.instanceId);
      if (def?.onTick?.noise) structureNoise += def.onTick.noise;
    }

    this.addNoise(structureNoise);

    // Decay
    const decayed = Math.min(n.level, n.decayPerTP);
    n.level = Math.max(0, n.level - decayed);
    n.level = parseFloat(n.level.toFixed(2));

    // Influx check
    if (n.level >= n.influxThreshold && !n.influxTriggered) {
      n.influxTriggered = true;
      EventBus.emit('noiseInflux', {});
      this._triggerInflux();
    } else if (n.level < n.influxThreshold) {
      n.influxTriggered = false;
    }

    EventBus.emit('statChanged', { stat: 'noise', oldVal: 0, newVal: n.level });

    // ── 전투 재조우 카운트다운 ──────────────────────────
    this._tickRespawn();
  },

  _tickRespawn() {
    const gs = GameState;
    const cr = gs.combatRespawn;
    if (!cr.active || !gs.player.isAlive || gs.combat.active) return;

    cr.tpRemaining--;

    if (cr.tpRemaining === 1) {
      EventBus.emit('notify', { message: '⚠ 적이 바로 뒤까지 왔다! 지금 이동하라!', type: 'warn' });
    }

    if (cr.tpRemaining > 0) return;

    // 타이머 만료
    cr.active = false;

    if (cr.nodeId && gs.location.currentNode === cr.nodeId && gs.ui.currentState === 'basecamp') {
      // 같은 장소 → 조우 발생
      const nodeId  = cr.nodeId;
      const danger  = cr.dangerLevel;
      const enemies = rollEnemyGroup(danger, gs.noise.level);
      EventBus.emit('notify', { message: '⚠ 몬스터가 뒤따라왔다! 전투 재개!', type: 'danger' });
      setTimeout(() => {
        // 타이머 발화 시점에 여전히 같은 노드·basecamp인지 재검증
        if (gs.location.currentNode !== nodeId || gs.ui.currentState !== 'basecamp') return;
        StateMachine.transition('encounter', {
          nodeId,
          enemies,
          dangerLevel: danger,
          noiseLevel:  gs.noise.level,
          forced:      true,
        });
      }, 600);
    } else if (cr.nodeId && gs.location.currentNode !== cr.nodeId) {
      // 다른 장소로 이동 → 위협 회피
      EventBus.emit('notify', { message: '지역을 이동하여 위협을 따돌렸다.', type: 'good' });
    }
    // basecamp가 아닌 다른 상태(combat_result 등)에서 만료 → 조용히 취소
  },

  addNoise(amount) {
    if (amount <= 0) return;
    // silent 특성: 소음 발생량 40% 감소
    const noiseMult = TraitSystem.getTraitEffect('silent', 'noiseMult') ?? 1.0;
    const actual    = amount * noiseMult;
    GameState.noise.level = Math.min(100, GameState.noise.level + actual);
  },

  _triggerInflux() {
    const gs = GameState;
    EventBus.emit('notify', { message: '소음 임계치 초과! 적이 몰려온다!', type: 'danger' });

    // Force an encounter if currently exploring or at basecamp
    if (gs.ui.currentState === 'explore' || gs.ui.currentState === 'basecamp') {
      // Spawn a random encounter
      setTimeout(() => {
        EventBus.emit('stateTransition', {
          from: gs.ui.currentState,
          to: 'encounter',
          data: { forced: true, noiseInflux: true },
        });
      }, 1500);
    }

    // Reset to half after influx
    gs.noise.level = gs.noise.influxThreshold * 0.5;
    gs.noise.influxTriggered = false;
  },
};

export default NoiseSystem;
