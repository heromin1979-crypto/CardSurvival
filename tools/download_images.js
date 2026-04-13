// ============================================================
// 카드 이미지 자동 다운로드 스크립트
// 사용법: Genspark(https://www.genspark.ai) 에서
//         F12 → Console 탭 → 이 코드 붙여넣기 → Enter
// ============================================================

const IMAGES = {
  // ── 음식/채집물 → food/ ─────────────────────────────────
  'food/acorn.png':            'https://www.genspark.ai/api/files/s/4cUn85e3?cache_control=3600',
  'food/acorn_flour.png':      'https://www.genspark.ai/api/files/s/kJp7Dc6P?cache_control=3600',
  'food/acorn_jelly.png':      'https://www.genspark.ai/api/files/s/iHG5zZfr?cache_control=3600',
  'food/bamboo_shoot.png':     'https://www.genspark.ai/api/files/s/o1S8UNpR?cache_control=3600',
  'food/berry_jam.png':        'https://www.genspark.ai/api/files/s/5sZtSUud?cache_control=3600',
  'food/berry_wine.png':       'https://www.genspark.ai/api/files/s/luvTTD9d?cache_control=3600',
  'food/dandelion.png':        'https://www.genspark.ai/api/files/s/zQ6Ep0Dm?cache_control=3600',
  'food/dandelion_coffee.png': 'https://www.genspark.ai/api/files/s/SySrxAD7?cache_control=3600',
  'food/dried_berry.png':      'https://www.genspark.ai/api/files/s/Pk3NSCz6?cache_control=3600',
  'food/dried_fish.png':       'https://www.genspark.ai/api/files/s/uxzndzRc?cache_control=3600',
  'food/dried_mushroom.png':   'https://www.genspark.ai/api/files/s/Pbq4r3Bo?cache_control=3600',
  'food/fermented_grain.png':  'https://www.genspark.ai/api/files/s/cWvARY0j?cache_control=3600',
  'food/fermented_kimchi.png': 'https://www.genspark.ai/api/files/s/unllfpjJ?cache_control=3600',
  'food/fish_fillet.png':      'https://www.genspark.ai/api/files/s/SfII725C?cache_control=3600',
  'food/garlic_paste.png':     'https://www.genspark.ai/api/files/s/GzW2Nq7U?cache_control=3600',
  'food/grain.png':            'https://www.genspark.ai/api/files/s/cT0HTeSQ?cache_control=3600',
  'food/grilled_fish.png':     'https://www.genspark.ai/api/files/s/EIW1W0x3?cache_control=3600',
  'food/honey.png':            'https://www.genspark.ai/api/files/s/F9PrSIKV?cache_control=3600',
  'food/meat_strip.png':       'https://www.genspark.ai/api/files/s/BJ4zXCdM?cache_control=3600',
  'food/mushroom_edible.png':  'https://www.genspark.ai/api/files/s/3ZPRvle7?cache_control=3600',
  'food/mushroom_soup.png':    'https://www.genspark.ai/api/files/s/bCGsMjUd?cache_control=3600',
  'food/mushroom_toxic.png':   'https://www.genspark.ai/api/files/s/kXwAMu1O?cache_control=3600',
  'food/nettle_stew.png':      'https://www.genspark.ai/api/files/s/8IwKtza8?cache_control=3600',
  'food/pine_cone.png':        'https://www.genspark.ai/api/files/s/K2Lj0Tgx?cache_control=3600',
  'food/pine_needle.png':      'https://www.genspark.ai/api/files/s/iWPDsDeO?cache_control=3600',
  'food/pine_needle_tea.png':  'https://www.genspark.ai/api/files/s/vXfVS6Ol?cache_control=3600',
  'food/raw_fish.png':         'https://www.genspark.ai/api/files/s/wDHjNc5V?cache_control=3600',
  'food/vegetable.png':        'https://www.genspark.ai/api/files/s/X4mA6HG8?cache_control=3600',
  'food/vegetable_stew.png':   'https://www.genspark.ai/api/files/s/nUJSObGO?cache_control=3600',
  'food/wild_berry.png':       'https://www.genspark.ai/api/files/s/xPOGoauP?cache_control=3600',
  'food/wild_garlic.png':      'https://www.genspark.ai/api/files/s/bAvLwpjt?cache_control=3600',
  'food/wild_root.png':        'https://www.genspark.ai/api/files/s/K94LtxMZ?cache_control=3600',
  'food/wild_salad.png':       'https://www.genspark.ai/api/files/s/hivvrISl?cache_control=3600',
  'food/apple_wild.png':       'https://www.genspark.ai/api/files/s/M8p9XjjF?cache_control=3600',
  'food/chestnut.png':         'https://www.genspark.ai/api/files/s/rOMoKUvl?cache_control=3600',
  'food/chestnut_roasted.png': 'https://www.genspark.ai/api/files/s/ZFMrwUVN?cache_control=3600',
  'food/cooked_meat.png':      'https://www.genspark.ai/api/files/s/9u9GAjGb?cache_control=3600',
  'food/fish_cooked.png':      'https://www.genspark.ai/api/files/s/sR4xfcIt?cache_control=3600',
  'food/fish_large.png':       'https://www.genspark.ai/api/files/s/xzIfrTYU?cache_control=3600',
  'food/fish_medium.png':      'https://www.genspark.ai/api/files/s/9lP1rPtI?cache_control=3600',
  'food/fish_small.png':       'https://www.genspark.ai/api/files/s/CpiSRULD?cache_control=3600',
  'food/pine_nut.png':         'https://www.genspark.ai/api/files/s/yYzO5fmb?cache_control=3600',
  'food/wild_grape.png':       'https://www.genspark.ai/api/files/s/G8EnoK9Z?cache_control=3600',
  'food/wild_strawberry.png':  'https://www.genspark.ai/api/files/s/FTcCocGJ?cache_control=3600',

  // ── 재료/중간 가공재 → materials/ ──────────────────────
  'materials/ax_head.png':       'https://www.genspark.ai/api/files/s/QsjC7gBQ?cache_control=3600',
  'materials/black_powder.png':  'https://www.genspark.ai/api/files/s/kqGvBEc7?cache_control=3600',
  'materials/bolt_shaft.png':    'https://www.genspark.ai/api/files/s/tP1ODNJk?cache_control=3600',
  'materials/bolt_tip.png':      'https://www.genspark.ai/api/files/s/2ibnbGNz?cache_control=3600',
  'materials/brass_fragment.png':'https://www.genspark.ai/api/files/s/TfwzNkHx?cache_control=3600',
  'materials/detonator_cap.png': 'https://www.genspark.ai/api/files/s/gqBCbViM?cache_control=3600',
  'materials/dry_grass.png':     'https://www.genspark.ai/api/files/s/S2s2MqB9?cache_control=3600',
  'materials/dry_leaves.png':    'https://www.genspark.ai/api/files/s/WuLkk2A7?cache_control=3600',
  'materials/dry_wood_stick.png':'https://www.genspark.ai/api/files/s/RNNCMOaA?cache_control=3600',
  'materials/empty_cartridge.png':'https://www.genspark.ai/api/files/s/eQNuXi5S?cache_control=3600',
  'materials/fire_ember.png':    'https://www.genspark.ai/api/files/s/YzKCBE0j?cache_control=3600',
  'materials/firestone.png':     'https://www.genspark.ai/api/files/s/CEY0XiSx?cache_control=3600',
  'materials/fishing_hook.png':  'https://www.genspark.ai/api/files/s/gYyvDkxA?cache_control=3600',
  'materials/flame_token.png':   'https://www.genspark.ai/api/files/s/BZhWvwui?cache_control=3600',
  'materials/grain_seed.png':    'https://www.genspark.ai/api/files/s/zORDPIrL?cache_control=3600',
  'materials/hammer_head.png':   'https://www.genspark.ai/api/files/s/MiaorX8G?cache_control=3600',
  'materials/herb_powder.png':   'https://www.genspark.ai/api/files/s/rb1hwpZ2?cache_control=3600',
  'materials/herb_seed.png':     'https://www.genspark.ai/api/files/s/mFKO1l8b?cache_control=3600',
};

// ── 다운로드 실행 ─────────────────────────────────────────
async function downloadAll() {
  const entries = Object.entries(IMAGES);
  let ok = 0, fail = 0;

  console.log(`%c카드 이미지 다운로드 시작 (총 ${entries.length}개)`, 'color:#4CAF50;font-weight:bold;font-size:14px');
  console.log('파일명 형식: [카테고리]/[파일명].png — 폴더에 맞게 이동해주세요\n');

  for (const [filename, url] of entries) {
    try {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      if (blob.size < 1000) throw new Error(`너무 작음 (${blob.size}B)`);

      // 파일명만 추출 (food/acorn.png → acorn.png)
      const name = filename.split('/').pop();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);

      console.log(`%c✓ ${filename} (${(blob.size/1024).toFixed(1)}KB)`, 'color:#4CAF50');
      ok++;

      // 브라우저 다운로드 팝업 방지용 딜레이
      await new Promise(r => setTimeout(r, 400));
    } catch (e) {
      console.log(`%c✗ ${filename} — ${e.message}`, 'color:#f44336');
      fail++;
    }
  }

  console.log(`\n%c완료: ✓${ok}개 성공 / ✗${fail}개 실패`, 'color:#2196F3;font-weight:bold;font-size:14px');
  if (fail > 0) console.log('실패한 파일은 Genspark에서 직접 다운로드하세요.');
  console.log('\n다운로드된 파일을 각 폴더로 이동:');
  console.log('  food/*.png     → assets/images/food/');
  console.log('  materials/*.png → assets/images/materials/');
}

downloadAll();
