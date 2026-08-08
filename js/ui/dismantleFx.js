// === DISMANTLE FX ===
// 분해는 최대 4TP를 소비하는데도 카드가 즉시 사라져 시간이 흘렀다는 감각이 없었다.
// 원본 카드를 잠깐 흔들어 없앤 뒤 실제 분해를 실행한다. 연출 동안 카드 조작을
// 막는 것은 CSS(.dismantling)가 담당한다.

// CSS의 card-dismantle 키프레임 길이와 맞춘다.
export const DISMANTLE_FX_MS = 380;

/**
 * 보드에 렌더된 카드에 분해 연출을 재생한다.
 * 카드가 화면에 없으면(사이드 패널·미렌더 상태) 즉시 완료된다.
 * @returns {Promise<void>} 연출이 끝나면 resolve
 */
export function playDismantleFx(instanceId) {
  const el = document.querySelector(`[data-instance-id="${instanceId}"]`);
  if (!el) return Promise.resolve();

  el.classList.add('dismantling');
  return new Promise(resolve => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      el.classList.remove('dismantling');
      resolve();
    };
    // animationend가 오지 않는 환경(모션 축소·비표시 탭)을 대비한 상한
    el.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, DISMANTLE_FX_MS);
  });
}
