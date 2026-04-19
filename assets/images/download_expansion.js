// 크래프팅 체인 확장 이미지 다운로드 (92개)
// 실행: node assets/images/download_expansion.js

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const FILES = [
  // materials (21)
  { url: 'https://www.genspark.ai/api/files/s/VmsRVk0H?cache_control=3600', dest: 'materials/circuit_board.png' },
  { url: 'https://www.genspark.ai/api/files/s/EItbZmJo?cache_control=3600', dest: 'materials/copper_wire.png' },
  { url: 'https://www.genspark.ai/api/files/s/ysXr2CHW?cache_control=3600', dest: 'materials/copper_coil.png' },
  { url: 'https://www.genspark.ai/api/files/s/BRmJfORI?cache_control=3600', dest: 'materials/microchip.png' },
  { url: 'https://www.genspark.ai/api/files/s/nBasHMdq?cache_control=3600', dest: 'materials/circuit_module.png' },
  { url: 'https://www.genspark.ai/api/files/s/VCiu2jSB?cache_control=3600', dest: 'materials/electric_motor.png' },
  { url: 'https://www.genspark.ai/api/files/s/yksYnaYM', dest: 'materials/power_cell.png' },
  { url: 'https://www.genspark.ai/api/files/s/M1E0BogE', dest: 'materials/generator_core.png' },
  { url: 'https://www.genspark.ai/api/files/s/MYCRNnCB', dest: 'materials/sand.png' },
  { url: 'https://www.genspark.ai/api/files/s/xxVqtYBR', dest: 'materials/mortar_mix.png' },
  { url: 'https://www.genspark.ai/api/files/s/vowEfnZD', dest: 'materials/concrete_block.png' },
  { url: 'https://www.genspark.ai/api/files/s/jahudOxC', dest: 'materials/brick.png' },
  { url: 'https://www.genspark.ai/api/files/s/ccCGcpYc?cache_control=3600', dest: 'materials/alloy_ingot.png' },
  { url: 'https://www.genspark.ai/api/files/s/Nvjf5Pkz?cache_control=3600', dest: 'materials/woven_fabric.png' },
  { url: 'https://www.genspark.ai/api/files/s/hBHlsld1?cache_control=3600', dest: 'materials/reinforced_fabric.png' },
  { url: 'https://www.genspark.ai/api/files/s/h9GA8VM9?cache_control=3600', dest: 'materials/dye.png' },
  { url: 'https://www.genspark.ai/api/files/s/qsfbMTaO?cache_control=3600', dest: 'materials/wild_wheat.png' },
  { url: 'https://www.genspark.ai/api/files/s/l0Qwsm7d?cache_control=3600', dest: 'materials/flour.png' },
  { url: 'https://www.genspark.ai/api/files/s/HVv0FHmq?cache_control=3600', dest: 'materials/bread_dough.png' },
  { url: 'https://www.genspark.ai/api/files/s/m00pyzvP?cache_control=3600', dest: 'materials/worm.png' },
  { url: 'https://www.genspark.ai/api/files/s/9zruWDOn?cache_control=3600', dest: 'materials/fishing_bait.png' },
  // food (14)
  { url: 'https://www.genspark.ai/api/files/s/iDQ85C4G?cache_control=3600', dest: 'food/baked_bread.png' },
  { url: 'https://www.genspark.ai/api/files/s/JDp1XMGs?cache_control=3600', dest: 'food/sandwich.png' },
  { url: 'https://www.genspark.ai/api/files/s/9x00h36P?cache_control=3600', dest: 'food/rice_wine.png' },
  { url: 'https://www.genspark.ai/api/files/s/Iq6KbAp8?cache_control=3600', dest: 'food/vinegar.png' },
  { url: 'https://www.genspark.ai/api/files/s/41wCjxw5?cache_control=3600', dest: 'food/pickled_food.png' },
  { url: 'https://www.genspark.ai/api/files/s/1rRNxEHV?cache_control=3600', dest: 'food/meat_stew.png' },
  { url: 'https://www.genspark.ai/api/files/s/rG0S50zI?cache_control=3600', dest: 'food/bibimbap.png' },
  { url: 'https://www.genspark.ai/api/files/s/lXXzdkaM?cache_control=3600', dest: 'food/salted_meat.png' },
  { url: 'https://www.genspark.ai/api/files/s/kJ9Qu3ff?cache_control=3600', dest: 'food/smoked_meat.png' },
  { url: 'https://www.genspark.ai/api/files/s/TSj4PqA9', dest: 'food/preserved_ration.png' },
  { url: 'https://www.genspark.ai/api/files/s/JAMG9nRO', dest: 'food/smoked_fish.png' },
  { url: 'https://www.genspark.ai/api/files/s/qk8HA165', dest: 'food/settled_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/x6kDbITM', dest: 'food/distilled_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/UY4QZ9Ml', dest: 'food/sterile_water.png' },
  // weapons (8)
  { url: 'https://www.genspark.ai/api/files/s/CMRkDO8l?cache_control=3600', dest: 'weapons/pipe_shotgun.png' },
  { url: 'https://www.genspark.ai/api/files/s/EJLGUvnp?cache_control=3600', dest: 'weapons/master_blade.png' },
  { url: 'https://www.genspark.ai/api/files/s/5BeegFUi?cache_control=3600', dest: 'weapons/katana.png' },
  { url: 'https://www.genspark.ai/api/files/s/pdt0IwLg?cache_control=3600', dest: 'weapons/pipe_wrench_improved.png' },
  { url: 'https://www.genspark.ai/api/files/s/MVNv2v3C?cache_control=3600', dest: 'weapons/master_wrench.png' },
  { url: 'https://www.genspark.ai/api/files/s/rzY0f4Ew?cache_control=3600', dest: 'weapons/ammo_mod.png' },
  { url: 'https://www.genspark.ai/api/files/s/Wqe29txR?cache_control=3600', dest: 'weapons/weapon_scope.png' },
  { url: 'https://www.genspark.ai/api/files/s/WAnidwZY?cache_control=3600', dest: 'weapons/suppressor.png' },
  // armor (10)
  { url: 'https://www.genspark.ai/api/files/s/R0ebnZ9r?cache_control=3600', dest: 'armor/armor_plate.png' },
  { url: 'https://www.genspark.ai/api/files/s/2sSF9d6v?cache_control=3600', dest: 'armor/alloy_armor_plate.png' },
  { url: 'https://www.genspark.ai/api/files/s/9bCaH13q?cache_control=3600', dest: 'armor/plate_carrier.png' },
  { url: 'https://www.genspark.ai/api/files/s/21ZWvaGy?cache_control=3600', dest: 'armor/composite_armor.png' },
  { url: 'https://www.genspark.ai/api/files/s/91IDvQxV?cache_control=3600', dest: 'armor/powered_exosuit.png' },
  { url: 'https://www.genspark.ai/api/files/s/wEVUfsrA?cache_control=3600', dest: 'armor/ballistic_weave.png' },
  { url: 'https://www.genspark.ai/api/files/s/pN4VhqGQ?cache_control=3600', dest: 'armor/camo_cloth.png' },
  { url: 'https://www.genspark.ai/api/files/s/IUJ5yJYR?cache_control=3600', dest: 'armor/knuckle_wrap.png' },
  { url: 'https://www.genspark.ai/api/files/s/lN4IM3Qj?cache_control=3600', dest: 'armor/combat_gloves.png' },
  { url: 'https://www.genspark.ai/api/files/s/qahVyOlX?cache_control=3600', dest: 'armor/iron_gauntlet.png' },
  // medical (9)
  { url: 'https://www.genspark.ai/api/files/s/WCJYrRcw?cache_control=3600', dest: 'medical/crude_medicine.png' },
  { url: 'https://www.genspark.ai/api/files/s/ooo3bq83?cache_control=3600', dest: 'medical/purified_medicine.png' },
  { url: 'https://www.genspark.ai/api/files/s/ySaSWWB4?cache_control=3600', dest: 'medical/synthetic_antibiotics.png' },
  { url: 'https://www.genspark.ai/api/files/s/oS7DSCXN?cache_control=3600', dest: 'medical/universal_cure.png' },
  { url: 'https://www.genspark.ai/api/files/s/I9bKHTI3?cache_control=3600', dest: 'medical/anesthetic.png' },
  { url: 'https://www.genspark.ai/api/files/s/Oko80K0u?cache_control=3600', dest: 'medical/surgical_anesthetic.png' },
  { url: 'https://www.genspark.ai/api/files/s/zbvJntvl?cache_control=3600', dest: 'medical/detox_potion.png' },
  { url: 'https://www.genspark.ai/api/files/s/tMSUDOUf?cache_control=3600', dest: 'medical/rad_flush.png' },
  { url: 'https://www.genspark.ai/api/files/s/8Y3hM6X3?cache_control=3600', dest: 'medical/defense_salve.png' },
  // tools (16)
  { url: 'https://www.genspark.ai/api/files/s/NyJBpYgb', dest: 'tools/radio_transmitter.png' },
  { url: 'https://www.genspark.ai/api/files/s/0LCONrCe?cache_control=3600', dest: 'tools/powered_drill.png' },
  { url: 'https://www.genspark.ai/api/files/s/57OoQa0t?cache_control=3600', dest: 'tools/scalpel.png' },
  { url: 'https://www.genspark.ai/api/files/s/MWxC8GIa?cache_control=3600', dest: 'tools/steel_tool_head.png' },
  { url: 'https://www.genspark.ai/api/files/s/4T44HoEn?cache_control=3600', dest: 'tools/spotlight_flashlight.png' },
  { url: 'https://www.genspark.ai/api/files/s/NfgEAdZj?cache_control=3600', dest: 'tools/night_vision_goggles.png' },
  { url: 'https://www.genspark.ai/api/files/s/XOOPIwOl?cache_control=3600', dest: 'tools/lockpick_set.png' },
  { url: 'https://www.genspark.ai/api/files/s/VAbXFgtx?cache_control=3600', dest: 'tools/electronic_lockpick.png' },
  { url: 'https://www.genspark.ai/api/files/s/qRQLIlre?cache_control=3600', dest: 'tools/fishing_rod_advanced.png' },
  { url: 'https://www.genspark.ai/api/files/s/nDRUdwg7?cache_control=3600', dest: 'tools/automated_fish_trap.png' },
  { url: 'https://www.genspark.ai/api/files/s/1ZCvr85W?cache_control=3600', dest: 'tools/fishing_net.png' },
  { url: 'https://www.genspark.ai/api/files/s/DAF6pLfE?cache_control=3600', dest: 'tools/crab_trap.png' },
  { url: 'https://www.genspark.ai/api/files/s/ZcCDs4fq?cache_control=3600', dest: 'tools/master_angler_lure.png' },
  { url: 'https://www.genspark.ai/api/files/s/1h3C4pJl?cache_control=3600', dest: 'tools/sterile_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/NH7whQ2E?cache_control=3600', dest: 'tools/weapon_oil.png' },
  { url: 'https://www.genspark.ai/api/files/s/LqZ2eos7?cache_control=3600', dest: 'tools/serrated_mod.png' },
  // structures (14)
  { url: 'https://www.genspark.ai/api/files/s/82NESsFp?cache_control=3600', dest: 'structures/portable_generator.png' },
  { url: 'https://www.genspark.ai/api/files/s/NiQKO1hT?cache_control=3600', dest: 'structures/solar_panel.png' },
  { url: 'https://www.genspark.ai/api/files/s/4BERV5iM?cache_control=3600', dest: 'structures/electric_fence.png' },
  { url: 'https://www.genspark.ai/api/files/s/QAhDcprA?cache_control=3600', dest: 'structures/spotlight.png' },
  { url: 'https://www.genspark.ai/api/files/s/C52sdlkX?cache_control=3600', dest: 'structures/solar_charger.png' },
  { url: 'https://www.genspark.ai/api/files/s/flX5yTJJ?cache_control=3600', dest: 'structures/pipe_assembly.png' },
  { url: 'https://www.genspark.ai/api/files/s/KeurFBUA', dest: 'structures/water_tower.png' },
  { url: 'https://www.genspark.ai/api/files/s/ni0UXunN', dest: 'structures/plumbing_system.png' },
  { url: 'https://www.genspark.ai/api/files/s/yDXtB58C', dest: 'structures/reinforced_wall.png' },
  { url: 'https://www.genspark.ai/api/files/s/CcvZgAq6', dest: 'structures/watchtower.png' },
  { url: 'https://www.genspark.ai/api/files/s/VbyqRagq', dest: 'structures/brick_furnace.png' },
  { url: 'https://www.genspark.ai/api/files/s/Zt1ttamO', dest: 'structures/rain_collector_improved.png' },
  { url: 'https://www.genspark.ai/api/files/s/dG23TnVY?cache_control=3600', dest: 'structures/water_recycler.png' },
  { url: 'https://www.genspark.ai/api/files/s/eXrlXJRP?cache_control=3600', dest: 'structures/field_surgery_station.png' },
];

const BASE_DIR = path.join(__dirname);

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(BASE_DIR, destPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${destPath}`));
        return;
      }
      const ws = fs.createWriteStream(fullPath);
      res.pipe(ws);
      ws.on('finish', () => {
        ws.close();
        const size = fs.statSync(fullPath).size;
        resolve({ dest: destPath, size });
      });
      ws.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  let ok = 0, fail = 0;
  for (let i = 0; i < FILES.length; i++) {
    const f = FILES[i];
    try {
      const result = await download(f.url, f.dest);
      console.log(`OK [${i+1}/${FILES.length}] ${result.dest} (${Math.round(result.size/1024)}KB)`);
      ok++;
    } catch (e) {
      console.error(`FAIL [${i+1}/${FILES.length}] ${f.dest}: ${e.message}`);
      fail++;
    }
    // Small delay to avoid rate limiting
    if (i % 10 === 9) await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\nDone: ${ok} ok, ${fail} failed out of ${FILES.length}`);
}

main();
