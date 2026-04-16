// === SKILL DEFINITIONS ===
// 12개 스킬 정의 + 레벨업 XP 테이블

export const SKILL_CATEGORIES = {
  combat:   { label: '전투',  icon: '⚔️',  color: '#c05050' },
  survival: { label: '생존',  icon: '🌿', color: '#50a050' },
  crafting: { label: '제작',  icon: '🔨', color: '#7060c0' },
};

// 누적 XP 테이블: LEVEL_XP_TABLE[n] = Lv n 도달에 필요한 총 XP (× 0.65 가속)
export const LEVEL_XP_TABLE = [
  0, 7, 23, 52, 98, 163, 254, 374, 530, 728, 975,
  1281, 1651, 2093, 2613, 3218, 3913, 4706, 5603, 6611, 7735,
];

export function getLevelFromXp(xp) {
  let level = 0;
  for (let i = 0; i < LEVEL_XP_TABLE.length; i++) {
    if (xp >= LEVEL_XP_TABLE[i]) level = i;
    else break;
  }
  return Math.min(20, level);
}

export const SKILL_DEFS = {

  // ── 전투 카테고리 ─────────────────────────────────────────
  unarmed: {
    id: 'unarmed', name: '맨손격투', category: 'combat', icon: '👊',
    description: '맨손 전투 실력. 주먹과 발차기로 적을 제압하는 능력.',
    getBonuses(level) {
      return {
        dmgMult:    1.0 + (level / 20) * 0.50,   // 1.0 → 1.5
        stunChance: level >= 20 ? 0.10 : 0,
      };
    },
    masteryDesc: '맨손 공격 시 10% 확률로 적 기절.',
    xpSources:   ['명중 시 +2 XP', '크리티컬 시 +2 추가', '처치 시 +5 XP'],
  },

  melee: {
    id: 'melee', name: '근접무기', category: 'combat', icon: '🗡️',
    description: '도검·둔기 등 근접 무기 숙달. 피해량 증가 및 내구도 절약.',
    getBonuses(level) {
      return {
        dmgMult:       1.0 + (level / 20) * 0.50,  // 1.0 → 1.5
        durSaveChance: (level / 20) * 0.10,          // 0 → 10%
      };
    },
    masteryDesc: '피해량 +50%, 무기 내구도 소모 10% 절감.',
    xpSources:   ['명중 시 +2 XP', '크리티컬 시 +2 추가', '처치 시 +5 XP'],
  },

  ranged: {
    id: 'ranged', name: '원거리무기', category: 'combat', icon: '🏹',
    description: '활·화기 등 원거리 무기 운용. 명중률·치명타 상승.',
    getBonuses(level) {
      return {
        accBonus:       (level / 20) * 0.20,   // 0 → +20%p
        critBonus:      (level / 20) * 0.10,   // 0 → +10%p
        ammoSaveChance: level >= 20 ? 0.20 : 0,
      };
    },
    masteryDesc: '20% 확률로 탄약 미소모.',
    xpSources:   ['명중 시 +3 XP', '처치 시 +5 XP'],
  },

  defense: {
    id: 'defense', name: '방어술', category: 'combat', icon: '🛡️',
    description: '피해를 줄이는 방어 기술. 피격 시 반격 기회 발생.',
    getBonuses(level) {
      return {
        damageReduction: (level / 20) * 0.10,   // 0 → 10% 피해 감소
        counterChance:   level >= 20 ? 0.15 : 0,
      };
    },
    masteryDesc: '피격 시 15% 확률로 즉시 반격 (적에게 5 피해).',
    xpSources:   ['피격 시 +1 XP'],
  },

  // ── 생존 카테고리 ─────────────────────────────────────────
  scavenging: {
    id: 'scavenging', name: '탐색', category: 'survival', icon: '🔍',
    description: '폐허에서 자원을 찾는 능력. 루팅 보너스 및 희귀 아이템 확률.',
    getBonuses(level) {
      return {
        extraLootChance: (level / 20) * 0.30,  // 0 → 30% 추가 루팅 확률
        rareLootChance:  level >= 20 ? 0.05 : 0,
      };
    },
    masteryDesc: '탐색마다 5% 확률로 희귀 아이템 추가 발견.',
    xpSources:   ['아이템 발견당 +2 XP', '세부장소 탐색 완료 +3 XP'],
  },

  medicine: {
    id: 'medicine', name: '의료', category: 'survival', icon: '💊',
    description: '의료 아이템 활용 능력. 치료량 증가 및 감염 치료율 향상.',
    getBonuses(level) {
      return {
        healMult:           1.0 + (level / 20) * 0.50,  // 1.0 → 1.5
        infectionCureBonus: (level / 20) * 0.20,          // 0 → +20%
        poisonResist:       level >= 15 ? 0.5 : 0,       // Lv15 오염 피해 50% 감소
        poisonImmune:       level >= 20,                  // Lv20 완전 면역
      };
    },
    masteryDesc: 'Lv15 오염 피해 -50% · Lv20 오염 피해 면역 · 의료 아이템 효과 +50%.',
    xpSources:   ['의료 아이템 사용 +3 XP'],
  },

  cooking: {
    id: 'cooking', name: '요리', category: 'survival', icon: '🍳',
    description: '식재료를 조리하는 능력. 음식 효과 배율 증가.',
    getBonuses(level) {
      return {
        foodEffectMult: 1.0 + (level / 20) * 0.50,  // 1.0 → 1.5
        toxinRemove:    level >= 20,
      };
    },
    masteryDesc: '직접 제작한 음식의 독성 제거. 음식 효과 +50%.',
    xpSources:   ['음식 제작 완료 +5 XP', '제작 음식 섭취 +2 XP'],
  },

  harvesting: {
    id: 'harvesting', name: '자원채취', category: 'survival', icon: '⛏️',
    description: '아이템 분해 실력. 더 많은 재료를 회수한다.',
    getBonuses(level) {
      return {
        extraMaterialChance: (level / 20) * 0.50,  // 0 → 50%
        doubleMaterial:      level >= 20,
      };
    },
    masteryDesc: '분해 시 모든 재료 2배 획득.',
    xpSources:   ['아이템 분해 완료 +3 XP'],
  },

  // ── 제작 카테고리 ─────────────────────────────────────────
  crafting: {
    id: 'crafting', name: '기초제작', category: 'crafting', icon: '🔧',
    description: '기본 제작 숙달. 재료 절약 확률과 제작 효율 향상.',
    getBonuses(level) {
      return {
        saveChance: (level / 20) * 0.20,  // 0 → 20% 재료 절약
        noFail:     level >= 20,
      };
    },
    masteryDesc: '제작 재료 20% 절약. 제작 항상 성공.',
    xpSources:   ['기초·재료·의료 제작 완료 +5 XP'],
  },

  weaponcraft: {
    id: 'weaponcraft', name: '무기제작', category: 'crafting', icon: '⚒️',
    description: '무기 제작 숙달. 완성 무기의 내구도 보너스.',
    getBonuses(level) {
      return {
        weaponDurBonus: (level / 20) * 0.50,  // 0 → +50% 내구도
        specialEffect:  level >= 20,
      };
    },
    masteryDesc: '제작 무기에 공격력 +10% 특수 속성 부여.',
    xpSources:   ['무기 제작 완료 +8 XP'],
  },

  armorcraft: {
    id: 'armorcraft', name: '방어구제작', category: 'crafting', icon: '🪖',
    description: '방어구 제작 숙달. 완성 방어구 성능 향상.',
    getBonuses(level) {
      return {
        armorDefBonus: (level / 20) * 0.30,  // 0 → +30%
        lightweight:   level >= 20,
      };
    },
    masteryDesc: '제작 방어구 무게 30% 감소.',
    xpSources:   ['방어구 제작 완료 +8 XP'],
  },

  building: {
    id: 'building', name: '건설', category: 'crafting', icon: '🏗️',
    description: '구조물 건설 능력. 건설한 구조물의 효과와 내구도 증가.',
    getBonuses(level) {
      return {
        structureEffectBonus: (level / 20) * 0.50,  // 0 → +50%
        structureLifeDouble:  level >= 20,
      };
    },
    masteryDesc: '구조물 효과 +50%, 내구도 2배.',
    xpSources:   ['구조물 건설 완료 +10 XP'],
  },

  fishing: {
    id: 'fishing', name: '낚시', category: 'survival', icon: '🎣',
    description: '강과 호수에서 물고기를 잡는 능력. 숙련될수록 더 많은 물고기를 잡는다.',
    getBonuses(level) {
      return {
        catchChance:    0.30 + (level / 20) * 0.40,
        rareFishChance: (level / 20) * 0.15,
        catchQtyBonus:  Math.floor(level / 7),
      };
    },
    masteryDesc: '희귀 물고기(메기·잉어왕) 15% 확률. 최대 3마리 동시 획득.',
    xpSources:   ['낚시 시도마다 +3 XP', '희귀어 획득 +10 XP', '통발 자동 수확 +1 XP'],
  },
};

// 스킬 기본값 (GameState 초기화 및 구버전 호환용)
export const DEFAULT_SKILLS = Object.fromEntries(
  Object.keys(SKILL_DEFS).map(id => [id, { xp: 0, level: 0 }])
);
