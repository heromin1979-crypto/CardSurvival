// === PATIENT POOL — 애그리게이터 ===
// 응급실 허브 환자 페르소나 집합.
// 각 연령대 파일을 spread 병합해 단일 객체로 내보낸다.
//
// 증분 1 파일럿: 어린이 1 + 성인 1 + 노년 1 (총 3종).
// 향후 증분에서 5+15+15+5 = 40종으로 확장.
//
// 사용처:
//   - npcs.js 하단에서 NPCS에 spread 병합 (옵션 A 정적 등록)
//   - npcs.js의 NPC_ITEMS에도 PATIENT_ITEMS로 spread 병합 (보드 카드 렌더용)
//   - PatientIntakeSystem 가중치 롤
//   - validate.js 스키마 검증
//
// 스키마 상세: prompt_plan.md Phase 3

import CHILDREN from './patients/children.js';
import ADULTS   from './patients/adults.js';
import ELDERS   from './patients/elders.js';

const PATIENT_POOL = Object.freeze({
  ...CHILDREN,
  ...ADULTS,
  ...ELDERS,
});

// PATIENT_POOL에서 파생된 카드 아이템 정의.
// NPC_ITEMS에 병합되어 GameData.items를 통해 createCardInstance가 작동하도록 한다.
export const PATIENT_ITEMS = Object.freeze(Object.fromEntries(
  Object.entries(PATIENT_POOL).map(([id, def]) => {
    const genderLabel = def.gender === 'female' ? '여' : def.gender === 'male' ? '남' : '?';
    const symptoms = Array.isArray(def.visibleSymptoms) ? def.visibleSymptoms.join(', ') : '';
    return [id, {
      id,
      name: def.name ?? id,
      type: 'npc',
      rarity: 'common',
      weight: 0,
      stackable: false,
      maxStack: 1,
      defaultDurability: 100,
      defaultContamination: 0,
      icon: def.portraitIcon ?? '🤕',
      description: `${def.age}세 ${genderLabel} — ${symptoms}`,
      tags: ['npc', 'patient'],
      dismantle: [],
    }];
  })
));

export default PATIENT_POOL;
