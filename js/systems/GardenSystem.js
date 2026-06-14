// === GARDEN SYSTEM ===
// 텃밭(garden_bed_*) 자동 수확. 통발(FishingSystem) 패턴 차용 — board에 설치된 텃밭 카드가
// def.harvest = { itemId, harvestDays, qty } 를 가지면, 매 TP 성장치(_growthTp)를 누적하다
// harvestDays(×72TP) 도달 시 작물 카드를 자동 산출한다.
//
// 성장 속도 = 계절 배율(SeasonSystem.gardenYieldMult: 겨울 0 → 정지) × 경과 TP. 산성비(weather.gardenKill) 시 정지.
// 경과 보정(catch-up): _lastGrowTP로 마지막 처리 TP를 기록해, 베이스캠프를 비운 동안의 TP도 복귀 시 반영한다.
// (그 구간 계절 배율은 현재 계절로 근사한다.)
//
// 영속성: _growthTp·_lastGrowTP는 카드 인스턴스 필드라 GameState.cards 직렬화로 세이브에 보존된다.
import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import GameData    from '../data/GameData.js';
import SeasonSystem from './SeasonSystem.js';
import SkillSystem  from './SkillSystem.js';

const TP_PER_DAY = 72;
const MAX_HARVESTS_PER_TICK = 12;  // 장기 미접속 후 폭주 방지 캡

const GardenSystem = {
  init() {
    EventBus.on('tpAdvance', () => this.tick());
  },

  /** 매 TP 호출 — 보드의 텃밭 카드 성장·수확 처리 */
  tick() {
    const gs = GameState;
    const totalTP = gs.time?.totalTP ?? 0;

    // 계절/날씨 성장 배율 (겨울 0, 산성비 0)
    const mods = SeasonSystem.getModifiers?.() ?? {};
    const acidRain = gs.weather?.gardenKill === true;
    const yieldMult = acidRain ? 0 : (mods.gardenYieldMult ?? 1);

    for (const card of gs.getBoardCards()) {
      const def = gs.getCardDef(card.instanceId);
      const h = def?.harvest;
      if (!h || !h.itemId) continue;
      const inst = gs.cards[card.instanceId];
      if (!inst) continue;

      // 경과 보정: 마지막 처리 이후 흐른 TP만큼 성장 누적 (정지 계절이면 누적 0)
      const last = inst._lastGrowTP ?? totalTP;
      const elapsed = Math.max(0, totalTP - last);
      inst._lastGrowTP = totalTP;
      if (inst._growthTp == null) inst._growthTp = 0;
      if (yieldMult > 0 && elapsed > 0) inst._growthTp += elapsed * yieldMult;

      const harvestTp = (h.harvestDays ?? 5) * TP_PER_DAY;
      if (harvestTp <= 0) continue;

      let harvested = 0;
      let n = 0;
      while (inst._growthTp >= harvestTp && n < MAX_HARVESTS_PER_TICK) {
        const out = gs.createCardInstance(h.itemId, { quantity: h.qty ?? 1 });
        const placed = out && gs.placeCardInRow(out.instanceId, 'middle');
        if (!placed) {
          // 보드 만차 → 이번엔 수확 보류(성장치 유지), 다음 tick 재시도. 생성분은 조용히 회수.
          if (out) (gs.removeCardInstanceSilent || gs.removeCardInstance)?.call(gs, out.instanceId);
          break;
        }
        inst._growthTp -= harvestTp;
        harvested += (h.qty ?? 1);
        n += 1;
      }

      if (harvested > 0) {
        SkillSystem.gainXp?.('harvesting', harvested);
        const cropName = GameData?.items?.[h.itemId]?.name ?? h.itemId;
        EventBus.emit('notify', { message: `🌱 ${def.name ?? '텃밭'}에서 ${cropName} ×${harvested} 수확!`, type: 'good' });
        EventBus.emit('boardChanged', {});
        EventBus.emit('saveGame');
      }
    }
  },
};

export default GardenSystem;
