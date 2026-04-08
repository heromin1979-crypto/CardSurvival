import { defineConfig } from 'vite';
import { webfontDownload } from 'vite-plugin-webfont-dl';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Vite 설정 — Capacitor 모바일 빌드 전용
 *
 * 용도:
 *   npm run build:web  → dist-web/ 생성 → Capacitor(Android/iOS)에서 사용
 *
 * Electron 빌드는 기존 스크립트(build:pc / build:mobile)를 사용하며
 * Vite를 거치지 않습니다.
 */

/** assets/images/ → dist-web/assets/images/ 복사 플러그인
 *  (JS 문자열로 참조된 이미지는 Vite가 자동 번들하지 않으므로 직접 복사)
 */
function copyGameImages() {
  function copyDir(src, dest) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      const srcPath  = join(src, entry);
      const destPath = join(dest, entry);
      if (statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }

  return {
    name: 'copy-game-images',
    closeBundle() {
      const src  = resolve('assets/images');
      const dest = resolve('dist-web/assets/images');
      if (existsSync(src)) {
        copyDir(src, dest);
        console.log('[copy-game-images] assets/images → dist-web/assets/images 복사 완료');
      }
    },
  };
}

export default defineConfig({
  // index.html이 프로젝트 루트에 있으므로 root는 기본값('.')
  root: '.',

  build: {
    // Capacitor가 읽는 디렉터리 (dist/ 와 충돌하지 않도록 dist-web/ 사용)
    outDir: 'dist-web',
    emptyOutDir: true,
    assetsDir: 'assets',

    rollupOptions: {
      input: 'index.html',
    },

    // 모바일 타깃: 코드 분할 최소화 (WebView 네트워크 요청 감소)
    chunkSizeWarningLimit: 2000,
  },

  plugins: [
    // Google Fonts를 빌드 시 로컬에 내장
    // → 오프라인/인트라넷 환경, 개인정보 규정(GDPR) 대응
    webfontDownload(),
    // 이미지 폴더 dist-web으로 복사
    copyGameImages(),
  ],

  // 개발 서버 (npm run dev:web)
  server: {
    port: 5173,
    open: true,
  },
});
