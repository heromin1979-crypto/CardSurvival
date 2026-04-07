var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/jFv6xj1q?cache_control=3600', name: 'colossus_core.png' },
  { url: 'https://www.genspark.ai/api/files/s/jwF33yu3?cache_control=3600', name: 'cryo_core.png' },
  { url: 'https://www.genspark.ai/api/files/s/5Nt3aaOY?cache_control=3600', name: 'inferno_core.png' },
  { url: 'https://www.genspark.ai/api/files/s/rfZVPgT3?cache_control=3600', name: 'wraith_essence.png' },
  { url: 'https://www.genspark.ai/api/files/s/F1F21AVf?cache_control=3600', name: 'horde_crown.png' },
  { url: 'https://www.genspark.ai/api/files/s/yfjoSPf6?cache_control=3600', name: 'acid_gland.png' },
  { url: 'https://www.genspark.ai/api/files/s/RrPZND7Q?cache_control=3600', name: 'alpha_fang.png' },
  { url: 'https://www.genspark.ai/api/files/s/CSGtQSmq?cache_control=3600', name: 'tiger_fang.png' },
  { url: 'https://www.genspark.ai/api/files/s/dEbpn9PB?cache_control=3600', name: 'tiger_fang_necklace.png' },
  { url: 'https://www.genspark.ai/api/files/s/Nwy6pPm4?cache_control=3600', name: 'leviathan_scale.png' },
  { url: 'https://www.genspark.ai/api/files/s/odDXKzjB?cache_control=3600', name: 'sewer_scale.png' },
  { url: 'https://www.genspark.ai/api/files/s/UGL7qqW9?cache_control=3600', name: 'queen_pheromone.png' },
  { url: 'https://www.genspark.ai/api/files/s/Av2aS4cv?cache_control=3600', name: 'mutant_heart.png' },
  { url: 'https://www.genspark.ai/api/files/s/ZwU0GS1J?cache_control=3600', name: 'ai_chip.png' },
  { url: 'https://www.genspark.ai/api/files/s/g0nRsBG7?cache_control=3600', name: 'royal_jelly_medicine.png' },
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
