import HOMELESS_SHARED   from './shared.js';
import HOMELESS_BRANCH_A from './branch_a.js';
import HOMELESS_BRANCH_B from './branch_b.js';
import HOMELESS_HIDDEN from './hidden.js';

const HOMELESS_QUESTS = {
  ...HOMELESS_SHARED,
  ...HOMELESS_BRANCH_A,
  ...HOMELESS_BRANCH_B,
  ...HOMELESS_HIDDEN,
};

export default HOMELESS_QUESTS;
