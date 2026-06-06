// === DATA EDITOR — local API client ===
// 로컬 serve.js와 통신: 데이터는 로컬 파일에서 읽고, 저장/푸시는 로컬 git으로.
// (GitHub PAT 불필요 — 전부 로컬 워크플로)

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.error || `${url} 실패 (${res.status})`);
    e.detail = data.detail || '';
    throw e;
  }
  return data;
}

/** 현재 git 브랜치 등 정보. serve.js가 떠 있어야 동작. */
export function getInfo() {
  return postJSON('/api/info', {});
}

/** 로컬 데이터 파일 원문을 가져온다 (서버 루트 기준 절대경로). */
export async function getFileText(filePath) {
  const res = await fetch('/' + filePath, { cache: 'no-store' });
  if (!res.ok) throw new Error(`파일 읽기 실패 ${filePath} (${res.status})`);
  return res.text();
}

/** 수정된 파일들을 로컬 디스크에 기록. files: [{path, content}] */
export function saveFiles(files) {
  return postJSON('/api/save', { files });
}

/** git add/commit/push (현재 브랜치). body = 커밋 본문(변경 요약). */
export function pushChanges(message, paths, body) {
  return postJSON('/api/push', { message, paths, body });
}
