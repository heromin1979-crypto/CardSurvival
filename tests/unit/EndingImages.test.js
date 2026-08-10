// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEndingImage } from '../../js/data/endingImages.js';
import FIREFIGHTER_BRANCH_A from '../../js/data/mainQuests/firefighter/branch_a.js';
import FIREFIGHTER_BRANCH_B from '../../js/data/mainQuests/firefighter/branch_b.js';
import HOMELESS_BRANCH_B from '../../js/data/mainQuests/homeless/branch_b.js';
import ENDINGS from '../../js/data/endings.js';
import GameState from '../../js/core/GameState.js';
import EndingSystem from '../../js/systems/EndingSystem.js';
import Ending from '../../js/screens/Ending.js';
import EndingGallery from '../../js/screens/EndingGallery.js';

let originalFlags;

function createMemoryStorage() {
  const values = new Map();
  return {
    get length() { return values.size; },
    clear() { values.clear(); },
    getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
    key(index) { return [...values.keys()][index] ?? null; },
    removeItem(key) { values.delete(String(key)); },
    setItem(key, value) { values.set(String(key), String(value)); },
  };
}

beforeEach(() => {
  originalFlags = GameState.flags;
  vi.stubGlobal('localStorage', createMemoryStorage());
  localStorage.clear();
  document.body.innerHTML = '<main id="screen-ending"></main>';
});

afterEach(() => {
  Ending._clearTimers();
  GameState.flags = originalFlags;
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('character ending image lookup', () => {
  it('keeps identical ending codes scoped to their character', () => {
    expect(getEndingImage('doctor', 'a1_vaccine')?.src).toBe('assets/endings/doctor_a1_vaccine.png');
    expect(getEndingImage('firefighter', 'b3_escape')?.src).toBe('assets/endings/firefighter_b3_escape.png');
  });

  it('resolves active chef ending assets', () => {
    expect(getEndingImage('chef', 'a1_network')?.src).toBe('assets/endings/chef_a1_network.png');
    expect(getEndingImage('chef', 'a2_farm')?.src).toBe('assets/endings/chef_a2_farm.png');
    expect(getEndingImage('chef', 'b1_ascension')?.src).toBe('assets/endings/chef_b1_ascension.png');
  });

  it('renders the image selected by the firefighter quest fire_ending flag', () => {
    const subEnding = FIREFIGHTER_BRANCH_B.mq_fire_end_b3.reward.flags.fire_ending;
    GameState.flags = { fire_ending: subEnding };
    vi.spyOn(EndingSystem, 'getAllWithStatus').mockReturnValue([]);
    vi.spyOn(EndingSystem, 'getUnlocked').mockReturnValue([]);

    Ending._onEnter({
      endingId: 'mq_firefighter_b3',
      ending: {
        category: 'character',
        characterId: 'firefighter',
        gradient: '',
        title: 'Firefighter ending',
        subtitle: '',
        narrative: [],
      },
      isFirst: false,
    });

    expect(document.querySelector('.ending-img')?.getAttribute('src'))
      .toBe('assets/endings/firefighter_b3_escape.png');
  });

  it('stores the firefighter fire_ending code for gallery image lookup', () => {
    const subEnding = FIREFIGHTER_BRANCH_B.mq_fire_end_b3.reward.flags.fire_ending;

    EndingSystem.unlockEnding('mq_firefighter_b3', {
      flags: { fire_ending: subEnding },
      time: { day: 42 },
    });

    expect(EndingSystem.getUnlockMeta().mq_firefighter_b3)
      .toEqual({ day: 42, subEnding: 'b3_escape' });
  });

  it('repairs a legacy firefighter gallery entry with a null subEnding', () => {
    localStorage.setItem('CARD_SURVIVAL_ENDINGS_v1_meta', JSON.stringify({
      mq_firefighter_b3: { day: 42, subEnding: null },
    }));

    EndingSystem.unlockEnding('mq_firefighter_b3', {
      flags: { fire_ending: 'b3_escape' },
      time: { day: 99 },
    });

    const repaired = EndingSystem.getUnlockMeta().mq_firefighter_b3;
    expect(repaired).toEqual({ day: 42, subEnding: 'b3_escape' });
    expect(getEndingImage('firefighter', repaired.subEnding)?.src)
      .toBe('assets/endings/firefighter_b3_escape.png');
  });

  it('does not overwrite a valid existing gallery subEnding', () => {
    localStorage.setItem('CARD_SURVIVAL_ENDINGS_v1_meta', JSON.stringify({
      mq_firefighter_b3: { day: 42, subEnding: 'a1_shelter' },
    }));

    EndingSystem.unlockEnding('mq_firefighter_b3', {
      flags: { fire_ending: 'b3_escape' },
      time: { day: 99 },
    });

    expect(EndingSystem.getUnlockMeta().mq_firefighter_b3)
      .toEqual({ day: 42, subEnding: 'a1_shelter' });
  });

  it('repairs and renders a legacy firefighter gallery entry without unlocking again', () => {
    localStorage.setItem('CARD_SURVIVAL_ENDINGS_v1_meta', JSON.stringify({
      mq_firefighter_b3: { day: 42, subEnding: null },
    }));
    GameState.flags = { fire_ending: 'b3_escape' };

    const card = EndingGallery._buildCard(ENDINGS.mq_firefighter_b3, true, 42);

    expect(card.querySelector('.eg-card-thumb')?.getAttribute('src'))
      .toBe('assets/endings/firefighter_b3_escape.png');
    expect(EndingSystem.getUnlockMeta().mq_firefighter_b3)
      .toEqual({ day: 42, subEnding: 'b3_escape' });
  });

  it.each([
    ['a mismatched branch code', 'a1_shelter'],
    ['a bogus code', 'not_an_ending'],
  ])('does not backfill %s while rendering the firefighter B3 gallery entry', (_label, fireEnding) => {
    localStorage.setItem('CARD_SURVIVAL_ENDINGS_v1_meta', JSON.stringify({
      mq_firefighter_b3: { day: 42, subEnding: null },
    }));
    GameState.flags = { fire_ending: fireEnding };

    const card = EndingGallery._buildCard(ENDINGS.mq_firefighter_b3, true, 42);

    expect(card.querySelector('.eg-card-thumb')).toBeNull();
    expect(EndingSystem.getUnlockMeta().mq_firefighter_b3)
      .toEqual({ day: 42, subEnding: null });
  });

  it('preserves a valid saved subEnding while rendering the gallery', () => {
    localStorage.setItem('CARD_SURVIVAL_ENDINGS_v1_meta', JSON.stringify({
      mq_firefighter_b3: { day: 42, subEnding: 'b3_escape' },
    }));
    GameState.flags = { fire_ending: 'a1_shelter' };

    const card = EndingGallery._buildCard(ENDINGS.mq_firefighter_b3, true, 42);

    expect(card.querySelector('.eg-card-thumb')?.getAttribute('src'))
      .toBe('assets/endings/firefighter_b3_escape.png');
    expect(EndingSystem.getUnlockMeta().mq_firefighter_b3)
      .toEqual({ day: 42, subEnding: 'b3_escape' });
  });

  it('resolves every active firefighter branch code through its real storage key', () => {
    const branchCodes = [
      FIREFIGHTER_BRANCH_A.mq_fire_end_a1.reward.flags.fire_ending,
      FIREFIGHTER_BRANCH_A.mq_fire_end_a3.reward.flags.fire_ending,
      FIREFIGHTER_BRANCH_B.mq_fire_end_b3.reward.flags.fire_ending,
    ];

    expect(branchCodes).toEqual(['a1_shelter', 'a3_memorial', 'b3_escape']);
    expect(branchCodes.map(code => getEndingImage('firefighter', code)?.src)).toEqual([
      'assets/endings/firefighter_a1_shelter.png',
      'assets/endings/firefighter_a3_memorial.png',
      'assets/endings/firefighter_b3_escape.png',
    ]);
  });

  it('maps the active homeless b3_network code to the existing ending image', () => {
    const subEnding = HOMELESS_BRANCH_B.mq_homeless_end_b3.reward.flags.homeless_ending;

    expect(subEnding).toBe('b3_network');
    expect(getEndingImage('homeless', subEnding)?.src)
      .toBe('assets/endings/homeless_b3_wanderer.png');
  });

  it('returns null for an invalid pair', () => expect(getEndingImage('doctor', 'b3_escape')).toBeNull());
});
