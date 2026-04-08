var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/8vKUfVsk?cache_control=3600', name: 'small_bag.png' },
  { url: 'https://www.genspark.ai/api/files/s/D32UqqQi?cache_control=3600', name: 'duffel_bag.png' },
  { url: 'https://www.genspark.ai/api/files/s/FKkDwqJs?cache_control=3600', name: 'messenger_bag.png' },
  { url: 'https://www.genspark.ai/api/files/s/JCPJeqLv?cache_control=3600', name: 'military_bag.png' },
  { url: 'https://www.genspark.ai/api/files/s/jsFot87X?cache_control=3600', name: 'waterproof_container.png' },
  { url: 'https://www.genspark.ai/api/files/s/wTNbNbH9?cache_control=3600', name: 'storage_box.png' },
  { url: 'https://www.genspark.ai/api/files/s/voHl01ZO?cache_control=3600', name: 'fuel_can.png' },
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
