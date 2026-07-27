import { describe, expect, it } from 'vitest';
import { en, ko } from '../../js/data/locales.js';
import { SECRET_ENEMIES } from '../../js/data/secretEnemies.js';
import { validateBossPatternSchema } from '../../js/data/validate.js';

const EXPECTED_ACTION_NAMES = {
  boss_patient_zero: ['감염된 돌진', '바이러스 폭발', '변이 재생', '숙주 폭주'],
  boss_radiation_colossus: ['방사능 주먹', '대지 강타', '낙진 지대', '임계 질량'],
  boss_acid_queen: ['산성 분사', '부식성 꼬리치기', '산성 웅덩이', '완전 부식'],
  boss_horde_mother: ['육벽 밀치기', '시체 휘두르기', '소환의 비명', '어미의 포식'],
  boss_frozen_giant: ['냉기 숨결', '빙결 주먹', '얼음 갑옷', '빙결 감옥'],
  boss_raider_warlord: ['조준 사격', '제압 사격', '증원 호출', '처형 명령'],
  boss_phantom_sniper: ['정밀 사격', '도탄 사격', '위장', '헤드샷'],
  boss_cult_leader: ['의식용 단검', '신도 투척 폭탄', '설교', '피의 의식'],
  boss_mutant_alpha_tiger: ['도약 습격', '발톱 난무', '포효', '포식자의 사냥'],
  boss_sewer_king: ['죽음의 회전', '꼬리 휩쓸기', '잠수', '오수 역류'],
  boss_swarm_queen_bee: ['독침 연사', '날개 칼날', '로열 젤리', '왕실 산란'],
  boss_feral_dog_alpha: ['목덜미 물기', '광란 물어뜯기', '무리 소환 울부짖음', '알파의 사냥'],
  boss_penthouse_survivor: ['금도금 권총', '폭발탄 사격', '보디가드 호출', '현상금 선고'],
  boss_escaped_experiment: ['변이 할퀴기', '독성 체액 분사', '적응 변이', '완전 적응'],
  boss_blizzard_wraith: ['동결의 손길', '얼음 파편', '눈보라 망토', '백색 소멸'],
  boss_soldier_nemesis: ['소총 점사', '섬광탄', '탈영병 호출', '교차 사격'],
  boss_firefighter_nemesis: ['소방 도끼', '화염 돌진', '방화복 태세', '백드래프트'],
  boss_homeless_nemesis: ['철제 파이프 추심', '협박 후 일격', '건달 소환', '강제 추심'],
  boss_chef_nemesis: ['식칼 난도질', '고기 갈고리', '끓는 기름 장판', '도축 시간'],
  boss_doctor_nemesis: ['외과적 일격', '바이러스 주입', '잘못된 처치', '최종 수술'],
  food_warlord: ['기아 강타', '갈고리 도끼', '약탈대 소집', '굶주림의 지배'],
};

const SUPPORTED_EFFECT_TYPES = new Set([
  'damage',
  'status',
  'targetStatus',
  'move',
  'forcedMove',
  'selfHeal',
  'selfStatus',
  'summon',
  'partyDamage',
  'battlefieldStatus',
  'resource',
  'weaponLock',
  'noise',
]);

const SUPPORTED_PASSIVE_TYPES = new Set([
  'counterAttack',
  'resistanceShift',
]);

function actionsFor(pattern) {
  return [
    ...pattern.basicAttacks,
    pattern.specialSkill,
    pattern.ultimate,
  ];
}

describe('final boss pattern roster', () => {
  it('migrates the complete 21-boss roster to the approved four actions', () => {
    const bosses = Object.values(SECRET_ENEMIES).filter(enemy => enemy.isBoss === true);

    expect(bosses).toHaveLength(21);
    expect(Object.keys(SECRET_ENEMIES).sort()).toEqual(Object.keys(EXPECTED_ACTION_NAMES).sort());
    expect(validateBossPatternSchema(SECRET_ENEMIES)).toEqual([]);

    for (const boss of bosses) {
      const pattern = boss.bossPattern;
      expect(pattern, boss.id).toBeDefined();
      if (!pattern) continue;
      expect(pattern.basicAttacks, boss.id).toHaveLength(2);
      expect(pattern.specialSkill, boss.id).toMatchObject({
        category: 'special',
        chance: 0.3,
      });
      expect(pattern.ultimate, boss.id).toMatchObject({
        category: 'ultimate',
        hpThreshold: 0.3,
        telegraphTurns: 1,
        oncePerCombat: true,
      });
      expect(pattern.passives, boss.id).toEqual(expect.any(Array));
      expect(pattern, boss.id).not.toHaveProperty('normalSkills');
      expect(actionsFor(pattern).map(action => action.name), boss.id)
        .toEqual(EXPECTED_ACTION_NAMES[boss.id]);
    }
  });

  it('gives every production action complete, unique animation and typed-effect metadata', () => {
    for (const boss of Object.values(SECRET_ENEMIES)) {
      expect(boss.bossPattern, boss.id).toBeDefined();
      if (!boss.bossPattern) continue;
      const actions = actionsFor(boss.bossPattern);
      const actionIds = actions.map(action => action.id);
      const motionKeys = actions.map(action => action.motionKey);

      expect(new Set(actionIds).size, `${boss.id} action ids`).toBe(actions.length);
      expect(new Set(motionKeys).size, `${boss.id} motion keys`).toBe(actions.length);

      for (const action of actions) {
        expect(action.id, boss.id).toEqual(expect.any(String));
        expect(['basic', 'special', 'ultimate'], `${boss.id}/${action.id}`)
          .toContain(action.category);
        expect(action.motionKey, `${boss.id}/${action.id}`).toEqual(expect.any(String));
        expect(action.impactFx, `${boss.id}/${action.id}`).toEqual(expect.any(String));
        expect(['none', 'lunge', 'advance', 'retreat'], `${boss.id}/${action.id}`)
          .toContain(action.movement);
        expect(action.effects, `${boss.id}/${action.id}`).toEqual(expect.any(Array));

        for (const effect of action.effects) {
          expect(
            SUPPORTED_EFFECT_TYPES.has(effect.type),
            `${boss.id}/${action.id}/${effect.type}`,
          ).toBe(true);
        }
      }

      for (const passive of boss.bossPattern.passives) {
        expect(
          SUPPORTED_PASSIVE_TYPES.has(passive.type),
          `${boss.id}/${passive.type}`,
        ).toBe(true);
      }
    }
  });

  it('removes combat fields superseded by bossPattern', () => {
    for (const boss of Object.values(SECRET_ENEMIES)) {
      for (const legacyField of [
        'phaseThresholds',
        'summon',
        'aoeAttack',
        'attacksPerRound',
        'specialSkills',
      ]) {
        expect(boss, `${boss.id}.${legacyField}`).not.toHaveProperty(legacyField);
      }
    }
  });

  it('uses a two-turn 50% party healing reduction without sealing food', () => {
    const action = SECRET_ENEMIES.food_warlord.bossPattern?.ultimate;

    expect(action).toBeDefined();
    if (!action) return;
    expect(action.effects).toContainEqual({
      type: 'targetStatus',
      id: 'healing_received_down',
      name: '치료 방해',
      duration: 2,
      value: 0.5,
    });
    const effectIdentifiers = action.effects.flatMap(effect => [
      effect.type,
      effect.id,
      effect.resource,
      effect.tag,
    ]).filter(Boolean);
    expect([action.id, action.motionKey, ...effectIdentifiers].join('|'))
      .not.toMatch(/food|ration|seal|lock/i);
    expect(ko['combat.status.healing_received_down.description'])
      .toBe('받는 치료와 회복 효과 50% 감소');
    expect(en['combat.status.healing_received_down.description'])
      .toBe('Healing and recovery received reduced by 50%');
  });
});
