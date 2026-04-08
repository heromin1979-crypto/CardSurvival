// === CRAFT DISCOVERY ===
// 두 카드가 만났을 때 가능한 블루프린트를 탐색하는 시스템.
// DragDrop 힌트 표시 + 퀵 크래프트 프롬프트에 사용.

import GameState       from '../core/GameState.js';
import BLUEPRINTS_BASE from '../data/blueprints.js';
import HIDDEN_RECIPES  from '../data/hiddenRecipes.js';
import I18n            from '../core/I18n.js';

const ALL_BPS = { ...BLUEPRINTS_BASE, ...HIDDEN_RECIPES };
const HIDDEN_IDS = new Set(Object.keys(HIDDEN_RECIPES));

const CraftDiscovery = {

  /**
   * 두 카드 definitionId로 가능한 레시피 목록을 반환.
   * @param {string} srcDefId - 드래그 중인 카드의 definitionId
   * @param {string} tgtDefId - 대상 카드의 definitionId
   * @returns {Array<{ blueprintId, blueprintName, outputPreview, missingItems, canStartNow }>}
   */
  findRecipes(srcDefId, tgtDefId) {
    const matches = [];

    for (const bp of Object.values(ALL_BPS)) {
      // 히든 레시피 중 해금 안 된 것은 제외
      if (HIDDEN_IDS.has(bp.id) && !this._isUnlocked(bp.id)) continue;

      // 모든 스테이지의 requiredItems를 평탄화
      const allRequired = bp.stages.flatMap(s =>
        s.requiredItems.map(r => r.definitionId)
      );

      // src와 tgt가 모두 이 레시피의 재료에 포함되는지 확인
      const srcNeeded = allRequired.includes(srcDefId);
      const tgtNeeded = allRequired.includes(tgtDefId);

      if (srcNeeded && tgtNeeded) {
        const missing = this._getMissingItems(bp, srcDefId, tgtDefId);
        const canStart = this._canStartNow(bp.id);

        matches.push({
          blueprintId:   bp.id,
          blueprintName: I18n.blueprintName(bp.id, bp.name),
          category:      bp.category,
          outputPreview: bp.output.map(o => {
            const def = window.__GAME_DATA__?.items[o.definitionId];
            return {
              definitionId: o.definitionId,
              name: I18n.itemName(o.definitionId, def?.name ?? o.definitionId),
              icon: def?.icon ?? '📦',
              qty: o.qty,
            };
          }),
          missingItems: missing,
          canStartNow:  canStart,
          totalTP:      bp.stages.reduce((sum, s) => sum + s.tpCost, 0),
        });
      }
    }

    // 즉시 제작 가능한 것을 상단으로
    return matches.sort((a, b) => (b.canStartNow ? 1 : 0) - (a.canStartNow ? 1 : 0));
  },

  /**
   * 드래그 중 힌트: 첫 번째 매칭 레시피의 출력 이름만 빠르게 반환.
   * @returns {{ hint: string, canStart: boolean } | null}
   */
  getQuickHint(srcDefId, tgtDefId) {
    const recipes = this.findRecipes(srcDefId, tgtDefId);
    if (recipes.length === 0) return null;

    const first = recipes[0];
    const outputName = first.outputPreview.map(o => `${o.icon} ${o.name}`).join(', ');
    const suffix = first.canStartNow
      ? ` (${I18n.t('craft.ready')})`
      : ` (${first.missingItems.length} ${I18n.t('craft.missing')})`;

    return {
      hint: `✨ ${outputName}${suffix}`,
      canStart: first.canStartNow,
      count: recipes.length,
    };
  },

  // ── 내부 헬퍼 ──────────────────────────────────────────────

  _getMissingItems(bp, haveId1, haveId2) {
    const gs = GameState;
    const missing = [];

    // 첫 스테이지의 필요 재료만 확인 (퀵 크래프트는 첫 스테이지 기준)
    const stage = bp.stages[0];
    for (const req of stage.requiredItems) {
      const onBoard = gs.countOnBoard(req.definitionId);
      if (onBoard < req.qty) {
        const def = window.__GAME_DATA__?.items[req.definitionId];
        missing.push({
          definitionId: req.definitionId,
          name: I18n.itemName(req.definitionId, def?.name ?? req.definitionId),
          icon: def?.icon ?? '📦',
          have: onBoard,
          need: req.qty,
        });
      }
    }

    return missing;
  },

  _canStartNow(blueprintId) {
    // CraftSystem.canStartBlueprint를 직접 쓰면 순환 의존 가능성
    // 대신 여기서 간단히 체크
    const bp = ALL_BPS[blueprintId];
    if (!bp) return false;

    const gs = GameState;

    // 큐 확인
    if (gs.crafting.activeQueue.length >= gs.crafting.maxQueueSize) return false;

    // 스킬 확인
    if (bp.requiredSkills) {
      for (const [skillId, minLevel] of Object.entries(bp.requiredSkills)) {
        if ((gs.player.skills?.[skillId]?.level ?? 0) < minLevel) return false;
      }
    }

    // 첫 스테이지 재료 확인
    const stage = bp.stages[0];
    for (const req of stage.requiredItems) {
      if (gs.countOnBoard(req.definitionId) < req.qty) return false;
    }

    // 도구 확인
    if (bp.requiredTools?.length) {
      for (const toolId of bp.requiredTools) {
        if (!gs.getBoardCards().some(c => c.definitionId === toolId)) return false;
      }
    }

    return true;
  },

  _isUnlocked(bpId) {
    return GameState.flags?.hiddenRecipesUnlocked?.includes(bpId) ?? false;
  },
};

export default CraftDiscovery;
