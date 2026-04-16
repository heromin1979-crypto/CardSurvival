import CHEF_SHARED   from './shared.js';
import CHEF_BRANCH_A from './branch_a.js';
import CHEF_BRANCH_B from './branch_b.js';

const CHEF_QUESTS = {
  ...CHEF_SHARED,
  ...CHEF_BRANCH_A,
  ...CHEF_BRANCH_B,
};

export default CHEF_QUESTS;
