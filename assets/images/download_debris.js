var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/ImEqIKVt?cache_control=3600', name: 'broken_chair.png' },
  { url: 'https://www.genspark.ai/api/files/s/OyIzRmG9?cache_control=3600', name: 'broken_lamp.png' },
  { url: 'https://www.genspark.ai/api/files/s/IB2tsmML?cache_control=3600', name: 'broken_radio.png' },
  { url: 'https://www.genspark.ai/api/files/s/fJ26xk0B?cache_control=3600', name: 'broken_washing_machine.png' },
  { url: 'https://www.genspark.ai/api/files/s/0gxnXifO?cache_control=3600', name: 'abandoned_fridge.png' },
  { url: 'https://www.genspark.ai/api/files/s/4cw3yTu2?cache_control=3600', name: 'old_ac_unit.png' },
  { url: 'https://www.genspark.ai/api/files/s/q5LltNKq?cache_control=3600', name: 'old_fire_extinguisher.png' },
  { url: 'https://www.genspark.ai/api/files/s/gJt0ahih?cache_control=3600', name: 'old_mailbox.png' },
  { url: 'https://www.genspark.ai/api/files/s/d9AKiZ25?cache_control=3600', name: 'wrecked_bicycle.png' },
  { url: 'https://www.genspark.ai/api/files/s/Wvuabt4T?cache_control=3600', name: 'wrecked_bus.png' },
  { url: 'https://www.genspark.ai/api/files/s/Y2IcPUKK?cache_control=3600', name: 'wrecked_car.png' },
  { url: 'https://www.genspark.ai/api/files/s/tzjaI0Qq?cache_control=3600', name: 'destroyed_kiosk.png' },
  { url: 'https://www.genspark.ai/api/files/s/crbwp5fR?cache_control=3600', name: 'traffic_light.png' },
  { url: 'https://www.genspark.ai/api/files/s/rfOXn20y?cache_control=3600', name: 'collapsed_guard_post.png' },
  { url: 'https://www.genspark.ai/api/files/s/eT268NLD?cache_control=3600', name: 'collapsed_scaffold.png' },
  { url: 'https://www.genspark.ai/api/files/s/Ft0g0BSH?cache_control=3600', name: 'collapsed_shelf.png' },
  { url: 'https://www.genspark.ai/api/files/s/Guq9iGr1?cache_control=3600', name: 'telephone_booth.png' },
  { url: 'https://www.genspark.ai/api/files/s/PT7RHX8g?cache_control=3600', name: 'street_vendor_cart.png' },
  { url: 'https://www.genspark.ai/api/files/s/KfsVOsP6?cache_control=3600', name: 'vending_machine.png' },
  { url: 'https://www.genspark.ai/api/files/s/En49bFfn?cache_control=3600', name: 'subway_gate.png' },
  { url: 'https://www.genspark.ai/api/files/s/0ZVFFspB?cache_control=3600', name: 'rusted_toolbox.png' },
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
