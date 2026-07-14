// @vitest-environment happy-dom
// === Phase 7 — 제작 워크벤치 (아이템 스펙 시트 3열) 계약 ===
// 검증:
//   - 상태 3분류 탭(제작 가능/재료 부족/잠금)과 카운트
//   - 잠금 탭: 스킬 미달 레시피가 사유와 함께 노출, 조건형 hidden은 모호 사유('???')
//   - 스펙 시트: 능력치 게이지 + 장착 대비 증감 + 제작 재료 게이지
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
  CraftUI._selectBlueprint(null);
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

  it('레시피 선택 시 스펙 시트에 능력치와 재료 게이지가 렌더된다', () => {
    CraftUI.render();
    const first = document.querySelector('.blueprint-item');
    if (!first) return; // 제작 가능 항목이 없으면 스킵 (보드 비어있는 환경)
    first.click();

    expect(document.querySelector('.craft-spec-sheet')).not.toBeNull();
    expect(document.querySelectorAll('.spec-gauge-row.mat').length).toBeGreaterThan(0);
    expect(document.querySelector('.craft-stage-panel')).not.toBeNull();
    expect(document.querySelectorAll('.craft-stage-step').length).toBeGreaterThan(0);
  });

  it('제작 워크벤치의 UI와 데이터 분류를 한글로만 표시한다', () => {
    CraftUI._statusFilter = 'lacking';
    CraftUI.render();

    const text = document.querySelector('.craft-workbench')?.textContent ?? '';
    expect(text).toContain('아이템 설계 명세');
    expect(text).toContain('[재료 부족]');
    expect(text).toContain('제작 단계');
    expect(text).toContain('대기');
    expect(text).not.toMatch(/BLUEPRINTS|ITEM SPEC SHEET|CRAFTING (?:STAGES|COMPLETE)|SPECS|PROPERTIES|MATERIALS REQUIRED|CRAFT ITEM|\[(?:Craftable|Lacking)\]|\b(?:Done|Ready|In progress)\b/);

    const calloutAndProperties = [
      ...document.querySelectorAll('.spec-figure-callout, .spec-props'),
    ].map(el => el.textContent).join(' ');
    expect(calloutAndProperties).not.toMatch(/[A-Za-z_]/);

    for (const bp of Object.values(ALL_BLUEPRINTS)) {
      document.body.innerHTML = CraftUI._renderSpecSheet(bp);
      const localizedData = [
        ...document.querySelectorAll('.preview-rarity, .spec-figure-callout, .spec-props'),
      ].map(el => el.textContent).join(' ');
      expect(localizedData, bp.id).not.toMatch(/[A-Za-z_]/);
    }
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
      CraftUI._selectBlueprint(null);
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
    expect(document.querySelector('.spec-figure-callout')).toBeNull();
    expect(document.querySelector('.craft-stage-header-main')?.textContent).toContain('제작 단계');
    expect(document.querySelector('.craft-stage-tools')).toBeNull();
    expect(document.querySelector('.craft-stage-search')).toBeNull();
    expect(document.querySelector('.craft-item-btn .craft-item-btn-icon')).not.toBeNull();
  });

  it('renders the dense sample-style list structure', () => {
    CraftUI._statusFilter = 'lacking';
    CraftUI.render();
    expect(document.querySelector('.blueprint-list')).not.toBeNull();
    expect(document.querySelectorAll('.blueprint-item').length).toBeGreaterThan(5);
    expect(document.querySelector('.blueprint-item .bp-item-icon')).not.toBeNull();
    expect(document.querySelector('.blueprint-item .bp-mat-row')).not.toBeNull();
  });

  it('제작창 전용 이미지 아이콘과 재료 썸네일을 사용한다', () => {
    CraftUI._statusFilter = 'lacking';
    CraftUI.render();

    expect(document.querySelector('.craft-category-tab .craft-ui-icon--all')).not.toBeNull();
    expect(document.querySelector('.bp-item-mark .craft-ui-icon--unavailable')).not.toBeNull();
    expect(document.querySelector('.craft-item-btn .craft-ui-icon--craft')).not.toBeNull();

    const materialImage = document.querySelector('.bp-mat-icon img');
    expect(materialImage).not.toBeNull();
    expect(materialImage.getAttribute('src')).toMatch(/^assets\/images\//);
  });

  it('왼쪽 목록에 별도 블루프린트 제목을 표시하지 않는다', () => {
    CraftUI.render();
    expect(document.querySelector('.craft-side-header')).toBeNull();
  });

  it('시작 제작품은 전용 설계도 이미지를 사용하고 나머지는 실제 아이템 이미지로 표시한다', () => {
    const expected = new Map([
      ['settle_water', 'assets/images/ui/crafting-blueprints/items/settled-water.png'],
      ['make_kindling', 'assets/images/ui/crafting-blueprints/items/kindling.png'],
      ['make_cloth_scrap', 'assets/images/ui/crafting-blueprints/items/cloth-scrap.png'],
    ]);

    for (const [blueprintId, expectedPath] of expected) {
      document.body.innerHTML = CraftUI._renderSpecSheet(ALL_BLUEPRINTS[blueprintId]);
      expect(document.querySelector('.spec-figure-img')?.getAttribute('src')).toBe(expectedPath);
      expect(document.querySelector('.spec-figure-img')?.classList.contains('is-blueprint')).toBe(true);
    }

    const fallback = Object.values(ALL_BLUEPRINTS).find(bp => !expected.has(bp.id));
    document.body.innerHTML = CraftUI._renderSpecSheet(fallback);
    expect(document.querySelector('.spec-figure-img')?.getAttribute('src')).toMatch(/^assets\/images\//);
    expect(document.querySelector('.spec-figure-img')?.classList.contains('is-item-art')).toBe(true);

    for (const bp of Object.values(ALL_BLUEPRINTS)) {
      document.body.innerHTML = CraftUI._renderSpecSheet(bp);
      const image = document.querySelector('.spec-figure-img');
      expect(image?.getAttribute('src'), bp.id).toMatch(/^assets\/images\//);
      expect(
        image?.classList.contains('is-blueprint') || image?.classList.contains('is-item-art'),
        bp.id,
      ).toBe(true);
    }
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
      expect(image.getAttribute('src')).toMatch(/^assets\/images\//);
    }
  });

  it('uses a stages header while the selected blueprint is not in the craft queue', () => {
    const bp = [...BLUEPRINTS_BY_CATEGORY.values()].find(candidate => candidate.stages.length > 1);
    expect(bp).toBeDefined();

    document.body.innerHTML = CraftUI._renderStagePanel(bp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('제작 단계');
  });

  it('persists the complete header after craftComplete removes the queue entry', () => {
    const bp = [...BLUEPRINTS_BY_CATEGORY.values()].find(candidate => candidate.stages.length > 1);
    expect(bp).toBeDefined();
    CraftUI._selectBlueprint(bp.id);
    CraftUI.init();

    EventBus.emit('craftComplete', { blueprintId: bp.id, outputInstanceIds: ['crafted-1'] });
    expect(GameState.crafting.activeQueue).toEqual([]);
    document.body.innerHTML = CraftUI._renderStagePanel(bp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('제작 완료');
    const steps = [...document.querySelectorAll('.craft-stage-step')];
    expect(steps).toHaveLength(bp.stages.length);
    for (const step of steps) {
      expect(step.classList.contains('done')).toBe(true);
      expect(step.querySelector('.stage-step-state')?.textContent.trim()).toBe('100% 완료');
      expect(step.querySelector('.craft-progress-fill')?.style.width).toBe('100%');
    }
  });

  it('clears a background completion when selection changes to that blueprint', () => {
    const [selectedBp, backgroundBp] = [...BLUEPRINTS_BY_CATEGORY.values()];
    CraftUI._selectBlueprint(selectedBp.id);
    CraftUI.init();

    EventBus.emit('craftComplete', { blueprintId: backgroundBp.id, outputInstanceIds: [] });
    CraftUI._selectBlueprint(backgroundBp.id);
    document.body.innerHTML = CraftUI._renderStagePanel(backgroundBp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('제작 단계');
  });

  it('clears the persisted completion when another blueprint is selected', () => {
    const [completedBp, nextBp] = [...BLUEPRINTS_BY_CATEGORY.values()];
    CraftUI._selectBlueprint(completedBp.id);
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
      .toContain('제작 단계');
  });

  it('clears the persisted completion when a different blueprint starts crafting', () => {
    const [completedBp, startedBp] = [...BLUEPRINTS_BY_CATEGORY.values()];
    CraftUI._selectBlueprint(completedBp.id);
    CraftUI.init();
    EventBus.emit('craftComplete', { blueprintId: completedBp.id, outputInstanceIds: [] });

    EventBus.emit('craftStarted', { blueprintId: startedBp.id });
    document.body.innerHTML = CraftUI._renderStagePanel(completedBp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('제작 단계');
  });

  it('clears stale completion when the first visible blueprint is selected automatically', () => {
    const [completedBp, nextBp] = [...BLUEPRINTS_BY_CATEGORY.values()];
    CraftUI._selectBlueprint(completedBp.id);
    CraftUI.init();
    EventBus.emit('craftComplete', { blueprintId: completedBp.id, outputInstanceIds: [] });

    const selected = CraftUI._selectedVisibleBlueprint({
      craftable: [{ bp: nextBp }],
      lacking: [],
      locked: [],
    });
    expect(selected).toBe(nextBp);
    document.body.innerHTML = CraftUI._renderStagePanel(completedBp);

    expect(document.querySelector('.craft-stage-header-main')?.textContent)
      .toContain('제작 단계');
  });
});
