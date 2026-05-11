// === reporters/index.mjs ===
// 6 리포터 통합 진입점.

import { summarizeSurvivalRate }     from './survivalRate.mjs';
import { summarizeDeathDay }         from './deathDay.mjs';
import { summarizeReachableContent } from './reachableContent.mjs';
import { summarizeMoraleDespair }    from './moraleDespair.mjs';
import { summarizeEventOverlap }     from './eventOverlap.mjs';
import { summarizeResourceOverTime } from './resourceOverTime.mjs';

export function summarizeAll(traces) {
  return {
    survivalRate:     summarizeSurvivalRate(traces),
    deathDay:         summarizeDeathDay(traces),
    reachableContent: summarizeReachableContent(traces),
    moraleDespair:    summarizeMoraleDespair(traces),
    eventOverlap:     summarizeEventOverlap(traces),
    resourceOverTime: summarizeResourceOverTime(traces),
  };
}

export {
  summarizeSurvivalRate,
  summarizeDeathDay,
  summarizeReachableContent,
  summarizeMoraleDespair,
  summarizeEventOverlap,
  summarizeResourceOverTime,
};
