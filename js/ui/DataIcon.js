import { uiIcon } from './UiIcon.js';

const GLYPH_NAMES = new Map([
  ['🌿', 'herb'],
  ['💉', 'syringe'],
  ['💧', 'water'], ['🌊', 'water'],
  ['🌾', 'grain'],
  ['🔥', 'fire'],
  ['🏥', 'medical'],
  ['🧪', 'vial'],
  ['💊', 'pill'],
  ['⚡', 'power'], ['🔋', 'power'],
  ['⚙️', 'gear'],
  ['🗡️', 'blade'], ['⚔️', 'blade'],
  ['🫙', 'jar'],
  ['🍲', 'meal'], ['🥣', 'meal'],
  ['🥩', 'meat'], ['🍖', 'meat'],
  ['🐟', 'fish'],
  ['🛡️', 'shield'],
  ['🔧', 'wrench'],
  ['📦', 'box'],
  ['🩸', 'blood'],
  ['🔪', 'knife'],
  ['🪨', 'rock'],
  ['🔬', 'microscope'],
  ['🥫', 'can'],
  ['🧵', 'thread'], ['🪡', 'thread'],
  ['🌲', 'tree'], ['🌳', 'tree'],
  ['🔩', 'bolt'],
  ['🎣', 'rod'],
  ['🍄', 'mushroom'],
  ['🌱', 'sprout'],
  ['🧱', 'brick'],
  ['🔫', 'gun'],
  ['🦺', 'vest'],
  ['☢️', 'radiation'],
  ['📡', 'antenna'],
  ['🪵', 'wood'],
  ['👤', 'person'], ['🧓', 'person'], ['👨', 'person'], ['👩', 'person'],
  ['👩‍⚕️', 'nurse'],
  ['🪖', 'soldier'],
  ['🧒', 'child'],
  ['👨‍🔧', 'mechanic'],
  ['🧑‍💼', 'trader'],
  ['👨‍🎓', 'student'],
  ['🐕', 'dog'], ['🐶', 'dog'],
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function dataIcon(iconValue, { className = '', label = '' } = {}) {
  if (iconValue == null || iconValue === '') {
    return uiIcon('item', { className, label });
  }

  const glyph = String(iconValue);
  const name = GLYPH_NAMES.get(glyph);
  const classes = `data-icon data-icon--${name ?? 'glyph'}${className ? ` ${escapeHtml(className)}` : ''}`;
  const accessibility = label
    ? `role="img" aria-label="${escapeHtml(label)}"`
    : 'aria-hidden="true"';

  return `<span class="${classes}" ${accessibility}>${name ? '' : escapeHtml(glyph)}</span>`;
}
