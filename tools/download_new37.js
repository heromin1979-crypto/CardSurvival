#!/usr/bin/env node
/**
 * 새 이미지 37개 다운로드 스크립트
 *
 * 사용법 (프로젝트 루트에서):
 *   node tools/download_new37.js "COOKIE_STRING"
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
  console.error('쿠키가 필요합니다.');
  console.error('사용법: node tools/download_new37.js "your_cookie_here"');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..', 'assets', 'images');

const FILES = [
  // ── Tools / Fishing Equipment (13) ──────────────────────────
  { dir: 'tools', name: 'bait_insect.png',        url: 'https://www.genspark.ai/api/files/s/jcfJQDoc?cache_control=3600' },
  { dir: 'tools', name: 'bait_worm.png',           url: 'https://www.genspark.ai/api/files/s/sWCDYSfz?cache_control=3600' },
  { dir: 'tools', name: 'fishing_hook.png',         url: 'https://www.genspark.ai/api/files/s/Opak7gSs?cache_control=3600' },
  { dir: 'tools', name: 'fishing_rod_basic.png',    url: 'https://www.genspark.ai/api/files/s/TM6daHab?cache_control=3600' },
  { dir: 'tools', name: 'fishing_rod_improved.png', url: 'https://www.genspark.ai/api/files/s/YC2mX0s1?cache_control=3600' },
  { dir: 'tools', name: 'kitchen_knife.png',        url: 'https://www.genspark.ai/api/files/s/XSpoCPCa?cache_control=3600' },
  { dir: 'tools', name: 'mortar_pestle.png',        url: 'https://www.genspark.ai/api/files/s/GsufinkA?cache_control=3600' },
  { dir: 'tools', name: 'sickle.png',               url: 'https://www.genspark.ai/api/files/s/WfJYZnJs?cache_control=3600' },
  { dir: 'tools', name: 'stone_knife.png',          url: 'https://www.genspark.ai/api/files/s/RSzEbRSX?cache_control=3600' },
  { dir: 'tools', name: 'trowel.png',               url: 'https://www.genspark.ai/api/files/s/CIKxAzKh?cache_control=3600' },
  { dir: 'tools', name: 'map_fragment_center.png',  url: 'https://www.genspark.ai/api/files/s/GkgutJTK?cache_control=3600' },
  { dir: 'tools', name: 'map_fragment_north.png',   url: 'https://www.genspark.ai/api/files/s/P70RwFwB?cache_control=3600' },
  { dir: 'tools', name: 'map_fragment_south.png',   url: 'https://www.genspark.ai/api/files/s/WYaAc0p7?cache_control=3600' },

  // ── Structures / Crafting Stations (19) ─────────────────────
  { dir: 'structures', name: 'ammo_bench.png',         url: 'https://www.genspark.ai/api/files/s/ECT7SoMg?cache_control=3600' },
  { dir: 'structures', name: 'campfire_temp.png',      url: 'https://www.genspark.ai/api/files/s/3rIgyUKr?cache_control=3600' },
  { dir: 'structures', name: 'carpentry_bench.png',    url: 'https://www.genspark.ai/api/files/s/E8KH2twE?cache_control=3600' },
  { dir: 'structures', name: 'chemistry_bench.png',    url: 'https://www.genspark.ai/api/files/s/pRFvSJs8?cache_control=3600' },
  { dir: 'structures', name: 'clay_pot.png',           url: 'https://www.genspark.ai/api/files/s/zwUwTRqQ?cache_control=3600' },
  { dir: 'structures', name: 'coal_furnace.png',       url: 'https://www.genspark.ai/api/files/s/IefpUusY?cache_control=3600' },
  { dir: 'structures', name: 'cooking_pot_stand.png',  url: 'https://www.genspark.ai/api/files/s/V6cWdMzQ?cache_control=3600' },
  { dir: 'structures', name: 'drying_rack.png',        url: 'https://www.genspark.ai/api/files/s/eNVvmHok?cache_control=3600' },
  { dir: 'structures', name: 'fermentation_pot.png',   url: 'https://www.genspark.ai/api/files/s/2IFks4Mb?cache_control=3600' },
  { dir: 'structures', name: 'field_forge.png',        url: 'https://www.genspark.ai/api/files/s/cTgTNyef?cache_control=3600' },
  { dir: 'structures', name: 'fish_trap.png',          url: 'https://www.genspark.ai/api/files/s/iCZB1ycd?cache_control=3600' },
  { dir: 'structures', name: 'garden_bed_grain.png',   url: 'https://www.genspark.ai/api/files/s/SPyRoh00?cache_control=3600' },
  { dir: 'structures', name: 'garden_bed_herb.png',    url: 'https://www.genspark.ai/api/files/s/yRHNoAMt?cache_control=3600' },
  { dir: 'structures', name: 'garden_bed_veggie.png',  url: 'https://www.genspark.ai/api/files/s/9xUKJ2Ix?cache_control=3600' },
  { dir: 'structures', name: 'iron_pot.png',           url: 'https://www.genspark.ai/api/files/s/t8RlAfSz?cache_control=3600' },
  { dir: 'structures', name: 'root_cellar.png',        url: 'https://www.genspark.ai/api/files/s/lIzIfOk8?cache_control=3600' },
  { dir: 'structures', name: 'tanning_rack.png',       url: 'https://www.genspark.ai/api/files/s/7X02Vkt0?cache_control=3600' },
  { dir: 'structures', name: 'wind_stove.png',         url: 'https://www.genspark.ai/api/files/s/NW7JG3tV?cache_control=3600' },
  { dir: 'structures', name: 'bee_hive.png',           url: 'https://www.genspark.ai/api/files/s/gBVZLJJx?cache_control=3600' },

  // ── Environment / Landmarks / Special (5) ───────────────────
  { dir: 'environment', name: 'tree_env.png',      url: 'https://www.genspark.ai/api/files/s/SgtxQN6X?cache_control=3600' },
  { dir: 'environment', name: 'weed_patch.png',    url: 'https://www.genspark.ai/api/files/s/9D4scnyM?cache_control=3600' },
  { dir: 'environment', name: 'withered_tree.png', url: 'https://www.genspark.ai/api/files/s/oDunqRxo?cache_control=3600' },
  { dir: 'landmarks',   name: 'lm_hangang.png',    url: 'https://www.genspark.ai/api/files/s/GPU0iUNO?cache_control=3600' },
  { dir: 'special',     name: 'stun.png',          url: 'https://www.genspark.ai/api/files/s/2GN4PWEu?cache_control=3600' },
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
        try { fs.unlinkSync(dest); } catch {}
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (err) => {
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

(async () => {
  console.log(`이미지 다운로드 시작 (총 ${FILES.length}개)\n`);
  let ok = 0, fail = 0;

  for (const f of FILES) {
    const outDir = path.join(ROOT, f.dir);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const dest = path.join(outDir, f.name);

    try {
      await download(f.url, dest);
      const size = fs.statSync(dest).size;
      if (size < 500) throw new Error(`응답이 너무 작음 (${size}B) — 쿠키 만료됐을 수 있음`);
      console.log(`✓  ${f.dir}/${f.name}  (${Math.round(size / 1024)}KB)`);
      ok++;
    } catch (e) {
      console.error(`✗  ${f.dir}/${f.name}  — ${e.message}`);
      fail++;
    }

    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n완료: ✓${ok}개 성공  ✗${fail}개 실패`);
  if (fail > 0) {
    console.log('\n실패 시 쿠키를 다시 복사해서 재시도하세요:');
    console.log('  node tools/download_new37.js "새_쿠키_값"');
  }
})();
