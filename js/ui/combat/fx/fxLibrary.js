// 공유 모듈 — 게임 런타임과 tools/combat-fx-lab 이 같은 파일을 쓴다. 수정 시 랩에서 확인할 것.
// 내장 이펙트 라이브러리 — 전부 노드 그래프로 정의되어 노드 에디터에서 그대로 열어 수정할 수 있다.
// 각도 규칙: 0° = 캐릭터가 바라보는 방향(적 쪽), -90° = 위
import { buildGraph } from './fxNodes.js';

const E = (p) => ({ type: 'emitter', p });
const S = (p) => ({ type: 'shape', p });
const V = (p) => ({ type: 'velocity', p });
const F = (p) => ({ type: 'force', p });
const T = (p) => ({ type: 'turbulence', p });
const C = (p) => ({ type: 'color', p });
const Z = (p) => ({ type: 'size', p });
const R = (p) => ({ type: 'render', p });
const SP = (p) => ({ type: 'spin', p });
const L = (p) => ({ type: 'light', p });
const SC = (p) => ({ type: 'screen', p });

export function builtinLibrary() {
  return [
    buildGraph('slash_arc', '베기 궤적', [
      [E({ burst: 1, lifeMin: 240, lifeMax: 240 }), SP({ rot: 0 }), C({ c0: '#ffffff', c1: '#ffe2a0', c2: '#ff7a2a', a0: 1, a1: 0 }), Z({ s0: 105, s1: 128, stretch: 0 }), R({ mode: 'crescent', blend: 'add', glow: 0.9, arc: 150, thick: 0.2 })],
      [E({ burst: 1, delay: 30, lifeMin: 220, lifeMax: 220 }), SP({ rot: 8 }), C({ c0: '#fff6d8', c1: '#ffb050', c2: '#c03010', a0: 0.6, a1: 0 }), Z({ s0: 92, s1: 116, stretch: 0 }), R({ mode: 'crescent', blend: 'add', glow: 0.4, arc: 120, thick: 0.1 })],
      [E({ burst: 22, lifeMin: 160, lifeMax: 340 }), S({ kind: 'arc', radius: 125, arcStart: -70, arcSweep: 140 }), V({ dir: 'tangent', speedMin: 220, speedMax: 520, spread: 20 }), F({ drag: 3.5 }), C({ c0: '#ffffff', c1: '#ffd27a', c2: '#ff5a1f', a0: 1, a1: 0 }), Z({ s0: 2.6, s1: 0.4, stretch: 0.05 }), R({ mode: 'spark', blend: 'add', glow: 0.6 })],
      [L({ radius: 260, color: '#ffc080', intensity: 0.9, duration: 170 })],
    ], { tag: '근접' }),

    buildGraph('impact_spark', '타격 스파크', [
      [E({ burst: 1, lifeMin: 90, lifeMax: 90 }), C({ c0: '#ffffff', c1: '#fff0c0', c2: '#ffb050', a0: 1, a1: 0 }), Z({ s0: 60, s1: 16 }), R({ mode: 'dot', blend: 'add', glow: 1.2 })],
      [E({ burst: 1, lifeMin: 180, lifeMax: 180 }), C({ c0: '#ffffff', c1: '#ffcf7a', c2: '#ff7030', a0: 0.9, a1: 0 }), Z({ s0: 18, s1: 120 }), R({ mode: 'ring', blend: 'add', glow: 0.3 })],
      [E({ burst: 28, lifeMin: 160, lifeMax: 420 }), V({ dir: 'angle', angle: 0, spread: 110, speedMin: 320, speedMax: 980 }), F({ gravity: 1100, drag: 2 }), C({ c0: '#ffffff', c1: '#ffd36b', c2: '#ff5a1f', a0: 1, a1: 0 }), Z({ s0: 2.8, s1: 0.6, stretch: 0.045 }), R({ mode: 'spark', blend: 'add', glow: 0.5 })],
      [L({ radius: 280, color: '#ffc27a', intensity: 1.1, duration: 130 })],
    ], { tag: '공용' }),

    buildGraph('blood_burst', '혈흔', [
      [E({ burst: 24, lifeMin: 320, lifeMax: 640 }), V({ dir: 'angle', angle: -15, spread: 80, speedMin: 160, speedMax: 520 }), F({ gravity: 1500, drag: 1.2 }), C({ c0: '#d01a24', c1: '#8a0a12', c2: '#4a0006', a0: 1, a1: 0.2 }), Z({ s0: 5, s1: 2.2, stretch: 0.012 }), R({ mode: 'dot', blend: 'normal', glow: 0 })],
      [E({ burst: 5, lifeMin: 420, lifeMax: 700 }), S({ kind: 'circle', radius: 16 }), V({ dir: 'angle', angle: 0, spread: 50, speedMin: 30, speedMax: 110 }), F({ drag: 2 }), C({ c0: '#7a0c14', c1: '#4a080c', c2: '#2a0406', a0: 0.55, a1: 0 }), Z({ s0: 14, s1: 46 }), R({ mode: 'smoke', blend: 'normal', glow: 0 })],
    ], { tag: '공용' }),

    buildGraph('shockwave', '충격파', [
      [E({ burst: 1, lifeMin: 460, lifeMax: 460 }), C({ c0: '#e8fbff', c1: '#7fd0ff', c2: '#2a6dff', a0: 1, a1: 0 }), Z({ s0: 30, s1: 290 }), R({ mode: 'ring', blend: 'add', glow: 0.6 })],
      [E({ burst: 1, delay: 90, lifeMin: 380, lifeMax: 380 }), C({ c0: '#ffffff', c1: '#9fe8ff', c2: '#3a8dff', a0: 0.7, a1: 0 }), Z({ s0: 20, s1: 200 }), R({ mode: 'ring', blend: 'add', glow: 0.4 })],
      [E({ burst: 34, lifeMin: 420, lifeMax: 900 }), S({ kind: 'line', length: 180, angle: 0 }), V({ dir: 'angle', angle: -90, spread: 70, speedMin: 300, speedMax: 820 }), F({ gravity: 1700, drag: 0.6 }), SP({ rotRand: 180, spin: 720 }), C({ c0: '#d8cbb4', c1: '#9a8a74', c2: '#5a4e40', a0: 1, a1: 0.3 }), Z({ s0: 4.5, s1: 3 }), R({ mode: 'dot', blend: 'normal', glow: 0 })],
      [E({ burst: 12, lifeMin: 600, lifeMax: 1100 }), S({ kind: 'line', length: 300, angle: 0 }), V({ dir: 'angle', angle: -90, spread: 40, speedMin: 30, speedMax: 140 }), F({ drag: 1.5, wind: 1 }), C({ c0: '#8a8078', c1: '#6d625a', c2: '#3a342e', a0: 0.5, a1: 0 }), Z({ s0: 30, s1: 110 }), R({ mode: 'smoke', blend: 'normal', glow: 0 })],
      [L({ radius: 420, color: '#7fc8ff', intensity: 1.3, duration: 300 })],
      [SC({ shake: 8, flash: 0.08, flashColor: '#bfe8ff' })],
    ], { tag: '스킬' }),

    buildGraph('charge_glow', '기 모으기', [
      [E({ burst: 0, rate: 90, duration: 420, lifeMin: 220, lifeMax: 320 }), S({ kind: 'ring', radius: 95 }), V({ dir: 'inward', speedMin: 260, speedMax: 420, spread: 0 }), C({ c0: '#e8ffff', c1: '#6fe0ff', c2: '#2a7dff', a0: 0, a1: 1 }), Z({ s0: 1.2, s1: 3.2, stretch: 0.04 }), R({ mode: 'spark', blend: 'add', glow: 0.6 })],
      [E({ burst: 1, lifeMin: 520, lifeMax: 520 }), C({ c0: '#bff6ff', c1: '#6fd8ff', c2: '#ffffff', a0: 0.2, a1: 0 }), Z({ s0: 16, s1: 60 }), R({ mode: 'dot', blend: 'add', glow: 1.5 })],
      [L({ radius: 220, color: '#6fd0ff', intensity: 0.9, duration: 460, flicker: 0.25 })],
    ], { tag: '스킬' }),

    buildGraph('muzzle_flash', '총구 화염', [
      [E({ burst: 1, lifeMin: 70, lifeMax: 70 }), SP({ rot: 0 }), C({ c0: '#ffffff', c1: '#ffe07a', c2: '#ff8a1a', a0: 1, a1: 0 }), Z({ s0: 58, s1: 30 }), R({ mode: 'crescent', blend: 'add', glow: 1.2, arc: 70 })],
      [E({ burst: 12, lifeMin: 50, lifeMax: 120 }), V({ dir: 'angle', angle: 0, spread: 30, speedMin: 700, speedMax: 1500 }), C({ c0: '#fff4c0', c1: '#ffb040', c2: '#ff6010', a0: 1, a1: 0 }), Z({ s0: 2.2, s1: 0.5, stretch: 0.03 }), R({ mode: 'spark', blend: 'add', glow: 0.4 })],
      [E({ burst: 6, lifeMin: 350, lifeMax: 650 }), V({ dir: 'angle', angle: -10, spread: 40, speedMin: 40, speedMax: 140 }), F({ drag: 1.6, gravity: -60, wind: 1 }), C({ c0: '#b0aaa0', c1: '#7a7670', c2: '#3a3836', a0: 0.4, a1: 0 }), Z({ s0: 10, s1: 42 }), R({ mode: 'smoke', blend: 'normal', glow: 0 })],
      [L({ radius: 320, color: '#ffcf80', intensity: 1.4, duration: 70 })],
    ], { tag: '원거리' }),

    buildGraph('tracer', '예광탄', [
      [E({ burst: 1, lifeMin: 120, lifeMax: 120 }), V({ dir: 'angle', angle: 0, spread: 0, speedMin: 4200, speedMax: 4200 }), C({ c0: '#ffffff', c1: '#ffe39a', c2: '#ff9a3a', a0: 1, a1: 0.4 }), Z({ s0: 3, s1: 2, stretch: 0.045 }), R({ mode: 'streak', blend: 'add', glow: 0.8 })],
    ], { tag: '원거리' }),

    buildGraph('dust_puff', '흙먼지', [
      [E({ burst: 10, lifeMin: 380, lifeMax: 680 }), S({ kind: 'line', length: 70, angle: 0 }), V({ dir: 'angle', angle: -160, spread: 40, speedMin: 60, speedMax: 240 }), F({ drag: 3, gravity: -40, wind: 1 }), C({ c0: '#9a8d7c', c1: '#7a6e60', c2: '#4a4238', a0: 0.55, a1: 0 }), Z({ s0: 12, s1: 48 }), R({ mode: 'smoke', blend: 'normal', glow: 0 })],
    ], { tag: '이동' }),

    buildGraph('dash_slash', '돌진 베기', [
      [E({ burst: 16, lifeMin: 120, lifeMax: 260 }), S({ kind: 'box', length: 260, radius: 70 }), V({ dir: 'angle', angle: 0, spread: 4, speedMin: 900, speedMax: 1700 }), F({ drag: 6 }), C({ c0: '#f0fcff', c1: '#8fd8ff', c2: '#3a7dff', a0: 0.9, a1: 0 }), Z({ s0: 2.2, s1: 0.3, stretch: 0.06 }), R({ mode: 'streak', blend: 'add', glow: 0.5 })],
      [E({ burst: 1, delay: 40, lifeMin: 220, lifeMax: 220 }), SP({ rot: 0 }), C({ c0: '#ffffff', c1: '#aee6ff', c2: '#3a7dff', a0: 1, a1: 0 }), Z({ s0: 150, s1: 185 }), R({ mode: 'crescent', blend: 'add', glow: 1, arc: 110 })],
      [L({ radius: 300, color: '#8fd8ff', intensity: 1.1, duration: 180 })],
    ], { tag: '이동' }),

    buildGraph('claw_rake', '할퀴기', [
      [E({ burst: 3, lifeMin: 240, lifeMax: 260 }), S({ kind: 'line', length: 70, angle: 90 }), SP({ rot: 25 }), C({ c0: '#ffe6e6', c1: '#ff5a5a', c2: '#7a0010', a0: 1, a1: 0 }), Z({ s0: 70, s1: 86 }), R({ mode: 'crescent', blend: 'add', glow: 0.7, arc: 80 })],
      [E({ burst: 14, lifeMin: 160, lifeMax: 320 }), V({ dir: 'angle', angle: 180, spread: 80, speedMin: 200, speedMax: 600 }), F({ gravity: 900, drag: 2 }), C({ c0: '#ffffff', c1: '#ff8080', c2: '#a01020', a0: 1, a1: 0 }), Z({ s0: 2.4, s1: 0.4, stretch: 0.04 }), R({ mode: 'spark', blend: 'add', glow: 0.4 })],
      [L({ radius: 220, color: '#ff6060', intensity: 0.8, duration: 140 })],
    ], { tag: '적' }),

    buildGraph('acid_splash', '산성 튀김', [
      [E({ burst: 26, lifeMin: 300, lifeMax: 700 }), V({ dir: 'angle', angle: -90, spread: 150, speedMin: 120, speedMax: 520 }), F({ gravity: 1300, drag: 1 }), C({ c0: '#e8ff9a', c1: '#8aff3a', c2: '#2a7a10', a0: 1, a1: 0.2 }), Z({ s0: 5, s1: 2.5 }), R({ mode: 'dot', blend: 'add', glow: 0.8 })],
      [E({ burst: 8, lifeMin: 600, lifeMax: 1100 }), S({ kind: 'circle', radius: 30 }), V({ dir: 'angle', angle: -90, spread: 60, speedMin: 20, speedMax: 80 }), T({ amp: 120, freq: 3 }), C({ c0: '#9aff5a', c1: '#5ac03a', c2: '#2a5a1a', a0: 0.4, a1: 0 }), Z({ s0: 16, s1: 60 }), R({ mode: 'smoke', blend: 'add', glow: 0 })],
      [L({ radius: 260, color: '#8aff4a', intensity: 0.9, duration: 360, flicker: 0.3 })],
    ], { tag: '적' }),
  ];
}

// 현재 게임 PNG 오버레이 (개선 전 비교용, 노드 아님)
export const LEGACY_FX = {
  legacy_slash: { img: 'slash' },
  legacy_impact: { img: 'impact' },
  legacy_claw: { img: 'claw' },
  legacy_shot: { img: 'shot' },
  legacy_acid: { img: 'acid' },
  legacy_muzzle: { emoji: '💥' },
};
