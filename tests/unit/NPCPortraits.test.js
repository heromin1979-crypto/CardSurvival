// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getNPCPortrait } from '../../js/ui/npcPortraits.js';
import { getCardImage } from '../../js/ui/CardFactory.js';
import CompanionPanel from '../../js/ui/CompanionPanel.js';
import CompanionModal from '../../js/ui/CompanionModal.js';
import NPCSystem from '../../js/systems/NPCSystem.js';

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = ''; });

describe('NPC 공용 초상', () => {
  it('지수는 실존하는 소형/전신 자산을 반환하고 다른 NPC는 기존 카드 fallback을 유지한다', () => {
    expect(getNPCPortrait('npc_jisu')).toBe('assets/images/characters/lee_jisoo_portrait.png');
    expect(getNPCPortrait('npc_jisu', { full: true })).toBe('assets/images/characters/lee_jisoo_full.png');
    for (const id of ['npc_jisu', 'npc_minjun', 'npc_yeongcheol', 'npc_daehan']) {
      for (const full of [true, false]) expect(existsSync(resolve(getNPCPortrait(id, { full })))).toBe(true);
    }
    expect(getNPCPortrait('npc_nurse')).toBe(getCardImage('npc_nurse'));
    expect(getNPCPortrait('unknown')).toBeNull();
  });

  it('동료 패널은 소형 초상을 쓰며 이미지 실패와 키보드 열기를 지원한다', () => {
    document.body.innerHTML = '<div id="bc-companion"></div>';
    vi.spyOn(CompanionPanel, '_companionIds').mockReturnValue(['npc_jisu']);
    vi.spyOn(CompanionPanel, '_statusHtml').mockReturnValue('');
    vi.spyOn(NPCSystem, 'getNPCDef').mockReturnValue({ maxHp: 50 });
    vi.spyOn(NPCSystem, 'getNPCState').mockReturnValue({ hp: 50, isCompanion: true });
    vi.spyOn(CompanionModal, 'open').mockImplementation(() => {});
    CompanionPanel.render();
    const card = document.querySelector('.bc-comp-card');
    const image = card.querySelector('.bc-comp-portrait img');
    expect(image.getAttribute('src')).toBe(getNPCPortrait('npc_jisu'));
    expect(card.tabIndex).toBe(0);
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(CompanionModal.open).toHaveBeenCalledWith('npc_jisu');
    image.dispatchEvent(new Event('error'));
    expect(card.querySelector('.bc-comp-portrait img')).toBeNull();
    expect(card.querySelector('.bc-comp-portrait-icon')).not.toBeNull();
  });
});
