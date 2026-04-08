// === GAME DATA REGISTRY ===
// 모든 게임 데이터를 조립해 단일 불변 객체로 제공한다.
// window.__GAME_DATA__ 전역을 대체하는 ES 모듈 싱글턴.
//
// 소비 방법:
//   import GameData from '../data/GameData.js';
//   const itemDef = GameData.items[id];

import ITEMS       from './items.js';
import BLUEPRINTS  from './blueprints.js';
import NODES, { DISTRICTS, SUB_LOCATIONS } from './nodes.js';
import ENEMIES     from './enemies.js';
import CHARACTERS  from './characters.js';
import { SECRET_ENEMIES }   from './secretEnemies.js';
import { HIDDEN_LOCATIONS } from './hiddenLocations.js';
import SECRET_EVENTS  from './secretEvents.js';
import HIDDEN_RECIPES from './hiddenRecipes.js';

const GameData = Object.freeze({
  items:           ITEMS,
  blueprints:      { ...BLUEPRINTS, ...HIDDEN_RECIPES },
  nodes:           NODES,
  districts:       DISTRICTS,
  subLocations:    SUB_LOCATIONS,
  enemies:         { ...ENEMIES, ...SECRET_ENEMIES },
  characters:      CHARACTERS,
  hiddenLocations: HIDDEN_LOCATIONS,
  secretEvents:    SECRET_EVENTS,
  hiddenRecipes:   HIDDEN_RECIPES,
});

export default GameData;
