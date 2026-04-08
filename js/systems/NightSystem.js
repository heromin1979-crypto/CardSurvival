// === NIGHT SYSTEM ===
// 야간 행동 제한, 수면 품질, 야간 위험 증가, 광원 밸런스.
// 완전 무상태 — GameState.time.hour + 보드 상태로 실시간 계산.

import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import BALANCE   from '../data/gameBalance.js';
import EventBus  from '../core/EventBus.js';

const NightSystem = {

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
  },

  /** 야간 광원 카드 내구도 소모 (매 TP) */
  _onTP() {
    if (!this.isNight()) return;

    // 첫 야간 진입 원샷 힌트
    const gs = GameState;
    if (!gs.flags.firstNightHintShown) {
      gs.flags.firstNightHintShown = true;
      EventBus.emit('notify', { message: I18n.t('night.firstNightHint'), type: 'info' });
      // Trigger night watch proposal on first night
      EventBus.emit('nightStarted');
    }

    const items = window.__GAME_DATA__?.items ?? {};
    const drain = BALANCE.night.lightDrainPerTP;

    gs.getBoardCards().forEach(card => {
      const def = items[card.definitionId];
      if (!def?.tags?.includes('light')) return;
      if (card.durability == null) return; // 내구도 없는 광원(campfire 구조물 등)은 제외
      card.durability = Math.max(0, card.durability - drain);
      if (card.durability <= 0) {
        const name = I18n.t(`_item.${card.definitionId}`) || card.definitionId;
        EventBus.emit('notify', { message: I18n.t('night.lightBroken', { name }), type: 'warn' });
        gs.removeCardInstance(card.instanceId);
        EventBus.emit('cardRemoved', { instanceId: card.instanceId });
      }
    });
  },

  /** 현재 시각이 야간인지 판별 */
  isNight() {
    const hour = GameState.time?.hour ?? 12;
    const { startHour, endHour } = BALANCE.night;
    return hour >= startHour || hour < endHour;
  },

  /** 보드 위에 'light' 태그가 있는 카드가 존재하는지 */
  hasLightSource() {
    const items = window.__GAME_DATA__?.items ?? {};
    return GameState.getBoardCards().some(c => {
      const def = items[c.definitionId];
      return def?.tags?.includes('light');
    });
  },

  /**
   * 야간+광원 없음 → 행동 불가
   * @param {'explore'|'craft'|'dismantle'|'travel'} action
   * @returns {{ allowed: boolean, reason?: string }}
   */
  canActAtNight(action) {
    if (!this.isNight()) return { allowed: true };
    if (this.hasLightSource()) return { allowed: true };

    const keyMap = {
      explore:   'night.noLightExplore',
      craft:     'night.noLightCraft',
      dismantle: 'night.noLightDismantle',
      travel:    'night.noLightTravel',
    };
    return {
      allowed: false,
      reason: I18n.t(keyMap[action] ?? 'night.noLightExplore'),
    };
  },

  /** 야간 조우 확률 배율 (야간 2.0×, 낮 1.0×) */
  getNightEncounterMult() {
    return this.isNight() ? BALANCE.night.encounterMult : 1.0;
  },

  /** 야간 이동 TP 비용 배율 (야간 1.5×, 낮 1.0×) */
  getNightTravelCostMult() {
    return this.isNight() ? BALANCE.night.travelCostMult : 1.0;
  },

  /**
   * 수면 품질 판정
   * @returns {{ quality: 'day'|'lit'|'dark', fatigueMult: number, anxietyDelta: number, nightmareBonus: number }}
   */
  getSleepQuality() {
    if (!this.isNight()) {
      return { quality: 'day', fatigueMult: 1.0, anxietyDelta: 0, nightmareBonus: 0 };
    }
    if (this.hasLightSource()) {
      return {
        quality: 'lit',
        fatigueMult: 1.0,
        anxietyDelta: -BALANCE.night.litSleepAnxietyDrop,
        nightmareBonus: 0,
      };
    }
    return {
      quality: 'dark',
      fatigueMult: BALANCE.night.darkSleepFatigueMult,
      anxietyDelta: BALANCE.night.darkSleepAnxietyGain,
      nightmareBonus: BALANCE.night.darkNightmareBonus,
    };
  },
};

export default NightSystem;
