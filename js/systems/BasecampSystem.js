// === BASECAMP SYSTEM ===
// 안전 가옥 3단계 건설 + 거점 강화 로직
// buildStage 0→1→2→3 (완공 시 랜드마크 카드 생성)
// - built=false, buildStage=0: 초기 상태 (Day 7+ 이후 1단계 가능)
// - buildStage=1: 기초 골조 완료
// - buildStage=2: 내부 설비 완료
// - buildStage=3: 완공 → 베이스캠프 랜드마크화 (안전 지대 효과 발동)
// - built=true: 거점 강화 (Lv1~5 업그레이드)
import EventBus   from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n       from '../core/I18n.js';
import UPGRADES   from '../data/basecampUpgrades.js';
import GameData   from '../data/GameData.js';

// ── 3단계 건설 재료 ──────────────────────────────────────────────
// 각 단계별 다양한 재료 요구 → 플레이어가 여러 종류를 수집해야 함
const BUILD_STAGES = [
  {
    stageIndex: 0,
    label:      '기초 골조 공사',
    icon:       '🪵',
    desc:       '폐건물 뼈대를 보강하고 기초 구조를 세운다.',
    minDay:     7,
    cost: [
      { definitionId: 'wood',       qty: 8  },
      { definitionId: 'nail',       qty: 12 },
      { definitionId: 'rope',       qty: 2  },
      { definitionId: 'cloth',      qty: 3  },
    ],
  },
  {
    stageIndex: 1,
    label:      '내부 설비 정비',
    icon:       '🔧',
    desc:       '실내를 정비하고 창문·문을 보강한다.',
    minDay:     0, // 1단계 완료 후 바로 진행 가능
    cost: [
      { definitionId: 'scrap_metal',    qty: 5  },
      { definitionId: 'wire',           qty: 3  },
      { definitionId: 'glass_shard',    qty: 4  },
      { definitionId: 'duct_tape',      qty: 2  },
    ],
  },
  {
    stageIndex: 2,
    label:      '마감 및 완공',
    icon:       '🏕',
    desc:       '단열·방수 마감 후 거점을 완공한다. 랜드마크로 등록된다.',
    minDay:     0,
    cost: [
      { definitionId: 'leather',          qty: 3  },
      { definitionId: 'cloth',            qty: 6  },
      { definitionId: 'electronic_parts', qty: 1  },
      { definitionId: 'scrap_metal',      qty: 4  },
      { definitionId: 'rope',             qty: 3  },
    ],
  },
];

// 베이스캠프 기본 효과 (buildStage=3 완공 시 적용)
const SAFE_HOUSE_BASE = {
  encounterReduct:    0.10,  // 조우 -10%
  fatigueRegenBonus:  2,     // 피로 회복 +2/TP
  moraleBonus:        2,     // 사기 +2/TP
  noiseDecayBonus:    1.0,   // 소음 감쇠 +1/TP
  weatherProtection:  true,  // 날씨 체온 패널티 면역
  contaminationShield:true,  // 식량 오염 차단
  tempBufferPerTP:    0.3,   // 체온 ±완충 (극한 기후 완화)
};

const BasecampSystem = {
  init() {
    EventBus.on('tpAdvance', () => this._applyEffects());
  },

  // ── 현재 진행 가능한 다음 단계 반환 ────────────────���────────
  getNextBuildStage() {
    const stage = GameState.basecamp.buildStage;
    if (stage >= BUILD_STAGES.length) return null;
    return BUILD_STAGES[stage];
  },

  // ── 다음 건설 단계 진행 가능 여부 ───────────────────────────
  canAdvanceBuild() {
    if (GameState.basecamp.built) return { ok: false, reason: '이미 건설 완료' };
    const stage = this.getNextBuildStage();
    if (!stage) return { ok: false, reason: '모든 단계 완료' };

    const day = GameState.time.day;
    if (stage.minDay > 0 && day < stage.minDay) {
      return {
        ok: false,
        reason: I18n.t('bcSys.stageLocked', { day: stage.minDay, current: day }),
      };
    }
    for (const req of stage.cost) {
      const have = GameState.countOnBoard(req.definitionId);
      if (have < req.qty) {
        const def = GameData?.items[req.definitionId];
        return {
          ok: false,
          reason: I18n.t('bcSys.materialShort', {
            name: I18n.itemName(req.definitionId, def?.name),
            have,
            need: req.qty,
          }),
        };
      }
    }
    return { ok: true };
  },

  // ── 건설 단계 진행 실행 ───────────────────────────────────
  advanceBuild() {
    const check = this.canAdvanceBuild();
    if (!check.ok) {
      EventBus.emit('notify', {
        message: I18n.t('bcSys.buildFail', { reason: check.reason }),
        type: 'warn',
      });
      return false;
    }

    const stage = this.getNextBuildStage();
    this._consumeMaterials(stage.cost);
    GameState.basecamp.buildStage += 1;

    const newStage = GameState.basecamp.buildStage;

    if (newStage < BUILD_STAGES.length) {
      // 중간 단계 완료 알림
      EventBus.emit('notify', {
        message: I18n.t('bcSys.stageComplete', {
          stage: newStage,
          total: BUILD_STAGES.length,
          label: stage.label,
        }),
        type: 'good',
      });
    } else {
      // 3단계 완공 → 랜드마크화
      this._completeBuild();
    }

    EventBus.emit('basecampStageAdvanced', { stage: newStage });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // ── 완공 처리 (3단계 완료) ────────────────────────────────
  _completeBuild() {
    GameState.basecamp.built = true;

    // 랜드마크 카드 생성 및 보드 배치
    const inst = GameState.createCardInstance('basecamp_landmark', {});
    if (inst) {
      GameState.placeCardInRow(inst.instanceId, 'top');
      GameState.basecamp.landmarkCardInstanceId = inst.instanceId;
    }

    EventBus.emit('basecampBuilt', {});
    EventBus.emit('notify', {
      message: I18n.t('bcSys.buildComplete'),
      type: 'good',
    });
    EventBus.emit('notify', {
      message: I18n.t('bcSys.landmarkCreated'),
      type: 'good',
    });
  },

  // ── 강화 업그레이드 관련 (기존 유지) ─────────────────────
  getNextUpgrade() {
    if (!GameState.basecamp.built) return null;
    return UPGRADES[GameState.basecamp.level] ?? null;
  },

  getEffects() {
    if (GameState.basecamp.buildStage < BUILD_STAGES.length) {
      return {
        encounterReduct: 0, hpRegenPerTP: 0,
        fatigueRegenBonus: 0, moraleBonus: 0,
        noiseDecayBonus: 0, weatherProtection: false,
        contaminationShield: false, tempBufferPerTP: 0,
      };
    }
    const fx = { ...SAFE_HOUSE_BASE, hpRegenPerTP: 0 };
    const lvl = GameState.basecamp.level;
    for (let i = 0; i < lvl; i++) {
      const upg = UPGRADES[i];
      if (!upg) continue;
      const e = upg.effects;
      fx.encounterReduct    = Math.max(fx.encounterReduct,   e.encounterReduct    ?? 0);
      fx.hpRegenPerTP      += e.hpRegenPerTP      ?? 0;
      fx.fatigueRegenBonus += e.fatigueRegenBonus ?? 0;
      fx.moraleBonus       += e.moraleBonus       ?? 0;
      fx.noiseDecayBonus   += e.noiseDecayBonus   ?? 0;
    }
    return fx;
  },

  canUpgrade() {
    if (!GameState.basecamp.built) return { ok: false, reason: I18n.t('bcSys.notBuilt') };
    const next = this.getNextUpgrade();
    if (!next) return { ok: false, reason: I18n.t('bcSys.maxLevel') };
    for (const req of next.cost) {
      const have = GameState.countOnBoard(req.definitionId);
      if (have < req.qty) {
        const def = GameData?.items[req.definitionId];
        return {
          ok: false,
          reason: I18n.t('bcSys.materialShort', {
            name: I18n.itemName(req.definitionId, def?.name),
            have,
            need: req.qty,
          }),
        };
      }
    }
    return { ok: true };
  },

  upgrade() {
    const check = this.canUpgrade();
    if (!check.ok) {
      EventBus.emit('notify', {
        message: I18n.t('bcSys.upgradeFail', { reason: check.reason }),
        type: 'warn',
      });
      return false;
    }
    const next = this.getNextUpgrade();
    this._consumeMaterials(next.cost);
    GameState.basecamp.level += 1;
    EventBus.emit('basecampUpgraded', { level: GameState.basecamp.level });
    EventBus.emit('notify', {
      message: I18n.t('bcSys.upgradeComplete', {
        level: GameState.basecamp.level,
        name: next.name,
      }),
      type: 'good',
    });
    EventBus.emit('boardChanged', {});
    return true;
  },

  // ── 재료 소모 공통 로직 ───────────────────────────────────
  _consumeMaterials(costList) {
    for (const req of costList) {
      let needed = req.qty;
      const matching = GameState.getBoardCards().filter(
        c => c.definitionId === req.definitionId
      );
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

  // ── 매 TP 거점 효과 적용 ─────────────────────────────────
  _applyEffects() {
    if (!GameState.player.isAlive) return;
    if (GameState.basecamp.buildStage < BUILD_STAGES.length) return;

    const gs = GameState;
    const fx = this.getEffects();

    if (fx.hpRegenPerTP > 0 && gs.player.hp.current < gs.player.hp.max) {
      gs.player.hp.current = Math.min(
        gs.player.hp.max,
        gs.player.hp.current + fx.hpRegenPerTP
      );
    }
    if (fx.fatigueRegenBonus > 0 && gs.ui.currentState === 'basecamp') {
      gs.modStat('fatigue', -fx.fatigueRegenBonus);
    }
    if (fx.moraleBonus > 0 && gs.ui.currentState === 'basecamp') {
      gs.modStat('morale', fx.moraleBonus);
    }

    // 체온 완충 (극한 기후에서 베이스캠프 내 체온 안정화)
    if (fx.tempBufferPerTP > 0 && gs.ui.currentState === 'basecamp') {
      const temp = gs.player.temperature ?? 37;
      if (temp < 36.5) {
        gs.modStat('temperature', Math.min(fx.tempBufferPerTP, 36.5 - temp));
      } else if (temp > 38.0) {
        gs.modStat('temperature', -Math.min(fx.tempBufferPerTP, temp - 38.0));
      }
    }
  },

  // ── 쿼리 API ───────────────────────────────────────────────
  getBuildStages()   { return BUILD_STAGES; },
  getAllUpgrades()   { return UPGRADES; },
  isCompleted()     { return GameState.basecamp.buildStage >= BUILD_STAGES.length; },
  getCurrentStage() { return GameState.basecamp.buildStage; },

  // 구버전 호환 — BasecampModal이 getBuildCost()를 호출하는 곳 대비
  getBuildCost() {
    const s = this.getNextBuildStage();
    return s ? s.cost : [];
  },
};

export default BasecampSystem;
