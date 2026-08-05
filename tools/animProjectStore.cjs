const fs = require('node:fs');
const path = require('node:path');

const PROJECT_SUBDIR = path.join('art_sources', 'combat', 'anim_projects');
// 시트 파일명 유래 이름만 허용 — 경로 구분자·상위 탈출 차단
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*\.anim\.json$/;

function projectDir(root) { return path.join(root, PROJECT_SUBDIR); }

function safeName(name) {
  const n = String(name || '');
  return NAME_RE.test(n) && !n.includes('..') ? n : null;
}

function listProjects(root) {
  const dir = projectDir(root);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.anim.json'))
    .map((f) => {
      const file = path.join(dir, f);
      let sheetPath = null;
      try { sheetPath = JSON.parse(fs.readFileSync(file, 'utf8')).path || null; } catch (e) { /* 손상 파일도 목록에는 노출 */ }
      return { name: f, sheetPath, mtimeMs: fs.statSync(file).mtimeMs };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readProject(root, name) {
  const n = safeName(name);
  if (!n) return null;
  const file = path.join(projectDir(root), n);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeProject(root, name, project) {
  const n = safeName(name);
  if (!n) throw new Error('잘못된 프로젝트 이름: ' + name);
  if (!project || typeof project !== 'object' || Array.isArray(project)) throw new Error('project 객체가 필요합니다');
  const dir = projectDir(root);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, n);
  fs.writeFileSync(file, JSON.stringify(project, null, 2));
  return { name: n, path: file };
}

module.exports = { listProjects, readProject, writeProject, safeName, projectDir, PROJECT_SUBDIR };
