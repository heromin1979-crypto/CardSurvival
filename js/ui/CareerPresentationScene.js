import EventBus from '../core/EventBus.js';
import GameState from '../core/GameState.js';
import GameData from '../data/GameData.js';
import AutoSave from '../persistence/AutoSave.js';
import DialogueScene from './DialogueScene.js';
import { getDialogueLocation } from '../data/questScenes.js';

export const CAREER_OUTCOMES = {
  doctor: { title: '한 사람의 호흡을 되찾다', before: '도움이 필요한 환자', after: '치료 결과 확인' },
  soldier: { title: '돌아갈 길을 확보하다', before: '확인되지 않은 통로', after: '정찰 결과 확보' },
  firefighter: { title: '출구 너머의 사람', before: '잔해 속 구조 요청', after: '구조 결과 확인' },
  homeless: { title: '오늘을 버틸 연결', before: '혼자 모은 회수품', after: '교환과 신용의 시작' },
  chef: { title: '첫 그릇을 건네다', before: '식사를 기다리는 사람', after: '직접 조리한 식사 전달' },
  engineer: { title: '멈춘 설비의 첫 응답', before: '작동하지 않는 설비', after: '수리 결과 확인' },
};

const Presentation = {
  _subscriptions: [], _epoch: 0,
  _state() {
    return GameState.flags.careerPresentation ??= { seen: {}, pending: {} };
  },
  init() {
    this._subscriptions.forEach(off => off());
    this._subscriptions = [
      EventBus.on('careerDialogueCompleted', result => {
        if (result.kind !== 'core' || result.characterId !== GameState.player.characterId) return;
        const outcome = CAREER_OUTCOMES[result.characterId];
        if (!outcome) return;
        this._queue(`success:${result.characterId}`, {
          ...getDialogueLocation(), ...outcome, characterId: result.characterId,
          text: result.resultText ?? '전문 행동을 마쳤습니다. 대화 기록에서 결과와 다음 단서를 확인하세요.',
          detail: result.nextHint ?? '퀘스트 창의 「직업 대화·다음 동선」에서 다음 준비와 회수 경로를 확인할 수 있습니다.',
        });
      }),
      EventBus.on('nightStarted', () => {
        if (!CAREER_OUTCOMES[GameState.player.characterId]) return;
        this._queue('first-night', {
          ...getDialogueLocation(), title: '첫 밤, 돌아온 자리',
          text: '멀리서 들리던 발소리가 잦아듭니다. 쉬기 전에 식수와 체온, 상처를 확인하세요. 동료가 있다면 야간 경계도 나눌 수 있습니다.',
          detail: '생활 대화는 퀘스트 창의 「직업 대화·다음 동선」에서 다시 열 수 있습니다. 대화를 닫아도 시간이 흐르거나 물자가 소비되지 않습니다.',
        });
      }),
      EventBus.on('newGameStarted', () => { this._epoch++; }),
      EventBus.on('stateTransition', ({ to }) => { if (to === 'main') this._resume(); }),
      EventBus.on('loaded', () => {
        this._epoch++;
        this._resume();
      }),
    ];
  },
  _resume() {
    const epoch = this._epoch;
    // 로드 초기화·휴식 복귀가 끝나고 표시 가능한 보드에서 미확인 결과를 복원한다.
    queueMicrotask(() => {
      if (epoch !== this._epoch || !GameState.player.isAlive || GameState.ui.currentState !== 'main') return;
      for (const [id, data] of Object.entries(this._state().pending)) this._show(id, data);
    });
  },
  _queue(id, data) {
    const state = this._state();
    if (state.seen[id] || state.pending[id]) return;
    AutoSave.deferUntilComplete(() => {
      state.pending[id] = data;
      this._show(id, data);
      EventBus.emit('saveGame');
    });
  },
  _show(id, data) {
    if (this._state().seen[id]) return;
    DialogueScene.enqueueTask(`presentation:${id}`, done => {
      if (!GameState.player.isAlive || GameState.ui.currentState !== 'main') { done(); return; }
      const character = GameData.characters.find(c => c.id === data.characterId);
      EventBus.emit('careerPresentationShown', { characterId: data.characterId, kind: id === 'first-night' ? 'night' : 'success' });
      return DialogueScene._render({
        ...data, id, eyebrow: id === 'first-night' ? '휴식 전 확인' : '첫 전문 행동의 결과',
        speakerName: character?.name ?? '생존 기록', portrait: character?.portraitFull,
        outcome: data.before ? { before: data.before, after: data.after } : null,
        choices: [{ id: 'continue', label: '기록하고 계속한다' }], dismissible: true,
      }, null, () => {
        AutoSave.deferUntilComplete(() => {
          const state = this._state();
          state.seen[id] = true;
          delete state.pending[id];
          EventBus.emit('saveGame');
        });
        done();
      });
    });
  },
};
export default Presentation;
