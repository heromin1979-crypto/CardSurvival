import { describe, it, expect } from 'vitest';
import { loadCombatMotionLibrary, MOTION_LIBRARY_URL } from '../../js/ui/combat/motionLibraryLoader.js';
import { COMBAT_SPRITE_SHEETS } from '../../js/ui/combat/combatUiAssets.js';

describe('motionLibraryLoader', () => {
  it('fetch 성공 시 라이브러리를 COMBAT_SPRITE_SHEETS에 적용한다', async () => {
    const frameDur = [[120, 120, 120, 120, 120, 300]];
    const library = { 'doctor_f_sheet.png': { cols: 6, rows: 8, frameDur } };
    const fetchImpl = async (url) => {
      expect(url).toBe(MOTION_LIBRARY_URL);
      return { ok: true, json: async () => library };
    };
    const result = await loadCombatMotionLibrary(fetchImpl);
    expect(result.ok).toBe(true);
    expect(COMBAT_SPRITE_SHEETS.doctor_f.frameDur).toEqual(frameDur);
  });

  it('HTTP 실패(404) 시 기본값을 유지하고 ok:false를 반환한다', async () => {
    const before = COMBAT_SPRITE_SHEETS.soldier_m.cols;
    const result = await loadCombatMotionLibrary(async () => ({ ok: false, status: 404 }));
    expect(result.ok).toBe(false);
    expect(COMBAT_SPRITE_SHEETS.soldier_m.cols).toBe(before);
  });

  it('fetch 예외를 삼키고 ok:false를 반환한다 (부팅 비차단)', async () => {
    const result = await loadCombatMotionLibrary(async () => { throw new Error('network down'); });
    expect(result.ok).toBe(false);
  });

  it('fetch 미지원 환경이면 ok:false를 반환한다', async () => {
    const result = await loadCombatMotionLibrary(null);
    expect(result.ok).toBe(false);
  });
});
