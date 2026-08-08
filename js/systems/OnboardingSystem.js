// === ONBOARDING SYSTEM ===
// Day 1 신규 플레이어를 위한 단계별 힌트. 각 힌트는 1회만 표시됨.
// 표시 문구는 locales.js의 onboarding.* 네임스페이스(ko/en)에서 가져온다.
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import I18n            from '../core/I18n.js';
import BodyStatusModal from '../ui/BodyStatusModal.js';
import ModalManager    from '../ui/ModalManager.js';
import EquipmentSystem from './EquipmentSystem.js';
import NPCS            from '../data/npcs.js';
import BALANCE         from '../data/gameBalance.js';

const STORAGE_KEY = 'cs_onboarding_seen';

// 기능 도입 이전 세이브(day 2+) 로드 시 '표시됨'으로 시딩하는 상태 기반 힌트 —
// 로드 직후 조건이 이미 충족되어 있어 시딩 없이는 토스트가 연달아 발화한다.
// 이벤트 기반 1회 안내(질병·환자·오프닝 등)는 기존 세이브에서도 유효하므로 제외
const STATE_HINT_KEYS = [
  'pickup', 'tp', 'move', 'hydration', 'board_rows', 'board_pages',
  'bag_slots', 'equip', 'weight', 'noise', 'doctor_infection',
];

function _showBoardTooltip() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  localStorage.setItem(STORAGE_KEY, '1');

  const overlay = document.createElement('div');
  overlay.id = 'onboarding-board-tooltip';
  overlay.innerHTML = `
    <div class="onboarding-tooltip-card">
      <div class="onboarding-tooltip-icon">✋</div>
      <div class="onboarding-tooltip-text">카드를 끌어다<br>다른 카드 위에 놓으세요</div>
      <div class="onboarding-tooltip-sub">아무 카드나 드래그하면 사라집니다</div>
    </div>`;

  document.body.appendChild(overlay);

  const dismiss = () => {
    overlay.remove();
    unsubCard();
    unsubMoved();
  };
  const unsubCard  = EventBus.on('cardPlaced', dismiss);
  const unsubMoved = EventBus.on('cardMoved',  dismiss);
  overlay.addEventListener('click', dismiss, { once: true });
}

function _shown(key) {
  return !!(GameState.flags?.['onboarding_' + key]);
}
function _markShown(key) {
  if (!GameState.flags) GameState.flags = {};
  GameState.flags['onboarding_' + key] = true;
}
function _show(key, type = 'info', params) {
  EventBus.emit('notify', { message: '💡 ' + I18n.t('onboarding.' + key, params), type });
}
// ModalManager 계열이 아닌 전면 모달(응급실 등, z-index 8000)은 ui.modalOpen을
// 설정하지 않으므로 DOM으로 직접 확인한다 — 가이드 모달은 z 950이라 그 아래에 깔린다
function _blockingOverlayOpen() {
  if (GameState.ui?.modalOpen) return true;
  if (typeof document === 'undefined' || typeof document.querySelector !== 'function') return false;
  return !!document.querySelector('.er-modal.open, .modal-overlay.open');
}
// 언어 변경에 대응하도록 가이드 본문은 표시 시점에 조립한다
function _guideRow(keyKey, textKey) {
  return `<li><span class="og-key">${I18n.t(keyKey)}</span>${I18n.t(textKey)}</li>`;
}
function _patientGuide() {
  const g = 'onboarding.guide.patient.';
  return {
    title: I18n.t(g + 'title'),
    html: `
      <p class="og-lead">${I18n.t(g + 'lead')}</p>
      <ul class="og-rules">
        ${_guideRow(g + 'neglectKey', g + 'neglect')}
        ${_guideRow(g + 'leaveKey', g + 'leave')}
        ${_guideRow(g + 'nurseKey', g + 'nurse')}
        ${_guideRow(g + 'rewardKey', g + 'reward')}
      </ul>`,
  };
}
function _diseaseGuide() {
  const g = 'onboarding.guide.disease.';
  return {
    title: I18n.t(g + 'title'),
    html: `
      <p class="og-lead">${I18n.t(g + 'lead')}</p>
      <ul class="og-rules">
        ${_guideRow(g + 'thermoKey', g + 'thermo')}
        ${_guideRow(g + 'stethoKey', g + 'stetho')}
        ${_guideRow(g + 'kitKey', g + 'kit')}
      </ul>
      <p class="og-note">${I18n.t(g + 'note')}</p>`,
  };
}
// 안내 모달 표시. 다른 모달이 열려 있거나 모달 DOM이 없는 환경(테스트 등)에서는
// 내용을 덮어쓰지 않도록 토스트로 대체한다.
function _openGuideModal(guide, fallbackKey) {
  if (_blockingOverlayOpen()) {
    _show(fallbackKey);
    return;
  }
  ModalManager.open(`
    <div class="onboarding-guide">${guide.html}</div>
    <div class="modal-actions">
      <button class="modal-btn" id="onboarding-guide-confirm">${I18n.t('onboarding.guide.confirm')}</button>
    </div>`, guide.title);
  if (!GameState.ui?.modalOpen) {
    _show(fallbackKey);
    return;
  }
  document.getElementById('onboarding-guide-confirm')
    ?.addEventListener('click', () => ModalManager.close(), { once: true });
}

const OnboardingSystem = {
  init() {
    // 최초 베이스캠프 진입 시 — 보드 사용법 안내 (세션 최초 1회)
    // 시작 NPC/동료 카드 spawn 애니메이션과 겹치지 않도록 짧게 지연
    const unsubFirst = EventBus.on('stateTransition', ({ to }) => {
      if (to !== 'main') return;
      if (GameState.time.day !== 1 || GameState.time.totalTP > 0) return;
      unsubFirst();
      setTimeout(() => _showBoardTooltip(), 1500);
    });

    // 기능 도입 이전 세이브 호환 — 구 가이드 플래그 이관 + 상태 기반 힌트 시딩
    EventBus.on('loaded', () => {
      const legacy = GameState.flags ?? {};
      if (legacy.diseaseIncubationGuideShown) _markShown('disease_diagnose');
      if (legacy.bleedingGuideShown) _markShown('bleeding_treat');
      if (legacy.infectionGuideShown) _markShown('infection_treat');
      if (legacy.siegeTutorialWarned) _markShown('siege_warning');
      if ((GameState.time?.day ?? 1) >= 2) {
        for (const key of STATE_HINT_KEYS) _markShown(key);
      }
    });

    // 첫 번째 아이템 획득 시
    // 캐릭터 생성 중 시작 아이템 배치(totalTP 0)도 cardPlaced를 발행하므로 제외 —
    // 가드 없이는 보드를 보기도 전에 1회성 힌트가 소모된다
    EventBus.on('cardPlaced', () => {
      if (GameState.time.day > 1) return;
      if (GameState.time.totalTP === 0) return;
      if (_shown('pickup')) return;
      _markShown('pickup');
      _show('pickup');
    });

    // 첫 번째 TP 소모 시
    EventBus.on('tpAdvance', () => {
      if (GameState.time.day > 1) return;
      if (_shown('tp')) return;
      _markShown('tp');
      _show('tp');
    });

    // 첫 번째 지역 이동 시
    EventBus.on('districtChanged', () => {
      if (_shown('move')) return;
      _markShown('move');
      _show('move');
    });

    // 수분 50% 이하 첫 도달 시
    EventBus.on('statChanged', () => {
      if (_shown('hydration')) return;
      const hydration = GameState.stats?.hydration;
      if (!hydration) return;
      if (hydration.current / hydration.max < 0.5) {
        _markShown('hydration');
        _show('hydration');
      }
    });

    // 최초 부위 부상 발생 시 — BodyStatusModal 안내 (Beat 2)
    EventBus.on('bodyInjury', () => {
      if (_shown('body_status')) return;
      _markShown('body_status');
      _show('bodyStatus');
    });

    // mq_doctor_07 완료 시 — BodyStatusModal 딥링크 (Beat 5)
    EventBus.on('questCompleted', ({ questId }) => {
      if (questId !== 'mq_doctor_07') return;
      if (_shown('mq_doctor_07_modal')) return;
      _markShown('mq_doctor_07_modal');
      setTimeout(() => {
        _show('firstCraft');
        BodyStatusModal.open();
      }, 800);
    });

    const isDoctor = () => GameState.player?.characterId === 'doctor';

    // 첫 NPC 치료 성공 시 — 의료 스킬 성장 안내 (의사 전용)
    EventBus.on('npcHealed', () => {
      if (!isDoctor()) return;
      if (_shown('doctor_skill')) return;
      _markShown('doctor_skill');
      _show('doctorSkill');
    });

    // 부상 NPC 스폰 시 — 청진기 진단 안내 (의사 전용)
    // 게임 시작 시점(totalTP 0)의 초기 NPC 스폰은 오프닝 씬 안내와 겹치므로 제외
    EventBus.on('npcSpawned', ({ npcId }) => {
      if (!isDoctor()) return;
      if (_shown('doctor_diagnose')) return;
      if (GameState.time.day === 1 && GameState.time.totalTP === 0) return;
      if (!(NPCS[npcId]?.woundLevel > 0)) return;
      if (GameState.countOnBoard('stethoscope') <= 0) return;
      _markShown('doctor_diagnose');
      _show('doctorDiagnose');
    });

    // 감염도 30 최초 돌파 시 (의사 전용)
    // 전 직업 감염 안내(infection_treat)와 내용이 같으므로 한쪽이 뜨면 양쪽 모두 소모
    EventBus.on('statChanged', () => {
      if (!isDoctor()) return;
      if (_shown('doctor_infection')) return;
      const infection = GameState.stats?.infection;
      if (!infection || infection.current < 30) return;
      _markShown('doctor_infection');
      _markShown('infection_treat');
      _show('doctorInfection');
    });

    // 첫 환자 입원 시 — 방치 타이머·간호사 대행 안내 모달 (의사 전용)
    EventBus.on('patientAdmitted', () => {
      if (!isDoctor()) return;
      if (_shown('doctor_patient')) return;
      // NPC 스폰 알림·카드 배치 애니메이션이 끝난 뒤 표시.
      // 플래그는 표시 직전에 마킹 — 지연 중 저장되면 안내가 영구 소실되기 때문
      setTimeout(() => {
        if (_shown('doctor_patient')) return;
        _markShown('doctor_patient');
        _openGuideModal(_patientGuide(), 'doctorPatient');
      }, 400);
    });

    // 첫 완치 시 — 기여 보상·의료 기록장 안내 (의사 전용)
    // 대안 기여가 있는 환자는 patientCured 전에 contributionChoiceNeeded가 먼저
    // 발생하므로, 선택 전에 안내가 보이도록 두 이벤트를 모두 구독한다
    const showContribution = () => {
      if (!isDoctor()) return;
      if (_shown('doctor_contribution')) return;
      _markShown('doctor_contribution');
      _show('doctorContribution');
    };
    EventBus.on('contributionChoiceNeeded', showContribution);
    EventBus.on('patientCured', showContribution);

    // 질병 발생 시 안내 3종 (전 직업, DiseaseSystem에서 이관)
    // setTimeout 지연은 발병 알림(🩺/위험)과 토스트가 겹치지 않게 하기 위함
    EventBus.on('diseaseContracted', ({ diseaseId }) => {
      // 잠복기 발현 질병의 진단 안내 모달 — 즉시 발견되는 질병(출혈 등)은
      // discovered=true라 "???" 안내가 무의미하므로 제외
      if (!_shown('disease_diagnose')) {
        const disease = GameState.player?.diseases?.find(d => d.id === diseaseId);
        if (disease && !disease.discovered) {
          setTimeout(() => {
            if (_shown('disease_diagnose')) return;
            _markShown('disease_diagnose');
            _openGuideModal(_diseaseGuide(), 'diseaseDiagnose');
          }, 400);
        }
      }
      // 최초 출혈 발생 시 치료법 안내
      if (diseaseId === 'bleeding' && !_shown('bleeding_treat')) {
        setTimeout(() => {
          if (_shown('bleeding_treat')) return;
          _markShown('bleeding_treat');
          _show('bleedingTreat');
        }, 300);
      }
      // 최초 감염 위험 시 감염 관리 안내 — 의사 전용 안내(doctor_infection)와 상호 소모
      if ((diseaseId === 'deep_laceration' || (GameState.stats?.infection?.current ?? 0) > 20)
          && !_shown('infection_treat')) {
        setTimeout(() => {
          if (_shown('infection_treat')) return;
          _markShown('infection_treat');
          _markShown('doctor_infection');
          _show('infectionTreat', 'warn');
        }, 600);
      }
    });

    // 의사 오프닝에서 치료 선택 직후 — 붕대 드래그 조작 안내 (CharCreate에서 이관)
    EventBus.on('openingChoice', ({ characterId, choice }) => {
      if (characterId !== 'doctor' || choice !== 'treat') return;
      if (_shown('doctor_opening_heal')) return;
      _markShown('doctor_opening_heal');
      _show('doctorOpeningHeal');
    });

    // Day 7 습격 예고 (HospitalSiegeSystem에서 이관)
    // 조작 힌트가 아닌 위험 경고이므로 💡 prefix 없이 경고 배너 성격을 유지
    EventBus.on('siegeWarningDue', () => {
      if (_shown('siege_warning')) return;
      _markShown('siege_warning');
      EventBus.emit('notify', {
        message: '⚠️ ' + I18n.t('onboarding.siegeWarning'),
        type: 'warning',
        persistent: true,
      });
    });

    // 첫 메인 진입 시 — 보드 3열 구조 안내
    // 드래그 오버레이(1.5초)와 초기 힌트가 지나간 뒤 표시되도록 지연
    EventBus.on('stateTransition', ({ to }) => {
      if (to !== 'main') return;
      if (GameState.time.day !== 1 || GameState.time.totalTP > 0) return;
      if (_shown('board_rows')) return;
      setTimeout(() => {
        if (_shown('board_rows')) return;
        _markShown('board_rows');
        _show('boardRows');
      }, 6000);
    });

    // 바닥(middle) 2페이지 이후 슬롯에 카드가 처음 배치될 때 — 페이저 안내
    // 10 = BoardRenderer의 MIDDLE_PAGE_SIZE (1페이지 슬롯 수)
    EventBus.on('cardPlaced', ({ row, slot }) => {
      if (_shown('board_pages')) return;
      if (row !== 'middle' || slot < 10) return;
      _markShown('board_pages');
      _show('boardPages');
    });

    // 가방 장착으로 휴대 2페이지가 생긴 시점 (EquipmentSystem이 boardReinit 발행)
    EventBus.on('boardReinit', () => {
      if (_shown('bag_slots')) return;
      if (!(GameState.player?.extraSlots > 0)) return;
      _markShown('bag_slots');
      _show('bagSlots');
    });

    // 장착 가능한 아이템을 처음 휴대했을 때 — 장비 창 사용법 안내
    // 게임 시작 시점(totalTP 0)의 시작 아이템 배치는 제외
    EventBus.on('cardPlaced', ({ instanceId, row }) => {
      if (_shown('equip')) return;
      if (row !== 'bottom') return;
      if (GameState.time.day === 1 && GameState.time.totalTP === 0) return;
      const def = GameState.getCardDef(instanceId);
      if (!def) return;
      if (EquipmentSystem.getSlotsForDef(def).length === 0) return;
      _markShown('equip');
      _show('equip');
    });

    // 무게 경고 비율 최초 도달 시 — 과적 페널티(100%) 전에 미리 안내
    // 전용 이벤트가 없어 카드 이동 계열 이벤트에서 weightPct를 확인한다.
    // EncumbranceSystem이 이 시스템보다 늦게 init되어 같은 이벤트의 재계산이
    // 나중에 돌기 때문에 setTimeout으로 갱신 이후 값을 읽는다 (main.js init 순서)
    const checkWeight = () => {
      if (_shown('weight')) return;
      setTimeout(() => {
        if (_shown('weight')) return;
        const enc = GameState.player?.encumbrance;
        if (!enc || enc.weightPct < (BALANCE.stats?.weightWarnPct ?? 0.75)) return;
        _markShown('weight');
        _show('weight', 'warn', {
          immobilePct: Math.round((BALANCE.travel?.immobileWeightPct ?? 2.0) * 100),
        });
      }, 0);
    };
    EventBus.on('cardPlaced', checkWeight);
    EventBus.on('cardMoved', checkWeight);

    // 소음 경고 레벨 최초 도달 시 — 유입 임계 전에 미리 경고
    // NoiseSystem이 TP마다 stat:'noise'로 statChanged를 발행한다
    EventBus.on('statChanged', ({ stat, newVal } = {}) => {
      if (stat !== 'noise') return;
      if (_shown('noise')) return;
      if ((newVal ?? 0) < (BALANCE.noise?.warnLevel ?? 40)) return;
      _markShown('noise');
      _show('noise', 'warn', { influx: BALANCE.noise?.influxThreshold ?? 60 });
    });
  },
};

export default OnboardingSystem;
