// === BASECAMP SYSTEM ===
// 안전 가옥 건설 + 거점 강화 로직
// - built=false: 게임 초반, Day 10 이후 안전 가옥 건설 가능
// - built=true:  거점 강화 (Lv1~5 업그레이드)
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n       from '../core/I18n.js';
import UPGRADES   from '../data/basecampUpgrades.js';

// 안전 가옥 건설 재료 (중반 전환점: 목재+천+못+밧줄)
const BUILD_COST = [
  { definitionId: 'wood',  qty: 10 },
  { definitionId: 'cloth', qty: 5  },
  { definitionId: 'nail',  qty: 15 },
  { definitionId: 'rope',  qty: 3  },
];

// 안전 가옥 건설 시 기본 효과 (강화 업그레이드와 별도 누적)
const SAFE_HOUSE_BASE = {
  encounterReduct:   0.05,
  fatigueRegenBonus: 1,
  moraleBonus:       1,
  noiseDecayBonus:   0.5,
};

const BasecampSystem = {
  init() {
    EventBus.on('tpAdvance', () => this._applyEffects());
  },

  // 안전 가옥 건설 가능 여부 (Day 10+ & 재료 충족)
  canBuild() {
    if (GameState.basecamp.built) return { ok: false, reason: '이미 건설됨' };
    if (GameState.time.day < 10) {
      return { ok: false, reason: I18n.t('bcModal.buildLocked', { day: GameState.time.day }) };
    }
    for (const req of BUILD_COST) {
      const have = GameState.countOnBoard(req.definitionId);
      if (have < req.qty) {
        const def = window.__GAME_DATA__?.items[req.definitionId];
        return { ok: false, reason: I18n.t('bcSys.materialShort', { name: I18n.itemName(req.definitionId, def?.name), have, need: req.qty }) };
      }
    }
    return { ok: true };
  },

  // 안전 가옥 건설 실행
  build() {
    const check = this.canBuild();
    if (!check.ok) {
      EventBus.emit('notify', { message: I18n.t('bcSys.buildFail', { reason: check.reason }), type: 'warn' });
      return false;
    }

    // 재료 소모
    this._consumeMaterials(BUILD_COST);

    GameState.basecamp.built = true;
    EventBus.emit('basecampBuilt', {});
    EventBus.emit('notify', { message: I18n.t('bcSys.buildComplete'), type: 'good' });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // 다음 강화 업그레이드 반환 (없으면 null)
  getNextUpgrade() {
    if (!GameState.basecamp.built) return null;
    return UPGRADES[GameState.basecamp.level] ?? null;
  },

  // 현재 상태의 누적 효과 반환
  getEffects() {
    if (!GameState.basecamp.built) {
      return { encounterReduct: 0, hpRegenPerTP: 0, fatigueRegenBonus: 0, moraleBonus: 0, noiseDecayBonus: 0 };
    }

    // 안전 가옥 기본 효과
    const fx = { ...SAFE_HOUSE_BASE, hpRegenPerTP: 0 };

    // 강화 업그레이드 누적
    const lvl = GameState.basecamp.level;
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

  // 강화 업그레이드 가능 여부
  canUpgrade() {
    if (!GameState.basecamp.built) return { ok: false, reason: '안전 가옥 미건설' };
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

  // 강화 업그레이드 실행
  upgrade() {
    const check = this.canUpgrade();
    if (!check.ok) {
      EventBus.emit('notify', { message: I18n.t('bcSys.upgradeFail', { reason: check.reason }), type: 'warn' });
      return false;
    }
    const next = this.getNextUpgrade();
    this._consumeMaterials(next.cost);

    GameState.basecamp.level += 1;
    EventBus.emit('basecampUpgraded', { level: GameState.basecamp.level });
    EventBus.emit('notify', {
      message: I18n.t('bcSys.upgradeComplete', { level: GameState.basecamp.level, name: next.name }),
      type: 'good',
    });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // 재료 소모 공통 로직
  _consumeMaterials(costList) {
    for (const req of costList) {
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
  },

  // 매 TP 거점 효과 적용
  _applyEffects() {
    if (!GameState.player.isAlive) return;
    if (!GameState.basecamp.built) return;

    const gs = GameState;
    const fx = this.getEffects();

    if (fx.hpRegenPerTP > 0 && gs.player.hp.current < gs.player.hp.max) {
      gs.player.hp.current = Math.min(gs.player.hp.max, gs.player.hp.current + fx.hpRegenPerTP);
    }
    if (fx.fatigueRegenBonus > 0 && gs.ui.currentState === 'basecamp') {
      gs.modStat('fatigue', -fx.fatigueRegenBonus);
    }
    if (fx.moraleBonus > 0 && gs.ui.currentState === 'basecamp') {
      gs.modStat('morale', fx.moraleBonus);
    }
  },

  getBuildCost()    { return BUILD_COST; },
  getAllUpgrades()  { return UPGRADES; },
};

export default BasecampSystem;
