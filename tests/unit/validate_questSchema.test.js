import { describe, it, expect } from 'vitest';
import { validateMainQuestSchema } from '../../js/data/validate.js';

describe('validateMainQuestSchema', () => {
  it('subObjectives 없는 퀘스트는 통과 (선택적)', () => {
    const quest = {
      id: 'mq_test', title: 't', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
    };
    expect(validateMainQuestSchema(quest)).toEqual({ ok: true, errors: [] });
  });

  it('subObjectives 항목에 id/text 누락 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      subObjectives: [{ hint: 'h' }],
    };
    const r = validateMainQuestSchema(quest);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/subObjectives\[0\].(id|text)/);
  });

  it('subObjectives id 중복 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      subObjectives: [
        { id: 'so_a', text: 'A' },
        { id: 'so_a', text: 'B' },
      ],
    };
    const r = validateMainQuestSchema(quest);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/duplicate id/i);
  });

  it('locationHint.districtId 미존재 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      locationHint: { districtId: 'nonexistent_district' },
    };
    const r = validateMainQuestSchema(quest, { knownDistricts: new Set(['gangnam']) });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/districtId/);
  });

  it('locationHint.landmarkId 미존재 시 에러', () => {
    const quest = {
      id: 'mq_test', characterId: 'doctor',
      objective: { type: 'collect_item', definitionId: 'x', count: 1 },
      locationHint: { landmarkId: 'lm_unknown' },
    };
    const r = validateMainQuestSchema(quest, { knownLandmarks: new Set(['lm_boramae_hospital']) });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/landmarkId/);
  });
});
