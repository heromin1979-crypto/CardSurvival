// 전투 FX 랩 — 기준선(현재 게임) / 개선안 프리셋
// BASELINE 값은 실제 게임 코드에서 가져온 수치다.
//   - 히트스톱 70ms / 치명 120ms          : js/ui/combat/CombatFxPlayer.js _hitstop()
//   - 흔들림 400ms · 7px, 치명·처치에만   : css/screens-combat.css visualShake / _shakeVisual()
//   - 이펙트 = PNG 오버레이 700ms         : _spawnFxOverlay() + assets/images/fx/*.png
//   - 배경 = 단일 이미지 + CSS 그라데이션  : .combat-battlefield::before/::after
//   - 날씨 = 상단 칩 텍스트만 (시각 연출 없음) : CombatUI.js `ctb-chip 날씨`

export const SECTIONS = {
  bg: '배경',
  env: '날씨·광원',
  fx: '전투 이펙트',
  bind: '캐릭터 바인딩',
  feel: '타격감',
};

export const BACKDROPS = {
  jongno: {
    label: '종로 지하철 (실내)',
    src: '/assets/images/combat_jongno_subway_clean_v2.png',
    indoor: true,
    horizon: 0.5,
    shafts: [0.2, 0.61],
    fire: { x: 0.845, y: 0.62 },
    emergency: { x: 0.9, y: 0.16 },
  },
  overpass: {
    label: '고가 선로 (실외)',
    src: '/assets/images/battle_bg.jpg',
    indoor: false,
    horizon: 0.36,
    focusY: 0.42,
    shafts: [],
    fire: { x: 0.12, y: 0.74 },
    emergency: null,
  },
};

// ── 캐릭터 바인딩(공격·스킬·대시) ─────────────────────────────
// t = 모션 진행률(0~1). socket = 이펙트 부착 지점.
export const ACTIONS = {
  attack: { label: '공격', key: '1' },
  skill: { label: '스킬', key: '2' },
  dash: { label: '대시', key: '3' },
  ranged: { label: '사격', key: '4' },
  enemy: { label: '적 공격', key: '5' },
};

export const IMPROVED_BINDINGS = {
  attack: {
    actor: 'player', motion: 'melee', target: 'enemy',
    loco: { kind: 'approach', outEnd: 0.36, holdEnd: 0.72, gap: 150 },
    events: [
      { t: 0.02, type: 'trail', until: 0.42 },
      { t: 0.05, type: 'fx', fx: 'dust_puff', socket: 'feet', rot: 0, scale: 1 },
      { t: 0.44, type: 'fx', fx: 'slash_arc', socket: 'weapon', rot: -20, scale: 1 },
      { t: 0.5, type: 'hit', fx: ['impact_spark', 'blood_burst'], power: 1 },
    ],
  },
  skill: {
    actor: 'player', motion: 'support', target: 'enemy',
    loco: { kind: 'stationary' },
    events: [
      { t: 0.04, type: 'fx', fx: 'charge_glow', socket: 'hand', rot: 0, scale: 1 },
      { t: 0.55, type: 'fx', fx: 'shockwave', socket: 'target_feet', rot: 0, scale: 1 },
      { t: 0.58, type: 'hit', fx: ['impact_spark'], power: 1.6 },
    ],
  },
  dash: {
    actor: 'player', motion: 'move', target: 'enemy',
    loco: { kind: 'approach', outEnd: 0.26, holdEnd: 0.6, gap: 90 },
    events: [
      { t: 0.0, type: 'trail', until: 0.72 },
      { t: 0.02, type: 'fx', fx: 'dust_puff', socket: 'feet', rot: 0, scale: 1.3 },
      { t: 0.24, type: 'fx', fx: 'dash_slash', socket: 'center', rot: 0, scale: 1 },
      { t: 0.3, type: 'hit', fx: ['impact_spark', 'blood_burst'], power: 1.2 },
    ],
  },
  ranged: {
    actor: 'player', motion: 'ranged', target: 'enemy',
    loco: { kind: 'stationary' },
    events: [
      { t: 0.34, type: 'fx', fx: 'muzzle_flash', socket: 'weapon', rot: 0, scale: 1 },
      { t: 0.34, type: 'fx', fx: 'tracer', socket: 'weapon', rot: 0, scale: 1 },
      { t: 0.38, type: 'hit', fx: ['impact_spark', 'blood_burst'], power: 0.9 },
    ],
  },
  enemy: {
    actor: 'enemy', motion: 'attack', target: 'player',
    loco: { kind: 'approach', outEnd: 0.4, holdEnd: 0.72, gap: 160 },
    events: [
      { t: 0.48, type: 'fx', fx: 'claw_rake', socket: 'target_center', rot: 0, scale: 1 },
      { t: 0.52, type: 'hit', fx: ['blood_burst'], power: 1 },
    ],
  },
};

// 현재 게임: 명중 순간 대상 위에 PNG 한 장. 발동/돌진 단계 연출 없음.
export const LEGACY_BINDINGS = {
  attack: {
    actor: 'player', motion: 'melee', target: 'enemy',
    loco: { kind: 'approach', outEnd: 0.4, holdEnd: 0.7, gap: 190 },
    events: [{ t: 0.5, type: 'hit', fx: ['legacy_slash'], power: 1 }],
  },
  skill: {
    actor: 'player', motion: 'support', target: 'enemy',
    loco: { kind: 'stationary' },
    events: [{ t: 0.58, type: 'hit', fx: ['legacy_impact'], power: 1.6 }],
  },
  dash: {
    actor: 'player', motion: 'move', target: 'enemy',
    loco: { kind: 'approach', outEnd: 0.4, holdEnd: 0.6, gap: 190 },
    events: [{ t: 0.4, type: 'hit', fx: ['legacy_impact'], power: 1.2 }],
  },
  ranged: {
    actor: 'player', motion: 'ranged', target: 'enemy',
    loco: { kind: 'stationary' },
    events: [
      { t: 0.34, type: 'fx', fx: 'legacy_muzzle', socket: 'weapon', rot: 0, scale: 1 },
      { t: 0.38, type: 'hit', fx: ['legacy_shot'], power: 0.9 },
    ],
  },
  enemy: {
    actor: 'enemy', motion: 'attack', target: 'player',
    loco: { kind: 'approach', outEnd: 0.4, holdEnd: 0.72, gap: 190 },
    events: [{ t: 0.52, type: 'hit', fx: ['legacy_claw'], power: 1 }],
  },
};

export const BASELINE = {
  bg: {
    layered: false, legacyOverlay: true, parallax: 0, dof: 0, grade: 0,
    fog: 0, dust: false, contactShadow: false, rimLight: 0, vignette: 0, wetFloor: 0, shafts: 0,
  },
  env: {
    enabled: false, weather: 'sunny', intensity: 0.7, wind: 0.25, time: 'night',
    flashlight: false, fire: false, emergency: false, lightning: true, dynamicLights: false, actorKey: 0,
  },
  fx: { mode: 'legacy', dmgNumbers: 'plain', quality: 1 },
  bind: LEGACY_BINDINGS,
  feel: {
    hitstop: 70, critHitstop: 120, targetJitter: 0,
    shake: 7, critShake: 7, shakeMs: 400, shakeEveryHit: false,
    knockback: 6, recoil: 0, hitFlashMs: 0,
    afterimage: false, ghostCount: 5, ghostInterval: 35, ghostFade: 220, ghostTint: '#7fd4ff',
    zoomPunch: 0, killSlowmo: 1, killSlowmoMs: 0, critFlash: true,
  },
};

export const IMPROVED = {
  bg: {
    layered: true, legacyOverlay: false, parallax: 0.6, dof: 2.5, grade: 0.6,
    fog: 0.35, dust: true, contactShadow: true, rimLight: 0.55, vignette: 0.55, wetFloor: 0.5, shafts: 0.6,
  },
  env: {
    enabled: true, weather: 'rainy', intensity: 0.7, wind: 0.25, time: 'dusk',
    flashlight: true, fire: true, emergency: true, lightning: true, dynamicLights: true, actorKey: 0.5,
  },
  fx: { mode: 'particle', dmgNumbers: 'pop', quality: 1 },
  bind: IMPROVED_BINDINGS,
  feel: {
    hitstop: 90, critHitstop: 160, targetJitter: 4,
    shake: 6, critShake: 16, shakeMs: 260, shakeEveryHit: true,
    knockback: 28, recoil: 12, hitFlashMs: 90,
    afterimage: true, ghostCount: 6, ghostInterval: 32, ghostFade: 240, ghostTint: '#7fd4ff',
    zoomPunch: 0.045, killSlowmo: 0.3, killSlowmoMs: 320, critFlash: true,
  },
};

export const clone = (o) => JSON.parse(JSON.stringify(o));

// 기존 이펙트 모드(legacy)일 때 신규 이펙트 id → 현재 게임의 PNG 오버레이로 치환
export const LEGACY_FX_MAP = {
  slash_arc: 'legacy_slash', dash_slash: 'legacy_slash', claw_rake: 'legacy_claw',
  impact_spark: 'legacy_impact', shockwave: 'legacy_impact', muzzle_flash: 'legacy_muzzle',
  acid_splash: 'legacy_acid',
};

export const WEATHERS = [
  { id: 'sunny', name: '맑음', season: '공통' },
  { id: 'cloudy', name: '흐림', season: '봄·가을' },
  { id: 'rainy', name: '비', season: '봄' },
  { id: 'foggy', name: '안개', season: '봄·가을' },
  { id: 'hot', name: '폭염', season: '여름' },
  { id: 'storm', name: '폭풍', season: '여름' },
  { id: 'monsoon', name: '장마', season: '여름' },
  { id: 'windy', name: '바람', season: '가을' },
  { id: 'acid_rain', name: '산성비', season: '가을' },
  { id: 'clear', name: '맑고 추움', season: '겨울' },
  { id: 'snow', name: '눈', season: '겨울' },
  { id: 'blizzard', name: '폭설', season: '겨울' },
  { id: 'overcast', name: '흐림(겨울)', season: '겨울' },
];

export const TIMES = { day: '낮', dusk: '황혼', night: '밤' };
