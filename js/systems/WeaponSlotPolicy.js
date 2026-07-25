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
  const {
    instanceId: _instanceId,
    definitionId,
    quantity,
    contamination,
    ...instanceOverrides
  } = instance;
  gameState.pendingLoot = [...(gameState.pendingLoot ?? []), {
    definitionId,
    quantity: quantity ?? 1,
    contamination: contamination ?? 0,
    ...(Object.keys(instanceOverrides).length > 0 ? { instanceOverrides } : {}),
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
