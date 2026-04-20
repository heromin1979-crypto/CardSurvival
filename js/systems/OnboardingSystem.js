// === ONBOARDING SYSTEM ===
// Day 1 신규 플레이어를 위한 단계별 힌트. 각 힌트는 1회만 표시됨.
import EventBus        from '../core/EventBus.js';
import GameState       from '../core/GameState.js';
import BodyStatusModal from '../ui/BodyStatusModal.js';

const STORAGE_KEY = 'cs_onboarding_seen';

const HINTS = {
  pickup:     '바닥의 카드를 드래그하거나 클릭해 인벤토리로 가져오세요.',
  tp:         'TP(시간 포인트)는 행동할 때마다 소모됩니다. 하루에 72 TP로 활동하세요.',
  move:       '인접 구역 카드를 클릭하면 이동할 수 있어요. 이동하면 새 아이템을 탐색합니다.',
  hydration:  '💧 수분이 감소하고 있어요. 음료 카드를 클릭해 섭취하세요.',
  bodyStatus: '부상이 생겼어요. HP 막대를 눌러 부위별 상태를 확인하고, 해당 부위에 치료 아이템을 드래그할 수 있어요.',
  firstCraft: '첫 의료품 제작 완료. 부위별 상태 창을 열어 치료 대상과 효과를 확인해보세요.',
};

function _showBoardTooltip() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  localStorage.setItem(STORAGE_KEY, '1');

  const overlay = document.createElement('div');
  overlay.id = 'onboarding-board-tooltip';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:500',
    'display:flex', 'align-items:center', 'justify-content:center',
    'pointer-events:none',
  ].join(';');
  overlay.innerHTML = `
    <div style="
      background:rgba(13,13,13,0.94);border:1px solid #c8a060;
      padding:16px 20px;border-radius:2px;max-width:260px;
      font-family:'JetBrains Mono',monospace;color:#c8a060;
      font-size:12px;text-align:center;pointer-events:auto;
      box-shadow:0 0 20px rgba(200,160,96,0.12);
    ">
      <div style="font-size:22px;margin-bottom:8px;">✋</div>
      <div style="line-height:1.6;">카드를 끌어다<br>다른 카드 위에 놓으세요</div>
      <div style="margin-top:8px;color:#555;font-size:10px;">아무 카드나 드래그하면 사라집니다</div>
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
function _show(msg) {
  EventBus.emit('notify', { message: '💡 ' + msg, type: 'info' });
}

const OnboardingSystem = {
  init() {
    // 최초 베이스캠프 진입 시 — 보드 사용법 안내 (세션 최초 1회)
    const unsubFirst = EventBus.on('stateTransition', ({ to }) => {
      if (to !== 'main') return;
      if (GameState.time.day !== 1 || GameState.time.totalTP > 0) return;
      unsubFirst();
      _showBoardTooltip();
    });

    // 첫 번째 아이템 획득 시
    EventBus.on('cardPlaced', () => {
      if (GameState.time.day > 1) return;
      if (_shown('pickup')) return;
      _markShown('pickup');
      _show(HINTS.pickup);
    });

    // 첫 번째 TP 소모 시
    EventBus.on('tpAdvance', () => {
      if (GameState.time.day > 1) return;
      if (_shown('tp')) return;
      _markShown('tp');
      _show(HINTS.tp);
    });

    // 첫 번째 지역 이동 시
    EventBus.on('districtChanged', () => {
      if (_shown('move')) return;
      _markShown('move');
      _show(HINTS.move);
    });

    // 수분 50% 이하 첫 도달 시
    EventBus.on('statChanged', () => {
      if (_shown('hydration')) return;
      const hydration = GameState.stats?.hydration;
      if (!hydration) return;
      if (hydration.current / hydration.max < 0.5) {
        _markShown('hydration');
        _show(HINTS.hydration);
      }
    });

    // 최초 부위 부상 발생 시 — BodyStatusModal 안내 (Beat 2)
    EventBus.on('bodyInjury', () => {
      if (_shown('body_status')) return;
      _markShown('body_status');
      _show(HINTS.bodyStatus);
    });

    // mq_doctor_07 완료 시 — BodyStatusModal 딥링크 (Beat 5)
    EventBus.on('questCompleted', ({ questId }) => {
      if (questId !== 'mq_doctor_07') return;
      if (_shown('mq_doctor_07_modal')) return;
      _markShown('mq_doctor_07_modal');
      setTimeout(() => {
        _show(HINTS.firstCraft);
        BodyStatusModal.open();
      }, 800);
    });
  },
};

export default OnboardingSystem;
