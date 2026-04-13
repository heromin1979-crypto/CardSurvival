// ============================================================
// 새 이미지 37개 다운로드 — 브라우저 콘솔용
//
// 사용법:
//   1. https://www.genspark.ai 에서 로그인
//   2. F12 → Console 탭
//   3. 이 코드 전체 붙여넣기 → Enter
// ============================================================

const FILES = [
  // Tools / Fishing Equipment (13)
  { name: 'bait_insect.png',        url: 'https://www.genspark.ai/api/files/s/jcfJQDoc?cache_control=3600' },
  { name: 'bait_worm.png',          url: 'https://www.genspark.ai/api/files/s/sWCDYSfz?cache_control=3600' },
  { name: 'fishing_hook.png',        url: 'https://www.genspark.ai/api/files/s/Opak7gSs?cache_control=3600' },
  { name: 'fishing_rod_basic.png',   url: 'https://www.genspark.ai/api/files/s/TM6daHab?cache_control=3600' },
  { name: 'fishing_rod_improved.png',url: 'https://www.genspark.ai/api/files/s/YC2mX0s1?cache_control=3600' },
  { name: 'kitchen_knife.png',       url: 'https://www.genspark.ai/api/files/s/XSpoCPCa?cache_control=3600' },
  { name: 'mortar_pestle.png',       url: 'https://www.genspark.ai/api/files/s/GsufinkA?cache_control=3600' },
  { name: 'sickle.png',              url: 'https://www.genspark.ai/api/files/s/WfJYZnJs?cache_control=3600' },
  { name: 'stone_knife.png',         url: 'https://www.genspark.ai/api/files/s/RSzEbRSX?cache_control=3600' },
  { name: 'trowel.png',              url: 'https://www.genspark.ai/api/files/s/CIKxAzKh?cache_control=3600' },
  { name: 'map_fragment_center.png', url: 'https://www.genspark.ai/api/files/s/GkgutJTK?cache_control=3600' },
  { name: 'map_fragment_north.png',  url: 'https://www.genspark.ai/api/files/s/P70RwFwB?cache_control=3600' },
  { name: 'map_fragment_south.png',  url: 'https://www.genspark.ai/api/files/s/WYaAc0p7?cache_control=3600' },
  // Structures / Crafting Stations (19)
  { name: 'ammo_bench.png',         url: 'https://www.genspark.ai/api/files/s/ECT7SoMg?cache_control=3600' },
  { name: 'campfire_temp.png',      url: 'https://www.genspark.ai/api/files/s/3rIgyUKr?cache_control=3600' },
  { name: 'carpentry_bench.png',    url: 'https://www.genspark.ai/api/files/s/E8KH2twE?cache_control=3600' },
  { name: 'chemistry_bench.png',    url: 'https://www.genspark.ai/api/files/s/pRFvSJs8?cache_control=3600' },
  { name: 'clay_pot.png',           url: 'https://www.genspark.ai/api/files/s/zwUwTRqQ?cache_control=3600' },
  { name: 'coal_furnace.png',       url: 'https://www.genspark.ai/api/files/s/IefpUusY?cache_control=3600' },
  { name: 'cooking_pot_stand.png',  url: 'https://www.genspark.ai/api/files/s/V6cWdMzQ?cache_control=3600' },
  { name: 'drying_rack.png',        url: 'https://www.genspark.ai/api/files/s/eNVvmHok?cache_control=3600' },
  { name: 'fermentation_pot.png',   url: 'https://www.genspark.ai/api/files/s/2IFks4Mb?cache_control=3600' },
  { name: 'field_forge.png',        url: 'https://www.genspark.ai/api/files/s/cTgTNyef?cache_control=3600' },
  { name: 'fish_trap.png',          url: 'https://www.genspark.ai/api/files/s/iCZB1ycd?cache_control=3600' },
  { name: 'garden_bed_grain.png',   url: 'https://www.genspark.ai/api/files/s/SPyRoh00?cache_control=3600' },
  { name: 'garden_bed_herb.png',    url: 'https://www.genspark.ai/api/files/s/yRHNoAMt?cache_control=3600' },
  { name: 'garden_bed_veggie.png',  url: 'https://www.genspark.ai/api/files/s/9xUKJ2Ix?cache_control=3600' },
  { name: 'iron_pot.png',           url: 'https://www.genspark.ai/api/files/s/t8RlAfSz?cache_control=3600' },
  { name: 'root_cellar.png',        url: 'https://www.genspark.ai/api/files/s/lIzIfOk8?cache_control=3600' },
  { name: 'tanning_rack.png',       url: 'https://www.genspark.ai/api/files/s/7X02Vkt0?cache_control=3600' },
  { name: 'wind_stove.png',         url: 'https://www.genspark.ai/api/files/s/NW7JG3tV?cache_control=3600' },
  { name: 'bee_hive.png',           url: 'https://www.genspark.ai/api/files/s/gBVZLJJx?cache_control=3600' },
  // Environment / Landmarks / Special (5)
  { name: 'tree_env.png',      url: 'https://www.genspark.ai/api/files/s/SgtxQN6X?cache_control=3600' },
  { name: 'weed_patch.png',    url: 'https://www.genspark.ai/api/files/s/9D4scnyM?cache_control=3600' },
  { name: 'withered_tree.png', url: 'https://www.genspark.ai/api/files/s/oDunqRxo?cache_control=3600' },
  { name: 'lm_hangang.png',    url: 'https://www.genspark.ai/api/files/s/GPU0iUNO?cache_control=3600' },
  { name: 'stun.png',          url: 'https://www.genspark.ai/api/files/s/2GN4PWEu?cache_control=3600' },
];

(async () => {
  console.log(`%c다운로드 시작 (총 ${FILES.length}개)`, 'color:#4CAF50;font-weight:bold;font-size:14px');
  let ok = 0, fail = 0;

  for (const f of FILES) {
    try {
      const res = await fetch(f.url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      if (blob.size < 500) throw new Error(`응답 너무 작음 (${blob.size}B) — 로그인 확인 필요`);

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);

      console.log(`%c✓ ${f.name} (${(blob.size/1024).toFixed(1)}KB)`, 'color:#4CAF50');
      ok++;
    } catch (e) {
      console.log(`%c✗ ${f.name} — ${e.message}`, 'color:#f44336');
      fail++;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n%c완료: ✓${ok}개 성공  ✗${fail}개 실패`, 'color:#2196F3;font-weight:bold;font-size:14px');
  console.log('다운로드된 파일은 브라우저 다운로드 폴더에 저장됩니다.');
  console.log('이후 각 폴더로 이동: tools/ structures/ environment/ landmarks/ special/');
})();
