var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/22p1PhAv?cache_control=3600', name: 'death_dehydration.webp' },
  { url: 'https://www.genspark.ai/api/files/s/crKiqK9Z?cache_control=3600', name: 'death_starvation.webp' },
  { url: 'https://www.genspark.ai/api/files/s/CvSZbnFR?cache_control=3600', name: 'death_hypothermia.webp' },
  { url: 'https://www.genspark.ai/api/files/s/Zd0dHzDJ?cache_control=3600', name: 'death_radiation.webp' },
  { url: 'https://www.genspark.ai/api/files/s/v0Aj20aK?cache_control=3600', name: 'death_disease.webp' },
  { url: 'https://www.genspark.ai/api/files/s/4bjyNsDO?cache_control=3600', name: 'death_combat.webp' },
  { url: 'https://www.genspark.ai/api/files/s/up5rpqAF?cache_control=3600', name: 'death_infection.webp' },
  { url: 'https://www.genspark.ai/api/files/s/XxQq4BKo?cache_control=3600', name: 'death_fall.webp' },
  { url: 'https://www.genspark.ai/api/files/s/40hJlCaj?cache_control=3600', name: 'death_exhaustion.webp' },
  { url: 'https://www.genspark.ai/api/files/s/LLw1JMf6?cache_control=3600', name: 'death_other.webp' },
  { url: 'https://www.genspark.ai/api/files/s/CqKEqcYu?cache_control=3600', name: 'season_spring.webp' },
  { url: 'https://www.genspark.ai/api/files/s/N7PhXCiJ?cache_control=3600', name: 'season_summer.webp' },
  { url: 'https://www.genspark.ai/api/files/s/ISd5szbp?cache_control=3600', name: 'season_autumn.webp' },
  { url: 'https://www.genspark.ai/api/files/s/64KrjBnd?cache_control=3600', name: 'season_winter.webp' },
  { url: 'https://www.genspark.ai/api/files/s/sx6mwkBG?cache_control=3600', name: 'season_shock.webp' },
  { url: 'https://www.genspark.ai/api/files/s/JQAsu8T0?cache_control=3600', name: 'char_doctor_final.webp' },
  { url: 'https://www.genspark.ai/api/files/s/qgXVcnL7?cache_control=3600', name: 'char_soldier_final.webp' },
  { url: 'https://www.genspark.ai/api/files/s/GPQb1eZv?cache_control=3600', name: 'char_firefighter_final.webp' },
  { url: 'https://www.genspark.ai/api/files/s/ZnwmFoND?cache_control=3600', name: 'char_homeless_final.webp' },
  { url: 'https://www.genspark.ai/api/files/s/jkUcI5xW?cache_control=3600', name: 'char_pharmacist_final.webp' },
  { url: 'https://www.genspark.ai/api/files/s/m6Rf6nlI?cache_control=3600', name: 'char_engineer_final.webp' },
  { url: 'https://www.genspark.ai/api/files/s/Jla3y3kz?cache_control=3600', name: 'ending_escape.webp' },
  { url: 'https://www.genspark.ai/api/files/s/LZphrGys?cache_control=3600', name: 'ending_survival.webp' },
  { url: 'https://www.genspark.ai/api/files/s/vbSVG9xf?cache_control=3600', name: 'ending_broadcast.webp' },
  { url: 'https://www.genspark.ai/api/files/s/m0ysCQpf?cache_control=3600', name: 'ending_cure.webp' }
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
