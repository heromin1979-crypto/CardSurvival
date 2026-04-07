var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/a4OB8Swv?cache_control=3600', name: 'boiled_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/jObIs06A?cache_control=3600', name: 'purified_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/HMYtQ0HN?cache_control=3600', name: 'contaminated_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/UUJkf6Wz?cache_control=3600', name: 'rainwater.png' },
  { url: 'https://www.genspark.ai/api/files/s/fIGGnKgf?cache_control=3600', name: 'pristine_spring_water.png' },
  { url: 'https://www.genspark.ai/api/files/s/WWFT6ztq?cache_control=3600', name: 'sports_drink.png' },
  { url: 'https://www.genspark.ai/api/files/s/HPllgYrY?cache_control=3600', name: 'coffee.png' },
  { url: 'https://www.genspark.ai/api/files/s/ktZLTPWg?cache_control=3600', name: 'herbal_tea.png' },
  { url: 'https://www.genspark.ai/api/files/s/C5ZY8ZB8?cache_control=3600', name: 'water_bottle.png' },
  { url: 'https://www.genspark.ai/api/files/s/dDy9qTmA?cache_control=3600', name: 'alcohol_drink.png' },
  { url: 'https://www.genspark.ai/api/files/s/lTnkdAcd?cache_control=3600', name: 'cooked_rice.png' },
  { url: 'https://www.genspark.ai/api/files/s/rKDV9cFh?cache_control=3600', name: 'cooked_noodles.png' },
  { url: 'https://www.genspark.ai/api/files/s/21kabv7H?cache_control=3600', name: 'dried_meat.png' },
  { url: 'https://www.genspark.ai/api/files/s/xRUCv1lu?cache_control=3600', name: 'raw_meat.png' },
  { url: 'https://www.genspark.ai/api/files/s/6OTUkMRG?cache_control=3600', name: 'canned_food.png' },
  { url: 'https://www.genspark.ai/api/files/s/UKJHWQmI?cache_control=3600', name: 'instant_noodles.png' },
  { url: 'https://www.genspark.ai/api/files/s/pydQZUzJ?cache_control=3600', name: 'energy_bar.png' },
  { url: 'https://www.genspark.ai/api/files/s/C4R9zh14?cache_control=3600', name: 'battle_ration.png' },
  { url: 'https://www.genspark.ai/api/files/s/UMwrUlcC?cache_control=3600', name: 'military_ration.png' },
  { url: 'https://www.genspark.ai/api/files/s/2mAnSVkn?cache_control=3600', name: 'premium_ration.png' },
  { url: 'https://www.genspark.ai/api/files/s/tot8AlCV?cache_control=3600', name: 'advanced_trauma_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/VQHOzWM3?cache_control=3600', name: 'field_transfusion_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/HW9ykcNC?cache_control=3600', name: 'immunity_serum.png' },
  { url: 'https://www.genspark.ai/api/files/s/SHioi4ng?cache_control=3600', name: 'vaccine.png' },
  { url: 'https://www.genspark.ai/api/files/s/mVLnbmSp?cache_control=3600', name: 'alcohol_swab.png' },
  { url: 'https://www.genspark.ai/api/files/s/prR2dSqY?cache_control=3600', name: 'stimulant.png' },
  { url: 'https://www.genspark.ai/api/files/s/oqGYiBRD?cache_control=3600', name: 'nail_bomb.png' },
  { url: 'https://www.genspark.ai/api/files/s/8aWPW76s?cache_control=3600', name: 'tactical_vest.png' },
  { url: 'https://www.genspark.ai/api/files/s/Lh1ZjOJq?cache_control=3600', name: 'kevlar_fabric.png' },
  { url: 'https://www.genspark.ai/api/files/s/9ANE6A9O?cache_control=3600', name: 'makeshift_shield.png' },
  { url: 'https://www.genspark.ai/api/files/s/ZpSyKVYg?cache_control=3600', name: 'shield.png' },
  { url: 'https://www.genspark.ai/api/files/s/hSGygoEg?cache_control=3600', name: 'ghillie_suit.png' },
  { url: 'https://www.genspark.ai/api/files/s/DczYrSH7?cache_control=3600', name: 'hazmat_suit.png' },
  { url: 'https://www.genspark.ai/api/files/s/EqAXiPTQ?cache_control=3600', name: 'knife.png' },
  { url: 'https://www.genspark.ai/api/files/s/Dxn2V8g6?cache_control=3600', name: 'backpack.png' },
  { url: 'https://www.genspark.ai/api/files/s/JOaQH3AS?cache_control=3600', name: 'campfire.png' },
  { url: 'https://www.genspark.ai/api/files/s/YylMIMeu?cache_control=3600', name: 'medical_station.png' },
  { url: 'https://www.genspark.ai/api/files/s/n2ndHnaA?cache_control=3600', name: 'engineer_gear.png' }
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
      console.log('OK: ' + f.name + ' (' + Math.round(blob.size/1024) + 'KB)');
      ok++;
      await new Promise(function(r) { setTimeout(r, 300); });
    } catch(e) {
      console.error('FAIL: ' + f.name + ': ' + e.message);
      fail++;
    }
  }
  console.log('Done: ' + ok + ' ok, ' + fail + ' failed');
})();
