import { CHARACTERS } from '../data/characters.js';
import { getCardImage } from './CardFactory.js';

const NPC_CHARACTER_IDS = {
  npc_jisu: 'doctor',
  npc_minjun: 'soldier',
  npc_yeongcheol: 'firefighter',
  npc_daehan: 'engineer',
};

export function getNPCPortrait(npcId, { full = false } = {}) {
  const character = CHARACTERS.find(entry => entry.id === NPC_CHARACTER_IDS[npcId]);
  return character?.[full ? 'portraitFull' : 'portraitSmall'] ?? getCardImage(npcId);
}
