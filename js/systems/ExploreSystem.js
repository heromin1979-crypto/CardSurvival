// === EXPLORE SYSTEM (서울 25구 지역 시스템) ===
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine  from '../core/TickEngine.js';
import { NODES, DISTRICTS, generateRouteCards } from '../data/nodes.js';
import { getAdjacentDistricts } from '../data/districts.js';
import { rollEnemyGroup } from '../data/enemies.js';
import NoiseSystem   from './NoiseSystem.js';
import TraitSystem   from './TraitSystem.js';
import StatSystem    from './StatSystem.js';

const ExploreSystem = {
  init() {
    // 베이스캠프 화면에서 보드 위 위치 카드 클릭 시 이동
    EventBus.on('travelRequest', ({ nodeId }) => {
      const screen = document.getElementById('screen-basecamp');
      if (screen && screen.classList.contains('active')) {
        this.travelTo(nodeId);
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

    // 인접 구 카드 → top[1..6]
    const adjacent = getAdjacentDistricts(districtId);
    let slot = 1;
    for (const adj of adjacent) {
      if (slot >= gs.board.top.length - 1) break; // top[7] 예약 (랜드마크)
      const defId = `loc_${adj.id}`;
      if (items[defId]) {
        const inst = gs.createCardInstance(defId);
        if (inst) gs.board.top[slot++] = inst.instanceId;
      }
    }

    // 랜드마크 카드 → top[7] (마지막 고정 슬롯)
    const district = DISTRICTS[districtId];
    const lmDefId  = district?.landmark;
    if (lmDefId && items[lmDefId]) {
      const lmInst = gs.createCardInstance(lmDefId);
      if (lmInst) gs.board.top[7] = lmInst.instanceId;
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

    // TP 소비
    const costTP = district.travelCostTP ?? 2;
    if (costTP > 0) TickEngine.skipTP(costTP, `${district.name}(으)로 이동`);

    // 방사선 (방어구 radiationMult 적용)
    if (district.radiation > 0) {
      StatSystem.applyRadiation(district.radiation);
      gs.flags.nukeZoneEntered = (gs.flags.nukeZoneEntered ?? 0) + 1;
      EventBus.emit('notify', { message: `⚠ 방사선 구역! +${district.radiation}`, type: 'danger' });
    }

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

    TickEngine.skipTP(1, `${district.name} 탐색`);

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

    // 조우 체크
    const baseReduction   = (gs.player.encounterRateReduct ?? 0) + (toolEffects.encounterReduction ?? 0);
    const encounterChance = district.encounterChance * (1 - Math.min(0.80, baseReduction));
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

  // 레거시 stub
  confirmLoot() {},
  discardLoot()  {},
};

export default ExploreSystem;
