import ENGINEER_SHARED   from './shared.js';
import ENGINEER_BRANCH_A from './branch_a.js';
import ENGINEER_BRANCH_B from './branch_b.js';
import ENGINEER_HIDDEN from './hidden.js';

const ENGINEER_QUESTS = {
  ...ENGINEER_SHARED,
  ...ENGINEER_BRANCH_A,
  ...ENGINEER_BRANCH_B,
  ...ENGINEER_HIDDEN,
};

export default ENGINEER_QUESTS;
