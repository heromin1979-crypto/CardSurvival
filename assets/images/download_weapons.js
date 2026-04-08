var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/Xp6HBpoy?cache_control=3600', name: 'sharpened_knife.png' },
  { url: 'https://www.genspark.ai/api/files/s/fwGwStrl?cache_control=3600', name: 'machete.png' },
  { url: 'https://www.genspark.ai/api/files/s/c65Q4cA7?cache_control=3600', name: 'hand_axe.png' },
  { url: 'https://www.genspark.ai/api/files/s/LUk4Mpdc?cache_control=3600', name: 'baseball_bat.png' },
  { url: 'https://www.genspark.ai/api/files/s/neMEseyI?cache_control=3600', name: 'reinforced_bat.png' },
  { url: 'https://www.genspark.ai/api/files/s/YfZ5Q4hk?cache_control=3600', name: 'ultra_reinforced_bat.png' },
  { url: 'https://www.genspark.ai/api/files/s/DCsHk9lV?cache_control=3600', name: 'electric_blade.png' },
  { url: 'https://www.genspark.ai/api/files/s/Lrds9Ct2?cache_control=3600', name: 'frost_blade.png' },
  { url: 'https://www.genspark.ai/api/files/s/i0CR1huS?cache_control=3600', name: 'acid_whip.png' },
  { url: 'https://www.genspark.ai/api/files/s/LEeq2uWW?cache_control=3600', name: 'royal_katana.png' },
  { url: 'https://www.genspark.ai/api/files/s/PXufbjeg?cache_control=3600', name: 'explosive_bolt.png' },
  { url: 'https://www.genspark.ai/api/files/s/SblytCsG?cache_control=3600', name: 'fire_bolt.png' },
  { url: 'https://www.genspark.ai/api/files/s/6svcosT6?cache_control=3600', name: 'pistol.png' },
  { url: 'https://www.genspark.ai/api/files/s/3HCHZNO6?cache_control=3600', name: 'pistol_ammo.png' },
  { url: 'https://www.genspark.ai/api/files/s/jGbEMCIR?cache_control=3600', name: 'shotgun.png' },
  { url: 'https://www.genspark.ai/api/files/s/iBwcBo9Q?cache_control=3600', name: 'shotgun_ammo.png' },
  { url: 'https://www.genspark.ai/api/files/s/lK05gS5a?cache_control=3600', name: 'rifle_ammo.png' },
  { url: 'https://www.genspark.ai/api/files/s/rNA278Lt?cache_control=3600', name: 'silenced_pistol.png' },
  { url: 'https://www.genspark.ai/api/files/s/ATu1XDdQ?cache_control=3600', name: 'confiscated_sniper.png' },
  { url: 'https://www.genspark.ai/api/files/s/a3TpcZGb?cache_control=3600', name: 'warlord_rifle.png' },
  { url: 'https://www.genspark.ai/api/files/s/KIBTC9gb?cache_control=3600', name: 'torch.png' },
  { url: 'https://www.genspark.ai/api/files/s/LrOGgJe3?cache_control=3600', name: 'stun_gun.png' },
  { url: 'https://www.genspark.ai/api/files/s/pQA4nqa1?cache_control=3600', name: 'molotov_cocktail.png' },
  { url: 'https://www.genspark.ai/api/files/s/nNqZcmYV?cache_control=3600', name: 'flashbang.png' },
  { url: 'https://www.genspark.ai/api/files/s/vzW3AjQv?cache_control=3600', name: 'smoke_bomb.png' },
  { url: 'https://www.genspark.ai/api/files/s/XjYfscdu?cache_control=3600', name: 'directional_mine.png' },
  { url: 'https://www.genspark.ai/api/files/s/WOAluFJZ?cache_control=3600', name: 'acid_crystal.png' },
  { url: 'https://www.genspark.ai/api/files/s/quEyFjFT?cache_control=3600', name: 'spike_trap.png' },
  { url: 'https://www.genspark.ai/api/files/s/JqLaPrB9?cache_control=3600', name: 'alarm_trap.png' },
  { url: 'https://www.genspark.ai/api/files/s/YrgQNVvK?cache_control=3600', name: 'spear.png' },
  { url: 'https://www.genspark.ai/api/files/s/XXa7S3TY?cache_control=3600', name: 'iron_pipe.png' },
  { url: 'https://www.genspark.ai/api/files/s/VfhFHfqH?cache_control=3600', name: 'spiked_pipe.png' },
  { url: 'https://www.genspark.ai/api/files/s/zKsqmShf?cache_control=3600', name: 'sling.png' },
  { url: 'https://www.genspark.ai/api/files/s/Jq55spr3?cache_control=3600', name: 'crossbow.png' },
  { url: 'https://www.genspark.ai/api/files/s/Mvh3Yshq?cache_control=3600', name: 'crossbow_bolt.png' }
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
