var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/MowTfQdD?cache_control=3600', name: 'workbench.png' },
  { url: 'https://www.genspark.ai/api/files/s/0nRQTHte?cache_control=3600', name: 'barricade.png' },
  { url: 'https://www.genspark.ai/api/files/s/thPCFm51?cache_control=3600', name: 'fireproof_barricade.png' },
  { url: 'https://www.genspark.ai/api/files/s/yhqxqOmQ?cache_control=3600', name: 'reinforced_shelter.png' },
  { url: 'https://www.genspark.ai/api/files/s/AHlLXzTJ?cache_control=3600', name: 'garden.png' },
  { url: 'https://www.genspark.ai/api/files/s/GWtE9w9i?cache_control=3600', name: 'field_laboratory.png' },
  { url: 'https://www.genspark.ai/api/files/s/9GTrvmvY?cache_control=3600', name: 'solar_generator.png' },
  { url: 'https://www.genspark.ai/api/files/s/ksNLMXVd?cache_control=3600', name: 'emergency_generator.png' },
  { url: 'https://www.genspark.ai/api/files/s/bczXBzke', name: 'old_generator.png' },
  { url: 'https://www.genspark.ai/api/files/s/2tFkK0bq', name: 'rain_collector.png' },
  { url: 'https://www.genspark.ai/api/files/s/uqgrt2A7', name: 'water_purifier.png' },
  { url: 'https://www.genspark.ai/api/files/s/wuEvxSiT', name: 'ammo_press.png' },
  { url: 'https://www.genspark.ai/api/files/s/OHBS51FQ', name: 'auto_turret.png' },
  { url: 'https://www.genspark.ai/api/files/s/n2qEbifx', name: 'thorn_wire.png' },
  { url: 'https://www.genspark.ai/api/files/s/vEpEFLSm', name: 'water_trap.png' },
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
