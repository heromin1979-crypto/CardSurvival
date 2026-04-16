// === SKILL SYSTEM ===
// XP 획득, 레벨업 처리, 스킬 보너스 쿼리 헬퍼
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import { SKILL_DEFS, LEVEL_XP_TABLE, getLevelFromXp, DEFAULT_SKILLS } from '../data/skillDefs.js';
import NPCS      from '../data/npcs.js';
import { CHARACTERS } from '../data/characters.js';

const SkillSystem = {

  init() {
    // XP 훅은 각 시스템이 gainXp()를 직접 호출 — 별도 이벤트 구독 없음
  },

  /**
   * 스킬 XP 획득. 레벨업 시 알림 발화.
   * @param {string} skillId
   * @param {number} amount 획득 XP (양수)
   */
  gainXp(skillId, amount) {
    if (amount <= 0) return;
    const gs = GameState;
    if (!gs.player.skills) return;
    const skill = gs.player.skills[skillId];
    if (!skill) return;

    // 동행 NPC 스킬 보너스 적용 (XP 배율)
    const npcMult   = 1 + this.getNpcSkillBonus(skillId);
    // 직업별 특화 스킬 50% 추가 XP
    const charDef   = CHARACTERS.find(c => c.id === gs.player.characterId);
    const specMult  = charDef?.specialtySkills?.includes(skillId) ? 1.5 : 1.0;
    const prevLevel = skill.level;
    skill.xp       += Math.round(amount * npcMult * specMult);

    const newLevel = getLevelFromXp(skill.xp);
    if (newLevel > prevLevel) {
      skill.level = Math.min(20, newLevel);
      const def       = SKILL_DEFS[skillId];
      const isMastery = skill.level === 20;
      EventBus.emit('skillLevelUp', { skillId, newLevel: skill.level, skillName: def?.name ?? skillId });
      EventBus.emit('notify', {
        message: `📊 [${def?.name ?? skillId}] Lv.${skill.level} 달성!${isMastery ? ' 🌟 마스터리!' : ''}`,
        type: 'good',
      });
    } else {
      skill.level = newLevel;
    }
  },

  /**
   * 특정 스킬 보너스 값 반환.
   * @param {string} skillId
   * @param {string} bonusKey
   * @returns {number|boolean}
   */
  getBonus(skillId, bonusKey) {
    const gs    = GameState;
    const skill = gs.player.skills?.[skillId];
    if (!skill) return 0;
    const def = SKILL_DEFS[skillId];
    if (!def) return 0;
    const bonuses = def.getBonuses(skill.level);
    const val = bonuses[bonusKey];
    return val ?? 0;
  },

  /** 현재 레벨 반환 */
  getLevel(skillId) {
    return GameState.player.skills?.[skillId]?.level ?? 0;
  },

  /** 마스터리(Lv20) 달성 여부 */
  hasMastery(skillId) {
    return this.getLevel(skillId) >= 20;
  },

  /**
   * XP 진행도 반환 (UI용)
   * @returns {{ current, required, pct, level }}
   */
  getXpProgress(skillId) {
    const skill = GameState.player.skills?.[skillId] ?? { xp: 0, level: 0 };
    const level = skill.level;
    if (level >= 20) {
      return { current: skill.xp, required: LEVEL_XP_TABLE[20], pct: 1, level };
    }
    const reqCurrent = LEVEL_XP_TABLE[level]     ?? 0;
    const reqNext    = LEVEL_XP_TABLE[level + 1] ?? LEVEL_XP_TABLE[20];
    const progress   = skill.xp - reqCurrent;
    const range      = reqNext - reqCurrent;
    return {
      current:  progress,
      required: range,
      pct:      range > 0 ? Math.min(1, progress / range) : 1,
      level,
    };
  },

  /**
   * 전체 스킬 데이터 반환 (SkillModal 렌더링용)
   */
  getAllSkillData() {
    return Object.entries(SKILL_DEFS).map(([id, def]) => {
      const skill    = GameState.player.skills?.[id] ?? { xp: 0, level: 0 };
      const progress = this.getXpProgress(id);
      const bonuses  = def.getBonuses(skill.level);
      return { id, def, skill, progress, bonuses };
    });
  },

  /**
   * 동행 NPC의 스킬 XP 보너스 합산 반환 (배율 덧셈 방식)
   * 예: nurse(medicine+0.3) + engineer(crafting+0.3) 동행 시
   *     getNpcSkillBonus('medicine') → 0.3
   * @param {string} skillId
   * @returns {number} 총 보너스 (0.0 ~ n.n)
   */
  getNpcSkillBonus(skillId) {
    let bonus = 0;
    for (const npcId of (GameState.companions ?? [])) {
      const sb = NPCS[npcId]?.companion?.skillBonus;
      if (sb?.[skillId]) bonus += sb[skillId];
    }
    return bonus;
  },

  /** 구버전 세이브에서 skills 필드 보완 */
  ensureSkillsInit() {
    const gs = GameState;
    if (!gs.player.skills) {
      gs.player.skills = { ...DEFAULT_SKILLS };
    } else {
      for (const id of Object.keys(DEFAULT_SKILLS)) {
        if (!gs.player.skills[id]) {
          gs.player.skills[id] = { xp: 0, level: 0 };
        }
      }
    }
  },
};

export default SkillSystem;
