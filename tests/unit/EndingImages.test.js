import { describe, expect, it } from 'vitest';
import { getEndingImage } from '../../js/data/endingImages.js';

describe('character ending image lookup', () => {
  it('keeps identical ending codes scoped to their character', () => {
    expect(getEndingImage('doctor', 'a1_vaccine')?.src).toBe('assets/endings/doctor_a1_vaccine.png');
    expect(getEndingImage('firefighter', 'b3_escape')?.src).toBe('assets/endings/firefighter_b3_escape.png');
  });

  it('resolves active chef ending assets', () => {
    expect(getEndingImage('chef', 'a1_network')?.src).toBe('assets/endings/chef_a1_network.png');
    expect(getEndingImage('chef', 'a2_farm')?.src).toBe('assets/endings/chef_a2_farm.png');
    expect(getEndingImage('chef', 'b1_ascension')?.src).toBe('assets/endings/chef_b1_ascension.png');
  });

  it('returns null for an invalid pair', () => expect(getEndingImage('doctor', 'b3_escape')).toBeNull());
});
