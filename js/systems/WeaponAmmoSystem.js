import EventBus from '../core/EventBus.js';

export const MAGAZINE_CAPACITY = 20;

export function isMagazineWeapon(definition) {
  return definition?.type === 'weapon'
    && typeof definition?.combat?.requiresAmmo === 'string'
    && definition.combat.requiresAmmo.length > 0;
}

export function isMagazineAmmoPack(definition, itemDefinitions) {
  if (definition?.subtype !== 'ammo' || typeof definition.id !== 'string') return false;
  return Object.values(itemDefinitions ?? {}).some(item =>
    item?.combat?.requiresAmmo === definition.id);
}

// 탄창 용량은 기본 상수에 카드별 보정(_ammoCapacityBonus)을 더해 계산한다.
// 부착물이 인스턴스에 남긴 값이라 같은 총기라도 카드마다 다르다.
function capacityFor(instance) {
  return MAGAZINE_CAPACITY + Math.max(0, instance?._ammoCapacityBonus ?? 0);
}

export function getMagazineCapacity(definition, instance = null) {
  return isMagazineWeapon(definition) ? capacityFor(instance) : 0;
}

function failure(reason, state = {}) {
  return { ...state, ok: false, reason };
}

function normalizedLoadedAmmo(instance) {
  const raw = Number.isFinite(instance?.loadedAmmo) ? Math.trunc(instance.loadedAmmo) : 0;
  return Math.min(capacityFor(instance), Math.max(0, raw));
}

export function getLoadedAmmo(gameState, weaponInstanceId) {
  const instance = gameState?.cards?.[weaponInstanceId];
  if (!instance) return 0;
  const normalized = normalizedLoadedAmmo(instance);
  instance.loadedAmmo = normalized;
  return normalized;
}

export function getMagazineState(gameState, weaponInstanceId) {
  const instance = gameState?.cards?.[weaponInstanceId];
  const definition = instance && typeof gameState?.getCardDef === 'function'
    ? gameState.getCardDef(weaponInstanceId)
    : null;
  if (!instance || !isMagazineWeapon(definition)) {
    return failure('invalid_magazine_weapon', {
      loadedAmmo: 0,
      capacity: 0,
      ammoDefinitionId: null,
    });
  }
  return {
    ok: true,
    reason: null,
    loadedAmmo: normalizedLoadedAmmo(instance),
    capacity: capacityFor(instance),
    ammoDefinitionId: definition.combat.requiresAmmo,
  };
}

export function findCompatibleAmmoPack(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return null;
  return (gameState.getBoardCards?.() ?? []).find(card =>
    card?.definitionId === state.ammoDefinitionId && (card.quantity ?? 1) > 0) ?? null;
}

export function canFire(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return state;
  return state.loadedAmmo > 0 ? state : failure('empty_magazine', state);
}

export function canReload(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return state;
  if (state.loadedAmmo > 0) return failure('magazine_not_empty', state);
  const ammoPack = findCompatibleAmmoPack(gameState, weaponInstanceId);
  return ammoPack
    ? { ...state, ammoPack }
    : failure('missing_ammo_pack', state);
}

export function reload(gameState, weaponInstanceId) {
  const check = canReload(gameState, weaponInstanceId);
  if (!check.ok) return check;
  const ammoPack = check.ammoPack;
  const nextQuantity = (ammoPack.quantity ?? 1) - 1;
  gameState.cards[weaponInstanceId].loadedAmmo = capacityFor(gameState.cards[weaponInstanceId]);
  if (nextQuantity <= 0) {
    gameState.removeCardInstance(ammoPack.instanceId);
    EventBus.emit('cardRemoved', { instanceId: ammoPack.instanceId });
  } else {
    ammoPack.quantity = nextQuantity;
    EventBus.emit('boardChanged', {});
  }
  return {
    ...getMagazineState(gameState, weaponInstanceId),
    consumedAmmoInstanceId: ammoPack.instanceId,
  };
}

export function consumeRound(gameState, weaponInstanceId) {
  const check = canFire(gameState, weaponInstanceId);
  if (!check.ok) return check;
  gameState.cards[weaponInstanceId].loadedAmmo = check.loadedAmmo - 1;
  EventBus.emit('boardChanged', {});
  return getMagazineState(gameState, weaponInstanceId);
}

export function normalizeMagazineCards(gameState) {
  for (const instance of Object.values(gameState?.cards ?? {})) {
    const definition = gameState.getCardDef?.(instance.instanceId);
    if (isMagazineWeapon(definition)) getLoadedAmmo(gameState, instance.instanceId);
  }
}
