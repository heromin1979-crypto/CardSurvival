// === 중독 질병 + 경보 트랩 제거 ===
// 독성 물질을 먹으면 즉시 피해만 있고 지속 중독이 없었다. DiseaseSystem은 symptoms.hpPerTP로
// TP당 HP 감소를 이미 지원하지만(질병 12종이 사용), 중독 질병 자체가 없었고 발병 경로도
// checkContaminatedConsume(contamination > 0)뿐이라 오염도 0인 독버섯은 어디에도 걸리지 않았다.
//
// 경보 트랩은 onTrigger에 damage·bleed가 없어 _triggerCombatEntryTraps를 통과해도 아무 효과가
// 없었고, earlyWarning·noise를 읽는 코드도 없었다. 전투 진입 함정 외 용도가 없어 제거한다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import StatSystem from '../../js/systems/StatSystem.js';
import DiseaseSystem from '../../js/systems/DiseaseSystem.js';
import DISEASES from '../../js/data/diseases.js';
import ITEMS from '../../js/data/items.js';
import BLUEPRINTS from '../../js/data/blueprints.js';
import STACK_CONFIG from '../../js/data/stackConfig.js';
import CardFactory from '../../js/ui/CardFactory.js';
import { ko, en } from '../../js/data/locales.js';

function place(definitionId, quantity = 1) {
  const inst = GameState.createCardInstance(definitionId, { quantity });
  GameState.placeCardInRow(inst.instanceId, 'bottom');
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.skills = {};
  GameState.player.diseases = [];
  GameState.player.equipped = {};
  GameState.player.permanentInfectionImmunity = false;
  GameState.player.hp.current = GameState.player.hp.max;
  for (const key of ['nutrition', 'hydration', 'morale', 'infection']) {
    const s = GameState.stats[key];
    if (s) s.current = Math.floor(s.max / 2);
  }
});

describe('중독 질병 정의', () => {
  it('poisoning이 TP당 HP를 깎는다', () => {
    const d = DISEASES.poisoning;
    expect(d).toBeDefined();
    expect(d.symptoms.hpPerTP).toBeLessThan(0);
    expect(d.durationDays).toHaveLength(2);
  });

  it('잠복기 없이 즉시 발현한다', () => {
    expect(DISEASES.poisoning.incubationTp).toBe(0);
  });

  it('치료 수단이 지정돼 있다', () => {
    expect(DISEASES.poisoning.treatmentTags.length).toBeGreaterThan(0);
  });
});

describe('독성 섭취 → 발병', () => {
  it('독버섯을 먹으면 중독에 걸린다', () => {
    const inst = place('mushroom_toxic');

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.player.diseases.map(d => d.id)).toContain('poisoning');
  });

  it('중독이 TP마다 HP를 깎는다', () => {
    GameState.player.diseases = [];
    DiseaseSystem._contract(GameState, 'poisoning');
    GameState.player.hp.current = 100;

    DiseaseSystem._applySymptoms(DISEASES.poisoning.symptoms, GameState);

    expect(GameState.player.hp.current).toBeLessThan(100);
  });

  it('일반 식재료를 먹어도 중독되지 않는다', () => {
    const inst = place('acorn');

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.player.diseases.map(d => d.id)).not.toContain('poisoning');
  });

  it('의학 Lv20 독 면역이면 발병하지 않는다', () => {
    GameState.player.skills = { medicine: { level: 20, xp: 0 } };
    const inst = place('mushroom_toxic');

    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.player.diseases.map(d => d.id)).not.toContain('poisoning');
  });

  it('중복 발병하지 않는다', () => {
    // placeCardInRow가 스택을 자동 병합하므로 한 카드에서 두 번 먹는다
    const inst = place('mushroom_toxic', 3);

    StatSystem.consumeCard(inst.instanceId);
    StatSystem.consumeCard(inst.instanceId);

    expect(GameState.countOnBoard('mushroom_toxic')).toBe(1);
    const count = GameState.player.diseases.filter(d => d.id === 'poisoning').length;
    expect(count).toBe(1);
  });
});

describe('경보 트랩 제거', () => {
  it('아이템 정의가 없다', () => {
    expect(ITEMS.alarm_trap).toBeUndefined();
  });

  it('청사진이 없다', () => {
    expect(BLUEPRINTS.alarm_trap).toBeUndefined();
  });

  it('stackConfig·카드 이미지·로케일에 잔재가 없다', () => {
    expect(STACK_CONFIG.alarm_trap).toBeUndefined();
    expect(CardFactory.images.alarm_trap).toBeUndefined();
    expect(ko['_item.alarm_trap']).toBeUndefined();
    expect(en['_item.alarm_trap']).toBeUndefined();
    expect(en['_blueprint.make_alarm_trap']).toBeUndefined();
  });

  it('퀘스트 보상이 실존하는 아이템을 준다', () => {
    const files = [
      'js/data/mainQuests/engineer/branch_b.js',
      'js/data/mainQuests/soldier/branch_b.js',
    ];
    const fs = require('node:fs');
    for (const f of files) {
      expect(fs.readFileSync(f, 'utf8')).not.toContain('alarm_trap');
    }
  });
});
