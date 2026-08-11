// @vitest-environment happy-dom
// === 분기점 무결성 테스트 ===
// isBranchPoint는 ModalManager.showBranchChoice를 통해 "⚡ 선택의 갈림길 —
// 이 선택은 이후 스토리를 결정합니다" 모달을 닫을 수 없게(_nonDismissible) 띄운다.
// 선택지가 하나뿐이면 선택이 아니라 확인 절차가 되므로, 그런 단계는
// reward.flags로 진행 플래그를 심고 분기점 표시를 뗀다.
import { describe, it, expect } from 'vitest';
import DOCTOR from '../../js/data/mainQuests/doctor/index.js';
import SOLDIER from '../../js/data/mainQuests/soldier/index.js';
import ENGINEER from '../../js/data/mainQuests/engineer/index.js';
import CHEF from '../../js/data/mainQuests/chef/index.js';
import FIREFIGHTER from '../../js/data/mainQuests/firefighter/index.js';
import HOMELESS from '../../js/data/mainQuests/homeless/index.js';

const QUESTS = { doctor: DOCTOR, soldier: SOLDIER, engineer: ENGINEER,
                 chef: CHEF, firefighter: FIREFIGHTER, homeless: HOMELESS };
const ALL = Object.values(QUESTS).flatMap(q => Object.values(q));

describe('분기점은 실제로 갈라진다', () => {
  const points = ALL.filter(q => q.isBranchPoint || q.branchOptions);

  it('분기점이 존재한다', () => {
    expect(points.length).toBeGreaterThan(0);
  });

  it.each(points.map(q => [q.id, q]))('%s 는 선택지가 둘 이상이다', (_id, q) => {
    expect(q.branchOptions?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it.each(points.map(q => [q.id, q]))('%s 의 선택지가 서로 다른 플래그를 심는다', (_id, q) => {
    const flags = q.branchOptions.map(o => o.setsFlag);
    expect(flags.every(Boolean), '설정 플래그 없는 선택지').toBe(true);
    expect(new Set(flags).size).toBe(flags.length);
  });

  it('isBranchPoint와 branchOptions가 짝을 이룬다', () => {
    // 한쪽만 있으면 QuestSystem:1088의 `&&` 조건에서 조용히 무시된다.
    for (const q of ALL) {
      expect(Boolean(q.isBranchPoint), `${q.id}`).toBe(Boolean(q.branchOptions));
    }
  });
});

describe('접은 단계는 플래그를 스스로 심는다', () => {
  // 분기점 표시만 떼고 플래그를 안 심으면 후속 퀘스트가 영원히 열리지 않는다.
  const CASES = [
    ['mq_fire_b_15', 'fire_end_b3', 'mq_fire_end_b3'],
    ['mq_homeless_a_15', 'homeless_end_a3', 'mq_homeless_end_a3'],
  ];

  it.each(CASES)('%s 가 %s 를 심는다', (questId, flag) => {
    const q = ALL.find(x => x.id === questId);
    expect(q, `${questId} 없음`).toBeDefined();
    expect(q.isBranchPoint).toBeUndefined();
    expect(q.reward?.flags?.[flag]).toBe(true);
  });

  it.each(CASES)('%s 다음 단계가 그 플래그를 요구한다', (_questId, flag, nextId) => {
    const next = ALL.find(x => x.id === nextId);
    expect(next, `${nextId} 없음`).toBeDefined();
    expect(next.requiresFlag).toBe(flag);
  });
});

describe('선택지가 심는 플래그는 실제로 쓰인다', () => {
  it('모든 setsFlag를 요구하는 후속 퀘스트가 있다', () => {
    const required = new Set(ALL.map(q => q.requiresFlag).filter(Boolean));
    const orphan = ALL.flatMap(q => q.branchOptions ?? [])
      .map(o => o.setsFlag)
      .filter(f => !required.has(f));
    expect(orphan, `아무도 읽지 않는 분기 플래그: ${orphan.join(', ')}`).toEqual([]);
  });
});
