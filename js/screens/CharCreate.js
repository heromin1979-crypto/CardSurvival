// === CHARACTER CREATION SCREEN ===
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import StateMachine    from '../core/StateMachine.js';
import I18n            from '../core/I18n.js';
import { DISTRICTS, getAdjacentDistricts } from '../data/districts.js';
import { CHARACTERS }  from '../data/characters.js';
import { LEVEL_XP_TABLE } from '../data/skillDefs.js';
import EquipmentSystem from '../systems/EquipmentSystem.js';
import GameData        from '../data/GameData.js';

const DANGER_COLORS = ['#336633', '#4a7a33', '#886622', '#882222', '#550000', '#330000'];

const CharCreate = {
  _selectedChar:     null,
  _selectedDistrict: null,

  init() {
    this._el = document.getElementById('screen-char-create');
    EventBus.on('stateTransition', ({ to }) => {
      if (to === 'char_create') {
        this._selectedChar     = null;
        this._selectedDistrict = null;
        this._render();
      }
    });
    EventBus.on('languageChanged', () => {
      if (this._el?.classList.contains('active')) this._render();
    });
  },

  _render() {
    if (!this._el) return;

    const charGridHtml = this._buildCharGrid();
    const charDetail   = this._buildCharDetail();

    this._el.innerHTML = `
      <div class="charcreate-layout">
        <div class="charcreate-scroll">

          <div class="menu-title" style="text-align:center; margin-bottom:4px;">${I18n.t('charCreate.title')}</div>

          <!-- 캐릭터 선택 -->
          <div class="form-group">
            <label class="form-label">${I18n.t('charCreate.jobSelect')}</label>
            <div class="char-grid">${charGridHtml}</div>
          </div>

          <!-- 캐릭터 상세 패널 -->
          <div class="char-detail ${this._selectedChar ? 'visible' : ''}" id="char-detail-panel">
            ${charDetail}
          </div>

          <hr class="divider">

          <div style="font-size:10px; color:var(--text-dim); text-align:center;">
            ${I18n.t('charCreate.hardcoreWarning')}
          </div>

          <button class="menu-btn primary" id="btn-start">${I18n.t('charCreate.start')}</button>
          <button class="menu-btn" id="btn-back-menu">${I18n.t('charCreate.back')}</button>

        </div>
      </div>
    `;

    // 캐릭터 카드 클릭
    this._el.querySelectorAll('.char-card').forEach(card => {
      card.addEventListener('click', () => {
        const charId = card.dataset.charId;
        this._selectedChar = CHARACTERS.find(c => c.id === charId) ?? null;
        if (this._selectedChar?.homeDist) {
          this._selectedDistrict = this._selectedChar.homeDist;
        }
        this._render();
      });
    });

    // 시작
    this._el.querySelector('#btn-start')?.addEventListener('click', () => {
      if (!this._selectedChar) {
        EventBus.emit('notify', { message: I18n.t('charCreate.selectJob'), type: 'warn' });
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
        <div class="char-card-name">${I18n.characterName(c.id, c.name)}</div>
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
        <span><span class="ability-name">${a.name}</span>— ${a.desc}</span>
      </li>
    `).join('');

    return `
      <div class="char-detail-header">
        <div>
          <div class="char-detail-name">${I18n.characterName(c.id, c.name)}</div>
          <div class="char-detail-title">${c.title}</div>
          <div class="char-base-stats">
            <span class="char-stat-badge hp">HP ${c.maxHp}</span>
            <span class="char-stat-badge str">${I18n.t('charCreate.strength')} ${c.strength}</span>
            <span class="char-stat-badge end">${I18n.t('charCreate.endurance')} ${c.endurance}</span>
            <span class="char-stat-badge sta">${I18n.t('charCreate.stamina')} ${Math.round(c.strength * c.endurance / 50)}</span>
            <span class="char-stat-badge wt">${c.maxCarryWeight}kg</span>
          </div>
        </div>
      </div>
      <div class="char-story">${c.story}</div>
      <ul class="char-ability-list">${abilitiesHtml}</ul>
      <div class="char-goal">${c.goal}</div>
      <div class="char-start-location" style="margin-top:6px; padding:4px 8px; background:var(--bg-card); border-radius:4px; font-size:11px; color:var(--text-secondary);">
        ${I18n.t('charCreate.startLoc')}: ${DISTRICTS[c.homeDist]?.icon ?? ''} ${I18n.districtName(c.homeDist, DISTRICTS[c.homeDist]?.name ?? c.homeDist)} — ${DISTRICTS[c.homeDist]?.description ?? ''}
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
    // 체력·인내심 → 스태미나 계산: stamina = strength × (endurance / 50)
    gs.player.strength  = char.strength  ?? 60;
    gs.player.endurance = char.endurance ?? 60;
    const maxStamina = Math.round(gs.player.strength * gs.player.endurance / 50);
    gs.stats.stamina = { current: maxStamina, max: maxStamina, decayPerTP: 0 };
    gs.player.deathCause  = null;
    gs.player.hp          = { current: char.maxHp, max: char.maxHp };
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

    // ── 캐릭터 시작 스킬 적용 ────────────────────────────────
    // startingSkills: { skillId: targetLevel } — XP를 해당 레벨 임계값으로 설정
    if (char.startingSkills) {
      for (const [skillId, targetLevel] of Object.entries(char.startingSkills)) {
        const skill = gs.player.skills[skillId];
        if (skill && targetLevel >= 1 && targetLevel <= 20) {
          skill.xp    = LEVEL_XP_TABLE[targetLevel] ?? 0;
          skill.level = targetLevel;
        }
      }
    }

    // ── 보드·카드 초기화 ─────────────────────────────────────
    gs.board = {
      top:         [null, null, null, null, null, null, null, null],
      environment: [null, null, null],
      middle:      [null, null, null, null, null, null, null, null],
      bottom:      [null, null, null, null, null, null, null, null],
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

    // ── 캐릭터별 시작 조건 및 스토리 플래그 ────────────────────
    const charStartConditions = {
      doctor:      { infection: 5, morale: 75, flags: { samsung_hospital_survivor: true } },
      soldier:     { morale: 65, flags: { gwanghwamun_retreat: true } },
      firefighter: { fatigue: 20, morale: 60, flags: { jaehoon_infected: true } },
      homeless:    { morale: 80, flags: { bridge_dweller: true } },
      pharmacist:  { infection: 3, morale: 70, flags: { hongdae_pharmacy_owner: true } },
      engineer:    { morale: 72, flags: { seongsu_factory_owner: true } },
    };

    const startCond = charStartConditions[char.id];
    if (startCond) {
      if (startCond.infection !== undefined) gs.stats.infection.current = startCond.infection;
      if (startCond.morale !== undefined)    gs.stats.morale.current = startCond.morale;
      if (startCond.fatigue !== undefined)   gs.stats.fatigue.current = startCond.fatigue;
      if (startCond.flags) {
        for (const [key, val] of Object.entries(startCond.flags)) {
          gs.flags[key] = val;
        }
      }
    }

    // ── 신규 시스템 리셋 ─────────────────────────────────────
    gs.player.diseases = [];
    gs.season = { current: 'spring', eventsTriggered: [] };
    gs.weather = { id: 'sunny', name: '맑음', icon: '☀️', tempMod: 0, tpRemaining: 72, tempJitter: 0 };

    // ── 위치: 선택한 구로 설정 ───────────────────────────────
    gs.location.currentDistrict  = districtId;
    gs.location.currentNode      = districtId;
    gs.location.nodesVisited     = [districtId];
    gs.location.districtsVisited = [districtId];
    gs.location.districtsLooted  = [];

    // ── 상단 행: 현재 구 카드 + 인접 구 카드 배치 ────────────
    const items = GameData?.items ?? {};

    const currentDefId = `loc_${districtId}`;
    if (items[currentDefId]) {
      const inst = gs.createCardInstance(currentDefId);
      if (inst) gs.board.top[0] = inst.instanceId;
    }

    // 랜드마크 카드 → top[1] (현재 위치 바로 오른쪽)
    const districts = GameData?.districts ?? {};
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
    const starters = this._getStarterItems();
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

    // ── 중간행: 바닥 아이템 배치 ──────────────────────────────
    const floorItems = this._getDistrictFloorItems(districtId);
    for (const defId of floorItems) {
      const def = items[defId];
      if (!def) continue;
      const inst = gs.createCardInstance(defId);
      if (inst) gs.placeCardInRow(inst.instanceId, 'middle');
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

  _getStarterItems() {
    return ['water_bottle'];
  },

  // ── 지역별 바닥(중간행) 아이템 ──────────────────────────────

  _getDistrictFloorItems(districtId) {
    // 각 지역 바닥에는 캠프파이어 재료(고철+천) + 식량 + 의료 + 도구 보장
    const floorItems = {
      // ── 한강변 주거 (동작 — 의사 시작) ──
      dongjak: [
        'broken_chair', 'old_fire_extinguisher',
        'scrap_metal', 'cloth', 'cloth', 'canned_food', 'bandage', 'rope',
      ],
      // ── 산악 외곽 (도봉 — 군인 시작) ──
      dobong: [
        'broken_chair', 'collapsed_shelf',
        'scrap_metal', 'wood', 'rope', 'cloth', 'canned_food', 'bandage',
      ],
      // ── 북한산 외곽 (은평 — 소방관 시작) ──
      eunpyeong: [
        'rusted_toolbox', 'broken_lamp',
        'scrap_metal', 'rope', 'cloth', 'bandage', 'wood', 'canned_food',
      ],
      // ── 목동 주거 (양천 — 노숙자 시작) ──
      yangcheon: [
        'broken_chair', 'old_fire_extinguisher',
        'cloth', 'canned_food', 'rope', 'scrap_metal', 'bandage', 'wood',
      ],
      // ── 대학가 (관악 — 약사 시작) ──
      gwanak: [
        'collapsed_shelf', 'broken_lamp',
        'cloth', 'canned_food', 'rope', 'bandage', 'scrap_metal', 'wood',
      ],
      // ── 아파트 단지 (노원 — 엔지니어 시작) ──
      nowon: [
        'old_generator', 'rusted_toolbox',
        'scrap_metal', 'cloth', 'wire', 'rope', 'canned_food', 'bandage',
      ],
    };
    return floorItems[districtId] ?? [
      'broken_chair', 'old_fire_extinguisher',
      'scrap_metal', 'cloth', 'canned_food', 'rope', 'bandage', 'wood',
    ];
  },
};

export default CharCreate;
