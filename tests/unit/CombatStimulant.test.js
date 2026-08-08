// === 전투 자극제 효과 배선 회귀 테스트 ===
// regression: onConsume의 temporaryAttackBoost/temporaryStaminaBoost/duration을
// 읽는 시스템이 없어 섭취해도 아무 효과가 없던 문제.
import { describe, it, expect, beforeEach } from 'vitest';
import StatSystem from '../../js/systems/StatSystem.js';
import { normalizeConsumeEffect } from '../../js/systems/ItemEffectSystem.js';
import GameState from '../../js/core/GameState.js';
import ITEMS from '../../js/data/items.js';

function resetWorld() {
  GameState.cards = {};
  GameState.board = { top: [], environment: [], middle: Array(20).fill(null), bottom: Array(20).fill(null) };
  GameState.player = {
    ...(GameState.player ?? {}),
    isAlive: true,
    skills: {},
    diseases: [],
    equipped: {},
    attackBoostMult: 0,
    attackBoostUntilTP: 0,
    hp: { current: 80, max: 100 },
  };
  GameState.stats = {
    stamina:   { current: 40, max: 100 },
    infection: { current: 0, max: 100 },
    radiation: { current: 0, max: 100 },
    morale:    { current: 50, max: 100 },
  };
  GameState.time = { day: 10, totalTP: 720, tpInDay: 0, hour: 12 };
  GameState.flags = GameState.flags ?? {};
}

describe('전투 자극제 — combat_stimulant', () => {
  beforeEach(resetWorld);

  it('normalizeConsumeEffect가 temporaryStaminaBoost를 stamina로 정규화한다', () => {
    const eff = normalizeConsumeEffect(ITEMS.combat_stimulant.onConsume);
    expect(eff.stamina).toBe(30);
  });

  it('섭취 시 스태미나 +30이 즉시 적용된다', () => {
    const inst = GameState.createCardInstance('combat_stimulant');
    GameState.board.middle[0] = inst.instanceId;
    StatSystem.consumeCard(inst.instanceId);
    expect(GameState.stats.stamina.current).toBe(70);
  });

  it('섭취 시 공격력 버프가 12TP 동안 등록된다', () => {
    const inst = GameState.createCardInstance('combat_stimulant');
    GameState.board.middle[0] = inst.instanceId;
    StatSystem.consumeCard(inst.instanceId);
    expect(GameState.player.attackBoostMult).toBe(0.30);
    expect(GameState.player.attackBoostUntilTP).toBe(720 + 12);
  });

  it('버프 미보유 상태에서는 등록 필드가 그대로다', () => {
    const inst = GameState.createCardInstance('bandage');
    GameState.board.middle[0] = inst.instanceId;
    StatSystem.consumeCard(inst.instanceId);
    expect(GameState.player.attackBoostUntilTP).toBe(0);
  });
});
