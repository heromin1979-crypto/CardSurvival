// === CHARACTER CREATION SCREEN ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import StateMachine    from '../core/StateMachine.js';
import { DISTRICTS, getAdjacentDistricts } from '../data/districts.js';
import { CHARACTERS }  from '../data/characters.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';

const DANGER_COLORS = ['#336633', '#4a7a33', '#886622', '#882222', '#550000', '#330000'];

// 지역 선택 시 안내 문구 (생존 스타일 힌트)
const DISTRICT_HINTS = {
  gangnam:      '🏥 의료 최강. 삼성서울병원 접근 — 위험하지만 최고급 물자.',
  gangdong:     '🏘️ 외곽 주거지. 약탈이 덜 된 아파트에서 식량·생필품 수급.',
  gangbuk:      '⛰️ 저위험 출발. 북한산 인근 자연 자원으로 안전하게 기반 구축.',
  gangseo:      '✈️ 공항 인근. 창고·공업 시설로 물자 수급 우수.',
  geumcheon:    '🏭 제조업 특화. 공단 밀집 지역. 고철·공구·제작 재료 풍부.',
  gwangjin:     '🌉 한강변 중동부. 이동 거점으로 유리. 자원과 위험이 균형.',
  gwanak:       '🎓 연구 특화. 서울대 인근. 의약품 제작에 유리.',
  guro:         '⚙️ 공단 지역. 제작·수리 재료 풍부. 위험 보통.',
  dobong:       '🏔️ 북부 저위험. 도봉산 인근. 안전하나 물자 확보에 시간 소요.',
  dongdaemun:   '🏪 상업 중심. 동대문시장 인근 상가에서 다양한 물자 수급.',
  dongjak:      '🌊 한강 남안. 동작대교 거점. 이동 거점으로 좋고 위험도 보통.',
  mapo:         '🎭 균형 잡힌 시작. 홍대·합정 권역. 다양한 자원. 초보자 추천.',
  seodaemun:    '💊 의료 특화. 세브란스 병원 인접. 감염 생존에 유리.',
  seocho:       '⚖️ 강남 인접 법조 지역. 물자 양호. 인접 이동 편의.',
  seongdong:    '🏭 성수 공장지대. 제작 재료 풍부. 무기·구조물 제작에 최적.',
  seongbuk:     '🌿 북부 주거지. 위험 낮고 일상 물자 확보 안정적.',
  songpa:       '🗼 롯데타워·올림픽공원. 독립적 생존기지로 활용 가능.',
  yangcheon:    '🏘️ 서남부 주거지. 생필품 위주. 위험 낮고 인접 이동 편리.',
  yeongdeungpo: '📡 KBS 방송국 거점. 여의도 인접 공업·상업 복합 지역.',
  yongsan:      '🔧 전자·무기 복합. 용산 전자상가로 제작 재료 확보.',
  eunpyeong:    '🌲 북서부 저위험. 물자 적지만 안전하게 기반을 다질 수 있다.',
  jongno:       '🏯 역사적 중심. 광화문·경복궁. 다양한 인접 지역 이동 가능.',
  junggoo:      '🛒 유통의 중심. 남대문시장 — 다양한 물자 수급 가능.',
  jungrang:     '🌿 중랑천 인근. 중랑공원 자연 자원. 위험 보통, 이동 유리.',
  nowon:        '🍃 최북동 저위험. 물자 희소하나 극도로 안전한 시작점.',
};

const CharCreate = {
  _selectedChar:     null,
  _selectedDistrict: 'gangseo',  // 기본 선택: 강서구 (dangerLevel 1)

  init() {
    this._el = document.getElementById('screen-char-create');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'char_create') {
        this._selectedChar     = null;
        this._selectedDistrict = 'gangseo';
        this._render();
      }
    });
  },

  _render() {
    if (!this._el) return;

    const districtHtml = this._buildDistrictMap();
    const selected     = DISTRICTS[this._selectedDistrict];
    const hint         = DISTRICT_HINTS[this._selectedDistrict] ?? '';
    const charGridHtml = this._buildCharGrid();
    const charDetail   = this._buildCharDetail();

    this._el.innerHTML = `
      <div class="charcreate-layout">
        <div class="charcreate-scroll">

          <div class="menu-title" style="text-align:center; margin-bottom:4px;">생존자 생성</div>

          <!-- 캐릭터 선택 -->
          <div class="form-group">
            <label class="form-label">직업 선택</label>
            <div class="char-grid">${charGridHtml}</div>
          </div>

          <!-- 캐릭터 상세 패널 -->
          <div class="char-detail ${this._selectedChar ? 'visible' : ''}" id="char-detail-panel">
            ${charDetail}
          </div>

          <hr class="divider">

          <!-- 시작 위치 선택 -->
          <div class="form-group">
            <label class="form-label">🗺 시작 위치 선택</label>
            <p class="form-hint">서울 지도에서 시작 구(區)를 선택하세요. 인접한 구로만 이동 가능합니다.</p>
          </div>

          <!-- 지역 지도 (인터랙티브 그리드) -->
          <div class="district-map-wrap">
            ${districtHtml}
          </div>

          <!-- 선택된 지역 정보 -->
          <div class="selected-district-info" id="selected-district-info">
            <div class="sdi-header">
              <span class="sdi-icon">${selected.icon}</span>
              <span class="sdi-name">${selected.name}</span>
              <span class="sdi-danger" style="color:${DANGER_COLORS[Math.min(selected.dangerLevel, 5)]}">
                위험도 ${'█'.repeat(selected.dangerLevel)}${'░'.repeat(Math.max(0, 5 - selected.dangerLevel))}
              </span>
            </div>
            <div class="sdi-desc">${selected.description}</div>
            <div class="sdi-hint">${hint}</div>
            <div class="sdi-adjacent">
              <span class="sdi-subloc-label">인접 이동 가능:</span>
              ${(selected.adjacentDistricts ?? []).map(id => {
                const d = DISTRICTS[id];
                return d ? `<span class="sdi-adj-tag">${d.icon} ${d.name}</span>` : '';
              }).join('')}
            </div>
          </div>

          <hr class="divider">

          <div style="font-size:10px; color:var(--text-dim); text-align:center;">
            ⚠ 하드코어 모드 — 죽으면 처음부터
          </div>

          <button class="menu-btn primary" id="btn-start">🚀 생존 시작</button>
          <button class="menu-btn" id="btn-back-menu">← 메인 메뉴</button>

        </div>
      </div>
    `;

    // 캐릭터 카드 클릭
    this._el.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.dataset.charId;
        this._selectedChar = CHARACTERS.find(c => c.id === charId) ?? null;
        if (this._selectedChar?.homeDist) {
          const hd = DISTRICTS[this._selectedChar.homeDist];
          if (hd && hd.dangerLevel <= 1) {
            this._selectedDistrict = this._selectedChar.homeDist;
          }
          // dangerLevel > 1이면 현재 선택 지역 유지
        }
        this._render();
      });
    });

    // 지역 클릭
    this._el.querySelectorAll('.dc-node').forEach(el => {
      el.addEventListener('click', () => {
        this._selectedDistrict = el.dataset.districtId;
        this._render();
      });
    });

    // 시작
    this._el.querySelector('#btn-start')?.addEventListener('click', () => {
      if (!this._selectedChar) {
        EventBus.emit('notify', { message: '직업을 선택하세요!', type: 'warn' });
        return;
      }
      const name = this._selectedChar.name;
      this._startGame(name);
    });

    this._el.querySelector('#btn-back-menu')?.addEventListener('click', () => {
      StateMachine.transition('main_menu');
    });
  },

  // ── 캐릭터 그리드 ───────────────────────────────────────

  _buildCharGrid() {
    return CHARACTERS.map(c => `
      <div class="char-card ${this._selectedChar?.id === c.id ? 'selected' : ''}" data-char-id="${c.id}">
        <span class="char-portrait">${c.portrait}</span>
        <div class="char-card-name">${c.name}</div>
        <div class="char-card-title">${c.title}</div>
      </div>
    `).join('');
  },

  // ── 캐릭터 상세 패널 ────────────────────────────────────

  _buildCharDetail() {
    const c = this._selectedChar;
    if (!c) return '';

    const abilitiesHtml = c.abilities.map(a => `
      <li>
        <span class="ability-icon">${a.icon}</span>
        <span><span class="ability-name">${a.name}</span>— ${a.desc}</span>
      </li>
    `).join('');

    return `
      <div class="char-detail-header">
        <span class="char-detail-portrait">${c.portrait}</span>
        <div>
          <div class="char-detail-name">${c.name}</div>
          <div class="char-detail-title">${c.title}</div>
        </div>
      </div>
      <div class="char-story">${c.story}</div>
      <ul class="char-ability-list">${abilitiesHtml}</ul>
      <div class="char-goal">🎯 ${c.goal}</div>
    `;
  },

  // ── 시작 지역 선택 그리드 (dangerLevel 1만 표시) ──────────────

  _buildDistrictMap() {
    const sel = this._selectedDistrict;

    // 강북 dangerLevel 1 (은평·도봉·노원)
    const NORTH_IDS = new Set(['eunpyeong', 'dobong', 'nowon']);
    const allLevel1  = Object.values(DISTRICTS).filter(d => d.dangerLevel === 1);
    const northList  = allLevel1.filter(d => NORTH_IDS.has(d.id));
    const southList  = allLevel1
      .filter(d => !NORTH_IDS.has(d.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    const renderCard = (d) => {
      const isSel  = d.id === sel;
      const color  = DANGER_COLORS[Math.min(d.dangerLevel, 5)];
      return `
        <div class="dc-cell">
          <div class="dc-node ${isSel ? 'selected' : ''}" data-district-id="${d.id}"
               style="border-color:${isSel ? 'var(--accent-primary)' : color};">
            <div class="dc-node-icon">${d.icon}</div>
            <div class="dc-node-name">${d.name}</div>
            <div class="dc-node-danger" style="color:${color}; font-size:8px;">
              ${'█'.repeat(d.dangerLevel)}${'░'.repeat(Math.max(0, 5 - d.dangerLevel))}
            </div>
            <div class="dc-node-tp" style="font-size:8px; color:var(--text-dim);">
              ${d.travelCostTP}TP
            </div>
          </div>
        </div>
      `;
    };

    return `
      <div class="district-map-grid">
        <div class="dc-section-label">🏔 강북 — 안전 지역</div>
        <div class="dc-row">${northList.map(renderCard).join('')}</div>
        <div class="dc-section-label">🌆 강남 — 시작 가능</div>
        <div class="dc-row">${southList.map(renderCard).join('')}</div>
      </div>
    `;
  },

  // ── 게임 시작 ───────────────────────────────────────────────

  _startGame(name) {
    const gs         = GameState;
    const char       = this._selectedChar;
    const districtId = this._selectedDistrict;

    // ── 플레이어 초기화 ──────────────────────────────────────
    gs.player.name        = name;
    gs.player.characterId = char.id;
    gs.player.gender      = char.gender ?? 'M';
    gs.player.isAlive     = true;
    // 캐릭터별 최대 무게 설정
    gs.player.encumbrance.max      = char.maxCarryWeight ?? 30;
    gs.player.encumbrance.current  = 0;
    gs.player.encumbrance.tier     = 0;
    gs.player.encumbrance.weightPct= 0;
    // 스태미나 초기화
    gs.stats.stamina = { current: 100, max: 100 };
    gs.player.deathCause  = null;
    gs.player.hp          = { current: 100, max: 100 };
    gs.player.xp          = 0;
    gs.player.traits      = [];

    // 능력 효과 기본값 리셋
    gs.player.healBonus               = 1.0;
    gs.player.noiseReduct             = 0;
    gs.player.exploreBonus            = 0;
    gs.player.combatDmgBonus          = 1.0;
    gs.player.critBonus               = 0;
    gs.player.craftSaveChance         = 0;
    gs.player.dismantleBonus          = 0;
    gs.player.dismantleExtraItem      = 0;
    gs.player.structureDurabilityBonus= 1.0;
    gs.player.medicalUsesBonus        = 0;
    gs.player.encounterRateReduct     = 0;
    gs.player.bandageHpBonus          = 0;
    gs.player.craftSuccessBonus       = 0;

    // ── 캐릭터 능력 효과 적용 ────────────────────────────────
    const extraStartItems = [];
    for (const ability of char.abilities) {
      const e = ability.effect;
      if (e.healBonus)               gs.player.healBonus = e.healBonus;
      if (e.hpMax)                   gs.player.hp.max += e.hpMax;
      if (e.fatigueDecay !== undefined) gs.stats.fatigue.decayPerTP = 0.8 * (1 + e.fatigueDecay);
      if (e.noiseReduct)             gs.player.noiseReduct = e.noiseReduct;
      if (e.exploreBonus)            gs.player.exploreBonus = e.exploreBonus;
      if (e.combatDmgBonus)          gs.player.combatDmgBonus = e.combatDmgBonus;
      if (e.critBonus)               gs.player.critBonus = e.critBonus;
      if (e.hydrationDecay)          gs.stats.hydration.decayPerTP *= e.hydrationDecay;
      if (e.nutritionDecay)          gs.stats.nutrition.decayPerTP *= e.nutritionDecay;
      if (e.craftSaveChance)         gs.player.craftSaveChance = e.craftSaveChance;
      if (e.dismantleBonus)          gs.player.dismantleBonus = e.dismantleBonus;
      if (e.dismantleExtraItem)      gs.player.dismantleExtraItem = e.dismantleExtraItem;
      if (e.structureDurabilityBonus)gs.player.structureDurabilityBonus = e.structureDurabilityBonus;
      if (e.medicalUsesBonus)        gs.player.medicalUsesBonus = e.medicalUsesBonus;
      if (e.encounterRateReduct)     gs.player.encounterRateReduct = e.encounterRateReduct;
      if (e.bandageHpBonus)          gs.player.bandageHpBonus = e.bandageHpBonus;
      if (e.infectionRate)           gs.stats.infection.rateMultiplier = e.infectionRate;
      if (e.infectionRecovery)       gs.stats.infection.recoveryMult = e.infectionRecovery;
      if (e.craftSuccessBonus)       gs.player.craftSuccessBonus = e.craftSuccessBonus;
      if (e.startingItems)           extraStartItems.push(...e.startingItems);
    }

    // HP 현재값을 최대값에 맞춤
    gs.player.hp.current = gs.player.hp.max;

    // ── 시간 리셋 ────────────────────────────────────────────
    gs.time.totalTP  = 0;
    gs.time.day      = 1;
    gs.time.tpInDay  = 0;
    gs.time.hour     = 6;

    // ── 스탯 리셋 ────────────────────────────────────────────
    gs.stats.hydration.decayPerTP   = 2.0;
    gs.stats.nutrition.decayPerTP   = 0.5;
    gs.stats.fatigue.decayPerTP     = 0.8;
    gs.stats.hydration.current      = 200;
    gs.stats.nutrition.current      = 80;
    gs.stats.temperature.current    = 50;
    gs.stats.morale.current         = 70;
    gs.stats.radiation.current      = 0;
    gs.stats.infection.current      = 0;
    gs.stats.fatigue.current        = 10;

    // ── 능력 효과 재적용 (스탯 리셋 후) ─────────────────────
    for (const ability of char.abilities) {
      const e = ability.effect;
      if (e.fatigueDecay !== undefined) gs.stats.fatigue.decayPerTP = 0.8 * (1 + e.fatigueDecay);
      if (e.hydrationDecay)  gs.stats.hydration.decayPerTP *= e.hydrationDecay;
      if (e.nutritionDecay)  gs.stats.nutrition.decayPerTP *= e.nutritionDecay;
    }

    // ── 보드·카드 초기화 ─────────────────────────────────────
    gs.board = {
      top:    [null, null, null, null, null, null, null],
      middle: [null, null, null, null, null, null, null, null],
      bottom: [null, null, null, null, null, null, null, null],
    };
    gs.cards   = {};
    gs._nextId = 1;
    gs.noise.level          = 0;
    gs.crafting.activeQueue = [];
    gs.pendingLoot          = [];
    // ── 장착 슬롯 초기화 ─────────────────────────────────────
    gs.player.equipped = {
      head:null, body:null, hands:null, offhand:null,
      face:null, weapon_main:null, weapon_sub:null,
      backpack:null, belt:null, accessory:null,
    };
    gs.player.extraSlots = 0;
    gs.flags = {
      tutorialSeen: false, firstBlood: false,
      totalKills: 0, totalItemsFound: 0, totalCrafted: 0,
      totalMedicalCrafted: 0, structuresBuilt: 0,
      despairTicks: 0, nukeZoneEntered: 0, lastEnemyCount: 0,
      yeongdeungpoVisited: false, seodaemunVisited: false,
      songpaVisited: false, jongnoVisited: false,
      infectionCured: false, collapseCount: 0,
      survivedSummer: false, diseaseDeathId: null,
    };

    // ── 신규 시스템 리셋 ─────────────────────────────────────
    gs.player.diseases = [];
    gs.season = { current: 'spring', eventsTriggered: [] };
    gs.weather = { id: 'sunny', name: '맑음', icon: '☀️', tempMod: 0, tpRemaining: 96, tempJitter: 0 };

    // ── 위치: 선택한 구로 설정 ───────────────────────────────
    gs.location.currentDistrict  = districtId;
    gs.location.currentNode      = districtId;
    gs.location.nodesVisited     = [districtId];
    gs.location.districtsVisited = [districtId];
    gs.location.districtsLooted  = [];

    // ── 상단 행: 현재 구 카드 + 인접 구 카드 배치 ────────────
    const items = window.__GAME_DATA__?.items ?? {};

    const currentDefId = `loc_${districtId}`;
    if (items[currentDefId]) {
      const inst = gs.createCardInstance(currentDefId);
      if (inst) gs.board.top[0] = inst.instanceId;
    }

    // 랜드마크 카드 → top[1] (현재 위치 바로 오른쪽)
    const districts = window.__GAME_DATA__?.districts ?? {};
    const lmDefId   = districts[districtId]?.landmark ?? `lm_${districtId}`;
    if (items[lmDefId]) {
      const lmInst = gs.createCardInstance(lmDefId);
      if (lmInst) gs.board.top[1] = lmInst.instanceId;
    }

    // 인접 구 카드 → top[2..7] (구 위치 카드 사용)
    const adjacent = getAdjacentDistricts(districtId);
    let topSlot = 2;
    for (const adj of adjacent) {
      if (topSlot >= gs.board.top.length) break;
      const useId = `loc_${adj.id}`;
      if (items[useId]) {
        const inst = gs.createCardInstance(useId);
        if (inst) gs.board.top[topSlot++] = inst.instanceId;
      }
    }

    // ── 하단 행: 기본 시작 소지품 + 캐릭터 추가 아이템 (같은 아이템은 합산) ──────
    const starters = this._getStarterItems(districtId);
    // 같은 definitionId끼리 수량 집계
    const itemCounts = new Map();
    for (const defId of [...starters, ...extraStartItems]) {
      itemCounts.set(defId, (itemCounts.get(defId) ?? 0) + 1);
    }
    // 수량을 반영해 카드 생성 (stackable은 하나의 스택으로, 아닌 것은 개별 배치)
    for (const [defId, count] of itemCounts.entries()) {
      const def = items[defId];
      if (!def) continue;
      if (def.stackable) {
        const maxStack = def.maxStack ?? 99;
        let remaining = count;
        while (remaining > 0) {
          const qty  = Math.min(maxStack, remaining);
          const inst = gs.createCardInstance(defId, { quantity: qty });
          if (inst) gs.placeCardInRow(inst.instanceId, 'bottom');
          remaining -= qty;
        }
      } else {
        for (let i = 0; i < count; i++) {
          const inst = gs.createCardInstance(defId);
          if (inst) gs.placeCardInRow(inst.instanceId, 'bottom');
        }
      }
    }

    // ── 작은 가방 지급 및 자동 장착 ─────────────────────────
    const bagInst = gs.createCardInstance('small_bag');
    if (bagInst) {
      // 보드에 놓지 않고 바로 backpack 슬롯에 장착
      EquipmentSystem.equip(bagInst.instanceId, 'backpack');
    }

    StateMachine.transition('basecamp');
  },

  // ── 지역별 기본 시작 아이템 ────────────────────────────────

  _getStarterItems(districtId) {
    const base = ['water_bottle', 'canned_food', 'bandage', 'cloth'];

    const regional = {
      gangnam:      ['first_aid_kit', 'bandage'],
      gangdong:     ['canned_food',   'rope'],
      gangbuk:      ['rope',          'canned_food'],
      gangseo:      ['scrap_metal',   'duct_tape'],
      geumcheon:    ['scrap_metal',   'pipe_wrench'],
      gwangjin:     ['cloth',         'knife'],
      gwanak:       ['water_filter',  'bandage'],
      guro:         ['scrap_metal',   'wire'],
      dobong:       ['rope',          'canned_food'],
      dongdaemun:   ['canned_food',   'cloth'],
      dongjak:      ['rope',          'bandage'],
      mapo:         ['knife',         'scrap_metal'],
      seodaemun:    ['bandage',       'water_filter'],
      seocho:       ['bandage',       'canned_food'],
      seongdong:    ['scrap_metal',   'pipe_wrench'],
      seongbuk:     ['cloth',         'canned_food'],
      songpa:       ['canned_food',   'rope'],
      yangcheon:    ['cloth',         'bandage'],
      yeongdeungpo: ['pistol_ammo',   'wire'],
      yongsan:      ['scrap_metal',   'duct_tape'],
      eunpyeong:    ['rope',          'canned_food'],
      jongno:       ['flashlight',    'knife'],
      junggoo:      ['canned_food',   'cloth'],
      jungrang:     ['rope',          'cloth'],
      nowon:        ['canned_food',   'rope'],
    };

    return [...base, ...(regional[districtId] ?? ['knife', 'scrap_metal'])];
  },
};

export default CharCreate;
