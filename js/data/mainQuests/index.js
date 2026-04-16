// === MAIN QUESTS INDEX ===
// 캐릭터별 퀘스트 폴더(분기 포함)를 단일 객체로 병합해서 export

import DOCTOR_QUESTS      from './doctor/index.js';
import SOLDIER_QUESTS     from './soldier/index.js';
import FIREFIGHTER_QUESTS from './firefighter/index.js';
import HOMELESS_QUESTS    from './homeless/index.js';
import CHEF_QUESTS        from './chef/index.js';
import ENGINEER_QUESTS    from './engineer/index.js';
import GLOBAL_QUESTS      from './global.js';

const MAIN_QUESTS = {
  ...DOCTOR_QUESTS,
  ...SOLDIER_QUESTS,
  ...FIREFIGHTER_QUESTS,
  ...HOMELESS_QUESTS,
  ...CHEF_QUESTS,
  ...ENGINEER_QUESTS,
  ...GLOBAL_QUESTS,
};

export default MAIN_QUESTS;
