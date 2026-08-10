// @vitest-environment happy-dom
// === 헬기 제작 진입장벽 테스트 ===
// 제작 라인에 직업 제한이 없어 스킬만 올리면 누구나 헬기를 만들 수 있었다.
// 엔지니어의 정체성("탈출 수단 설계")이 기계적으로 독점되지 않았고, 격차는
// specialtySkills XP 1.5배뿐이었다.
//
// 스킬 성장 곡선(LEVEL_XP_TABLE)은 12개 스킬이 공유하므로 건드리지 않는다.
// 대신 해금 조건과 재료로 벽을 세운다.
import { describe, it, expect } from 'vitest';
import BLUEPRINTS from '../../js/data/blueprints.js';
import ITEMS from '../../js/data/items.js';
import { LEVEL_XP_TABLE } from '../../js/data/skillDefs.js';

const ASSEMBLE = () => BLUEPRINTS.assemble_helicopter;
const GATE_ITEM = 'father_schematic';

describe('아버지의 설계도 — 엔지니어 관문 재료', () => {
  it('아이템이 존재한다', () => {
    expect(ITEMS[GATE_ITEM]).toBeDefined();
  });

  it('소모품이 아니라 재료다 (사기 회복용 설계도 노트와 별개)', () => {
    expect(ITEMS[GATE_ITEM].type).toBe('material');
    expect(ITEMS[GATE_ITEM].onConsume).toBeUndefined();
    expect(ITEMS.sketch_notebook.type).toBe('consumable');
  });

  it('분해해도 사라지지 않도록 분해 테이블이 비어 있다', () => {
    expect(ITEMS[GATE_ITEM].dismantle ?? []).toEqual([]);
  });
});

describe('조립 청사진 — 해금 조건', () => {
  it('히든 레시피다', () => {
    expect(ASSEMBLE().hidden).toBe(true);
  });

  it('야전 대장간을 요구한다', () => {
    expect(ASSEMBLE().unlockConditions.requiredStructure).toBe('field_forge');
  });

  it('후반부에만 열린다', () => {
    expect(ASSEMBLE().unlockConditions.minDay).toBeGreaterThanOrEqual(150);
  });

  it('해금 스킬과 실행 스킬이 일치한다', () => {
    expect(ASSEMBLE().unlockConditions.minSkillLevel).toEqual(ASSEMBLE().requiredSkills);
  });
});

describe('조립 청사진 — 관문 재료 요구', () => {
  const mats = () => ASSEMBLE().stages.flatMap(s => s.requiredItems);

  it('아버지의 설계도를 요구한다', () => {
    expect(mats().some(r => r.definitionId === GATE_ITEM)).toBe(true);
  });

  it('첫 단계부터 요구해 헛수고를 막는다', () => {
    const first = ASSEMBLE().stages[0].requiredItems.map(r => r.definitionId);
    expect(first).toContain(GATE_ITEM);
  });
});

describe('엔지니어 경로 — 확정 획득', () => {
  it('B3 라인이 설계도를 보상으로 준다', async () => {
    const ENG_B = (await import('../../js/data/mainQuests/engineer/branch_b.js')).default;
    const given = Object.values(ENG_B)
      .flatMap(q => q?.reward?.items ?? [])
      .map(i => i.definitionId);
    expect(given).toContain(GATE_ITEM);
  });
});

describe('비엔지니어 경로 — 존재하되 극악', () => {
  it('설계도를 얻을 다른 경로가 하나는 있다', async () => {
    // 히든 장소는 진입 지점만 열어주고, 지급은 세부장소 firstEnterReward가 맡는다.
    // 롯데타워 123층 — 보스를 넘어야 닿는다.
    const LANDMARKS = (await import('../../js/data/landmarks.js')).default;
    const givers = Object.values(LANDMARKS).flatMap(lm => lm.subLocations ?? [])
      .filter(s => (s.firstEnterReward?.items ?? []).some(i => i.id === GATE_ITEM));
    expect(givers.length).toBeGreaterThan(0);
    expect(givers.every(s => s.requiresHiddenLocation)).toBe(true);
  });

  it('일반 루팅으로는 나오지 않는다', async () => {
    const D = await import('../../js/data/districts.js');
    expect(JSON.stringify(D.DISTRICTS)).not.toContain(GATE_ITEM);
  });
});

describe('스킬 성장 곡선은 건드리지 않았다', () => {
  // 12개 스킬이 공유하는 테이블이라 여기를 손대면 전투·의료·요리까지 느려진다.
  it('레벨 XP 테이블이 기존 값을 유지한다', () => {
    expect(LEVEL_XP_TABLE[8]).toBe(530);
    expect(LEVEL_XP_TABLE[20]).toBe(7735);
    expect(LEVEL_XP_TABLE.length).toBe(21);
  });
});
