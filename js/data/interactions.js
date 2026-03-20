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
  // 확장 상호작용 규칙 (43종 × 양방향)
  // id 매칭 → type/tag 매칭 순서로 배치
  // ════════════════════════════════════════════════════════

  // ── A. 재료 가공 (8종) ──────────────────────────────────

  // A1. 목재 + 캠프파이어 → 숯 ×2
  { id: 'wood_to_charcoal', source: { id: 'wood' }, target: { id: 'campfire' },
    hint: '목재를 태워 숯 생성',
    canApply() { return { ok: true }; },
    apply(s) {
      s.quantity = (s.quantity ?? 1) * 2;
      return { transformSrc: 'charcoal', consumeSrc: false, consumeTgt: false, noise: 2, message: '목재를 태워 숯을 만들었다.' };
    },
  },
  { id: 'wood_to_charcoal_rev', source: { id: 'campfire' }, target: { id: 'wood' },
    hint: '목재를 태워 숯 생성',
    canApply() { return { ok: true }; },
    apply(s, t) {
      t.quantity = (t.quantity ?? 1) * 2;
      return { transformTgt: 'charcoal', consumeSrc: false, consumeTgt: false, noise: 2, message: '목재를 태워 숯을 만들었다.' };
    },
  },

  // A2. 칼 + 천 → 천 조각 ×3
  { id: 'cut_cloth', source: { id: 'knife' }, target: { id: 'cloth' },
    hint: '칼로 천 재단 → 천 조각',
    canApply(s) { return (s.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      s.durability = Math.max(0, (s.durability ?? 100) - 10);
      t.quantity = (t.quantity ?? 1) * 3;
      return { transformTgt: 'cloth_scrap', consumeSrc: false, consumeTgt: false, message: '칼로 천을 잘라 천 조각을 만들었다.' };
    },
  },
  { id: 'cut_cloth_rev', source: { id: 'cloth' }, target: { id: 'knife' },
    hint: '칼로 천 재단 → 천 조각',
    canApply(s, t) { return (t.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 10);
      s.quantity = (s.quantity ?? 1) * 3;
      return { transformSrc: 'cloth_scrap', consumeSrc: false, consumeTgt: false, message: '칼로 천을 잘라 천 조각을 만들었다.' };
    },
  },

  // A3. 고철 + 캠프파이어 → 철파이프
  { id: 'smelt_metal', source: { id: 'scrap_metal' }, target: { id: 'campfire' },
    hint: '고철 제련 → 철파이프',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'iron_pipe', consumeSrc: false, consumeTgt: false, noise: 3, message: '고철을 녹여 철파이프를 만들었다.' }; },
  },
  { id: 'smelt_metal_rev', source: { id: 'campfire' }, target: { id: 'scrap_metal' },
    hint: '고철 제련 → 철파이프',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'iron_pipe', consumeSrc: false, consumeTgt: false, noise: 3, message: '고철을 녹여 철파이프를 만들었다.' }; },
  },

  // A4. 주류 + 캠프파이어 → 알코올 용액
  { id: 'distill_alcohol', source: { id: 'alcohol_drink' }, target: { id: 'campfire' },
    hint: '주류 증류 → 알코올 용액',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'alcohol_solution', consumeSrc: false, consumeTgt: false, noise: 2, message: '주류를 증류해 알코올 용액을 만들었다.' }; },
  },
  { id: 'distill_alcohol_rev', source: { id: 'campfire' }, target: { id: 'alcohol_drink' },
    hint: '주류 증류 → 알코올 용액',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'alcohol_solution', consumeSrc: false, consumeTgt: false, noise: 2, message: '주류를 증류해 알코올 용액을 만들었다.' }; },
  },

  // A5. 숯 + 천 조각 → 숯 필터
  { id: 'make_filter_quick', source: { id: 'charcoal' }, target: { id: 'cloth_scrap' },
    hint: '숯 + 천 조각 → 숯 필터',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'charcoal_filter', consumeSrc: true, consumeTgt: false, message: '숯과 천 조각으로 숯 필터를 만들었다.' }; },
  },
  { id: 'make_filter_quick_rev', source: { id: 'cloth_scrap' }, target: { id: 'charcoal' },
    hint: '숯 + 천 조각 → 숯 필터',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'charcoal_filter', consumeSrc: false, consumeTgt: true, message: '숯과 천 조각으로 숯 필터를 만들었다.' }; },
  },

  // A6. 칼 + 고철 → 날카로운 날
  { id: 'whittle_blade', source: { id: 'knife' }, target: { id: 'scrap_metal' },
    hint: '고철 연마 → 날카로운 날',
    canApply(s) { return (s.durability ?? 100) >= 15 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s) {
      s.durability = Math.max(0, (s.durability ?? 100) - 15);
      return { transformTgt: 'sharp_blade', consumeSrc: false, consumeTgt: false, noise: 2, message: '고철을 갈아 날카로운 날을 만들었다.' };
    },
  },
  { id: 'whittle_blade_rev', source: { id: 'scrap_metal' }, target: { id: 'knife' },
    hint: '고철 연마 → 날카로운 날',
    canApply(s, t) { return (t.durability ?? 100) >= 15 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 15);
      return { transformSrc: 'sharp_blade', consumeSrc: false, consumeTgt: false, noise: 2, message: '고철을 갈아 날카로운 날을 만들었다.' };
    },
  },

  // A7. 손도끼 + 통나무 → 목재 ×3
  { id: 'chop_log', source: { id: 'hand_axe' }, target: { id: 'tree_log' },
    hint: '도끼로 통나무 벌목 → 목재 ×3',
    canApply(s) { return (s.durability ?? 100) >= 8 ? { ok: true } : { ok: false, reason: '도끼 내구도가 너무 낮다.' }; },
    apply(s, t) {
      s.durability = Math.max(0, (s.durability ?? 100) - 8);
      t.quantity = 3;
      return { transformTgt: 'wood', consumeSrc: false, consumeTgt: false, noise: 4, message: '도끼로 통나무를 쪼개 목재를 얻었다.' };
    },
  },
  { id: 'chop_log_rev', source: { id: 'tree_log' }, target: { id: 'hand_axe' },
    hint: '도끼로 통나무 벌목 → 목재 ×3',
    canApply(s, t) { return (t.durability ?? 100) >= 8 ? { ok: true } : { ok: false, reason: '도끼 내구도가 너무 낮다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 8);
      s.quantity = 3;
      return { transformSrc: 'wood', consumeSrc: false, consumeTgt: false, noise: 4, message: '도끼로 통나무를 쪼개 목재를 얻었다.' };
    },
  },

  // A8. 파이프렌치 + 고철 → 못 ×5
  { id: 'forge_nails', source: { id: 'pipe_wrench' }, target: { id: 'scrap_metal' },
    hint: '렌치로 고철 가공 → 못',
    canApply(s) { return (s.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '렌치 내구도 부족.' }; },
    apply(s, t) {
      s.durability = Math.max(0, (s.durability ?? 100) - 10);
      t.quantity = 5;
      return { transformTgt: 'nail', consumeSrc: false, consumeTgt: false, noise: 3, message: '고철을 두드려 못을 만들었다.' };
    },
  },
  { id: 'forge_nails_rev', source: { id: 'scrap_metal' }, target: { id: 'pipe_wrench' },
    hint: '렌치로 고철 가공 → 못',
    canApply(s, t) { return (t.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '렌치 내구도 부족.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 10);
      s.quantity = 5;
      return { transformSrc: 'nail', consumeSrc: false, consumeTgt: false, noise: 3, message: '고철을 두드려 못을 만들었다.' };
    },
  },

  // ── A+. 재료 가공 확장 (9종) ─────────────────────────────

  // A9. 칼 + 통나무 → 목재 ×2 (비효율 가공)
  { id: 'carve_log', source: { id: 'knife' }, target: { id: 'tree_log' },
    hint: '칼로 통나무 깎기 → 목재 ×2',
    canApply(s) { return (s.durability ?? 100) >= 15 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      s.durability = Math.max(0, (s.durability ?? 100) - 15);
      t.quantity = 2;
      return { transformTgt: 'wood', consumeSrc: false, consumeTgt: false, message: '칼로 통나무를 깎아 목재를 얻었다. (비효율적)' };
    },
  },
  { id: 'carve_log_rev', source: { id: 'tree_log' }, target: { id: 'knife' },
    hint: '칼로 통나무 깎기 → 목재 ×2',
    canApply(s, t) { return (t.durability ?? 100) >= 15 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 15);
      s.quantity = 2;
      return { transformSrc: 'wood', consumeSrc: false, consumeTgt: false, message: '칼로 통나무를 깎아 목재를 얻었다. (비효율적)' };
    },
  },

  // A10. 통나무 + 캠프파이어 → 숯 ×4 (대량 숯)
  { id: 'burn_log', source: { id: 'tree_log' }, target: { id: 'campfire' },
    hint: '통나무 태우기 → 숯 ×4',
    canApply() { return { ok: true }; },
    apply(s) {
      s.quantity = 4;
      return { transformSrc: 'charcoal', consumeSrc: false, consumeTgt: false, noise: 3, message: '통나무를 태워 대량의 숯을 만들었다.' };
    },
  },
  { id: 'burn_log_rev', source: { id: 'campfire' }, target: { id: 'tree_log' },
    hint: '통나무 태우기 → 숯 ×4',
    canApply() { return { ok: true }; },
    apply(s, t) {
      t.quantity = 4;
      return { transformTgt: 'charcoal', consumeSrc: false, consumeTgt: false, noise: 3, message: '통나무를 태워 대량의 숯을 만들었다.' };
    },
  },

  // A11. 칼 + 로프 → 실 ×3 (로프 풀기)
  { id: 'unravel_rope', source: { id: 'knife' }, target: { id: 'rope' },
    hint: '칼로 로프 풀기 → 실 ×3',
    canApply(s) { return (s.durability ?? 100) >= 5 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      s.durability = Math.max(0, (s.durability ?? 100) - 5);
      t.quantity = 3;
      return { transformTgt: 'thread', consumeSrc: false, consumeTgt: false, message: '칼로 로프를 풀어 실을 얻었다.' };
    },
  },
  { id: 'unravel_rope_rev', source: { id: 'rope' }, target: { id: 'knife' },
    hint: '칼로 로프 풀기 → 실 ×3',
    canApply(s, t) { return (t.durability ?? 100) >= 5 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 5);
      s.quantity = 3;
      return { transformSrc: 'thread', consumeSrc: false, consumeTgt: false, message: '칼로 로프를 풀어 실을 얻었다.' };
    },
  },

  // A12. 빈병 + 캠프파이어 → 유리파편 ×2 (유리 용해)
  { id: 'smash_bottle', source: { id: 'empty_bottle' }, target: { id: 'campfire' },
    hint: '빈병 가열 → 유리파편 ×2',
    canApply() { return { ok: true }; },
    apply(s) {
      s.quantity = 2;
      return { transformSrc: 'glass_shard', consumeSrc: false, consumeTgt: false, noise: 2, message: '빈병을 깨뜨려 유리파편을 얻었다.' };
    },
  },
  { id: 'smash_bottle_rev', source: { id: 'campfire' }, target: { id: 'empty_bottle' },
    hint: '빈병 가열 → 유리파편 ×2',
    canApply() { return { ok: true }; },
    apply(s, t) {
      t.quantity = 2;
      return { transformTgt: 'glass_shard', consumeSrc: false, consumeTgt: false, noise: 2, message: '빈병을 깨뜨려 유리파편을 얻었다.' };
    },
  },

  // A13. 약초 + 캠프파이어 → 비타민 (약초 가공)
  { id: 'process_herb', source: { id: 'herb' }, target: { id: 'campfire' },
    hint: '약초 가공 → 비타민',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'vitamins', consumeSrc: false, consumeTgt: false, noise: 1, message: '약초를 끓여 비타민 추출물을 만들었다.' }; },
  },
  { id: 'process_herb_rev', source: { id: 'campfire' }, target: { id: 'herb' },
    hint: '약초 가공 → 비타민',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'vitamins', consumeSrc: false, consumeTgt: false, noise: 1, message: '약초를 끓여 비타민 추출물을 만들었다.' }; },
  },

  // A14. 파이프렌치 + 철파이프 → 스프링 (파이프 감기)
  { id: 'coil_spring', source: { id: 'pipe_wrench' }, target: { id: 'iron_pipe' },
    hint: '렌치로 파이프 감기 → 스프링',
    canApply(s) { return (s.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '렌치 내구도 부족.' }; },
    apply(s) {
      s.durability = Math.max(0, (s.durability ?? 100) - 10);
      return { transformTgt: 'spring', consumeSrc: false, consumeTgt: false, noise: 3, message: '렌치로 철파이프를 감아 스프링을 만들었다.' };
    },
  },
  { id: 'coil_spring_rev', source: { id: 'iron_pipe' }, target: { id: 'pipe_wrench' },
    hint: '렌치로 파이프 감기 → 스프링',
    canApply(s, t) { return (t.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '렌치 내구도 부족.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 10);
      return { transformSrc: 'spring', consumeSrc: false, consumeTgt: false, noise: 3, message: '렌치로 철파이프를 감아 스프링을 만들었다.' };
    },
  },

  // A15. 쇠지렛대 + 고철 → 철파이프 (지렛대로 고철 펴기)
  { id: 'pry_metal', source: { id: 'crowbar' }, target: { id: 'scrap_metal' },
    hint: '쇠지렛대로 고철 펴기 → 철파이프',
    canApply(s) { return (s.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '쇠지렛대 내구도 부족.' }; },
    apply(s) {
      s.durability = Math.max(0, (s.durability ?? 100) - 10);
      return { transformTgt: 'iron_pipe', consumeSrc: false, consumeTgt: false, noise: 4, message: '쇠지렛대로 고철을 펴서 철파이프를 만들었다.' };
    },
  },
  { id: 'pry_metal_rev', source: { id: 'scrap_metal' }, target: { id: 'crowbar' },
    hint: '쇠지렛대로 고철 펴기 → 철파이프',
    canApply(s, t) { return (t.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '쇠지렛대 내구도 부족.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 10);
      return { transformSrc: 'iron_pipe', consumeSrc: false, consumeTgt: false, noise: 4, message: '쇠지렛대로 고철을 펴서 철파이프를 만들었다.' };
    },
  },

  // A17. 칼 + 가죽 → 실 ×2 (가죽끈 절단)
  { id: 'cut_leather_strips', source: { id: 'knife' }, target: { id: 'leather' },
    hint: '칼로 가죽 절단 → 실 ×2',
    canApply(s) { return (s.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      s.durability = Math.max(0, (s.durability ?? 100) - 10);
      t.quantity = 2;
      return { transformTgt: 'thread', consumeSrc: false, consumeTgt: false, message: '가죽을 잘라 가죽끈(실)을 만들었다.' };
    },
  },
  { id: 'cut_leather_strips_rev', source: { id: 'leather' }, target: { id: 'knife' },
    hint: '칼로 가죽 절단 → 실 ×2',
    canApply(s, t) { return (t.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '칼의 내구도가 너무 낮다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 10);
      s.quantity = 2;
      return { transformSrc: 'thread', consumeSrc: false, consumeTgt: false, message: '가죽을 잘라 가죽끈(실)을 만들었다.' };
    },
  },

  // ── B. 수리/보수 (5종) ──────────────────────────────────

  // B9. 덕테이프 + 방어구 → 수리 (+20)
  { id: 'repair_armor_tape', source: { id: 'duct_tape' }, target: { type: 'armor' },
    hint: '덕테이프로 방어구 수리 (+20)',
    canApply(s, t) { return (t.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(100, (t.durability ?? 100) + 20);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '덕테이프로 방어구를 수리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'repair_armor_tape_rev', source: { type: 'armor' }, target: { id: 'duct_tape' },
    hint: '덕테이프로 방어구 수리 (+20)',
    canApply(s) { return (s.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(100, (s.durability ?? 100) + 20);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '덕테이프로 방어구를 수리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // B10. 덕테이프 + 구조물 → 수리 (+25)
  { id: 'repair_structure_tape', source: { id: 'duct_tape' }, target: { type: 'structure' },
    hint: '덕테이프로 구조물 수리 (+25)',
    canApply(s, t) {
      const max = window.__GAME_DATA__?.items[t.definitionId]?.defaultDurability ?? 100;
      return (t.durability ?? max) >= max ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true };
    },
    apply(s, t) {
      const max = window.__GAME_DATA__?.items[t.definitionId]?.defaultDurability ?? 100;
      t.durability = Math.min(max, (t.durability ?? max) + 25);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '덕테이프로 구조물을 수리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'repair_structure_tape_rev', source: { type: 'structure' }, target: { id: 'duct_tape' },
    hint: '덕테이프로 구조물 수리 (+25)',
    canApply(s) {
      const max = window.__GAME_DATA__?.items[s.definitionId]?.defaultDurability ?? 100;
      return (s.durability ?? max) >= max ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true };
    },
    apply(s, t) {
      const max = window.__GAME_DATA__?.items[s.definitionId]?.defaultDurability ?? 100;
      s.durability = Math.min(max, (s.durability ?? max) + 25);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '덕테이프로 구조물을 수리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // B11. 연료통 + 캠프파이어 → 캠프파이어 완전 수리
  { id: 'refuel_campfire', source: { id: 'fuel_can' }, target: { id: 'campfire' },
    hint: '연료 보충 → 캠프파이어 완전 수리',
    canApply(s, t) { return (t.durability ?? 50) >= 50 ? { ok: false, reason: '캠프파이어가 이미 최대 상태다.' } : { ok: true }; },
    apply(s, t) { t.durability = 50; return { message: '연료를 부어 캠프파이어를 보충했다.', consumeSrc: true, consumeTgt: false, noise: 2 }; },
  },
  { id: 'refuel_campfire_rev', source: { id: 'campfire' }, target: { id: 'fuel_can' },
    hint: '연료 보충 → 캠프파이어 완전 수리',
    canApply(s) { return (s.durability ?? 50) >= 50 ? { ok: false, reason: '캠프파이어가 이미 최대 상태다.' } : { ok: true }; },
    apply(s) { s.durability = 50; return { message: '연료를 부어 캠프파이어를 보충했다.', consumeSrc: false, consumeTgt: true, noise: 2 }; },
  },

  // B12. 실 + 방어구 → 수선 (+15)
  { id: 'mend_armor_thread', source: { id: 'thread' }, target: { type: 'armor' },
    hint: '실로 방어구 수선 (+15)',
    canApply(s, t) { return (t.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(100, (t.durability ?? 100) + 15);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '실로 방어구를 수선했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'mend_armor_thread_rev', source: { type: 'armor' }, target: { id: 'thread' },
    hint: '실로 방어구 수선 (+15)',
    canApply(s) { return (s.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(100, (s.durability ?? 100) + 15);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '실로 방어구를 수선했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // B13. 고철 + 근접무기 → 보강 (+15, 소음)
  { id: 'patch_melee', source: { id: 'scrap_metal' }, target: { tag: 'melee' },
    hint: '고철로 근접무기 보강 (+15)',
    canApply(s, t) { return (t.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(100, (t.durability ?? 100) + 15);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '고철로 무기를 보강했다.', consumeSrc: s.quantity <= 0, consumeTgt: false, noise: 2 };
    },
  },
  { id: 'patch_melee_rev', source: { tag: 'melee' }, target: { id: 'scrap_metal' },
    hint: '고철로 근접무기 보강 (+15)',
    canApply(s) { return (s.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(100, (s.durability ?? 100) + 15);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '고철로 무기를 보강했다.', consumeSrc: false, consumeTgt: t.quantity <= 0, noise: 2 };
    },
  },

  // ── C. 세정/정화 (5종) ──────────────────────────────────

  // C14. 소독약 + 무기 → 오염 제거
  { id: 'disinfect_weapon', source: { id: 'antiseptic' }, target: { type: 'weapon' },
    hint: '소독약으로 무기 오염 제거',
    canApply(s, t) { return (t.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      t.contamination = 0;
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '소독약으로 무기를 소독했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'disinfect_weapon_rev', source: { type: 'weapon' }, target: { id: 'antiseptic' },
    hint: '소독약으로 무기 오염 제거',
    canApply(s) { return (s.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      s.contamination = 0;
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '소독약으로 무기를 소독했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // C15. 소독약 + 방어구 → 오염 제거
  { id: 'disinfect_armor', source: { id: 'antiseptic' }, target: { type: 'armor' },
    hint: '소독약으로 방어구 오염 제거',
    canApply(s, t) { return (t.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      t.contamination = 0;
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '소독약으로 방어구를 소독했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'disinfect_armor_rev', source: { type: 'armor' }, target: { id: 'antiseptic' },
    hint: '소독약으로 방어구 오염 제거',
    canApply(s) { return (s.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      s.contamination = 0;
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '소독약으로 방어구를 소독했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // C16. 소금 + 음식(edible) → 방부 처리 (오염도 -30)
  { id: 'preserve_food', source: { id: 'salt' }, target: { tag: 'edible' },
    hint: '소금으로 음식 방부 처리',
    canApply(s, t) { return (t.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '이미 깨끗한 음식이다.' }; },
    apply(s, t) {
      t.contamination = Math.max(0, (t.contamination ?? 0) - 30);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '소금으로 음식을 방부 처리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'preserve_food_rev', source: { tag: 'edible' }, target: { id: 'salt' },
    hint: '소금으로 음식 방부 처리',
    canApply(s) { return (s.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '이미 깨끗한 음식이다.' }; },
    apply(s, t) {
      s.contamination = Math.max(0, (s.contamination ?? 0) - 30);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '소금으로 음식을 방부 처리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // C17. 천 + 무기 → 닦기 (오염도 -40)
  { id: 'wipe_weapon', source: { id: 'cloth' }, target: { type: 'weapon' },
    hint: '천으로 무기 닦기',
    canApply(s, t) { return (t.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      t.contamination = Math.max(0, (t.contamination ?? 0) - 40);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '천으로 무기를 닦았다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'wipe_weapon_rev', source: { type: 'weapon' }, target: { id: 'cloth' },
    hint: '천으로 무기 닦기',
    canApply(s) { return (s.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      s.contamination = Math.max(0, (s.contamination ?? 0) - 40);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '천으로 무기를 닦았다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // C18. 천 + 방어구 → 닦기 (오염도 -40)
  { id: 'wipe_armor', source: { id: 'cloth' }, target: { type: 'armor' },
    hint: '천으로 방어구 닦기',
    canApply(s, t) { return (t.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      t.contamination = Math.max(0, (t.contamination ?? 0) - 40);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '천으로 방어구를 닦았다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'wipe_armor_rev', source: { type: 'armor' }, target: { id: 'cloth' },
    hint: '천으로 방어구 닦기',
    canApply(s) { return (s.contamination ?? 0) > 0 ? { ok: true } : { ok: false, reason: '오염이 없다.' }; },
    apply(s, t) {
      s.contamination = Math.max(0, (s.contamination ?? 0) - 40);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '천으로 방어구를 닦았다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // ── D. 장비 강화 (7종) ──────────────────────────────────

  // D19. 못 + 근접무기 → 데미지 +2
  { id: 'nail_enhance', source: { id: 'nail' }, target: { tag: 'melee' },
    hint: '못 박기 → 무기 데미지 +2',
    canApply(s, t) {
      if (t.nailMod) return { ok: false, reason: '이미 못이 박혀 있다.' };
      if ((s.quantity ?? 1) < 3) return { ok: false, reason: '못이 3개 이상 필요하다.' };
      return { ok: true };
    },
    apply(s, t) {
      t.nailMod = true; t.damageBonus = (t.damageBonus ?? 0) + 2;
      s.quantity = Math.max(0, (s.quantity ?? 1) - 3);
      return { message: '못을 박아 무기를 강화했다. 데미지 +2.', consumeSrc: s.quantity <= 0, consumeTgt: false, noise: 2 };
    },
  },
  { id: 'nail_enhance_rev', source: { tag: 'melee' }, target: { id: 'nail' },
    hint: '못 박기 → 무기 데미지 +2',
    canApply(s, t) {
      if (s.nailMod) return { ok: false, reason: '이미 못이 박혀 있다.' };
      if ((t.quantity ?? 1) < 3) return { ok: false, reason: '못이 3개 이상 필요하다.' };
      return { ok: true };
    },
    apply(s, t) {
      s.nailMod = true; s.damageBonus = (s.damageBonus ?? 0) + 2;
      t.quantity = Math.max(0, (t.quantity ?? 1) - 3);
      return { message: '못을 박아 무기를 강화했다. 데미지 +2.', consumeSrc: false, consumeTgt: t.quantity <= 0, noise: 2 };
    },
  },

  // D20. 유리파편 + 근접무기 → 데미지 +2, 출혈
  { id: 'glass_enhance', source: { id: 'glass_shard' }, target: { tag: 'melee' },
    hint: '유리 부착 → 데미지 +2, 출혈',
    canApply(s, t) { return t.glassMod ? { ok: false, reason: '이미 유리가 부착되어 있다.' } : { ok: true }; },
    apply(s, t) {
      t.glassMod = true; t.damageBonus = (t.damageBonus ?? 0) + 2;
      return { message: '유리파편을 부착했다. 데미지 +2, 출혈 효과.', consumeSrc: true, consumeTgt: false };
    },
  },
  { id: 'glass_enhance_rev', source: { tag: 'melee' }, target: { id: 'glass_shard' },
    hint: '유리 부착 → 데미지 +2, 출혈',
    canApply(s) { return s.glassMod ? { ok: false, reason: '이미 유리가 부착되어 있다.' } : { ok: true }; },
    apply(s) {
      s.glassMod = true; s.damageBonus = (s.damageBonus ?? 0) + 2;
      return { message: '유리파편을 부착했다. 데미지 +2, 출혈 효과.', consumeSrc: false, consumeTgt: true };
    },
  },

  // D21. 가죽 + 근접무기 → 명중률 +5%
  { id: 'leather_grip', source: { id: 'leather' }, target: { tag: 'melee' },
    hint: '가죽 그립 → 명중률 +5%',
    canApply(s, t) { return t.leatherMod ? { ok: false, reason: '이미 그립이 감겨 있다.' } : { ok: true }; },
    apply(s, t) {
      t.leatherMod = true; t.accuracyBonus = (t.accuracyBonus ?? 0) + 0.05;
      return { message: '가죽 그립을 감았다. 명중률 +5%.', consumeSrc: true, consumeTgt: false };
    },
  },
  { id: 'leather_grip_rev', source: { tag: 'melee' }, target: { id: 'leather' },
    hint: '가죽 그립 → 명중률 +5%',
    canApply(s) { return s.leatherMod ? { ok: false, reason: '이미 그립이 감겨 있다.' } : { ok: true }; },
    apply(s) {
      s.leatherMod = true; s.accuracyBonus = (s.accuracyBonus ?? 0) + 0.05;
      return { message: '가죽 그립을 감았다. 명중률 +5%.', consumeSrc: false, consumeTgt: true };
    },
  },

  // D22. 로프 + 무기 → 내구도 +10
  { id: 'rope_bind', source: { id: 'rope' }, target: { type: 'weapon' },
    hint: '로프로 무기 보강 (+10)',
    canApply(s, t) { return (t.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(100, (t.durability ?? 100) + 10);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '로프로 무기를 묶어 보강했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'rope_bind_rev', source: { type: 'weapon' }, target: { id: 'rope' },
    hint: '로프로 무기 보강 (+10)',
    canApply(s) { return (s.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(100, (s.durability ?? 100) + 10);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '로프로 무기를 묶어 보강했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // D23. 숫돌 + 근접무기 → 데미지 +3 (연마)
  { id: 'sharpen_melee', source: { id: 'whetstone' }, target: { tag: 'melee' },
    hint: '숫돌로 무기 연마 → 데미지 +3',
    canApply(s, t) {
      if (t.sharpened) return { ok: false, reason: '이미 연마된 무기다.' };
      if ((s.durability ?? 100) < 15) return { ok: false, reason: '숫돌이 너무 닳았다.' };
      return { ok: true };
    },
    apply(s, t) {
      t.sharpened = true; t.damageBonus = (t.damageBonus ?? 0) + 3;
      s.durability = Math.max(0, (s.durability ?? 100) - 15);
      return { message: '숫돌로 무기를 연마했다. 데미지 +3.', consumeSrc: (s.durability ?? 0) <= 0, consumeTgt: false, noise: 2 };
    },
  },
  { id: 'sharpen_melee_rev', source: { tag: 'melee' }, target: { id: 'whetstone' },
    hint: '숫돌로 무기 연마 → 데미지 +3',
    canApply(s, t) {
      if (s.sharpened) return { ok: false, reason: '이미 연마된 무기다.' };
      if ((t.durability ?? 100) < 15) return { ok: false, reason: '숫돌이 너무 닳았다.' };
      return { ok: true };
    },
    apply(s, t) {
      s.sharpened = true; s.damageBonus = (s.damageBonus ?? 0) + 3;
      t.durability = Math.max(0, (t.durability ?? 100) - 15);
      return { message: '숫돌로 무기를 연마했다. 데미지 +3.', consumeSrc: false, consumeTgt: (t.durability ?? 0) <= 0, noise: 2 };
    },
  },

  // D24. 고철 + 방어구 → 내구도 +20 (소음)
  { id: 'metal_plate', source: { id: 'scrap_metal' }, target: { type: 'armor' },
    hint: '고철로 방어구 보강 (+20)',
    canApply(s, t) { return (t.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(100, (t.durability ?? 100) + 20);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '고철판을 덧대 방어구를 보강했다.', consumeSrc: s.quantity <= 0, consumeTgt: false, noise: 2 };
    },
  },
  { id: 'metal_plate_rev', source: { type: 'armor' }, target: { id: 'scrap_metal' },
    hint: '고철로 방어구 보강 (+20)',
    canApply(s) { return (s.durability ?? 100) >= 100 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(100, (s.durability ?? 100) + 20);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '고철판을 덧대 방어구를 보강했다.', consumeSrc: false, consumeTgt: t.quantity <= 0, noise: 2 };
    },
  },

  // D25. 숫돌 + 칼 → 칼 내구도 완전 복원
  { id: 'sharpen_knife', source: { id: 'whetstone' }, target: { id: 'knife' },
    hint: '숫돌로 칼갈이 → 내구도 완전 복원',
    canApply(s, t) {
      if ((t.durability ?? 100) >= 70) return { ok: false, reason: '칼이 아직 충분히 날카롭다.' };
      if ((s.durability ?? 100) < 20) return { ok: false, reason: '숫돌이 너무 닳았다.' };
      return { ok: true };
    },
    apply(s, t) {
      t.durability = 70;
      s.durability = Math.max(0, (s.durability ?? 100) - 20);
      return { message: '숫돌로 칼을 날카롭게 갈았다.', consumeSrc: (s.durability ?? 0) <= 0, consumeTgt: false, noise: 1 };
    },
  },
  { id: 'sharpen_knife_rev', source: { id: 'knife' }, target: { id: 'whetstone' },
    hint: '숫돌로 칼갈이 → 내구도 완전 복원',
    canApply(s, t) {
      if ((s.durability ?? 100) >= 70) return { ok: false, reason: '칼이 아직 충분히 날카롭다.' };
      if ((t.durability ?? 100) < 20) return { ok: false, reason: '숫돌이 너무 닳았다.' };
      return { ok: true };
    },
    apply(s, t) {
      s.durability = 70;
      t.durability = Math.max(0, (t.durability ?? 100) - 20);
      return { message: '숫돌로 칼을 날카롭게 갈았다.', consumeSrc: false, consumeTgt: (t.durability ?? 0) <= 0, noise: 1 };
    },
  },

  // ── E. 음식 가공 (3종) ──────────────────────────────────

  // E26. 통조림 + 캠프파이어 → 가열 (오염 제거, 사기↑)
  { id: 'heat_canned', source: { id: 'canned_food' }, target: { id: 'campfire' },
    hint: '통조림 가열 → 오염 제거, 사기 +5',
    canApply() { return { ok: true }; },
    apply(s) {
      s.contamination = 0; s.heated = true;
      return { message: '통조림을 가열했다. 따뜻한 한 끼!', consumeSrc: false, consumeTgt: false, noise: 1 };
    },
  },
  { id: 'heat_canned_rev', source: { id: 'campfire' }, target: { id: 'canned_food' },
    hint: '통조림 가열 → 오염 제거, 사기 +5',
    canApply() { return { ok: true }; },
    apply(s, t) {
      t.contamination = 0; t.heated = true;
      return { message: '통조림을 가열했다. 따뜻한 한 끼!', consumeSrc: false, consumeTgt: false, noise: 1 };
    },
  },

  // E27. 건육 + 캠프파이어 → 훈제 (오염 제거)
  { id: 'grill_meat', source: { id: 'dried_meat' }, target: { id: 'campfire' },
    hint: '건육 훈제 → 오염 제거',
    canApply() { return { ok: true }; },
    apply(s) {
      s.contamination = 0;
      return { message: '건육을 훈제했다. 안전하게 먹을 수 있다.', consumeSrc: false, consumeTgt: false, noise: 1 };
    },
  },
  { id: 'grill_meat_rev', source: { id: 'campfire' }, target: { id: 'dried_meat' },
    hint: '건육 훈제 → 오염 제거',
    canApply() { return { ok: true }; },
    apply(s, t) {
      t.contamination = 0;
      return { message: '건육을 훈제했다. 안전하게 먹을 수 있다.', consumeSrc: false, consumeTgt: false, noise: 1 };
    },
  },

  // E28. 약초 + 끓인 물 → 허브차
  { id: 'brew_herb_tea', source: { id: 'herb' }, target: { id: 'boiled_water' },
    hint: '약초 + 끓인 물 → 허브차',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'herbal_tea', consumeSrc: true, consumeTgt: false, message: '약초를 끓인 물에 우려 허브차를 만들었다.' }; },
  },
  { id: 'brew_herb_tea_rev', source: { id: 'boiled_water' }, target: { id: 'herb' },
    hint: '약초 + 끓인 물 → 허브차',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'herbal_tea', consumeSrc: false, consumeTgt: true, message: '약초를 끓인 물에 우려 허브차를 만들었다.' }; },
  },

  // ── F. 의료 조합 (4종) ──────────────────────────────────

  // F29. 소독약 + 붕대 → 강화 붕대 (감염 치유 ↑)
  { id: 'enhance_bandage', source: { id: 'antiseptic' }, target: { id: 'bandage' },
    hint: '소독약 + 붕대 → 강화 붕대',
    canApply(s, t) { return t.enhanced ? { ok: false, reason: '이미 강화된 붕대다.' } : { ok: true }; },
    apply(s, t) {
      t.enhanced = true; t.infectionBonus = (t.infectionBonus ?? 0) - 10;
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '소독약으로 붕대를 강화했다. 감염 치유력 상승.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'enhance_bandage_rev', source: { id: 'bandage' }, target: { id: 'antiseptic' },
    hint: '소독약 + 붕대 → 강화 붕대',
    canApply(s) { return s.enhanced ? { ok: false, reason: '이미 강화된 붕대다.' } : { ok: true }; },
    apply(s, t) {
      s.enhanced = true; s.infectionBonus = (s.infectionBonus ?? 0) - 10;
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '소독약으로 붕대를 강화했다. 감염 치유력 상승.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // F30. 소독약 + 거즈 → 멸균 거즈
  { id: 'sterile_gauze', source: { id: 'antiseptic' }, target: { id: 'gauze' },
    hint: '소독약 + 거즈 → 멸균 거즈',
    canApply(s, t) { return t.sterile ? { ok: false, reason: '이미 멸균 처리됐다.' } : { ok: true }; },
    apply(s, t) {
      t.sterile = true; t.contamination = 0;
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '거즈를 멸균 처리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'sterile_gauze_rev', source: { id: 'gauze' }, target: { id: 'antiseptic' },
    hint: '소독약 + 거즈 → 멸균 거즈',
    canApply(s) { return s.sterile ? { ok: false, reason: '이미 멸균 처리됐다.' } : { ok: true }; },
    apply(s, t) {
      s.sterile = true; s.contamination = 0;
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '거즈를 멸균 처리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // F31. 천 조각 + 천 조각 → 붕대 (대칭 — 1개 규칙)
  { id: 'wrap_bandage', source: { id: 'cloth_scrap' }, target: { id: 'cloth_scrap' },
    hint: '천 조각 둘을 엮어 붕대 제작',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'bandage', consumeSrc: true, consumeTgt: false, message: '천 조각을 엮어 붕대를 만들었다.' }; },
  },

  // F32. 로프 + 목재 → 부목
  { id: 'make_splint', source: { id: 'rope' }, target: { id: 'wood' },
    hint: '로프 + 목재 → 부목',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'splint', consumeSrc: true, consumeTgt: false, message: '목재와 로프로 부목을 만들었다.' }; },
  },
  { id: 'make_splint_rev', source: { id: 'wood' }, target: { id: 'rope' },
    hint: '로프 + 목재 → 부목',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'splint', consumeSrc: false, consumeTgt: true, message: '목재와 로프로 부목을 만들었다.' }; },
  },

  // ── G. 장비 전문 수리 (4종) ─────────────────────────────

  // G33. 방독면 필터 + 방독면 → 필터 교체 (+40)
  { id: 'replace_gas_filter', source: { id: 'gas_mask_filter' }, target: { id: 'gas_mask' },
    hint: '방독면 필터 교체 (+40)',
    canApply(s, t) { return (t.durability ?? 100) >= 80 ? { ok: false, reason: '필터가 아직 충분하다.' } : { ok: true }; },
    apply(s, t) { t.durability = Math.min(80, (t.durability ?? 80) + 40); return { message: '방독면 필터를 교체했다.', consumeSrc: true, consumeTgt: false }; },
  },
  { id: 'replace_gas_filter_rev', source: { id: 'gas_mask' }, target: { id: 'gas_mask_filter' },
    hint: '방독면 필터 교체 (+40)',
    canApply(s) { return (s.durability ?? 100) >= 80 ? { ok: false, reason: '필터가 아직 충분하다.' } : { ok: true }; },
    apply(s) { s.durability = Math.min(80, (s.durability ?? 80) + 40); return { message: '방독면 필터를 교체했다.', consumeSrc: false, consumeTgt: true }; },
  },

  // G34. 전자부품 + 무전기 → 수리 (+30)
  { id: 'repair_radio', source: { id: 'electronic_parts' }, target: { id: 'radio' },
    hint: '전자부품으로 무전기 수리 (+30)',
    canApply(s, t) { return (t.durability ?? 100) >= 70 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(70, (t.durability ?? 70) + 30);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '전자부품으로 무전기를 수리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'repair_radio_rev', source: { id: 'radio' }, target: { id: 'electronic_parts' },
    hint: '전자부품으로 무전기 수리 (+30)',
    canApply(s) { return (s.durability ?? 100) >= 70 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(70, (s.durability ?? 70) + 30);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '전자부품으로 무전기를 수리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // G35. 전자부품 + 손전등 → 수리 (+30)
  { id: 'repair_flashlight', source: { id: 'electronic_parts' }, target: { id: 'flashlight' },
    hint: '전자부품으로 손전등 수리 (+30)',
    canApply(s, t) { return (t.durability ?? 100) >= 80 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(80, (t.durability ?? 80) + 30);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '전자부품으로 손전등을 수리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'repair_flashlight_rev', source: { id: 'flashlight' }, target: { id: 'electronic_parts' },
    hint: '전자부품으로 손전등 수리 (+30)',
    canApply(s) { return (s.durability ?? 100) >= 80 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(80, (s.durability ?? 80) + 30);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '전자부품으로 손전등을 수리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // G36. 전자부품 + 전기충격기 → 수리 (+30)
  { id: 'repair_stun_gun', source: { id: 'electronic_parts' }, target: { id: 'stun_gun' },
    hint: '전자부품으로 전기충격기 수리 (+30)',
    canApply(s, t) { return (t.durability ?? 100) >= 60 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(60, (t.durability ?? 60) + 30);
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '전자부품으로 전기충격기를 수리했다.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'repair_stun_gun_rev', source: { id: 'stun_gun' }, target: { id: 'electronic_parts' },
    hint: '전자부품으로 전기충격기 수리 (+30)',
    canApply(s) { return (s.durability ?? 100) >= 60 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(60, (s.durability ?? 60) + 30);
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '전자부품으로 전기충격기를 수리했다.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // ── H. 특수 상호작용 (7종) ──────────────────────────────

  // H37. 빈캔 + 캠프파이어 → 고철 (용해)
  { id: 'melt_can', source: { id: 'empty_can' }, target: { id: 'campfire' },
    hint: '빈캔 용해 → 고철',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'scrap_metal', consumeSrc: false, consumeTgt: false, noise: 2, message: '빈캔을 녹여 고철을 얻었다.' }; },
  },
  { id: 'melt_can_rev', source: { id: 'campfire' }, target: { id: 'empty_can' },
    hint: '빈캔 용해 → 고철',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'scrap_metal', consumeSrc: false, consumeTgt: false, noise: 2, message: '빈캔을 녹여 고철을 얻었다.' }; },
  },

  // H38. 생존자 메모 + 무전기 → 방송 (사기 +25)
  { id: 'broadcast_note', source: { id: 'survivor_note' }, target: { id: 'radio' },
    hint: '무전기로 메모 방송 → 사기 +25',
    canApply() { return { ok: true }; },
    apply(s, t, gs) {
      gs.modStat('morale', 25);
      return { message: '무전기로 생존자 메모를 방송했다. 희망이 퍼진다. 사기 +25.', consumeSrc: true, consumeTgt: false };
    },
  },
  { id: 'broadcast_note_rev', source: { id: 'radio' }, target: { id: 'survivor_note' },
    hint: '무전기로 메모 방송 → 사기 +25',
    canApply() { return { ok: true }; },
    apply(s, t, gs) {
      gs.modStat('morale', 25);
      return { message: '무전기로 생존자 메모를 방송했다. 희망이 퍼진다. 사기 +25.', consumeSrc: false, consumeTgt: true };
    },
  },

  // H39. 라이터 + 목재 → 캠프파이어 (즉석 점화)
  { id: 'lighter_campfire', source: { id: 'lighter' }, target: { id: 'wood' },
    hint: '라이터로 불 피우기 → 캠프파이어',
    canApply(s) { return (s.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '라이터 연료가 부족하다.' }; },
    apply(s) {
      s.durability = Math.max(0, (s.durability ?? 100) - 10);
      return { transformTgt: 'campfire', consumeSrc: false, consumeTgt: false, noise: 1, message: '라이터로 불을 피워 캠프파이어를 만들었다.' };
    },
  },
  { id: 'lighter_campfire_rev', source: { id: 'wood' }, target: { id: 'lighter' },
    hint: '라이터로 불 피우기 → 캠프파이어',
    canApply(s, t) { return (t.durability ?? 100) >= 10 ? { ok: true } : { ok: false, reason: '라이터 연료가 부족하다.' }; },
    apply(s, t) {
      t.durability = Math.max(0, (t.durability ?? 100) - 10);
      return { transformSrc: 'campfire', consumeSrc: false, consumeTgt: false, noise: 1, message: '라이터로 불을 피워 캠프파이어를 만들었다.' };
    },
  },

  // H40. 라이터 + 캠프파이어 → 재점화 (+20)
  { id: 'relight_fire', source: { id: 'lighter' }, target: { id: 'campfire' },
    hint: '라이터로 캠프파이어 재점화 (+20)',
    canApply(s, t) { return (t.durability ?? 50) >= 50 ? { ok: false, reason: '캠프파이어가 잘 타고 있다.' } : { ok: true }; },
    apply(s, t) {
      t.durability = Math.min(50, (t.durability ?? 50) + 20);
      s.durability = Math.max(0, (s.durability ?? 100) - 5);
      return { message: '라이터로 캠프파이어를 되살렸다.', consumeSrc: (s.durability ?? 0) <= 0, consumeTgt: false };
    },
  },
  { id: 'relight_fire_rev', source: { id: 'campfire' }, target: { id: 'lighter' },
    hint: '라이터로 캠프파이어 재점화 (+20)',
    canApply(s) { return (s.durability ?? 50) >= 50 ? { ok: false, reason: '캠프파이어가 잘 타고 있다.' } : { ok: true }; },
    apply(s, t) {
      s.durability = Math.min(50, (s.durability ?? 50) + 20);
      t.durability = Math.max(0, (t.durability ?? 100) - 5);
      return { message: '라이터로 캠프파이어를 되살렸다.', consumeSrc: false, consumeTgt: (t.durability ?? 0) <= 0 };
    },
  },

  // H41. 약초 + 붕대 → 약초 붕대 (HP 치유 강화)
  { id: 'herbal_bandage', source: { id: 'herb' }, target: { id: 'bandage' },
    hint: '약초 + 붕대 → 약초 붕대 (HP 치유↑)',
    canApply(s, t) { return t.herbalMod ? { ok: false, reason: '이미 약초가 감겨 있다.' } : { ok: true }; },
    apply(s, t) {
      t.herbalMod = true; t.hpBonus = (t.hpBonus ?? 0) + 10;
      s.quantity = Math.max(0, (s.quantity ?? 1) - 1);
      return { message: '약초를 감아 붕대의 치유력을 강화했다. HP 회복 +10.', consumeSrc: s.quantity <= 0, consumeTgt: false };
    },
  },
  { id: 'herbal_bandage_rev', source: { id: 'bandage' }, target: { id: 'herb' },
    hint: '약초 + 붕대 → 약초 붕대 (HP 치유↑)',
    canApply(s) { return s.herbalMod ? { ok: false, reason: '이미 약초가 감겨 있다.' } : { ok: true }; },
    apply(s, t) {
      s.herbalMod = true; s.hpBonus = (s.hpBonus ?? 0) + 10;
      t.quantity = Math.max(0, (t.quantity ?? 1) - 1);
      return { message: '약초를 감아 붕대의 치유력을 강화했다. HP 회복 +10.', consumeSrc: false, consumeTgt: t.quantity <= 0 };
    },
  },

  // H42. 스프링 + 석궁 → 석궁 보강 (+15)
  { id: 'spring_crossbow', source: { id: 'spring' }, target: { id: 'crossbow' },
    hint: '스프링으로 석궁 보강 (+15)',
    canApply(s, t) { return (t.durability ?? 100) >= 70 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s, t) { t.durability = Math.min(70, (t.durability ?? 70) + 15); return { message: '스프링으로 석궁을 보강했다.', consumeSrc: true, consumeTgt: false }; },
  },
  { id: 'spring_crossbow_rev', source: { id: 'crossbow' }, target: { id: 'spring' },
    hint: '스프링으로 석궁 보강 (+15)',
    canApply(s) { return (s.durability ?? 100) >= 70 ? { ok: false, reason: '이미 최대 내구도다.' } : { ok: true }; },
    apply(s) { s.durability = Math.min(70, (s.durability ?? 70) + 15); return { message: '스프링으로 석궁을 보강했다.', consumeSrc: false, consumeTgt: true }; },
  },

  // H43. 로프 + 천 → 작은 가방
  { id: 'make_bag', source: { id: 'rope' }, target: { id: 'cloth' },
    hint: '로프 + 천 → 작은 가방',
    canApply() { return { ok: true }; },
    apply() { return { transformTgt: 'small_bag', consumeSrc: true, consumeTgt: false, message: '천과 로프로 작은 가방을 만들었다.' }; },
  },
  { id: 'make_bag_rev', source: { id: 'cloth' }, target: { id: 'rope' },
    hint: '로프 + 천 → 작은 가방',
    canApply() { return { ok: true }; },
    apply() { return { transformSrc: 'small_bag', consumeSrc: false, consumeTgt: true, message: '천과 로프로 작은 가방을 만들었다.' }; },
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

  // ════════════════════════════════════════════════════════
  // 환경 카드 인터랙션 (날씨 카드와 아이템 조합)
  // ════════════════════════════════════════════════════════

  // ── E1. 빈 병 + 비 카드 → 빗물(오염된 물) ─────────────
  {
    id: 'rain_collect_bottle',
    source: { id: 'empty_bottle' },
    target: { id: 'env_rainy' },
    hint: '빗물 수집 → 오염된 물',
    canApply(srcInst) { return { ok: true }; },
    apply(srcInst) {
      return {
        message: '빈 병에 빗물을 받았다. 정수가 필요하다.',
        transformSrc: 'contaminated_water',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },
  // ── E1r. 비 카드 + 빈 병 (역방향) ──────────────────────
  {
    id: 'rain_collect_bottle_rev',
    source: { id: 'env_rainy' },
    target: { id: 'empty_bottle' },
    hint: '빗물 수집 → 오염된 물',
    canApply(srcInst) { return { ok: true }; },
    apply(srcInst) {
      return {
        message: '빈 병에 빗물을 받았다. 정수가 필요하다.',
        transformTgt: 'contaminated_water',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },

  // ── E2. 빈 병 + 장마 카드 → 빗물(더 높은 오염) ────────
  {
    id: 'monsoon_collect_bottle',
    source: { id: 'empty_bottle' },
    target: { id: 'env_monsoon' },
    hint: '장마 빗물 수집 → 고오염 물',
    canApply(srcInst) { return { ok: true }; },
    apply(srcInst, tgtInst, gs) {
      srcInst.definitionId = 'contaminated_water';
      srcInst.contamination = 40;
      return {
        message: '장마 빗물을 받았다. 오염도가 높다!',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },

  // ── E3. 빈 병 + 눈 카드 → 저오염 물 ──────────────────
  {
    id: 'snow_collect_bottle',
    source: { id: 'empty_bottle' },
    target: { id: 'env_snow' },
    hint: '눈 녹여 물 확보',
    canApply(srcInst) { return { ok: true }; },
    apply(srcInst) {
      srcInst.definitionId = 'contaminated_water';
      srcInst.contamination = 15;
      return {
        message: '눈을 녹여 물을 만들었다. 약간 오염됨.',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },
  // ── E3r. 눈 카드 + 빈 병 (역방향) ──────────────────────
  {
    id: 'snow_collect_bottle_rev',
    source: { id: 'env_snow' },
    target: { id: 'empty_bottle' },
    hint: '눈 녹여 물 확보',
    canApply(srcInst) { return { ok: true }; },
    apply(srcInst, tgtInst) {
      tgtInst.definitionId = 'contaminated_water';
      tgtInst.contamination = 15;
      return {
        message: '눈을 녹여 물을 만들었다. 약간 오염됨.',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },

  // ── E4. 캠프파이어 + 폭설 → 연료 소모 경고 ─────────────
  {
    id: 'blizzard_campfire_warning',
    source: { id: 'campfire' },
    target: { id: 'env_blizzard' },
    hint: '눈보라 속 모닥불 — 연료 소모 증가',
    canApply() { return { ok: true }; },
    apply() {
      return {
        message: '눈보라가 불길을 약하게 한다. 연료를 더 넣어야 한다.',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },

  // ── E5. 음식 + 산성비 → 오염 경고 ──────────────────────
  {
    id: 'acid_rain_food_warn',
    source: { tag: 'edible' },
    target: { id: 'env_acid_rain' },
    hint: '⚠️ 산성비에 노출된 음식!',
    canApply() { return { ok: true }; },
    apply(srcInst) {
      srcInst.contamination = Math.min(100, (srcInst.contamination ?? 0) + 25);
      return {
        message: '산성비가 음식을 오염시켰다! 오염 +25.',
        consumeSrc: false, consumeTgt: false, noise: 0,
      };
    },
  },

  // ── E6. 캠프파이어 + 비 → 빗물 끓이기 (깨끗한 물) ──────
  {
    id: 'rain_boil_campfire',
    source: { id: 'env_rainy' },
    target: { id: 'campfire' },
    hint: '빗물을 끓여 깨끗한 물 1개 생산',
    canApply(srcInst, tgtInst) {
      if ((tgtInst.durability ?? 100) < 10) return { ok: false, reason: '모닥불 연료가 부족하다.' };
      return { ok: true };
    },
    apply(srcInst, tgtInst, gs) {
      tgtInst.durability = Math.max(0, (tgtInst.durability ?? 100) - 10);
      const water = gs.createCardInstance('purified_water');
      if (water) {
        // 빈 슬롯에 배치
        const row = gs.board.middle;
        const emptySlot = row.indexOf(null);
        if (emptySlot !== -1) {
          row[emptySlot] = water.instanceId;
        } else {
          const row2 = gs.board.bottom;
          const emptySlot2 = row2.indexOf(null);
          if (emptySlot2 !== -1) row2[emptySlot2] = water.instanceId;
        }
      }
      return {
        message: '빗물을 끓여 깨끗한 물을 만들었다!',
        consumeSrc: false, consumeTgt: false, noise: 1,
      };
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
