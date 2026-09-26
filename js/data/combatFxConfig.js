// 전투 연출 설정 — tools/combat-fx-lab 에서 전/후 비교로 확정한 값.
// 랩의 ⑧ 타격감 "개선안" 프리셋(1280×720 무대 기준)을 게임 전장(1920 기준 레이아웃)에 맞게 1.3배 한 거리값.
// 바꿀 때는 랩에서 먼저 비교하고 이 표만 고친다.

export const COMBAT_FEEL = Object.freeze({
  // 현재 게임(개선 전): hitstop 70 / crit 120, 흔들림 치명·처치만 7px 400ms
  legacy: Object.freeze({
    hitstop: 70, critHitstop: 120, shake: 0, critShake: 7, shakeMs: 400, shakeEveryHit: false,
    knockback: 0, recoil: 0, hitFlashMs: 0, targetJitter: 0, zoomPunch: 0, afterimage: false,
  }),
  enhanced: Object.freeze({
    hitstop: 90, critHitstop: 160,
    targetJitter: 4, // 정지 중 맞은 쪽만 떨림(px)
    knockback: 36, recoil: 14, // 정지가 풀린 뒤 튕김 / 공격자 반동(px)
    shake: 6, critShake: 16, shakeMs: 260, shakeEveryHit: true,
    hitFlashMs: 90, // 피격 흰 섬광
    zoomPunch: 0.035, // 치명 줌 펀치(배율)
    afterimage: true, ghostCount: 5, ghostInterval: 36, ghostFade: 240, ghostTint: '#7fd4ff',
    killSlowmo: 0.3, killSlowmoMs: 320, // 처치 순간 슬로모션(배속·길이)
  }),
});

// 캐릭터별 이펙트 부착점 보정 — 스프라이트 시트 키 → 소켓 [가로(바라보는 방향 +), 세로(머리 0 ~ 발 1)] 비율.
// 비어 있으면 CombatFxCanvas 기본값을 쓴다. 무기가 긴 캐릭터·체구가 큰 보스처럼 어긋나 보일 때만 추가.
export const SOCKET_OVERRIDES = Object.freeze({
  soldier_m: { weapon: [0.3, 0.45] },
  soldier_companion: { weapon: [0.3, 0.45] },
});

// 게임의 fx 오버레이 키(normalizeFxOverlay 결과) → 캔버스 파티클 이펙트 id (js/ui/combat/fx/fxLibrary.js)
// dx: 공격 방향 반대쪽으로 당기는 비율(대상 키 대비). 없는 키는 기존 PNG 오버레이만 쓴다.
export const FX_PARTICLE_MAP = Object.freeze({
  slash: [{ id: 'slash_arc', dx: -0.18, rot: -20 }, { id: 'blood_burst' }],
  blunt: [{ id: 'impact_spark', power: 1.1 }],
  punch: [{ id: 'impact_spark', power: 0.8 }],
  slam: [{ id: 'impact_spark', power: 1.3 }, { id: 'shockwave', socket: 'feet', power: 0.8 }],
  shot: [{ id: 'impact_spark', power: 0.9 }, { id: 'blood_burst', power: 0.8 }],
  claw: [{ id: 'claw_rake', dx: -0.1 }, { id: 'blood_burst' }],
  acid: [{ id: 'acid_splash' }],
  rupture: [{ id: 'blood_burst', power: 1.3 }, { id: 'impact_spark', power: 0.8 }],
  blast: [{ id: 'shockwave', socket: 'feet' }, { id: 'impact_spark', power: 1.2 }],
  explode: [{ id: 'shockwave', socket: 'feet', power: 1.2 }, { id: 'impact_spark', power: 1.4 }],
  fire: [{ id: 'impact_spark' }],
  shock: [{ id: 'shockwave', socket: 'feet' }],
  spark: [{ id: 'impact_spark', power: 0.8 }],
  scream: [{ id: 'shockwave', power: 0.8 }],
  skill: [{ id: 'charge_glow', power: 0.8 }],
  muzzle: [{ id: 'muzzle_flash', socket: 'weapon', self: true }],
  'death-burst': [{ id: 'blood_burst', power: 1.4 }, { id: 'dust_puff', socket: 'feet' }],
});

// 캐릭터 바인딩(발동 단계) — 명중 전 공격자 쪽 연출. 랩 ⑦ 기본값.
export const ACTION_BINDINGS = Object.freeze({
  meleeApproach: [{ id: 'dust_puff', socket: 'feet', at: 0 }],
  skillCast: [{ id: 'charge_glow', socket: 'hand', at: 0 }],
});

export const COMBAT_FX_QUALITY = 1; // 파티클 밀도 (저사양 0.5)
