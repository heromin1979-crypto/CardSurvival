// === SKILL MODAL ===
// 숙련도 패널 UI — 3탭 (전투/생존/제작)
import SkillSystem from '../systems/SkillSystem.js';
import EventBus   from '../core/EventBus.js';
import I18n       from '../core/I18n.js';
import { SKILL_CATEGORIES } from '../data/skillDefs.js';

const SkillModal = {
  _el:      null,
  _box:     null,
  _tab:     'combat',

  init() {
    this._el  = document.getElementById('skill-modal');
    this._box = this._el?.querySelector('.skill-modal-box');
    if (!this._el) return;

    // 오버레이 클릭 시 닫기
    this._el.addEventListener('click', e => {
      if (e.target === this._el) this.close();
    });

    // 레벨업 시 열려있으면 재렌더링
    EventBus.on('skillLevelUp', () => {
      if (this._el?.classList.contains('open')) this.render();
    });

    // 언어 변경 시 열려있으면 재렌더링
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('open')) this.render();
    });
  },

  open() {
    if (!this._el) return;
    this._el.classList.add('open');
    this.render();
  },

  close() {
    this._el?.classList.remove('open');
  },

  render() {
    if (!this._box) return;
    const allData = SkillSystem.getAllSkillData();

    const tabsHtml = Object.entries(SKILL_CATEGORIES).map(([catId, cat]) => `
      <button class="skill-tab-btn${this._tab === catId ? ' active' : ''}" data-cat="${catId}">
        ${cat.icon} ${cat.label}
      </button>
    `).join('');

    const skills = allData.filter(s => s.def.category === this._tab);
    const skillsHtml = skills.map(s => this._buildSkillCard(s)).join('');

    this._box.innerHTML = `
      <div class="skill-modal-header">
        <span class="skill-modal-title">${I18n.t('skill.title')}</span>
        <button class="skill-close-btn" id="skill-close-btn">${I18n.t('skill.close')}</button>
      </div>
      <div class="skill-tab-nav">${tabsHtml}</div>
      <div class="skill-list">${skillsHtml}</div>
    `;

    // 탭 버튼 이벤트
    this._box.querySelectorAll('.skill-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._tab = btn.dataset.cat;
        this.render();
      });
    });

    // 닫기 버튼
    this._box.querySelector('#skill-close-btn')?.addEventListener('click', () => this.close());
  },

  _buildSkillCard({ id, def, skill, progress }) {
    const level      = skill.level;
    const isMastery  = level >= 20;
    const levelClass = isMastery ? 'mastery' : level >= 10 ? 'high' : level >= 5 ? 'mid' : '';
    const pctInt     = Math.round(progress.pct * 100);

    const xpText = isMastery
      ? I18n.t('skill.maxLevel')
      : I18n.t('skill.xpProgress', { current: progress.current, required: progress.required });

    const bonusLines = this._buildBonusLines(def, level);
    const masteryHtml = isMastery
      ? `<div class="skill-mastery-badge">${I18n.t('skill.mastery', { desc: def.masteryDesc })}</div>`
      : (level >= 15
        ? `<div class="skill-mastery-hint">${I18n.t('skill.masteryHint', { remain: 20 - level, desc: def.masteryDesc })}</div>`
        : '');
    const xpSourcesHtml = this._buildXpSources(def);

    return `
      <div class="skill-card">
        <div class="skill-card-header">
          <span class="skill-icon">${def.icon}</span>
          <span class="skill-name">${def.name}</span>
          <span class="skill-level-badge ${levelClass}">Lv.${level}</span>
        </div>
        <div class="skill-desc">${def.description}</div>
        <div class="skill-xp-bar-wrap">
          <div class="skill-xp-bar">
            <div class="skill-xp-fill ${levelClass}" style="width:${pctInt}%"></div>
          </div>
          <span class="skill-xp-text">${xpText}</span>
        </div>
        ${bonusLines}
        ${xpSourcesHtml}
        ${masteryHtml}
      </div>
    `;
  },

  _buildXpSources(def) {
    const sources = def.xpSources;
    if (!sources?.length) return '';
    return `<div class="skill-xp-sources"><span class="skill-xp-sources-label">${I18n.t('skill.xpSources')}</span> ${sources.map(s => `<span class="skill-xp-source-tag">${s}</span>`).join('')}</div>`;
  },

  _buildBonusLines(def, level) {
    if (level === 0) {
      return `<div class="skill-bonus-zero">${I18n.t('skill.unskilled')}</div>`;
    }
    const b = def.getBonuses(level);
    const lines = [];

    // 스킬별 보너스 설명 생성
    const pct  = v => `+${Math.round(v * 100)}%`;
    const mult = v => `×${v.toFixed(2)}`;

    if (b.dmgMult    !== undefined) lines.push(I18n.t('skill.dmgMult', { val: mult(b.dmgMult) }));
    if (b.durSaveChance)            lines.push(I18n.t('skill.durSave', { val: pct(b.durSaveChance) }));
    if (b.accBonus)                 lines.push(I18n.t('skill.accBonus', { val: pct(b.accBonus) }));
    if (b.critBonus)                lines.push(I18n.t('skill.critBonus', { val: pct(b.critBonus) }));
    if (b.damageReduction)          lines.push(I18n.t('skill.dmgReduce', { val: pct(b.damageReduction) }));
    if (b.extraLootChance)          lines.push(I18n.t('skill.extraLoot', { val: pct(b.extraLootChance) }));
    if (b.healMult    !== undefined && b.healMult !== 1) lines.push(I18n.t('skill.healMult', { val: mult(b.healMult) }));
    if (b.foodEffectMult !== undefined && b.foodEffectMult !== 1) lines.push(I18n.t('skill.foodEffect', { val: mult(b.foodEffectMult) }));
    if (b.extraMaterialChance)      lines.push(I18n.t('skill.extraMat', { val: pct(b.extraMaterialChance) }));
    if (b.saveChance)               lines.push(I18n.t('skill.saveMat', { val: pct(b.saveChance) }));
    if (b.weaponDurBonus)           lines.push(I18n.t('skill.weaponDur', { val: pct(b.weaponDurBonus) }));
    if (b.armorDefBonus)            lines.push(I18n.t('skill.armorDef', { val: pct(b.armorDefBonus) }));
    if (b.structureEffectBonus)     lines.push(I18n.t('skill.structEffect', { val: pct(b.structureEffectBonus) }));

    return lines.length
      ? `<div class="skill-bonus-list">${lines.map(l => `<span class="skill-bonus-tag">${l}</span>`).join('')}</div>`
      : '';
  },
};

export default SkillModal;
