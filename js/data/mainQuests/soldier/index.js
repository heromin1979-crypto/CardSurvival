import SOLDIER_SHARED   from './shared.js';
import SOLDIER_BRANCH_A from './branch_a.js';
import SOLDIER_BRANCH_B from './branch_b.js';
import SOLDIER_HIDDEN from './hidden.js';

const SOLDIER_QUESTS = {
  ...SOLDIER_SHARED,
  ...SOLDIER_BRANCH_A,
  ...SOLDIER_BRANCH_B,
  ...SOLDIER_HIDDEN,
};

export default SOLDIER_QUESTS;
