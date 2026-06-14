// === LOCATION PATH (위치 브레드크럼) ===
// 플레이어의 현재 위치를 `구 › 랜드마크 › 세부장소` 계층 경로로 표현한다.
// GameState.location 의 currentDistrict / currentLandmark / currentSubLocation 를 읽어
// 존재하는 단계만 라벨로 만든다. 사이드바(Main.js)·헤더(HeaderBar.js) 공용.

import GameState from '../core/GameState.js';
import I18n      from '../core/I18n.js';
import { DISTRICTS } from '../data/districts.js';
import LANDMARK_DATA, { getLandmarkData } from '../data/landmarks.js';

// 중복 렌더 방지용 시그니처
export function locationKey() {
  const loc = GameState.location ?? {};
  return `${loc.currentDistrict ?? ''}|${loc.currentLandmark ?? ''}|${loc.currentSubLocation ?? ''}`;
}

// 구 > 랜드마크 > 세부장소 라벨 배열 (존재하는 단계만 포함)
export function locationSegments() {
  const loc  = GameState.location ?? {};
  const segs = [];

  const districtId = loc.currentDistrict;
  if (districtId) {
    const def = DISTRICTS[districtId];
    segs.push(I18n.districtName(districtId, def?.name ?? districtId));
  }

  const lmKey = loc.currentLandmark;
  if (lmKey) {
    const lmName = getLandmarkData(lmKey)?.name ?? LANDMARK_DATA[lmKey]?.name;
    if (lmName) segs.push(lmName);
  }

  const subId = loc.currentSubLocation;
  if (subId && lmKey) {
    const sub = getLandmarkData(lmKey)?.subLocations?.find(s => s.id === subId);
    if (sub?.name) segs.push(sub.name);
  }

  return segs;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 브레드크럼 HTML — `구 › 랜드마크 › 세부장소`, 마지막(현재) 단계 강조.
// 세그먼트가 하나도 없으면 빈 문자열.
export function breadcrumbHTML() {
  const segs = locationSegments();
  if (!segs.length) return '';
  return segs.map((label, i) => {
    const sep = i > 0 ? '<span class="loc-crumb-sep">›</span>' : '';
    const cls = i === segs.length - 1 ? 'loc-crumb loc-crumb--current' : 'loc-crumb';
    return `${sep}<span class="${cls}">${escapeHtml(label)}</span>`;
  }).join('');
}
