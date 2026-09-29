import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import QuestSystem from '../systems/QuestSystem.js';
import { createQuestScene, NEUTRAL_BACKGROUND } from '../data/questScenes.js';
import { getNPCPortrait } from './npcPortraits.js';

const FOCUSABLE = 'button:not(:disabled), summary, [href], [tabindex="0"]';

export function fitDialogueViewport(box) {
  const app = document.getElementById('app');
  const update = () => {
    const rect = app?.getBoundingClientRect();
    const scale = app?.offsetWidth ? rect.width / app.offsetWidth : 1;
    box.classList.toggle('is-compact', scale < 0.95);
    box.style.setProperty('--dialogue-scale', String(scale || 1));
    box.style.setProperty('--dialogue-width', `${rect?.width || 1920}px`);
    box.style.setProperty('--dialogue-height', `${rect?.height || 1080}px`);
  };
  update();
  window.addEventListener('resize', update);
  return () => window.removeEventListener('resize', update);
}
export const escapeSceneText = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function renderDialogueStage({ background, locationName, portrait, sprite, speakerName, icon = '👤', caption = '', hasPerson = true }) {
  const esc = escapeSceneText;
  return `<div class="npc-scene-stage">
    <img class="npc-scene-background" src="${esc(background ?? NEUTRAL_BACKGROUND)}" alt="">
    <div class="npc-scene-location">${esc(locationName)}<span>${esc(caption)}</span></div>
    ${hasPerson ? `<div class="npc-scene-person ${sprite ? 'has-sheet' : portrait ? 'has-portrait' : 'has-fallback'}">
      <span class="npc-scene-fallback" ${portrait || sprite ? 'hidden' : ''} aria-label="${esc(speakerName)}">👤</span>
      ${portrait || sprite ? `<img class="npc-scene-character" src="${esc(portrait ?? sprite.src)}" alt="${esc(speakerName)}" ${sprite ? `style="width:${sprite.cols * 100}%;height:${sprite.rows * 100}%;top:-${(sprite.motions.idle?.row ?? 0) * 100}%"` : ''}>` : ''}
    </div>` : ''}
    <div class="npc-scene-caption">${esc(speakerName)}</div>
  </div>`;
}

export function bindDialogueImages(box) {
  const portrait = box.querySelector('.npc-scene-character');
  if (portrait) portrait.onerror = () => {
    portrait.hidden = true;
    portrait.parentElement.classList.remove('has-portrait', 'has-sheet');
    portrait.parentElement.classList.add('has-fallback');
    box.querySelector('.npc-scene-fallback').hidden = false;
  };
  const bg = box.querySelector('.npc-scene-background');
  if (bg) bg.onerror = () => {
    if (bg.getAttribute('src') !== NEUTRAL_BACKGROUND) bg.src = NEUTRAL_BACKGROUND;
    else bg.hidden = true;
  };
  box.querySelectorAll('.npc-scene-avatar img').forEach(img => { img.onerror = () => { img.hidden = true; }; });
}

export function handleDialogueKeys(event, box, close) {
  if (event.key !== 'Escape' && event.key !== 'Tab') return;
  event.stopImmediatePropagation();
  if (event.key === 'Escape') { event.preventDefault(); close?.(); return; }
  const elements = [...box.querySelectorAll(FOCUSABLE)];
  const first = elements[0], last = elements.at(-1);
  if (!first) { event.preventDefault(); return; }
  if (!box.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
    event.preventDefault(); (event.shiftKey ? last : first).focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}

const DialogueScene = {
  _queue: [], _active: null, _subscriptions: [], _timer: null,

  init() {
    this._subscriptions.forEach(off => off());
    this._subscriptions = [
      EventBus.on('questStarted', ({ def }) => { if (def.narrative) this.enqueue(createQuestScene(def, 'start')); }),
      EventBus.on('questCompleted', ({ def, bonusGranted }) => { if (def.narrative) this.enqueue(createQuestScene(def, 'complete', { bonusGranted })); }),
      EventBus.on('branchChoice', ({ questId }) => this.showBranch(questId)),
      EventBus.on('loaded', () => this.reset()),
      EventBus.on('newGameStarted', () => this.reset()),
      EventBus.on('playerDied', () => this.reset()),
      EventBus.on('stateTransition', ({ to }) => {
        if (['char_create', 'main_menu', 'ending', 'ending_gallery', 'slot_select'].includes(to)) this.reset();
      }),
    ];
  },

  showBranch(questId) {
    const pending = QuestSystem.getPendingBranch(questId);
    if (!pending) return;
    this.enqueue(createQuestScene(pending.def, 'branch', { options: pending.options }),
      id => QuestSystem.chooseBranch(questId, id));
  },

  enqueue(scene, onChoose) {
    return this.enqueueTask(scene.id, done => this._render(scene, onChoose, done));
  },

  // 시네마틱도 같은 소유권을 사용하므로 완료 대화·연출·강제 분기가 겹치지 않는다.
  enqueueTask(id, start) {
    if (id && (this._active?.id === id || this._queue.some(job => job.id === id))) return false;
    this._queue.push({ id, start });
    this._drain();
    return true;
  },

  _drain() {
    clearTimeout(this._timer);
    if (this._active || !this._queue.length) return;
    if (GameState.ui.modalOpen || GameState.combat?.active || ['combat', 'encounter'].includes(GameState.ui.currentState)) {
      this._timer = setTimeout(() => this._drain(), 100);
      return;
    }
    const job = this._queue.shift();
    this._active = job;
    const previousFocus = document.activeElement;
    GameState.ui.modalOpen = true;
    let finished = false;
    let starting = true;
    const release = () => {
      job.cleanup?.();
      if (this._active !== job) return;
      this._active = null;
      GameState.ui.modalOpen = false;
      if (previousFocus?.isConnected) previousFocus.focus();
      this._drain();
    };
    job.finish = () => {
      if (finished) return;
      finished = true;
      // 표시할 내용이 없어 즉시 완료되어도 cleanup 등록 뒤 다음 작업을 시작한다.
      if (!starting) release();
    };
    try {
      job.cleanup = job.start(job.finish);
      starting = false;
      if (finished) release();
    } catch (error) {
      starting = false;
      if (finished) release(); else job.finish();
      throw error;
    }
  },

  _render(scene, onChoose, done) {
    const esc = escapeSceneText;
    const overlay = document.createElement('div');
    overlay.id = 'dialogue-scene-overlay';
    overlay.className = 'npc-scene-overlay open';
    const portrait = scene.portrait ?? (scene.speakerId ? getNPCPortrait(scene.speakerId, { full: true }) : null);
    overlay.innerHTML = `<section class="npc-scene" role="dialog" aria-modal="true" aria-labelledby="dialogue-scene-name">
      ${renderDialogueStage({ ...scene, portrait, caption: scene.eyebrow, hasPerson: Boolean(scene.speakerId || portrait) })}
      <div class="npc-scene-panel">
        <header class="npc-scene-header"><div class="npc-scene-eyebrow">${esc(scene.eyebrow)}</div>
          ${portrait ? `<span class="npc-scene-avatar"><img src="${esc(portrait)}" alt=""></span>` : ''}
          <h2 id="dialogue-scene-name">${esc(scene.speakerName ?? scene.title)}</h2></header>
        <div class="npc-scene-body"><h3>${esc(scene.title)}</h3>
          ${scene.outcome ? `<div class="career-outcome" aria-label="행동 전후"><span>${esc(scene.outcome.before)}</span><span aria-hidden="true">→</span><strong>${esc(scene.outcome.after)}</strong></div>` : ''}
          <p class="npc-greeting">${esc(scene.text)}</p>
          ${scene.detail ? `<details class="npc-scene-detail"><summary>목표 보기</summary><p>${esc(scene.detail)}</p></details>` : ''}</div>
        <nav class="npc-scene-choices" aria-label="대화 선택">
          ${(scene.choices ?? []).map(choice => `<button data-scene-choice="${esc(choice.id)}" ${choice.disabledReason ? 'disabled' : ''}><span>${esc(choice.label)}${choice.description ? `<small>${esc(choice.description)}</small>` : ''}${choice.disabledReason ? `<small>${esc(choice.disabledReason)}</small>` : ''}</span><span aria-hidden="true">›</span></button>`).join('')}
        </nav>${scene.dismissible ? '<button class="npc-scene-leave">대화를 마친다 <span>Esc</span></button>' : ''}
      </div></section>`;
    (document.getElementById('app') ?? document.body).appendChild(overlay);
    const releaseViewport = fitDialogueViewport(overlay.querySelector('.npc-scene'));
    let chosen = false;
    const close = () => { if (scene.dismissible) done(); };
    const keyHandler = event => handleDialogueKeys(event, overlay, close);
    document.addEventListener('keydown', keyHandler, true);
    overlay.onclick = event => { if (event.target === overlay) close(); };
    overlay.querySelector('.npc-scene-leave')?.addEventListener('click', close);
    overlay.querySelectorAll('[data-scene-choice]').forEach(button => {
      button.onclick = () => {
        if (chosen || button.disabled) return;
        chosen = true;
        // 콜백 중 발행된 다음 장면은 현재 장면 뒤에 들어간다.
        try { onChoose?.(button.dataset.sceneChoice); }
        finally { done(); }
      };
    });
    bindDialogueImages(overlay);
    overlay.querySelector(FOCUSABLE)?.focus();
    this._closeCurrent = close;
    return () => {
      releaseViewport();
      document.removeEventListener('keydown', keyHandler, true);
      overlay.remove();
      this._closeCurrent = null;
    };
  },

  close() { this._closeCurrent?.(); },

  reset() {
    clearTimeout(this._timer);
    this._queue = [];
    this._active?.finish();
  },
};
export default DialogueScene;
