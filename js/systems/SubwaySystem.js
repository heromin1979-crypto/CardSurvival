// === SUBWAY / SEWER TRAVEL SYSTEM ===
// 지하철 노선·하수도 비밀 경로를 통한 장거리 이동
import EventBus     from '../core/EventBus.js';
import GameState    from '../core/GameState.js';
import I18n         from '../core/I18n.js';
import StateMachine from '../core/StateMachine.js';
import TickEngine   from '../core/TickEngine.js';
import StatSystem   from './StatSystem.js';
import { SUBWAY_LINES, SEWER_ROUTES } from '../data/subwayRoutes.js';
import { DISTRICTS }   from '../data/districts.js';
import { rollEnemyGroup } from '../data/enemies.js';

// ── helpers ────────────────────────────────────────────────────

/** Check if a player owns at least one instance of a given item def */
function _hasItem(defId) {
  return Object.values(GameState.cards)
    .some(c => c.definitionId === defId);
}

/** Get player skill level for a given skill id */
function _skillLevel(skillId) {
  return GameState.player.skills?.[skillId]?.level ?? 0;
}

// ── SubwaySystem ───────────────────────────────────────────────

const SubwaySystem = {

  /** Pending multi-station travel state (subway) */
  _pendingTravel: null,

  init() {
    // After combat, resume pending subway travel (if any).
    // Flow: CombatSystem emits combatEnd → this handler fires synchronously
    // → _arriveAtStation / _continueTravel transitions to 'basecamp'
    // → CombatSystem's subsequent combat_result transition silently fails
    //   (basecamp → combat_result not allowed), intentionally skipping the
    //   result screen so subway travel resumes seamlessly.
    EventBus.on('combatEnd', ({ outcome }) => {
      if (!this._pendingTravel) return;
      if (outcome === 'defeat') {
        // Player died; cancel pending travel
        this._pendingTravel = null;
        return;
      }
      if (outcome === 'fled') {
        // Fled combat: abort travel, stay at last reached station
        const pending = this._pendingTravel;
        this._pendingTravel = null;
        this._arriveAtStation(pending.lastReachedStation);
        return;
      }
      // Victory: continue travel to next station
      this._continueTravel();
    });
  },

  // ── Subway line queries ──────────────────────────────────────

  /** Check if a subway line is unlocked for the player */
  isLineUnlocked(lineId) {
    const line = SUBWAY_LINES[lineId];
    if (!line) return false;
    const cond = line.unlockCondition;
    if (!cond) return true;
    if (cond.requiredItem && !_hasItem(cond.requiredItem)) return false;
    if (cond.minDay && GameState.time.day < cond.minDay) return false;
    return true;
  },

  /** Get all subway lines that pass through a district */
  getLinesAtStation(districtId) {
    const results = [];
    for (const [lineId, line] of Object.entries(SUBWAY_LINES)) {
      if (line.stations.includes(districtId)) {
        results.push({ ...line, lineId, unlocked: this.isLineUnlocked(lineId) });
      }
    }
    return results;
  },

  /** Get reachable destinations from a district via a specific line */
  getDestinations(lineId, fromStation) {
    const line = SUBWAY_LINES[lineId];
    if (!line) return [];
    const idx = line.stations.indexOf(fromStation);
    if (idx < 0) return [];
    // All other stations on this line are reachable
    return line.stations
      .filter(s => s !== fromStation)
      .map(s => {
        const route = this.calculateRoute(lineId, fromStation, s);
        return { districtId: s, ...route };
      });
  },

  /** Calculate route between two stations on a line */
  calculateRoute(lineId, fromStation, toStation) {
    const line = SUBWAY_LINES[lineId];
    if (!line) return null;
    const fromIdx = line.stations.indexOf(fromStation);
    const toIdx   = line.stations.indexOf(toStation);
    if (fromIdx < 0 || toIdx < 0) return null;

    const n = line.stations.length;

    if (line.circular) {
      // Circular line: pick shorter direction
      const fwd  = (toIdx - fromIdx + n) % n;
      const back = (fromIdx - toIdx + n) % n;
      const stationCount = Math.min(fwd, back);
      const goForward    = fwd <= back;
      const stationsPath = [];
      for (let i = 1; i <= stationCount; i++) {
        const idx = goForward
          ? (fromIdx + i) % n
          : (fromIdx - i + n) % n;
        stationsPath.push(line.stations[idx]);
      }
      return {
        stations: stationsPath,
        tpCost: stationCount * line.tpCostPerStation,
        encounterChecks: stationCount,
      };
    }

    // Linear line: straightforward path
    const step   = toIdx > fromIdx ? 1 : -1;
    const stationsPath = [];
    for (let i = fromIdx + step; i !== toIdx + step; i += step) {
      stationsPath.push(line.stations[i]);
    }
    return {
      stations: stationsPath,
      tpCost: stationsPath.length * line.tpCostPerStation,
      encounterChecks: stationsPath.length,
    };
  },

  // ── Subway travel execution ──────────────────────────────────

  /** Begin subway travel from current district to destination */
  executeTravel(lineId, toStation) {
    const gs   = GameState;
    const from = gs.location.currentDistrict;
    const line = SUBWAY_LINES[lineId];
    if (!line) return;

    if (!this.isLineUnlocked(lineId)) {
      EventBus.emit('notify', {
        message: I18n.t('subway.locked'),
        type: 'warn',
      });
      return;
    }

    const route = this.calculateRoute(lineId, from, toStation);
    if (!route || route.stations.length === 0) return;

    // Store pending travel state
    this._pendingTravel = {
      lineId,
      line,
      stationsRemaining: [...route.stations],
      lastReachedStation: from,
      totalTP: route.tpCost,
    };

    EventBus.emit('notify', {
      message: I18n.t('subway.tpCost', {
        tp: route.tpCost,
        count: route.stations.length,
      }),
      type: 'info',
    });

    this._continueTravel();
  },

  /** Process the next station in a pending subway journey */
  _continueTravel() {
    const pending = this._pendingTravel;
    if (!pending || pending.stationsRemaining.length === 0) {
      this._pendingTravel = null;
      return;
    }

    const nextStation = pending.stationsRemaining.shift();
    const line        = pending.line;

    // Consume 1 TP per station
    TickEngine.skipTP(line.tpCostPerStation, I18n.t('subway.travel'));

    // Stamina cost per station
    StatSystem.drainStamina(5);

    // Encounter roll
    if (Math.random() < line.encounterChance) {
      pending.lastReachedStation = nextStation;
      const enemies = rollEnemyGroup(line.dangerLevel, GameState.noise.level);
      // Apply darkness accuracy penalty to enemies via combat data
      EventBus.emit('notify', {
        message: I18n.t('subway.darkCombat'),
        type: 'danger',
      });
      StateMachine.transition('encounter', {
        nodeId: nextStation,
        enemies,
        enemy: enemies[0],
        dangerLevel: line.dangerLevel,
        noiseLevel: GameState.noise.level,
        darknessPenalty: true,
        subwayEncounter: true,
      });
      return;
    }

    // No encounter, check if more stations remain
    pending.lastReachedStation = nextStation;
    if (pending.stationsRemaining.length === 0) {
      // Arrived at destination
      this._pendingTravel = null;
      this._arriveAtStation(nextStation);
    } else {
      // Continue to next station
      this._continueTravel();
    }
  },

  /** Arrive at a destination station (district) */
  _arriveAtStation(districtId) {
    const gs       = GameState;
    const district = DISTRICTS[districtId];
    if (!district) return;

    // Save current floor items
    const currentDistrictId = gs.location.currentDistrict;
    if (!gs.locationFloors) gs.locationFloors = {};
    gs.locationFloors[currentDistrictId] = [...gs.board.middle];

    // Load destination floor
    const newFloor  = gs.locationFloors[districtId] ?? [];
    const floorSize = gs.board.middle.length;
    gs.board.middle = Array.from({ length: floorSize }, (_, i) => newFloor[i] ?? null);

    // Update location
    gs.location.currentDistrict = districtId;
    gs.location.currentNode     = districtId;
    if (!gs.location.districtsVisited.includes(districtId)) {
      gs.location.districtsVisited.push(districtId);
    }

    // Special visit flags
    if (districtId === 'yeongdeungpo') gs.flags.yeongdeungpoVisited = true;
    if (districtId === 'seodaemun')    gs.flags.seodaemunVisited    = true;
    if (districtId === 'songpa')       gs.flags.songpaVisited       = true;
    if (districtId === 'jongno')       gs.flags.jongnoVisited       = true;

    // Clear landmark state
    gs.location.currentLandmark    = null;
    gs.location.currentSubLocation = null;

    EventBus.emit('notify', {
      message: I18n.t('subway.arrived', {
        name: I18n.districtName(districtId, district.name),
      }),
      type: 'good',
    });
    EventBus.emit('districtChanged', { districtId, district });
    EventBus.emit('subwayTravelComplete', { districtId });

    // Transition to basecamp (triggers top row card refresh)
    StateMachine.transition('basecamp');
  },

  // ── Sewer route queries ──────────────────────────────────────

  /** Check if a sewer route is unlocked */
  isSewerUnlocked(sewerId) {
    const route = SEWER_ROUTES[sewerId];
    if (!route) return false;
    const cond = route.unlockCondition;
    if (!cond) return true;
    if (cond.requiredItem && !_hasItem(cond.requiredItem)) return false;
    if (cond.minDay && GameState.time.day < cond.minDay) return false;
    if (cond.minSkill) {
      for (const [skillId, reqLevel] of Object.entries(cond.minSkill)) {
        if (_skillLevel(skillId) < reqLevel) return false;
      }
    }
    return true;
  },

  /** Get available sewer routes from a district */
  getAvailableSewers(districtId) {
    const results = [];
    for (const [sewerId, route] of Object.entries(SEWER_ROUTES)) {
      if (route.from === districtId || route.to === districtId) {
        const dest = route.from === districtId ? route.to : route.from;
        results.push({
          ...route,
          sewerId,
          destination: dest,
          unlocked: this.isSewerUnlocked(sewerId),
        });
      }
    }
    return results;
  },

  // ── Sewer travel execution ───────────────────────────────────

  /** Execute sewer travel (single hop, no multi-station) */
  executeSewerTravel(sewerId) {
    const gs    = GameState;
    const route = SEWER_ROUTES[sewerId];
    if (!route) return;

    if (!this.isSewerUnlocked(sewerId)) {
      EventBus.emit('notify', {
        message: I18n.t('subway.sewerLocked'),
        type: 'warn',
      });
      return;
    }

    const currentDistrict = gs.location.currentDistrict;
    const dest = route.from === currentDistrict ? route.to : route.from;

    // TP cost
    TickEngine.skipTP(route.tpCost, I18n.t('subway.sewer'));

    // Stamina drain (heavier than subway)
    StatSystem.drainStamina(15);

    // Radiation
    if (route.radiation > 0) {
      StatSystem.applyRadiation(route.radiation);
      EventBus.emit('notify', {
        message: I18n.t('exploreSys.radZone', { val: route.radiation }),
        type: 'danger',
      });
    }

    // Encounter check
    if (Math.random() < route.encounterChance) {
      const enemies = rollEnemyGroup(route.dangerLevel, gs.noise.level);
      EventBus.emit('notify', {
        message: I18n.t('subway.darkCombat'),
        type: 'danger',
      });
      // After combat, land at destination
      this._pendingTravel = {
        lineId: null,
        line: null,
        stationsRemaining: [],
        lastReachedStation: dest,
        totalTP: 0,
      };
      StateMachine.transition('encounter', {
        nodeId: dest,
        enemies,
        enemy: enemies[0],
        dangerLevel: route.dangerLevel,
        noiseLevel: gs.noise.level,
        darknessPenalty: true,
        sewerEncounter: true,
      });
      return;
    }

    // No encounter: arrive directly
    this._arriveAtStation(dest);
  },
};

export default SubwaySystem;
