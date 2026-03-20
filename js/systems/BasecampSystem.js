// === BASECAMP SYSTEM ===
// 거점 레벨업 / 방어 강화 로직
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n       from '../core/I18n.js';
import UPGRADES   from '../data/basecampUpgrades.js';

const BasecampSystem = {
  init() {
    // 매 TP마다 거점 효과 적용
    EventBus.on('tpAdvance', () => this._applyEffects());
  },

  // 다음 업그레이드 정보 반환 (없으면 null)
  getNextUpgrade() {
    const lvl = GameState.basecamp.level;
    return UPGRADES[lvl] ?? null;
  },

  // 현재 레벨에 따른 누적 효과 반환
  getEffects() {
    const lvl = GameState.basecamp.level;
    const fx  = {
      encounterReduct:   0,
      hpRegenPerTP:      0,
      fatigueRegenBonus: 0,
      moraleBonus:       0,
      noiseDecayBonus:   0,
    };
    for (let i = 0; i < lvl; i++) {
      const upg = UPGRADES[i];
      if (!upg) continue;
      const e = upg.effects;
      fx.encounterReduct   = Math.max(fx.encounterReduct,   e.encounterReduct   ?? 0);
      fx.hpRegenPerTP     += e.hpRegenPerTP      ?? 0;
      fx.fatigueRegenBonus+= e.fatigueRegenBonus ?? 0;
      fx.moraleBonus      += e.moraleBonus        ?? 0;
      fx.noiseDecayBonus  += e.noiseDecayBonus    ?? 0;
    }
    return fx;
  },

  // 업그레이드 가능 여부 체크
  canUpgrade() {
    const next = this.getNextUpgrade();
    if (!next) return { ok: false, reason: I18n.t('bcSys.maxLevel') };
    for (const req of next.cost) {
      const have = GameState.countOnBoard(req.definitionId);
      if (have < req.qty) {
        const def = window.__GAME_DATA__?.items[req.definitionId];
        return { ok: false, reason: I18n.t('bcSys.materialShort', { name: I18n.itemName(req.definitionId, def?.name), have, need: req.qty }) };
      }
    }
    return { ok: true };
  },

  // 업그레이드 실행
  upgrade() {
    const check = this.canUpgrade();
    if (!check.ok) {
      EventBus.emit('notify', { message: I18n.t('bcSys.upgradeFail', { reason: check.reason }), type: 'warn' });
      return false;
    }
    const next = this.getNextUpgrade();

    // 재료 소모
    for (const req of next.cost) {
      let needed = req.qty;
      const matching = GameState.getBoardCards().filter(c => c.definitionId === req.definitionId);
      for (const card of matching) {
        if (needed <= 0) break;
        const qty = card.quantity ?? 1;
        if (qty <= needed) {
          needed -= qty;
          GameState.removeCardInstance(card.instanceId);
        } else {
          card.quantity -= needed;
          needed = 0;
          EventBus.emit('boardChanged', {});
        }
      }
    }

    GameState.basecamp.level += 1;
    EventBus.emit('basecampUpgraded', { level: GameState.basecamp.level });
    EventBus.emit('notify', {
      message: I18n.t('bcSys.upgradeComplete', { level: GameState.basecamp.level, name: next.name }),
      type: 'good',
    });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // 매 TP 거점 효과 적용
  _applyEffects() {
    const gs  = GameState;
    if (!gs.player.isAlive) return;

    const fx = this.getEffects();

    // HP 재생
    if (fx.hpRegenPerTP > 0 && gs.player.hp.current < gs.player.hp.max) {
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + fx.hpRegenPerTP);
    }

    // 피로 회복 (베이스캠프 화면에서만)
    if (fx.fatigueRegenBonus > 0 && gs.ui.currentState === 'basecamp') {
      gs.modStat('fatigue', -fx.fatigueRegenBonus);
    }

    // 사기 보너스
    if (fx.moraleBonus > 0 && gs.ui.currentState === 'basecamp') {
      gs.modStat('morale', fx.moraleBonus);
    }

    // 조우 감소는 ExploreSystem에서 BasecampSystem.getEffects() 참조
    // 소음 감쇠는 NoiseSystem과 통합하기 위해 노출만
  },

  getAllUpgrades() { return UPGRADES; },
};

export default BasecampSystem;
