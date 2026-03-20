// === BODY PART INJURY SYSTEM ===
// 신체 부위별 부상 시뮬레이션: 6개 부위, 부상 타입/심각도/자연 치유
// 매 TP마다 부상 치유 진행, 전투 피격 시 부위 판정 + 부상 추가

import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';

// ── 부위별 피격 확률 테이블 (무기 타입별) ──────────────────────
const HIT_TABLES = {
  melee:   { head: 0.10, torso: 0.35, leftArm: 0.15, rightArm: 0.15, leftLeg: 0.125, rightLeg: 0.125 },
  ranged:  { head: 0.15, torso: 0.45, leftArm: 0.10, rightArm: 0.10, leftLeg: 0.10,  rightLeg: 0.10 },
  unarmed: { head: 0.15, torso: 0.25, leftArm: 0.20, rightArm: 0.20, leftLeg: 0.10,  rightLeg: 0.10 },
};

// ── 부상 타입별 기본 치유 TP ──────────────────────────────────
const INJURY_HEAL_TP = {
  laceration: 36,   // 열상: 36 TP (~12시간)
  bleeding:   24,   // 출혈: 24 TP (~8시간)
  fracture:   108,  // 골절: 108 TP (~36시간)
  concussion: 72,   // 뇌진탕: 72 TP (~24시간)
};

// ── 자연 치유 속도 (severity 당 TP마다 감소량) ──────────────────
const NATURAL_HEAL_RATE = 0.05;

// ── 적 타입 → 무기 타입 매핑 ──────────────────────────────────
const ENEMY_TYPE_TO_WEAPON = {
  zombie: 'unarmed',
  human:  'ranged',
  animal: 'unarmed',
};

// ── 부상 타입 결정 (피해량 기반) ──────────────────────────────
function _rollInjuryType(bodyPart, damage) {
  // 머리 → 뇌진탕 우선, 나머지 → 피해량 기반 확률
  if (bodyPart === 'head') {
    return Math.random() < 0.6 ? 'concussion' : 'laceration';
  }
  if (damage >= 25) {
    return Math.random() < 0.5 ? 'fracture' : 'bleeding';
  }
  if (damage >= 15) {
    const r = Math.random();
    if (r < 0.35) return 'bleeding';
    if (r < 0.65) return 'laceration';
    return 'fracture';
  }
  return Math.random() < 0.6 ? 'laceration' : 'bleeding';
}

// ── 심각도 결정 (피해량 기반) ──────────────────────────────────
function _rollSeverity(damage) {
  if (damage >= 30) return Math.random() < 0.4 ? 3 : 2;
  if (damage >= 18) return Math.random() < 0.5 ? 2 : 1;
  return 1;
}

const BodySystem = {

  init() {
    EventBus.on('tpAdvance', () => this._onTP());
    EventBus.on('saveLoaded', () => this.ensureInitialized());
  },

  // ── 초기화 보장 (구버전 세이브 호환) ──────────────────────────

  ensureInitialized() {
    if (!GameState.body) {
      GameState.body = this._createDefault();
    }
    // 개별 부위 누락 보정
    const def = this._createDefault();
    for (const part of Object.keys(def)) {
      if (!GameState.body[part]) {
        GameState.body[part] = { ...def[part] };
      }
    }
  },

  _createDefault() {
    return {
      head:     { hp: 100, injuries: [] },
      torso:    { hp: 100, injuries: [] },
      leftArm:  { hp: 100, injuries: [] },
      rightArm: { hp: 100, injuries: [] },
      leftLeg:  { hp: 100, injuries: [] },
      rightLeg: { hp: 100, injuries: [] },
    };
  },

  // ── 피격 부위 판정 ──────────────────────────────────────────

  rollHitLocation(weaponType) {
    const table = HIT_TABLES[weaponType] ?? HIT_TABLES.melee;
    const roll = Math.random();
    let cumulative = 0;
    for (const [part, prob] of Object.entries(table)) {
      cumulative += prob;
      if (roll < cumulative) return part;
    }
    return 'torso'; // fallback
  },

  // ── 부상 추가 ──────────────────────────────────────────────

  addInjury(bodyPart, type, severity) {
    this.ensureInitialized();
    const part = GameState.body[bodyPart];
    if (!part) return;

    const tpTotal = Math.round((INJURY_HEAL_TP[type] ?? 48) * severity);
    const injury = {
      type,
      severity: Math.min(3, Math.max(1, severity)),
      tpRemaining: tpTotal,
      tpTotal,
    };

    // 동일 부위에 동일 타입 부상이 있으면 심각도만 상승
    const existing = part.injuries.find(i => i.type === type);
    if (existing) {
      existing.severity = Math.min(3, existing.severity + 1);
      existing.tpRemaining = Math.round((INJURY_HEAL_TP[type] ?? 48) * existing.severity);
      existing.tpTotal = existing.tpRemaining;
    } else {
      part.injuries = [...part.injuries, injury];
    }

    // 부위 HP 감소
    const hpLoss = severity * 10;
    part.hp = Math.max(0, part.hp - hpLoss);

    // 알림
    const partName = I18n.t(`body.${bodyPart}`);
    const typeName = I18n.t(`body.injury.${type}`);
    EventBus.emit('notify', {
      message: I18n.t('body.hitLocation', { part: partName, type: typeName }),
      type: 'danger',
    });
    EventBus.emit('bodyInjury', { bodyPart, type, severity });
  },

  // ── 전투 피격 시 호출 (CombatSystem 연동) ──────────────────

  onCombatHit(damage, enemy) {
    if (!GameState.player.isAlive) return;
    if (damage < 8) return; // 경미한 피해는 부상 없음

    // 부상 확률: 기본 30% + 피해량 비례
    const injuryChance = Math.min(0.8, 0.30 + (damage - 8) * 0.02);
    if (Math.random() > injuryChance) return;

    const enemyType = enemy?.type ?? 'zombie';
    const weaponType = ENEMY_TYPE_TO_WEAPON[enemyType] ?? 'melee';
    const hitPart = this.rollHitLocation(weaponType);
    const injuryType = _rollInjuryType(hitPart, damage);
    const severity = _rollSeverity(damage);

    this.addInjury(hitPart, injuryType, severity);
  },

  // ── TP 진행: 자연 치유 ──────────────────────────────────────

  _onTP() {
    if (!GameState.player.isAlive) return;
    this.ensureInitialized();

    const body = GameState.body;
    for (const partKey of Object.keys(body)) {
      const part = body[partKey];
      if (part.injuries.length === 0) {
        // 부상 없는 부위는 HP 자연 회복
        part.hp = Math.min(100, part.hp + 0.5);
        continue;
      }

      // 부상 치유 진행
      part.injuries = part.injuries.reduce((kept, injury) => {
        // severity 3은 의료 치료 필요 (자연 치유 안 됨)
        if (injury.severity >= 3) {
          return [...kept, injury];
        }

        const newTp = injury.tpRemaining - 1;
        if (newTp <= 0) {
          // 부상 완치
          EventBus.emit('notify', {
            message: I18n.t('body.healed', {
              part: I18n.t(`body.${partKey}`),
              type: I18n.t(`body.injury.${injury.type}`),
            }),
            type: 'good',
          });
          return kept;
        }

        // 심각도 자연 감소
        const newSeverity = Math.max(0, injury.severity - NATURAL_HEAL_RATE);
        if (newSeverity <= 0) return kept;

        return [...kept, { ...injury, tpRemaining: newTp, severity: newSeverity }];
      }, []);
    }
  },

  // ── 부위 치료 (의료 아이템 사용) ──────────────────────────────

  healBodyPart(bodyPart, amount) {
    this.ensureInitialized();
    const part = GameState.body[bodyPart];
    if (!part) return;

    part.hp = Math.min(100, part.hp + amount);

    // 의사 캐릭터: severity 3 치료 가능
    const isDoctor = GameState.player.characterId === 'doctor';
    const hasMedicine = (GameState.player.skills?.medicine?.level ?? 0) >= 5;

    part.injuries = part.injuries.reduce((kept, injury) => {
      if (injury.severity >= 3 && !(isDoctor && hasMedicine)) {
        return [...kept, injury];
      }
      const newTp = injury.tpRemaining - Math.round(amount * 0.5);
      if (newTp <= 0) return kept;
      return [...kept, { ...injury, tpRemaining: newTp }];
    }, []);
  },

  // ── 종합 효과 계산 ──────────────────────────────────────────

  getEffects() {
    this.ensureInitialized();
    const body = GameState.body;
    const effects = {
      accuracyPenalty: 0,    // 머리 부상: 탐색 효율 감소
      fatigueMult:     1.0,  // 몸통 부상: 피로 증가 배수
      carryPenalty:    0,    // 왼팔 부상: 적재 감소율
      damagePenalty:   0,    // 오른팔 부상: 데미지 감소율
      moveTpExtra:     0,    // 다리 부상: 이동 추가 TP
      fleePenalty:     0,    // 다리 부상: 도주 확률 감소
    };

    for (const injury of body.head.injuries) {
      effects.accuracyPenalty += 0.20 * injury.severity;
    }

    for (const injury of body.torso.injuries) {
      effects.fatigueMult += 0.50 * injury.severity;
    }

    for (const injury of body.leftArm.injuries) {
      effects.carryPenalty += 0.20 * injury.severity;
    }

    for (const injury of body.rightArm.injuries) {
      effects.damagePenalty += 0.20 * injury.severity;
    }

    for (const injury of body.leftLeg.injuries) {
      effects.moveTpExtra += 1 * Math.ceil(injury.severity);
      effects.fleePenalty += 0.15 * injury.severity;
    }

    for (const injury of body.rightLeg.injuries) {
      effects.moveTpExtra += 1 * Math.ceil(injury.severity);
      effects.fleePenalty += 0.15 * injury.severity;
    }

    return effects;
  },

  // ── 특정 부위 정보 조회 ──────────────────────────────────────

  getPartStatus(bodyPart) {
    this.ensureInitialized();
    return GameState.body[bodyPart] ?? null;
  },

  // ── 전체 부상 요약 ──────────────────────────────────────────

  getAllInjuries() {
    this.ensureInitialized();
    const result = [];
    for (const [partKey, part] of Object.entries(GameState.body)) {
      for (const injury of part.injuries) {
        result.push({ bodyPart: partKey, ...injury });
      }
    }
    return result;
  },

  // ── 부상 유무 확인 ──────────────────────────────────────────

  hasAnyInjury() {
    this.ensureInitialized();
    return Object.values(GameState.body).some(part => part.injuries.length > 0);
  },
};

export default BodySystem;
