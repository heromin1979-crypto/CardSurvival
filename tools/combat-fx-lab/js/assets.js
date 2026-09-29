// 에셋 로더 — 게임의 실제 매니페스트/이미지를 그대로 사용한다 (serve.js 루트 기준 절대 경로)
const cache = new Map();

export function img(src) {
  let im = cache.get(src);
  if (!im) {
    im = new Image();
    im.decoding = 'async';
    im.src = src;
    cache.set(src, im);
  }
  return im;
}

export function imgReady(src) {
  const im = img(src);
  if (im.complete && im.naturalWidth) return Promise.resolve(im);
  return new Promise((res) => {
    im.addEventListener('load', () => res(im), { once: true });
    im.addEventListener('error', () => res(im), { once: true });
  });
}

export const FX_SPRITES = {
  slash: '/assets/images/fx/combat_fx_slash_v1.png',
  impact: '/assets/images/fx/combat_fx_impact_v1.png',
  claw: '/assets/images/fx/combat_fx_claw_v1.png',
  shot: '/assets/images/fx/combat_fx_shot_v1.png',
  acid: '/assets/images/fx/combat_fx_acid_v1.png',
};

export function fxSpriteMap() {
  const out = {};
  for (const [k, src] of Object.entries(FX_SPRITES)) out[k] = img(src);
  return out;
}

export async function loadManifest() {
  const res = await fetch('/assets/images/combat/spritesheets/manifest.json');
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  return res.json();
}

const PLAYER_KEYS = ['soldier_m', 'doctor_f', 'firefighter_m', 'homeless_m', 'chef_m', 'engineer_m'];

export function classifySheets(manifest) {
  const players = [];
  const companions = [];
  const enemies = [];
  for (const key of Object.keys(manifest)) {
    if (PLAYER_KEYS.includes(key)) players.push(key);
    else if (key.endsWith('_companion')) companions.push(key);
    else enemies.push(key);
  }
  return { players, companions, enemies };
}
