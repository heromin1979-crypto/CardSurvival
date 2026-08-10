import CHEF_SHARED   from './shared.js';
import CHEF_BRANCH_A from './branch_a.js';
import CHEF_BRANCH_B from './branch_b.js';
import CHEF_HIDDEN from './hidden.js';

const CHEF_QUESTS = {
  ...CHEF_SHARED,
  ...CHEF_BRANCH_A,
  ...CHEF_BRANCH_B,
  ...CHEF_HIDDEN,
};

export default CHEF_QUESTS;
