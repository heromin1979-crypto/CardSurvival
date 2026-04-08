var FILES = [
  { url: 'https://www.genspark.ai/api/files/s/MxeFDq0s?cache_control=3600', name: 'bandage.png' },
  { url: 'https://www.genspark.ai/api/files/s/cMsV0gEc?cache_control=3600', name: 'painkiller.png' },
  { url: 'https://www.genspark.ai/api/files/s/R19rEfS1?cache_control=3600', name: 'strong_painkiller.png' },
  { url: 'https://www.genspark.ai/api/files/s/ZkOWr56Q?cache_control=3600', name: 'antibiotics.png' },
  { url: 'https://www.genspark.ai/api/files/s/GFWLqQOu?cache_control=3600', name: 'antidote.png' },
  { url: 'https://www.genspark.ai/api/files/s/04cUXPZd?cache_control=3600', name: 'first_aid_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/Nc07pSXq?cache_control=3600', name: 'emergency_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/6snWbsbG?cache_control=3600', name: 'antiseptic.png' },
  { url: 'https://www.genspark.ai/api/files/s/SCSKdRNj?cache_control=3600', name: 'herbal_medicine.png' },
  { url: 'https://www.genspark.ai/api/files/s/QU1XDbkb?cache_control=3600', name: 'vitamins.png' },
  { url: 'https://www.genspark.ai/api/files/s/8QaH7jeq?cache_control=3600', name: 'splint.png' },
  { url: 'https://www.genspark.ai/api/files/s/424UlSSz?cache_control=3600', name: 'surgery_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/0HLGQsW3?cache_control=3600', name: 'surgical_grade_kit.png' },
  { url: 'https://www.genspark.ai/api/files/s/ifNzkbAx?cache_control=3600', name: 'stamina_tonic.png' },
  { url: 'https://www.genspark.ai/api/files/s/maB9bFEQ?cache_control=3600', name: 'rad_blocker.png' },
  { url: 'https://www.genspark.ai/api/files/s/lSfOHfUv?cache_control=3600', name: 'radiation_cleanser.png' },
  { url: 'https://www.genspark.ai/api/files/s/LbefdTfh?cache_control=3600', name: 'mutant_formula.png' },
  { url: 'https://www.genspark.ai/api/files/s/CnWu3n1S?cache_control=3600', name: 'hermit_elixir.png' },
  { url: 'https://www.genspark.ai/api/files/s/cQBboKWC?cache_control=3600', name: 'universal_antidote.png' },
  { url: 'https://www.genspark.ai/api/files/s/tr5uIQFe?cache_control=3600', name: 'veterinary_tranquilizer.png' },
  { url: 'https://www.genspark.ai/api/files/s/1NeuYjDi?cache_control=3600', name: 'combat_stimulant.png' },
  { url: 'https://www.genspark.ai/api/files/s/5TMtXIiC?cache_control=3600', name: 'experimental_antiviral.png' },
  { url: 'https://www.genspark.ai/api/files/s/HBvRwswn?cache_control=3600', name: 'completed_antiviral.png' }
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
