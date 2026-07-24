import { isMagazineWeapon } from './WeaponAmmoSystem.js';

export function weaponSlotForDefinition(definition) {
  if (isMagazineWeapon(definition)) return 'weapon_main';
  if (definition?.type === 'weapon' && definition?.subtype === 'melee') return 'weapon_sub';
  return null;
}

function recoverToBoardOrPending(gameState, instanceId) {
  if (!gameState?.cards?.[instanceId]) return false;
  if (gameState.placeCardInRow(instanceId, 'middle')) return true;

  const instance = gameState.cards[instanceId];
  gameState.pendingLoot = [...(gameState.pendingLoot ?? []), {
    definitionId: instance.definitionId,
    quantity: instance.quantity ?? 1,
    contamination: instance.contamination ?? 0,
  }];
  delete gameState.cards[instanceId];
  return true;
}

export function normalizeEquippedWeaponSlots(gameState) {
  const equipped = gameState?.player?.equipped;
  if (!equipped) return { moved: [], recovered: [] };

  const ids = [equipped.weapon_main, equipped.weapon_sub].filter(Boolean);
  equipped.weapon_main = null;
  equipped.weapon_sub = null;

  const moved = [];
  const recovered = [];
  for (const instanceId of [...new Set(ids)]) {
    const slot = weaponSlotForDefinition(gameState.getCardDef?.(instanceId));
    if (slot && !equipped[slot]) {
      equipped[slot] = instanceId;
      moved.push(instanceId);
    } else {
      recoverToBoardOrPending(gameState, instanceId);
      recovered.push(instanceId);
    }
  }
  return { moved, recovered };
}
