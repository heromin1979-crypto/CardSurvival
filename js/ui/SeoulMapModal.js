// === SEOUL DISTRICT MAP MODAL ===
// Data-driven district intelligence map. Movement and route planning remain in
// the existing exploration flow; this modal only exposes map reading.
import GameState     from '../core/GameState.js';
import EventBus      from '../core/EventBus.js';
import I18n          from '../core/I18n.js';
import GameData      from '../data/GameData.js';
import { DISTRICTS } from '../data/districts.js';
import MAIN_QUESTS   from '../data/mainQuests/index.js';

const DEV_FORCE_MAP_UNLOCK = true;
const MAP_CONCEPT_IMAGE = '/assets/images/ui/minimap-map/seoul-blueprint-map-final00-clean.png';
const MINIMAP_CONCEPT_IMAGE = '/assets/images/ui/minimap-map/seoul-blueprint-minimap-ui-clean.png';
const MAP_ICON_IMAGES = {
  current: '/assets/images/ui/minimap-icons/current-position.png',
  hazard: '/assets/images/ui/minimap-icons/hazard-zone.png',
  landmark: '/assets/images/ui/minimap-icons/landmark.png',
  shelter: '/assets/images/ui/minimap-icons/shelter.png',
  food: '/assets/images/ui/minimap-icons/food.png',
  herbs: '/assets/images/ui/minimap-icons/herbs.png',
  medical: '/assets/images/ui/minimap-icons/medical.png',
  parts: '/assets/images/ui/minimap-icons/parts.png',
  ammo: '/assets/images/ui/minimap-icons/ammo.png',
  secureStorage: '/assets/images/ui/minimap-icons/secure-storage.png',
};

const MAP_LANDMARK_ICON_IDS = [
  'lm_gangnam', 'lm_gangdong', 'lm_gangbuk', 'lm_gangseo', 'lm_gwanak',
  'lm_gwangjin', 'lm_guro', 'lm_geumcheon', 'lm_nowon', 'lm_dobong',
  'lm_dongdaemun', 'lm_boramae_hospital', 'lm_mapo', 'lm_seodaemun',
  'lm_seocho', 'lm_seongdong', 'lm_seongbuk', 'lm_songpa', 'lm_yangcheon',
  'lm_yeongdeungpo', 'lm_yongsan', 'lm_eunpyeong', 'lm_jongno', 'lm_junggoo',
  'lm_jungrang',
];

const MAP_LANDMARK_ICON_IMAGES = Object.fromEntries(
  MAP_LANDMARK_ICON_IDS.map(id => [id, `/assets/images/ui/minimap-landmarks/${id}.svg`])
);

const MAP_W = 1024;
const MAP_H = 580;
const MAP_COORD_H = 708;

const MAP_DISTRICTS = [
  { id: 'eunpyeong',    grid: 'C4', points: [[205,190],[245,138],[350,116],[425,182],[405,272],[330,318],[230,284]], label: [300,236] },
  { id: 'gangbuk',      grid: 'F4', points: [[425,182],[500,108],[584,158],[560,254],[500,338],[405,272]], label: [493,238] },
  { id: 'dobong',       grid: 'G2', points: [[500,108],[528,34],[620,34],[668,112],[614,204],[584,158]], label: [584,116] },
  { id: 'nowon',        grid: 'I3', points: [[668,112],[736,70],[842,128],[860,246],[770,318],[614,204]], label: [748,184] },
  { id: 'seodaemun',    grid: 'D6', points: [[330,318],[405,272],[500,338],[468,420],[374,432],[292,372]], label: [386,370] },
  { id: 'jongno',       grid: 'F6', points: [[500,338],[560,254],[642,316],[638,408],[548,444],[468,420]], label: [548,382] },
  { id: 'seongbuk',     grid: 'H5', points: [[560,254],[614,204],[770,318],[710,410],[638,408],[642,316]], label: [642,326] },
  { id: 'jungrang',     grid: 'K6', points: [[770,318],[860,246],[934,314],[914,438],[810,458],[710,410]], label: [818,372] },
  { id: 'mapo',         grid: 'D7', points: [[208,406],[292,372],[374,432],[454,484],[418,520],[302,520],[210,488]], label: [314,460] },
  { id: 'junggoo',      grid: 'F7', points: [[468,420],[548,444],[638,408],[628,488],[560,540],[454,484]], label: [548,484] },
  { id: 'dongdaemun',   grid: 'I7', points: [[638,408],[710,410],[810,458],[760,548],[628,488]], label: [704,470] },
  { id: 'gangseo',      grid: 'A8', points: [[22,370],[138,430],[210,488],[178,594],[82,640],[6,590],[4,500]], label: [104,520] },
  { id: 'yangcheon',    grid: 'C9', points: [[178,594],[302,560],[344,648],[278,724],[142,680]], label: [240,640] },
  { id: 'yeongdeungpo', grid: 'D9', points: [[302,590],[430,606],[472,675],[402,740],[344,680]], label: [392,660] },
  { id: 'yongsan',      grid: 'F8', points: [[454,440],[560,470],[552,535],[470,558],[402,510]], label: [490,500] },
  { id: 'seongdong',    grid: 'I8', points: [[628,488],[760,548],[734,632],[626,642],[560,540]], label: [660,570] },
  { id: 'gwangjin',     grid: 'K8', points: [[760,548],[810,458],[914,438],[930,558],[850,636],[734,632]], label: [828,548] },
  { id: 'gangdong',     grid: 'M8', points: [[914,438],[980,394],[980,560],[930,620],[850,636],[930,558]], label: [930,536] },
  { id: 'guro',         grid: 'C11', points: [[142,680],[278,724],[360,760],[320,872],[196,842],[100,758]], label: [238,772] },
  { id: 'dongjak',      grid: 'F10', points: [[402,680],[470,610],[552,588],[592,696],[510,756],[416,742]], label: [500,690] },
  { id: 'seocho',       grid: 'H10', points: [[552,588],[626,612],[734,612],[760,720],[642,802],[592,696]], label: [660,690] },
  { id: 'gangnam',      grid: 'J10', points: [[734,612],[850,616],[898,724],[824,812],[760,720]], label: [808,690] },
  { id: 'songpa',       grid: 'K10', points: [[850,616],[930,604],[980,680],[956,790],[824,812],[898,724]], label: [912,705] },
  { id: 'geumcheon',    grid: 'D13', points: [[320,812],[360,740],[416,762],[472,818],[418,858]], label: [390,790] },
  { id: 'gwanak',       grid: 'F12', points: [[416,742],[510,756],[592,696],[642,782],[570,845],[472,818]], label: [536,790] },
];

const RIVER_PATH = 'M0 432 C92 432 178 464 262 520 C340 570 430 610 496 622 C548 630 590 606 638 560 C698 505 774 512 848 472 C910 438 942 398 980 384 L980 438 C938 462 902 520 846 552 C770 594 702 584 642 612 C568 654 500 654 418 624 C328 590 278 548 214 520 C138 488 70 482 0 488 Z';
const ROAD_PATHS = [
  'M68 486 C214 430 372 428 540 456 C700 482 826 440 956 376',
  'M166 210 C310 246 420 292 540 384 C640 462 704 548 764 690',
  'M306 116 C380 238 392 372 374 558 C360 664 316 732 250 806',
  'M618 52 C648 176 650 322 620 462 C594 586 602 686 646 804',
  'M792 142 C760 280 750 414 800 538 C840 640 882 690 942 724',
];

const BRIDGES = [
  { name: '양화대교', from: [242, 500], to: [286, 560] },
  { name: '마포대교', from: [374, 520], to: [402, 600] },
  { name: '한강대교', from: [476, 548], to: [470, 630] },
  { name: '동작대교', from: [570, 548], to: [586, 630] },
  { name: '성수대교', from: [686, 520], to: [712, 596] },
  { name: '잠실대교', from: [846, 480], to: [872, 560] },
];

const DRAWN_MAP_DISTRICTS = [
  { id: 'gangseo',      grid: 'A6',  points: [[0,285],[88,315],[152,360],[122,438],[42,472],[0,430]], label: [88,382] },
  { id: 'yangcheon',    grid: 'C8',  points: [[58,455],[130,432],[205,468],[188,542],[108,560],[42,505]], label: [126,500] },
  { id: 'guro',         grid: 'C10', points: [[108,560],[188,542],[285,578],[270,650],[150,640],[70,590]], label: [178,595] },
  { id: 'geumcheon',    grid: 'D11', points: [[270,650],[285,578],[335,598],[374,668],[322,698]], label: [318,645] },
  { id: 'yeongdeungpo', grid: 'D7',  points: [[100,348],[196,350],[270,390],[248,458],[160,492],[105,432]], label: [185,410] },
  { id: 'mapo',         grid: 'D5',  points: [[190,250],[300,222],[390,280],[368,348],[284,382],[195,350]], label: [282,314] },
  { id: 'seodaemun',    grid: 'E4',  points: [[300,222],[380,190],[455,236],[430,320],[368,348],[390,280]], label: [383,270] },
  { id: 'eunpyeong',    grid: 'D3',  points: [[210,136],[325,94],[438,130],[425,220],[365,270],[240,250]], label: [320,204] },
  { id: 'dobong',       grid: 'H1',  points: [[520,30],[640,38],[675,114],[600,144],[520,95]], label: [585,86] },
  { id: 'gangbuk',      grid: 'G3',  points: [[438,130],[520,95],[600,144],[578,236],[500,275],[425,220]], label: [512,204] },
  { id: 'nowon',        grid: 'J2',  points: [[675,114],[750,92],[842,140],[846,240],[735,268],[600,144]], label: [752,174] },
  { id: 'jongno',       grid: 'G5',  points: [[455,236],[535,212],[612,268],[578,348],[462,336],[430,320]], label: [512,298] },
  { id: 'seongbuk',     grid: 'I4',  points: [[578,236],[600,144],[735,268],[700,338],[612,356],[578,348]], label: [652,286] },
  { id: 'jungrang',     grid: 'K5',  points: [[735,268],[846,240],[940,320],[904,420],[780,400],[700,338]], label: [820,330] },
  { id: 'junggoo',      grid: 'G6',  points: [[462,336],[578,348],[606,392],[548,430],[466,405]], label: [528,374] },
  { id: 'yongsan',      grid: 'G7',  points: [[368,348],[466,405],[548,430],[606,392],[590,470],[488,502],[374,466],[318,402]], label: [474,430] },
  { id: 'dongdaemun',   grid: 'I6',  points: [[612,356],[700,338],[780,400],[724,470],[606,392],[578,348]], label: [674,400] },
  { id: 'seongdong',    grid: 'I7',  points: [[606,392],[724,470],[690,526],[590,500],[548,430]], label: [635,458] },
  { id: 'gwangjin',     grid: 'K7',  points: [[724,470],[780,400],[904,420],[878,510],[790,545],[690,526]], label: [800,472] },
  { id: 'gangdong',     grid: 'M6',  points: [[904,420],[940,320],[1024,318],[1024,500],[950,535],[878,510]], label: [954,435] },
  { id: 'dongjak',      grid: 'F8',  points: [[318,402],[374,466],[488,502],[450,574],[330,570],[248,458]], label: [360,504] },
  { id: 'gwanak',       grid: 'F10', points: [[330,570],[450,574],[556,628],[504,694],[365,688],[270,650]], label: [420,620] },
  { id: 'seocho',       grid: 'H9',  points: [[488,502],[590,500],[690,526],[720,620],[556,628],[450,574]], label: [592,575] },
  { id: 'gangnam',      grid: 'J9',  points: [[690,526],[790,545],[878,510],[910,600],[820,670],[720,620]], label: [805,585] },
  { id: 'songpa',       grid: 'L9',  points: [[878,510],[950,535],[1024,500],[1024,635],[930,690],[820,670],[910,600]], label: [930,610] },
];

const DRAWN_RIVER_PATH = 'M0 330 C75 350 135 380 210 365 C270 350 300 410 366 426 C470 454 515 500 604 458 C666 424 704 372 786 394 C858 418 914 360 1024 338 L1024 397 C920 420 854 462 770 436 C704 416 660 466 598 502 C504 556 420 498 350 466 C284 432 254 396 202 405 C132 420 78 380 0 360 Z';
const DRAWN_ROAD_PATHS = [
  'M22 350 C178 310 320 304 466 336 C610 366 770 348 1010 310',
  'M220 120 C330 188 430 264 528 374 C640 500 728 572 900 638',
  'M355 90 C388 198 402 318 374 466 C350 560 310 620 250 676',
  'M620 42 C638 160 635 282 606 392 C584 482 594 578 642 676',
  'M822 140 C786 270 780 386 812 520 C842 610 888 650 978 680',
];
const DRAWN_BRIDGES = [
  { name: '양화대교', from: [196, 350], to: [246, 458] },
  { name: '마포대교', from: [318, 402], to: [374, 466] },
  { name: '한강대교', from: [466, 405], to: [488, 502] },
  { name: '동작대교', from: [548, 430], to: [590, 500] },
  { name: '성수대교', from: [606, 392], to: [690, 526] },
  { name: '잠실대교', from: [780, 400], to: [878, 510] },
];

const RESOURCE_GROUPS = [
  { id: 'food',     label: '식량',   short: 'FOOD', icon: 'F', terms: ['food','water','berry','meat','fish','rice','vegetable','mushroom','ration','noodles','grain','bread','honey','root','acorn','chestnut','apple'] },
  { id: 'medical',  label: '의료',   short: 'MED',  icon: '+', terms: ['bandage','medicine','painkiller','antiseptic','antibiotic','kit','vitamin','vaccine','rad_','antidote','herb','nettle'] },
  { id: 'fuel',     label: '연료',   short: 'FUEL', icon: 'D', terms: ['fuel','oil','gas','battery','firestone','matches'] },
  { id: 'material', label: '부품',   short: 'PART', icon: 'G', terms: ['scrap','metal','wood','cloth','rope','wire','nail','plastic','rubber','leather','glass','brick','concrete','steel','parts','circuit'] },
  { id: 'weapon',   label: '탄약',   short: 'AMMO', icon: 'A', terms: ['pistol','ammo','knife','bat','pipe','machete','molotov','bomb','rifle','shotgun','spear'] },
];

const STATUS_META = {
  safe: {
    label: '안전 구역',
    short: 'SAFE',
    color: '#60b060',
    fill: 'rgba(64,120,82,0.22)',
    stroke: '#75a878',
  },
  contaminated: {
    label: '오염 구역',
    short: 'CONTAM',
    color: '#e05050',
    fill: 'rgba(190,55,55,0.34)',
    stroke: '#e05050',
  },
  danger: {
    label: '위험 구역',
    short: 'DANGER',
    color: '#e0a030',
    fill: 'rgba(190,96,48,0.20)',
    stroke: '#c88450',
  },
  unstable: {
    label: '주의 구역',
    short: 'WATCH',
    color: '#5090c0',
    fill: 'rgba(58,92,112,0.20)',
    stroke: '#6e93a8',
  },
};

const LAYERS = [
  ['current', '현재 위치', 'CURRENT LOCATION'],
  ['safe', '안전 구역', 'SAFE ZONE'],
  ['danger', '위험 구역', 'DANGER ZONE'],
  ['contam', '오염/방사선', 'CONTAMINATED'],
  ['resources', '자원', 'RESOURCES'],
  ['landmark', '랜드마크', 'LANDMARKS'],
  ['enemy', '적 활동', 'ENEMIES'],
  ['weather', '날씨 영향', 'WEATHER'],
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pointsToString(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function scalePoints(points, sx, sy) {
  return points.map(([x, y]) => [Math.round(x * sx), Math.round(y * sy)]);
}

const SeoulMapModal = {
  _overlay: null,
  _selectedDistrictId: null,

  init() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action="open-seoul-map"]')) this.open();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._overlay) this._close();
    });

    const refresh = () => {
      this.renderMinimap();
      if (this._overlay) this._refreshOpenModal();
    };

    EventBus.on('locationChanged', refresh);
    EventBus.on('districtChanged', refresh);
    EventBus.on('boardChanged', refresh);
    EventBus.on('mainQuestActivated', refresh);
    EventBus.on('mainQuestCompleted', refresh);
  },

  open() {
    if (!this._isMapUnlocked()) {
      const n = GameState.flags.mapFragments?.length ?? 0;
      EventBus.emit('notify', {
        message: `지도 조각 ${n}/3 수집 필요`,
        type: 'warn',
      });
      return;
    }

    this._close();
    this._selectedDistrictId = GameState.location.currentDistrict ?? 'mapo';

    const overlay = document.createElement('div');
    overlay.className = 'seoul-map-overlay';
    overlay.id = 'seoul-map-overlay';
    overlay.innerHTML = `
      <div class="seoul-map-modal seoul-map-modal--ops">
        <div class="seoul-map-content">
          ${this._buildModalContent()}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this._overlay = overlay;

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.closest('[data-map-close]')) this._close();
      const districtButton = e.target.closest('[data-map-district]');
      if (districtButton) {
        this._selectedDistrictId = districtButton.dataset.mapDistrict;
        this._refreshOpenModal();
      }
    });
  },

  _close() {
    this._overlay?.remove();
    this._overlay = null;
  },

  _refreshOpenModal() {
    if (!this._overlay) return;
    const mount = this._overlay.querySelector('.seoul-map-content');
    if (mount) mount.innerHTML = this._buildModalContent();
  },

  renderMinimap() {
    const el = document.getElementById('minimap-preview');
    if (!el) return;

    const parent = el.closest('.bc-minimap');
    if (!this._isMapUnlocked()) {
      const n = GameState.flags.mapFragments?.length ?? 0;
      el.innerHTML = `
        <div class="minimap-locked-placeholder">
          <div class="minimap-lock-icon">MAP</div>
          <div class="minimap-lock-frags">${n} / 3</div>
          <div class="minimap-lock-hint">지도 조각 필요</div>
        </div>
      `;
      parent?.classList.add('bc-minimap--locked');
      return;
    }

    parent?.classList.remove('bc-minimap--locked');
    const currentId = GameState.location.currentDistrict ?? 'mapo';
    el.innerHTML = `
      <div class="minimap-ops-shell" style="--map-concept-image:url('${MINIMAP_CONCEPT_IMAGE}')">
        ${this._buildMapSVG({
          currentId,
          selectedId: currentId,
          compact: true,
          interactive: false,
        })}
      </div>
    `;
    const svg = el.querySelector('svg');
    if (svg) svg.style.pointerEvents = 'none';
  },

  _isMapUnlocked() {
    return GameState.flags.mapUnlocked || DEV_FORCE_MAP_UNLOCK;
  },

  _buildModalContent() {
    const currentId = GameState.location.currentDistrict ?? 'mapo';
    const selectedId = this._selectedDistrictId ?? currentId;
    const selectedIntel = this._getDistrictIntel(selectedId);
    const currentIntel = this._getDistrictIntel(currentId);
    const stats = this._getMapStats();

    return `
      <div class="seoul-map-header seoul-map-header--ops">
        <div class="sm-title-block">
          <div class="seoul-map-title">구역 지도 / DISTRICT MAP</div>
          <div class="seoul-map-kicker">서울 폐허 구역 / SEOUL, RUINED DISTRICT</div>
        </div>
        <div class="sm-top-field">
          <span>현재 위치 / CURRENT</span>
          <b>${this._escapeHtml(currentIntel.name)}</b>
        </div>
        <div class="sm-top-field">
          <span>대상 / TARGET</span>
          <b>${this._escapeHtml(selectedIntel.name)}</b>
        </div>
        <div class="sm-top-field">
          <span>상태 / STATUS</span>
          <b>${this._mapStatusText(stats)}</b>
        </div>
        <div class="sm-top-clock">${this._buildStatusChips(stats)}</div>
        <button class="seoul-map-close" id="btn-close-seoulmap" type="button" data-map-close>×</button>
      </div>

      <div class="seoul-map-shell">
        <aside class="sm-dossier">
          ${this._buildDistrictDossier(selectedIntel)}
        </aside>

        <section class="seoul-map-body seoul-map-body--ops">
          <div class="seoul-map-stage" style="--map-concept-image:url('${MAP_CONCEPT_IMAGE}')">
            ${this._buildMapSVG({
              currentId,
              selectedId,
              compact: false,
              interactive: true,
            })}
          </div>
        </section>
      </div>

    `;
  },

  _buildStatusChips(stats) {
    const day = GameState.time?.day ?? 1;
    const clock = this._formatClock();
    const temp = Math.round(GameState.stats?.temperature?.current ?? 50);
    const weather = GameState.weather ?? {};
    const enc = GameState.player?.encumbrance ?? {};
    const hydration = this._statPct('hydration');
    const nutrition = this._statPct('nutrition');
    const morale = this._statPct('morale');

    return `
      <span class="sm-day">Day ${day}</span>
      <span>${clock}</span>
      <span>${temp}°C</span>
      <span>${this._escapeHtml(weather.name ?? '맑음')}</span>
      <span>방문 ${stats.visited}/${stats.total}</span>
      <span>가방 ${Math.round(enc.current ?? 0)}/${Math.round(enc.max ?? 0)}</span>
      <span>수분 ${hydration}%</span>
      <span>영양 ${nutrition}%</span>
      <span>사기 ${morale}%</span>
    `;
  },

  _buildLayerList(stats) {
    const counts = {
      current: 1,
      safe: stats.safe,
      danger: stats.danger,
      contam: stats.contaminated,
      resources: stats.resourceDistricts,
      landmark: stats.landmarks,
      enemy: stats.enemyHotspots,
      weather: stats.weatherImpacted,
    };

    return LAYERS.map(([kind, label, en]) => `
      <div class="sm-layer-row sm-layer-row--${kind}">
        <span class="sm-layer-symbol"></span>
        <span><b>${label}</b><em>${en}</em></span>
        <i>${counts[kind] ?? 0}</i>
        <mark>✓</mark>
      </div>
    `).join('');
  },

  _buildDistrictDossier(intel) {
    const status = STATUS_META[intel.status];
    const riskBars = Array.from({ length: 10 }, (_, i) => (
      `<i class="${i < Math.ceil(intel.dangerLevel * 2) ? 'is-on' : ''}"></i>`
    )).join('');
    const searchBars = Array.from({ length: 5 }, (_, i) => (
      `<i class="${i < Math.ceil(intel.encounterPct / 8) ? 'is-on' : ''}"></i>`
    )).join('');
    const resources = RESOURCE_GROUPS.map(group => {
      const res = intel.resources.find(r => r.id === group.id);
      const dots = Array.from({ length: 4 }, (_, i) => `<i class="${res && i < clamp(Math.ceil(res.score / 20), 1, 4) ? 'is-on' : ''}"></i>`).join('');
      return `
        <div class="sm-key-resource ${res ? '' : 'is-empty'}">
          <em>${group.label}</em>
          <b>${dots}</b>
        </div>
      `;
    }).join('');
    const resourceItems = intel.resourceItems.length
      ? intel.resourceItems.map(item => `<li><span></span>${this._escapeHtml(item.name)}<b>${item.weight}</b></li>`).join('')
      : '<li><span>-</span>확인된 주요 물자 없음<b>0</b></li>';

    return `
      <div class="sm-dossier-label">선택 구역 정보 / DISTRICT INFO</div>
      <div class="sm-dossier-name">
        <strong>${this._escapeHtml(intel.name)}</strong>
        <small>${this._romanizeDistrict(intel.id)}</small>
      </div>
      <div class="sm-dossier-image"></div>
      <div class="sm-dossier-gridref">GRID ${intel.grid} · ${intel.visited ? '방문 완료' : '미방문'}</div>

      <div class="sm-info-row">
        <span>위험도 / RISK LEVEL</span>
        <div class="sm-risk-bars">${riskBars}</div>
        <b style="color:${status.color}">${status.short}</b>
      </div>
      <div class="sm-info-row sm-info-row--exploration">
        <span>탐사도 / EXPLORATION</span>
        <div class="sm-exploration-gauge" style="--exploration:${clamp(intel.exploration, 0, 100)}%">
          <i></i>
        </div>
        <b>${intel.exploration}%</b>
      </div>
      <div class="sm-info-row">
        <span>오염/방사선 / CONTAM</span>
        <b>${intel.contaminationScore}% / ${intel.radiation}</b>
      </div>
      <div class="sm-info-row">
        <span>수색 난이도 / SEARCH</span>
        <div class="sm-dot-bars">${searchBars}</div>
        <b>${intel.encounterPct}%</b>
      </div>

      <div class="sm-dossier-section">
        <div class="sm-dossier-label">주요 자원 / KEY RESOURCES</div>
        <div class="sm-key-resource-grid">${resources}</div>
      </div>

      <div class="sm-dossier-section">
        <div class="sm-dossier-label">자원 정보 / RESOURCE INTEL</div>
        <ul class="sm-resource-intel-list">${resourceItems}</ul>
      </div>

      <div class="sm-dossier-section">
        <div class="sm-dossier-label">적 활동 / ENEMY ACTIVITY</div>
        <div class="sm-enemy-line"><span>감염자 다수</span><b>${intel.dangerLevel >= 4 ? '높음 / HIGH' : '보통 / MEDIUM'}</b></div>
        <div class="sm-enemy-line"><span>조우 위험</span><b>${intel.encounterPct}%</b></div>
      </div>
    `;
  },

  _buildMapSVG({ currentId, selectedId, compact, interactive }) {
    const sx = compact ? 0.78 : 1;
    const sy = (compact ? 0.60 : 1) * (MAP_H / MAP_COORD_H);
    const w = Math.round(MAP_W * sx);
    const h = Math.round(MAP_H * (compact ? 0.60 : 1));
    const visitedSet = new Set(GameState.location.districtsVisited ?? []);
    const districtPolygons = [];
    const districtAnnotations = [];

    DRAWN_MAP_DISTRICTS.forEach(shape => {
      const intel = this._getDistrictIntel(shape.id);
      const status = STATUS_META[intel.status];
      const isCurrent = shape.id === currentId;
      const isSelected = shape.id === selectedId;
      const isVisited = visitedSet.has(shape.id);
      const [lx, ly] = [Math.round(shape.label[0] * sx), Math.round(shape.label[1] * sy)];
      const polygon = pointsToString(scalePoints(shape.points, sx, sy));
      const opacity = compact || isVisited || isCurrent || intel.status !== 'unstable' ? 1 : 0.62;
      const resourceTitle = intel.resources.length
        ? intel.resources.map(r => `${r.label} ${r.score}`).join(', ')
        : '자원 정보 없음';
      const label = compact ? '' : `
        <text x="${lx}" y="${ly - 2}" class="sm-map-label" text-anchor="middle">${this._escapeXml(intel.name)}</text>
        <text x="${lx}" y="${ly + 12}" class="sm-map-label-en" text-anchor="middle">${this._romanizeDistrict(intel.id)}</text>
        <title>${this._escapeXml(`${intel.name} / 자원: ${resourceTitle} / 랜드마크: ${intel.landmarkNames.join(', ') || '없음'} / 탐사도 ${intel.exploration}%`)}</title>
      `;
      const hit = interactive ? `data-map-district="${shape.id}"` : '';

      districtPolygons.push(`
        <g class="sm-map-district sm-map-district--${intel.status} ${isCurrent ? 'is-current' : ''} ${isSelected ? 'is-selected' : ''}" opacity="${opacity}">
          <polygon ${hit} points="${polygon}" fill="${status.fill}" stroke="${isSelected ? '#d4c9a8' : status.stroke}" stroke-width="${isCurrent || isSelected ? 2.4 : 1.15}" class="sm-district-hit">
            <title>${this._escapeXml(`${intel.name} / 자원: ${resourceTitle} / 랜드마크: ${intel.landmarkNames.join(', ') || '없음'} / 탐사도 ${intel.exploration}%`)}</title>
          </polygon>
        </g>
      `);

      districtAnnotations.push(`
        <g class="sm-map-annotation sm-map-annotation--${intel.status} ${isCurrent ? 'is-current' : ''} ${isSelected ? 'is-selected' : ''}">
          ${label}
        </g>
      `);
    });

    const districts = districtPolygons.join('');
    const annotations = districtAnnotations.join('');

    const gridRows = compact ? '' : Array.from({ length: 12 }, (_, i) => {
      const y = 42 + i * 34;
      return `<text x="16" y="${y}" class="sm-grid-label">${String.fromCharCode(65 + i)}</text>`;
    }).join('');
    const gridCols = compact ? '' : Array.from({ length: 14 }, (_, i) => {
      const x = 42 + i * 64;
      return `<text x="${x}" y="${h - 13}" class="sm-grid-label">${i + 1}</text>`;
    }).join('');

    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="seoul-map-svg seoul-map-svg--ops seoul-map-svg--drawn-seoul">
        <defs>
          <pattern id="smGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M32 0H0V32" fill="none" stroke="rgba(80,144,192,0.14)" stroke-width="0.8"/>
          </pattern>
          <filter id="smGlow"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" class="sm-map-bg"/>
        <rect x="0" y="0" width="${w}" height="${h}" fill="url(#smGrid)" class="sm-grid-overlay" opacity="${compact ? 0.22 : 0.10}"/>
        <g>${districts}</g>
        <g class="sm-annotation-layer">${annotations}</g>
        <rect x="10" y="10" width="${compact ? 104 : 154}" height="${compact ? 34 : 72}" class="sm-map-data-box"/>
        ${compact ? '' : `<text x="28" y="34" class="sm-map-data-title">지도 데이터 / MAP DATA</text><text x="28" y="54" class="sm-map-data-copy">SEOUL EMERGENCY HQ</text><text x="28" y="70" class="sm-map-data-copy">v2.7.14</text>`}
        ${gridRows}
        ${gridCols}
      </svg>
    `;
  },

  _getMapStats() {
    const stats = {
      total: 0,
      visited: new Set(GameState.location.districtsVisited ?? []).size,
      contaminated: 0,
      safe: 0,
      danger: 0,
      landmarks: 0,
      enemyHotspots: 0,
      weatherImpacted: 0,
      resourceDistricts: 0,
      resources: Object.fromEntries(RESOURCE_GROUPS.map(group => [group.id, 0])),
    };

    for (const id of Object.keys(DISTRICTS)) {
      const intel = this._getDistrictIntel(id);
      stats.total += 1;
      if (intel.status === 'contaminated') stats.contaminated += 1;
      if (intel.status === 'safe') stats.safe += 1;
      if (intel.status === 'danger') stats.danger += 1;
      if (intel.encounterPct >= 15 || intel.dangerLevel >= 4) stats.enemyHotspots += 1;
      if (intel.radiation > 0 || intel.contaminationScore >= 20) stats.weatherImpacted += 1;
      if (intel.resources.length) stats.resourceDistricts += 1;
      stats.landmarks += intel.landmarkNames.length;
      for (const resource of intel.resources) stats.resources[resource.id] += 1;
    }
    return stats;
  },

  _getDistrictIntel(id) {
    const district = DISTRICTS[id] ?? { id, name: id, lootTable: [] };
    const mapShape = DRAWN_MAP_DISTRICTS.find(d => d.id === id);
    const resources = this._getTopResourceGroups(district);
    const resourceItems = this._getTopResourceItems(district);
    const contaminationScore = this._getContaminationScore(district);
    const radiation = district.radiation ?? 0;
    const dangerLevel = district.dangerLevel ?? 1;
    const encounterPct = Math.round((district.encounterChance ?? 0) * 100);
    const status = this._getDistrictStatus({ dangerLevel, radiation, contaminationScore, encounterPct });
    const landmarkIds = Array.isArray(district.landmarks)
      ? district.landmarks
      : (district.landmark ? [district.landmark] : [`lm_${id}`]);
    const primaryLandmarkId = this._primaryLandmarkId(landmarkIds);

    return {
      id,
      grid: mapShape?.grid ?? '--',
      name: this._districtName(id),
      icon: district.icon ?? '',
      description: district.description ?? '기록된 구역 설명이 없습니다.',
      dangerLevel,
      radiation,
      encounterPct,
      contaminationScore,
      status,
      resources,
      resourceItems,
      exploration: GameState.flags?.districtExploration?.[id] ?? 0,
      visited: (GameState.location.districtsVisited ?? []).includes(id),
      landmarkIds,
      primaryLandmarkId,
      landmarkNames: landmarkIds
        .map(lmId => this._landmarkName(lmId))
        .filter(Boolean),
    };
  },

  _getDistrictStatus({ dangerLevel, radiation, contaminationScore, encounterPct }) {
    if (radiation > 0 || contaminationScore >= 30) return 'contaminated';
    if (dangerLevel <= 1 && encounterPct <= 3) return 'safe';
    if (dangerLevel >= 4 || encounterPct >= 25) return 'danger';
    return 'unstable';
  },

  _getContaminationScore(district) {
    const table = district.lootTable ?? [];
    const totalWeight = table.reduce((sum, e) => sum + (e.weight ?? 0), 0);
    const lootRisk = totalWeight
      ? table.reduce((sum, e) => sum + ((e.contamChance ?? 0) * (e.weight ?? 0)), 0) / totalWeight
      : 0;
    const radiationRisk = clamp((district.radiation ?? 0) / 25, 0, 1);
    return Math.round(clamp(Math.max(lootRisk, radiationRisk) * 100, 0, 100));
  },

  _getTopResourceGroups(district) {
    const scores = new Map(RESOURCE_GROUPS.map(group => [group.id, 0]));
    for (const entry of district.lootTable ?? []) {
      const group = this._resourceGroupFor(entry.definitionId);
      scores.set(group.id, (scores.get(group.id) ?? 0) + (entry.weight ?? 1));
    }
    return RESOURCE_GROUPS
      .map(group => ({ ...group, score: scores.get(group.id) ?? 0 }))
      .filter(group => group.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  },

  _getTopResourceItems(district) {
    return (district.lootTable ?? [])
      .map(entry => {
        const item = GameData.items?.[entry.definitionId];
        return {
          id: entry.definitionId,
          name: item?.name ?? entry.definitionId,
          icon: item?.icon ?? '·',
          weight: entry.weight ?? 0,
        };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);
  },

  _resourceGroupFor(definitionId) {
    const id = String(definitionId ?? '').toLowerCase();
    const item = GameData.items?.[definitionId];
    const haystack = `${id} ${item?.type ?? ''} ${item?.subtype ?? ''} ${item?.tags?.join(' ') ?? ''}`.toLowerCase();
    return RESOURCE_GROUPS.find(group => group.terms.some(term => haystack.includes(term))) ?? RESOURCE_GROUPS[3];
  },

  _mapIconForResourceGroup(groupId) {
    const icons = {
      food: MAP_ICON_IMAGES.food,
      medical: MAP_ICON_IMAGES.medical,
      fuel: MAP_ICON_IMAGES.secureStorage,
      material: MAP_ICON_IMAGES.parts,
      weapon: MAP_ICON_IMAGES.ammo,
    };
    return icons[groupId] ?? MAP_ICON_IMAGES.secureStorage;
  },

  _primaryLandmarkId(landmarkIds) {
    return landmarkIds.find(id => !String(id).startsWith('lm_hangang_')) ?? landmarkIds[0] ?? null;
  },

  _landmarkIconSvg(landmarkId, x, y, size) {
    const imageSrc = MAP_LANDMARK_ICON_IMAGES[landmarkId];
    if (imageSrc) {
      return `<image href="${imageSrc}" x="${x - size / 2}" y="${y - size / 2}" width="${size}" height="${size}" class="sm-map-icon sm-map-icon--landmark sm-map-landmark-image"/>`;
    }

    const kind = this._landmarkIconKind(landmarkId);
    const scale = size / 24;
    const body = {
      lotteTower: `
        <path d="M12 2 L14.2 20 L9.8 20 Z"/>
        <path d="M12 0.7 V4.8"/>
        <path d="M8 20 H16"/>
        <path d="M10.7 7 H13.3 M10.4 11 H13.6 M10.1 15 H13.9"/>`,
      palace: `
        <path d="M4 10 H20 L18.5 7.5 H5.5 Z"/>
        <path d="M6 10 V20 M10 10 V20 M14 10 V20 M18 10 V20"/>
        <path d="M3 20 H21 M7 7.5 L12 4 L17 7.5"/>`,
      hospital: `
        <rect x="5" y="6" width="14" height="15" rx="1.5"/>
        <path d="M12 9 V16 M8.5 12.5 H15.5"/>
        <path d="M8 21 V17 H16 V21"/>`,
      airport: `
        <path d="M3 13 L21 8 L22 10 L14 14 L16 21 L14 22 L10 16 L5 18 L4 16 L8 14 Z"/>`,
      mountain: `
        <path d="M3 20 L9 8 L12 14 L15 6 L21 20 Z"/>
        <path d="M8.5 13 L10.4 14.8 L12 14 M14.4 10.5 L16 12.3 L17.3 11.2"/>`,
      stadium: `
        <ellipse cx="12" cy="12" rx="8.5" ry="5.5"/>
        <ellipse cx="12" cy="12" rx="5.4" ry="3.1"/>
        <path d="M4.5 15.5 L19.5 8.5"/>`,
      tower: `
        <path d="M12 3 V21"/>
        <path d="M8 21 H16 M7 9 H17 M9 5 H15"/>
        <path d="M8.5 21 L12 9 L15.5 21"/>
        <circle cx="12" cy="3.5" r="1.5"/>`,
      market: `
        <path d="M5 10 H19 L17.5 6 H6.5 Z"/>
        <path d="M6 10 V20 H18 V10"/>
        <path d="M9 20 V14 H15 V20"/>`,
      campus: `
        <path d="M4 11 H20 L12 5 Z"/>
        <path d="M6 11 V20 M10 11 V20 M14 11 V20 M18 11 V20"/>
        <path d="M3 20 H21"/>`,
      factory: `
        <path d="M4 20 V10 L9 13 V10 L14 13 V8 H20 V20 Z"/>
        <path d="M16 8 V5 H20 V8 M7 16 H9 M12 16 H14 M17 16 H19"/>`,
      broadcast: `
        <path d="M12 21 V7"/>
        <path d="M8 21 H16"/>
        <path d="M9 10 L12 7 L15 10"/>
        <path d="M6 6 C8 3.8 16 3.8 18 6 M4 3 C7 -0.2 17 -0.2 20 3"/>`,
      water: `
        <path d="M12 4 C8 9 6 12 6 15.5 C6 19 8.7 21.5 12 21.5 C15.3 21.5 18 19 18 15.5 C18 12 16 9 12 4 Z"/>
        <path d="M9 16 C10.5 17.2 13.2 17.3 15 15.3"/>`,
      workshop: `
        <path d="M5 19 L14 10"/>
        <path d="M13 5 L19 11 L16 14 L10 8 Z"/>
        <path d="M4 20 L8 16"/>`,
      default: `
        <path d="M4 20 H20 V9 L12 4 L4 9 Z"/>
        <path d="M9 20 V14 H15 V20 M7 11 H17"/>`,
    }[kind];

    return `
      <g class="sm-map-landmark-pictogram sm-map-landmark-pictogram--${kind}"
         transform="translate(${x - size / 2} ${y - size / 2}) scale(${scale})">
        ${body}
      </g>
    `;
  },

  _landmarkIconKind(landmarkId) {
    const id = String(landmarkId ?? '');
    if (id === 'lm_songpa') return 'lotteTower';
    if (id === 'lm_jongno') return 'palace';
    if (id === 'lm_gangseo') return 'airport';
    if (id === 'lm_gangnam' || id === 'lm_boramae_hospital' || id === 'lm_seodaemun') return 'hospital';
    if (id === 'lm_gangbuk' || id === 'lm_dobong') return 'mountain';
    if (id === 'lm_gangdong' || id === 'lm_gwangjin' || id === 'lm_yangcheon') return 'stadium';
    if (id === 'lm_comms_tower' || id === 'lm_yeongdeungpo') return 'broadcast';
    if (id === 'lm_junggoo' || id === 'lm_mapo') return 'market';
    if (id === 'lm_seongbuk' || id === 'lm_gwanak') return 'campus';
    if (id === 'lm_guro' || id === 'lm_geumcheon' || id === 'lm_seongdong') return 'factory';
    if (id === 'lm_nowon') return 'stadium';
    if (id === 'lm_eunpyeong' || id === 'lm_jungrang') return 'water';
    if (id === 'lm_dongdaemun') return 'default';
    if (id === 'lm_yongsan') return 'workshop';
    if (id === 'lm_seocho') return 'campus';
    return 'default';
  },

  _landmarkName(landmarkId) {
    const direct = GameData.items?.[landmarkId]?.name;
    if (direct) return direct;
    const stripped = String(landmarkId ?? '').replace(/^lm_/, '');
    return GameData.items?.[`lm_${stripped}`]?.name ?? null;
  },

  _collectQuestPins() {
    const pins = new Map();
    const activeIds = (GameState.quests?.active ?? []).map(e => e.id);
    for (const id of activeIds) {
      const q = MAIN_QUESTS[id];
      const did = q?.locationHint?.districtId;
      if (!did) continue;
      if (!pins.has(did)) pins.set(did, { titles: [] });
      pins.get(did).titles.push(q.title ?? id);
    }
    return pins;
  },

  _formatClock() {
    const hour = GameState.time?.hour ?? 6;
    const minute = ((GameState.time?.tpInDay ?? 0) % 3) * 20;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  },

  _statPct(statId) {
    const stat = GameState.stats?.[statId];
    if (!stat?.max) return 0;
    return clamp(Math.round((stat.current / stat.max) * 100), 0, 100);
  },

  _mapStatusText(stats) {
    if (stats.contaminated >= 6 || stats.danger >= 4) return '탐색 중 / EXPLORING';
    if (stats.safe > stats.contaminated) return '안정 / STABLE';
    return '주의 / WATCH';
  },

  _districtName(id) {
    const district = DISTRICTS[id];
    return I18n.districtName(id, district?.name ?? id);
  },

  _romanizeDistrict(id) {
    const names = {
      gangnam: 'GANGNAM-GU',
      gangdong: 'GANGDONG-GU',
      gangbuk: 'GANGBUK-GU',
      gangseo: 'GANGSEO-GU',
      gwanak: 'GWANAK-GU',
      gwangjin: 'GWANGJIN-GU',
      guro: 'GURO-GU',
      geumcheon: 'GEUMCHEON-GU',
      nowon: 'NOWON-GU',
      dobong: 'DOBONG-GU',
      dongdaemun: 'DONGDAEMUN-GU',
      dongjak: 'DONGJAK-GU',
      mapo: 'MAPO-GU',
      seodaemun: 'SEODAEMUN-GU',
      seocho: 'SEOCHO-GU',
      seongdong: 'SEONGDONG-GU',
      seongbuk: 'SEONGBUK-GU',
      songpa: 'SONGPA-GU',
      yangcheon: 'YANGCHEON-GU',
      yeongdeungpo: 'YEONGDEUNGPO-GU',
      yongsan: 'YONGSAN-GU',
      eunpyeong: 'EUNPYEONG-GU',
      jongno: 'JONGNO-GU',
      junggoo: 'JUNG-GU',
      jungrang: 'JUNGNANG-GU',
    };
    return names[id] ?? id.toUpperCase();
  },

  _shortMapLabel(value, maxChars) {
    if (!maxChars) return '';
    const text = String(value ?? '').trim();
    if (text.length <= maxChars) return text;
    return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
  },

  _scalePath(path, sx, sy) {
    let coordIndex = 0;
    return path.replace(/[A-Za-z]|-?\d+(\.\d+)?/g, (token) => {
      if (/^[A-Za-z]$/.test(token)) {
        coordIndex = 0;
        return token;
      }
      const value = Number(token);
      if (Number.isNaN(value)) return token;
      const scaled = coordIndex % 2 === 0 ? value * sx : value * sy;
      coordIndex += 1;
      return String(Math.round(scaled));
    });
  },

  _escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  },

  _escapeXml(s) {
    return String(s ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&apos;',
    }[ch]));
  },
};

export default SeoulMapModal;
