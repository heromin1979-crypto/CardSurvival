export function validateCareerProjects(projects, quests, items, districts, recovery) {
  const errors = [], questIds = new Set();
  for (const [id, def] of Object.entries(projects)) {
    const error = message => errors.push(`careerProjects.${id}: ${message}`);
    if (id !== def.id || !def.stageId) error('잘못된 프로젝트·단계 ID');
    if (!districts[def.districtId]) error('알 수 없는 작업 지역');
    const objective = quests[def.questId]?.objective;
    if (objective?.projectId !== id || objective?.stageId !== def.stageId || objective?.districtId !== def.districtId || objective?.type !== 'career_project') error('퀘스트 공정 참조 불일치');
    if (questIds.has(def.questId)) error('중복 퀘스트 연결');
    questIds.add(def.questId);
    const checkItems = rows => {
      for (const row of rows ?? []) if (!items[row.definitionId] || !Number.isInteger(row.qty) || row.qty <= 0) error(`잘못된 물품·수량 ${row.definitionId}`);
    };
    const actions = new Set();
    for (const a of def.actions) {
      if (!a.id || actions.has(a.id)) error('중복/빈 행동 ID');
      actions.add(a.id); checkItems(a.items);
      for (const item of a.facilities ?? []) if (!items[item]) error(`알 수 없는 설비 ${item}`);
    }
    for (const required of [...(def.requires ?? []), ...(def.operated ?? [])]) if (!projects[required] || required === id) error(`잘못된 선행 ${required}`);
    for (const part of def.recovery ?? []) {
      if (!recovery[part] || !def.actions.some(a => a.items.some(i => i.definitionId === part))) error(`필요 공정 밖 회수품 ${part}`);
      checkItems(Object.entries(recovery[part] ?? {}).map(([definitionId, qty]) => ({ definitionId, qty })));
    }
    if (def.crafted && !items[def.crafted]) error('잘못된 제작 기록 품목');
    for (const spec of [def, def.operation ?? {}, def.operation?.seasonalFallback ?? {}]) for (const key of ['powerCost', 'powerOutput']) {
      if (spec[key] != null && (!Number.isInteger(spec[key]) || spec[key] <= 0 || spec[key] > 6)) error(`잘못된 전력 운영 횟수 ${key}`);
    }
    checkItems(def.output); checkItems(def.operation?.costs); checkItems(def.operation?.items);
    if (!def.operation || !(def.operation.cooldownTP > 0) || !(def.operation.tpCost > 0) || !def.operation.costs?.length) error('운영 주기·시간·비용 누락');
    if (def.operation?.seasonalFallback) {
      const fallback = def.operation.seasonalFallback;
      checkItems(fallback.costs); checkItems(fallback.items);
      if (!def.operation.seasonal || !fallback.label || !(fallback.cooldownTP > 0) || !(fallback.tpCost > 0) || !fallback.costs?.length) error('계절 대체 운영 주기·시간·비용 누락');
    }
  }
  const visit = (id, seen) => {
    if (seen.has(id)) { errors.push(`careerProjects.${id}: 선행 순환`); return; }
    const next = new Set([...seen, id]);
    for (const child of projects[id]?.requires ?? []) visit(child, next);
  };
  for (const id of Object.keys(projects)) visit(id, new Set());
  return errors;
}
