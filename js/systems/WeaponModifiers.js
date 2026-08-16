// 무기 카드 한 장에 붙은 개조 효과를 한 곳에서 정규화해 돌려준다.
// 레거시 공격(_attackAction)과 랭크 스킬(CombatRankedEffects)이 각자 인스턴스 필드를
// 직접 읽던 탓에 부착물 대부분이 랭크 경로에서 무시됐다. 두 경로가 이 함수만 보게 한다.

function signed(value) {
  return Number.isFinite(value) ? value : 0;
}

function nonneg(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function ratio(value) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(1, value);
}

export function getWeaponModifiers(instance) {
  return {
    damageBonus:    signed(instance?.damageBonus),
    accuracyBonus:  signed(instance?.accuracyBonus),
    defensePierce:  nonneg(instance?._defensePierce),
    poisonDamage:   nonneg(instance?._poisonDamage),
    noiseReduction: instance?._suppressor ? ratio(instance._noiseReduction ?? 0.5) : 0,
    durabilitySave: ratio(instance?._durabilitySave),
    statusInflict:  instance?._statusInflict ?? null,
  };
}

// 맨손 공격에 실리는 장갑 보정. 무기 인스턴스가 없는 공격이라 별도 조회가 필요하다.
// 정의값(onWear.unarmedDmgBonus)과 부착물이 남긴 인스턴스 값(너클 랩)을 합산한다.
export function getUnarmedGloveBonus(gameState) {
  const handsId = gameState?.player?.equipped?.hands;
  if (!handsId) return 0;
  const def  = gameState.getCardDef?.(handsId);
  const inst = gameState.cards?.[handsId];
  return signed(def?.onWear?.unarmedDmgBonus) + signed(inst?._unarmedDmgBonus);
}
