import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { LANDMARK_DATA } from '../../js/data/landmarks.js';

const ROOT = process.cwd();
const TARGET_IDS = [
  'sl_junggoo_cold_storage',
  'sl_junggoo_hotel_pantry',
  'sl_junggoo_city_hall_safe',
  'sl_seongdong_master_workshop',
  'sl_seongdong_bridge_shelter',
  'sl_dongdaemun_workshop',
  'sl_jungrang_water_control',
  'sl_seongbuk_research_bunker',
  'sl_gangbuk_hidden_spring',
  'sl_dobong_hermit_cave',
  'sl_nowon_hidden_depot',
  'sl_eunpyeong_fire_station',
  'sl_mapo_club_basement',
  'sl_yangcheon_civil_shelter',
  'sl_guro_secret_forge',
  'sl_geumcheon_secret_factory',
];

const SOUTHERN_LANDMARK_TARGET_IDS = [
  'sl_yeongdeungpo_kbs_studio',
  'sl_63_lobby',
  'sl_63_observatory',
  'dongjak_bunker',
  'sl_seocho_evidence_vault',
  'sl_gangnam_sealed_pharmacy',
  'sl_songpa_survivor_fort',
  'sl_gangdong_secret_dock',
];

const targetSubLocations = Object.values(LANDMARK_DATA)
  .flatMap(landmark => landmark.subLocations ?? [])
  .filter(subLocation => TARGET_IDS.includes(subLocation.id));

const southernLandmarkSubLocations = Object.values(LANDMARK_DATA)
  .flatMap(landmark => landmark.subLocations ?? [])
  .filter(subLocation => SOUTHERN_LANDMARK_TARGET_IDS.includes(subLocation.id));

describe('남은 중심·동부·북부·서부 숨김 서브 로케이션 장면 자산', () => {
  it('대상 id 16개가 LANDMARK_DATA의 실제 세부장소와 일치한다', () => {
    expect(TARGET_IDS).toHaveLength(16);
    expect(targetSubLocations.map(({ id }) => id).sort()).toEqual([...TARGET_IDS].sort());
    expect(targetSubLocations).toHaveLength(16);
  });

  it.each(targetSubLocations)('$id는 아이콘 폴백 대신 장면 이미지를 사용한다', subLocation => {
    expect(subLocation.noSceneImage).not.toBe(true);
  });

  it.each(targetSubLocations)('$id 장면 파일이 명명 규칙 경로에 존재한다', ({ id }) => {
    const imagePath = path.join(ROOT, 'assets', 'images', 'sublocations', `${id}.png`);
    expect(fs.existsSync(imagePath), imagePath).toBe(true);
  });
});

describe('남부·랜드마크 서브 로케이션 장면 자산', () => {
  it('대상 id 8개가 LANDMARK_DATA의 실제 세부장소와 일치한다', () => {
    expect(SOUTHERN_LANDMARK_TARGET_IDS).toHaveLength(8);
    expect(southernLandmarkSubLocations.map(({ id }) => id).sort())
      .toEqual([...SOUTHERN_LANDMARK_TARGET_IDS].sort());
    expect(southernLandmarkSubLocations).toHaveLength(8);
  });

  it.each(southernLandmarkSubLocations)('$id는 아이콘 폴백 대신 장면 이미지를 사용한다', subLocation => {
    expect(subLocation.noSceneImage).not.toBe(true);
  });

  it.each(southernLandmarkSubLocations)('$id 장면 파일이 명명 규칙 경로에 존재한다', ({ id }) => {
    const imagePath = path.join(ROOT, 'assets', 'images', 'sublocations', `${id}.png`);
    expect(fs.existsSync(imagePath), imagePath).toBe(true);
  });
});
