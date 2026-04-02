// === ONBOARDING SYSTEM ===
// Day 1 신규 플레이어를 위한 단계별 힌트. 각 힌트는 1회만 표시됨.
import EventBus  from '../core/EventBus.js';
import GameState from '../core/GameState.js';

const HINTS = {
  pickup:    '바닥의 카드를 드래그하거나 클릭해 인벤토리로 가져오세요.',
  tp:        'TP(시간 포인트)는 행동할 때마다 소모됩니다. 하루에 72 TP로 활동하세요.',
  move:      '인접 구역 카드를 클릭하면 이동할 수 있어요. 이동하면 새 아이템을 탐색합니다.',
  hydration: '💧 수분이 감소하고 있어요. 음료 카드를 클릭해 섭취하세요.',
};

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
  },
};

export default OnboardingSystem;
