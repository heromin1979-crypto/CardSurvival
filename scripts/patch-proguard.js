/**
 * patch-proguard.js
 * npm install 후 자동 실행 (postinstall)
 *
 * node_modules 내 Capacitor 플러그인의 build.gradle에서
 * 더 이상 지원되지 않는 'proguard-android.txt'를
 * 'proguard-android-optimize.txt'로 패치한다.
 */

const { readdirSync, readFileSync, writeFileSync, statSync } = require('fs');
const { join } = require('path');

const OLD = "getDefaultProguardFile('proguard-android.txt')";
const NEW = "getDefaultProguardFile('proguard-android-optimize.txt')";

function walk(dir) {
  let results = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      try {
        const st = statSync(full);
        if (st.isDirectory()) {
          results = results.concat(walk(full));
        } else if (entry === 'build.gradle') {
          results.push(full);
        }
      } catch (_) {}
    }
  } catch (_) {}
  return results;
}

const nodeModules = join(__dirname, '..', 'node_modules');
const gradleFiles = walk(nodeModules);
let patchCount = 0;

for (const file of gradleFiles) {
  try {
    const content = readFileSync(file, 'utf8');
    if (content.includes(OLD)) {
      writeFileSync(file, content.replaceAll(OLD, NEW), 'utf8');
      console.log(`[patch-proguard] 패치: ${file.replace(nodeModules, 'node_modules')}`);
      patchCount++;
    }
  } catch (_) {}
}

if (patchCount === 0) {
  console.log('[patch-proguard] 패치할 파일 없음 (이미 최신)');
} else {
  console.log(`[patch-proguard] ${patchCount}개 파일 패치 완료`);
}
