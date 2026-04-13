import HOMELESS_SHARED   from './shared.js';
import HOMELESS_BRANCH_A from './branch_a.js';
import HOMELESS_BRANCH_B from './branch_b.js';

const HOMELESS_QUESTS = {
  ...HOMELESS_SHARED,
  ...HOMELESS_BRANCH_A,
  ...HOMELESS_BRANCH_B,
};

export default HOMELESS_QUESTS;
