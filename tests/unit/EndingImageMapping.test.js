// @vitest-environment happy-dom
// === 엔딩 이미지 매핑 테스트 ===
// 원래 직업당 6분기(a1~a3 / b1~b3) 설계였으나 내용이 겹치거나 완성도가 낮은
// 분기를 통합·삭제했다. 그런데 endingImages.js에는 존재하지 않는 분기의
// 이미지 키가 13개 남아 "왜 이 엔딩이 없지?"라는 오해를 만들었다.
// 키는 반드시 mainQuests가 실제로 심는 <직업>_ending 값이어야 한다.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync } from 'fs';
import { ENDING_IMAGES, getEndingImage } from '../../js/data/endingImages.js';
import DOCTOR from '../../js/data/mainQuests/doctor/index.js';
import SOLDIER from '../../js/data/mainQuests/soldier/index.js';
import ENGINEER from '../../js/data/mainQuests/engineer/index.js';
import CHEF from '../../js/data/mainQuests/chef/index.js';
import FIREFIGHTER from '../../js/data/mainQuests/firefighter/index.js';
import HOMELESS from '../../js/data/mainQuests/homeless/index.js';

const QUESTS = { doctor: DOCTOR, soldier: SOLDIER, engineer: ENGINEER,
                 chef: CHEF, firefighter: FIREFIGHTER, homeless: HOMELESS };

/** 해당 직업의 퀘스트가 실제로 심는 종료 플래그 값 */
function liveFlags(characterId) {
  return new Set(Object.values(QUESTS[characterId])
    .map(q => {
      const f = q?.reward?.flags ?? {};
      const k = Object.keys(f).find(x => x.endsWith('_ending'));
      return k ? f[k] : null;
    })
    .filter(Boolean));
}

const CHARS = Object.keys(QUESTS);

describe('고아 키가 없다', () => {
  it.each(CHARS)('%s 의 이미지 키가 전부 실제 분기다', (c) => {
    const live = liveFlags(c);
    const orphans = Object.keys(ENDING_IMAGES[c] ?? {}).filter(k => !live.has(k));
    expect(orphans, `삭제된 분기의 키: ${orphans.join(', ')}`).toEqual([]);
  });
});

describe('매핑된 이미지 파일이 실재한다', () => {
  it.each(CHARS)('%s', (c) => {
    for (const [k, v] of Object.entries(ENDING_IMAGES[c] ?? {})) {
      expect(v?.src, `${c}.${k}: src 없음`).toBeTruthy();
      expect(existsSync(v.src), `${c}.${k}: 파일 없음 ${v.src}`).toBe(true);
      expect(v.alt, `${c}.${k}: alt 없음`).toBeTruthy();
    }
  });
});

describe('접어둔 아트는 코드가 참조하지 않는다', () => {
  const UNUSED_DIR = 'assets/endings/_unused';

  it('_unused 디렉터리가 비어 있지 않다', () => {
    expect(readdirSync(UNUSED_DIR).length).toBeGreaterThan(0);
  });

  it('_unused 경로를 가리키는 매핑이 없다', () => {
    const srcs = CHARS.flatMap(c => Object.values(ENDING_IMAGES[c] ?? {}).map(v => v?.src));
    expect(srcs.filter(s => s?.includes('_unused'))).toEqual([]);
  });
});

describe('아트 대기 목록', () => {
  it('이미지가 없는 분기가 늘어나지 않는다', () => {
    // 접기 대상이 아니라 신규 아트가 필요한 분기다. 채우면 이 목록을 줄인다.
    const pending = CHARS.flatMap(c =>
      [...liveFlags(c)].filter(f => !getEndingImage(c, f)).map(f => `${c}.${f}`));
    expect(pending.sort()).toEqual(['doctor.c_vaccine', 'soldier.b2_helicopter']);
  });
});

describe('별칭은 살아 있는 분기만 가리킨다', () => {
  it('한 이미지를 두 분기가 공유하는 경우가 유효하다', () => {
    // engineer b3_heli_escape → b3_late_escape 아트,
    // homeless b3_network → b3_wanderer 아트. 원본 키는 접었지만 파일은 쓴다.
    expect(getEndingImage('engineer', 'b3_heli_escape')?.src)
      .toBe('assets/endings/engineer_b3_late_escape.png');
    expect(getEndingImage('homeless', 'b3_network')?.src)
      .toBe('assets/endings/homeless_b3_wanderer.png');
  });

  it('접은 키로는 더 이상 조회되지 않는다', () => {
    for (const [c, k] of [['engineer','b3_late_escape'], ['homeless','b3_wanderer'],
                          ['soldier','a2_defend'], ['doctor','b2_frontline']]) {
      expect(getEndingImage(c, k), `${c}.${k}가 아직 조회된다`).toBeNull();
    }
  });
});
