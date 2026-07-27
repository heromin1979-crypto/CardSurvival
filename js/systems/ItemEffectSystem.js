import TraitSystem from './TraitSystem.js';
import SkillSystem from './SkillSystem.js';
import NPCSystem from './NPCSystem.js';
import GameState from '../core/GameState.js';

const EFFECT_LABELS = {
  hydration: '수분',
  nutrition: '영양',
  hp: 'HP',
  stamina: '스태',
  temperature: '체온',
  morale: '사기',
  fatigue: '피로',
  infection: '감염',
  radiation: '방사능',
  contamination: '오염',
};

// contamination은 플레이어 스탯이 아니라 카드 뱃지에서 제외 (아이템 오염도·분기 트리거 전용 필드)
const CARD_EFFECT_ORDER = [
  'hydration',
  'nutrition',
  'hp',
  'stamina',
  'temperature',
  'morale',
  'fatigue',
  'infection',
  'radiation',
];

export function getConsumableEffect(def) {
  if (!def) return null;
  if (def.onConsume) return def.onConsume;
  if (def.type === 'consumable' && def.onUse) return def.onUse;
  return null;
}

export function normalizeConsumeEffect(rawEffect) {
  if (!rawEffect) return null;
  const effect = { ...rawEffect };

  if (typeof effect.heal === 'number') {
    effect.hp = (effect.hp ?? 0) + effect.heal;
  }
  if (typeof effect.warmth === 'number') {
    effect.temperature = (effect.temperature ?? 0) + effect.warmth;
  }

  return effect;
}

export function consumeEffectMultiplier(def, inst = {}) {
  const isMedical = def?.tags?.includes('medical') ?? false;
  const isFood = def?.subtype === 'food' || def?.subtype === 'drink';
  const isCrafted = inst?._crafted ?? false;
  const traitMult = isMedical ? (TraitSystem.getTraitEffect('medic', 'healMultiplier') ?? 1.0) : 1.0;
  const medSkill = isMedical ? SkillSystem.getBonus('medicine', 'healMult') : 1.0;
  const compHeal = isMedical ? NPCSystem.getCompanionHealBonus() : 1.0;
  const cookSkill = isFood ? SkillSystem.getBonus('cooking', 'foodEffectMult') : 1.0;

  return {
    isMedical,
    isFood,
    isCrafted,
    healMult: traitMult * compHeal * (isMedical ? medSkill : (isFood ? cookSkill : 1.0)),
  };
}

export function getConsumeEffectPreview(def, inst = {}) {
  const effect = normalizeConsumeEffect(getConsumableEffect(def));
  if (!effect) return null;

  const { isMedical, healMult } = consumeEffectMultiplier(def, inst);
  const preview = { ...effect };
  for (const key of ['hydration', 'nutrition', 'hp']) {
    if (typeof preview[key] === 'number') {
      preview[key] = Math.round(preview[key] * healMult);
    }
  }
  if (typeof preview.infection === 'number' && preview.infection < 0 && isMedical) {
    preview.infection = Math.round(preview.infection * healMult);
  }
  if (def?.tags?.includes('bandage')) {
    preview.hp = (preview.hp ?? 0) + (GameState.player?.bandageHpBonus ?? 0);
  }

  return preview;
}

function formatSigned(value) {
  if (typeof value !== 'number') return String(value);
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}

export function formatConsumeEffectEntries(def, inst = {}) {
  const effect = getConsumeEffectPreview(def, inst);
  if (!effect) return [];

  return CARD_EFFECT_ORDER
    .filter(key => typeof effect[key] === 'number' && effect[key] !== 0)
    .map(key => ({
      key,
      label: EFFECT_LABELS[key] ?? key,
      value: formatSigned(effect[key]),
      text: `${EFFECT_LABELS[key] ?? key}${formatSigned(effect[key])} 즉시`,
      cls: isNegativeEffect(key, effect[key]) ? 'danger' : '',
    }));
}

export function formatConsumeEffectParts(def, inst = {}) {
  return formatConsumeEffectEntries(def, inst).map(entry => entry.text);
}

export function formatCardEffectEntries(def, inst = {}) {
  const entries = [
    ...formatConsumeEffectEntries(def, inst).map(entry => ({
      label: entry.label,
      value: `${entry.value} 즉시`,
      cls: entry.cls,
    })),
    ...formatSpecialConsumeEffectParts(def).map(value => ({ label: '특수 효과', value })),
    ...formatTreatmentEffectParts(def).map(value => ({ label: '치료 효과', value })),
    ...formatUtilityEffectParts(def).map(value => ({ label: '활용', value })),
    ...formatEquipmentEffectParts(def).map(value => ({ label: '장착 효과', value })),
    ...formatAppliedModifierParts(inst).map(value => ({ label: '적용된 강화', value })),
  ];

  const seen = new Set();
  return entries.filter(entry => {
    const key = `${entry.label}:${entry.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatCardEffectParts(def, inst = {}) {
  const parts = [
    ...formatConsumeEffectParts(def, inst),
    ...formatSpecialConsumeEffectParts(def),
    ...formatTreatmentEffectParts(def),
    ...formatUtilityEffectParts(def),
    ...formatEquipmentEffectParts(def),
    ...formatAppliedModifierParts(inst),
  ];
  return [...new Set(parts)];
}

function formatAppliedModifierParts(inst = {}) {
  const parts = [];
  if (inst._poisonDamage) parts.push(`독 피해 +${inst._poisonDamage} 적중 시`);
  if (inst._suppressor) parts.push(`소음 -${formatPercent(inst._noiseReduction ?? 0.5)} 공격 시`);
  if (inst._defenseSalve) {
    const damageReduction = inst._damageReductionBonus ?? 0.05;
    const critReduction = inst._critReductionBonus ?? 0.02;
    parts.push(`피해 -${formatPercent(damageReduction)} 장착 중`);
    parts.push(`치명 -${formatPercent(critReduction)} 장착 중`);
  }
  return parts;
}

function isNegativeEffect(key, value) {
  const harmfulWhenPositive = ['fatigue', 'infection', 'radiation', 'contamination'];
  if (harmfulWhenPositive.includes(key)) return value > 0;
  return value < 0;
}

function formatSpecialConsumeEffectParts(def) {
  const effect = normalizeConsumeEffect(getConsumableEffect(def));
  if (!effect) return [];

  const parts = [];
  if (effect.zombieRepelTP) parts.push(`좀비 회피 ${effect.zombieRepelTP}TP`);
  if (effect.guaranteedStun) parts.push(`기절 ${effect.guaranteedStun}턴`);
  if (effect.permanentInfectionImmunity) parts.push('감염 면역 영구');
  if (effect.permanentDiseaseResist) parts.push(`질병 저항 +${formatPercent(effect.permanentDiseaseResist)} 영구`);
  if (effect.cureAllDiseases) parts.push('모든 질병 치료 즉시');
  if (effect.cureAllPoisons) parts.push('모든 독 치료 즉시');
  if (effect.cureDespair) parts.push('절망 해소 즉시');
  if (Array.isArray(effect.removeStatus) && effect.removeStatus.length > 0) {
    parts.push(`상태 해제 ${effect.removeStatus.length}종 즉시`);
  }
  if (effect.infectionResistBuff) {
    const amount = effect.infectionResistBuff.amount ?? effect.infectionResistBuff.value ?? 0;
    const duration = effect.infectionResistBuff.duration ?? effect.infectionResistDuration;
    parts.push(`감염 저항 +${formatPercent(amount)}${duration ? ` ${duration}TP` : ''}`);
  } else if (effect.infectionResist) {
    parts.push(`감염 저항 +${formatPercent(effect.infectionResist)}${effect.infectionResistDuration ? ` ${effect.infectionResistDuration}TP` : ''}`);
  }
  return parts;
}

function formatTreatmentEffectParts(def) {
  if (!def?.treatPart) return [];
  const parts = formatBodyParts(def.treatPart.parts);
  const injuries = formatInjuries(def.treatPart.injuryTypes);
  const severity = def.treatPart.severityDec ? ` -${def.treatPart.severityDec}단계` : '';
  const hp = def.treatPart.hpHeal ? ` HP+${def.treatPart.hpHeal}` : '';
  const skill = def.treatPart.skillLevel ? ` 의료 Lv.${def.treatPart.skillLevel}` : '';
  return [`${parts} ${injuries}${severity} 즉시${hp}${skill}`];
}

function formatUtilityEffectParts(def) {
  const parts = [];
  if (def?.kindlingUses) parts.push(`불쏘시개 ${def.kindlingUses}회`);
  return parts;
}

function formatEquipmentEffectParts(def) {
  if (!def || (def.type !== 'armor' && def.type !== 'tool' && def.type !== 'weapon')) return [];
  const parts = [];
  const armor = def.armor;
  const wear = def.onWear;

  if (armor?.defense) parts.push(`방어 ${armor.defense} 장착 중`);
  if (armor?.damageReduction) parts.push(`피해 -${formatPercent(armor.damageReduction)} 장착 중`);
  if (armor?.critReduction) parts.push(`치명 -${formatPercent(armor.critReduction)} 장착 중`);
  if (armor?.movePenalty) parts.push(`이동 -${formatPercent(armor.movePenalty)} 장착 중`);

  if (wear?.damageReduction) parts.push(`피해 -${formatPercent(wear.damageReduction)} 장착 중`);
  if (wear?.critReduction) parts.push(`치명 -${formatPercent(wear.critReduction)} 장착 중`);
  if (wear?.radiationMult) parts.push(`방사능 x${wear.radiationMult.toFixed(2)} 장착 중`);
  if (wear?.contaminationMult) parts.push(`오염 x${wear.contaminationMult.toFixed(2)} 장착 중`);
  if (wear?.infectionMult) parts.push(`감염 x${wear.infectionMult.toFixed(2)} 장착 중`);
  if (wear?.coldImmunity) parts.push('추위 면역 장착 중');
  if (wear?.temperatureMin != null) parts.push(`${wear.temperatureMin}도 보호 장착 중`);
  if (wear?.acidImmunity) parts.push('산성 면역 장착 중');
  if (wear?.temperatureImmunity) parts.push(`${wear.temperatureImmunity}도 내열 장착 중`);
  if (wear?.waterproof) parts.push('방수 장착 중');
  if (wear?.encounterReduction) parts.push(`조우 -${formatPercent(wear.encounterReduction)} 장착 중`);
  if (wear?.stealthBonus) parts.push(`은신 +${formatPercent(wear.stealthBonus)} 장착 중`);
  if (wear?.noiseReduction) parts.push(`소음 -${formatPercent(wear.noiseReduction)} 장착 중`);
  if (wear?.moraleDecayReduction) parts.push(`사기 감소 -${formatPercent(wear.moraleDecayReduction)} 장착 중`);
  if (wear?.hpRegenPerTP) parts.push(`HP +${wear.hpRegenPerTP}/TP 장착 중`);
  if (wear?.critBonus) parts.push(`치명 +${formatPercent(wear.critBonus)} 장착 중`);
  if (wear?.critMultiplierBonus) parts.push(`치명 피해 +${formatPercent(wear.critMultiplierBonus)} 장착 중`);
  return parts;
}

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatBodyParts(parts = []) {
  const labels = {
    leftArm: '팔',
    rightArm: '팔',
    leftLeg: '다리',
    rightLeg: '다리',
    head: '머리',
    torso: '몸통',
  };
  const names = [...new Set(parts.map(part => labels[part] ?? part))];
  return names.join('/');
}

function formatInjuries(types = []) {
  const labels = {
    fracture: '골절',
    bleeding: '출혈',
    deep_laceration: '깊은 열상',
    concussion: '뇌진탕',
  };
  return [...new Set(types.map(type => labels[type] ?? type))].join('/');
}
