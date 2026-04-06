// === CINEMATIC SCENE UI ===
// 주요 시나리오 분기점에서 풀스크린 연출 장면을 표시하는 컴포넌트
//
// 사용법:
//   window.__CinematicScene__.show('cin_death_dehydration', () => { ... });
//
// EventBus:
//   'showCinematic' { sceneId, onComplete } — 외부에서 트리거 가능

import EventBus from '../core/EventBus.js';
import CINEMATIC_SCENES from '../data/cinematicScenes.js';

const CinematicScene = {
  _el: null,
  _bgEl: null,
  _titleEl: null,
  _subtitleEl: null,
  _linesEl: null,
  _ctaEl: null,
  _active: false,
  _dismissHandler: null,
  _keyHandler: null,
  _autoTimer: null,
  _ctaTimer: null,

  init() {
    this._buildDOM();

    EventBus.on('showCinematic', ({ sceneId, onComplete }) => {
      this.show(sceneId, onComplete);
    });
  },

  _buildDOM() {
    const el = document.createElement('div');
    el.id = 'cinematic-overlay';
    el.className = 'cinematic-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', '시네마틱 장면');
    el.innerHTML = `
      <div class="cinematic-bg" id="cinematic-bg"></div>
      <div class="cinematic-vignette"></div>
      <div class="cinematic-gradient-top"></div>
      <div class="cinematic-gradient-bottom"></div>
      <div class="cinematic-content">
        <div class="cinematic-header">
          <div class="cinematic-title" id="cinematic-title"></div>
          <div class="cinematic-subtitle" id="cinematic-subtitle"></div>
        </div>
        <div class="cinematic-lines" id="cinematic-lines"></div>
        <div class="cinematic-cta" id="cinematic-cta">— 클릭하거나 스페이스바를 눌러 계속 —</div>
      </div>
    `;
    document.getElementById('app').appendChild(el);

    this._el = el;
    this._bgEl = el.querySelector('#cinematic-bg');
    this._titleEl = el.querySelector('#cinematic-title');
    this._subtitleEl = el.querySelector('#cinematic-subtitle');
    this._linesEl = el.querySelector('#cinematic-lines');
    this._ctaEl = el.querySelector('#cinematic-cta');
  },

  show(sceneId, onComplete) {
    const scene = CINEMATIC_SCENES[sceneId];
    if (!scene) {
      onComplete?.();
      return;
    }

    // 이미 활성 중이면 큐에 추가하지 않고 건너뜀
    if (this._active) {
      onComplete?.();
      return;
    }
    this._active = true;

    this._clearTimers();
    this._reset();

    // 배경 그라디언트
    this._el.style.background = scene.gradient ?? '#0a0a0a';

    // 배경 이미지 (없으면 그라디언트만 표시)
    if (scene.image) {
      this._bgEl.style.backgroundImage = `url('${scene.image}')`;
      this._bgEl.style.opacity = '1';
    } else {
      this._bgEl.style.backgroundImage = 'none';
      this._bgEl.style.opacity = '0';
    }

    // 텍스트
    this._titleEl.textContent = scene.title ?? '';
    this._subtitleEl.textContent = scene.subtitle ?? '';
    this._ctaEl.style.opacity = '0';
    this._ctaEl.style.animation = 'none';

    // 텍스트 라인 생성
    const lines = scene.lines ?? [];
    this._linesEl.innerHTML = '';
    const lineEls = lines.map(text => {
      const div = document.createElement('div');
      div.className = 'cinematic-line';
      div.textContent = text;
      this._linesEl.appendChild(div);
      return div;
    });

    // 오버레이 표시 (fade in)
    this._el.classList.add('active');

    // 텍스트 라인 순차 fadeIn (첫 라인 800ms 후 시작, 이후 900ms 간격)
    lineEls.forEach((lineEl, i) => {
      setTimeout(() => {
        if (this._active) lineEl.classList.add('visible');
      }, 800 + i * 900);
    });

    // 모든 라인 표시 후 CTA 표시
    const allLinesDelay = 800 + Math.max(0, lines.length - 1) * 900 + 700;
    this._ctaTimer = setTimeout(() => {
      if (!this._active) return;
      this._ctaEl.style.opacity = '1';
      this._ctaEl.style.animation = 'cinematicPulse 2s ease-in-out infinite';
    }, allLinesDelay);

    // 해제 콜백 정의
    const dismiss = () => this._dismiss(onComplete);

    // 클릭/탭 해제 (최소 1.5초 후에만 허용 — 실수 클릭 방지)
    this._dismissHandler = dismiss;
    setTimeout(() => {
      if (this._active) {
        this._el.addEventListener('click', dismiss, { once: true });
        this._el.addEventListener('touchend', dismiss, { once: true, passive: true });
      }
    }, 1500);

    // 키보드 해제
    this._keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape') {
        e.preventDefault();
        this._dismiss(onComplete);
      }
    };
    setTimeout(() => {
      if (this._active) {
        document.addEventListener('keydown', this._keyHandler);
      }
    }, 1500);

    // 자동 진행 (displayMs > 0)
    if ((scene.displayMs ?? 0) > 0) {
      const autoDelay = Math.max(scene.displayMs, allLinesDelay + 2000);
      this._autoTimer = setTimeout(() => {
        this._dismiss(onComplete);
      }, autoDelay);
    }
  },

  _dismiss(onComplete) {
    if (!this._active) return;
    this._active = false;

    this._clearTimers();
    this._removeListeners();

    // fade out 애니메이션
    this._el.classList.remove('active');
    this._el.classList.add('exiting');

    setTimeout(() => {
      this._el.classList.remove('exiting');
      this._reset();
      onComplete?.();
    }, 600);
  },

  _reset() {
    this._bgEl.style.backgroundImage = 'none';
    this._linesEl.innerHTML = '';
    this._titleEl.textContent = '';
    this._subtitleEl.textContent = '';
    this._ctaEl.style.opacity = '0';
    this._ctaEl.style.animation = 'none';
  },

  _clearTimers() {
    if (this._ctaTimer)  { clearTimeout(this._ctaTimer);  this._ctaTimer  = null; }
    if (this._autoTimer) { clearTimeout(this._autoTimer); this._autoTimer = null; }
  },

  _removeListeners() {
    if (this._dismissHandler) {
      this._el.removeEventListener('click',    this._dismissHandler);
      this._el.removeEventListener('touchend', this._dismissHandler);
      this._dismissHandler = null;
    }
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
  },
};

export default CinematicScene;
