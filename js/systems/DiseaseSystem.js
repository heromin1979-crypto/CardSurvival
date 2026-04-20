// === DISEASE SYSTEM ===
// 질병 발병·진행·치료·사망 관리
// 매 TP마다 StatSystem 이후 호출됨 (main.js init 순서 유지 필수)

import EventBus    from '../core/EventBus.js';
import GameState   from '../core/GameState.js';
import I18n        from '../core/I18n.js';
import EndingSystem from './EndingSystem.js';
import SeasonSystem from './SeasonSystem.js';
import DISEASES    from '../data/diseases.js';
import BALANCE     from '../data/gameBalance.js';

// ── 내부 노출 추적 카운터 (세이브 불필요 — 런타임 상태) ─────
let _coldExposureTicks  = 0;  // temp < 20 연속 TP
let _heatExposureTicks  = 0;  // temp > 85 연속 TP
let _highInfectTicks    = 0;  // infection > 70 연속 TP

const DiseaseSystem = {

  init() {
    // onTP()는 StatSystem.onTP()에서 직접 호출됨 — tpAdvance 중복 구독 없음
    // 세이브 로드 시 카운터 리셋 + 구버전 세이브 필드 보정
    EventBus.on('saveLoaded', () => {
      _coldExposureTicks = 0;
      _heatExposureTicks = 0;
      _highInfectTicks   = 0;
      const diseases = GameState.player?.diseases ?? [];
      for (const d of diseases) {
        if (d.incubationTp == null) d.incubationTp = 0;
        if (d.discovered   == null) d.discovered   = true;
      }
    });
  },

  // ── 메인 TP 훅 ────────────────────────────────────────────────

  onTP() {
    const gs = GameState;
    if (!gs.player.isAlive) return;

    // 필드 초기화 (구버전 세이브 호환)
    if (!gs.player.diseases) gs.player.diseases = [];

    this._checkEnvironmentContraction(gs);
    this._progressDiseases(gs);
    this._updateDiseaseHUD(gs);
  },

  // ── 환경 발병 체크 (매 TP) ────────────────────────────────────

  _checkEnvironmentContraction(gs) {
    const temp      = gs.stats.temperature.current;
    const infection = gs.stats.infection.current;
    const radiation = gs.stats.radiation.current;

    // ── 저체온증 (48TP ≈ 16시간 연속 저온) ────────────────────
    if (temp < 20) {
      _coldExposureTicks++;
      if (_coldExposureTicks >= 48 && !this._hasDisease(gs, 'hypothermia')) {
        this._contract(gs, 'hypothermia');
        _coldExposureTicks = 0;
      }
    } else {
      _coldExposureTicks = Math.max(0, _coldExposureTicks - BALANCE.disease.exposureDecayRate);
    }

    // 계절 감염 보정
    const seasonMult = SeasonSystem.getModifiers()?.infectionChanceMult ?? 1.0;

    // ── 감기 (저온 노출) ─────────────────────────────────────
    if (temp < 35 && !this._hasDisease(gs, 'common_cold')
                  && !this._hasDisease(gs, 'influenza')) {
      if (Math.random() < 0.004 * seasonMult) this._contract(gs, 'common_cold');
    }

    // ── 열사병 (36TP ≈ 12시간 연속 고온) ────────────────────
    if (temp > 85) {
      _heatExposureTicks++;
      if (_heatExposureTicks >= 36 && !this._hasDisease(gs, 'heatstroke')) {
        this._contract(gs, 'heatstroke');
        _heatExposureTicks = 0;
      }
    } else {
      _heatExposureTicks = Math.max(0, _heatExposureTicks - BALANCE.disease.exposureDecayRate);
    }

    // ── 패혈증 (감염 60+ 방치, 48TP) ────────────────────────
    if (infection > 60) {
      _highInfectTicks++;
      if (_highInfectTicks >= 48 && !this._hasDisease(gs, 'sepsis')) {
        this._contract(gs, 'sepsis');
        _highInfectTicks = 0;
      }
    } else {
      _highInfectTicks = Math.max(0, _highInfectTicks - BALANCE.disease.exposureDecayRate);
    }

    // ── 독감 (감염 수치 높을 때) ─────────────────────────────
    if (infection > 25 && !this._hasDisease(gs, 'influenza')
                       && !this._hasDisease(gs, 'common_cold')) {
      if (Math.random() < 0.004 * seasonMult) this._contract(gs, 'influenza');
    }

    // ── 방사선 질환 ──────────────────────────────────────────
    if (radiation > 50 && !this._hasDisease(gs, 'radiation_sickness')) {
      if (Math.random() < 0.005 * seasonMult) this._contract(gs, 'radiation_sickness');
    }
  },

  // ── 전투 부상 체크 ───────────────────────────────────────────
  // CombatSystem._enemyAttack() / _runEnemyAI()에서 피격 시 호출

  checkCombatInjury(damage, gs) {
    if (!gs || !gs.player.isAlive) return;
    if (!gs.player.diseases) gs.player.diseases = [];

    // 전투 부상 질병 순회
    for (const [id, def] of Object.entries(DISEASES)) {
      if (!def.combatInjury) continue;
      if (this._hasDisease(gs, id)) continue;

      // 피해량 임계치 체크
      if (damage < (def.triggerDamage ?? 0)) continue;

      // 확률 판정
      if (Math.random() < (def.triggerChance ?? 0)) {
        this._contract(gs, id);
      }
    }
  },

  // ── 오염 음식/물 섭취 시 발병 체크 ───────────────────────────
  // StatSystem.consumeCard()에서 호출됨

  checkContaminatedConsume(def, contamination, gs) {
    if (!contamination || contamination <= 0) return;
    if (!def || def.type !== 'consumable') return;

    const isWater = def.subtype === 'drink';
    const isFood  = def.subtype === 'food';

    if (!isWater && !isFood) return;

    if (isWater && contamination >= 50) {
      // 심하게 오염된 물 → 콜레라 또는 이질
      if (Math.random() < 0.55) {
        this._contract(gs, 'cholera');
      } else if (Math.random() < 0.50) {
        this._contract(gs, 'dysentery');
      }
    } else if (contamination >= 20) {
      // 오염된 음식/물 → 이질 위험
      if (Math.random() < 0.40) this._contract(gs, 'dysentery');
    }
  },

  // ── 아이템 사용 시 치료 ───────────────────────────────────────
  // StatSystem.consumeCard() 후 호출됨

  onConsume(def, gs) {
    // 진단 도구 — 질병 유무와 무관하게 동작
    if (def.diagnose) {
      const targets = def.diagnose === 'all' ? null : def.diagnose;
      const revealed = this.diagnoseByFilter(gs, targets);
      if (revealed.length > 0) {
        EventBus.emit('notify', {
          message: `🔬 진단 결과: ${revealed.join(', ')}`,
          type: 'warn',
        });
      } else {
        EventBus.emit('notify', {
          message: '🔬 진단 완료 — 해당 증상에서는 별다른 이상 없음.',
          type: 'info',
        });
      }
    }

    if (!gs.player.diseases || gs.player.diseases.length === 0) return;

    const tags   = def.tags ?? [];
    const itemId = def.id;

    // 항생제 → 세균성 질환 치료
    if (tags.includes('antibiotic')) {
      this._cureByFilter(gs, ['influenza', 'dysentery', 'cholera', 'sepsis'], I18n.itemName(def.id, def.name));
    }

    // 해독제 → 독성 질환 치료
    if (tags.includes('antidote')) {
      this._cureByFilter(gs, ['dysentery', 'cholera'], I18n.itemName(def.id, def.name));
    }

    // 방사선 차단제 → 방사선 질환 치료
    if (tags.includes('rad_blocker') || itemId === 'rad_blocker') {
      this._cureByFilter(gs, ['radiation_sickness'], I18n.itemName(def.id, def.name));
    }

    // 비타민 / 응급처치 키트 → 감기 완치
    if (itemId === 'vitamins' || itemId === 'first_aid_kit') {
      this._cureByFilter(gs, ['common_cold'], I18n.itemName(def.id, def.name));
    }

    // 붕대 / 거즈 → 출혈 지혈
    if (itemId === 'bandage' || itemId === 'gauze') {
      this._cureByFilter(gs, ['bleeding'], I18n.itemName(def.id, def.name));
    }

    // 구급상자 / 소독약 → 깊은 열상 치료 + 출혈 지혈
    if (itemId === 'first_aid_kit' || itemId === 'antiseptic') {
      this._cureByFilter(gs, ['deep_laceration', 'bleeding'], I18n.itemName(def.id, def.name));
    }

    // 진통제 → 골절 증상 완화 (치료는 아니지만 지속시간 대폭 단축) + 뇌진탕 치료
    if (itemId === 'painkiller') {
      this._cureByFilter(gs, ['concussion'], I18n.itemName(def.id, def.name));
      const frac = gs.player.diseases.find(d => d.id === 'fracture');
      if (frac) {
        frac.tpElapsed = Math.min(frac.tpDuration, frac.tpElapsed + 72 * 3);  // 3일 단축
        EventBus.emit('notify', { message: I18n.t('disease.painkiller'), type: 'info' });
      }
    }

    // 정수물 / 스포츠 드링크 → 열사병 가속 회복
    if (itemId === 'purified_water' || itemId === 'sports_drink') {
      const hs = gs.player.diseases.find(d => d.id === 'heatstroke');
      if (hs) {
        hs.tpElapsed = Math.max(0, hs.tpElapsed - 48);  // 12시간 단축
        EventBus.emit('notify', { message: I18n.t('disease.heatstroke'), type: 'info' });
      }
    }
  },

  // ── 질병 진행 (매 TP) ────────────────────────────────────────

  _progressDiseases(gs) {
    const toRemove = [];

    for (const disease of gs.player.diseases) {
      const def = DISEASES[disease.id];
      if (!def) { toRemove.push(disease.id); continue; }

      // 잠복기 중: 증상·진행 보류, 잠복 카운트만 감소
      if ((disease.incubationTp ?? 0) > 0) {
        disease.incubationTp--;
        if (disease.incubationTp === 0) {
          EventBus.emit('diseaseContracted', { diseaseId: disease.id });
          EventBus.emit('notify', {
            message: '🩺 몸이 이상하다... 증상이 나타나기 시작한다. 진단이 필요하다.',
            type: 'warn',
          });
          // 최초 1회: 진단 도구 사용법 상세 안내
          if (!gs.flags.diseaseIncubationGuideShown) {
            gs.flags.diseaseIncubationGuideShown = true;
            setTimeout(() => {
              EventBus.emit('notify', {
                message: '💡 진단 도구(체온계·청진기·진단 키트)를 사용해 정확한 병명을 확인하세요. 미진단 상태에서는 HUD에 "???"로 표시됩니다.',
                type: 'info',
              });
            }, 400);
          }
          EventBus.emit('diseaseChanged', { diseases: gs.player.diseases });
        }
        continue;
      }

      disease.tpElapsed++;

      // 증상 적용
      this._applySymptoms(def.symptoms, gs);

      // 자연 치유 조건 (체온 기반 — 저체온증/열사병)
      if (def.healCondition) {
        const temp = gs.stats.temperature.current;
        if (def.healCondition.tempAbove && temp > def.healCondition.tempAbove) {
          toRemove.push(disease.id);
          EventBus.emit('notify', { message: I18n.t('disease.healTemp', { name: def.name }), type: 'success' });
          continue;
        }
        if (def.healCondition.tempBelow && temp < def.healCondition.tempBelow) {
          toRemove.push(disease.id);
          EventBus.emit('notify', { message: I18n.t('disease.healFever', { name: def.name }), type: 'success' });
          continue;
        }
      }

      // 자연 기간 만료
      if (disease.tpElapsed >= disease.tpDuration) {
        toRemove.push(disease.id);
        EventBus.emit('notify', { message: I18n.t('disease.naturalHeal', { name: def.name }), type: 'success' });
        continue;
      }

      // 감기 → 독감 악화 (7일 방치)
      if (disease.id === 'common_cold' && def.escalatesTo) {
        const escalateTp = (def.escalateDays ?? 7) * 72;
        if (disease.tpElapsed >= escalateTp) {
          toRemove.push(disease.id);
          this._contract(gs, def.escalatesTo);
          continue;
        }
      }

      // 위험 경고 (치명 시간 50% 도달)
      if (def.fatal && disease.fatalTp) {
        const warnAt = Math.floor(disease.fatalTp * 0.5);
        if (disease.tpElapsed === warnAt) {
          EventBus.emit('notify', {
            message: I18n.t('disease.warning', { name: def.name }),
            type: 'danger',
          });
        }
      }

      // 사망 판정
      if (def.fatal && disease.fatalTp && disease.tpElapsed >= disease.fatalTp) {
        this._killByDisease(gs, def);
        return;  // 사망 처리 후 즉시 중단
      }
    }

    // 완치/만료된 질병 제거
    if (toRemove.length > 0) {
      gs.player.diseases = gs.player.diseases.filter(d => !toRemove.includes(d.id));
      EventBus.emit('boardChanged', {});
    }
  },

  // ── 증상 적용 ─────────────────────────────────────────────────

  _applySymptoms(symptoms, gs) {
    if (!symptoms) return;

    // 수분 추가 감소
    if (symptoms.hydrationDecayExtra > 0) {
      gs.modStat('hydration', -symptoms.hydrationDecayExtra);
    }

    // 영양 추가 감소
    if (symptoms.nutritionDecayExtra > 0) {
      gs.modStat('nutrition', -symptoms.nutritionDecayExtra);
    }

    // 피로 증가
    if (symptoms.fatiguePerTP > 0) {
      gs.modStat('fatigue', symptoms.fatiguePerTP);
    }

    // 사기 변화
    if (symptoms.moralePerTP !== 0 && symptoms.moralePerTP != null) {
      gs.modStat('morale', symptoms.moralePerTP);
    }

    // HP 변화
    if (symptoms.hpPerTP < 0) {
      const newHp = Math.max(0, gs.player.hp.current + symptoms.hpPerTP);
      gs.player.hp.current = newHp;
      EventBus.emit('statChanged', { stat: 'hp', oldVal: gs.player.hp.current - symptoms.hpPerTP, newVal: newHp });
    }
  },

  // ── 질병 계약 ─────────────────────────────────────────────────

  _contract(gs, diseaseId) {
    if (this._hasDisease(gs, diseaseId)) return;
    const def = DISEASES[diseaseId];
    if (!def) return;

    const [minDays, maxDays] = def.durationDays;
    const days       = minDays + Math.floor(Math.random() * (maxDays - minDays + 1));
    const tpDuration = days * 72;
    const fatalTp    = def.fatalDays ? def.fatalDays * 72 : null;
    const incubationTp = def.incubationTp ?? 0;

    gs.player.diseases.push({
      id: diseaseId,
      tpElapsed: 0,
      tpDuration,
      fatalTp,
      incubationTp,
      discovered: incubationTp === 0,
    });

    // 잠복기가 있는 질병은 알림·가이드를 발현 시점까지 보류
    if (incubationTp > 0) {
      EventBus.emit('diseaseChanged', { diseases: gs.player.diseases });
      return;
    }

    EventBus.emit('diseaseContracted', { diseaseId });
    EventBus.emit('notify', {
      message: I18n.t('disease.contracted', { name: def.name, desc: def.description }),
      type: 'danger',
    });

    // 최초 출혈/감염 발생 시 치료 가이드 — 처음 보는 플레이어를 위한 안내
    if (diseaseId === 'bleeding' && !gs.flags.bleedingGuideShown) {
      gs.flags.bleedingGuideShown = true;
      setTimeout(() => {
        EventBus.emit('notify', {
          message: '💡 치료법: 붕대(🩹) 또는 알코올 솜(🧴)을 사용하면 출혈을 멈출 수 있습니다.',
          type: 'info',
        });
      }, 300);
    }
    if ((diseaseId === 'deep_laceration' || gs.stats?.infection?.current > 20) && !gs.flags.infectionGuideShown) {
      gs.flags.infectionGuideShown = true;
      setTimeout(() => {
        EventBus.emit('notify', {
          message: '💡 감염 경고: 소독약(🧪) 또는 알코올 솜(🧴)으로 감염 수치를 낮추세요. 70 이상이면 패혈증 위험!',
          type: 'warn',
        });
      }, 600);
    }

    // 중증(3) 질환은 즉시 치료 경고
    if (def.severity >= 3) {
      setTimeout(() => {
        EventBus.emit('notify', {
          message: I18n.t('disease.severe', { name: def.name }),
          type: 'danger',
        });
      }, 200);
    }

    EventBus.emit('diseaseChanged', { diseases: gs.player.diseases });
  },

  // ── 사망 처리 (EndingSystem 경유) ─────────────────────────────

  _killByDisease(gs, def) {
    if (!gs.player.isAlive) return;
    gs.player.isAlive    = false;
    gs.player.deathCause = def.deathCause ?? def.name;
    gs.flags.diseaseDeathId = def.id;  // 엔딩 선택용
    EndingSystem.triggerDeathEnding(`질병:${def.id}`, gs);
  },

  // ── 치료 유틸 ─────────────────────────────────────────────────

  _cureByFilter(gs, diseaseIds, itemName) {
    const cured = gs.player.diseases.filter(d => diseaseIds.includes(d.id));
    if (cured.length === 0) return;
    gs.player.diseases = gs.player.diseases.filter(d => !diseaseIds.includes(d.id));
    for (const c of cured) {
      const def = DISEASES[c.id];
      EventBus.emit('notify', {
        message: I18n.t('disease.cured', { item: itemName, name: def.name }),
        type: 'success',
      });
    }
    EventBus.emit('diseaseChanged', { diseases: gs.player.diseases });
  },

  _hasDisease(gs, diseaseId) {
    return (gs.player.diseases ?? []).some(d => d.id === diseaseId);
  },

  // ── HUD 업데이트 ──────────────────────────────────────────────

  _updateDiseaseHUD(gs) {
    const container = document.getElementById('disease-status');
    if (!container) return;

    // 잠복 중 질병은 HUD에 노출하지 않음 (플레이어는 모르는 상태)
    const diseases = (gs.player.diseases ?? []).filter(d => (d.incubationTp ?? 0) === 0);
    if (diseases.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = diseases.map(d => {
      const def = DISEASES[d.id];
      if (!def) return '';

      const discovered = d.discovered !== false;
      const pct      = Math.min(100, Math.round((d.tpElapsed / (d.fatalTp ?? d.tpDuration)) * 100));
      const sevClass = discovered
        ? (def.severity >= 3 ? 'sev-high' : def.severity >= 2 ? 'sev-mid' : 'sev-low')
        : 'sev-unknown';

      const icon = discovered ? def.icon : '❓';
      const name = discovered ? def.name : '???';
      const desc = discovered ? def.description : '알 수 없는 증상. 진단 도구가 필요하다.';

      let progressBar = '';
      if (discovered && def.fatal && d.fatalTp) {
        progressBar = `<div class="disease-progress"><div class="disease-progress-fill ${sevClass}" style="width:${pct}%"></div></div>`;
      }

      return `
        <div class="disease-badge ${sevClass}" title="${desc}">
          <span class="disease-icon">${icon}</span>
          <span class="disease-name">${name}</span>
          ${progressBar}
        </div>`;
    }).join('');
  },

  // ── 진단 API ──────────────────────────────────────────────────
  // 진단 도구 아이템이 호출. 잠복 종료 후 미발견 질병을 공개.

  diagnoseAll(gs = GameState) {
    return this.diagnoseByFilter(gs, null);
  },

  diagnoseByFilter(gs = GameState, filterIds = null) {
    const diseases = gs.player?.diseases ?? [];
    const revealed = [];
    for (const d of diseases) {
      if (d.discovered !== false) continue;
      if ((d.incubationTp ?? 0) > 0) continue;
      if (filterIds && !filterIds.includes(d.id)) continue;
      d.discovered = true;
      const def = DISEASES[d.id];
      if (def) revealed.push(def.name);
    }
    if (revealed.length > 0) {
      EventBus.emit('diseaseChanged', { diseases: gs.player.diseases });
    }
    return revealed;
  },

  // ── 공개 조회 API ─────────────────────────────────────────────

  getActiveDiseases() {
    return (GameState.player.diseases ?? []).map(d => ({
      ...d,
      def: DISEASES[d.id],
    }));
  },
};

export default DiseaseSystem;
