// === sound mock ===
// 모든 사운드/BGM 재생 noop.

const callCounts = {};

function noop(name) {
  return (...args) => {
    callCounts[name] = (callCounts[name] ?? 0) + 1;
  };
}

export const Sound = {
  play:     noop('play'),
  loop:     noop('loop'),
  stop:     noop('stop'),
  setVolume:noop('setVolume'),
};

export const BGM = {
  play:    noop('bgm.play'),
  stop:    noop('bgm.stop'),
  fadeOut: noop('bgm.fadeOut'),
  fadeIn:  noop('bgm.fadeIn'),
};

export function getSoundCallCounts() {
  return { ...callCounts };
}

export default Sound;
