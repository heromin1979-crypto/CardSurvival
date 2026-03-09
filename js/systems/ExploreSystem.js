// === EXPLORE SYSTEM (서울 25구 지역 시스템) ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine  from '../core/TickEngine.js';
import { NODES, DISTRICTS, generateRouteCards } from '../data/nodes.js';
import { getAdjacentDistricts } from '../data/districts.js';
import { rollEnemyGroup } from '../data/enemies.js';
import { LANDMARK_DATA } from '../data/landmarks.js';
import NoiseSystem   from './NoiseSystem.js';
import TraitSystem   from './TraitSystem.js';
import StatSystem    from './StatSystem.js';
import SeasonSystem  from './SeasonSystem.js';
import SkillSystem      from './SkillSystem.js';
import BasecampSystem   from './BasecampSystem.js';

const ExploreSystem = {
  init() {
    // 베이스캠프 화면에서 보드 위 위치 카드 클릭 시 이동
    EventBus.on('travelRequest', ({ nodeId }) => {
      const screen = document.getElementById('screen-basecamp');
      if (screen && screen.classList.contains('active')) {
        this.travelTo(nodeId);
      }
    });

    // 세이브 로드 시 현재 구의 top row 카드 갱신
    // (저장 당시 코드 버전 차이로 인접 구 카드가 누락될 수 있음)
    EventBus.on('loaded', () => {
      const districtId = GameState.location.currentDistrict;
      if (districtId) this._updateTopRowCards(districtId);
    });

    // 랜드마크 진입 요청
    EventBus.on('landmarkRequest', ({ districtId }) => {
      const screen = document.getElementById('screen-basecamp');
      if (screen && screen.classList.contains('active')) {
        this.enterLandmark(districtId);
      }
    });

    // 세부 장소 진입 요청
    EventBus.on('sublocationRequest', ({ districtId, subLocationId }) => {
      const screen = document.getElementById('screen-basecamp');
      if (screen && screen.classList.contains('active')) {
        this.enterSubLocation(districtId, subLocationId);
      }
    });

    // 랜드마크 퇴장 요청
    EventBus.on('exitLandmarkRequest', () => {
      const screen = document.getElementById('screen-basecamp');
      if (screen && screen.classList.contains('active')) {
        this.exitLandmark();
      }
    });
  },

  // ── top row 위치 카드 갱신 ─────────────────────────────────
  // 현재 구 + 인접 구 카드를 top row에 배치 (기존 위치 카드 교체)

  _updateTopRowCards(districtId) {
    const gs    = GameState;
    const items = window.__GAME_DATA__?.items ?? {};

    // 기존 top row 위치·랜드마크 카드 제거
    for (let i = 0; i < gs.board.top.length; i++) {
      const instId = gs.board.top[i];
      if (!instId) continue;
      const inst = gs.cards[instId];
      if (!inst) { gs.board.top[i] = null; continue; }
      const def = items[inst.definitionId];
      if (def?.type === 'location') {
        delete gs.cards[instId];
        gs.board.top[i] = null;
      }
    }

    // 현재 구 카드 → top[0]
    const currentDefId = `loc_${districtId}`;
    if (items[currentDefId]) {
      const inst = gs.createCardInstance(currentDefId);
      if (inst) gs.board.top[0] = inst.instanceId;
    }

    // 랜드마크 카드 → top[1] (현재 위치 바로 오른쪽)
    const district = DISTRICTS[districtId];
    const lmDefId  = district?.landmark;
    if (lmDefId && items[lmDefId]) {
      const lmInst = gs.createCardInstance(lmDefId);
      if (lmInst) gs.board.top[1] = lmInst.instanceId;
    }

    // 인접 구 카드 → top[2..7] (구 위치 카드 사용)
    const adjacent = getAdjacentDistricts(districtId);
    let slot = 2;
    for (const adj of adjacent) {
      if (slot >= gs.board.top.length) break;
      const useId = `loc_${adj.id}`;
      if (items[useId]) {
        const inst = gs.createCardInstance(useId);
        if (inst) gs.board.top[slot++] = inst.instanceId;
      }
    }

    gs._updateEncumbrance();
    EventBus.emit('boardChanged', {});
  },

  // ── 지역(구) 간 이동 ──────────────────────────────────────

  travelToDistrict(districtId) {
    const gs       = GameState;
    const district = DISTRICTS[districtId];
    if (!district) return;

    const currentDistrictId = gs.location.currentDistrict;

    // 같은 지역이면 탐색 화면으로 전환
    if (districtId === currentDistrictId) {
      if (gs.ui.currentState !== 'explore') StateMachine.transition('explore');
      return;
    }

    // 인접 지역 검증
    const adjacent   = getAdjacentDistricts(currentDistrictId);
    const isAdjacent = adjacent.some(d => d.id === districtId);
    if (!isAdjacent) {
      EventBus.emit('notify', { message: `${district.name}(으)로는 직접 이동할 수 없다. 인접 지역을 거쳐야 한다.`, type: 'warn' });
      return;
    }

    // ── 이동 제한 체크 ──────────────────────────────────────
    const enc = gs.player.encumbrance;
    const weightPct = enc.weightPct ?? 0;
    if (weightPct >= 2.0) {
      EventBus.emit('notify', {
        message: `⛔ 짐이 너무 무거워 이동할 수 없습니다! (${Math.round(weightPct * 100)}%) 아이템을 버리거나 내려놓아야 합니다.`,
        type: 'danger',
      });
      return;
    }
    const st = gs.stats.stamina;
    if (st && st.current <= 0) {
      EventBus.emit('notify', { message: '💀 기력이 다해 이동할 수 없습니다. 먼저 휴식이 필요합니다.', type: 'danger' });
      return;
    }
    if (st && st.current / st.max < 0.3) {
      EventBus.emit('notify', { message: '😮‍💨 몸을 움직이기 힘들어집니다. (스태미나 30% 미만)', type: 'warn' });
    }

    // TP 소비
    const costTP = district.travelCostTP ?? 2;
    if (costTP > 0) TickEngine.skipTP(costTP, `${district.name}(으)로 이동`);

    // 방사선 (방어구 radiationMult 적용)
    if (district.radiation > 0) {
      StatSystem.applyRadiation(district.radiation);
      gs.flags.nukeZoneEntered = (gs.flags.nukeZoneEntered ?? 0) + 1;
      EventBus.emit('notify', { message: `⚠ 방사선 구역! +${district.radiation}`, type: 'danger' });
    }

    // ── 바닥(중간 행) 위치별 저장 ──────────────────────────
    // 현재 지역 바닥 아이템을 저장하고 새 지역 바닥으로 교체
    if (!gs.locationFloors) gs.locationFloors = {};
    gs.locationFloors[currentDistrictId] = [...gs.board.middle];

    const newFloor = gs.locationFloors[districtId] ?? [];
    const floorSize = gs.board.middle.length;
    gs.board.middle = Array.from({ length: floorSize }, (_, i) => newFloor[i] ?? null);

    // 상태 갱신
    gs.location.currentDistrict = districtId;
    gs.location.currentNode     = districtId;
    if (!gs.location.districtsVisited.includes(districtId)) {
      gs.location.districtsVisited.push(districtId);
    }

    // 특수 방문 플래그
    if (districtId === 'yeongdeungpo') gs.flags.yeongdeungpoVisited = true;
    if (districtId === 'seodaemun')    gs.flags.seodaemunVisited    = true;
    if (districtId === 'songpa')       gs.flags.songpaVisited       = true;
    if (districtId === 'jongno')       gs.flags.jongnoVisited       = true;

    // ── 이동 시 스태미나 소모 ──────────────────────────────
    // 기본 10 × 무게 배율 × 저스태미나 패널티
    const travelWeightMult = StatSystem._getWeightMult(weightPct);
    const lowStaminaMult   = (st && st.current / st.max < 0.3) ? 1.5 : 1;
    StatSystem.drainStamina(Math.ceil(10 * travelWeightMult * lowStaminaMult));

    this._updateTopRowCards(districtId);

    EventBus.emit('notify', { message: `🗺 ${district.name} 도착`, type: 'info' });
    EventBus.emit('districtChanged', { districtId, district });

    // 이동 후 보드 화면(베이스캠프)으로 전환 — explore UI(인접지역 재선택 창) 대신 보드를 보여준다
    StateMachine.transition('basecamp');
  },

  // ── 현재 지역 탐색 ────────────────────────────────────────

  exploreCurrentDistrict() {
    const gs         = GameState;
    const districtId = gs.location.currentDistrict;
    const district   = DISTRICTS[districtId];
    if (!district) return;

    // ── 탐색 이동 제한 체크 ─────────────────────────────────
    const encExp    = gs.player.encumbrance;
    const wPctExp   = encExp.weightPct ?? 0;
    if (wPctExp >= 2.0) {
      EventBus.emit('notify', {
        message: `⛔ 짐이 너무 무거워 탐색할 수 없습니다! (${Math.round(wPctExp * 100)}%)`,
        type: 'danger',
      });
      return;
    }
    const stExp = gs.stats.stamina;
    if (stExp && stExp.current <= 0) {
      EventBus.emit('notify', { message: '💀 기력이 다해 탐색할 수 없습니다. 먼저 휴식이 필요합니다.', type: 'danger' });
      return;
    }
    if (stExp && stExp.current / stExp.max < 0.3) {
      EventBus.emit('notify', { message: '😮‍💨 몸을 움직이기 힘들어집니다. (스태미나 30% 미만)', type: 'warn' });
    }

    TickEngine.skipTP(1, `${district.name} 탐색`);

    // ── 탐색 스태미나 소모 (이동의 절반) ────────────────────
    const expWeightMult   = StatSystem._getWeightMult(wPctExp);
    const expLowStamMult  = (stExp && stExp.current / stExp.max < 0.3) ? 1.5 : 1;
    StatSystem.drainStamina(Math.ceil(5 * expWeightMult * expLowStamMult));

    const toolEffects = this._collectToolEffects();

    // 소음
    const noiseBase = district.noiseGen ?? 3;
    const noiseMult = 1.0 - (toolEffects.noiseMult ?? 0);
    NoiseSystem.addNoise(noiseBase * Math.max(0, noiseMult));

    // 방사선
    if (district.radiation > 0) {
      StatSystem.applyRadiation(district.radiation);
      EventBus.emit('notify', { message: `⚠ 방사선 구역! +${district.radiation}`, type: 'danger' });
    }

    // 조우 체크 (거점 효과 포함)
    const basecampReduct  = BasecampSystem.getEffects().encounterReduct;
    const baseReduction   = (gs.player.encounterRateReduct ?? 0) + (toolEffects.encounterReduction ?? 0) + basecampReduct;
    const encounterChance = district.encounterChance * (1 - Math.min(0.85, baseReduction));
    if (encounterChance > 0 && Math.random() < encounterChance) {
      const noiseLevel = gs.noise.level;
      const enemies    = rollEnemyGroup(district.dangerLevel, noiseLevel);
      StateMachine.transition('encounter', {
        nodeId:      districtId,
        enemies,
        enemy:       enemies[0],
        dangerLevel: district.dangerLevel,
        noiseLevel,
      });
      return;
    }

    this._arriveAtDistrict(districtId, toolEffects);
  },

  _arriveAtDistrict(districtId, toolEffects = null) {
    const gs       = GameState;
    const district = DISTRICTS[districtId];

    gs.location.currentNode = districtId;
    if (!gs.location.nodesVisited.includes(districtId)) {
      gs.location.nodesVisited.push(districtId);
    }

    if (district.lootTable?.length) {
      const looted      = gs.location.districtsLooted ?? [];
      const isFirstLoot = !looted.includes(districtId);
      let loot          = [];

      if (isFirstLoot) {
        loot = generateRouteCards(districtId);
        if (!gs.location.districtsLooted) gs.location.districtsLooted = [];
        gs.location.districtsLooted.push(districtId);
      } else {
        if (Math.random() < 0.20) {
          const full = generateRouteCards(districtId);
          loot = full.slice(0, 1 + Math.floor(Math.random() * 2));
        } else {
          EventBus.emit('notify', { message: `${district.name} — 이미 쓸 만한 건 다 가져갔다.`, type: 'info' });
        }
      }

      if (loot.length > 0) {
        const effects      = toolEffects ?? this._collectToolEffects();
        const exploreBonus = effects.exploreBonus ?? 0;
        if (isFirstLoot && exploreBonus > 0 && Math.random() < exploreBonus) {
          const extra = loot[Math.floor(Math.random() * loot.length)];
          loot.push({ ...extra, quantity: 1 });
        }
        if (isFirstLoot) {
          const traitBonus = TraitSystem.getTraitEffect('scavenger', 'bonusLootCount') ?? 0;
          if (traitBonus > 0) {
            const extra = loot[Math.floor(Math.random() * loot.length)];
            for (let i = 0; i < traitBonus; i++) loot.push({ ...extra, quantity: 1 });
          }
        }
        // 탐색 스킬 보너스 루팅
        if (loot.length > 0) {
          const scavBonus = SkillSystem.getBonus('scavenging', 'extraLootChance');
          if (scavBonus > 0 && Math.random() < scavBonus) {
            const extra = loot[Math.floor(Math.random() * loot.length)];
            loot.push({ ...extra, quantity: 1 });
          }
          // 탐색 마스터리: 5% 희귀 아이템
          if (SkillSystem.hasMastery('scavenging') && Math.random() < 0.05) {
            const rarePool = ['bandage', 'painkiller', 'antiseptic', 'rope', 'wire'];
            const rareId   = rarePool[Math.floor(Math.random() * rarePool.length)];
            if (window.__GAME_DATA__?.items[rareId]) loot.push({ definitionId: rareId, quantity: 1 });
          }
        }
        // 계절 보너스 루팅
        const seasonalLoot = SeasonSystem.rollSeasonalLoot();
        for (const item of seasonalLoot) {
          if (window.__GAME_DATA__?.items[item.definitionId]) {
            loot.push({ definitionId: item.definitionId, quantity: item.quantity });
          }
        }
        this._placeLoot(loot);
      }
    }

    EventBus.emit('notify', { message: `📍 ${district.name} 탐색 완료`, type: 'info' });
    EventBus.emit('locationChanged', { nodeId: districtId, node: district });
    EventBus.emit('boardChanged', {});
  },

  // ── travelTo (보드 위치 카드 클릭 → 위임) ────────────────

  travelTo(nodeId) {
    if (DISTRICTS[nodeId]) {
      this.travelToDistrict(nodeId);
    }
  },

  // ── 전투 후 위치 갱신 ────────────────────────────────────

  arriveAfterCombat(nodeId) {
    const gs   = GameState;
    const node = DISTRICTS[nodeId] ?? NODES[nodeId];
    if (!node) return;

    gs.location.currentNode = nodeId;
    if (!gs.location.nodesVisited.includes(nodeId)) {
      gs.location.nodesVisited.push(nodeId);
    }
    EventBus.emit('notify', { message: `📍 ${node.name} 도착`, type: 'info' });
    EventBus.emit('locationChanged', { nodeId, node });
    EventBus.emit('boardChanged', {});
  },

  // ── 쿼리 헬퍼 ────────────────────────────────────────────

  getAccessibleDistricts() {
    return getAdjacentDistricts(GameState.location.currentDistrict);
  },

  getCurrentSubLocations() {
    return [];
  },

  getCurrentNode() {
    const nodeId = GameState.location.currentNode;
    return DISTRICTS[nodeId] ?? NODES[nodeId] ?? null;
  },

  getNodeList() {
    return Object.values(DISTRICTS);
  },

  // ── 루팅 배치 ────────────────────────────────────────────

  _placeLoot(loot) {
    const gs = GameState;
    if (!loot?.length) {
      EventBus.emit('notify', { message: '아무것도 찾지 못했다.', type: 'info' });
      return;
    }

    const foundNames = [];
    for (const entry of loot) {
      const inst = gs.createCardInstance(entry.definitionId, {
        quantity:      entry.quantity,
        contamination: entry.contamination ?? 0,
      });
      if (!inst) continue;

      const placed = gs.placeCardInRow(inst.instanceId, 'middle');
      if (placed) {
        const def = window.__GAME_DATA__?.items[entry.definitionId];
        foundNames.push(`${def?.icon ?? ''} ${def?.name ?? entry.definitionId}`);
      } else {
        gs.removeCardInstance(inst.instanceId);
      }
    }

    if (foundNames.length > 0) {
      gs.flags.totalItemsFound = (gs.flags.totalItemsFound ?? 0) + foundNames.length;
      // 탐색 스킬 XP: 아이템 발견당 2 XP
      SkillSystem.gainXp('scavenging', foundNames.length * 2);
      EventBus.emit('notify', { message: `발견: ${foundNames.join(', ')}`, type: 'good' });
    } else {
      EventBus.emit('notify', { message: '바닥이 가득 차 아이템을 놓을 수 없다.', type: 'warn' });
    }
  },

  // ── 도구 효과 집산 ───────────────────────────────────────

  _collectToolEffects() {
    const result = { exploreBonus: 0, encounterReduction: 0, noiseMult: 0, scoutBonus: 0 };
    for (const card of GameState.getBoardCards()) {
      const def = GameState.getCardDef(card.instanceId);
      const u   = def?.onUse;
      if (!u) continue;
      if (u.exploreBonus)       result.exploreBonus       += u.exploreBonus;
      if (u.encounterReduction) result.encounterReduction += u.encounterReduction;
      if (u.noiseMult)          result.noiseMult          += u.noiseMult;
      if (u.scoutBonus)         result.scoutBonus         += u.scoutBonus;
    }
    return result;
  },

  // ── 랜드마크 진입 ────────────────────────────────────────

  enterLandmark(districtId) {
    const gs = GameState;
    const lmData = LANDMARK_DATA[districtId];
    if (!lmData) {
      EventBus.emit('notify', { message: '랜드마크 정보를 찾을 수 없습니다.', type: 'warn' });
      return;
    }
    gs.location.currentLandmark    = districtId;
    gs.location.currentSubLocation = null;
    this._updateTopRowForLandmark(districtId);
    EventBus.emit('notify', { message: `🏛 ${lmData.name} 진입`, type: 'info' });
    EventBus.emit('boardChanged', {});
  },

  _updateTopRowForLandmark(districtId) {
    const gs    = GameState;
    const items = window.__GAME_DATA__?.items ?? {};
    const lmData = LANDMARK_DATA[districtId];

    // 기존 top row 위치 카드 모두 제거
    for (let i = 0; i < gs.board.top.length; i++) {
      const instId = gs.board.top[i];
      if (!instId) continue;
      const inst = gs.cards[instId];
      if (!inst) { gs.board.top[i] = null; continue; }
      const def = items[inst.definitionId];
      if (def?.type === 'location') {
        delete gs.cards[instId];
        gs.board.top[i] = null;
      }
    }

    // 귀환 카드 (현재 구 카드) → top[0]
    const returnDefId = `loc_${districtId}`;
    if (items[returnDefId]) {
      const inst = gs.createCardInstance(returnDefId);
      if (inst) gs.board.top[0] = inst.instanceId;
    }

    // 세부 장소 카드 → top[1..N]
    let slot = 1;
    for (const sub of lmData?.subLocations ?? []) {
      if (slot >= gs.board.top.length) break;
      const slDefId = `sl_${sub.id}`;
      if (items[slDefId]) {
        const inst = gs.createCardInstance(slDefId);
        if (inst) gs.board.top[slot++] = inst.instanceId;
      }
    }

    gs._updateEncumbrance();
  },

  // ── 세부 장소 탐색 ───────────────────────────────────────

  enterSubLocation(districtId, subLocationId) {
    const gs     = GameState;
    const lmData = LANDMARK_DATA[districtId];
    const sub    = lmData?.subLocations?.find(s => s.id === subLocationId);
    if (!sub) return;

    gs.location.currentSubLocation = subLocationId;
    gs.location.currentNode        = subLocationId;

    // 과적 체크
    const enc = gs.player.encumbrance;
    if ((enc.weightPct ?? 0) >= 2.0) {
      EventBus.emit('notify', { message: '짐이 너무 무거워 탐색할 수 없습니다!', type: 'danger' });
      return;
    }

    // 스태미나 체크
    const st = gs.stats.stamina;
    if (st && st.current <= 0) {
      EventBus.emit('notify', { message: '기력이 다해 탐색할 수 없습니다.', type: 'danger' });
      return;
    }

    // 1 TP 소비
    TickEngine.skipTP(1, `${sub.name} 탐색`);

    // 소음 생성
    const district  = DISTRICTS[districtId];
    const noiseBase = district?.noiseGen ?? 3;
    NoiseSystem.addNoise(noiseBase * 0.8);

    // 조우 체크
    const baseEncounter = (district?.encounterChance ?? 0) + (sub.dangerMod ?? 0);
    const reduction     = gs.player.encounterRateReduct ?? 0;
    const finalChance   = baseEncounter * (1 - Math.min(0.80, reduction));
    if (finalChance > 0 && Math.random() < finalChance) {
      const enemies = rollEnemyGroup(district?.dangerLevel ?? 1, gs.noise.level);
      StateMachine.transition('encounter', {
        nodeId:      districtId,
        enemies,
        enemy:       enemies[0],
        dangerLevel: district?.dangerLevel ?? 1,
        noiseLevel:  gs.noise.level,
      });
      return;
    }

    // 방사선 체크 (건물 내부는 절반)
    if ((district?.radiation ?? 0) > 0) {
      StatSystem.applyRadiation(district.radiation * 0.5);
    }

    // 루팅 생성 및 배치
    const loot = this._generateSubLocationLoot(sub);
    this._placeLoot(loot);

    // 세부장소 탐색 완료 XP
    SkillSystem.gainXp('scavenging', 3);
    EventBus.emit('notify', { message: `📍 ${sub.name} 탐색 완료`, type: 'info' });
    EventBus.emit('boardChanged', {});
  },

  _generateSubLocationLoot(sub) {
    const table      = sub.lootTable ?? [];
    const [minCount, maxCount] = sub.lootCount ?? [1, 3];
    const count      = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));
    const totalWeight = table.reduce((s, e) => s + e.weight, 0);
    const results    = [];
    const items      = window.__GAME_DATA__?.items ?? {};

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalWeight;
      for (const entry of table) {
        rand -= entry.weight;
        if (rand <= 0) {
          if (!items[entry.id]) break; // 아이템 정의 없으면 스킵
          const contaminated = Math.random() < (entry.contamChance ?? 0);
          results.push({
            definitionId:  entry.id,
            quantity:      1,
            contamination: contaminated ? 60 : 0,
          });
          break;
        }
      }
    }
    return results;
  },

  // ── 랜드마크 퇴장 ────────────────────────────────────────

  exitLandmark() {
    const gs         = GameState;
    const districtId = gs.location.currentLandmark ?? gs.location.currentDistrict;
    gs.location.currentLandmark    = null;
    gs.location.currentSubLocation = null;
    gs.location.currentNode        = districtId;
    this._updateTopRowCards(districtId);
    const district = DISTRICTS[districtId];
    EventBus.emit('notify', { message: `↩ ${district?.name ?? districtId} 귀환`, type: 'info' });
    EventBus.emit('boardChanged', {});
  },

  // 레거시 stub
  confirmLoot() {},
  discardLoot()  {},
};

export default ExploreSystem;
