/** 현장 사건에 참여할 수 있는 살아 있는 동행자만 반환한다. */
export function isPresentCompanion(gs, npcId) {
  const state = gs.npcs?.states?.[npcId];
  return !!state && (gs.companions ?? []).includes(npcId)
    && !state.dismissed && !state.dispatched && (state.hp ?? 1) > 0;
}

export function getPresentCompanions(gs) {
  return (gs.companions ?? []).filter(npcId => isPresentCompanion(gs, npcId));
}
