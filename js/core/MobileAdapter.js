/**
 * MobileAdapter.js
 * Capacitor 모바일 환경 감지 및 네이티브 플러그인 초기화
 *
 * - Android/iOS에서만 실행되는 코드를 안전하게 래핑
 * - Electron/브라우저 환경에서는 no-op으로 동작
 * - main.js에서 최초로 import해야 함
 */

/** 현재 Capacitor 네이티브 환경인지 여부 */
export const isNative = () =>
  typeof window !== 'undefined' &&
  typeof window.Capacitor !== 'undefined' &&
  window.Capacitor.isNativePlatform();

/** Android인지 여부 */
export const isAndroid = () =>
  isNative() && window.Capacitor.getPlatform() === 'android';

/** iOS인지 여부 */
export const isIOS = () =>
  isNative() && window.Capacitor.getPlatform() === 'ios';

/**
 * 모바일 어댑터 초기화
 * main.js 에서 앱 시작 시 한 번 호출
 */
export async function initMobileAdapter() {
  if (!isNative()) return; // Electron / 브라우저에서는 건너뜀

  try {
    const [
      { StatusBar, Style },
      { SplashScreen },
      { App },
      { Haptics, ImpactStyle },
    ] = await Promise.all([
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
      import('@capacitor/app'),
      import('@capacitor/haptics'),
    ]);

    // ── 상태바 설정 ───────────────────────────────────────
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#0d0d0d' });
    }

    // ── 스플래시 스크린 숨기기 (게임 로드 후) ─────────────
    await SplashScreen.hide({ fadeOutDuration: 500 });

    // ── 뒤로가기 버튼 처리 (Android) ─────────────────────
    App.addListener('backButton', ({ canGoBack }) => {
      const pauseScreen    = document.getElementById('screen-pause');
      const charCreateScreen = document.getElementById('screen-char_create');
      const mainMenuScreen = document.getElementById('screen-main_menu');

      const isPauseVisible    = pauseScreen?.classList.contains('active');
      const isCharCreate      = charCreateScreen?.classList.contains('active');
      const isMainMenu        = mainMenuScreen?.classList.contains('active');

      if (isPauseVisible || isMainMenu) {
        // 일시정지/메인메뉴 상태 → 앱 최소화
        App.minimizeApp();
      } else if (isCharCreate) {
        // 캐릭터 생성 화면 → 메인메뉴로 복귀
        import('../core/StateMachine.js').then(({ default: StateMachine }) => {
          StateMachine.transition('main_menu');
        });
      } else {
        // 게임 중 → 일시정지
        import('../core/StateMachine.js').then(({ default: StateMachine }) => {
          StateMachine.transition('pause');
        });
      }
    });

    // ── 화면 꺼짐 방지 ────────────────────────────────────
    try {
      const { KeepAwake } = await import('@capacitor-community/keep-awake');
      await KeepAwake.keepAwake();
    } catch (_) {
      // keep-awake 플러그인 없으면 무시
    }

    // ── 진동 헬퍼 전역 등록 ───────────────────────────────
    window.mobileHaptics = {
      light: () => Haptics.impact({ style: ImpactStyle.Light }),
      medium: () => Haptics.impact({ style: ImpactStyle.Medium }),
      success: () => Haptics.notification({ type: 'SUCCESS' }),
      error: () => Haptics.notification({ type: 'ERROR' }),
    };

    console.log('[MobileAdapter] 초기화 완료:', window.Capacitor.getPlatform());
  } catch (err) {
    console.warn('[MobileAdapter] 초기화 실패:', err);
  }
}

/**
 * 카드 드래그 완료 시 진동 피드백
 * TouchDrag.js 에서 호출
 */
export function hapticCardDrop() {
  window.mobileHaptics?.light?.();
}

/**
 * 전투 피해 진동
 * CombatSystem.js 에서 호출
 */
export function hapticDamage() {
  window.mobileHaptics?.medium?.();
}

/**
 * 사망 / 치명적 이벤트 진동
 */
export function hapticCritical() {
  window.mobileHaptics?.error?.();
}
