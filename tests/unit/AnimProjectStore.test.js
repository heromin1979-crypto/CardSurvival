import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { listProjects, readProject, writeProject } from '../../tools/animProjectStore.cjs';

describe('animProjectStore', () => {
  let root;
  beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'animproj-')); });
  afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

  it('저장 후 같은 이름으로 다시 읽을 수 있다', () => {
    const project = { v: 3, path: '/assets/images/combat/spritesheets/doctor_f_sheet.png', cols: 6 };
    const saved = writeProject(root, 'doctor_f_sheet.anim.json', project);
    expect(saved.name).toBe('doctor_f_sheet.anim.json');
    expect(readProject(root, 'doctor_f_sheet.anim.json')).toEqual(project);
  });

  it('목록에 이름·시트 경로·수정시각을 반환한다', () => {
    writeProject(root, 'a_sheet.anim.json', { path: '/assets/a.png' });
    writeProject(root, 'b_sheet.anim.json', { path: '/assets/b.png' });
    const list = listProjects(root);
    expect(list.map((p) => p.name)).toEqual(['a_sheet.anim.json', 'b_sheet.anim.json']);
    expect(list[0].sheetPath).toBe('/assets/a.png');
    expect(list[0].mtimeMs).toBeGreaterThan(0);
  });

  it('경로 탈출·비정상 이름을 거부한다', () => {
    expect(() => writeProject(root, '../evil.anim.json', {})).toThrow();
    expect(() => writeProject(root, 'a/b.anim.json', {})).toThrow();
    expect(() => writeProject(root, 'x.json', {})).toThrow();
    expect(readProject(root, '../evil.anim.json')).toBeNull();
  });

  it('없는 프로젝트는 null, 빈 디렉터리는 빈 목록', () => {
    expect(readProject(root, 'none_sheet.anim.json')).toBeNull();
    expect(listProjects(root)).toEqual([]);
  });
});
