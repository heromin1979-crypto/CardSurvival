var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/eX3kzOsG?cache_control=3600', name: 'reinforced_shield.png' },
  { url: 'https://www.genspark.ai/api/files/s/Rhv6etSe?cache_control=3600', name: 'm4_carbine.png' },
  { url: 'https://www.genspark.ai/api/files/s/ctkGi4uM?cache_control=3600', name: 'master_toolkit.png' },
  { url: 'https://www.genspark.ai/api/files/s/zVb7L3Tb?cache_control=3600', name: 'zero_strain.png' },
  { url: 'https://www.genspark.ai/api/files/s/S88hp1Cl?cache_control=3600', name: 'master_forge.png' },
  { url: 'https://www.genspark.ai/api/files/s/J8dApYMS?cache_control=3600', name: 'industrial_purifier.png' },
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
