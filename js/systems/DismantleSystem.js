// === DISMANTLE SYSTEM ===
// 카드 분해: 확률 기반으로 재료 아이템을 생성 후 보드에 배치
import EventBus    from '../core/EventBus.js';
import GameState  from '../core/GameState.js';
import I18n        from '../core/I18n.js';
import TickEngine  from '../core/TickEngine.js';
import SkillSystem  from './SkillSystem.js';
import NightSystem  from './NightSystem.js';
import StatSystem   from './StatSystem.js';
import GameData     from '../data/GameData.js';

const TP_PER_DAY = 72;

const DismantleSystem = {

  /**
   * instanceId 카드를 분해하여 재료를 보드에 배치.
   * @param {string} instanceId
   * @param {number} [count=1] 분해할 수량. 스택 카드면 원본 quantity 이하로 제한됨.
   *                            스택의 일부만 분해하면 원본 카드는 quantity가 차감된 채 유지.
   * @returns {{ success: boolean, gained: string[], count: number }}
   */
  dismantle(instanceId, count = 1) {
    const inst = GameState.cards[instanceId];
    if (!inst) return { success: false, gained: [], count: 0 };

    const def = GameState.getCardDef(instanceId);
    if (!def) return { success: false, gained: [], count: 0 };

    const status = this.canDismantleNow(instanceId);
    if (!status.ok) {
      EventBus.emit('notify', { message: status.reason, type: status.type });
      return { success: false, gained: [], count: 0 };
    }

    // 수량 정규화: 1 이상, 원본 quantity 이하
    const stackQty = inst.quantity ?? 1;
    const actualCount = Math.max(1, Math.min(count | 0, stackQty));
    const willRemoveOriginal = actualCount >= stackQty;

    // 빈 슬롯 체크: 분해 결과물이 들어갈 공간이 있는지 확인
    // 원본 카드가 소진되어야만 해당 슬롯이 비는 점을 감안.
    // 매 분해 반복마다 최대 maxOutputs개 카드가 생성될 수 있지만, 같은 종류 재료는
    // placeCardInRow가 스택 병합하므로 실제 필요 슬롯은 훨씬 적다. 초과분은
    // pendingLoot로 폴백되므로 하한선만 보수적으로 요구한다.
    const maxOutputs = def.dismantle.length + (GameState.player.dismantleExtraItem ?? 0);
    const emptySlots = ['middle', 'bottom'].reduce((sum, row) =>
      sum + GameState.board[row].filter(v => v === null).length, 0);
    const availableSlots = emptySlots + (willRemoveOriginal ? 1 : 0);
    if (availableSlots < maxOutputs) {
      EventBus.emit('notify', {
        message: I18n.t('dismantle.noSpace', { need: maxOutputs, have: availableSlots }),
        type: 'warn',
      });
      return { success: false, gained: [], count: 0 };
    }

    // TP 소비 — 남은 TP를 초과하면 자정을 넘겨 다음 날로 이어진다 (제작과 동일)
    const { cost: tpCost } = this.getTpStatus(instanceId, actualCount);
    if (tpCost > 0) {
      TickEngine.skipTP(tpCost, I18n.t('tick.reasonDismantle', { name: I18n.itemName(def.id, def.name), count: actualCount }));
    }

    // 시간이 흐르는 동안 굶주림·질병으로 사망할 수 있다. 사망 후 재료를 배치하지 않는다.
    if (!GameState.player.isAlive) return { success: false, gained: [], count: 0 };

    const gained = [];

    const harvestBonus = SkillSystem.getBonus('harvesting', 'extraMaterialChance');
    const doubleMat    = SkillSystem.hasMastery('harvesting');

    // 매 반복마다 확률·보너스 독립 판정 (각 1개는 별도 분해 시행으로 취급)
    for (let iter = 0; iter < actualCount; iter++) {
      for (const entry of def.dismantle) {
        if (Math.random() < entry.chance) {
          let qty = entry.qty;
          if (doubleMat) qty *= 2;
          else if (harvestBonus > 0 && Math.random() < harvestBonus) qty += 1;

          const newInst = GameState.createCardInstance(entry.definitionId, { quantity: qty });
          if (newInst) {
            const placed = GameState.placeCardInRow(newInst.instanceId);
            if (placed) {
              gained.push(newInst.instanceId);
            } else {
              GameState.removeCardInstanceSilent(newInst.instanceId);
              if (!GameState.pendingLoot) GameState.pendingLoot = [];
              GameState.pendingLoot.push({ definitionId: entry.definitionId, quantity: qty, contamination: 0 });
              EventBus.emit('notify', { message: I18n.t('dismantle.boardFull'), type: 'warn' });
            }
          }
        }
      }

      // dismantleExtraItem 보너스: 추가 고철 획득 (반복마다 적용)
      const extraCount = GameState.player.dismantleExtraItem ?? 0;
      for (let i = 0; i < extraCount; i++) {
        const extraInst = GameState.createCardInstance('scrap_metal', { quantity: 1 });
        if (extraInst) {
          const placed = GameState.placeCardInRow(extraInst.instanceId);
          if (placed) {
            gained.push(extraInst.instanceId);
          } else {
            GameState.removeCardInstanceSilent(extraInst.instanceId);
            if (!GameState.pendingLoot) GameState.pendingLoot = [];
            GameState.pendingLoot.push({ definitionId: 'scrap_metal', quantity: 1, contamination: 0 });
          }
        }
      }
    }

    // ── 스킬 XP 분기 (실제로 재료를 얻었을 때만) ─────────────────
    // 분해 횟수에 비례해 XP 지급 (기존 공식 × actualCount)
    if (gained.length > 0) {
      SkillSystem.gainXp('harvesting', 3 * actualCount);

      const itemTags = def.tags ?? [];
      const itemType = def.type;
      if (itemType === 'weapon' || itemTags.includes('weapon')) {
        SkillSystem.gainXp('weaponcraft', 2 * actualCount);
      } else if (itemType === 'armor' || itemTags.includes('armor')) {
        SkillSystem.gainXp('armorcraft', 2 * actualCount);
      } else if (itemType === 'structure' || itemTags.includes('structure')) {
        SkillSystem.gainXp('building', 2 * actualCount);
      } else if (itemTags.includes('medical') || itemType === 'consumable' && def.subtype === 'medical') {
        SkillSystem.gainXp('medicine', 2 * actualCount);
      } else {
        SkillSystem.gainXp('crafting', 1 * actualCount);
      }
    }

    // 원본 카드 수량 차감 또는 제거
    if (willRemoveOriginal) {
      GameState.removeCardInstance(instanceId);
    } else {
      inst.quantity = stackQty - actualCount;
    }

    const defName = def.name;
    if (gained.length > 0) {
      const names = gained
        .map(id => GameState.getCardDef(id)?.name ?? '?')
        .join(', ');
      EventBus.emit('notify', { message: I18n.t('dismantle.success', { name: I18n.itemName(def.id, defName), materials: names }), type: 'info' });
    } else {
      EventBus.emit('notify', { message: I18n.t('dismantle.noMaterial', { name: I18n.itemName(def.id, defName) }), type: 'warn' });
    }

    EventBus.emit('cardDismantled', { instanceId, definitionId: def.id, gained, count: actualCount });
    EventBus.emit('boardChanged', {});

    return { success: true, gained, count: actualCount };
  },

  /**
   * 살살 채취 가능 여부. 버튼 활성 판정과 실제 실행 판정이 갈리지 않도록
   * UI와 forage()가 같은 함수를 본다.
   * @returns {{ ok: boolean, reason: string, daysLeft: number }}
   */
  canForage(instanceId) {
    const gs   = GameState;
    const inst = gs.cards[instanceId];
    const def  = gs.getCardDef(instanceId);
    if (!inst || !def?.forage) {
      return { ok: false, reason: I18n.t('forage.notForageable'), type: 'warn', daysLeft: 0 };
    }

    // 재생 대기가 먼저다 — 광원을 구해와도 이 노드는 여전히 못 거둔다
    const totalTP  = gs.time?.totalTP ?? 0;
    const cooldown = inst._forageCooldownTp ?? 0;
    if (cooldown > totalTP) {
      const daysLeft = Math.ceil((cooldown - totalTP) / TP_PER_DAY);
      return { ok: false, reason: I18n.t('forage.regrowing', { days: daysLeft }), type: 'warn', daysLeft };
    }

    const nightCheck = NightSystem.canActAtNight('dismantle');
    if (!nightCheck.allowed) {
      return { ok: false, reason: nightCheck.reason, type: 'danger', daysLeft: 0 };
    }
    return { ok: true, reason: '', type: 'info', daysLeft: 0 };
  },

  /**
   * 지금 분해할 수 있는지. 버튼 활성 판정과 dismantle() 실행 판정이 갈리지 않도록
   * UI와 dismantle()이 같은 함수를 본다. 슬롯 여유·스택 수량은 실행 시점 조건이라
   * 여기서 보지 않는다.
   * @returns {{ ok: boolean, reason: string, type: string }}
   */
  canDismantleNow(instanceId) {
    const def = GameState.getCardDef(instanceId);
    if (!def?.dismantle?.length) {
      return {
        ok: false,
        reason: I18n.t('dismantle.cantDismantle', { name: I18n.itemName(def?.id, def?.name) }),
        type: 'warn',
      };
    }

    const nightCheck = NightSystem.canActAtNight('dismantle');
    if (!nightCheck.allowed) {
      return { ok: false, reason: nightCheck.reason, type: 'danger' };
    }
    return { ok: true, reason: '', type: 'info' };
  },

  /**
   * 살살 채취(부분 채집) — 노드 카드를 소멸시키지 않고 일부만 거둔 뒤 재생 쿨다운을 건다.
   * def.forage = { regrowDays, yieldMult } 가 있어야 가능. 수율은 dismantle 테이블을 yieldMult로 축소.
   * 분해(dismantle)가 "뿌리째(전량·소멸)"라면 본 메서드는 "살살(일부·재생)"에 해당한다.
   * @returns {{ success: boolean, gained: string[] }}
   */
  forage(instanceId) {
    const gs = GameState;
    const inst = gs.cards[instanceId];
    if (!inst) return { success: false, gained: [] };
    const def = gs.getCardDef(instanceId);

    const status = this.canForage(instanceId);
    if (!status.ok) {
      EventBus.emit('notify', { message: status.reason, type: status.type });
      return { success: false, gained: [] };
    }
    const totalTP = gs.time?.totalTP ?? 0;

    // 야간 광원 체크
    // TP 소비 — 분해와 동일하게 자정을 넘길 수 있다
    const tpCost = def.dismantleTP ?? 0;
    if (tpCost > 0) {
      TickEngine.skipTP(tpCost, I18n.t('tick.reasonForage', { name: I18n.itemName(def.id, def.name) }));
    }
    if (!gs.player.isAlive) return { success: false, gained: [] };

    const yieldMult = def.forage.yieldMult ?? 0.5;
    const gained = [];
    for (const entry of (def.dismantle ?? [])) {
      if (Math.random() < entry.chance * yieldMult) {
        const qty = Math.max(1, Math.round((entry.qty ?? 1) * yieldMult));
        const ni = gs.createCardInstance(entry.definitionId, { quantity: qty });
        if (!ni) continue;
        if (gs.placeCardInRow(ni.instanceId)) {
          gained.push(ni.instanceId);
        } else {
          gs.removeCardInstanceSilent(ni.instanceId);
          if (!gs.pendingLoot) gs.pendingLoot = [];
          gs.pendingLoot.push({ definitionId: entry.definitionId, quantity: qty, contamination: 0 });
        }
      }
    }

    if (gained.length > 0) SkillSystem.gainXp('harvesting', 2);

    // 노드 유지 + 재생 쿨다운 설정
    inst._forageCooldownTp = totalTP + (def.forage.regrowDays ?? 3) * 72;

    const names = gained.map(id => gs.getCardDef(id)?.name ?? '?').join(', ');
    EventBus.emit('notify', {
      message: gained.length > 0
        ? `🌿 ${def.name}에서 ${names}을(를) 살살 채취했습니다. (재생 대기)`
        : `🌿 ${def.name}을(를) 살살 살폈지만 거둘 게 없었습니다.`,
      type: gained.length > 0 ? 'info' : 'warn',
    });
    EventBus.emit('boardChanged', {});
    return { success: true, gained };
  },

  /** instanceId 카드가 분해 가능한지 여부를 반환 */
  canDismantle(instanceId) {
    const def = GameState.getCardDef(instanceId);
    return !!(def?.dismantle?.length);
  },

  /**
   * 분해 TP 비용과 자정 이월 여부. 분해 버튼을 그리는 모든 UI가 이 판정을 쓴다.
   * 제작·이동과 마찬가지로 분해도 자정을 넘길 수 있다. 다만 하루가 넘어가는 것을
   * 모르고 지나치지 않도록 UI가 crossesMidnight일 때 확인을 받는다.
   * @returns {{ cost: number, remainTP: number, canDismantle: boolean, crossesMidnight: boolean }}
   */
  /**
   * 구조물 한 개를 해체하는 데 드는 TP. 알맞은 도구를 지니고 있으면 줄어든다.
   * 도끼는 목재 계열, 삽은 흙·자갈 계열, 망치는 건축물에 붙는다 (도구 정의의 onUse 보너스).
   * 값이 음수인 항목도 있어(망치 -1) 절댓값을 감소량으로 쓴다. 최소 1TP는 남긴다.
   */
  dismantleTPFor(definitionId) {
    const def = GameData?.items?.[definitionId];
    const base = def?.dismantleTP ?? 0;
    if (base <= 0) return base;
    const tools = StatSystem.getToolEffects();
    const tags = def.tags ?? [];
    let reduction = 0;
    if (tags.includes('wood') || def.subtype === 'natural') reduction += Math.abs(tools.woodChopBonus);
    if (tags.includes('salvage') || def.subtype === 'natural') reduction += Math.abs(tools.digBonus);
    if (tags.includes('crafted') && def.type === 'structure') reduction += Math.abs(tools.buildingBonus);
    if (reduction <= 0) return base;
    return Math.max(1, base - reduction);
  },

  getTpStatus(instanceId, count = 1) {
    const def      = GameState.getCardDef(instanceId);
    const remainTP = TP_PER_DAY - (GameState.time?.tpInDay ?? 0);
    const cost     = this.dismantleTPFor(def?.id) * Math.max(1, count | 0);
    const status   = this.canDismantleNow(instanceId);
    return {
      cost,
      remainTP,
      canDismantle: this.canDismantle(instanceId),
      crossesMidnight: cost > remainTP,
      blocked: !status.ok,
      blockReason: status.reason,
    };
  },
};

export default DismantleSystem;
