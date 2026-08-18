// === 전설 무기 특수 효과 + 지뢰 설치 ===
// regression: combat.attacksPerRoundOnCrit(M4 카빈 3점사)와 combat.onKill(두목의 소총 도주
// 유발), onConsume.deployTrap(지향성 지뢰)은 어느 코드도 읽지 않아 카드 설명이 거짓이었다.
// 잉여 선언이던 onUse.nightVision(야시경)·onUse.survivorSignal(무전기)도 함께 정리한다.
import { beforeEach, describe, expect, it } from 'vitest';
import GameState from '../../js/core/GameState.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import StatSystem from '../../js/systems/StatSystem.js';
import ITEMS from '../../js/data/items.js';

function place(definitionId, row = 'bottom') {
  const inst = GameState.createCardInstance(definitionId);
  GameState.placeCardInRow(inst.instanceId, row);
  return inst;
}

beforeEach(() => {
  GameState.cards = {};
  GameState.board = {
    top: [], environment: [],
    middle: Array(10).fill(null), bottom: Array(20).fill(null),
  };
  GameState.player.equipped = {};
  GameState.player.skills = {};
  GameState.combat = {
    active: true, log: [], enemies: [], targetIndex: 0,
    playerStatus: [], enemyStatus: [], battlefieldStatuses: [], fxQueue: [],
  };
});

describe('처치 시 도주 유발 (두목의 소총)', () => {
  function makeEnemies() {
    return [
      { id: 'zombie_common', name: '좀비', currentHp: 0, maxHp: 30 },
      { id: 'raider', name: '약탈자', currentHp: 20, maxHp: 40 },
      { id: 'boss_sewer_king', name: '하수도 왕', currentHp: 90, maxHp: 120, isBoss: true },
    ];
  }

  it('보스가 아닌 적만 도주한다', () => {
    GameState.combat.enemies = makeEnemies();
    const fled = CombatSystem._applyOnKillFlee({ enemyFleeChance: 1.0 });

    expect(fled).toContain('raider');
    expect(fled).not.toContain('boss_sewer_king');
    expect(GameState.combat.enemies.find(e => e.id === 'boss_sewer_king').currentHp).toBe(90);
  });

  it('확률이 0이면 아무도 도주하지 않는다', () => {
    GameState.combat.enemies = makeEnemies();
    expect(CombatSystem._applyOnKillFlee({ enemyFleeChance: 0 })).toEqual([]);
  });

  it('이미 쓰러진 적은 대상이 아니다', () => {
    GameState.combat.enemies = makeEnemies();
    const fled = CombatSystem._applyOnKillFlee({ enemyFleeChance: 1.0 });
    expect(fled).not.toContain('zombie_common');
  });

  it('두목의 소총 정의가 도주 확률을 들고 있다', () => {
    expect(ITEMS.warlord_rifle.combat.onKill.enemyFleeChance).toBeCloseTo(0.3);
  });
});

describe('치명타 연사 (M4 카빈)', () => {
  it('추가 타격 횟수는 정의값에서 온다', () => {
    expect(ITEMS.m4_carbine.combat.attacksPerRoundOnCrit).toBe(3);
  });

  it('치명타 시 추가 타격이 적에게 들어간다', () => {
    const enemy = { id: 'raider', name: '약탈자', currentHp: 100, maxHp: 100, defense: 0 };
    GameState.combat.enemies = [enemy];

    const extra = CombatSystem._applyCritBurst(enemy, 3, 10, { defensePierce: 0 });

    expect(extra).toBe(2);              // 총 3회 중 본 타격 1회를 뺀 나머지
    expect(enemy.currentHp).toBe(80);   // 10 피해 × 2회
  });

  it('1 이하면 추가 타격이 없다', () => {
    const enemy = { id: 'raider', currentHp: 100, maxHp: 100, defense: 0 };
    expect(CombatSystem._applyCritBurst(enemy, 1, 10, {})).toBe(0);
    expect(enemy.currentHp).toBe(100);
  });

  it('이미 쓰러진 적에게는 추가 타격을 넣지 않는다', () => {
    const enemy = { id: 'raider', currentHp: 0, maxHp: 100, defense: 0 };
    expect(CombatSystem._applyCritBurst(enemy, 3, 10, {})).toBe(0);
  });
});

describe('지향성 지뢰 설치', () => {
  it('사용하면 바닥에 트랩 카드가 생긴다', () => {
    const mine = place('directional_mine');

    StatSystem.consumeCard(mine.instanceId);

    const floor = GameState.board.middle.filter(Boolean).map(id => GameState.cards[id].definitionId);
    expect(floor).toContain('deployed_mine');
    expect(GameState.cards[mine.instanceId]).toBeUndefined();
  });

  it('설치된 지뢰는 전투 진입 함정 규격을 따른다', () => {
    const d = ITEMS.deployed_mine;
    expect(d.subtype).toBe('trap');
    expect(d.onTrigger.damage).toBeGreaterThan(0);
    expect(d.defaultDurability).toBe(10);
  });
});

describe('잉여 선언 정리', () => {
  it('야시경은 light 태그로 이미 광원이라 nightVision 필드가 없다', () => {
    expect(ITEMS.night_vision_goggles.tags).toContain('light');
    expect(ITEMS.night_vision_goggles.onUse?.nightVision).toBeUndefined();
  });

  it('무전기의 survivorSignal 선언이 없다', () => {
    expect(ITEMS.radio.onUse?.survivorSignal).toBeUndefined();
  });
});
