import GameState from '../core/GameState.js';
import EventBus from '../core/EventBus.js';
import TickEngine from '../core/TickEngine.js';
import AutoSave from '../persistence/AutoSave.js';
import GameData from '../data/GameData.js';
import PROJECTS, { createCareerProjectState, PROJECT_RECOVERY } from '../data/careerProjects.js';
import SeasonSystem from './SeasonSystem.js';
import NPCS from '../data/npcs.js';

const name = id => GameData.items[id]?.name ?? id;
// 날음식·통조림 보유를 요리 제공으로 세지 않는다.
export const SERVABLE_FOOD = ['cooked_rice', 'cooked_noodles', 'mushroom_soup', 'nettle_stew', 'vegetable_stew', 'meat_stew', 'fish_cooked', 'cooked_meat', 'chef_meal_kit', 'hearty_stew', 'recovery_stew', 'special_soup', 'kimchi_stew', 'soybean_stew', 'cream_soup', 'garden_salad', 'hangover_soup', 'fish_cake_stew'];
const progress = () => GameState.flags.careerProjects ?? createCareerProjectState();
const POWER_CAPACITY = 6;
const powerReason = (spec, available) => spec.powerCost > available ? `지역 전력 부족: 운영 가능 ${available}회 / 필요 ${spec.powerCost}회` : available + (spec.powerOutput ?? 0) > POWER_CAPACITY ? '지역 전력 저장 한도 6회: 먼저 설비를 운영하세요.' : '';
function applyPower(spec, districtId) {
  const pools = GameState.flags.careerProjects.districtPower ??= {};
  if (spec.powerCost || spec.powerOutput) pools[districtId] = (pools[districtId] ?? 0) - (spec.powerCost ?? 0) + (spec.powerOutput ?? 0);
}
const cards = () => [...new Set([...(GameState.board.middle ?? []), ...(GameState.board.bottom ?? [])])]
  .map(id => GameState.cards[id]).filter(c => c && !c._crafting && (c.durability == null || c.durability > 0));

function planConsumption(requirements, foodCount = 0) {
  const available = cards().map(c => ({ ...c }));
  const consumption = [], missing = [];
  for (const req of [...requirements, ...(foodCount ? [{ food: true, qty: foodCount }] : [])]) {
    let remaining = req.qty;
    for (const card of available) {
      if (req.food ? !SERVABLE_FOOD.includes(card.definitionId) : card.definitionId !== req.definitionId) continue;
      const qty = Math.min(remaining, card.quantity ?? 1);
      if (qty > 0) consumption.push({ instanceId: card.instanceId, definitionId: card.definitionId, qty });
      card.quantity = (card.quantity ?? 1) - qty;
      remaining -= qty;
    }
    if (remaining) missing.push(`${req.food ? '조리한 식사' : name(req.definitionId)} ×${remaining}`);
  }
  return { consumption, missing };
}
function consume(consumption) {
  for (const input of consumption) {
    const card = GameState.cards[input.instanceId];
    card.quantity = (card.quantity ?? 1) - input.qty;
    if (!card.quantity) GameState.removeCardInstanceSilent(card.instanceId);
  }
  GameState._updateEncumbrance();
}
function deliver(items = []) {
  // 만차여도 수령 권리를 먼저 기록한다. 기존 대기열이 슬롯·스택 배치를 담당한다.
  GameState.pendingLoot.push(...items.map(item => ({ definitionId: item.definitionId, quantity: item.qty, contamination: 0 })));
  GameState.flushPendingLoot();
}
export function clinicalPatients() {
  return new Set([...Object.entries(GameState.npcs?.states ?? {}).filter(([, s]) => s.healed).map(([id]) => id), ...(GameState.questProgress?.treatedNpcs ?? [])]);
}

const CareerProjectSystem = {
  _offs: [],
  init() {
    this._offs.forEach(off => off());
    this._offs = [EventBus.on('craftComplete', ({ blueprintId }) => {
      const bp = GameData.blueprints[blueprintId];
      const state = GameState.flags.careerProjects ??= createCareerProjectState();
      const outputs = Array.isArray(bp?.output) ? bp.output : bp?.output ? [bp.output] : [];
      for (const item of outputs) state.crafted[item.definitionId] = (state.crafted[item.definitionId] ?? 0) + (item.qty ?? 1);
    }), EventBus.on('npcTradeCompleted', ({ npcId }) => {
      const state = GameState.flags.careerProjects ??= createCareerProjectState();
      state.trades[npcId] = (state.trades[npcId] ?? 0) + 1;
    }), EventBus.on('supplyUsed', ({ supplyId }) => {
      const state = GameState.flags.careerProjects ??= createCareerProjectState();
      state.supplies[supplyId] = (state.supplies[supplyId] ?? 0) + 1;
    })];
  },

  inspect(projectId) {
    const def = PROJECTS[projectId], state = progress().projects[projectId];
    if (!def) return { ok: false, reason: '알 수 없는 프로젝트', actions: [] };
    let reason = '';
    if (GameState.player.isAlive === false || (GameState.player.hp?.current ?? 1) <= 0) reason = '사망한 상태에서는 작업할 수 없습니다.';
    else if (GameState.combat?.active || !['main', 'explore'].includes(GameState.ui.currentState)) reason = '현재 행동을 마친 뒤 이용하세요.';
    else if (GameState.location.currentDistrict !== def.districtId) reason = `${GameData.districts[def.districtId]?.name ?? def.districtId}에서 작업하세요.`;
    else if (!GameState.quests.active.some(q => q.id === def.questId) && !GameState.quests.completed.includes(def.questId)) reason = '해당 퀘스트의 선행 과정을 먼저 진행하세요.';
    else if ((def.requires ?? []).some(id => !progress().projects[id]?.active)) reason = '선행 프로젝트 가동 필요';
    const actions = def.actions.map(action => {
      const installed = Boolean(state?.installedInputs?.[action.id]);
      const plan = planConsumption(action.items, action.foodCount);
      const fuelCapacityReason = def.powerOutput && action.items.some(i => i.definitionId === 'fuel_can') ? powerReason(def, progress().districtPower?.[def.districtId] ?? 0) : '';
      const actionReason = reason || (state?.active ? '가동 완료' : installed ? '이미 투입했습니다.' : fuelCapacityReason || (plan.missing.length ? `부족: ${plan.missing.join(', ')}` : ''));
      return { ...action, ...plan, installed, ok: !actionReason, reason: actionReason };
    });
    let activationReason = reason || (state?.active ? '이미 가동했습니다.' : actions.some(a => !a.installed) ? '모든 공정과 전원을 먼저 투입하세요.' : '');
    if (!activationReason && (def.operated ?? []).some(id => !(progress().projects[id]?.uses > 0) && !progress().projects[id]?.legacy)) activationReason = '선행 설비를 실제로 1회 운영하세요.';
    if (!activationReason && def.clinicalCount && clinicalPatients().size < def.clinicalCount) activationReason = `완치 임상 경험 ${clinicalPatients().size}/${def.clinicalCount}명`;
    if (!activationReason && def.clinicalProfile && ![...clinicalPatients()].some(id => NPCS[id]?.treatmentProfile === def.clinicalProfile) && clinicalPatients().size < (def.clinicalAlternativeCount ?? Infinity)) activationReason = '복합 외상 완치 또는 생존자 3명 완치 경험 필요 (기존 임상 기록 인정)';
    if (!activationReason && def.crafted && !(progress().crafted[def.crafted] > 0) && !GameState.questProgress?.craftedRecipes?.includes(def.crafted)) activationReason = `${name(def.crafted)} 직접 제작 기록 필요`;
    if (!activationReason && def.bossId && !GameState.flags.bossesKilled?.includes(def.bossId)) activationReason = '0번 환자 표본 출처 확인 필요';
    const powerAvailable = progress().districtPower?.[def.districtId] ?? 0;
    activationReason ||= powerReason(def, powerAvailable);
    const yieldMult = def.operation?.seasonal ? (GameState.weather?.gardenKill ? 0 : SeasonSystem.getModifiers().gardenYieldMult) : 1;
    const operation = yieldMult <= 0 ? (def.operation?.seasonalFallback ?? def.operation) : def.operation;
    const effectiveYield = operation === def.operation ? yieldMult : 1;
    const operationPlan = planConsumption(operation?.costs ?? []);
    const waitTP = Math.max(0, (state?.nextUseTP ?? 0) - GameState.time.totalTP);
    const operationReason = reason || (!state?.active ? '가동 이후 이용할 수 있습니다.' : effectiveYield <= 0 ? '겨울·산성비에는 재배가 중단됩니다. 급식 재료 교환이나 중구 시장 공급처를 이용하세요.' : waitTP ? `재고 보충까지 ${waitTP}TP` : powerReason(operation ?? {}, powerAvailable) || (operationPlan.missing.length ? `부족: ${operationPlan.missing.join(', ')}` : ''));
    const recovery = (def.recovery ?? []).map(id => {
      const costs = Object.entries(PROJECT_RECOVERY[id]).map(([definitionId, qty]) => ({ definitionId, qty }));
      const plan = planConsumption(costs);
      const needed = def.actions.flatMap(a => a.items).filter(i => i.definitionId === id).reduce((n, i) => n + i.qty, 0);
      const recoveryReason = reason || (state?.active ? '공정 완료' : (state?.procured?.[id] ?? 0) >= needed ? '회수 배정량 소진' : plan.missing.length ? `부족: ${plan.missing.join(', ')}` : '');
      return { id, costs, ...plan, ok: !recoveryReason, reason: recoveryReason };
    });
    return { ok: !reason, reason, def, state, actions, powerAvailable, canActivate: !activationReason, activationReason,
      recovery, operation: operation ? { ...operation, ...operationPlan, cooldownTP: Math.ceil(operation.cooldownTP / (effectiveYield || 1)), waitTP, ok: !operationReason, reason: operationReason } : null };
  },

  recover(projectId, itemId) {
    const inspection = this.inspect(projectId), offer = inspection.recovery?.find(o => o.id === itemId);
    if (!offer?.ok) return { ok: false, reason: offer?.reason ?? inspection.reason };
    return AutoSave.deferUntilComplete(() => {
      EventBus.batch(() => {
        const state = GameState.flags.careerProjects ??= createCareerProjectState();
        const entry = state.projects[projectId] ??= { projectId, stageId: inspection.def.stageId, installedInputs: {}, active: false, uses: 0 };
        consume(offer.consumption);
        entry.procured ??= {};
        entry.procured[itemId] = (entry.procured[itemId] ?? 0) + 1;
        deliver([{ definitionId: itemId, qty: 1 }]);
      });
      TickEngine.skipTP(4, '전문 회수품 교환');
      EventBus.emit('boardChanged', {}); EventBus.emit('saveGame');
      return { ok: true };
    });
  },

  contribute(projectId, actionId) {
    const inspection = this.inspect(projectId);
    const action = inspection.actions.find(a => a.id === actionId);
    if (!inspection.ok || !action?.ok) return { ok: false, reason: action?.reason || inspection.reason || '현재 불가능한 공정입니다.' };
    return AutoSave.deferUntilComplete(() => {
      EventBus.batch(() => {
        const state = GameState.flags.careerProjects ??= createCareerProjectState();
        const entry = state.projects[projectId] ??= { projectId, stageId: inspection.def.stageId, installedInputs: {}, active: false, uses: 0 };
        consume(action.consumption);
        entry.installedInputs[actionId] = action.consumption.map(({ definitionId, qty }) => ({ definitionId, qty }));
      });
      EventBus.emit('boardChanged', {});
      EventBus.emit('saveGame');
      return { ok: true };
    });
  },

  activate(projectId) {
    const inspection = this.inspect(projectId);
    if (!inspection.canActivate) return { ok: false, reason: inspection.activationReason ?? inspection.reason };
    return AutoSave.deferUntilComplete(() => {
      const { def, state } = inspection;
      state.active = true;
      applyPower(def, def.districtId);
      for (const id of def.unlockRecipes ?? []) {
        GameState.flags.hiddenRecipesUnlocked ??= [];
        if (!GameState.flags.hiddenRecipesUnlocked.includes(id)) GameState.flags.hiddenRecipesUnlocked.push(id);
      }
      deliver(def.output);
      TickEngine.skipTP(def.tpCost, def.name);
      EventBus.emit('careerProjectCompleted', { projectId, stageId: def.stageId, districtId: def.districtId });
      EventBus.emit('boardChanged', {});
      EventBus.emit('saveGame');
      return { ok: true };
    });
  },

  operate(projectId) {
    const inspection = this.inspect(projectId), operation = inspection.operation;
    if (!operation?.ok) return { ok: false, reason: operation?.reason ?? inspection.reason };
    return AutoSave.deferUntilComplete(() => {
      EventBus.batch(() => {
        consume(operation.consumption);
        applyPower(operation, inspection.def.districtId);
        inspection.state.uses = (inspection.state.uses ?? 0) + 1;
        inspection.state.nextUseTP = GameState.time.totalTP + operation.cooldownTP;
        deliver(operation.items);
      });
      TickEngine.skipTP(operation.tpCost, operation.label);
      EventBus.emit('careerProjectOperated', { projectId, districtId: inspection.def.districtId });
      EventBus.emit('boardChanged', {});
      EventBus.emit('saveGame');
      return { ok: true };
    });
  },
};
export default CareerProjectSystem;
