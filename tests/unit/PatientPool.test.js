// === PatientPool — 증분 1 파일럿 3종 ===
// 검증:
//  1) children/adults/elders 각 1종 페르소나 존재
//  2) 스키마 필드 완전성 + ageBracket enum + storyFragments 3~5줄
//  3) contributionOnCure.type enum + 참조 item 존재
//  4) NPCS spread 병합 노출
import { describe, it, expect } from 'vitest';
import PATIENT_POOL from '../../js/data/patientPool.js';
import NPCS         from '../../js/data/npcs.js';
import GameData     from '../../js/data/GameData.js';

const AGE_BRACKETS = ['child', 'youth', 'adult', 'middle', 'elder'];
const CONTRIB_TYPES = ['sponsor', 'guard', 'dispatch', 'recruit'];
const FRAGMENT_STAGES = ['wound3to2', 'wound2to1', 'wound1to0'];

describe('PatientPool — 파일럿 3종 존재', () => {
  it('PATIENT_POOL은 최소 3종 페르소나를 포함한다', () => {
    expect(Object.keys(PATIENT_POOL).length).toBeGreaterThanOrEqual(3);
  });

  it('어린이 페르소나 1종 (ageBracket=child)이 포함된다', () => {
    const children = Object.values(PATIENT_POOL).filter(p => p.ageBracket === 'child');
    expect(children.length).toBeGreaterThanOrEqual(1);
  });

  it('성인 페르소나 1종 (ageBracket=adult 또는 middle)이 포함된다', () => {
    const adults = Object.values(PATIENT_POOL).filter(
      p => p.ageBracket === 'adult' || p.ageBracket === 'middle'
    );
    expect(adults.length).toBeGreaterThanOrEqual(1);
  });

  it('노년 페르소나 1종 (ageBracket=elder)이 포함된다', () => {
    const elders = Object.values(PATIENT_POOL).filter(p => p.ageBracket === 'elder');
    expect(elders.length).toBeGreaterThanOrEqual(1);
  });
});

describe('PatientPool — 스키마 필드 완전성', () => {
  const persona = Object.values(PATIENT_POOL);

  it('모든 페르소나가 필수 필드를 가진다', () => {
    for (const p of persona) {
      expect(p, `페르소나: ${p?.id}`).toHaveProperty('id');
      expect(p).toHaveProperty('name');
      expect(typeof p.age).toBe('number');
      expect(p).toHaveProperty('gender');
      expect(p).toHaveProperty('ageBracket');
      expect(typeof p.woundLevel).toBe('number');
      expect(p.woundLevel).toBeGreaterThanOrEqual(1);
      expect(p.woundLevel).toBeLessThanOrEqual(3);
      expect(p).toHaveProperty('hiddenBackground');
      expect(p).toHaveProperty('contributionOnCure');
    }
  });

  it('ageBracket은 허용된 enum 값만 사용한다', () => {
    for (const p of persona) {
      expect(AGE_BRACKETS).toContain(p.ageBracket);
    }
  });

  it('contributionOnCure.type은 허용된 enum 값만 사용한다', () => {
    for (const p of persona) {
      expect(CONTRIB_TYPES).toContain(p.contributionOnCure.type);
    }
  });
});

describe('PatientPool — storyFragments 3~5줄', () => {
  it('각 페르소나는 3단계 storyFragments를 모두 보유한다', () => {
    for (const p of Object.values(PATIENT_POOL)) {
      const stages = (p.hiddenBackground.storyFragments ?? []).map(s => s.stage);
      for (const expected of FRAGMENT_STAGES) {
        expect(stages, `페르소나: ${p.id}`).toContain(expected);
      }
    }
  });

  it('각 단계 lines 배열 길이는 3~5다', () => {
    for (const p of Object.values(PATIENT_POOL)) {
      for (const frag of p.hiddenBackground.storyFragments) {
        expect(Array.isArray(frag.lines)).toBe(true);
        expect(frag.lines.length).toBeGreaterThanOrEqual(3);
        expect(frag.lines.length).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('PatientPool — 참조 item 존재 (sponsor/dispatch)', () => {
  it('sponsor immediate/recurring itemId는 GameData.items에 존재한다', () => {
    for (const p of Object.values(PATIENT_POOL)) {
      const c = p.contributionOnCure;
      if (c.type !== 'sponsor') continue;
      for (const it of (c.immediate ?? [])) {
        expect(GameData.items[it.id], `sponsor immediate "${it.id}"`).toBeTruthy();
      }
      for (const it of (c.recurring?.items ?? [])) {
        expect(GameData.items[it.id], `sponsor recurring "${it.id}"`).toBeTruthy();
      }
    }
  });

  it('dispatch yield itemId는 GameData.items에 존재한다', () => {
    for (const p of Object.values(PATIENT_POOL)) {
      const c = p.contributionOnCure;
      if (c.type !== 'dispatch') continue;
      for (const it of (c.dispatch?.yield ?? [])) {
        expect(GameData.items[it.id], `dispatch yield "${it.id}"`).toBeTruthy();
      }
    }
  });
});

describe('PatientPool — NPCS 병합 노출', () => {
  it('모든 페르소나 id가 NPCS에 노출된다', () => {
    for (const id of Object.keys(PATIENT_POOL)) {
      expect(NPCS[id], `NPCS에 "${id}" 누락`).toBeTruthy();
    }
  });

  it('NPCS 병합 후에도 기존 NPC(npc_old_survivor)는 유지된다', () => {
    expect(NPCS.npc_old_survivor).toBeTruthy();
  });
});
