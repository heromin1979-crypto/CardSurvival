// === TRAIT SYSTEM ===
// 캐릭터 특성(trait) 쿼리 헬퍼
// 특성 데이터는 GameState.player.traits 배열에 문자열 ID로 저장
import GameState from '../core/GameState.js';

/**
 * 특성 정의 테이블
 * id → { name, description, effects: { key: value } }
 */
const TRAIT_DEFS = {
  scavenger: {
    name:        '스캐빈저',
    description: '탐색 시 아이템을 1개 추가로 발견한다.',
    effects: {
      bonusLootCount: 1,
    },
  },
  medic: {
    name:        '의무병',
    description: '의료 아이템 사용 시 회복량이 50% 증가한다.',
    effects: {
      healMultiplier: 1.5,
    },
  },
  silent: {
    name:        '침묵',
    description: '모든 소음 발생량이 40% 감소한다.',
    effects: {
      noiseMult: 0.6,
    },
  },
  // 추가 특성은 여기에 확장
};

const TraitSystem = {
  /**
   * 플레이어가 특성을 보유하고 있는지 확인
   * @param {string} traitId
   * @returns {boolean}
   */
  hasActiveTrait(traitId) {
    return GameState.player.traits.includes(traitId);
  },

  /**
   * 특정 특성의 효과 값을 반환
   * 특성이 없으면 null 반환
   * @param {string} traitId
   * @param {string} effectKey
   * @returns {*}
   */
  getTraitEffect(traitId, effectKey) {
    if (!this.hasActiveTrait(traitId)) return null;
    return TRAIT_DEFS[traitId]?.effects?.[effectKey] ?? null;
  },

  /**
   * 특성 정의 목록 반환 (UI 표시용)
   * @returns {Array<{id, name, description, owned}>}
   */
  getAllTraitDefs() {
    return Object.entries(TRAIT_DEFS).map(([id, def]) => ({
      id,
      name:        def.name,
      description: def.description,
      owned:       this.hasActiveTrait(id),
    }));
  },

  /**
   * 플레이어 보유 특성 목록 반환
   * @returns {Array<{id, name, description}>}
   */
  getPlayerTraits() {
    return GameState.player.traits
      .map(id => ({ id, ...TRAIT_DEFS[id] }))
      .filter(t => t.name);
  },
};

export default TraitSystem;
