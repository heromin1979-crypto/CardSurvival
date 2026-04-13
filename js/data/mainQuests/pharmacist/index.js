import PHARMACIST_SHARED   from './shared.js';
import PHARMACIST_BRANCH_A from './branch_a.js';
import PHARMACIST_BRANCH_B from './branch_b.js';

const PHARMACIST_QUESTS = {
  ...PHARMACIST_SHARED,
  ...PHARMACIST_BRANCH_A,
  ...PHARMACIST_BRANCH_B,
};

export default PHARMACIST_QUESTS;
