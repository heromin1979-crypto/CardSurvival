// === systemBootstrap.mjs ===
// 게임의 27 시스템을 시뮬 환경에서 init.
// SIM_SKIP 분류표 (SYS_SIM_SKIP_classification.md) §3 기준.
// PR2: BOOTSTRAP 14개만 활성화.
// PR2.5에서 UNCERTAIN 16개 spike 후 추가.

import EventBus from '../../../js/core/EventBus.js';

// BOOTSTRAP 31개 — PR2 14 + PR2.5 spike 승급 17
import EndingSystem        from '../../../js/systems/EndingSystem.js';
import StatSystem          from '../../../js/systems/StatSystem.js';
import SeasonSystem        from '../../../js/systems/SeasonSystem.js';
import DiseaseSystem       from '../../../js/systems/DiseaseSystem.js';
import WeatherSystem       from '../../../js/systems/WeatherSystem.js';
import NoiseSystem         from '../../../js/systems/NoiseSystem.js';
import EcologySystem       from '../../../js/systems/EcologySystem.js';
import NPCSystem           from '../../../js/systems/NPCSystem.js';
import NPCRelationSystem   from '../../../js/systems/NPCRelationSystem.js';
import NPCGroupSystem      from '../../../js/systems/NPCGroupSystem.js';
import NPCStorySystem      from '../../../js/systems/NPCStorySystem.js';
import DispatchSystem      from '../../../js/systems/DispatchSystem.js';
import GuardSystem         from '../../../js/systems/GuardSystem.js';
import PatientIntakeSystem from '../../../js/systems/PatientIntakeSystem.js';
import HospitalSiegeSystem from '../../../js/systems/HospitalSiegeSystem.js';
import MentalSystem        from '../../../js/systems/MentalSystem.js';
import BodySystem          from '../../../js/systems/BodySystem.js';
import ContaminationSystem from '../../../js/systems/ContaminationSystem.js';
import EncumbranceSystem   from '../../../js/systems/EncumbranceSystem.js';
import CraftSystem         from '../../../js/systems/CraftSystem.js';
import CombatSystem        from '../../../js/systems/CombatSystem.js';
import FishingSystem       from '../../../js/systems/FishingSystem.js';
import ExploreSystem       from '../../../js/systems/ExploreSystem.js';
import SkillSystem         from '../../../js/systems/SkillSystem.js';
import BasecampSystem      from '../../../js/systems/BasecampSystem.js';
import QuestSystem         from '../../../js/systems/QuestSystem.js';
import HiddenElementSystem from '../../../js/systems/HiddenElementSystem.js';
import TrapSystem          from '../../../js/systems/TrapSystem.js';
import SubwaySystem        from '../../../js/systems/SubwaySystem.js';
import NightSystem         from '../../../js/systems/NightSystem.js';
import NPCQuestSystem      from '../../../js/systems/NPCQuestSystem.js';

// 시뮬 활성 시스템 — main.js init 순서 그대로 (라인 번호 기준 오름차순)
const BOOTSTRAP_ORDER = [
  ['EndingSystem',        EndingSystem,        120],
  ['StatSystem',          StatSystem,          121],
  ['SeasonSystem',        SeasonSystem,        122],
  ['DiseaseSystem',       DiseaseSystem,       123],
  ['WeatherSystem',       WeatherSystem,       124],
  ['NoiseSystem',         NoiseSystem,         125],
  ['EcologySystem',       EcologySystem,       126],
  ['NPCSystem',           NPCSystem,           128],
  ['NPCRelationSystem',   NPCRelationSystem,   129],
  ['NPCGroupSystem',      NPCGroupSystem,      130],
  ['NPCStorySystem',      NPCStorySystem,      131],
  ['DispatchSystem',      DispatchSystem,      136],
  ['GuardSystem',         GuardSystem,         137],
  ['PatientIntakeSystem', PatientIntakeSystem, 140],
  ['HospitalSiegeSystem', HospitalSiegeSystem, 145],
  ['MentalSystem',        MentalSystem,        147],
  ['BodySystem',          BodySystem,          148],
  ['ContaminationSystem', ContaminationSystem, 150],
  ['EncumbranceSystem',   EncumbranceSystem,   151],
  ['CraftSystem',         CraftSystem,         152],
  ['CombatSystem',        CombatSystem,        153],
  ['FishingSystem',       FishingSystem,       154],
  ['ExploreSystem',       ExploreSystem,       155],
  ['SkillSystem',         SkillSystem,         156],
  ['BasecampSystem',      BasecampSystem,      157],
  ['QuestSystem',         QuestSystem,         158],
  ['HiddenElementSystem', HiddenElementSystem, 162],
  ['TrapSystem',          TrapSystem,          163],
  ['SubwaySystem',        SubwaySystem,        168],
  ['NightSystem',         NightSystem,         169],
  ['NPCQuestSystem',      NPCQuestSystem,      189],
];

const UNCERTAIN_DEFERRED = []; // PR2.5 spike 결과 — 17개 모두 BOOTSTRAP 승급

const SKIP_PERMANENT = ['OnboardingSystem', 'SoundSystem', 'BGMSystem', 'CinematicScene'];

let bootstrapped = false;

export function bootstrapSystems() {
  if (bootstrapped) {
    teardownSystems();
  }

  const initResults = [];
  for (const [name, sys, mainLine] of BOOTSTRAP_ORDER) {
    try {
      if (typeof sys.init === 'function') {
        sys.init();
        initResults.push({ name, ok: true, mainLine });
      } else {
        initResults.push({ name, ok: false, error: 'no init() method', mainLine });
      }
    } catch (e) {
      initResults.push({ name, ok: false, error: String(e?.message ?? e), mainLine });
    }
  }

  bootstrapped = true;
  return initResults;
}

export function teardownSystems() {
  // EventBus listeners 전체 해제 후 재구독은 bootstrapSystems 재호출로
  EventBus._listeners = {};

  // 시스템별 _initialized 플래그 reset (HospitalSiegeSystem 패턴)
  if (HospitalSiegeSystem._initialized !== undefined) {
    HospitalSiegeSystem._initialized = false;
  }

  bootstrapped = false;
}

export function getBootstrapOrder() {
  return BOOTSTRAP_ORDER.map(([name, , mainLine]) => ({ name, mainLine }));
}

export function getDeferredSystems() {
  return [...UNCERTAIN_DEFERRED];
}

export function getSkippedSystems() {
  return [...SKIP_PERMANENT];
}

export function isBootstrapped() {
  return bootstrapped;
}
