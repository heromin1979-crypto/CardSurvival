var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/9N4E13gl?cache_control=3600', name: 'env_sunny.png' },
  { url: 'https://www.genspark.ai/api/files/s/uGczPLWr?cache_control=3600', name: 'env_cloudy.png' },
  { url: 'https://www.genspark.ai/api/files/s/vdMG4WQB?cache_control=3600', name: 'env_rainy.png' },
  { url: 'https://www.genspark.ai/api/files/s/mh2dec0o?cache_control=3600', name: 'env_foggy.png' },
  { url: 'https://www.genspark.ai/api/files/s/REO6yoB4?cache_control=3600', name: 'env_snow.png' },
  { url: 'https://www.genspark.ai/api/files/s/Mxw8oQWH?cache_control=3600', name: 'env_storm.png' },
  { url: 'https://www.genspark.ai/api/files/s/RT877cVR?cache_control=3600', name: 'env_overcast.png' },
  { url: 'https://www.genspark.ai/api/files/s/sGL67kUh?cache_control=3600', name: 'env_hot.png' },
  { url: 'https://www.genspark.ai/api/files/s/PtOSbVXS?cache_control=3600', name: 'env_windy.png' },
  { url: 'https://www.genspark.ai/api/files/s/agslZa3P?cache_control=3600', name: 'env_monsoon.png' },
  { url: 'https://www.genspark.ai/api/files/s/EoHVRO2l?cache_control=3600', name: 'env_clear.png' },
  { url: 'https://www.genspark.ai/api/files/s/ORHndw79?cache_control=3600', name: 'env_blizzard.png' },
  { url: 'https://www.genspark.ai/api/files/s/xvukWuyy?cache_control=3600', name: 'env_acid_rain.png' },
  { url: 'https://www.genspark.ai/api/files/s/g0eGaNN4?cache_control=3600', name: 'env_event_heatwave.png' },
  { url: 'https://www.genspark.ai/api/files/s/EUp5zLRZ?cache_control=3600', name: 'env_event_extreme_cold.png' },
  { url: 'https://www.genspark.ai/api/files/s/cGekCrc4?cache_control=3600', name: 'env_event_drought.png' },
  { url: 'https://www.genspark.ai/api/files/s/IuRiVRqO?cache_control=3600', name: 'env_event_frost.png' },
  { url: 'https://www.genspark.ai/api/files/s/mG1pcmAc?cache_control=3600', name: 'env_event_monsoon_heavy.png' },
  { url: 'https://www.genspark.ai/api/files/s/TolOXM6p?cache_control=3600', name: 'env_event_typhoon.png' },
  { url: 'https://www.genspark.ai/api/files/s/LI5xJHY2?cache_control=3600', name: 'env_event_pollen.png' },
  { url: 'https://www.genspark.ai/api/files/s/3wPdntgj?cache_control=3600', name: 'env_event_spring_rain.png' },
  { url: 'https://www.genspark.ai/api/files/s/4c7oTZMV?cache_control=3600', name: 'env_event_warmth.png' },
  { url: 'https://www.genspark.ai/api/files/s/xMlzoNm6?cache_control=3600', name: 'env_event_zombie_migration.png' }
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
