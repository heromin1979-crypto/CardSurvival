import DOCTOR_SHARED   from './shared.js';
import DOCTOR_BRANCH_A from './branch_a.js';
import DOCTOR_BRANCH_B from './branch_b.js';

const DOCTOR_QUESTS = {
  ...DOCTOR_SHARED,
  ...DOCTOR_BRANCH_A,
  ...DOCTOR_BRANCH_B,
};

export default DOCTOR_QUESTS;
