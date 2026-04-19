// ========================================
// 크래프팅 체인 확장 이미지 다운로드 (92개)
// Genspark 웹사이트 콘솔에서 실행하세요
// ========================================
// 사용법:
// 1. https://www.genspark.ai 에 로그인
// 2. F12 → Console 탭 열기
// 3. 이 스크립트 전체를 복사해서 붙여넣기 → Enter

var FILES = [
  // materials (21)
  { url: 'https://www.genspark.ai/api/files/s/VmsRVk0H?cache_control=3600', name: 'circuit_board.png' },
  { url: 'https://www.genspark.ai/api/files/s/EItbZmJo?cache_control=3600', name: 'copper_wire.png' },
  { url: 'https://www.genspark.ai/api/files/s/ysXr2CHW?cache_control=3600', name: 'copper_coil.png' },
  { url: 'https://www.genspark.ai/api/files/s/BRmJfORI?cache_control=3600', name: 'microchip.png' },
  { url: 'https://www.genspark.ai/api/files/s/nBasHMdq?cache_control=3600', name: 'circuit_module.png' },
  { url: 'https://www.genspark.ai/api/files/s/VCiu2jSB?cache_control=3600', name: 'electric_motor.png' },
  { url: 'https://www.genspark.ai/api/files/s/yksYnaYM', name: 'power_cell.png' },
  { url: 'https://www.genspark.ai/api/files/s/M1E0BogE', name: 'generator_core.png' },
  { url: 'https://www.genspark.ai/api/files/s/MYCRNnCB', name: 'sand.png' },
  { url: 'https://www.genspark.ai/api/files/s/xxVqtYBR', name: 'mortar_mix.png' },
  { url: 'https://www.genspark.ai/api/files/s/vowEfnZD', name: 'concrete_block.png' },
  { url: 'https://www.genspark.ai/api/files/s/jahudOxC', name: 'brick.png' },
  { url: 'https://www.genspark.ai/api/files/s/ccCGcpYc?cache_control=3600', name: 'alloy_ingot.png' },
  { url: 'https://www.genspark.ai/api/files/s/Nvjf5Pkz?cache_control=3600', name: 'woven_fabric.png' },
  { url: 'https://www.genspark.ai/api/files/s/hBHlsld1?cache_control=3600', name: 'reinforced_fabric.png' },
  { url: 'https://www.genspark.ai/api/files/s/h9GA8VM9?cache_control=3600', name: 'dye.png' },
  { url: 'https://www.genspark.ai/api/files/s/qsfbMTaO?cache_control=3600', name: 'wild_wheat.png' },
  { url: 'https://www.genspark.ai/api/files/s/l0Qwsm7d?cache_control=3600', name: 'flour.png' },
  { url: 'https://www.genspark.ai/api/files/s/HVv0FHmq?cache_control=3600', name: 'bread_dough.png' },
  { url: 'https://www.genspark.ai/api/files/s/m00pyzvP?cache_control=3600', name: 'worm.png' },
  { url: 'https://www.genspark.ai/api/files/s/9zruWDOn?cache_control=3600', name: 'fishing_bait.png' },
  // food (14)
  { url: 'https://www.genspark.ai/api/files/s/iDQ85C4G?cache_control=3600', name: 'baked_bread.png' },
  { url: 'https://www.genspark.ai/api/files/s/JDp1XMGs?cache_control=3600', name: 'sandwich.png' },
  { url: 'https://www.genspark.ai/api/files/s/9x00h36P?cache_control=3600', name: 'rice_wine.png' },
  { url: 'https://www.genspark.ai/api/files/s/Iq6KbAp8?cache_control=3600', name: 'vinegar.png' },
  { url: 'https://www.genspark.ai/api/files/s/41wCjxw5?cache_control=3600', name: 'pickled_food.png' },
  { url: 'https://www.genspark.ai/api/files/s/1rRNxEHV?cache_control=3600', name: 'meat_stew.png' },
  { url: 'https://www.genspark.ai/api/files/s/rG0S50zI?cache_control=3600', name: 'bibimbap.png' },
  { url: 'https://www.genspark.ai/api/files/s/lXXzdkaM?cache_control=3600', name: 'salted_meat.png' },
  { url: 'https://www.genspark.ai/api/files/s/kJ9Qu3ff?cache_control=3600', name: 'smoked_meat.png' },
  { url: 'https://www.genspark.ai/api/files/s/TSj4PqA9', name: 'preserved_ration.png' },
  { url: 'https://www.genspark.ai/api/files/s/JAMG9nRO', name: 'smoked_fish.png' },
  { url: 'https://www.genspark.ai/api/files/s/qk8HA165', name: 'settled_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/x6kDbITM', name: 'distilled_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/UY4QZ9Ml', name: 'sterile_water.png' },
  // weapons (8)
  { url: 'https://www.genspark.ai/api/files/s/CMRkDO8l?cache_control=3600', name: 'pipe_shotgun.png' },
  { url: 'https://www.genspark.ai/api/files/s/EJLGUvnp?cache_control=3600', name: 'master_blade.png' },
  { url: 'https://www.genspark.ai/api/files/s/5BeegFUi?cache_control=3600', name: 'katana.png' },
  { url: 'https://www.genspark.ai/api/files/s/pdt0IwLg?cache_control=3600', name: 'pipe_wrench_improved.png' },
  { url: 'https://www.genspark.ai/api/files/s/MVNv2v3C?cache_control=3600', name: 'master_wrench.png' },
  { url: 'https://www.genspark.ai/api/files/s/rzY0f4Ew?cache_control=3600', name: 'ammo_mod.png' },
  { url: 'https://www.genspark.ai/api/files/s/Wqe29txR?cache_control=3600', name: 'weapon_scope.png' },
  { url: 'https://www.genspark.ai/api/files/s/WAnidwZY?cache_control=3600', name: 'suppressor.png' },
  // armor (10)
  { url: 'https://www.genspark.ai/api/files/s/R0ebnZ9r?cache_control=3600', name: 'armor_plate.png' },
  { url: 'https://www.genspark.ai/api/files/s/2sSF9d6v?cache_control=3600', name: 'alloy_armor_plate.png' },
  { url: 'https://www.genspark.ai/api/files/s/9bCaH13q?cache_control=3600', name: 'plate_carrier.png' },
  { url: 'https://www.genspark.ai/api/files/s/21ZWvaGy?cache_control=3600', name: 'composite_armor.png' },
  { url: 'https://www.genspark.ai/api/files/s/91IDvQxV?cache_control=3600', name: 'powered_exosuit.png' },
  { url: 'https://www.genspark.ai/api/files/s/wEVUfsrA?cache_control=3600', name: 'ballistic_weave.png' },
  { url: 'https://www.genspark.ai/api/files/s/pN4VhqGQ?cache_control=3600', name: 'camo_cloth.png' },
  { url: 'https://www.genspark.ai/api/files/s/IUJ5yJYR?cache_control=3600', name: 'knuckle_wrap.png' },
  { url: 'https://www.genspark.ai/api/files/s/lN4IM3Qj?cache_control=3600', name: 'combat_gloves.png' },
  { url: 'https://www.genspark.ai/api/files/s/qahVyOlX?cache_control=3600', name: 'iron_gauntlet.png' },
  // medical (9)
  { url: 'https://www.genspark.ai/api/files/s/WCJYrRcw?cache_control=3600', name: 'crude_medicine.png' },
  { url: 'https://www.genspark.ai/api/files/s/ooo3bq83?cache_control=3600', name: 'purified_medicine.png' },
  { url: 'https://www.genspark.ai/api/files/s/ySaSWWB4?cache_control=3600', name: 'synthetic_antibiotics.png' },
  { url: 'https://www.genspark.ai/api/files/s/oS7DSCXN?cache_control=3600', name: 'universal_cure.png' },
  { url: 'https://www.genspark.ai/api/files/s/I9bKHTI3?cache_control=3600', name: 'anesthetic.png' },
  { url: 'https://www.genspark.ai/api/files/s/Oko80K0u?cache_control=3600', name: 'surgical_anesthetic.png' },
  { url: 'https://www.genspark.ai/api/files/s/zbvJntvl?cache_control=3600', name: 'detox_potion.png' },
  { url: 'https://www.genspark.ai/api/files/s/tMSUDOUf?cache_control=3600', name: 'rad_flush.png' },
  { url: 'https://www.genspark.ai/api/files/s/8Y3hM6X3?cache_control=3600', name: 'defense_salve.png' },
  // tools (16)
  { url: 'https://www.genspark.ai/api/files/s/NyJBpYgb', name: 'radio_transmitter.png' },
  { url: 'https://www.genspark.ai/api/files/s/0LCONrCe?cache_control=3600', name: 'powered_drill.png' },
  { url: 'https://www.genspark.ai/api/files/s/57OoQa0t?cache_control=3600', name: 'scalpel.png' },
  { url: 'https://www.genspark.ai/api/files/s/MWxC8GIa?cache_control=3600', name: 'steel_tool_head.png' },
  { url: 'https://www.genspark.ai/api/files/s/4T44HoEn?cache_control=3600', name: 'spotlight_flashlight.png' },
  { url: 'https://www.genspark.ai/api/files/s/NfgEAdZj?cache_control=3600', name: 'night_vision_goggles.png' },
  { url: 'https://www.genspark.ai/api/files/s/XOOPIwOl?cache_control=3600', name: 'lockpick_set.png' },
  { url: 'https://www.genspark.ai/api/files/s/VAbXFgtx?cache_control=3600', name: 'electronic_lockpick.png' },
  { url: 'https://www.genspark.ai/api/files/s/qRQLIlre?cache_control=3600', name: 'fishing_rod_advanced.png' },
  { url: 'https://www.genspark.ai/api/files/s/nDRUdwg7?cache_control=3600', name: 'automated_fish_trap.png' },
  { url: 'https://www.genspark.ai/api/files/s/1ZCvr85W?cache_control=3600', name: 'fishing_net.png' },
  { url: 'https://www.genspark.ai/api/files/s/DAF6pLfE?cache_control=3600', name: 'crab_trap.png' },
  { url: 'https://www.genspark.ai/api/files/s/ZcCDs4fq?cache_control=3600', name: 'master_angler_lure.png' },
  { url: 'https://www.genspark.ai/api/files/s/1h3C4pJl?cache_control=3600', name: 'sterile_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/NH7whQ2E?cache_control=3600', name: 'weapon_oil.png' },
  { url: 'https://www.genspark.ai/api/files/s/LqZ2eos7?cache_control=3600', name: 'serrated_mod.png' },
  // structures (14)
  { url: 'https://www.genspark.ai/api/files/s/82NESsFp?cache_control=3600', name: 'portable_generator.png' },
  { url: 'https://www.genspark.ai/api/files/s/NiQKO1hT?cache_control=3600', name: 'solar_panel.png' },
  { url: 'https://www.genspark.ai/api/files/s/4BERV5iM?cache_control=3600', name: 'electric_fence.png' },
  { url: 'https://www.genspark.ai/api/files/s/QAhDcprA?cache_control=3600', name: 'spotlight.png' },
  { url: 'https://www.genspark.ai/api/files/s/C52sdlkX?cache_control=3600', name: 'solar_charger.png' },
  { url: 'https://www.genspark.ai/api/files/s/flX5yTJJ?cache_control=3600', name: 'pipe_assembly.png' },
  { url: 'https://www.genspark.ai/api/files/s/KeurFBUA', name: 'water_tower.png' },
  { url: 'https://www.genspark.ai/api/files/s/ni0UXunN', name: 'plumbing_system.png' },
  { url: 'https://www.genspark.ai/api/files/s/yDXtB58C', name: 'reinforced_wall.png' },
  { url: 'https://www.genspark.ai/api/files/s/CcvZgAq6', name: 'watchtower.png' },
  { url: 'https://www.genspark.ai/api/files/s/VbyqRagq', name: 'brick_furnace.png' },
  { url: 'https://www.genspark.ai/api/files/s/Zt1ttamO', name: 'rain_collector_improved.png' },
  { url: 'https://www.genspark.ai/api/files/s/dG23TnVY?cache_control=3600', name: 'water_recycler.png' },
  { url: 'https://www.genspark.ai/api/files/s/eXrlXJRP?cache_control=3600', name: 'field_surgery_station.png' },
];

(async function() {
  var ok = 0, fail = 0;
  for (var i = 0; i < FILES.length; i++) {
    var f = FILES[i];
    try {
      var res = await fetch(f.url, { credentials: 'include' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var blob = await res.blob();
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      console.log('OK [' + (i+1) + '/' + FILES.length + '] ' + f.name + ' (' + Math.round(blob.size/1024) + 'KB)');
      ok++;
      await new Promise(function(r) { setTimeout(r, 300); });
    } catch(e) {
      console.error('FAIL [' + (i+1) + '/' + FILES.length + '] ' + f.name + ': ' + e.message);
      fail++;
    }
  }
  console.log('Done: ' + ok + ' ok, ' + fail + ' failed');
})();
