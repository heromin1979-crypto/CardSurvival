import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve('css/screens-combat.css'), 'utf8');

describe('combat premium visual styles', () => {
  it('keeps the combat screen close to the approved cinematic sample', () => {
    expect(css).toContain('--combat-floor-y: clamp(42px, 6.4vh, 76px)');
    expect(css).toContain('--combat-ground-band-h: clamp(140px, 18vh, 190px)');
    expect(css).toContain('--combat-ally-sprite-size: clamp(250px, 34vh, 360px)');
    expect(css).toContain('--ally-sprite-size: var(--combat-ally-sprite-size)');
    expect(css).toContain('transform-origin: 50% 100%');
    expect(css).toContain('.combat-stage-lineup::after');
    expect(css).toContain('premiumActionCardSheen');
    expect(css).toContain('.action-card::before');
    expect(css).toContain('.init-round-label::before');
    expect(css).toContain('.ac-cost');
    expect(css).toContain('combatActorSilhouette');
    expect(css).toContain('height: clamp(184px, 19vh, 226px);');
    expect(css).toContain('.cv-player-fallback-img');
    expect(css).toContain('background: transparent');
    expect(css).toContain('mix-blend-mode: normal');
    expect(css).toContain('.combat-visual.camera-work-active::after');
    expect(css).toContain('combatCameraFocusSweep');
  });
});
