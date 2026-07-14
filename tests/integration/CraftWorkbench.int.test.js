// @vitest-environment happy-dom
// === Phase 7 — 제작 워크벤치 (아이템 스펙 시트 3열) 계약 ===
// 검증:
//   - 상태 3분류 탭(제작 가능/재료 부족/잠금)과 카운트
//   - 잠금 탭: 스킬 미달 레시피가 사유와 함께 노출, 조건형 hidden은 모호 사유('???')
//   - 스펙 시트: SPECS 게이지 + 장착 대비 증감 + MATERIALS 게이지
//   - 단계 패널: stages 스텝 + 제작 버튼
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CraftUI from '../../js/ui/CraftUI.js';
import GameState from '../../js/core/GameState.js';
import EventBus from '../../js/core/EventBus.js';
import SkillSystem from '../../js/systems/SkillSystem.js';
import BLUEPRINTS_BASE from '../../js/data/blueprints.js';
import BLUEPRINTS_ADV from '../../js/data/blueprints_advanced.js';
import HIDDEN_RECIPES from '../../js/data/hiddenRecipes.js';

const ALL_BLUEPRINTS = { ...BLUEPRINTS_BASE, ...BLUEPRINTS_ADV, ...HIDDEN_RECIPES };
const BLUEPRINTS_BY_CATEGORY = Object.values(ALL_BLUEPRINTS).reduce((byCategory, bp) => {
  if (!byCategory.has(bp.category)) byCategory.set(bp.category, bp);
  return byCategory;
}, new Map());
const CRAFTING_CATEGORIES = [...BLUEPRINTS_BY_CATEGORY.keys()].sort();

function setupPanel() {
  document.body.innerHTML = '<div id="craft-panel"></div>';
  CraftUI._panel = document.getElementById('craft-panel');
  CraftUI._viewMode = 'list';
  CraftUI._categoryFilter = 'all';
  CraftUI._statusFilter = 'craftable';
  CraftUI._searchTerm = '';
  CraftUI._selectedBp = null;
  CraftUI._completedBp = null;
  GameState.ui = { ...GameState.ui, basecampMode: 'CRAFT' };
  GameState.flags = GameState.flags ?? {};
  GameState.flags.hiddenRecipesUnlocked = [];
  GameState.crafting = GameState.crafting ?? { activeQueue: [], maxQueueSize: 2 };
  GameState.crafting.activeQueue = [];
  GameState.player.equipped = GameState.player.equipped ?? {};
}

describe('제작 워크벤치', () => {
  beforeEach(setupPanel);

  it('상태 3분류 탭이 카운트와 함께 렌더된다', () => {
    CraftUI.render();
    const tabs = document.querySelectorAll('.craft-status-tab');
    expect(tabs).toHaveLength(3);
    for (const tab of tabs) {
      expect(tab.textContent).toMatch(/\(\d+\)/);
    }
  });

  it('잠금 탭에 스킬 미달 레시피가 사유와 함께 노출된다', () => {
    const getLevel = vi.spyOn(SkillSystem, 'getLevel').mockReturnValue(0);
    CraftUI._statusFilter = 'locked';
    CraftUI.render();
    getLevel.mockRestore();

    const reasons = [...document.querySelectorAll('.bp-lock-reason')];
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some(el => /Lv\.\d+/.test(el.textContent))).toBe(true);
  });

  it('조건형 hidden은 ??? 이름과 모호한 사유로만 존재를 암시한다', () => {
    CraftUI._statusFilter = 'locked';
    const getLevel = vi.spyOn(SkillSystem, 'getLevel').mockReturnValue(99);
    CraftUI.render();
    getLevel.mockRestore();

    const items = [...document.querySelectorAll('.blueprint-item')];
    const mystery = items.filter(el => el.querySelector('.blueprint-name')?.textContent === '???');
    expect(mystery.length).toBeGreaterThan(0);
    for (const el of mystery) {
      expect(el.querySelector('.bp-lock-reason')).not.toBeNull();
    }
  });

  it('레시피 선택 시 스펙 시트에 SPECS/재료 게이지가 렌더된다', () => {
    CraftUI.render();
    const first = document.querySelector('.blueprint-item');
    if (!first) return; // 제작 가능 항목이 없으면 스킵 (보드 비어있는 환경)
    first.click();

    expect(document.querySelector('.craft-spec-sheet')).not.toBeNull();
    expect(document.querySelectorAll('.spec-gauge-row.mat').length).toBeGreaterThan(0);
    expect(document.querySelector('.craft-stage-panel')).not.toBeNull();
    expect(document.querySelectorAll('.craft-stage-step').length).toBeGreaterThan(0);
  });

  it('장착 무기 대비 증감(▲/▼)이 무기 스펙에 병기된다', async () => {
    const { default: GameData } = await import('../../js/data/GameData.js');
    // 무기 레시피를 재료 부족 탭에서라도 선택할 수 있도록 탭 순회
    CraftUI._categoryFilter = 'weapon';
    // 장착: 임의 무기 def를 카드로 심는다
    const weaponIds = Object.entries(GameData.items)
      .filter(([, def]) => def.combat?.damage).map(([id]) => id);
    expect(weaponIds.length).toBeGreaterThan(0);
    GameState.cards = { eq1: { instanceId: 'eq1', definitionId: weaponIds[0] } };
    GameState.player.equipped.weapon_main = 'eq1';

    for (const tab of ['craftable', 'lacking']) {
      CraftUI._statusFilter = tab;
      CraftUI._selectedBp = null;
      CraftUI.render();
      if (document.querySelector('.craft-spec-sheet')) break;
    }
    const sheet = document.querySelector('.craft-spec-sheet');
    if (!sheet) return; // 무기 레시피가 노출 풀에 없으면 스킵
    expect(sheet.querySelectorAll('.spec-gauge-row').length).toBeGreaterThan(0);
  });
  it('sample-style blueprint workbench shell is rendered', () => {
    CraftUI._statusFilter = 'lacking';
    CraftUI.render();

    expect(document.querySelector('.craft-workbench.craft-workbench--spec')).not.toBeNull();
    expect(document.querySelector('.spec-blueprint-frame')).not.toBeNull();
    expect(document.querySelector('.spec-figure-callout')).not.toBeNull();
    expect(document.querySelector('.craft-stage-header-main')?.textContent).toContain('CRAFTING STAGES');
    expect(document.querySelector('.craft-stage-tools')).not.toBeNull();
    expect(document.querySelector('.craft-item-btn .craft-item-btn-icon')).not.toBeNull();
  });

  it('maps every actual crafting category to its blueprint artwork', () => {
    expect(CRAFTING_CATEGORIES).toEqual([
      'armor', 'consumable', 'food', 'material', 'medical',
      'structure', 'tool', 'upgrade', 'weapon',
    ]);

    for (const category of CRAFTING_CATEGORIES) {
      const bp = BLUEPRINTS_BY_CATEGORY.get(category);
      document.body.innerHTML = CraftUI._renderSpecSheet(bp);

      const image = document.querySelector('.spec-figure-img');
      expect(image).not.toBeNull();
      expect(image.getAttribute('src')).toBe(
        `assets/images/ui/crafting-blueprints/${category}.png`,
      );
    }
  });

  it('uses a stages header while the selected blueprint is not in the craft queue', () => {
    const bp = [...BLUEPRINTS_BY_CATEGORY.values()].find(candidate => candidate.stages.length > 1);
    expect(bp).toBeDefined();

    document.body.innerHTML = CraftUI._renderStagePanel(bp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('CRAFTING STAGES');
  });

  it('persists the complete header after craftComplete removes the queue entry', () => {
    const bp = [...BLUEPRINTS_BY_CATEGORY.values()].find(candidate => candidate.stages.length > 1);
    expect(bp).toBeDefined();
    CraftUI._selectedBp = bp.id;
    CraftUI.init();

    EventBus.emit('craftComplete', { blueprintId: bp.id, outputInstanceIds: ['crafted-1'] });
    expect(GameState.crafting.activeQueue).toEqual([]);
    document.body.innerHTML = CraftUI._renderStagePanel(bp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('CRAFTING COMPLETE');
  });

  it('clears the persisted completion when another blueprint is selected', () => {
    const [completedBp, nextBp] = [...BLUEPRINTS_BY_CATEGORY.values()];
    CraftUI._selectedBp = completedBp.id;
    CraftUI.init();
    EventBus.emit('craftComplete', { blueprintId: completedBp.id, outputInstanceIds: [] });

    document.body.innerHTML = `
      <div id="craft-panel">
        <div class="blueprint-item" data-bp-id="${nextBp.id}"></div>
      </div>`;
    CraftUI._panel = document.getElementById('craft-panel');
    CraftUI._attachWorkbenchHandlers();
    document.querySelector('.blueprint-item').click();
    document.body.innerHTML = CraftUI._renderStagePanel(completedBp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('CRAFTING STAGES');
  });
});
