import { describe, it, expect, beforeEach } from 'vitest';
import EventBus from '../../js/core/EventBus.js';
import GameState from '../../js/core/GameState.js';
import NPCQuestSystem from '../../js/systems/NPCQuestSystem.js';
import NPCS from '../../js/data/npcs.js';

function resetWorld() {
  EventBus._listeners = {};
  GameState.cards = {};
  GameState._nextId = 1;
  GameState.board = {
    top: [null, null, null, null, null, null, null, null, null, null],
    environment: [null, null, null],
    middle: Array(20).fill(null),
    bottom: Array(20).fill(null),
  };
  GameState.flags = { mapFragments: [] };
  GameState.player.learnedSkills = {};
  GameState.npcs = {
    states: {
      npc_dog: {
        spawned: true,
        dismissed: false,
        trust: 0,
        activeQuest: 'dog_quest_owner',
      },
    },
  };
}

function place(definitionId, quantity = 1) {
  const inst = GameState.createCardInstance(definitionId, { quantity });
  expect(inst).not.toBeNull();
  expect(GameState.placeCardInRow(inst.instanceId, 'bottom')).toBeTruthy();
  return inst;
}

describe('NPCQuestSystem dog quest', () => {
  beforeEach(resetWorld);

  it('requires offering dried meat instead of collecting cloth', () => {
    const quest = NPCS.npc_dog.quests.find(q => q.id === 'dog_quest_owner');

    expect(quest.steps).toEqual([
      expect.objectContaining({ type: 'offer_item', itemId: 'dried_meat', qty: 1 }),
    ]);
  });

  it('does not complete the dog trust quest from cloth alone', () => {
    place('cloth', 2);

    NPCQuestSystem._checkAllProgress();

    expect(GameState.npcs.states.npc_dog.trust).toBe(0);
    expect(GameState.npcs.states.npc_dog.activeQuest).toBe('dog_quest_owner');
    expect(GameState.flags.npcQuest_done_dog_quest_owner).toBeUndefined();
  });

  it('consumes offered dried meat and grants dog trust', () => {
    place('dried_meat', 1);

    NPCQuestSystem._checkAllProgress();

    expect(GameState.countOnBoard('dried_meat')).toBe(0);
    expect(GameState.npcs.states.npc_dog.trust).toBe(2);
    expect(GameState.npcs.states.npc_dog.activeQuest).toBeNull();
    expect(GameState.flags.npcQuest_done_dog_quest_owner).toBe(true);
    expect(GameState.player.learnedSkills.scent_tracking).toBe(0.05);
  });
});
