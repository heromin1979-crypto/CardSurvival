import { describe, it, expect } from 'vitest';
import { FX_PARTICLE_MAP, ACTION_BINDINGS, COMBAT_FEEL, SOCKET_OVERRIDES } from '../../js/data/combatFxConfig.js';
import { readFileSync } from 'node:fs';
import { COMBAT_ASSETS } from '../../js/data/combatAssets.js';
import { builtinLibrary } from '../../js/ui/combat/fx/fxLibrary.js';
import { compileGraph } from '../../js/ui/combat/fx/fxNodes.js';
import { IMPACT_FX_KEYS } from '../../js/ui/combat/combatUiAssets.js';

const LIB = new Map(builtinLibrary().map(g => [g.id, g]));

describe('개선 전투 연출 설정', () => {
  it('내장 이펙트 그래프는 모두 오류 없이 컴파일된다', () => {
    for (const g of LIB.values()) {
      const { chains, errors } = compileGraph(g);
      expect(errors, g.id).toEqual([]);
      expect(chains.length, g.id).toBeGreaterThan(0);
    }
  });

  it('fx 키 매핑과 발동 바인딩이 가리키는 이펙트가 라이브러리에 있다', () => {
    const ids = [
      ...Object.values(FX_PARTICLE_MAP).flat().map(p => p.id),
      ...Object.values(ACTION_BINDINGS).flat().map(p => p.id),
      'tracer',
    ];
    for (const id of ids) expect(LIB.has(id), id).toBe(true);
  });

  it('게임의 모든 타격 fx 키가 파티클 매핑을 가진다', () => {
    for (const key of IMPACT_FX_KEYS) expect(FX_PARTICLE_MAP[key], key).toBeDefined();
  });

  it('개선 전(legacy) 값은 기존 코드 수치와 같다', () => {
    expect(COMBAT_FEEL.legacy.hitstop).toBe(70);
    expect(COMBAT_FEEL.legacy.critHitstop).toBe(120);
  });

  it('소켓 보정 키는 실제 스프라이트 시트에 있다', () => {
    const manifest = JSON.parse(readFileSync('assets/images/combat/spritesheets/manifest.json', 'utf8'));
    for (const key of Object.keys(SOCKET_OVERRIDES)) expect(manifest[key], key).toBeDefined();
  });

  it('모든 전투 배경은 무대 연출 메타(env.indoor·horizon)를 가진다', () => {
    for (const scene of Object.values(COMBAT_ASSETS.scenes)) {
      expect(typeof scene.env?.indoor, scene.id).toBe('boolean');
      expect(scene.env.horizon, scene.id).toBeGreaterThan(0);
    }
  });

  it('처치 슬로모션은 느려지기만 한다', () => {
    expect(COMBAT_FEEL.enhanced.killSlowmo).toBeGreaterThan(0);
    expect(COMBAT_FEEL.enhanced.killSlowmo).toBeLessThan(1);
  });
});
