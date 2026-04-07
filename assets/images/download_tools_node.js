#!/usr/bin/env node
/**
 * 사용법:
 *   node download_tools_node.js "COOKIE_STRING"
 *
 * 쿠키 얻는 방법:
 *   1. genspark.ai 에 로그인
 *   2. F12 → Network 탭 → 아무 요청 클릭
 *   3. Request Headers 에서 "cookie:" 값 전체 복사
 *   4. 위 명령어에 붙여넣기 (큰따옴표로 감싸기)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const COOKIE = process.argv[2] || '';
if (!COOKIE) {
  console.error('쿠키가 필요합니다. 사용법: node download_tools_node.js "your_cookie_here"');
  process.exit(1);
}

const OUT_DIR = path.join(__dirname, 'tools');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const FILES = [
  // 기본 도구
  { url: 'https://www.genspark.ai/api/files/s/wNB5ZMvx?cache_control=3600', name: 'flashlight.png' },
  { url: 'https://www.genspark.ai/api/files/s/2YZbBguo?cache_control=3600', name: 'compass.png' },
  { url: 'https://www.genspark.ai/api/files/s/YpYB7WhE?cache_control=3600', name: 'fishing_rod.png' },
  { url: 'https://www.genspark.ai/api/files/s/CvoD6rBb?cache_control=3600', name: 'binoculars.png' },
  { url: 'https://www.genspark.ai/api/files/s/T2E2h6Bt?cache_control=3600', name: 'lockpick.png' },
  { url: 'https://www.genspark.ai/api/files/s/Z4Z9dyBm?cache_control=3600', name: 'lighter.png' },
  { url: 'https://www.genspark.ai/api/files/s/fUTWm8V4?cache_control=3600', name: 'oil_lamp.png' },
  { url: 'https://www.genspark.ai/api/files/s/ioLSeSzd?cache_control=3600', name: 'crowbar.png' },
  { url: 'https://www.genspark.ai/api/files/s/ZAt0mB5K?cache_control=3600', name: 'pipe_wrench.png' },
  { url: 'https://www.genspark.ai/api/files/s/fFLe14p6?cache_control=3600', name: 'whetstone.png' },
  // 통신/탐색 장비
  { url: 'https://www.genspark.ai/api/files/s/kTr0hEKe?cache_control=3600', name: 'radio.png' },
  { url: 'https://www.genspark.ai/api/files/s/Klb2Aiq3?cache_control=3600', name: 'military_radio_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/AcxFyQ3H', name: 'gas_mask.png' },
  { url: 'https://www.genspark.ai/api/files/s/0AQlGsGU', name: 'gas_mask_filter.png' },
  { url: 'https://www.genspark.ai/api/files/s/YaO81lTh', name: 'water_filter.png' },
  { url: 'https://www.genspark.ai/api/files/s/sxZRdXSR', name: 'sniper_scope.png' },
  { url: 'https://www.genspark.ai/api/files/s/a6vPrKla', name: 'sound_dampener.png' },
  { url: 'https://www.genspark.ai/api/files/s/3z8PnW2K', name: 'map_fragment.png' },
  // 기록/생존 문서/전력 장비
  { url: 'https://www.genspark.ai/api/files/s/bqPHUMkC?cache_control=3600', name: 'survival_journal.png' },
  { url: 'https://www.genspark.ai/api/files/s/5Y6M3vXB?cache_control=3600', name: 'survivor_note.png' },
  { url: 'https://www.genspark.ai/api/files/s/xfcxeqKs?cache_control=3600', name: 'rope_ladder.png' },
  { url: 'https://www.genspark.ai/api/files/s/QQcJMFsC?cache_control=3600', name: 'battery.png' },
  { url: 'https://www.genspark.ai/api/files/s/izd4t4bN?cache_control=3600', name: 'nuclear_battery.png' },
  { url: 'https://www.genspark.ai/api/files/s/8ApSBEAK?cache_control=3600', name: 'broadcast_equipment.png' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, {
      headers: {
        'cookie': COOKIE,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'referer': 'https://www.genspark.ai/',
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

(async () => {
  let ok = 0, fail = 0;
  for (const f of FILES) {
    const dest = path.join(OUT_DIR, f.name);
    try {
      await download(f.url, dest);
      const size = Math.round(fs.statSync(dest).size / 1024);
      // 59바이트 = Access denied 응답
      if (size < 1) throw new Error('Access denied (쿠키 확인 필요)');
      console.log(`✓ ${f.name} (${size}KB)`);
      ok++;
    } catch (e) {
      console.error(`✗ ${f.name}: ${e.message}`);
      fail++;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  console.log(`\n완료: ${ok}개 성공, ${fail}개 실패`);
  if (fail > 0) console.log('실패한 파일은 쿠키를 다시 복사해서 재시도하세요.');
})();
