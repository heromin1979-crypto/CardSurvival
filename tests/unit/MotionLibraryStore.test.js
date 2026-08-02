import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { mergeMotionLibrary, LIBRARY_FILENAME } from '../../tools/motionLibraryStore.cjs';

describe('motionLibraryStore', () => {
  let sheetDir;
  beforeEach(() => { sheetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'motionlib-')); });
  afterEach(() => { fs.rmSync(sheetDir, { recursive: true, force: true }); });

  it('meta가 없거나 cols가 0이면 null을 반환하고 파일을 만들지 않는다', () => {
    expect(mergeMotionLibrary(sheetDir, path.join(sheetDir, 'a_sheet.png'), null)).toBeNull();
    expect(mergeMotionLibrary(sheetDir, path.join(sheetDir, 'a_sheet.png'), { cols: 0 })).toBeNull();
    expect(fs.existsSync(path.join(sheetDir, LIBRARY_FILENAME))).toBe(false);
  });

  it('cols/rows/rowFrames/frameDur를 시트 파일명 키로 기록한다', () => {
    const meta = { cols: 6, rows: 4, rowFrames: [6, 6, 4, 5], frameDur: [[100, 100, 100, 100, 100, 100]] };
    const result = mergeMotionLibrary(sheetDir, path.join(sheetDir, 'zombie_sheet.png'), meta);
    expect(result.name).toBe('zombie_sheet.png');
    const saved = JSON.parse(fs.readFileSync(path.join(sheetDir, LIBRARY_FILENAME), 'utf8'));
    expect(saved['zombie_sheet.png']).toEqual({
      cols: 6, rows: 4, rowFrames: [6, 6, 4, 5], frameDur: [[100, 100, 100, 100, 100, 100]],
    });
  });

  it('_src.png 저장도 게임 시트 파일명 키로 정규화한다', () => {
    const result = mergeMotionLibrary(sheetDir, path.join(sheetDir, 'doctor_f_sheet_src.png'), { cols: 6, rows: 8 });
    expect(result.name).toBe('doctor_f_sheet.png');
  });

  it('기존 항목을 보존하며 병합하고 manifest.json은 만들지 않는다', () => {
    mergeMotionLibrary(sheetDir, path.join(sheetDir, 'a_sheet.png'), { cols: 6, rows: 4 });
    mergeMotionLibrary(sheetDir, path.join(sheetDir, 'b_sheet.png'), { cols: 5, rows: 8 });
    const saved = JSON.parse(fs.readFileSync(path.join(sheetDir, LIBRARY_FILENAME), 'utf8'));
    expect(Object.keys(saved).sort()).toEqual(['a_sheet.png', 'b_sheet.png']);
    expect(fs.existsSync(path.join(sheetDir, 'manifest.json'))).toBe(false);
  });
});
