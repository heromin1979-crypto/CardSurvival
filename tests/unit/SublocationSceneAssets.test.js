import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LANDMARK_DATA } from '../../js/data/landmarks.js';
import CardFactory from '../../js/ui/CardFactory.js';

const ROOT = process.cwd();
const TARGET_IDS = [
  'sl_jongno_royal_vault',
  'sl_yongsan_armory',
  'sl_gwangjin_zoo_lab',
  'sl_seodaemun_p4_lab',
  'sl_gwanak_reactor',
  'sl_songpa_penthouse',
  'sl_63_helipad',
  'sl_gangseo_hangar',
];

const targetSubLocations = Object.values(LANDMARK_DATA)
  .flatMap(landmark => landmark.subLocations ?? [])
  .filter(subLocation => TARGET_IDS.includes(subLocation.id));

describe('우선 서브 로케이션 장면 자산', () => {
  it('대상 id 8개가 LANDMARK_DATA의 실제 세부장소와 일치한다', () => {
    expect(targetSubLocations.map(({ id }) => id).sort()).toEqual([...TARGET_IDS].sort());
    expect(targetSubLocations).toHaveLength(8);
  });

  it.each(targetSubLocations)('$id는 아이콘 폴백 대신 장면 이미지를 사용한다', subLocation => {
    expect(subLocation.noSceneImage).not.toBe(true);
  });

  it.each(targetSubLocations)('$id 장면 파일이 명명 규칙 경로에 존재한다', ({ id }) => {
    const imagePath = path.join(ROOT, 'assets', 'images', 'sublocations', `${id}.png`);
    expect(fs.existsSync(imagePath), imagePath).toBe(true);
  });

  it('preserves a dynamic icon when a sublocation has no scene image', () => {
    const html = CardFactory._buildSubLocationInner({
      id: 'sl_dynamic_fallback',
      name: 'Dynamic fallback',
      icon: '🧭',
      noSceneImage: true,
    });

    expect(html).toContain('<span class="lc-scene-icon">🧭</span>');
    expect(html).not.toContain('ui-icon--location');
  });

  it('uses the semantic location icon only when a sublocation icon is absent', () => {
    const html = CardFactory._buildSubLocationInner({
      id: 'sl_semantic_fallback',
      name: 'Semantic fallback',
      noSceneImage: true,
    });

    expect(html).toContain('ui-icon--location');
  });
});
