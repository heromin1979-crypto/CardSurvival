import { applyCombatSpriteManifest } from './combatUiAssets.js';

// 모든 배포 환경(Electron 로컬 HTTP·Vite dev·Capacitor)이 HTTP 기반이라 상대경로 fetch가 동작한다.
export const MOTION_LIBRARY_URL = 'assets/images/combat/spritesheets/motionLibrary.json';

// 에디터가 저장한 모션 오버라이드를 부팅 시 1회 적용한다.
// 파일 없음·네트워크 오류·검증 실패 모두 조용히 기본값(JS 레지스트리)으로 폴백한다.
export async function loadCombatMotionLibrary(fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') return { ok: false, reason: 'no-fetch' };
  try {
    const res = await fetchImpl(MOTION_LIBRARY_URL, { cache: 'no-cache' });
    if (!res || !res.ok) return { ok: false, reason: 'http' };
    const library = await res.json();
    const applied = applyCombatSpriteManifest(library);
    if (!applied.ok) return { ok: false, reason: 'invalid', errors: applied.errors };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}
