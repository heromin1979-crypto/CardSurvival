var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/jC9YwF8q?cache_control=3600', name: 'soldier_dogtag.png' },
  { url: 'https://www.genspark.ai/api/files/s/k9rcNBvp?cache_control=3600', name: 'crew_pass.png' },
  { url: 'https://www.genspark.ai/api/files/s/bRwFjLeI?cache_control=3600', name: 'debt_ledger.png' },
  { url: 'https://www.genspark.ai/api/files/s/NCLVCbhl?cache_control=3600', name: 'civil_defense_cache.png' },
  { url: 'https://www.genspark.ai/api/files/s/WYwPMfyO?cache_control=3600', name: 'cult_talisman.png' },
  { url: 'https://www.genspark.ai/api/files/s/yAMrC5nu', name: 'doctor_badge.png' },
  { url: 'https://www.genspark.ai/api/files/s/cXJkLeU0', name: 'firefighter_badge.png' },
  { url: 'https://www.genspark.ai/api/files/s/E76b8cH1', name: 'seoul_emergency_plan.png' },
  { url: 'https://www.genspark.ai/api/files/s/W2aIcbaR', name: 'virus_sample.png' },
  { url: 'https://www.genspark.ai/api/files/s/r2ElszQ8', name: 'aircraft_parts.png' },
  { url: 'https://www.genspark.ai/api/files/s/y4rM6F6b', name: 'river_boat.png' },
  { url: 'https://www.genspark.ai/api/files/s/eJqLaazR', name: 'survivors_cache.png' },
  { url: 'https://www.genspark.ai/api/files/s/el8dLWZD', name: 'helicopter_key.png' },
  { url: 'https://www.genspark.ai/api/files/s/GD7g5i4t', name: 'conductor_key.png' },
  { url: 'https://www.genspark.ai/api/files/s/heQLpb7f', name: 'gold_watch.png' },
  { url: 'https://www.genspark.ai/api/files/s/HezN6QTO?cache_control=3600', name: 'gold_watch_raw.png' },
  { url: 'https://www.genspark.ai/api/files/s/vAp6ShZx?cache_control=3600', name: 'mothers_necklace.png' },
  { url: 'https://www.genspark.ai/api/files/s/aJs5WWXy?cache_control=3600', name: 'warlord_medal.png' },
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
