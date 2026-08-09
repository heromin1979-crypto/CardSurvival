// @vitest-environment happy-dom
// === 헬기 탈출 두 경로 테스트 ===
// 제작(엔지니어 B3)과 발견(군인 B2)이 같은 helicopter 카드를 공유한다.
// 롯데타워에는 실제로 헬리패드가 없어 63빌딩으로 옮겼고, 롯데타워는 최형식
// B경로의 커뮤니티 거점 전용으로 정리했다.
//
// 두 경로의 '행위'가 달라야 한다. 엔지니어는 만들어서 조종하고(자력),
// 군인은 방송으로 구조기를 불러들인다(피구조). escape_helicopter는 원래
// 'KBS 방송 성공' 엔딩이었으므로 군인 전용으로 흡수했다.
import { describe, it, expect } from 'vitest';
import ENDINGS from '../../js/data/endings.js';
import { HIDDEN_LOCATIONS } from '../../js/data/hiddenLocations.js';
import LANDMARK_DATA, { getVisibleSubLocations } from '../../js/data/landmarks.js';
import { DISTRICTS } from '../../js/data/districts.js';
import { LANDMARK_CARD_META } from '../../js/data/locationCardMeta.js';
import ITEMS from '../../js/data/items.js';
import SOLDIER_B from '../../js/data/mainQuests/soldier/branch_b.js';
import ENGINEER_B from '../../js/data/mainQuests/engineer/branch_b.js';

const HELIPAD = 'hidden_yeongdeungpo_63_helipad';
const LOTTE = 'hidden_songpa_lotte_penthouse';

/** 엔딩 조건 평가용 최소 상태 */
function gs(over = {}) {
  return {
    player: { characterId: 'soldier', ...(over.player ?? {}) },
    time: { day: 200, ...(over.time ?? {}) },
    flags: { ...(over.flags ?? {}) },
  };
}

describe('63빌딩 헬리패드 — 신설 장소', () => {
  const L = () => HIDDEN_LOCATIONS[HELIPAD];

  it('여의도(영등포구)에 있다', () => {
    expect(L()).toBeDefined();
    expect(L().district).toBe('yeongdeungpo');
  });

  // 실제 지급은 lm_63_building의 sl_63_helipad firstEnterReward가 한다.
  // (아래 '63빌딩 랜드마크 — 진입 배선'에서 검증)
  it('히든 장소 자체는 진입 조건만 담당한다', () => {
    expect(L().unlockConditions.requiredItems).toContain('rope_ladder');
  });

  it('특정 직업 전용이 아니다 (장소는 공통)', () => {
    expect(L().unlockConditions.requiredCharacter).toBeNull();
  });

  it('배경 이미지 미제작이라 아이콘으로 표시된다', async () => {
    expect(L().noSceneImage).toBe(true);
    expect(L().icon).toBeTruthy();
  });
});

describe('롯데타워 — 헬기와 분리', () => {
  const L = () => HIDDEN_LOCATIONS[LOTTE];

  it('더 이상 시동 열쇠를 주지 않는다', () => {
    expect(L().rewards.map(r => r.definitionId)).not.toContain('helicopter_key');
  });

  it('설명과 발견 메시지에서 헬리콥터가 빠졌다', () => {
    expect(L().description).not.toMatch(/헬리콥터|헬기/);
    expect(L().discoveryMessage).not.toMatch(/헬리콥터|헬기/);
  });
});

describe('두 경로 — 제작과 발견', () => {
  it('엔지니어 b3_7이 실제 헬기 완성을 요구한다', () => {
    const q = ENGINEER_B.mq_eng_b3_7;
    expect(q.objective.type).toBe('collect_item');
    expect(q.objective.definitionId).toBe('helicopter');
  });

  it('군인 B경로에 헬기 탈출 분기가 있다', () => {
    const branch = Object.values(SOLDIER_B).find(q => q.isBranchPoint);
    expect(branch.branchOptions.map(o => o.setsFlag)).toContain('soldier_end_b2');
  });

  it('군인 b2는 착륙장 확보 → 유도등 점등 순으로 이어진다', () => {
    expect(SOLDIER_B.mq_soldier_end_b2_1.objective.definitionId).toBe('military_radio_kit');
    expect(SOLDIER_B.mq_soldier_end_b2.objective.definitionId).toBe('battery');
    expect(SOLDIER_B.mq_soldier_end_b2.prerequisite).toBe('mq_soldier_end_b2_1');
  });

  it('군인 경로는 헬기를 조종하지 않는다 (엔지니어와 차별)', () => {
    const objs = Object.values(SOLDIER_B).filter(q => q?.objective).map(q => q.objective.definitionId);
    expect(objs).not.toContain('helicopter');
    expect(objs).not.toContain('avgas_drum');
  });

  it('군인 b2 완료 시 전용 엔딩 플래그가 선다', () => {
    expect(SOLDIER_B.mq_soldier_end_b2.reward.flags.soldier_ending).toBe('b2_helicopter');
  });

  it('시동 열쇠 개념은 제거됐다', () => {
    expect(ITEMS.helicopter_key).toBeUndefined();
  });
});

describe('엔딩 우선순위 — 가로채기 방지', () => {
  it('escape_helicopter가 군인 전용으로 흡수됐다', () => {
    expect(ENDINGS.escape_helicopter.characterId).toBe('soldier');
  });

  it('헬기 분기에서는 기본 군인 엔딩이 발동하지 않는다', () => {
    const s = gs({ flags: { mainQuestComplete_soldier: true, soldier_ending: 'b2_helicopter' } });
    expect(ENDINGS.escape_helicopter.condition(s)).toBe(true);
    expect(ENDINGS.mq_soldier.condition(s)).toBe(false);
  });

  it('다른 분기에서는 기본 군인 엔딩이 그대로 발동한다', () => {
    const s = gs({ flags: { mainQuestComplete_soldier: true, soldier_ending: 'b1_network' } });
    expect(ENDINGS.mq_soldier.condition(s)).toBe(true);
    expect(ENDINGS.escape_helicopter.condition(s)).toBe(false);
  });

});

describe('데이터 정합성', () => {
  it('보상·루팅이 실존 아이템을 가리킨다', () => {
    const L = HIDDEN_LOCATIONS[HELIPAD];
    for (const r of [...(L.rewards ?? []), ...L.lootTable]) {
      expect(ITEMS[r.definitionId], `없는 아이템: ${r.definitionId}`).toBeDefined();
    }
  });
});

describe('63빌딩 랜드마크 — 진입 배선', () => {
  // hiddenLocations.js에 정의만 하면 "발견 대상"일 뿐이다. 실제로 들어가려면
  // landmarks.js의 어떤 랜드마크 subLocations에 requiresHiddenLocation으로
  // 매달아야 getVisibleSubLocations가 카드를 내보낸다.
  it('영등포에 63빌딩 랜드마크가 있다', () => {
    expect(LANDMARK_DATA.lm_63_building).toBeDefined();
    expect(LANDMARK_DATA.lm_63_building.districts).toContain('yeongdeungpo');
  });

  it('영등포 구가 이 랜드마크를 등록했다', () => {
    expect(DISTRICTS.yeongdeungpo.landmarks).toContain('lm_63_building');
  });

  it('랜드마크 카드 메타가 있어야 카드가 생성된다', () => {
    expect(LANDMARK_CARD_META.lm_63_building).toBeDefined();
    expect(LANDMARK_CARD_META.lm_63_building.districtId).toBe('yeongdeungpo');
  });

  it('헬리패드는 히든 장소를 발견해야 나타난다', () => {
    const hidden = getVisibleSubLocations('lm_63_building', []).map(s => s.id);
    const shown  = getVisibleSubLocations('lm_63_building', [HELIPAD]).map(s => s.id);
    expect(hidden).not.toContain('sl_63_helipad');
    expect(shown).toContain('sl_63_helipad');
  });

  it('헬리패드는 착륙 유도 장비를 준다 (헬기가 아니라)', () => {
    const pad = LANDMARK_DATA.lm_63_building.subLocations.find(s => s.id === 'sl_63_helipad');
    const ids = pad.firstEnterReward.items.map(i => i.id);
    expect(ids).toContain('military_radio_kit');
    expect(ids).not.toContain('helicopter');
  });

  it('히든 장소 쪽 보상은 비워 중복 지급을 막는다', () => {
    expect(HIDDEN_LOCATIONS[HELIPAD].rewards).toEqual([]);
  });

  it('세부장소 보상·루팅이 실존 아이템을 가리킨다', () => {
    for (const sub of LANDMARK_DATA.lm_63_building.subLocations) {
      for (const it of sub.firstEnterReward?.items ?? []) {
        expect(ITEMS[it.id], `없는 아이템: ${it.id}`).toBeDefined();
      }
      for (const l of sub.lootTable ?? []) {
        expect(ITEMS[l.id], `없는 아이템: ${l.id}`).toBeDefined();
      }
    }
  });
});
