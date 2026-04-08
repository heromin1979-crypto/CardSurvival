var FILES = [
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
