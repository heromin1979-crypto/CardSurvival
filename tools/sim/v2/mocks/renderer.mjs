// === renderer mock ===
// 시뮬에서 모든 렌더 호출 noop. 호출 카운터는 디버그용.

const callCounts = {};

function noop(name) {
  return (...args) => {
    callCounts[name] = (callCounts[name] ?? 0) + 1;
  };
}

export const Renderer = {
  drawBoard:        noop('drawBoard'),
  drawCard:         noop('drawCard'),
  refreshSidebar:   noop('refreshSidebar'),
  showNotification: noop('showNotification'),
  flashStat:        noop('flashStat'),
  animate:          noop('animate'),
};

export function getRenderCallCounts() {
  return { ...callCounts };
}

export function resetRenderCallCounts() {
  for (const k of Object.keys(callCounts)) delete callCounts[k];
}

export default Renderer;
