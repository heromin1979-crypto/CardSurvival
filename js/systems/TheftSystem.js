// === THEFT SYSTEM (Phase 4) ===
// 동물 도난: 바닥(middle)에 둔 음식을 동물이 일 1회 확률로 물어가 '동물 둥지(animal_nest)' 카드로 옮긴다.
// 둥지를 '뒤지기'하면 도둑맞은 물건을 되찾는다. 베이스캠프(보안 거점)에선 도난이 일어나지 않는다.
// 비부패성(금속·섬유 등)은 음식이 아니라 도난 대상이 아니므로 바닥에 영구 보관 가능(야외 창고).
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData  from '../data/GameData.js';
import BALANCE   from '../data/gameBalance.js';

const FOOD_SUB = new Set(['food', 'drink', 'food_raw', 'carcass']);

const TheftSystem = {
  init() {
    EventBus.on('dayEnd', () => this.onDayEnd());
  },

  /** 일 1회 — 현재 위치 바닥 음식 1스택을 확률로 도난 → 둥지 카드 생성 */
  onDayEnd() {
    const gs = GameState;
    if (!gs.player?.isAlive) return;
    if (gs.location?.currentLandmark === 'basecamp') return;  // 보안 거점 — 도난 없음

    // 바닥(middle)의 음식 후보 수집
    const candidates = [];
    for (const id of gs.board?.middle ?? []) {
      if (!id) continue;
      const inst = gs.cards[id];
      const def  = GameData?.items?.[inst?.definitionId];
      if (def?.type === 'consumable' && FOOD_SUB.has(def.subtype)) candidates.push(inst);
    }
    if (!candidates.length) return;
    if (Math.random() >= (BALANCE.theft?.dailyChance ?? 0.15)) return;

    // 1스택 도난
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const stolen = { definitionId: target.definitionId, quantity: target.quantity ?? 1 };
    const name   = GameData?.items?.[target.definitionId]?.name ?? target.definitionId;
    gs.removeCardInstance(target.instanceId);

    // 둥지 카드 생성 + 도난물 보관 (음식 제거로 슬롯이 비어 배치 가능)
    const nest = gs.createCardInstance('animal_nest');
    if (nest) {
      nest._stolenLoot = [stolen];
      const placed = gs.placeCardInRow(nest.instanceId, 'middle');
      if (!placed) {
        // 둥지 배치 실패(만차) → 도난물 pendingLoot로 보존(분실 방지)
        (gs.removeCardInstanceSilent || gs.removeCardInstance)?.call(gs, nest.instanceId);
        if (!gs.pendingLoot) gs.pendingLoot = [];
        gs.pendingLoot.push({ ...stolen, contamination: 0 });
        return;
      }
    }
    EventBus.emit('notify', { message: `🐀 들짐승이 ${name}을(를) 물어가 둥지에 숨겼습니다. 둥지를 뒤져 되찾으세요.`, type: 'warning' });
    EventBus.emit('boardChanged', {});
    EventBus.emit('saveGame');
  },

  /** 둥지 뒤지기 — 보관된 도난물을 보드로 되돌리고 둥지 제거 */
  recoverNest(instanceId) {
    const gs = GameState;
    const inst = gs.cards[instanceId];
    if (!inst?._stolenLoot?.length) {
      EventBus.emit('notify', { message: '빈 둥지입니다.', type: 'warn' });
      return { success: false };
    }
    const recovered = [];
    for (const it of inst._stolenLoot) {
      const ni = gs.createCardInstance(it.definitionId, { quantity: it.quantity ?? 1 });
      if (!ni) continue;
      if (gs.placeCardInRow(ni.instanceId, 'middle')) {
        recovered.push(GameData?.items?.[it.definitionId]?.name ?? it.definitionId);
      } else {
        (gs.removeCardInstanceSilent || gs.removeCardInstance)?.call(gs, ni.instanceId);
        if (!gs.pendingLoot) gs.pendingLoot = [];
        gs.pendingLoot.push({ definitionId: it.definitionId, quantity: it.quantity ?? 1, contamination: 0 });
        recovered.push(GameData?.items?.[it.definitionId]?.name ?? it.definitionId);
      }
    }
    inst._stolenLoot = [];
    gs.removeCardInstance(instanceId);  // 빈 둥지 제거
    EventBus.emit('notify', { message: `🪺 둥지를 뒤져 ${recovered.join(', ')}을(를) 되찾았습니다.`, type: 'good' });
    EventBus.emit('boardChanged', {});
    EventBus.emit('saveGame');
    return { success: true, recovered };
  },
};

export default TheftSystem;
