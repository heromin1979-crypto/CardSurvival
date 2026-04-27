// === HIDDEN ELEMENT SYSTEM ===
// 숨겨진 장소·보스·이벤트·레시피 해금 관리
// 마치 보물 지도처럼: 조건을 충족하면 숨겨진 콘텐츠가 열린다.
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import SystemRegistry  from '../core/SystemRegistry.js';
import I18n       from '../core/I18n.js';
import { HIDDEN_LOCATIONS }  from '../data/hiddenLocations.js';
import { SECRET_ENEMIES }    from '../data/secretEnemies.js';
import SECRET_EVENTS         from '../data/secretEvents.js';
import HIDDEN_RECIPES        from '../data/hiddenRecipes.js';
import BLUEPRINTS            from '../data/blueprints.js';
import GameData from '../data/GameData.js';

const HiddenElementSystem = {
  init() {
    // 탐색 시 히든 장소 체크
    EventBus.on('locationChanged', ({ nodeId }) => {
      this._checkHiddenLocations(nodeId);
    });

    // 전투 종료 시 보스 처치 기록 + 히든 레시피 해금 체크
    EventBus.on('combatEnd', ({ outcome }) => {
      if (outcome === 'victory') {
        this._recordBossKills();
        this._checkRecipeUnlocks();
      }
    });

    // TP 진행 시 이벤트 체크 (매 TP가 아닌 주기적으로)
    EventBus.on('tpAdvance', () => {
      if (GameState.time.totalTP % 3 === 0) {
        this._checkSecretEvents();
      }
      this._checkRecipeUnlocks();
    });

    // 구역 이동 시 이벤트 체크
    EventBus.on('districtChanged', () => {
      this._checkSecretEvents();
      this._checkHiddenLocations(GameState.location.currentDistrict);
    });
  },

  // ── 히든 장소 발견 체크 ─────────────────────────────────────

  _checkHiddenLocations(districtId) {
    const gs    = GameState;
    const flags = gs.flags;
    if (!flags?.hiddenLocationsDiscovered) return;

    for (const [locId, loc] of Object.entries(HIDDEN_LOCATIONS)) {
      if (loc.district !== districtId) continue;
      if (flags.hiddenLocationsDiscovered.includes(locId)) {
        // 반복 가능한 장소는 쿨다운 체크
        if (loc.repeatable) {
          this._checkRepeatableLocation(locId, loc);
        }
        continue;
      }
      if (this._meetsLocationConditions(loc)) {
        this._discoverHiddenLocation(locId, loc);
      }
    }
  },

  _meetsLocationConditions(loc) {
    const gs   = GameState;
    const cond = loc.unlockConditions;

    // 최소 일수
    if (cond.minDay && gs.time.day < cond.minDay) return false;

    // 최소 방문 횟수 (해당 구역)
    if (cond.minVisits) {
      const visitCount = this._getDistrictVisitCount(loc.district);
      if (visitCount < cond.minVisits) return false;
    }

    // 필요 아이템 (보드에 소지)
    if (cond.requiredItems?.length) {
      for (const itemId of cond.requiredItems) {
        if (gs.countOnBoard(itemId) < 1) return false;
      }
    }

    // 필요 아이템 수량 체크 (requiredItemQty)
    if (cond.requiredItemQty) {
      for (const { id, qty } of cond.requiredItemQty) {
        if (gs.countOnBoard(id) < qty) return false;
      }
    }

    // 캐릭터 조건
    if (cond.requiredCharacter) {
      const charId = gs.player.characterId;
      if (Array.isArray(cond.requiredCharacter)) {
        if (!cond.requiredCharacter.includes(charId)) return false;
      } else if (charId !== cond.requiredCharacter) {
        return false;
      }
    }

    // 킬 수
    if (cond.minKills && (gs.flags.totalKills ?? 0) < cond.minKills) return false;

    // 날씨
    if (cond.weather && gs.weather.id !== cond.weather) return false;

    // 계절
    if (cond.season && gs.season.current !== cond.season) return false;

    // 제작 숙련도
    if (cond.minCraftLevel) {
      const craftLevel = gs.player.skills?.crafting?.level ?? 0;
      if (craftLevel < cond.minCraftLevel) return false;
    }

    // 소음 상한
    if (cond.maxNoise !== undefined && cond.maxNoise !== null) {
      if (gs.noise.level > cond.maxNoise) return false;
    }

    // 방문 구역 수
    if (cond.minDistrictsVisited) {
      if ((gs.location.districtsVisited?.length ?? 0) < cond.minDistrictsVisited) return false;
    }

    // 총 아이템 발견 수
    if (cond.minItemsFound && (gs.flags.totalItemsFound ?? 0) < cond.minItemsFound) return false;

    return true;
  },

  _getDistrictVisitCount(districtId) {
    // landmarkHistory를 기반으로 해당 구역 방문 횟수 추정
    // 또는 districtsVisited에서 해당 구역 카운트
    const history = GameState.landmarkHistory ?? {};
    let count = 0;
    for (const key of Object.keys(history)) {
      if (key.startsWith(districtId)) count += history[key];
    }
    // 최소 1 (현재 해당 구역에 있으므로)
    if (GameState.location.currentDistrict === districtId) count = Math.max(count, 1);
    return count;
  },

  _discoverHiddenLocation(locId, loc) {
    const gs = GameState;
    gs.flags.hiddenLocationsDiscovered.push(locId);

    // 발견 알림
    EventBus.emit('notify', {
      message: loc.discoveryMessage || I18n.t('hidden.locationFound', { name: loc.name }),
      type: 'good',
    });

    // 보상 아이템 지급
    if (loc.rewards?.length) {
      for (const reward of loc.rewards) {
        const inst = gs.createCardInstance(reward.definitionId, { quantity: reward.qty ?? 1 });
        if (inst) {
          gs.placeCardInRow(inst.instanceId, 'middle');
          const def = GameData?.items?.[reward.definitionId];
          if (def) {
            EventBus.emit('notify', {
              message: I18n.t('hidden.reward', { icon: def.icon ?? '📦', name: I18n.itemName(def.id, def.name) }),
              type: 'good',
            });
          }
          // 전설 아이템 추적
          if (def?.rarity === 'legendary' || def?.legendary) {
            if (!gs.flags.legendaryItemsFound.includes(reward.definitionId)) {
              gs.flags.legendaryItemsFound.push(reward.definitionId);
            }
          }
        }
      }
    }

    // 추가 랜덤 루트
    if (loc.lootTable?.length) {
      this._rollAndPlaceLoot(loc.lootTable, 2);
    }

    // 보스 전투 트리거
    if (loc.bossId && SECRET_ENEMIES[loc.bossId]) {
      this._spawnBoss(loc.bossId);
    }

    // 히든 레시피 해금 체크
    this._checkRecipeUnlocks();

    EventBus.emit('hiddenLocationDiscovered', { locationId: locId, location: loc });
    EventBus.emit('boardChanged', {});
  },

  _checkRepeatableLocation(locId, loc) {
    const gs = GameState;
    const lastVisitDay = gs.flags._hiddenLocationLastVisit?.[locId] ?? 0;
    if (gs.time.day - lastVisitDay >= (loc.repeatCooldownDays ?? 30)) {
      // 쿨다운 경과 — 보상 재지급
      if (!gs.flags._hiddenLocationLastVisit) gs.flags._hiddenLocationLastVisit = {};
      gs.flags._hiddenLocationLastVisit[locId] = gs.time.day;

      if (loc.rewards?.length) {
        for (const reward of loc.rewards) {
          const inst = gs.createCardInstance(reward.definitionId, { quantity: reward.qty ?? 1 });
          if (inst) gs.placeCardInRow(inst.instanceId, 'middle');
        }
        EventBus.emit('notify', {
          message: I18n.t('hidden.revisit', { name: loc.name }),
          type: 'good',
        });
      }
    }
  },

  // ── 보스 스폰 ──────────────────────────────────────────────

  _spawnBoss(bossId) {
    const boss = SECRET_ENEMIES[bossId];
    if (!boss) return;

    const hp = boss.hp.min + Math.floor(Math.random() * (boss.hp.max - boss.hp.min + 1));
    const instance = {
      ...boss,
      currentHp:       hp,
      maxHp:           hp,
      _skillCooldowns: {},
    };

    EventBus.emit('notify', {
      message: I18n.t('hidden.bossSpawn', { icon: boss.icon, name: I18n.enemyName(boss.id, boss.name) }),
      type: 'danger',
    });

    // StateMachine으로 전투 전환
    const StateMachine = SystemRegistry.get('StateMachine');
    if (StateMachine) {
      StateMachine.transition('encounter', {
        nodeId:      GameState.location.currentDistrict,
        enemies:     [instance],
        enemy:       instance,
        dangerLevel: 4,
        noiseLevel:  GameState.noise.level,
        isBossEncounter: true,
      });
    }
  },

  /** 일반 탐색 중 보스 스폰 체크 (확률 기반) */
  checkBossSpawn(districtId, dangerLevel) {
    const gs = GameState;
    if (!gs.flags?.bossesKilled) return false;

    for (const [bossId, boss] of Object.entries(SECRET_ENEMIES)) {
      if (gs.flags.bossesKilled.includes(bossId)) continue;
      const cond = boss.spawnConditions;
      if (!cond) continue;

      // 구역 체크
      if (cond.districts?.length && !cond.districts.includes(districtId)) continue;
      if (cond.minDangerLevel && dangerLevel < cond.minDangerLevel) continue;
      if (cond.minDay && gs.time.day < cond.minDay) continue;
      if (cond.season && gs.season.current !== cond.season) continue;
      if (cond.weather && gs.weather.id !== cond.weather) continue;
      if (cond.requiredCharacter && gs.player.characterId !== cond.requiredCharacter) continue;
      if (cond.minKills && (gs.flags.totalKills ?? 0) < cond.minKills) continue;
      if (cond.hiddenLocationId) continue; // 히든 장소 전용 보스는 여기서 스폰하지 않음

      // 스폰 확률: 개별 spawnChance 또는 기본 3%
      const chance = cond.spawnChance ?? 0.03;
      if (Math.random() < chance) {
        this._spawnBoss(bossId);
        return true;
      }
    }
    return false;
  },

  _recordBossKills() {
    const gs = GameState;
    if (!gs.flags?.bossesKilled) return;
    const enemies = gs.combat.enemies ?? [];
    for (const enemy of enemies) {
      if (enemy.isBoss && enemy.currentHp <= 0 && enemy.id) {
        if (!gs.flags.bossesKilled.includes(enemy.id)) {
          gs.flags.bossesKilled.push(enemy.id);
          EventBus.emit('notify', {
            message: I18n.t('hidden.bossKill', { name: I18n.enemyName(enemy.id, enemy.name) }),
            type: 'good',
          });

          // 보장 드롭
          if (enemy.dropGuaranteed?.length) {
            for (const drop of enemy.dropGuaranteed) {
              const inst = gs.createCardInstance(drop.definitionId, { quantity: drop.qty ?? 1 });
              if (inst) {
                gs.placeCardInRow(inst.instanceId, 'middle');
                const def = GameData?.items?.[drop.definitionId];
                EventBus.emit('notify', {
                  message: I18n.t('hidden.bossDrop', { icon: def?.icon ?? '📦', name: I18n.itemName(def?.id ?? drop.definitionId, def?.name ?? drop.definitionId) }),
                  type: 'good',
                });
                if (def?.rarity === 'legendary' || def?.legendary) {
                  if (!gs.flags.legendaryItemsFound.includes(drop.definitionId)) {
                    gs.flags.legendaryItemsFound.push(drop.definitionId);
                  }
                }
              }
            }
          }

          EventBus.emit('bossKilled', { bossId: enemy.id, boss: enemy });
        }
      }
    }
  },

  // ── 비밀 이벤트 체크 ───────────────────────────────────────

  _checkSecretEvents() {
    const gs = GameState;
    if (!gs.flags?.secretEventsTriggered) return;

    for (const event of SECRET_EVENTS) {
      if (gs.flags.secretEventsTriggered.includes(event.id)) continue;

      const cond = event.triggerConditions;
      if (!this._meetsEventConditions(event, cond)) continue;

      // 확률 체크
      const prob = cond.probability ?? 1.0;
      if (Math.random() > prob) continue;

      this._triggerSecretEvent(event);
      return; // 한 번에 하나만 트리거
    }
  },

  _meetsEventConditions(event, cond) {
    const gs = GameState;

    // cond가 없으면 조건 없는 이벤트로 간주 — 항상 통과
    if (!cond || typeof cond !== 'object') return true;

    // 일자 범위
    if (cond.dayRange) {
      const [minD, maxD] = cond.dayRange;
      if (gs.time.day < minD || gs.time.day > maxD) return false;
    }

    // 시간대
    if (cond.timeOfDay === 'night' && gs.time.hour >= 5) return false;
    if (cond.timeOfDay === 'day'   && gs.time.hour < 5)  return false;

    // 필수 아이템
    if (cond.requiredItems?.length) {
      for (const itemId of cond.requiredItems) {
        if (gs.countOnBoard(itemId) < 1) return false;
      }
    }

    // 캐릭터
    if (cond.requiredCharacter) {
      if (Array.isArray(cond.requiredCharacter)) {
        if (!cond.requiredCharacter.includes(gs.player.characterId)) return false;
      } else if (gs.player.characterId !== cond.requiredCharacter) {
        return false;
      }
    }

    // 날씨·계절
    if (cond.weather && gs.weather.id !== cond.weather) return false;
    if (cond.season && gs.season.current !== cond.season) return false;

    // 킬 수
    if (cond.minKills && (gs.flags.totalKills ?? 0) < cond.minKills) return false;

    // 구역
    if (cond.district && gs.location.currentDistrict !== cond.district) return false;

    // HP 비율 (minHp는 퍼센트 0~100 스케일, 예: 30 = HP 30% 이하일 때)
    if (cond.minHp) {
      const hpPct = (gs.player.hp.current / gs.player.hp.max) * 100;
      if (hpPct > cond.minHp) return false;
    }

    // 소음 상한
    if (cond.maxNoise !== undefined && gs.noise.level > cond.maxNoise) return false;

    // 아이템 발견 수
    if (cond.minItemsFound && (gs.flags.totalItemsFound ?? 0) < cond.minItemsFound) return false;

    // 필수 플래그
    if (cond.requiredFlags?.length) {
      for (const flag of cond.requiredFlags) {
        if (!gs.flags[flag]) return false;
      }
    }

    // 체인 이벤트 진행
    if (cond.chainId !== undefined && cond.chainId !== null) {
      const currentStep = gs.flags.eventChainProgress[cond.chainId] ?? 0;
      if (currentStep !== (cond.chainStep ?? 0)) return false;
    }

    return true;
  },

  _triggerSecretEvent(event) {
    const gs = GameState;
    gs.flags.secretEventsTriggered.push(event.id);

    EventBus.emit('notify', {
      message: I18n.t('hidden.secretEvent', { icon: event.icon ?? '❓', name: event.name }),
      type: 'info',
    });

    // 이벤트 선택지 UI 표시를 위해 이벤트 발행
    EventBus.emit('secretEventTriggered', { event });

    // 선택지가 없는 이벤트는 첫 번째 선택지의 첫 결과 자동 적용
    if (!event.choices?.length) return;

    // UI가 없는 경우 자동 처리 (첫 선택지, 가중치 기반 결과)
    const choice = event.choices[0];
    if (choice?.outcomes?.length) {
      const outcome = this._rollOutcome(choice.outcomes);
      if (outcome) {
        this._applyEventOutcome(outcome);
      }
    }
  },

  _rollOutcome(outcomes) {
    const total = outcomes.reduce((s, o) => s + (o.weight ?? 1), 0);
    let rand = Math.random() * total;
    for (const outcome of outcomes) {
      rand -= (outcome.weight ?? 1);
      if (rand <= 0) return outcome;
    }
    return outcomes[0];
  },

  _applyEventOutcome(outcome) {
    const gs      = GameState;
    const effects = outcome.effects;
    if (!effects) return;

    if (effects.hp) {
      gs.player.hp.current = Math.max(0, Math.min(gs.player.hp.max, gs.player.hp.current + effects.hp));
    }
    if (effects.infection)  gs.modStat('infection', effects.infection);
    if (effects.morale)     gs.modStat('morale', effects.morale);
    if (effects.fatigue)    gs.modStat('fatigue', effects.fatigue);
    if (effects.radiation)  gs.modStat('radiation', effects.radiation);
    if (effects.noise) {
      gs.noise.level = Math.max(0, Math.min(100, gs.noise.level + effects.noise));
    }

    // 아이템 지급
    if (effects.items?.length) {
      for (const item of effects.items) {
        const inst = gs.createCardInstance(item.id, { quantity: item.qty ?? 1 });
        if (inst) gs.placeCardInRow(inst.instanceId, 'middle');
      }
    }

    // 아이템 소모
    if (effects.removeItems?.length) {
      for (const item of effects.removeItems) {
        let needed = item.qty ?? 1;
        const matching = gs.getBoardCards().filter(c => c.definitionId === item.id);
        for (const card of matching) {
          if (needed <= 0) break;
          if ((card.quantity ?? 1) <= needed) {
            needed -= (card.quantity ?? 1);
            gs.removeCardInstance(card.instanceId);
          } else {
            card.quantity -= needed;
            needed = 0;
          }
        }
      }
    }

    // 히든 장소 공개
    if (effects.revealHiddenLocation) {
      const locId = effects.revealHiddenLocation;
      if (!gs.flags?.hiddenLocationsDiscovered?.includes(locId)) {
        const loc = HIDDEN_LOCATIONS[locId];
        if (loc) this._discoverHiddenLocation(locId, loc);
      }
    }

    // 전투 트리거
    if (effects.combat) {
      const { enemyId, count } = effects.combat;
      const enemyDef = GameData?.enemies?.[enemyId] ?? SECRET_ENEMIES[enemyId];
      if (enemyDef) {
        const enemies = Array.from({ length: count ?? 1 }, () => {
          const hp = enemyDef.hp.min + Math.floor(Math.random() * (enemyDef.hp.max - enemyDef.hp.min + 1));
          return { ...enemyDef, currentHp: hp, maxHp: hp, _skillCooldowns: {} };
        });
        const StateMachine = SystemRegistry.get('StateMachine');
        if (StateMachine) {
          StateMachine.transition('encounter', {
            nodeId:  GameState.location.currentDistrict,
            enemies, enemy: enemies[0],
            dangerLevel: 3, noiseLevel: gs.noise.level,
          });
        }
      }
    }

    // 플래그 설정 (배열 타입 플래그 덮어쓰기 방지)
    if (effects.flags) {
      const safeFlags = {};
      const arrayKeys = [
        'hiddenLocationsDiscovered', 'bossesKilled', 'legendaryItemsFound',
        'secretEventsTriggered', 'hiddenRecipesUnlocked',
      ];
      for (const [key, val] of Object.entries(effects.flags)) {
        if (arrayKeys.includes(key)) continue;
        safeFlags[key] = val;
      }
      Object.assign(gs.flags, safeFlags);
    }

    // 체인 진행
    if (effects.chainProgress) {
      const { chainId, step } = effects.chainProgress;
      gs.flags.eventChainProgress[chainId] = step;
    }

    // 구조물 피해
    if (effects.structureDamage) {
      EventBus.emit('structureDamage', { damagePercent: effects.structureDamage });
    }

    // 결과 메시지
    if (outcome.text) {
      EventBus.emit('notify', { message: outcome.text, type: 'info' });
    }

    EventBus.emit('boardChanged', {});
  },

  // ── 시도 기반 unlock — Sub-spec 2A ─────────────────────────
  // DragDrop._onDrop / TouchDrag._onPointerUp가 실제 drop commit 시점에 호출.
  // (hover/getQuickHint는 호출 안 함 — 마우스만 올려도 unlock되면 design 정신과 어긋남)
  // hidden 레시피의 첫 stage 재료에 src/tgt가 모두 포함되면 즉시 unlock.
  // dev metric: window.__DEV_DISCOVERY__ = true 설정 시 콘솔에 unlock 이벤트 로그 (Phase 2A 측정 1차 hook).
  unlockByAttempt(srcDefId, tgtDefId) {
    const result = { unlocked: [], skipped: [] };
    if (!srcDefId || !tgtDefId) return result;

    const gs = GameState;
    if (!gs.flags) return result;
    if (!gs.flags.hiddenRecipesUnlocked) gs.flags.hiddenRecipesUnlocked = [];

    for (const bp of Object.values(HIDDEN_RECIPES)) {
      if (!bp.hidden) continue;

      const firstStage = bp.stages?.[0];
      if (!firstStage?.requiredItems?.length) continue;

      const reqIds = firstStage.requiredItems.map(r => r.definitionId);
      const srcIn = reqIds.includes(srcDefId);
      const tgtIn = reqIds.includes(tgtDefId);
      if (!srcIn || !tgtIn) continue;

      if (gs.flags.hiddenRecipesUnlocked.includes(bp.id)) {
        result.skipped.push(bp.id);
        continue;
      }

      gs.flags.hiddenRecipesUnlocked.push(bp.id);
      result.unlocked.push(bp.id);
      EventBus.emit('recipeUnlocked', {
        recipeId: bp.id,
        recipe: bp,
        source: 'attempt',
      });
      EventBus.emit('notify', {
        message: I18n.t('hidden.recipeUnlockByAttempt', { name: I18n.blueprintName(bp.id, bp.name) }),
        type: 'good',
      });
      if (typeof window !== 'undefined' && window.__DEV_DISCOVERY__) {
        console.log(`[Discovery] day=${gs.time?.day} src=${srcDefId} tgt=${tgtDefId} unlocked=${bp.id}`);
      }
    }

    return result;
  },

  // ── 히든 레시피 해금 체크 ──────────────────────────────────

  _checkRecipeUnlocks() {
    const gs = GameState;

    // 세이브 호환: 필드 없으면 초기화
    if (!gs.flags.hiddenRecipesUnlocked) gs.flags.hiddenRecipesUnlocked = [];

    const allRecipeSources = [
      ...Object.entries(HIDDEN_RECIPES),
      ...Object.entries(BLUEPRINTS),
    ];

    for (const [recipeId, recipe] of allRecipeSources) {
      if (!recipe || typeof recipe !== 'object') continue;
      if (!recipe.hidden) continue;
      if (gs.flags.hiddenRecipesUnlocked.includes(recipeId)) continue;

      const cond = recipe.unlockConditions;
      if (!cond) continue;

      if (this._meetsRecipeConditions(cond)) {
        gs.flags.hiddenRecipesUnlocked.push(recipeId);
        EventBus.emit('notify', {
          message: I18n.t('hidden.recipeUnlock', { name: I18n.blueprintName(recipeId, recipe.name) }),
          type: 'good',
        });
        EventBus.emit('recipeUnlocked', { recipeId, recipe });
      }
    }
  },

  _meetsRecipeConditions(cond) {
    const gs = GameState;

    // 히든 장소 발견 필요
    if (cond.hiddenLocationId) {
      if (!gs.flags?.hiddenLocationsDiscovered?.includes(cond.hiddenLocationId)) return false;
    }

    // 보스 처치 필요
    if (cond.bossKillId) {
      if (!gs.flags?.bossesKilled?.includes(cond.bossKillId)) return false;
    }

    // 캐릭터 조건
    if (cond.requiredCharacter && gs.player.characterId !== cond.requiredCharacter) return false;

    // 최소 일수
    if (cond.minDay && gs.time.day < cond.minDay) return false;

    // 제작 숙련도
    if (cond.minCraftLevel) {
      const craftLevel = gs.player.skills?.crafting?.level ?? 0;
      if (craftLevel < cond.minCraftLevel) return false;
    }

    // 필수 아이템 발견
    if (cond.requiredItems?.length) {
      for (const itemId of cond.requiredItems) {
        if (gs.countOnBoard(itemId) < 1) return false;
      }
    }

    // 특정 스킬 레벨
    if (cond.minSkillLevel) {
      for (const [skillId, minLevel] of Object.entries(cond.minSkillLevel)) {
        const level = gs.player.skills?.[skillId]?.level ?? 0;
        if (level < minLevel) return false;
      }
    }

    return true;
  },

  // ── 루트 롤링 유틸 ─────────────────────────────────────────

  _rollAndPlaceLoot(lootTable, count) {
    const gs         = GameState;
    const totalWeight = lootTable.reduce((s, e) => s + (e.weight ?? 1), 0);

    for (let i = 0; i < count; i++) {
      let rand = Math.random() * totalWeight;
      for (const entry of lootTable) {
        rand -= (entry.weight ?? 1);
        if (rand <= 0) {
          const qty  = (entry.minQty ?? 1) + Math.floor(Math.random() * ((entry.maxQty ?? 1) - (entry.minQty ?? 1) + 1));
          const inst = gs.createCardInstance(entry.definitionId, { quantity: qty });
          if (inst) gs.placeCardInRow(inst.instanceId, 'middle');
          break;
        }
      }
    }
  },

  // ── 쿼리 API ──────────────────────────────────────────────

  /** 해금된 히든 레시피 목록 반환 */
  getUnlockedRecipes() {
    return (GameState.flags?.hiddenRecipesUnlocked ?? [])
      .map(id => HIDDEN_RECIPES[id])
      .filter(Boolean);
  },

  /** 특정 레시피가 해금됐는지 확인 */
  isRecipeUnlocked(recipeId) {
    return GameState.flags?.hiddenRecipesUnlocked?.includes(recipeId) ?? false;
  },

  /** 발견한 히든 장소 목록 */
  getDiscoveredLocations() {
    return (GameState.flags?.hiddenLocationsDiscovered ?? [])
      .map(id => HIDDEN_LOCATIONS[id])
      .filter(Boolean);
  },

  /** 처치한 보스 목록 */
  getKilledBosses() {
    return (GameState.flags?.bossesKilled ?? [])
      .map(id => SECRET_ENEMIES[id])
      .filter(Boolean);
  },

  /** 전체 진행률 (발견/전체) */
  getProgress() {
    const flags = GameState.flags ?? {};
    const totalLoc    = Object.keys(HIDDEN_LOCATIONS).length;
    const totalBoss   = Object.keys(SECRET_ENEMIES).length;
    const totalEvent  = SECRET_EVENTS.length;
    const totalRecipe = Object.keys(HIDDEN_RECIPES).length;

    return {
      locations: { found: (flags.hiddenLocationsDiscovered?.length ?? 0), total: totalLoc },
      bosses:    { killed: (flags.bossesKilled?.length ?? 0), total: totalBoss },
      events:    { triggered: (flags.secretEventsTriggered?.length ?? 0), total: totalEvent },
      recipes:   { unlocked: (flags.hiddenRecipesUnlocked?.length ?? 0), total: totalRecipe },
    };
  },
};

export default HiddenElementSystem;
