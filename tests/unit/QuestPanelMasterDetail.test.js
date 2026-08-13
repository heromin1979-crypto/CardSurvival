// @vitest-environment happy-dom
// 퀘스트 모달은 마스터-디테일이다. 좌측 선택이 우측 상세와 어긋나거나,
// 마감 임박 퀘스트가 긴급으로 분류되지 않으면 플레이어가 마감을 놓친다.
import { describe, it, expect, beforeEach } from 'vitest';
import EventBus   from '../../js/core/EventBus.js';
import GameState  from '../../js/core/GameState.js';
import QuestPanel from '../../js/ui/QuestPanel.js';
import ITEMS      from '../../js/data/items.js';
import MAIN_QUESTS from '../../js/data/mainQuests/index.js';

const TODAY = 5;

function mountPanel() {
  document.body.innerHTML = `
    <div class="modal-overlay open" id="quest-modal">
      <div class="modal-box quest-modal-box">
        <div id="quest-modal-mount" class="quest-modal-mount"></div>
      </div>
    </div>
  `;
  const mount = document.getElementById('quest-modal-mount');
  QuestPanel.mount(mount);
  return mount;
}

function resetWorld() {
  EventBus._listeners = {};
  GameState.time = { day: TODAY, totalTP: 0, tpInDay: 0, hour: 6, isPaused: false };
  GameState.season = { current: 'spring', eventsTriggered: [] };
  GameState.player.characterId = 'doctor';
  GameState.flags = {};
  GameState.location.currentDistrict = 'dongjak';
  GameState.quests = {
    // deadline = startDay + deadlineDays. QuestSystem은 day > deadline일 때 만료시킨다.
    active: [
      { id: 'mq_doctor_02', startDay: 2, deadline: 6,  progress: 0 },  // D-1 → 긴급
      { id: 'mq_doctor_03', startDay: 4, deadline: 12, progress: 0 },  // D-7 → 메인
    ],
    completed: ['mq_doctor_01'],
    failed: [],
  };
  GameState.subObjectiveProgress = {};
}

const text = (root, sel) => root.querySelector(sel)?.textContent.trim() ?? null;

describe('QuestPanel 마스터-디테일 모달', () => {
  beforeEach(resetWorld);

  it('마감 잔여일로 긴급/메인을 갈라 탭 카운트에 반영한다', () => {
    const el = mountPanel();
    const count = tab => text(el, `.fmd-tab[data-quest-tab="${tab}"] .fmd-tab-count`);

    expect(count('urgent')).toBe('1');
    expect(count('main')).toBe('1');
    expect(count('done')).toBe('1');
    expect(count('all')).toBe(String(el.querySelectorAll('.fmd-item').length));
  });

  it('긴급 퀘스트를 목록 맨 위에 놓고 같은 퀘스트를 상세에 편다', () => {
    const el = mountPanel();
    const first = el.querySelector('.fmd-item');

    expect(first.classList.contains('urgent')).toBe(true);
    expect(first.classList.contains('selected')).toBe(true);
    expect(first.dataset.questId).toBe('mq_doctor_02');
    expect(text(el, '.fmd-hero-title')).toBe(MAIN_QUESTS.mq_doctor_02.title);
    expect(el.querySelector('.fmd-hero').classList.contains('urgent')).toBe(true);
  });

  it('마감 1일 이하면 카운트다운을 critical로 표시한다', () => {
    const el = mountPanel();
    const blocks = el.querySelectorAll('.fmd-cd-block');

    expect(blocks.length).toBe(3);
    expect([...blocks].every(b => b.classList.contains('critical'))).toBe(true);
    expect(text(blocks[0], '.num')).toBe('1');   // deadline 6 - day 5 = 1일
    expect(text(blocks[0], '.lbl')).toBe('DAY');
  });

  it('리스트 클릭이 상세 패널을 교체한다', () => {
    const el = mountPanel();
    el.querySelector('[data-quest-id="mq_doctor_03"]').click();

    expect(text(el, '.fmd-hero-title')).toBe(MAIN_QUESTS.mq_doctor_03.title);
    expect(el.querySelector('[data-quest-id="mq_doctor_03"]').classList.contains('selected')).toBe(true);
  });

  it('탭 전환이 목록을 걸러내고 첫 항목을 자동 선택한다', () => {
    const el = mountPanel();
    el.querySelector('[data-quest-tab="done"]').click();

    const items = el.querySelectorAll('.fmd-item');
    expect(items.length).toBe(1);
    expect(items[0].dataset.questId).toBe('mq_doctor_01');
    expect(text(el, '.fmd-hero-title')).toBe(MAIN_QUESTS.mq_doctor_01.title);
  });

  it('검색어로 목록을 좁힌다', () => {
    const el = mountPanel();
    const input = el.querySelector('[data-quest-search]');
    input.value = '간호사';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    const items = el.querySelectorAll('.fmd-item');
    expect(items.length).toBe(1);
    expect(items[0].dataset.questId).toBe('mq_doctor_02');
  });

  it('보상을 아이템 정의의 이름으로 렌더한다', () => {
    const el = mountPanel();
    const names = [...el.querySelectorAll('.fmd-reward-name')].map(n => n.textContent.trim());
    const firstItemId = MAIN_QUESTS.mq_doctor_02.reward.items?.[0]?.definitionId;

    expect(names).toContain('사기');
    if (firstItemId) expect(names).toContain(ITEMS[firstItemId].name);
  });

  it('선행 퀘스트가 안 끝난 퀘스트는 잠김으로 분류하고 해금 조건을 보여준다', () => {
    const el = mountPanel();
    el.querySelector('[data-quest-tab="locked"]').click();

    const items = el.querySelectorAll('.fmd-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].classList.contains('locked')).toBe(true);
    expect(el.querySelector('.fmd-lock')).not.toBeNull();
    expect(el.querySelector('.fmd-cd-block')).toBeNull();
  });

  it('다른 분기 플래그가 필요한 퀘스트는 잠김 목록에서 제외한다', () => {
    const branch = Object.values(MAIN_QUESTS)
      .find(q => q.characterId === 'doctor' && q.requiresFlag);
    expect(branch).toBeDefined();

    const el = mountPanel();
    el.querySelector('[data-quest-tab="locked"]').click();
    const ids = [...el.querySelectorAll('.fmd-item')].map(i => i.dataset.questId);

    expect(ids).not.toContain(branch.id);
  });

  it('닫기 버튼이 모달 오버레이를 닫는다', () => {
    const el = mountPanel();
    el.querySelector('.fmd-footer [data-quest-action="close"]').click();

    expect(document.getElementById('quest-modal').classList.contains('open')).toBe(false);
  });
});
