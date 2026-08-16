import EventBus from '../core/EventBus.js';

export const MAGAZINE_CAPACITY = 20;

export function isMagazineWeapon(definition) {
  return definition?.type === 'weapon'
    && typeof definition?.combat?.requiresAmmo === 'string'
    && definition.combat.requiresAmmo.length > 0;
}

export function isMagazineAmmoPack(definition, itemDefinitions) {
  if (definition?.subtype !== 'ammo' || typeof definition.id !== 'string') return false;
  const feeds = ammoTypeOf(definition);
  return Object.values(itemDefinitions ?? {}).some(item =>
    item?.combat?.requiresAmmo === feeds);
}

// 탄약이 어느 탄종에 들어가는지. ammoType을 선언하지 않은 탄약은 자기 id가 곧 탄종이다.
// 이 한 겹 덕에 새 화살을 추가할 때 무기 정의를 건드릴 필요가 없다.
export function ammoTypeOf(definition) {
  return typeof definition?.ammoType === 'string' && definition.ammoType.length > 0
    ? definition.ammoType
    : definition?.id ?? null;
}

// 팩 1장이 채우는 발수. 선언하지 않은 탄약은 탄창을 가득 채운다(기존 동작).
// 희소한 특수 화살만 값을 선언해 조금씩 들어가게 한다.
function roundsPerPack(definition) {
  const raw = definition?.roundsPerPack;
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
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
    loadedAmmoId: instance.loadedAmmoId ?? null,
  };
}

export function findCompatibleAmmoPack(gameState, weaponInstanceId) {
  const state = getMagazineState(gameState, weaponInstanceId);
  if (!state.ok) return null;
  return (gameState.getBoardCards?.() ?? []).find(card => {
    if (!card || (card.quantity ?? 1) <= 0) return false;
    const def = gameState.getCardDef?.(card.instanceId);
    return ammoTypeOf(def ?? { id: card.definitionId }) === state.ammoDefinitionId;
  }) ?? null;
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
  const weapon = gameState.cards[weaponInstanceId];
  const packDef = gameState.getCardDef?.(ammoPack.instanceId);
  // 팩마다 채우는 발수가 다르다 — 희소한 화살일수록 적게 들어간다
  const capacity = capacityFor(weapon);
  weapon.loadedAmmo = Math.min(capacity, roundsPerPack(packDef) ?? capacity);
  weapon.loadedAmmoId = ammoPack.definitionId;
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
