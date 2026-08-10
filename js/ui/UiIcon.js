const ICON_NAMES = new Set([
  'location',
  'map',
  'season',
  'temperature',
  'explore',
  'quest',
  'basecamp',
  'weather',
  'item',
  'injury',
  'action',
  'manage',
  'companion',
  'craft',
  'skills',
  'rest',
  'health',
  'build',
  'warning',
  'lock',
]);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function uiIcon(name, { className = '', label = '' } = {}) {
  if (!ICON_NAMES.has(name)) {
    throw new Error(`Unknown UI icon: ${name}`);
  }

  const classes = `ui-icon ui-icon--${name}${className ? ` ${escapeHtml(className)}` : ''}`;
  const accessibility = label
    ? `role="img" aria-label="${escapeHtml(label)}"`
    : 'aria-hidden="true"';

  return `<span class="${classes}" ${accessibility}></span>`;
}
