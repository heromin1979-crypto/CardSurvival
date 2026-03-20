// === SECRET COMBINATION SYSTEM ===
// 비밀 조합 체크, 발견 기록, 힌트 관리.
// SlotResolver에서 interactions → secretCombo → craftDiscovery 순서로 호출.

import EventBus            from '../core/EventBus.js';
import GameState           from '../core/GameState.js';
import I18n                from '../core/I18n.js';
import SkillSystem         from './SkillSystem.js';
import SECRET_COMBINATIONS from '../data/secretCombinations.js';

// interactions.js의 매칭 로직과 동일
function _matchesCriteria(def, criteria) {
  if (!def || !criteria) return false;
  if (criteria.id  && def.id   !== criteria.id)           return false;
  if (criteria.tag && !def.tags?.includes(criteria.tag))  return false;
  return true;
}

const SecretCombinationSystem = {

  init() {
    this._ensureState();
    this._initHintListeners();
  },

  _ensureState() {
    const gs = GameState;
    if (!gs.discoveries) {
      gs.discoveries = {
        foundCombinations: [],
        totalFound: 0,
        lastCooldowns: {},  // { comboId: lastUsedTP }
      };
    }
    if (!gs.discoveries.unlockedHints) gs.discoveries.unlockedHints = [];
  },

  /**
   * 두 카드 정의로 비밀 조합 매칭.
   * @returns {{ found: boolean, combo?, isNew?: boolean, reason?: string }}
   */
  checkCombination(srcDef, tgtDef) {
    this._ensureState();
    const gs = GameState;

    for (const combo of SECRET_COMBINATIONS) {
      // 양방향 매칭 (src→target 또는 target→src)
      const matchForward  = _matchesCriteria(srcDef, combo.source) && _matchesCriteria(tgtDef, combo.target);
      const matchReverse  = _matchesCriteria(srcDef, combo.target) && _matchesCriteria(tgtDef, combo.source);
      if (!matchForward && !matchReverse) continue;

      // 스킬 요구
      if (combo.requiredSkill) {
        for (const [skill, level] of Object.entries(combo.requiredSkill)) {
          if ((gs.player.skills?.[skill]?.level ?? 0) < level) {
            return { found: false, reason: `${skill} Lv.${level} 필요` };
          }
        }
      }

      // 날짜 요구
      if (combo.requiredDay && gs.time.day < combo.requiredDay) {
        return { found: false };
      }

      // 쿨다운
      if (combo.cooldown) {
        const lastUsed = gs.discoveries.lastCooldowns[combo.id] ?? 0;
        if (gs.time.totalTP - lastUsed < combo.cooldown) {
          return { found: true, combo, isNew: false, reason: I18n.t('secret.cooldown') };
        }
      }

      // 추가 재료
      if (combo.additionalReq) {
        for (const req of combo.additionalReq) {
          if (gs.countOnBoard(req.id) < req.qty) {
            const def = window.__GAME_DATA__?.items[req.id];
            return { found: true, combo, isNew: false, reason: `${I18n.itemName(req.id, def?.name)} ×${req.qty} 필요` };
          }
        }
      }

      const isNew = !gs.discoveries.foundCombinations.includes(combo.id);
      return { found: true, combo, isNew };
    }

    return { found: false };
  },

  /**
   * 비밀 조합 실행.
   * @returns {{ message: string, consumeSrc, consumeTgt }}
   */
  applyCombination(combo, srcInst, tgtInst) {
    this._ensureState();
    const gs = GameState;
    const r  = combo.result;

    // 발견 기록
    if (!gs.discoveries.foundCombinations.includes(combo.id)) {
      gs.discoveries.foundCombinations.push(combo.id);
      gs.discoveries.totalFound = gs.discoveries.foundCombinations.length;

      // XP 보너스
      if (combo.xpReward) {
        SkillSystem.gainXp(combo.xpReward.skill, combo.xpReward.amount);
      }

      EventBus.emit('notify', { message: combo.discoveryMsg, type: 'good' });
      EventBus.emit('secretDiscovered', { comboId: combo.id });
    }

    // 쿨다운 기록
    if (combo.cooldown) {
      gs.discoveries.lastCooldowns[combo.id] = gs.time.totalTP;
    }

    // 스탯 변경
    if (r.statChange) {
      for (const [stat, val] of Object.entries(r.statChange)) {
        if (stat === 'noise') {
          const NoiseSystem = window.__GAME_DATA__?._noiseSystem;
          // 간단히 noise.level 직접 수정
          if (gs.noise) gs.noise.level = Math.min(100, (gs.noise.level ?? 0) + val);
        } else {
          gs.modStat(stat, val);
        }
      }
    }

    // 아이템 생성
    if (r.spawnItem) {
      const newInst = gs.createCardInstance(r.spawnItem);
      if (newInst) {
        const placed = gs.placeCardInRow(newInst.instanceId, 'middle');
        if (!placed) gs.placeCardInRow(newInst.instanceId, 'bottom');
      }
    }

    // 무기 효과 추가
    if (r.addEffect && !r.consumeTgt) {
      if (r.addEffect.poisonDamage) {
        tgtInst._poisonDamage = (tgtInst._poisonDamage ?? 0) + r.addEffect.poisonDamage;
      }
    }

    // 추가 재료 소모
    if (combo.additionalReq && r.consumeExtra) {
      for (const req of combo.additionalReq) {
        let needed = req.qty;
        for (const card of gs.getBoardCards()) {
          if (needed <= 0) break;
          if (card.definitionId !== req.id) continue;
          const qty = card.quantity ?? 1;
          if (qty <= needed) {
            needed -= qty;
            gs.removeCardInstance(card.instanceId);
          } else {
            card.quantity -= needed;
            needed = 0;
          }
        }
      }
    }

    // 이벤트 트리거
    if (r.triggerEvent) {
      EventBus.emit('secretEventTriggered', { eventId: r.triggerEvent });
    }

    return {
      message: combo.discoveryMsg,
      consumeSrc: r.consumeSrc ?? false,
      consumeTgt: r.consumeTgt ?? false,
    };
  },

  // ── Hint System ─────────────────────────────────────────────

  /** Unlock a hint for a specific combo */
  unlockHint(comboId) {
    this._ensureState();
    const hints = GameState.discoveries.unlockedHints;
    if (hints.includes(comboId)) return;

    const combo = SECRET_COMBINATIONS.find(c => c.id === comboId);
    if (!combo) return;

    GameState.discoveries.unlockedHints = [...hints, comboId];
    EventBus.emit('notify', {
      message: I18n.t('hint.discovered'),
      type: 'info',
    });
    EventBus.emit('hintUnlocked', { comboId });
  },

  /** Get all unlocked hints (for UI display) */
  getUnlockedHints() {
    this._ensureState();
    return (GameState.discoveries.unlockedHints ?? []).map(id => {
      const combo = SECRET_COMBINATIONS.find(c => c.id === id);
      const found = GameState.discoveries.foundCombinations.includes(id);
      return combo ? { id, hint: combo.hint, name: combo.name, found } : null;
    }).filter(Boolean);
  },

  /** Check if a hint is unlocked */
  isHintUnlocked(comboId) {
    this._ensureState();
    return GameState.discoveries.unlockedHints?.includes(comboId) ?? false;
  },

  /** Register event listeners for hint sources */
  _initHintListeners() {
    // ── Hidden Location Hints ──────────────────────────────────
    const LOCATION_HINTS = {
      hidden_dobong_hermit_cave:              ['sc_herbal_medicine'],
      hidden_gangbuk_mountain_spring:         ['sc_herbal_medicine'],
      hidden_yongsan_us_armory:               ['sc_molotov', 'sc_fire_arrow'],
      hidden_gwanak_snu_reactor:              ['sc_radio_signal'],
      hidden_seodaemun_severance_lab:         ['sc_field_surgery_kit', 'sc_painkiller_mix'],
      hidden_guro_factory_forge:              ['sc_reinforced_shield', 'sc_thorn_wire'],
      hidden_mapo_hongdae_basement:           ['sc_journal'],
      hidden_yeongdeungpo_kbs_broadcast:      ['sc_radio_signal', 'sc_signal_fire'],
      hidden_seongdong_forge_master:          ['sc_poison_blade'],
      hidden_geumcheon_underground_factory:   ['sc_smoke_bomb'],
    };

    EventBus.on('hiddenLocationDiscovered', ({ locationId }) => {
      const hintIds = LOCATION_HINTS[locationId];
      if (!hintIds) return;
      hintIds.forEach(id => this.unlockHint(id));
      EventBus.emit('notify', {
        message: I18n.t('hint.fromLocation'),
        type: 'info',
      });
    });

    // ── Skill Level Hints ──────────────────────────────────────
    const SKILL_HINTS = {
      medicine:    { 3: ['sc_herbal_medicine'],                5: ['sc_field_surgery_kit'] },
      weaponcraft: { 3: ['sc_poison_blade'],                   4: ['sc_fire_arrow'] },
      crafting:    { 3: ['sc_torch', 'sc_oil_lamp'],           5: ['sc_water_trap'] },
      building:    { 3: ['sc_thorn_wire'],                     4: ['sc_signal_fire'] },
    };

    EventBus.on('skillLevelUp', ({ skillId, newLevel, skillName }) => {
      const tierMap = SKILL_HINTS[skillId];
      if (!tierMap) return;
      const hintIds = tierMap[newLevel];
      if (!hintIds) return;
      hintIds.forEach(id => this.unlockHint(id));
      EventBus.emit('notify', {
        message: I18n.t('hint.fromSkill', { skill: skillName ?? skillId }),
        type: 'info',
      });
    });
  },

  /** 발견 현황 */
  getProgress() {
    this._ensureState();
    return {
      found: GameState.discoveries.totalFound,
      total: SECRET_COMBINATIONS.length,
    };
  },
};

export default SecretCombinationSystem;
