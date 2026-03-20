// === NOISE SYSTEM ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import I18n        from '../core/I18n.js';
import StateMachine from '../core/StateMachine.js';
import { rollEnemyGroup } from '../data/enemies.js';
import TraitSystem from './TraitSystem.js';
import BasecampSystem from './BasecampSystem.js';
import BALANCE from '../data/gameBalance.js';

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

    // Decay (베이스캠프 noiseDecayBonus + 소음 레벨 비례 추가 감소)
    const noiseBonus = BasecampSystem.getEffects().noiseDecayBonus;
    let scaledBonus = 0;
    for (const bp of BALANCE.noise.scaledDecayBreakpoints) {
      if (n.level >= bp.threshold) scaledBonus = bp.bonusDecay;
    }
    const decayed = Math.min(n.level, n.decayPerTP + noiseBonus + scaledBonus);
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

    // ── 후반 레이드 이벤트 ──────────────────────────────
    this._checkRaidEvent();

    // ── 좀비 습격 (Horde Wave) ────────────────────────
    this._checkHordeWave();

    // ── 약탈자 NPC 이벤트 ─────────────────────────────
    this._checkRaiderEvent();

    // ── 전투 재조우 카운트다운 ──────────────────────────
    this._tickRespawn();
  },

  _tickRespawn() {
    const gs = GameState;
    const cr = gs.combatRespawn;
    if (!cr.active || !gs.player.isAlive || gs.combat.active) return;

    cr.tpRemaining--;

    if (cr.tpRemaining === 1) {
      EventBus.emit('notify', { message: I18n.t('noise.respawnImminent'), type: 'warn' });
    }

    if (cr.tpRemaining > 0) return;

    // 타이머 만료
    cr.active = false;

    if (cr.nodeId && gs.location.currentNode === cr.nodeId && gs.ui.currentState === 'basecamp') {
      // 같은 장소 → 조우 발생
      const nodeId  = cr.nodeId;
      const danger  = cr.dangerLevel;
      const enemies = rollEnemyGroup(danger, gs.noise.level);
      EventBus.emit('notify', { message: I18n.t('noise.caughtUp'), type: 'danger' });
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
      EventBus.emit('notify', { message: I18n.t('noise.evaded'), type: 'good' });
    }
    // basecamp가 아닌 다른 상태(combat_result 등)에서 만료 → 조용히 취소
  },

  _checkRaidEvent() {
    const gs = GameState;
    const day = gs.time.day;
    const rc = BALANCE.raidEvents;
    if (day < rc.startDay) return;
    if (gs.combat.active || gs.ui.currentState !== 'basecamp') return;

    const chance = Math.min(rc.maxChance, rc.baseChancePerTP + (day - rc.startDay) * rc.dayScaling);
    if (Math.random() >= chance) return;

    const enemyCount = rc.minEnemies + Math.floor(Math.random() * (rc.maxEnemies - rc.minEnemies + 1));
    const dangerLevel = Math.min(5, Math.floor(day / 10) + 1);
    const enemies = rollEnemyGroup(dangerLevel, gs.noise.level);
    // 레이드는 추가 적 보충
    while (enemies.length < enemyCount) {
      const extra = rollEnemyGroup(dangerLevel, gs.noise.level);
      enemies.push(extra[0]);
      if (enemies.length >= enemyCount) break;
    }

    EventBus.emit('notify', { message: I18n.t('noise.raidAttack'), type: 'danger' });
    setTimeout(() => {
      if (gs.ui.currentState !== 'basecamp') return;
      StateMachine.transition('encounter', {
        nodeId: gs.location.currentDistrict,
        enemies,
        dangerLevel,
        noiseLevel: gs.noise.level,
        forced: true,
        isRaid: true,
      });
    }, 800);
  },

  // ── 좀비 습격 (Horde Wave) ────────────────────────────────────
  _checkHordeWave() {
    const gs  = GameState;
    const day = gs.time.day;
    const hw  = BALANCE.hordeWaves;
    if (day < hw.startDay) return;
    if (gs.combat.active || gs.ui.currentState !== 'basecamp') return;
    // 하루 첫 TP에서만 체크
    if (gs.time.tpInDay !== 0) return;

    // 다음 습격일 초기화
    if (!gs.flags.nextHordeDay) {
      const variance = Math.floor(Math.random() * (hw.intervalVariance * 2 + 1)) - hw.intervalVariance;
      gs.flags.nextHordeDay = hw.startDay + variance;
      gs.flags.hordeWaveCount = 0;
    }

    if (day < gs.flags.nextHordeDay) return;

    // 습격 발동
    const waveNum    = (gs.flags.hordeWaveCount ?? 0) + 1;
    const enemyCount = Math.min(hw.maxEnemies, hw.baseEnemies + (waveNum - 1) * hw.enemiesPerWave);
    const dangerLvl  = Math.min(4, Math.floor(hw.baseDangerLevel + (waveNum - 1) * hw.dangerScaling));

    const enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      const group = rollEnemyGroup(dangerLvl, gs.noise.level);
      enemies.push(group[0]);
    }

    // 다음 습격일 설정
    const variance = Math.floor(Math.random() * (hw.intervalVariance * 2 + 1)) - hw.intervalVariance;
    gs.flags.nextHordeDay = day + hw.intervalDays + variance;
    gs.flags.hordeWaveCount = waveNum;

    EventBus.emit('notify', {
      message: I18n.t('noise.hordeWave', { wave: waveNum }),
      type: 'danger',
    });

    setTimeout(() => {
      if (gs.ui.currentState !== 'basecamp') return;
      StateMachine.transition('encounter', {
        nodeId:       gs.location.currentDistrict,
        enemies,
        dangerLevel:  dangerLvl,
        noiseLevel:   gs.noise.level,
        forced:       true,
        isHordeWave:  true,
        hordeWaveNum: waveNum,
      });
    }, 800);
  },

  // ── 약탈자 NPC 이벤트 ──────────────────────────────────────────
  _checkRaiderEvent() {
    const gs  = GameState;
    const day = gs.time.day;
    const re  = BALANCE.raiderEvents;
    if (day < re.startDay) return;
    if (gs.combat.active || gs.ui.currentState !== 'basecamp') return;

    // 쿨다운 체크
    if (gs.flags.raiderCooldownTP && gs.flags.raiderCooldownTP > 0) {
      gs.flags.raiderCooldownTP--;
      return;
    }

    const chance = Math.min(re.maxChance, re.baseChancePerTP + (day - re.startDay) * re.dayScaling);
    if (Math.random() >= chance) return;

    // 쿨다운 설정
    gs.flags.raiderCooldownTP = re.cooldownTP;

    // 보드에 food/medical 카드 확인
    const boardCards   = gs.getBoardCards();
    const demandCards  = boardCards.filter(c => {
      const def = gs.getCardDef(c.instanceId);
      if (!def) return false;
      return def.subtype === 'food' || def.subtype === 'drink' || def.tags?.includes('medical');
    });

    if (demandCards.length === 0) {
      // 넘길 물자가 없으면 바로 전투
      EventBus.emit('notify', {
        message: I18n.t('noise.raiderNoSupply'),
        type: 'danger',
      });
      this._triggerRaiderCombat();
      return;
    }

    // 요구 아이템 수 결정
    const demandCount = Math.min(
      demandCards.length,
      re.demandItems + Math.floor(Math.random() * (re.demandItemsMax - re.demandItems + 1))
    );
    const demandCardIds = demandCards
      .sort(() => Math.random() - 0.5)
      .slice(0, demandCount)
      .map(c => c.instanceId);

    // 약탈자 협상 이벤트
    EventBus.emit('raiderDemand', {
      demandCardIds,
      demandCount,
      onSurrender: () => {
        // 물자 넘기기
        for (const instId of demandCardIds) {
          gs.removeCardInstance(instId);
          EventBus.emit('cardRemoved', { instanceId: instId });
        }
        gs.modStat('morale', re.surrenderMorale);
        EventBus.emit('notify', {
          message: I18n.t('noise.raiderSurrender', { count: demandCount }),
          type: 'warn',
        });
        EventBus.emit('boardChanged', {});
      },
      onRefuse: () => {
        gs.modStat('morale', re.refuseMorale);
        EventBus.emit('notify', {
          message: I18n.t('noise.raiderCombat'),
          type: 'danger',
        });
        this._triggerRaiderCombat();
      },
    });
  },

  _triggerRaiderCombat() {
    const gs  = GameState;
    const day = gs.time.day;
    const enemies = [];

    if (day < 50) {
      // Day 40-50: raider 1마리
      const group = rollEnemyGroup(2, gs.noise.level);
      const raiderEnemy = group.find(e => e.id === 'raider') ?? group[0];
      enemies.push(raiderEnemy);
    } else if (day < 70) {
      // Day 50-70: raider 2마리
      for (let i = 0; i < 2; i++) {
        const group = rollEnemyGroup(3, gs.noise.level);
        const raiderEnemy = group.find(e => e.id === 'raider') ?? group[0];
        enemies.push(raiderEnemy);
      }
    } else {
      // Day 70+: raider + raider_elite
      const group1 = rollEnemyGroup(3, gs.noise.level);
      enemies.push(group1.find(e => e.id === 'raider') ?? group1[0]);
      const group2 = rollEnemyGroup(4, gs.noise.level);
      enemies.push(group2.find(e => e.id === 'raider_elite') ?? group2[0]);
    }

    setTimeout(() => {
      if (gs.ui.currentState !== 'basecamp') return;
      StateMachine.transition('encounter', {
        nodeId:      gs.location.currentDistrict,
        enemies,
        dangerLevel: Math.min(4, Math.floor(day / 20) + 1),
        noiseLevel:  gs.noise.level,
        forced:      true,
        isRaiderAttack: true,
      });
    }, 600);
  },

  addNoise(amount) {
    if (amount <= 0) return;
    // silent 특성: 소음 발생량 40% 감소
    const noiseMult = TraitSystem.getTraitEffect('silent', 'noiseMult') ?? 1.0;
    const actual    = amount * noiseMult;
    GameState.noise.level = Math.min(BALANCE.noise.max, GameState.noise.level + actual);
  },

  _triggerInflux() {
    const gs = GameState;
    EventBus.emit('notify', { message: I18n.t('noise.influx'), type: 'danger' });

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
