// @vitest-environment happy-dom
// === 1차 분기 연출 테스트 ===
// 시네마틱 42개 중 분기·엔딩용은 4개뿐이었다. D21 1차 분기는 여섯 직업
// 전원이 반드시 통과하는 지점인데 연출이 없어 선택의 무게가 전달되지 않았다.
//
// QuestSystem은 퀘스트 완료 시 cinematicId를 1회 재생하고, 재생이 끝난 뒤에
// branchChoice 모달을 연다. 동시에 띄우면 시네마틱 위에 모달이 겹친다.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import SCENES from '../../js/data/cinematicScenes.js';
import DOCTOR from '../../js/data/mainQuests/doctor/index.js';
import SOLDIER from '../../js/data/mainQuests/soldier/index.js';
import ENGINEER from '../../js/data/mainQuests/engineer/index.js';
import CHEF from '../../js/data/mainQuests/chef/index.js';
import FIREFIGHTER from '../../js/data/mainQuests/firefighter/index.js';
import HOMELESS from '../../js/data/mainQuests/homeless/index.js';

const QUESTS = { doctor: DOCTOR, soldier: SOLDIER, engineer: ENGINEER,
                 chef: CHEF, firefighter: FIREFIGHTER, homeless: HOMELESS };
const CHARS = Object.keys(QUESTS);
const QS_SRC = readFileSync(join(dirname(fileURLToPath(import.meta.url)),
  '../../js/systems/QuestSystem.js'), 'utf8');

const firstBranch = (c) => Object.values(QUESTS[c])
  .filter(q => q.isBranchPoint)
  .sort((a, b) => (a.dayTrigger ?? 0) - (b.dayTrigger ?? 0))[0];

describe('여섯 직업 전원이 1차 분기 연출을 갖는다', () => {
  it.each(CHARS)('%s', (c) => {
    const q = firstBranch(c);
    expect(q, `${c}: 분기점 없음`).toBeDefined();
    expect(q.cinematicId, `${q.id}: 연출 미배선`).toBeTruthy();
    expect(SCENES[q.cinematicId], `없는 씬: ${q.cinematicId}`).toBeDefined();
  });

  it('여섯 연출이 서로 다른 씬을 쓴다', () => {
    const ids = CHARS.map(c => firstBranch(c).cinematicId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('연출 데이터 정합성', () => {
  const BRANCH_SCENES = CHARS.map(c => SCENES[firstBranch(c).cinematicId]);

  it.each(BRANCH_SCENES.map(s => [s.id, s]))('%s 가 필요한 필드를 갖춘다', (_id, s) => {
    expect(s.title).toBeTruthy();
    expect(s.subtitle).toBeTruthy();
    expect(s.gradient).toMatch(/^linear-gradient/);
    expect(s.lines.length).toBeGreaterThanOrEqual(3);
    expect(s.displayMs).toBe(0);   // 0 = 클릭 대기. 선택 직전 연출은 넘기지 않는다
  });

  it('배경 이미지 없이 성립한다', () => {
    // CinematicScene은 image가 없으면 그라디언트만 그린다.
    // 없는 파일을 가리켜 404를 내는 것보다 낫다.
    for (const s of BRANCH_SCENES) expect(s.image).toBeUndefined();
  });

  it('연출 문구가 서로 겹치지 않는다', () => {
    const lines = BRANCH_SCENES.flatMap(s => s.lines);
    expect(new Set(lines).size).toBe(lines.length);
  });
});

describe('재생 순서와 1회성', () => {
  it('연출이 끝난 뒤 분기 모달이 열린다', () => {
    expect(QS_SRC).toContain('onComplete: openBranchChoice');
  });

  it('같은 연출을 두 번 재생하지 않는다', () => {
    expect(QS_SRC).toMatch(/_cin_\$\{qDef\.cinematicId\}_played/);
  });

  it('연출이 없는 분기점도 모달이 열린다', () => {
    // else 분기가 없으면 연출 미배선 분기점에서 선택 자체가 사라진다.
    expect(QS_SRC).toMatch(/\}\s*else\s*\{\s*\n\s*openBranchChoice\(\);/);
  });
});
