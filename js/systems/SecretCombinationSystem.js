// === SECRET COMBINATION SYSTEM ===
// 비밀 조합 체크, 발견 기록, 힌트 관리.
// SlotResolver에서 interactions → secretCombo → craftDiscovery 순서로 호출.

import EventBus            from '../core/EventBus.js';
import GameState           from '../core/GameState.js';
import I18n                from '../core/I18n.js';
import SkillSystem         from './SkillSystem.js';
import SECRET_COMBINATIONS from '../data/secretCombinations.js';
import GameData            from '../data/GameData.js';
import BALANCE             from '../data/gameBalance.js';

// 스킬 레벨 달성 시 힌트를 여는 조합 목록 — 존재하지 않는 조합을 가리키면 힌트가 조용히 죽는다.
// 티어는 조합의 xpReward.skill(그 조합이 길러주는 스킬)에 맞추고, requiredSkill이 있으면
// 그 레벨 이상에 둔다. 낮게 두면 힌트를 받고도 쓸 수 없다 (SecretHintCoverage.test.js가 검사).
export const SKILL_HINTS = {
  medicine:    { 1: ['sc_rain_shower', 'sc_snow_compress'],
                 2: ['sc_natural_antibiotic', 'sc_toxic_mushroom_extract'],
                 3: ['sc_herbal_medicine', 'sc_honey_medicine'],
                 5: ['sc_field_surgery_kit'] },
  weaponcraft: { 1: ['sc_sling'], 3: ['sc_poison_blade'], 4: ['sc_fire_arrow'] },
  crafting:    { 1: ['sc_bark_rope', 'sc_dry_grass_kindling', 'sc_pine_cone_fuel'],
                 2: ['sc_acorn_fire_starter', 'sc_nettle_rope', 'sc_fishing_rod'],
                 3: ['sc_torch', 'sc_oil_lamp'],
                 4: ['sc_fuel_can_fire'],
                 5: ['sc_water_trap'] },
  cooking:     { 1: ['sc_wild_salad'], 2: ['sc_bamboo_water', 'sc_wind_stove_campfire'] },
  building:    { 3: ['sc_thorn_wire'],                     4: ['sc_signal_fire'] },
  defense:     { 1: ['sc_defense_salve'], 4: ['sc_shield_mod'], 6: ['sc_guard_stance_kit'], 11: ['sc_fortress_mod'] },
  unarmed:     { 2: ['sc_knuckle_wrap'],  4: ['sc_combat_gloves'], 7: ['sc_iron_gauntlet'] },
  melee:       { 1: ['sc_sharpen_blade'], 3: ['sc_weapon_oil'], 5: ['sc_serrated_mod'], 7: ['sc_quench_blade'] },
  ranged:      { 2: ['sc_ammo_mod'],      4: ['sc_weapon_scope'], 6: ['sc_suppressor'] },
};

// 숨은 장소 발견 시 힌트를 여는 조합 목록. 스킬 경로와 이중화해 주제가 맞는 장소에도 배치한다.
export const LOCATION_HINTS = {
  hidden_dobong_hermit_cave:              ['sc_herbal_medicine', 'sc_toxic_mushroom_extract'],
  hidden_gangbuk_mountain_spring:         ['sc_herbal_medicine', 'sc_natural_antibiotic'],
  hidden_yongsan_us_armory:               ['sc_molotov', 'sc_fire_arrow'],
  hidden_gwanak_snu_reactor:              ['sc_radio_signal'],
  hidden_seodaemun_severance_lab:         ['sc_field_surgery_kit', 'sc_painkiller_mix'],
  hidden_guro_factory_forge:              ['sc_reinforced_shield', 'sc_thorn_wire'],
  hidden_mapo_hongdae_basement:           ['sc_journal'],
  hidden_yeongdeungpo_kbs_broadcast:      ['sc_radio_signal', 'sc_signal_fire'],
  hidden_seongdong_forge_master:          ['sc_poison_blade', 'sc_sling'],
  hidden_geumcheon_underground_factory:   ['sc_smoke_bomb'],
  hidden_gangnam_samsung_pharmacy:        ['sc_honey_medicine'],
  hidden_jungrang_water_treatment:        ['sc_wind_stove_campfire', 'sc_bamboo_water'],
  hidden_eunpyeong_fire_station:          ['sc_dry_grass_kindling', 'sc_pine_cone_fuel', 'sc_fuel_can_fire'],
  hidden_dongdaemun_secret_workshop:      ['sc_bark_rope', 'sc_nettle_rope'],
  hidden_gangdong_river_dock:             ['sc_fishing_rod'],
};

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
   * reversed=true면 드래그한 카드가 조합의 target, 드랍 대상이 source에 해당한다.
   * @returns {{ found: boolean, combo?, isNew?: boolean, reversed?: boolean, reason?: string }}
   */
  checkCombination(srcDef, tgtDef) {
    this._ensureState();
    const gs = GameState;

    for (const combo of SECRET_COMBINATIONS) {
      if (combo.triggerOnly) continue;      // 카드 액션 전용 조합은 드래그 매칭 제외
      // 양방향 매칭 (src→target 또는 target→src)
      const matchForward  = _matchesCriteria(srcDef, combo.source) && _matchesCriteria(tgtDef, combo.target);
      const matchReverse  = _matchesCriteria(srcDef, combo.target) && _matchesCriteria(tgtDef, combo.source);
      if (!matchForward && !matchReverse) continue;
      const reversed = !matchForward;

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
          return { found: true, combo, isNew: false, reversed, reason: I18n.t('secret.cooldown') };
        }
      }

      // 추가 재료
      // 주재료가 추가 재료와 같은 아이템이면 그 1개분까지 합산해서 본다. 추가분만 세면
      // 한 스택에서 추가분을 덜어낸 뒤 주재료 몫이 남지 않아 설계보다 싸게 완성된다.
      if (combo.additionalReq) {
        for (const req of combo.additionalReq) {
          let needed = req.qty;
          if (combo.source?.id === req.id && combo.result?.consumeSrc) needed += 1;
          if (combo.target?.id === req.id && combo.result?.consumeTgt) needed += 1;
          if (gs.countOnBoard(req.id) < needed) {
            const def = GameData?.items[req.id];
            return { found: true, combo, isNew: false, reversed, reason: `${I18n.itemName(req.id, def?.name)} ×${needed} 필요` };
          }
        }
      }

      const isNew = !gs.discoveries.foundCombinations.includes(combo.id);
      return { found: true, combo, isNew, reversed };
    }

    return { found: false };
  },

  /**
   * 카드 인스턴스 상태에 걸리는 제약. checkCombination은 정의만 보므로 이미 붙어 있는
   * 개조값처럼 인스턴스에만 있는 정보는 여기서 판정한다 (interactions의 canApply와 같은 역할).
   * @returns {{ ok: boolean, reason?: string }}
   */
  checkInstances(combo, srcInst, tgtInst, reversed = false) {
    const r = combo?.result;
    if (r?.addEffect?.poisonDamage && !r.consumeTgt) {
      const target = reversed ? srcInst : tgtInst;
      const cap = BALANCE.combat.poisonCoating.rawMax;
      if ((target?._poisonDamage ?? 0) >= cap) {
        return { ok: false, reason: I18n.t('secret.poisonCapRaw', { cap }) };
      }
    }
    return { ok: true };
  },

  /**
   * 비밀 조합 실행.
   * 조합 정의의 source/target은 카드를 어느 방향으로 끌었는지와 무관하므로,
   * reversed일 때 정의 기준으로 맞춰 적용하고 소모 플래그는 다시 드래그/드랍 기준으로 돌려준다.
   * @param {boolean} reversed - checkCombination이 알려준 매칭 방향
   * @returns {{ message: string, consumeSrc, consumeTgt }} 드래그한 카드/드랍 대상 카드 기준
   */
  applyCombination(combo, srcInst, tgtInst, reversed = false) {
    this._ensureState();
    const gs = GameState;
    const r  = combo.result;

    // 이하 comboSrc/comboTgt는 조합 정의의 source/target에 대응한다
    const comboSrc = reversed ? tgtInst : srcInst;
    const comboTgt = reversed ? srcInst : tgtInst;

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
          const NoiseSystem = GameData?._noiseSystem;
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
        const cap = BALANCE.combat.poisonCoating.rawMax;
        comboTgt._poisonDamage = Math.min(cap, (comboTgt._poisonDamage ?? 0) + r.addEffect.poisonDamage);
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

    // 원본/대상 카드 변환 (wet_cloth → cloth 등)
    if (r.transformSrc && comboSrc && !r.consumeSrc) {
      comboSrc.definitionId = r.transformSrc;
    }
    if (r.transformTgt && comboTgt && !r.consumeTgt) {
      comboTgt.definitionId = r.transformTgt;
    }

    // 퀘스트 trigger_combo 타입 추적 — 최초 발견이 아니어도 매 적용마다 발화
    EventBus.emit('comboApplied', { comboId: combo.id });

    const consumeComboSrc = r.consumeSrc ?? false;
    const consumeComboTgt = r.consumeTgt ?? false;
    return {
      message: combo.discoveryMsg,
      consumeSrc: reversed ? consumeComboTgt : consumeComboSrc,
      consumeTgt: reversed ? consumeComboSrc : consumeComboTgt,
    };
  },

  /**
   * triggerOnly 조합을 카드 액션 UX에서 직접 실행.
   * 드래그 매칭을 우회하고 쿨다운/발견/적용만 처리한다.
   * @param {string} comboId - SECRET_COMBINATIONS의 id
   * @param {object} srcInst - 소스 카드 인스턴스 (필수)
   * @returns {{ ok: boolean, reason?: string, message?: string }}
   */
  triggerById(comboId, srcInst) {
    this._ensureState();
    const gs = GameState;
    const combo = SECRET_COMBINATIONS.find(c => c.id === comboId);
    if (!combo) return { ok: false, reason: '알 수 없는 조합이다.' };

    // 스킬 요구
    if (combo.requiredSkill) {
      for (const [skill, level] of Object.entries(combo.requiredSkill)) {
        if ((gs.player.skills?.[skill]?.level ?? 0) < level) {
          return { ok: false, reason: `${skill} Lv.${level} 필요` };
        }
      }
    }

    // 쿨다운
    if (combo.cooldown) {
      const lastUsed = gs.discoveries.lastCooldowns[combo.id] ?? 0;
      const remaining = combo.cooldown - (gs.time.totalTP - lastUsed);
      if (remaining > 0) return { ok: false, reason: `쿨다운 ${remaining}TP 남음` };
    }

    const result = this.applyCombination(combo, srcInst, null);
    if (result.consumeSrc && srcInst) {
      gs.removeCardInstance(srcInst.instanceId);
    }
    EventBus.emit('boardChanged', {});
    return { ok: true, message: result.message };
  },

  // ── Hint System ─────────────────────────────────────────────

  /** Unlock a hint for a specific combo */
  // silent: 일괄 동기화처럼 여러 건을 한 번에 열 때 알림 폭주를 막는다 (호출자가 묶어서 알린다).
  // @returns {boolean} 새로 열렸으면 true
  unlockHint(comboId, { silent = false } = {}) {
    this._ensureState();
    const hints = GameState.discoveries.unlockedHints;
    if (hints.includes(comboId)) return false;

    const combo = SECRET_COMBINATIONS.find(c => c.id === comboId);
    if (!combo) return false;

    GameState.discoveries.unlockedHints = [...hints, comboId];
    if (!silent) {
      EventBus.emit('notify', {
        message: I18n.t('hint.discovered'),
        type: 'info',
      });
    }
    EventBus.emit('hintUnlocked', { comboId });
    return true;
  },

  /** 도달 레벨 이하의 모든 티어를 연다. @returns {number} 새로 열린 개수 */
  _unlockTiersUpTo(tierMap, level) {
    let opened = 0;
    for (const [tier, ids] of Object.entries(tierMap)) {
      if (Number(tier) > level) continue;
      for (const id of ids) {
        if (this.unlockHint(id, { silent: true })) opened += 1;
      }
    }
    return opened;
  },

  /**
   * 현재 스킬 레벨에 맞는 힌트를 일괄 동기화.
   * 직업마다 시작 스킬 레벨이 달라(의사 medicine 4 · 엔지니어 crafting 4 · 셰프 cooking 4)
   * 레벨업 이벤트가 발생하지 않는 티어가 생긴다. 정확 일치로만 열면 그 티어는 영구히 죽는다.
   * @returns {number} 새로 열린 개수
   */
  syncSkillHints() {
    this._ensureState();
    const skills = GameState.player?.skills ?? {};
    let opened = 0;
    for (const [skillId, tierMap] of Object.entries(SKILL_HINTS)) {
      opened += this._unlockTiersUpTo(tierMap, skills[skillId]?.level ?? 0);
    }
    return opened;
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
    EventBus.on('hiddenLocationDiscovered', ({ locationId }) => {
      const hintIds = LOCATION_HINTS[locationId];
      if (!hintIds) return;
      const opened = hintIds.reduce((n, id) => n + (this.unlockHint(id, { silent: true }) ? 1 : 0), 0);
      if (opened === 0) return;
      EventBus.emit('notify', {
        message: I18n.t('hint.fromLocation'),
        type: 'info',
      });
    });

    // ── Skill Level Hints ──────────────────────────────────────
    // 도달 레벨 이하 전체를 연다 — XP가 한 번에 두 레벨을 올리면 중간 티어가 통째로 새어 나간다.
    EventBus.on('skillLevelUp', ({ skillId, newLevel, skillName }) => {
      const tierMap = SKILL_HINTS[skillId];
      if (!tierMap) return;
      if (this._unlockTiersUpTo(tierMap, newLevel) === 0) return;
      EventBus.emit('notify', {
        message: I18n.t('hint.fromSkill', { skill: skillName ?? skillId }),
        type: 'info',
      });
    });

    // ── 시작 스킬 소급 ─────────────────────────────────────────
    // 직업 시작 레벨은 레벨업 이벤트를 남기지 않는다. main 진입마다 동기화하며,
    // unlockHint가 중복을 걸러내므로 반복 호출은 무해하다 (세이브 불러오기도 함께 커버).
    EventBus.on('stateTransition', ({ to }) => {
      if (to !== 'main') return;
      const opened = this.syncSkillHints();
      if (opened === 0) return;
      EventBus.emit('notify', {
        message: I18n.t('hint.fromSkillSync', { count: opened }),
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

  /** 발견 통계 반환 { found: number, total: number } */
  getStats() {
    this._ensureState();
    return {
      found: GameState.discoveries.foundCombinations.length,
      total: GameData?.secretCombinations?.length ?? SECRET_COMBINATIONS.length,
    };
  },
};

export default SecretCombinationSystem;
