// === 오염 생식 재료 질병 판정 회귀 테스트 ===
// regression: checkContaminatedConsume이 type 'consumable'만 대상으로 해서
// 생식 가능해진 재료(야생 베리·날생선 등)는 오염 상태로 먹어도 질병 판정을
// 건너뛰던 문제. 판정 기준을 StatSystem.consumeCard와 동일하게 통일.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import DiseaseSystem from '../../js/systems/DiseaseSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

describe('오염 섭취 질병 판정 — checkContaminatedConsume', () => {
  beforeEach(() => {
    GameState.player = {
      ...(GameState.player ?? {}),
      isAlive: true,
      diseases: [],
      permanentInfectionImmunity: false,
      permanentDiseaseResist: 0,
    };
  });
  afterEach(() => vi.restoreAllMocks());

  function diseaseIds() {
    return GameState.player.diseases.map(d => d.id);
  }

  it('오염 30 야생 베리(material/natural) 생식 → 이질 판정을 굴린다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    DiseaseSystem.checkContaminatedConsume(ITEMS.wild_berry, 30, GameState);
    expect(diseaseIds()).toContain('dysentery');
  });

  it('오염 30 날생선(material/food_raw) 생식 → 이질 판정을 굴린다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    DiseaseSystem.checkContaminatedConsume(ITEMS.raw_fish, 30, GameState);
    expect(diseaseIds()).toContain('dysentery');
  });

  it('오염 10(임계 20 미만)이면 재료여도 질병 판정이 없다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    DiseaseSystem.checkContaminatedConsume(ITEMS.wild_berry, 10, GameState);
    expect(diseaseIds()).toHaveLength(0);
  });

  it('섭취 불가 재료(알코올 용액)는 오염이 높아도 판정 대상이 아니다', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    DiseaseSystem.checkContaminatedConsume(ITEMS.alcohol_solution, 60, GameState);
    expect(diseaseIds()).toHaveLength(0);
  });

  it('기존 동작 유지: 오염 60 물(consumable/drink) → 콜레라 판정', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    DiseaseSystem.checkContaminatedConsume(ITEMS.contaminated_water, 60, GameState);
    expect(diseaseIds()).toContain('cholera');
  });
});
