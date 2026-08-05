const fs = require('node:fs');
const path = require('node:path');

const LIBRARY_FILENAME = 'motionLibrary.json';

// 에디터가 저장하는 시트 메타(cols/rows/rowFrames/frameDur)를 시트 파일명 키로 병합 기록한다.
// manifest.json은 export_combat_motion_manifest.mjs --check의 drift 검사 대상이라 별도 파일을 쓴다.
function mergeMotionLibrary(sheetDir, targetPngPath, meta) {
  if (!meta || !(Number(meta.cols) > 0)) return null;
  const libraryPath = path.join(sheetDir, LIBRARY_FILENAME);
  let library = {};
  try { library = JSON.parse(fs.readFileSync(libraryPath, 'utf8')); } catch (e) { /* 신규 파일 */ }
  const name = path.basename(targetPngPath).replace(/_src\.png$/i, '.png');
  library[name] = {
    cols: Number(meta.cols),
    rows: Number(meta.rows) || 4,
    ...(Array.isArray(meta.rowFrames) ? { rowFrames: meta.rowFrames } : {}),
    ...(Array.isArray(meta.frameDur) ? { frameDur: meta.frameDur } : {}),
  };
  fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2));
  return { libraryPath, name, entry: library[name] };
}

module.exports = { mergeMotionLibrary, LIBRARY_FILENAME };
