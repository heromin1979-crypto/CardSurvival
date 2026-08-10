import { describe, expect, it } from 'vitest';
import { dataIcon } from '../../js/ui/DataIcon.js';

describe('dataIcon', () => {
  it('maps a supported pill glyph to its semantic icon', () => {
    expect(dataIcon('💊')).toBe(
      '<span class="data-icon data-icon--pill" aria-hidden="true"></span>',
    );
  });

  it('preserves an unsupported glyph in the fallback output', () => {
    expect(dataIcon('🧶')).toBe(
      '<span class="data-icon data-icon--glyph" aria-hidden="true">🧶</span>',
    );
  });

  it('escapes a label and class name before putting them in HTML', () => {
    expect(dataIcon('💊', { className: 'card"><svg', label: '<약 & "주의">' })).toBe(
      '<span class="data-icon data-icon--pill card&quot;&gt;&lt;svg" role="img" aria-label="&lt;약 &amp; &quot;주의&quot;&gt;"></span>',
    );
  });

  it('uses the item UI icon when the input is null', () => {
    expect(dataIcon(null)).toBe(
      '<span class="ui-icon ui-icon--item" aria-hidden="true"></span>',
    );
  });
});
