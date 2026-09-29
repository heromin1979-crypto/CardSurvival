import DialogueScene from './DialogueScene.js';
import Projects from '../systems/CareerProjectSystem.js';
import DEFINITIONS from '../data/careerProjects.js';
import GameState from '../core/GameState.js';
import GameData from '../data/GameData.js';
import { getDialogueLocation } from '../data/questScenes.js';

const names = items => items.map(x => `${GameData.items[x.definitionId]?.name ?? x.definitionId} ×${x.qty}`).join(', ');
const operationSummary = operation => `${names(operation.costs)}${operation.powerCost ? ` + 지역 전력 ${operation.powerCost}회` : ''} → ${operation.powerOutput ? `지역 설비 운영 가능 ${operation.powerOutput}회` : names(operation.items)}`;
const CareerProjectScene = {
  init() {
    document.addEventListener('click', event => {
      const target = event.target.closest('[data-action="open-career-projects"], [data-career-project]');
      if (!target) return;
      document.getElementById('quest-modal')?.classList.remove('open');
      this.open(target.dataset.careerProject);
    });
  },
  open(initialProjectId) {
    DialogueScene.enqueueTask('career-projects', done => {
      let cleanup, selected = initialProjectId, page = 0, message = '', recovery = false;
      const render = () => {
        cleanup?.();
        const character = Object.values(GameData.characters).find(c => c.id === GameState.player.characterId);
        const base = { ...getDialogueLocation(), id: 'career-projects', eyebrow: '직업 프로젝트', speakerName: character?.name ?? '생존 기록', portrait: character?.portraitFull, dismissible: true };
        let scene;
        if (selected) {
          const info = Projects.inspect(selected);
          if (!info.def) { selected = null; render(); return; }
          const facilities = [...new Set(info.def.actions.flatMap(a => a.facilities ?? []))].map(id => GameData.items[id]?.name ?? id);
          const choices = recovery ? info.recovery.map(offer => ({ id: `recover:${offer.id}`, label: `${GameData.items[offer.id]?.name} 회수품 교환`, description: `${names(offer.costs)} → 1개 · 4TP`, disabledReason: offer.reason || undefined })) : info.state?.active ? [{ id: 'operate', label: info.operation.label, description: `${operationSummary(info.operation)} · ${info.operation.tpCost}TP`, disabledReason: info.operation.reason || undefined }]
            : [...info.actions.map(a => ({ id: a.id, label: a.installed ? `${a.label} 완료` : a.label, description: [names(a.items), a.foodCount ? `조리 음식 ${a.foodCount}개` : ''].filter(Boolean).join(', '), disabledReason: a.reason || undefined })),
              { id: 'activate', label: `가동·보고 (${info.def.tpCost}TP)`, disabledReason: info.activationReason || undefined }];
          if (!recovery && !info.state?.active && info.recovery.length) choices.push({ id: 'recovery', label: '전문 부품 회수·교환 대안' });
          choices.push({ id: 'back', label: recovery ? '공정으로 돌아가기' : '프로젝트 목록' });
          scene = { ...base, title: info.def.name, text: message || info.reason || info.def.hint,
            detail: [`장소: ${GameData.districts[info.def.districtId]?.name}`, facilities.length ? `설치 후 이용 가능한 설비: ${facilities.join(', ')}` : '',
              info.def.powerOutput || info.def.powerCost || info.operation?.powerOutput || info.operation?.powerCost ? `지역 전력 잔량: 설비 운영 가능 ${info.powerAvailable}/6회 (이 구역 전용).${info.def.powerCost ? ` 최초 가동 ${info.def.powerCost}회 소비.` : ''}${info.def.powerOutput ? ` 최초 가동 ${info.def.powerOutput}회 확보.` : ''}` : '',
              info.operation ? `가동 후: ${info.operation.label}. ${operationSummary(info.operation)}. 재사용 대기 ${info.operation.cooldownTP}TP.` : '',
              ...(info.def.requires ?? []).map(id => `선행: ${DEFINITIONS[id].name}`), ...(info.def.operated ?? []).map(id => `운영 1회 필요: ${DEFINITIONS[id].name}`)].filter(Boolean).join('\n'), choices };
        } else {
          const available = Object.values(DEFINITIONS).filter(p => GameState.quests.active.some(q => q.id === p.questId) || GameState.flags.careerProjects?.projects[p.id]);
          const choices = available.slice(page * 4, page * 4 + 4).map(p => ({ id: p.id, label: p.name, description: `${GameData.districts[p.districtId]?.name} · ${GameState.flags.careerProjects?.projects[p.id]?.active ? '운영 가능' : '공정 진행'}` }));
          if (page > 0) choices.push({ id: 'previous', label: '이전 목록' });
          if ((page + 1) * 4 < available.length) choices.push({ id: 'next', label: '다음 목록' });
          scene = { ...base, title: '설치·배식·교환·가동', text: available.length ? '진행할 공정을 선택하세요. 완료한 설비는 현지에서 다시 운영할 수 있습니다.' : '직업 퀘스트가 시작되면 해당 프로젝트가 이곳에 표시됩니다.', choices };
        }
        let rerender = false;
        cleanup = DialogueScene._render(scene, id => {
          rerender = true; message = '';
          if (id === 'back') { if (recovery) recovery = false; else selected = null; return; }
          if (id === 'recovery') { recovery = true; return; }
          if (id === 'next') { page++; return; }
          if (id === 'previous') { page--; return; }
          if (!selected) { selected = id; return; }
          const result = id.startsWith('recover:') ? Projects.recover(selected, id.slice(8)) : id === 'activate' ? Projects.activate(selected) : id === 'operate' ? Projects.operate(selected) : Projects.contribute(selected, id);
          message = result.ok ? (id === 'activate' ? '가동 완료. 설비 운영으로 물자를 생산·교환할 수 있습니다.' : id === 'operate' ? `운영 완료.${DEFINITIONS[selected].operation.powerOutput ? ' 지역 전력 잔량에 반영했습니다.' : ' 수령 물자는 바닥 또는 수령 대기열을 확인하세요.'}` : '투입 완료. 남은 공정을 진행하세요.') : result.reason;
        }, () => { if (rerender) render(); else done(); });
      };
      render();
      return () => cleanup?.();
    });
  },
};
export default CareerProjectScene;
