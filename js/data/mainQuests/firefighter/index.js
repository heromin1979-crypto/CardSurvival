import FIREFIGHTER_SHARED   from './shared.js';
import FIREFIGHTER_BRANCH_A from './branch_a.js';
import FIREFIGHTER_BRANCH_B from './branch_b.js';

const FIREFIGHTER_QUESTS = {
  ...FIREFIGHTER_SHARED,
  ...FIREFIGHTER_BRANCH_A,
  ...FIREFIGHTER_BRANCH_B,
};

export default FIREFIGHTER_QUESTS;
