// @vitest-environment happy-dom
// === Combat Overhaul Phase 1 — Initiative HUD 통합 ===
// 목적:
//   - _renderInitiativeBar가 올바른 HTML 구조로 턴 슬롯을 렌더
//   - active 슬롯에 .active 클래스
//   - 죽은 엔티티는 .dead 클래스
//   - 큐 없을 때 빈 문자열
//   - 실제 CombatUI._screen 에 HUD 삽입되는지 검증 (DOM 통합)
import { describe, it, expect, beforeEach } from 'vitest';
import CombatUI     from '../../js/ui/CombatUI.js';
import CombatSystem from '../../js/systems/CombatSystem.js';
import GameState    from '../../js/core/GameState.js';

function setupDom() {
  document.body.innerHTML = `<div id="screen-combat"></div>`;
  CombatUI._screen = document.getElementById('screen-combat');
}

describe('_renderInitiativeBar — 순수 HTML 반환', () => {
  it('큐가 없으면 빈 문자열 반환', () => {
    const combat = { turnQueue: [], activeIdx: 0 };
    expect(CombatUI._renderInitiativeBar(combat, GameState)).toBe('');
  });

  it('플레이어 단독 슬롯 + .active', () => {
    const combat = {
      turnQueue: [{ type: 'player', order: 0 }],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toContain('class="initiative-bar"');
    expect(html).toContain('Round 1');
    expect(html).toMatch(/class="init-slot player active"/);
  });

  it('플레이어 + 적 2명 → 3 슬롯 + 첫 번째만 active', () => {
    const combat = {
      turnQueue: [
        { type: 'player',   order: 0 },
        { type: 'enemy',    enemyIdx: 0, order: 1 },
        { type: 'enemy',    enemyIdx: 1, order: 2 },
      ],
      activeIdx: 0,
      roundNumber: 2,
      enemies: [
        { id: 'rat', name: '쥐', icon: '🐀', currentHp: 10, maxHp: 10 },
        { id: 'zombie', name: '좀비', icon: '🧟', currentHp: 30, maxHp: 30 },
      ],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);

    // 3 슬롯
    const slotMatches = html.match(/class="init-slot [^"]+"/g);
    expect(slotMatches?.length).toBe(3);
    // 하나만 active
    const activeMatches = html.match(/class="init-slot [^"]*active[^"]*"/g);
    expect(activeMatches?.length).toBe(1);
    // 적 이름/아이콘 포함
    expect(html).toContain('🐀');
    expect(html).toContain('🧟');
  });

  it('죽은 적은 .dead 클래스', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy',  enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [{ id: 'rat', name: '쥐', icon: '🐀', currentHp: 0, maxHp: 10 }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toMatch(/class="init-slot enemy dead"/);
  });

  it('companion 슬롯 — npcs.states[id].hp 기반 HP%', () => {
    const prevNpcs = GameState.npcs;
    GameState.npcs = { states: { npc_nurse: { hp: 15, maxHp: 50, isCompanion: true } } };
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'companion', id: 'npc_nurse', order: 1 },
      ],
      activeIdx: 1,
      roundNumber: 1,
      enemies: [],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toMatch(/class="init-slot companion active"/);
    // 이슈 #8 수정 후: NPC_ITEMS의 한글 이름 "간호사" (I18n.itemName 통해)
    expect(html).toContain('간호사');
    // 15/50 = 30%
    expect(html).toMatch(/width:30%/);
    GameState.npcs = prevNpcs;
  });

  it('activeIdx 변경에 따라 active 슬롯 이동', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy',  enemyIdx: 0, order: 1 },
      ],
      activeIdx: 1,
      roundNumber: 3,
      enemies: [{ id: 'r', name: '쥐', icon: '🐀', currentHp: 10, maxHp: 10 }],
    };
    const html = CombatUI._renderInitiativeBar(combat, GameState);
    expect(html).toMatch(/class="init-slot enemy active"/);
    expect(html).not.toMatch(/class="init-slot player active"/);
  });
});

describe('_renderInitiativeBar — DOM 통합 (screen-combat 삽입)', () => {
  beforeEach(setupDom);

  it('CombatUI._screen 에 initiative-bar가 삽입될 수 있다', () => {
    const combat = {
      turnQueue: [{ type: 'player', order: 0 }],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [],
    };
    CombatUI._screen.innerHTML = CombatUI._renderInitiativeBar(combat, GameState);
    const bar = CombatUI._screen.querySelector('.initiative-bar');
    expect(bar).not.toBeNull();
    const slots = CombatUI._screen.querySelectorAll('.init-slot');
    expect(slots.length).toBe(1);
  });

  it('HP 0 적이면 .dead 클래스 + 라인스루', () => {
    const combat = {
      turnQueue: [
        { type: 'player', order: 0 },
        { type: 'enemy',  enemyIdx: 0, order: 1 },
      ],
      activeIdx: 0,
      roundNumber: 1,
      enemies: [{ id: 'z', name: '좀비', icon: '🧟', currentHp: 0, maxHp: 30 }],
    };
    CombatUI._screen.innerHTML = CombatUI._renderInitiativeBar(combat, GameState);
    const deadSlot = CombatUI._screen.querySelector('.init-slot.dead');
    expect(deadSlot).not.toBeNull();
    expect(deadSlot.classList.contains('enemy')).toBe(true);
  });
});

describe('Phase 1 end-to-end — _setupCombat 후 큐가 초기화됨', () => {
  beforeEach(() => {
    setupDom();
    // CombatSystem.init은 호출하지 않음 (event listener 이중 등록 방지)
    // _setupCombat을 직접 호출해 combat 상태를 구성
    GameState.player.hp = { current: 100, max: 100 };
    GameState.player.characterId = 'doctor';
    GameState.player.diseases = [];
    GameState.companions = [];
    GameState.npcs = null;
    GameState.ui = { ...GameState.ui, currentState: 'combat' };
    GameState.flags = GameState.flags ?? {};
  });

  it('전투 시작 시 turnQueue = [player, enemy]', () => {
    const enemies = [{ id: 'rat', name: '쥐', icon: '🐀', currentHp: 10, maxHp: 10, attack: { damage: [1, 2], accuracy: 0.5 }, specialSkills: [], weaknesses: [], resistances: [] }];
    CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'dongjak' });

    expect(GameState.combat.turnQueue).toBeDefined();
    expect(GameState.combat.turnQueue.length).toBe(2);
    expect(GameState.combat.turnQueue[0].type).toBe('player');
    expect(GameState.combat.turnQueue[1].type).toBe('enemy');
    expect(GameState.combat.activeIdx).toBe(0);
    expect(GameState.combat.roundNumber).toBe(1);
  });

  it('companions 있는 경우 큐에 포함', () => {
    GameState.companions = ['npc_nurse'];
    GameState.npcs = { states: { npc_nurse: { hp: 50, maxHp: 50, isCompanion: true } } };
    const enemies = [{ id: 'z', name: '좀비', icon: '🧟', currentHp: 30, maxHp: 30, attack: { damage: [1, 2], accuracy: 0.5 }, specialSkills: [], weaknesses: [], resistances: [] }];
    CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'dongjak' });

    expect(GameState.combat.turnQueue.length).toBe(3);
    expect(GameState.combat.turnQueue[1].type).toBe('companion');
    expect(GameState.combat.turnQueue[1].id).toBe('npc_nurse');
  });

  it('HP 0 companion은 큐에서 제외됨', () => {
    GameState.companions = ['npc_nurse', 'npc_dead'];
    GameState.npcs = { states: {
      npc_nurse: { hp: 50, maxHp: 50, isCompanion: true },
      npc_dead:  { hp: 0,  maxHp: 50, isCompanion: true },
    }};
    const enemies = [{ id: 'z', name: '좀비', icon: '🧟', currentHp: 30, maxHp: 30, attack: { damage: [1, 2], accuracy: 0.5 }, specialSkills: [], weaknesses: [], resistances: [] }];
    CombatSystem._setupCombat({ enemies, dangerLevel: 1, nodeId: 'dongjak' });

    // player + nurse + enemy = 3 (죽은 npc_dead 제외)
    expect(GameState.combat.turnQueue.length).toBe(3);
    const ids = GameState.combat.turnQueue.filter(e => e.type === 'companion').map(e => e.id);
    expect(ids).toEqual(['npc_nurse']);
  });
});
