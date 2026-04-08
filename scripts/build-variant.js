#!/usr/bin/env node
/**
 * build-variant.js
 * PC / 모바일 버전 빌드 스크립트
 * package.json을 임시 수정 → 빌드 → 복원 방식으로 winCodeSign 캐시 재사용
 *
 * 사용법:
 *   node scripts/build-variant.js pc
 *   node scripts/build-variant.js mobile
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const variant = process.argv[2];
if (variant !== 'pc' && variant !== 'mobile') {
  console.error('사용법: node scripts/build-variant.js [pc|mobile]');
  process.exit(1);
}

const pkgPath = path.join(__dirname, '..', 'package.json');
const original = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(original);

// ── 변형별 설정 ─────────────────────────────────────────
const VARIANTS = {
  pc: {
    main:         'electron-main-pc.js',
    output:       'dist/pc',
    artifactName: 'CardSurvival-RuinedCity-PC.exe',
    productName:  'Card Survival Ruined City',
  },
  mobile: {
    main:         'electron-main-mobile.js',
    output:       'dist/mobile',
    artifactName: 'CardSurvival-RuinedCity-Mobile.exe',
    productName:  'Card Survival Ruined City Mobile',
  },
};

const cfg = VARIANTS[variant];
console.log(`\n▶ ${variant.toUpperCase()} 빌드 시작: ${cfg.artifactName}\n`);

// ── package.json 임시 수정 ───────────────────────────────
pkg.main                            = cfg.main;
pkg.build.productName               = cfg.productName;
pkg.build.directories.output        = cfg.output;
pkg.build.portable.artifactName     = cfg.artifactName;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// ── 빌드 실행 ───────────────────────────────────────────
let exitCode = 0;
try {
  execSync('npx electron-builder --win portable --x64', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  console.log(`\n✓ 빌드 완료: ${cfg.output}/${cfg.artifactName}`);
} catch (err) {
  exitCode = err.status || 1;
  console.error(`\n✗ 빌드 실패 (exit ${exitCode})`);
} finally {
  // ── 원본 복원 ─────────────────────────────────────────
  fs.writeFileSync(pkgPath, original);
  console.log('  package.json 원본 복원 완료');
}

process.exit(exitCode);
