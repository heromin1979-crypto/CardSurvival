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

// Map artwork native pixels / 2 (seoul-blueprint-map-final00-clean.png is 2752×1536).
// District polygons below are traced against this image so the SVG hit zones align
// pixel-for-pixel with the drawn boundaries when the image is embedded in the SVG.
const MAP_W = 1376;
const MAP_H = 768;

// District hit-zone polygons, auto-traced from the blueprint map artwork (coordinate
// space = MAP_W×MAP_H = image/2). Do not hand-maintain: if the artwork changes,
// regenerate via tools/minimap-trace/ (see its README) and paste the output here.
const DRAWN_MAP_DISTRICTS = [
  { id: 'gangseo',      grid: 'A6',   label: [322,381], points: [[263,288],[257,294],[235,289],[235,366],[201,399],[211,410],[245,423],[253,445],[274,426],[288,426],[294,432],[294,443],[306,455],[346,457],[350,453],[363,462],[405,458],[410,447],[407,411],[414,405],[431,413],[450,409],[456,399],[414,371],[419,366],[430,366],[430,351],[425,342],[419,340],[412,346],[359,327],[352,336],[296,298]] },
  { id: 'yangcheon',    grid: 'C8',   label: [397,475], points: [[414,406],[408,410],[411,447],[404,459],[363,463],[347,445],[342,458],[326,454],[306,456],[293,444],[306,457],[319,455],[327,462],[318,500],[320,517],[332,517],[340,527],[377,510],[397,513],[404,521],[418,526],[432,521],[433,512],[448,498],[447,472],[469,458],[470,445],[450,410],[431,414]] },
  { id: 'guro',         grid: 'C10',  label: [371,558], points: [[377,511],[345,528],[332,518],[317,519],[310,534],[295,549],[312,571],[295,610],[338,603],[366,609],[371,594],[377,588],[382,590],[416,558],[428,564],[435,577],[450,575],[462,584],[462,577],[471,569],[451,533],[441,535],[431,523],[418,527],[406,523],[401,515]] },
  { id: 'geumcheon',    grid: 'D11',  label: [499,634], points: [[520,568],[510,574],[492,576],[491,586],[481,593],[465,589],[450,576],[433,577],[429,582],[457,632],[453,638],[462,649],[452,659],[457,664],[474,664],[485,675],[483,683],[491,694],[489,704],[508,711],[522,698],[539,695],[553,671],[543,651],[543,585],[540,588]] },
  { id: 'yeongdeungpo', grid: 'D7',   label: [502,497], points: [[456,400],[451,410],[470,442],[471,455],[449,469],[449,498],[437,508],[431,522],[441,534],[449,533],[454,538],[471,567],[462,585],[481,592],[489,590],[490,580],[504,572],[506,561],[519,544],[538,540],[544,517],[559,494],[602,494],[602,481],[599,476],[570,464],[565,459],[569,455],[562,452],[506,442],[473,410]] },
  { id: 'mapo',         grid: 'D5',   label: [550,391], points: [[462,308],[450,312],[447,328],[439,337],[486,359],[518,382],[501,409],[507,415],[532,427],[566,428],[609,453],[629,438],[644,401],[642,389],[577,393],[562,383],[561,372],[541,367],[515,352],[506,342],[475,324]] },
  { id: 'seodaemun',    grid: 'E4',   label: [588,339], points: [[611,264],[598,270],[588,287],[570,296],[562,313],[542,322],[525,320],[507,341],[509,347],[535,363],[558,370],[563,375],[563,385],[580,393],[641,388],[650,380],[650,368],[624,342],[624,333],[630,327],[631,295]] },
  { id: 'eunpyeong',    grid: 'D3',   label: [564,234], points: [[607,139],[591,145],[577,160],[563,162],[551,171],[510,166],[523,171],[529,180],[525,195],[517,203],[520,219],[511,228],[501,253],[500,293],[493,304],[472,304],[466,309],[471,319],[498,339],[506,341],[525,319],[542,321],[564,312],[566,300],[591,284],[601,267],[613,263],[616,224],[630,213],[665,203],[665,190],[661,192],[638,170],[630,149]] },
  { id: 'dobong',       grid: 'H1',   label: [798,118], points: [[770,48],[751,58],[745,73],[744,88],[759,112],[755,154],[759,159],[784,166],[814,197],[821,199],[835,177],[848,176],[837,124],[844,80],[841,69],[822,63],[799,70],[789,51]] },
  { id: 'gangbuk',      grid: 'G3',   label: [753,183], points: [[733,87],[711,124],[686,150],[692,168],[691,195],[725,220],[738,224],[746,237],[763,249],[805,253],[833,226],[834,217],[788,170],[754,154],[758,112],[743,87]] },
  { id: 'nowon',        grid: 'J2',   label: [898,161], points: [[904,60],[876,64],[865,74],[844,81],[838,124],[849,173],[833,179],[822,199],[837,223],[871,247],[887,247],[913,236],[929,236],[935,241],[967,236],[969,222],[983,207],[980,183],[967,175],[949,179],[941,169],[937,146],[943,139],[946,117],[939,99],[947,80],[926,76],[915,61]] },
  { id: 'jongno',       grid: 'G5',   label: [674,297], points: [[660,204],[630,214],[617,224],[614,264],[621,284],[632,295],[631,325],[624,344],[631,346],[650,367],[667,358],[702,361],[773,354],[772,338],[756,328],[746,329],[726,305],[694,297],[676,285],[692,270],[690,248],[673,206]] },
  { id: 'seongbuk',     grid: 'I4',   label: [765,269], points: [[690,195],[673,204],[683,222],[693,265],[693,270],[677,285],[702,299],[723,302],[736,313],[745,329],[756,327],[776,337],[793,320],[809,314],[816,297],[834,282],[851,281],[862,269],[887,262],[887,248],[871,248],[836,223],[805,254],[766,251],[743,234],[741,225],[725,221]] },
  { id: 'jungrang',     grid: 'K5',   label: [939,290], points: [[969,235],[946,242],[913,237],[889,245],[887,263],[892,281],[887,301],[900,324],[906,353],[938,357],[948,350],[960,349],[964,334],[978,323],[980,312],[993,301],[989,289],[996,274],[994,245],[985,237]] },
  { id: 'junggoo',      grid: 'G6',   label: [714,382], points: [[768,355],[702,362],[666,359],[651,367],[651,378],[642,388],[644,399],[662,395],[693,400],[716,414],[730,409],[744,415],[773,384],[774,357]] },
  { id: 'yongsan',      grid: 'G7',   label: [690,446], points: [[660,396],[641,405],[630,437],[610,454],[667,480],[672,485],[672,496],[687,499],[714,492],[719,495],[762,451],[766,455],[770,451],[755,440],[743,415],[730,410],[716,415],[696,402]] },
  { id: 'dongdaemun',   grid: 'I6',   label: [852,327], points: [[882,264],[862,270],[851,282],[836,282],[818,294],[806,316],[791,322],[773,338],[774,351],[803,357],[819,348],[864,377],[894,383],[905,343],[886,301],[891,281],[887,264]] },
  { id: 'seongdong',    grid: 'I7',   label: [818,402], points: [[818,349],[803,358],[774,352],[776,379],[745,415],[756,440],[765,449],[773,438],[785,433],[795,440],[803,433],[856,451],[863,447],[892,384],[864,378]] },
  { id: 'gwangjin',     grid: 'K7',   label: [930,410], points: [[1063,338],[1012,355],[984,383],[969,383],[963,377],[961,368],[966,354],[961,349],[938,358],[906,354],[891,394],[859,452],[878,463],[896,467],[938,466],[949,451],[954,448],[959,453],[963,449],[961,439],[982,419],[981,411],[993,380],[1031,349],[1065,341]] },
  { id: 'gangdong',     grid: 'M6',   label: [1071,406], points: [[1130,325],[1102,337],[1077,355],[1034,363],[1013,379],[993,420],[1012,436],[1007,461],[1065,492],[1085,458],[1088,441],[1102,426],[1146,419],[1150,404],[1142,386],[1141,361],[1130,344]] },
  { id: 'dongjak',      grid: 'F8',   label: [610,539], points: [[603,486],[598,495],[558,495],[545,517],[540,537],[533,543],[519,545],[507,561],[504,573],[520,567],[540,587],[542,566],[550,558],[575,563],[614,555],[621,560],[633,559],[638,564],[639,580],[656,595],[687,592],[687,552],[692,547],[692,538],[680,528],[684,516],[642,501],[632,493],[632,488],[616,490]] },
  { id: 'gwanak',       grid: 'F10',  label: [612,628], points: [[611,556],[575,564],[550,559],[543,566],[545,650],[540,655],[548,659],[554,672],[552,677],[561,671],[582,693],[586,706],[601,699],[646,694],[646,685],[651,680],[668,675],[688,654],[699,649],[695,645],[696,623],[688,610],[687,593],[658,597],[637,578],[636,561]] },
  { id: 'seocho',       grid: 'H9',   label: [799,614], points: [[757,478],[731,500],[721,499],[716,508],[681,520],[682,531],[693,539],[688,550],[688,606],[697,623],[696,645],[700,649],[711,643],[720,630],[730,630],[742,651],[757,661],[785,651],[789,641],[799,635],[811,656],[809,674],[813,683],[807,697],[820,701],[846,727],[862,722],[885,725],[898,705],[895,698],[900,693],[918,694],[924,685],[930,684],[935,665],[953,651],[937,639],[917,607],[898,611],[882,622],[846,625],[819,581],[803,581],[797,575],[764,485]] },
  { id: 'gangnam',      grid: 'J9',   label: [872,552], points: [[795,441],[790,449],[771,458],[758,478],[765,485],[800,579],[816,578],[821,583],[843,623],[882,621],[898,610],[915,606],[940,642],[953,650],[967,640],[991,646],[1004,634],[1007,624],[1003,616],[979,574],[962,554],[886,526],[881,495],[885,482],[856,465],[800,448]] },
  { id: 'songpa',       grid: 'L9',   label: [995,525], points: [[992,422],[968,453],[963,449],[959,453],[966,460],[948,475],[942,473],[937,481],[924,485],[886,482],[882,495],[888,530],[903,531],[960,552],[970,561],[1004,616],[1006,631],[1030,615],[1034,606],[1041,608],[1055,600],[1090,555],[1086,529],[1062,526],[1057,521],[1055,507],[1064,492],[1012,465],[1006,459],[1011,432]] },
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
    // The blueprint artwork is embedded directly in the SVG so the district hit
    // polygons (traced against that same artwork) line up with the drawn borders
    // exactly, at any render size. Coordinate space = 0..MAP_W × 0..MAP_H.
    const w = MAP_W;
    const h = MAP_H;
    const visitedSet = new Set(GameState.location.districtsVisited ?? []);
    const districtPolygons = [];
    const districtAnnotations = [];

    DRAWN_MAP_DISTRICTS.forEach(shape => {
      const intel = this._getDistrictIntel(shape.id);
      const status = STATUS_META[intel.status];
      const isCurrent = shape.id === currentId;
      const isSelected = shape.id === selectedId;
      const isVisited = visitedSet.has(shape.id);
      const [lx, ly] = shape.label;
      const polygon = pointsToString(shape.points);
      const opacity = compact || isVisited || isCurrent || intel.status !== 'unstable' ? 1 : 0.62;
      const resourceTitle = intel.resources.length
        ? intel.resources.map(r => `${r.label} ${r.score}`).join(', ')
        : '자원 정보 없음';
      const label = compact ? '' : `
        <text x="${lx}" y="${ly - 3}" class="sm-map-label" text-anchor="middle">${this._escapeXml(intel.name)}</text>
        <text x="${lx}" y="${ly + 15}" class="sm-map-label-en" text-anchor="middle">${this._romanizeDistrict(intel.id)}</text>
      `;
      const hit = interactive ? `data-map-district="${shape.id}"` : '';

      districtPolygons.push(`
        <g class="sm-map-district sm-map-district--${intel.status} ${isCurrent ? 'is-current' : ''} ${isSelected ? 'is-selected' : ''}" opacity="${opacity}">
          <polygon ${hit} points="${polygon}" fill="${status.fill}" stroke="${isSelected ? '#d4c9a8' : status.stroke}" stroke-width="${isCurrent || isSelected ? 3 : 1.4}" class="sm-district-hit">
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

    return `
      <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" class="seoul-map-svg seoul-map-svg--ops seoul-map-svg--drawn-seoul">
        <image href="${MAP_CONCEPT_IMAGE}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" class="sm-map-artwork"/>
        <g>${districts}</g>
        <g class="sm-annotation-layer">${annotations}</g>
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
