// === DATA EDITOR — GitHub Contents API client ===
// Reads/commits single files on a target branch using a user-supplied PAT.
// The PAT (fine-grained, "Contents: Read and write" on this repo) is stored
// in localStorage on the user's own device — the editor page itself is static
// and carries no secret.

const LS_KEY = 'cs_editor_settings';

export function loadSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { /* ignore */ }
  return {
    owner: s.owner || 'heromin1979-crypto',
    repo: s.repo || 'cardsurvival',
    branch: s.branch || 'claude/gifted-bohr-VOpOS',
    token: s.token || '',
  };
}

export function saveSettings(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s));
}

// UTF-8 safe base64 (data files contain Korean text).
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function api(settings, path, opts = {}) {
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/${path}`;
  return fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${settings.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(opts.headers || {}),
    },
  });
}

/** Verify the token + repo + branch are reachable. Returns the branch's latest commit sha. */
export async function verifyAccess(settings) {
  const res = await api(settings, `branches/${encodeURIComponent(settings.branch)}`);
  if (!res.ok) {
    throw new Error(`접근 실패 (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  return data.commit?.sha;
}

/** Fetch a file's text + blob sha from the target branch. */
export async function getFile(settings, filePath) {
  const res = await api(
    settings,
    `contents/${filePath}?ref=${encodeURIComponent(settings.branch)}`,
  );
  if (!res.ok) {
    throw new Error(`파일 읽기 실패 ${filePath} (${res.status})`);
  }
  const data = await res.json();
  return { text: base64ToUtf8(data.content), sha: data.sha };
}

/** Commit new content for a file on the target branch. Returns commit html_url. */
export async function putFile(settings, filePath, newText, sha, message) {
  const res = await api(settings, `contents/${filePath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: utf8ToBase64(newText),
      sha,
      branch: settings.branch,
    }),
  });
  if (!res.ok) {
    throw new Error(`커밋 실패 ${filePath} (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  return data.commit?.html_url;
}
