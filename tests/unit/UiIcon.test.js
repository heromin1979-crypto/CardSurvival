import { describe, expect, it } from 'vitest';
import { uiIcon } from '../../js/ui/UiIcon.js';

describe('uiIcon', () => {
  it('renders a decorative location icon', () => {
    expect(uiIcon('location')).toBe(
      '<span class="ui-icon ui-icon--location" aria-hidden="true"></span>',
    );
  });

  it('renders a labelled temperature icon with its extra class', () => {
    expect(uiIcon('temperature', { className: 'hud-icon', label: '온도' })).toBe(
      '<span class="ui-icon ui-icon--temperature hud-icon" role="img" aria-label="온도"></span>',
    );
  });

  it('rejects unsupported icon names', () => {
    expect(() => uiIcon('unknown')).toThrow('Unknown UI icon: unknown');
  });

  it('escapes labels before including them in HTML attributes', () => {
    expect(uiIcon('weather', { label: '<맑음 & "강풍">' })).toBe(
      '<span class="ui-icon ui-icon--weather" role="img" aria-label="&lt;맑음 &amp; &quot;강풍&quot;&gt;"></span>',
    );
  });

  for (const name of ['action', 'manage', 'companion', 'craft', 'skills', 'rest', 'health', 'build', 'warning', 'lock']) {
    it(`renders ${name} as a decorative icon`, () => {
      expect(uiIcon(name)).toBe(
        `<span class="ui-icon ui-icon--${name}" aria-hidden="true"></span>`,
      );
    });

    it(`renders ${name} with an accessible label`, () => {
      expect(uiIcon(name, { label: 'HUD label' })).toBe(
        `<span class="ui-icon ui-icon--${name}" role="img" aria-label="HUD label"></span>`,
      );
    });
  }
});
