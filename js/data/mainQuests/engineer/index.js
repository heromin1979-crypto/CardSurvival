import ENGINEER_SHARED   from './shared.js';
import ENGINEER_BRANCH_A from './branch_a.js';
import ENGINEER_BRANCH_B from './branch_b.js';

const ENGINEER_QUESTS = {
  ...ENGINEER_SHARED,
  ...ENGINEER_BRANCH_A,
  ...ENGINEER_BRANCH_B,
};

export default ENGINEER_QUESTS;
