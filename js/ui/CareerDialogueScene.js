import DialogueScene from './DialogueScene.js';
import Dialogues from '../systems/CareerDialogueSystem.js';
import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData from '../data/GameData.js';
import { getDialogueLocation } from '../data/questScenes.js';
import { NEXT_CAREER_STEPS } from '../data/careerRoutes.js';

const CareerDialogueScene = {
  _offs: [], _click: null, _timer: null, _openingResolved: false,
  init() {
    this._offs.forEach(off => off());
    if (this._click) document.removeEventListener('click', this._click);
    this._click = event => {
      const target = event.target.closest('[data-action="open-career-dialogues"], [data-career-dialogue]');
      if (!target) return;
      document.getElementById('quest-modal')?.classList.remove('open');
      this.open(target.dataset.careerDialogue);
    };
    document.addEventListener('click', this._click);
    const schedule = () => { clearTimeout(this._timer); this._timer = setTimeout(() => this.resume(), 100); };
    this._offs = [EventBus.on('openCareerDialogue', ({ topicId } = {}) => this.open(topicId)),
      EventBus.on('loaded', () => {
        this._openingResolved = true;
        Dialogues.list();
        const memory = GameState.flags.careerDialogues;
        // 대화 이력이 없는 기존 저장은 선택 진입으로 제공하고 강제 도입하지 않는다.
        if (memory && !Object.keys(memory.topics).length && !memory.pendingTopic) memory.introduced = true;
        schedule();
      }),
      EventBus.on('openingChoice', () => { this._openingResolved = true; schedule(); }),
      EventBus.on('newGameStarted', () => { this._openingResolved = false; schedule(); }),
      EventBus.on('stateTransition', () => { if (GameState.ui.currentState === 'char_create') this._openingResolved = false; schedule(); })];
  },
  resume() {
    if (GameState.ui.currentState !== 'main' || !GameState.player.isAlive || !GameState.player.characterId) return;
    const core = Dialogues.list().find(t => t.kind === 'core');
    if (!core) return;
    Dialogues.inspect(core.id);
    const memory = GameState.flags.careerDialogues;
    if (core.characterId === 'doctor' && !memory.introduced && !this._openingResolved) return;
    if (memory.pendingTopic) { this.open(memory.pendingTopic); return; }
    if (!memory.introduced && GameState.location.currentDistrict === core.districtId) {
      memory.introduced = true; this.open(core.id); EventBus.emit('saveGame');
    }
  },
  open(topicId) {
    return DialogueScene.enqueueTask('career-dialogues', done => {
      let selected = topicId, cleanup, message = '', changing = false;
      const owner = DialogueScene._active;
      const render = () => {
        cleanup?.();
        if (!GameState.player.isAlive || !['main', 'explore'].includes(GameState.ui.currentState) || DialogueScene._active !== owner) { done(); return; }
        const info = selected ? Dialogues.inspect(selected) : null;
        if (selected && !info.def) { selected = null; render(); return; }
        let scene;
        if (!selected) {
          scene = { ...getDialogueLocation(), title: '만남과 생활', speakerName: '초반 생존 기록', eyebrow: '직업 대화', text: '이전에 정한 방법과 실제 작업 결과를 이어갑니다.', dismissible: true,
            choices: Dialogues.list().map(t => ({ id: t.id, label: t.title, description: t.status === 'completed' ? '후속 반응' : `${t.kind === 'core' ? '전문 행동' : '생활·위험 대응'} · ${GameData.districts[t.districtId]?.name}` })) };
        } else {
          const { def, state, choice } = info;
          if (state.status !== 'completed') GameState.flags.careerDialogues.pendingTopic = selected;
          const waiting = choice && !changing;
          const choices = state.status === 'completed' ? [{ id: 'back', label: '다른 주제 보기' }]
            : waiting ? [{ id: 'perform', label: state.rescued ? '처치 결과를 확인한다' : '선택한 작업을 실행한다', disabledReason: info.actionReason || undefined,
              description: state.paid ? '구조 비용 지불 완료 · 실제 치료 필요' : `${choice.tp}TP · ${Object.entries(info.costs).map(([id, qty]) => `${GameData.items[id]?.name ?? id} ×${qty}`).join(', ') || '물품 소비 없음'}` },
            { id: 'ask', label: '필요한 준비와 대안을 묻는다' }, ...(state.paid ? [] : [{ id: 'change', label: '다른 방법을 검토한다' }]), { id: 'later', label: '준비 후 돌아온다' }]
            : [...def.choices.map(c => ({ id: c.id, label: info.dogAbsent ? c.id === 'feed' ? '주민에게 통조림을 나누고 교대한다' : c.id === 'watch' ? '직접 집결지 경계를 맡는다' : c.label : c.label, description: `${c.tp}TP · ${Object.entries(c.costs).map(([id, qty]) => `${GameData.items[id]?.name ?? id} ×${qty}`).join(', ') || '물품 소비 없음'}${def.evidence === 'food' ? ' · 직접 조리한 음식 1개 추가 제공' : ''}`, disabledReason: info.reason || undefined })),
              { id: 'ask', label: '상황과 준비를 더 묻는다' }, { id: 'later', label: '나중에 돌아온다' }];
          scene = { ...getDialogueLocation(), title: def.title, speakerName: info.speakerPresent ? def.speakerName : '부재한 간호사의 진료 기록',
            speakerId: info.speakerPresent ? def.speakerId : undefined, eyebrow: def.kind === 'core' ? '첫 전문 행동' : '생활과 위험 대응', dismissible: true,
            text: message || info.reason || (state.status === 'completed' ? state.resultText || choice.result : info.patientAbsent ? '박상훈 하사를 진료할 수 없습니다. 새로 입원한 환자를 확인하고 실제 치료를 끝내 다음 환자를 준비하세요.' : info.dogAbsent ? '군견과 함께할 수 없습니다. 주민들과 직접 경계를 나누고 이동 경로를 살펴야 합니다.' : def.text), detail: `${state.status === 'completed' ? NEXT_CAREER_STEPS[def.characterId] : def.hint}\n다음 단서: ${GameData.districts[def.nextDistrict]?.name ?? def.nextDistrict}`, choices };
        }
        let again = false;
        cleanup = DialogueScene._render(scene, id => {
          again = true; message = '';
          if (!selected) { selected = id; return; }
          if (id === 'back') { selected = null; return; }
          if (id === 'change') { changing = true; return; }
          const result = id === 'perform' ? Dialogues.perform(selected) : Dialogues.choose(selected, id);
          message = result.message || result.reason || '';
          if (id === 'later') again = false;
          if (result.ok && id !== 'ask') changing = false;
        }, () => {
          if (again) render();
          else { if (selected) Dialogues.choose(selected, 'later'); done(); }
        });
      };
      render(); return () => cleanup?.();
    });
  },
};
export default CareerDialogueScene;
