// === CARD INTERACTION RULES ===
// 카드를 다른 카드 위에 드랍할 때 발생하는 상호작용 규칙 테이블.
//
// 각 규칙 구조:
//   id       - 고유 식별자
//   source   - { id?, type?, tag? } — 드래그 중인 카드 조건
//   target   - { id?, type?, tag? } — 드랍 대상 카드 조건
//   hint     - 드래그 중 보여줄 상호작용 설명 (한 줄)
//   canApply(srcInst, tgtInst) → { ok, reason }
//   apply(srcInst, tgtInst, gs) → { message, consumeSrc, consumeTgt, noise }

const INTERACTION_RULES = [

  // ════════════════════════════════════════════════════════
  // 카드 변환 규칙 (transformSrc / transformTgt)
  // 기존 generic 규칙보다 앞에 위치해 우선 매칭됨
  // ════════════════════════════════════════════════════════

  // ── T1. 라면 + 캠프파이어 → 조리된 라면 ─────────────────
  {
    id: 'cook_noodles',
    source: { id: 'instant_noodles' },
    target: { id: 'campfire' },
    hint: '라면 조리 → 조리된 라면으로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '라면을 조리했다! 따뜻한 한 끼가 완성됐다.',
        transformSrc: 'cooked_noodles',
        consumeSrc: false, consumeTgt: false, noise: 2,
      };
    },
  },

  // ── T2. 캠프파이어 + 라면 (역방향) ──────────────────────
  {
    id: 'cook_noodles_rev',
    source: { id: 'campfire' },
    target: { id: 'instant_noodles' },
    hint: '라면 조리 → 조리된 라면으로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '라면을 조리했다! 따뜻한 한 끼가 완성됐다.',
        transformTgt: 'cooked_noodles',
        consumeSrc: false, consumeTgt: false, noise: 2,
      };
    },
  },

  // ── T3. 쌀 + 캠프파이어 → 밥 ──────────────────────────
  {
    id: 'cook_rice_transform',
    source: { id: 'rice' },
    target: { id: 'campfire' },
    hint: '쌀 조리 → 밥으로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '밥을 지었다! 따뜻하고 든든한 밥이 완성됐다.',
        transformSrc: 'cooked_rice',
        consumeSrc: false, consumeTgt: false, noise: 2,
      };
    },
  },

  // ── T4. 캠프파이어 + 쌀 (역방향) ───────────────────────
  {
    id: 'cook_rice_rev',
    source: { id: 'campfire' },
    target: { id: 'rice' },
    hint: '쌀 조리 → 밥으로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '밥을 지었다! 따뜻하고 든든한 밥이 완성됐다.',
        transformTgt: 'cooked_rice',
        consumeSrc: false, consumeTgt: false, noise: 2,
      };
    },
  },

  // ── T5. 오염수 + 캠프파이어 → 끓인 물 (카드 변환) ───────
  {
    id: 'boil_contaminated',
    source: { id: 'contaminated_water' },
    target: { id: 'campfire' },
    hint: '오염수 끓이기 → 끓인 물로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '오염수를 끓였다. 끓인 물로 변환됐다.',
        transformSrc: 'boiled_water',
        consumeSrc: false, consumeTgt: false, noise: 1,
      };
    },
  },

  // ── T6. 캠프파이어 + 오염수 (역방향) ────────────────────
  {
    id: 'boil_contaminated_rev',
    source: { id: 'campfire' },
    target: { id: 'contaminated_water' },
    hint: '오염수 끓이기 → 끓인 물로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '오염수를 끓였다. 끓인 물로 변환됐다.',
        transformTgt: 'boiled_water',
        consumeSrc: false, consumeTgt: false, noise: 1,
      };
    },
  },

  // ── T7. 빗물 + 캠프파이어 → 끓인 물 ────────────────────
  {
    id: 'boil_rainwater',
    source: { id: 'rainwater' },
    target: { id: 'campfire' },
    hint: '빗물 끓이기 → 끓인 물로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '빗물을 끓였다. 끓인 물로 변환됐다.',
        transformSrc: 'boiled_water',
        consumeSrc: false, consumeTgt: false, noise: 1,
      };
    },
  },

  // ── T8. 캠프파이어 + 빗물 (역방향) ─────────────────────
  {
    id: 'boil_rainwater_rev',
    source: { id: 'campfire' },
    target: { id: 'rainwater' },
    hint: '빗물 끓이기 → 끓인 물로 변환',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '빗물을 끓였다. 끓인 물로 변환됐다.',
        transformTgt: 'boiled_water',
        consumeSrc: false, consumeTgt: false, noise: 1,
      };
    },
  },

  // ── T9. 오염수 + 숯 필터 → 정수된 물 ───────────────────
  {
    id: 'filter_contaminated',
    source: { id: 'contaminated_water' },
    target: { id: 'charcoal_filter' },
    hint: '숯 필터로 오염수 정수 → 정수된 물',
    canApply(srcInst, tgtInst) {
      if ((tgtInst.durability ?? 100) <= 0) return { ok: false, reason: '필터가 다 닳았다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.durability = Math.max(0, (tgtInst.durability ?? 100) - 25);
      const consumeTgt = tgtInst.durability <= 0;
      return {
        message: consumeTgt ? '오염수를 정수했다. 정수된 물 완성. (필터 소진)' : '오염수를 정수했다. 정수된 물 완성.',
        transformSrc: 'purified_water',
        consumeSrc: false, consumeTgt,
      };
    },
  },

  // ── T10. 숯 필터 + 오염수 (역방향) ─────────────────────
  {
    id: 'filter_contaminated_rev',
    source: { id: 'charcoal_filter' },
    target: { id: 'contaminated_water' },
    hint: '숯 필터로 오염수 정수 → 정수된 물',
    canApply(srcInst, tgtInst) {
      if ((srcInst.durability ?? 100) <= 0) return { ok: false, reason: '필터가 다 닳았다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      srcInst.durability = Math.max(0, (srcInst.durability ?? 100) - 25);
      const consumeSrc = srcInst.durability <= 0;
      return {
        message: consumeSrc ? '오염수를 정수했다. 정수된 물 완성. (필터 소진)' : '오염수를 정수했다. 정수된 물 완성.',
        transformTgt: 'purified_water',
        consumeSrc, consumeTgt: false,
      };
    },
  },

  // ── T11. 빗물 + 숯 필터 → 정수된 물 ────────────────────
  {
    id: 'filter_rainwater',
    source: { id: 'rainwater' },
    target: { id: 'charcoal_filter' },
    hint: '숯 필터로 빗물 정수 → 정수된 물',
    canApply(srcInst, tgtInst) {
      if ((tgtInst.durability ?? 100) <= 0) return { ok: false, reason: '필터가 다 닳았다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.durability = Math.max(0, (tgtInst.durability ?? 100) - 25);
      const consumeTgt = tgtInst.durability <= 0;
      return {
        message: consumeTgt ? '빗물을 정수했다. 정수된 물 완성. (필터 소진)' : '빗물을 정수했다. 정수된 물 완성.',
        transformSrc: 'purified_water',
        consumeSrc: false, consumeTgt,
      };
    },
  },

  // ── T12. 숯 필터 + 빗물 (역방향) ────────────────────────
  {
    id: 'filter_rainwater_rev',
    source: { id: 'charcoal_filter' },
    target: { id: 'rainwater' },
    hint: '숯 필터로 빗물 정수 → 정수된 물',
    canApply(srcInst, tgtInst) {
      if ((srcInst.durability ?? 100) <= 0) return { ok: false, reason: '필터가 다 닳았다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      srcInst.durability = Math.max(0, (srcInst.durability ?? 100) - 25);
      const consumeSrc = srcInst.durability <= 0;
      return {
        message: consumeSrc ? '빗물을 정수했다. 정수된 물 완성. (필터 소진)' : '빗물을 정수했다. 정수된 물 완성.',
        transformTgt: 'purified_water',
        consumeSrc, consumeTgt: false,
      };
    },
  },

  // ── T13. 빈병 + 오염수 → 빈병이 오염수로 채워짐 ─────────
  {
    id: 'fill_bottle_contaminated',
    source: { id: 'empty_bottle' },
    target: { id: 'contaminated_water' },
    hint: '빈 병에 오염수 담기 (빈병 → 오염수)',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '빈 병에 오염수를 담았다. 정화 후 음용 가능.',
        transformSrc: 'contaminated_water',
        consumeSrc: false, consumeTgt: false,
      };
    },
  },

  // ── T14. 오염수 + 빈병 (역방향) ─────────────────────────
  {
    id: 'fill_bottle_contaminated_rev',
    source: { id: 'contaminated_water' },
    target: { id: 'empty_bottle' },
    hint: '빈 병에 오염수 채우기',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '빈 병에 오염수를 담았다. 정화 후 음용 가능.',
        transformTgt: 'contaminated_water',
        consumeSrc: false, consumeTgt: false,
      };
    },
  },

  // ── T15. 빈병 + 빗물 → 빈병이 빗물로 채워짐 ─────────────
  {
    id: 'fill_bottle_rain',
    source: { id: 'empty_bottle' },
    target: { id: 'rainwater' },
    hint: '빈 병에 빗물 담기 (빈병 → 빗물)',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '빈 병에 빗물을 담았다.',
        transformSrc: 'rainwater',
        consumeSrc: false, consumeTgt: false,
      };
    },
  },

  // ── T16. 빗물 + 빈병 (역방향) ───────────────────────────
  {
    id: 'fill_bottle_rain_rev',
    source: { id: 'rainwater' },
    target: { id: 'empty_bottle' },
    hint: '빈 병에 빗물 채우기',
    canApply(srcInst, tgtInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      return {
        message: '빈 병에 빗물을 담았다.',
        transformTgt: 'rainwater',
        consumeSrc: false, consumeTgt: false,
      };
    },
  },

  // ════════════════════════════════════════════════════════
  // 기존 generic 규칙 (위 특수 규칙이 매칭되지 않은 경우 적용)
  // ════════════════════════════════════════════════════════

  // ── 1. 정수기 → 오염수 정수 ─────────────────────────────
  {
    id: 'purify_with_purifier',
    source: { id: 'water_purifier' },
    target: { tag: 'drinkable' },
    hint: '정수기로 오염수 정화',
    canApply(srcInst, tgtInst) {
      if (tgtInst.contamination <= 0) return { ok: false, reason: '이미 깨끗한 물이다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.contamination = 0;
      return { message: '정수기로 오염수를 완전히 정화했다.', consumeSrc: false, consumeTgt: false };
    },
  },

  // ── 2. 오염수 → 정수기 (역방향) ─────────────────────────
  {
    id: 'purify_with_purifier_rev',
    source: { tag: 'drinkable' },
    target: { id: 'water_purifier' },
    hint: '정수기에 넣어 정화',
    canApply(srcInst, tgtInst) {
      if (srcInst.contamination <= 0) return { ok: false, reason: '이미 깨끗한 물이다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      srcInst.contamination = 0;
      return { message: '정수기로 오염수를 완전히 정화했다.', consumeSrc: false, consumeTgt: false };
    },
  },

  // ── 3. 캠프파이어 → 음식 가열 ───────────────────────────
  {
    id: 'cook_food',
    source: { id: 'campfire' },
    target: { tag: 'edible' },
    hint: '캠프파이어에서 음식 가열',
    canApply(srcInst, tgtInst) {
      if (tgtInst.contamination <= 0) return { ok: false, reason: '이미 깨끗한 음식이다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.contamination = Math.max(0, tgtInst.contamination - 50);
      return { message: '음식을 가열했다. 오염도 감소.', consumeSrc: false, consumeTgt: false, noise: 2 };
    },
  },

  // ── 4. 음식 → 캠프파이어 (역방향) ──────────────────────
  {
    id: 'cook_food_rev',
    source: { tag: 'edible' },
    target: { id: 'campfire' },
    hint: '캠프파이어에 올려 가열',
    canApply(srcInst, tgtInst) {
      if (srcInst.contamination <= 0) return { ok: false, reason: '이미 깨끗한 음식이다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      srcInst.contamination = Math.max(0, srcInst.contamination - 50);
      return { message: '음식을 가열했다. 오염도 감소.', consumeSrc: false, consumeTgt: false, noise: 2 };
    },
  },

  // ── 5. 캠프파이어 → 물 끓이기 ───────────────────────────
  {
    id: 'boil_water',
    source: { id: 'campfire' },
    target: { tag: 'drinkable' },
    hint: '캠프파이어에서 물 끓이기',
    canApply(srcInst, tgtInst) {
      if (tgtInst.contamination <= 0) return { ok: false, reason: '이미 깨끗한 물이다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.contamination = Math.max(0, tgtInst.contamination - 40);
      return { message: '물을 끓여 오염도를 낮췄다.', consumeSrc: false, consumeTgt: false, noise: 1 };
    },
  },

  // ── 6. 물 → 캠프파이어 (역방향) ────────────────────────
  {
    id: 'boil_water_rev',
    source: { tag: 'drinkable' },
    target: { id: 'campfire' },
    hint: '캠프파이어에서 물 끓이기',
    canApply(srcInst, tgtInst) {
      if (srcInst.contamination <= 0) return { ok: false, reason: '이미 깨끗한 물이다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      srcInst.contamination = Math.max(0, srcInst.contamination - 40);
      return { message: '물을 끓여 오염도를 낮췄다.', consumeSrc: false, consumeTgt: false, noise: 1 };
    },
  },

  // ── 7. 붕대 → 오염된 무기 세정 ─────────────────────────
  {
    id: 'clean_weapon',
    source: { id: 'bandage' },
    target: { type: 'weapon' },
    hint: '붕대로 무기 혈흔/오염 제거',
    canApply(srcInst, tgtInst) {
      if (tgtInst.contamination <= 0) return { ok: false, reason: '무기에 오염이 없다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.contamination = 0;
      srcInst.durability = Math.max(0, (srcInst.durability ?? 100) - 30);
      const consumeSrc = srcInst.durability <= 0;
      return {
        message: '붕대로 무기의 오염을 제거했다.',
        consumeSrc,
        consumeTgt: false,
      };
    },
  },

  // ── 8. 덕테이프 → 도구 수리 ────────────────────────────
  {
    id: 'repair_tool',
    source: { id: 'duct_tape' },
    target: { type: 'tool' },
    hint: '덕테이프로 도구 수리 (+30 내구도)',
    canApply(srcInst, tgtInst) {
      if ((tgtInst.durability ?? 100) >= 100) return { ok: false, reason: '이미 최대 내구도다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.durability = Math.min(100, (tgtInst.durability ?? 100) + 30);
      srcInst.quantity = Math.max(0, (srcInst.quantity ?? 1) - 1);
      const consumeSrc = srcInst.quantity <= 0;
      return { message: '덕테이프로 도구를 수리했다.', consumeSrc, consumeTgt: false };
    },
  },

  // ── 9. 덕테이프 → 무기 수리 ────────────────────────────
  {
    id: 'repair_weapon',
    source: { id: 'duct_tape' },
    target: { type: 'weapon' },
    hint: '덕테이프로 무기 수리 (+25 내구도)',
    canApply(srcInst, tgtInst) {
      if ((tgtInst.durability ?? 100) >= 100) return { ok: false, reason: '이미 최대 내구도다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst) {
      tgtInst.durability = Math.min(100, (tgtInst.durability ?? 100) + 25);
      srcInst.quantity = Math.max(0, (srcInst.quantity ?? 1) - 1);
      const consumeSrc = srcInst.quantity <= 0;
      return { message: '덕테이프로 무기를 수리했다.', consumeSrc, consumeTgt: false };
    },
  },

  // ── 10. 파이프렌치 → 근접무기 강화 ─────────────────────
  {
    id: 'reinforce_melee',
    source: { id: 'pipe_wrench' },
    target: { tag: 'melee' },
    hint: '파이프렌치로 근접무기 강화',
    canApply(srcInst, tgtInst) {
      if (tgtInst.reinforced) return { ok: false, reason: '이미 강화된 무기다.' };
      if ((tgtInst.durability ?? 100) < 30) return { ok: false, reason: '내구도가 너무 낮아 강화 불가.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst, gs) {
      tgtInst.reinforced = true;
      // 강화: 현재 내구도 -20, 하지만 전투 데미지 보정 플래그 설정
      tgtInst.damageBonus = (tgtInst.damageBonus ?? 0) + 5;
      tgtInst.durability  = Math.max(10, (tgtInst.durability ?? 100) - 20);
      srcInst.durability  = Math.max(0, (srcInst.durability ?? 80) - 15);
      return {
        message: '파이프렌치로 무기를 강화했다. 데미지 +5.',
        consumeSrc: false,
        consumeTgt: false,
        noise: 4,
      };
    },
  },
];

// 두 카드 정의로 매칭되는 규칙 탐색
function findInteraction(srcDef, tgtDef) {
  return INTERACTION_RULES.find(rule =>
    _matchesCriteria(srcDef, rule.source) &&
    _matchesCriteria(tgtDef, rule.target)
  ) ?? null;
}

function _matchesCriteria(def, criteria) {
  if (!def || !criteria) return false;
  if (criteria.id   && def.id   !== criteria.id)           return false;
  if (criteria.type && def.type !== criteria.type)         return false;
  if (criteria.tag  && !def.tags?.includes(criteria.tag)) return false;
  return true;
}

export { INTERACTION_RULES, findInteraction };
