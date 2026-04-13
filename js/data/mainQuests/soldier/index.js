import SOLDIER_SHARED   from './shared.js';
import SOLDIER_BRANCH_A from './branch_a.js';
import SOLDIER_BRANCH_B from './branch_b.js';

const SOLDIER_QUESTS = {
  ...SOLDIER_SHARED,
  ...SOLDIER_BRANCH_A,
  ...SOLDIER_BRANCH_B,
};

export default SOLDIER_QUESTS;
