// @vitest-environment happy-dom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import Dialogue from '../../js/ui/NPCDialogueModal.js';
import NPCSystem from '../../js/systems/NPCSystem.js';
import NPCQuestSystem from '../../js/systems/NPCQuestSystem.js';
import GameState from '../../js/core/GameState.js';
import SystemRegistry from '../../js/core/SystemRegistry.js';
import EventBus from '../../js/core/EventBus.js';
import SkillSystem from '../../js/systems/SkillSystem.js';

describe('NPC 대화 씬의 상태와 입력 수명', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"><button id="origin">대화</button><div id="modal-overlay"><div id="modal-box">기존 모달</div></div></div>';
    GameState.ui.modalOpen = false;
    vi.spyOn(NPCSystem, 'getNPCDef').mockReturnValue({ maxHp: 50, companion: { canRecruit: true, recruitTrust: 3 } });
    vi.spyOn(NPCSystem, 'getNPCState').mockReturnValue({ spawned: true, trust: 1, neglectDays: 2, isCompanion: false });
    vi.spyOn(NPCSystem, 'talkTo').mockImplementation(() => {});
    vi.spyOn(NPCSystem, 'canRecruit').mockReturnValue(false);
    vi.spyOn(NPCSystem, 'getDialogue').mockImplementation((id, type) => type === 'greet' ? '반갑습니다.' : '주변을 살펴보세요.');
    vi.spyOn(NPCSystem, 'getAvailableTrades').mockReturnValue([{ give: { id: 'cloth', qty: 2 }, receive: { id: 'bandage', qty: 1 } }]);
    vi.spyOn(NPCSystem, 'executeTrade').mockReturnValue(true);
    vi.spyOn(GameState, 'countOnBoard').mockReturnValue(3);
    vi.spyOn(NPCQuestSystem, 'getActiveQuest').mockReturnValue({ title: '붕대 준비', steps: [{ type: 'collect', itemId: 'bandage', qty: 5, hint: '붕대를 구하세요.' }] });
    vi.spyOn(SystemRegistry, 'get').mockReturnValue(null);
    Dialogue.init();
    document.getElementById('origin').focus();
  });
  afterEach(() => { Dialogue._close(); vi.restoreAllMocks(); });

  it('의뢰/거래 탐색과 거래 후 갱신은 대화 진입 효과를 다시 실행하지 않는다', () => {
    Dialogue.show('npc_nurse');
    expect(document.querySelector('.npc-trade-btn')).toBeNull();
    document.querySelector('[data-dialogue-view="quest"]').click();
    expect(document.querySelector('.npc-quest-section').textContent).toContain('3/5');
    document.querySelector('[data-dialogue-view="trade"]').click();
    expect(document.querySelector('.npc-trade-section').textContent).toContain('보유: 3');
    document.querySelector('.npc-trade-btn').click();
    expect(NPCSystem.executeTrade).toHaveBeenCalledWith('npc_nurse', 0);
    expect(NPCSystem.talkTo).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.npc-trade-btn')).not.toBeNull();
  });

  it('공용 모달 내용과 열린 상태를 보존하고 Escape 후 진입 포커스로 복귀한다', () => {
    document.getElementById('modal-overlay').classList.add('open');
    GameState.ui.modalOpen = true;
    Dialogue.show('npc_nurse');
    const sharedHandler = vi.fn();
    document.addEventListener('keydown', sharedHandler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.removeEventListener('keydown', sharedHandler);
    expect(sharedHandler).not.toHaveBeenCalled();
    expect(document.getElementById('modal-box').textContent).toBe('기존 모달');
    expect(document.getElementById('modal-overlay').classList.contains('open')).toBe(true);
    expect(GameState.ui.modalOpen).toBe(true);
    expect(document.activeElement.id).toBe('origin');
  });

  it('Tab은 씬 안에서 순환하고 연속 열기/닫기 후 상태가 남지 않는다', () => {
    Dialogue.show('npc_nurse');
    const leave = document.getElementById('npc-leave-btn');
    leave.focus();
    leave.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
    expect(Dialogue._box.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(leave);
    Dialogue._close();
    expect(GameState.ui.modalOpen).toBe(false);
    Dialogue.show('npc_nurse');
    Dialogue._close();
    expect(document.querySelectorAll('#npc-dialogue-overlay')).toHaveLength(1);
    expect(GameState.ui.modalOpen).toBe(false);
  });

  it('이미지 로딩 실패 시 대체 초상이 남는다', () => {
    Dialogue.show('npc_nurse');
    const portrait = document.querySelector('.npc-scene-character');
    portrait.dispatchEvent(new Event('error'));
    expect(portrait.hidden).toBe(true);
    expect(document.querySelector('.npc-scene-fallback').hidden).toBe(false);
  });

  it('강제 딜레마는 Escape로 닫히지 않고 선택 후 대화 상태를 유지한다', () => {
    Dialogue.show('npc_nurse');
    const chosen = vi.fn();
    Dialogue._showDilemma({ title: '선택', body: '결정하세요.', choices: [{ id: 'help', label: '돕는다' }], onChoice: chosen });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(document.getElementById('dilemma-overlay')).not.toBeNull();
    document.querySelector('.dilemma-choice-btn').click();
    expect(chosen).toHaveBeenCalledWith('help');
    expect(GameState.ui.modalOpen).toBe(true);
    expect(Dialogue._overlay.classList.contains('open')).toBe(true);
  });

  it('동료 치료는 응급키트 하나를 소모하고 HP를 회복하되 재진입하지 않는다', () => {
    NPCSystem.getNPCState.mockReturnValue({ spawned: true, trust: 4, isCompanion: true, hp: 10 });
    const kit = { definitionId: 'first_aid_kit', quantity: 2 };
    vi.spyOn(GameState, 'getBoardCards').mockReturnValue([kit]);
    vi.spyOn(NPCSystem, 'healCompanion').mockImplementation(() => {});
    Dialogue.show('npc_nurse');
    document.querySelector('[data-dialogue-view="companion"]').click();
    document.getElementById('npc-heal-btn').click();
    expect(kit.quantity).toBe(1);
    expect(NPCSystem.healCompanion).toHaveBeenCalledWith('npc_nurse', 30);
    expect(NPCSystem.talkTo).toHaveBeenCalledTimes(1);
  });

  it('부상 치료는 재료·단계·신뢰도 및 완치 이벤트 계약을 유지한다', () => {
    const state = { spawned: true, trust: 0, isCompanion: false, woundLevel: 1 };
    const def = { maxHp: 50, woundHealItem: 'bandage', woundHealQty: 2, companion: { canRecruit: false, recruitTrust: 3 } };
    NPCSystem.getNPCDef.mockReturnValue(def);
    NPCSystem.getNPCState.mockReturnValue(state);
    const bandages = { definitionId: 'bandage', quantity: 3 };
    vi.spyOn(GameState, 'getBoardCards').mockReturnValue([bandages]);
    vi.spyOn(SkillSystem, 'gainXp').mockImplementation(() => {});
    vi.spyOn(EventBus, 'emit').mockImplementation(() => {});
    Dialogue.show('npc_soldier_deserter');
    document.querySelector('[data-dialogue-view="heal"]').click();
    document.getElementById('npc-wound-heal-btn').click();
    expect(bandages.quantity).toBe(1);
    expect(state).toMatchObject({ woundLevel: 0, trust: 1, healed: true });
    expect(def.companion.canRecruit).toBe(true);
    expect(EventBus.emit).toHaveBeenCalledWith('npcWoundHealed', { npcId: 'npc_soldier_deserter' });
    expect(NPCSystem.talkTo).toHaveBeenCalledTimes(1);
  });

  it.each(['recruit', 'dismiss', 'dispatch'])('%s 선택은 기존 동료 명령을 실행하고 씬을 닫는다', action => {
    const companion = action !== 'recruit';
    NPCSystem.getNPCState.mockReturnValue({ spawned: true, trust: 4, isCompanion: companion, hp: 50 });
    NPCSystem.canRecruit.mockReturnValue(true);
    vi.spyOn(NPCSystem, 'recruit').mockReturnValue(true);
    vi.spyOn(NPCSystem, 'dismiss').mockImplementation(() => {});
    vi.spyOn(EventBus, 'emit').mockImplementation(() => {});
    Dialogue.show('npc_nurse');
    document.querySelector('[data-dialogue-view="companion"]').click();
    document.getElementById(action === 'dispatch' ? 'npc-dispatch-btn' : 'npc-recruit-btn').click();
    if (action === 'dispatch') expect(EventBus.emit).toHaveBeenCalledWith('npcDispatchForage', { npcId: 'npc_nurse' });
    else expect(NPCSystem[action]).toHaveBeenCalledWith('npc_nurse');
    expect(GameState.ui.modalOpen).toBe(false);
  });

  it('기능이 없으면 주제를 숨기고 거래 재료 부족 이유를 표시한다', () => {
    NPCSystem.getNPCDef.mockReturnValue({ maxHp: 50 });
    NPCSystem.getDialogue.mockReturnValue('');
    NPCQuestSystem.getActiveQuest.mockReturnValue(null);
    GameState.countOnBoard.mockReturnValue(0);
    Dialogue.show('npc_trader');
    expect(document.querySelector('[data-dialogue-view="companion"]')).toBeNull();
    expect(document.querySelector('[data-dialogue-view="quest"]')).toBeNull();
    document.querySelector('[data-dialogue-view="trade"]').click();
    expect(document.querySelector('.npc-trade-btn').disabled).toBe(true);
    expect(document.querySelector('.npc-trade-section').textContent).toContain('2개 부족');
  });

  it('초기화를 반복해도 한 번의 대화 이벤트는 한 번만 진입한다', () => {
    Dialogue.init();
    EventBus.emit('openNPCDialogue', { npcId: 'npc_nurse' });
    expect(NPCSystem.talkTo).toHaveBeenCalledTimes(1);
  });

  it('단독 딜레마는 선택 전 modalOpen을 유지하고 선택 후 원상복귀한다', () => {
    Dialogue._showDilemma({ title: '결정', body: '선택하세요.', choices: [{ id: 'stay', label: '남는다' }] });
    expect(GameState.ui.modalOpen).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(GameState.ui.modalOpen).toBe(true);
    document.querySelector('.dilemma-choice-btn').click();
    expect(GameState.ui.modalOpen).toBe(false);
    expect(document.activeElement.id).toBe('origin');
  });

  it('미번역 키는 실제 NPC 소개로 대체하며 없는 정보 메뉴와 빈 상세를 숨긴다', () => {
    NPCSystem.getDialogue.mockImplementation((id, type) => `npc.jisu.${type}0`);
    Dialogue.show('npc_jisu');
    expect(Dialogue._box.textContent).not.toContain('npc.jisu.');
    expect(document.querySelector('.npc-greeting').textContent).toBe('삼성병원 응급의학과 전문의. 치료 프로토콜 개발자.');
    expect(document.querySelector('[data-dialogue-view="info"]')).toBeNull();
    expect(document.querySelector('#npc-scene-detail').hidden).toBe(true);
    expect(document.querySelector('.npc-scene-character').getAttribute('src')).toBe('assets/images/characters/lee_jisoo_full.png');
  });

  it('동료 명령 중 강제 선택이 열려도 뒤의 대화를 닫은 뒤 modalOpen이 꼬이지 않는다', () => {
    Dialogue.show('npc_nurse');
    Dialogue._showDilemma({ title: '결정', body: '선택하세요.', choices: [{ id: 'stay', label: '남는다' }] });
    Dialogue._close();
    expect(GameState.ui.modalOpen).toBe(true);
    expect(document.activeElement.classList.contains('dilemma-choice-btn')).toBe(true);
    document.querySelector('.dilemma-choice-btn').click();
    expect(GameState.ui.modalOpen).toBe(false);
    expect(document.activeElement.id).toBe('origin');
  });
});
