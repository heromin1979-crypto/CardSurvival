import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const FALLBACK = './assets/images/combat_jongno_subway_clean_v2.png';

describe('combat fallback backdrop', () => {
  it('references an existing fallback asset instead of the removed subway file', () => {
    const source = readFileSync('js/ui/CombatUI.js', 'utf8');
    expect(existsSync(FALLBACK.slice(2))).toBe(true);
    expect(source).toContain(`?? '${FALLBACK}'`);
    expect(source).not.toContain("?? './assets/images/subway_ruined.jpg'");
  });
});
