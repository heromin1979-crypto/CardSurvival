import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.DIALOGUE_E2E_URL ?? 'http://127.0.0.1:43189';
const server = process.env.DIALOGUE_E2E_URL ? null : spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '43189', '--strictPort'], { stdio: 'pipe' });
const output = 'tmp/progression/task-1';
const report = { checks: [], errors: [] };
let browser;
try {
  await mkdir(output, { recursive: true });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(`${base}/?tool=combat`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__combatToolReady);
  await page.evaluate(async () => {
    const { GameState: gs, CharCreate, GameData } = window.__combatTool;
    const dialogue = (await import('/js/ui/DialogueScene.js')).default;
    const quests = (await import('/js/systems/QuestSystem.js')).default;
    CharCreate._selectedChar = GameData.characters.find(c => c.id === 'doctor');
    CharCreate._selectedDistrict = CharCreate._selectedChar.homeDist;
    gs.ui.currentState = 'char_create';
    CharCreate._startGame('대화 검증');
    dialogue.reset();
    document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
    gs.ui.modalOpen = false;
    gs.quests = { active: [], completed: [], failed: [], pendingBranches: [] };
    gs.location.currentLandmark = 'lm_boramae_hospital';
    gs.location.currentSubLocation = 'boramae_emergency';
    quests.startQuest('mq_doctor_01');
  });
  await page.locator('.onboarding-close').click({ timeout: 400 }).catch(() => {});
  await page.locator('#dialogue-scene-overlay').waitFor();
  for (const [width, height] of [[1920,1080],[1280,720],[844,390]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${output}/doctor-start-${width}.png` });
    const panel = await page.locator('#dialogue-scene-overlay .npc-scene-panel').boundingBox();
    assert(panel && panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= width + 1 && panel.y + panel.height <= height + 1);
    const overflow = await page.locator('#dialogue-scene-overlay .npc-scene-panel').evaluate(el => el.scrollHeight > el.clientHeight + 2);
    assert.equal(overflow, false, '패널 전체 오버플로');
    const metrics = await page.locator('#dialogue-scene-overlay').evaluate(overlay => {
      const actualFont = el => parseFloat(getComputedStyle(el).fontSize) * (el.getBoundingClientRect().width / el.offsetWidth);
      return {
        textPx: Math.min(...[...overlay.querySelectorAll('.npc-greeting, .npc-scene-eyebrow, summary, button')].map(actualFont)),
        buttonPx: Math.min(...[...overlay.querySelectorAll('button')].map(el => {
          const rect = el.getBoundingClientRect();
          const clip = (el.closest('.npc-scene-choices') ?? el.closest('.npc-scene-panel')).getBoundingClientRect();
          return Math.min(rect.bottom, clip.bottom) - Math.max(rect.top, clip.top);
        })),
      };
    });
    assert(metrics.textPx >= 13.9, width + ' 표시 글자 14px 미달: ' + metrics.textPx);
    assert(metrics.buttonPx >= 39.9, width + ' 터치 영역 40px 미달: ' + metrics.buttonPx);
    report.checks.push(width + 'px 화면 실제 최소 글자 ' + metrics.textPx.toFixed(1) + 'px / 버튼 ' + metrics.buttonPx.toFixed(1) + 'px');
  }
  await page.setViewportSize({ width: 1920, height: 1080 });
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#dialogue-scene-overlay details').getAttribute('open'), '');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('npc-scene-leave')), true);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'SUMMARY');
  assert.match(await page.locator('#dialogue-scene-overlay details').innerText(), /붕대/);
  await page.locator('[data-scene-choice="continue"]').click();
  report.checks.push('의사 시작·목표, 1920/1280/844 화면 패널 경계 및 본문 스크롤');
  await page.evaluate(async () => {
    const { GameState: gs, NPCSystem } = window.__combatTool;
    NPCSystem.ensureInitialized();
    if (!gs.npcs.states.npc_wounded_soldier) NPCSystem._spawnNPC('npc_wounded_soldier', NPCSystem.getNPCDef('npc_wounded_soldier'));
    gs.npcs.states.npc_wounded_soldier.woundLevel = 1;
    const item = gs.createCardInstance('bandage', { quantity: 3 }); gs.placeCardInRow(item.instanceId, 'bottom');
    (await import('/js/ui/DialogueScene.js')).default.reset();
    gs.ui.modalOpen = false;
    (await import('/js/ui/NPCDialogueModal.js')).default.show('npc_wounded_soldier');
  });
  await page.locator('[data-dialogue-view="heal"]').click();
  await page.locator('#npc-wound-heal-btn').tap();
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.npcs.states.npc_wounded_soldier.woundLevel), 0);
  await page.locator('#npc-leave-btn').click();
  await page.locator('#dialogue-scene-overlay').waitFor();
  assert.match(await page.locator('#dialogue-scene-overlay').innerText(), /단계 보고/);
  await page.screenshot({ path: `${output}/doctor-report-1920.png` });
  await page.locator('[data-scene-choice="continue"]').click();
  report.checks.push('실제 NPC 부상 치료 터치 → 의사 완료 보고 큐');
  const trade = await page.evaluate(async () => {
    const { GameState: gs, NPCSystem } = window.__combatTool;
    NPCSystem._spawnNPC('npc_trader', NPCSystem.getNPCDef('npc_trader'));
    gs.npcs.states.npc_trader.trust = 5;
    const trade = NPCSystem.getAvailableTrades('npc_trader')[0];
    const item = gs.createCardInstance(trade.give.id, { quantity: trade.give.qty + 1 }); gs.placeCardInRow(item.instanceId, 'bottom');
    (await import('/js/ui/NPCDialogueModal.js')).default.show('npc_trader');
    return { ...trade, before: gs.countOnBoard(trade.give.id) };
  });
  await page.locator('[data-dialogue-view="trade"]').click();
  await page.locator('#npc-trade-0').click();
  assert.equal(await page.evaluate(id => window.__combatTool.GameState.countOnBoard(id), trade.give.id), trade.before - trade.give.qty);
  await page.screenshot({ path: `${output}/npc-trade-1920.png` });
  await page.locator('#npc-leave-btn').click();
  report.checks.push('NPC 거래 마우스 입력과 실제 재료 차감');
  await page.evaluate(async () => {
    const { GameState: gs } = window.__combatTool;
    const bus = (await import('/js/core/EventBus.js')).default;
    gs.quests.completed.push('mq_soldier_10');
    gs.quests.pendingBranches = [{ questId: 'mq_soldier_10', choiceIds: ['soldier_branch_b'] }];
    bus.emit('loaded', {});
  });
  await page.locator('[data-scene-choice="soldier_branch_b"]').waitFor();
  assert.equal(await page.locator('[data-scene-choice="soldier_branch_a"]').count(), 0);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#dialogue-scene-overlay').count(), 1);
  await page.screenshot({ path: `${output}/soldier-branch-1920.png` });
  await page.locator('[data-scene-choice="soldier_branch_b"]').tap();
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.flags.soldier_branch_b), true);
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.quests.pendingBranches.length), 0);
  report.checks.push('loaded 미결 군인 분기 복원·Esc 차단·터치 확정');
  await page.evaluate(async () => {
    const { GameState: gs, NPCSystem } = window.__combatTool;
    (await import('/js/ui/DialogueScene.js')).default.reset();
    gs.ui.modalOpen = false;
    NPCSystem._spawnNPC('npc_jisu', NPCSystem.getNPCDef('npc_jisu'));
    (await import('/js/ui/NPCDialogueModal.js')).default.show('npc_jisu');
  });
  await page.locator('#npc-dialogue-overlay.open').waitFor();
  await page.waitForTimeout(200);
  assert.equal(await page.locator('#npc-dialogue-overlay .npc-scene-character').evaluate(el => el.complete && el.naturalWidth > 0), true);
  await page.screenshot({ path: `${output}/npc-portrait-1920.png` });
  await page.locator('#npc-leave-btn').click();
  await page.evaluate(async () => {
    const scene = (await import('/js/ui/DialogueScene.js')).default;
    scene.enqueue({ id: 'stress', speakerName: '무전', title: '통신 기록', text: '긴 한국어 기록과 수급 단서를 확인합니다. '.repeat(120), choices: Array.from({length: 5}, (_, i) => ({id: String(i), label: '선택 ' + i})), dismissible: true });
  });
  await page.setViewportSize({ width: 1280, height: 720 });
  assert(await page.locator('#dialogue-scene-overlay .npc-scene-body').evaluate(el => el.scrollHeight > el.clientHeight));
  await page.locator('[data-scene-choice="4"]').tap();
  report.checks.push('기존 이지수 큰 인물 자산 정상 로드, 긴 무전 5개 선택지 터치와 독립 본문 스크롤');
  await page.evaluate(async () => {
    const scene = (await import('/js/ui/DialogueScene.js')).default;
    const npc = (await import('/js/ui/NPCDialogueModal.js')).default;
    scene.enqueue({id: 'before-npc', title: '예약 전', choices: [{id: 'next', label: '계속'}], dismissible: true});
    npc.show('npc_trader');
    scene.enqueue({id: 'after-npc', title: '예약 후', choices: [{id: 'next', label: '계속'}], dismissible: true});
  });
  await page.locator('[data-scene-choice="next"]').click();
  await page.locator('#npc-leave-btn').click();
  assert.match(await page.locator('#dialogue-scene-overlay').innerText(), /예약 후/);
  await page.locator('[data-scene-choice="next"]').click();
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.ui.modalOpen), false);
  report.checks.push('F1 예약 NPC 나가기 → 다음 장면 → modalOpen 해제, F2 제한 분기 복원, F3 summary 키보드 진입·펼침·Tab 순환');
  await page.evaluate(async () => {
    const { GameState: gs, NPCSystem } = window.__combatTool;
    const intake = (await import('/js/systems/PatientIntakeSystem.js')).default;
    const scene = (await import('/js/ui/DialogueScene.js')).default;
    const npc = (await import('/js/ui/NPCDialogueModal.js')).default;
    const bus = (await import('/js/core/EventBus.js')).default;
    scene.reset(); npc._close();
    gs.quests.active = []; gs.pendingLoot = []; gs.cards = {};
    gs.board = { top: [], environment: [], middle: Array(20).fill(null), bottom: Array(20).fill(null) };
    gs.time.day = 21;
    gs.location.currentDistrict = 'dongjak'; gs.location.currentLandmark = 'lm_boramae_hospital'; gs.location.currentSubLocation = 'boramae_emergency';
    const id = 'patient_park_jiyoung_42';
    delete gs.npcs.states[id]; NPCSystem.forceSpawn(id);
    intake._admitted = [id]; intake._patientMeta = { [id]: { admissionTP: gs.time.totalTP, hp: 100 } };
    for (const definitionId of ['antiseptic', 'broad_antibiotic', 'medical_station']) {
      const card = gs.createCardInstance(definitionId); gs.placeCardInRow(card.instanceId, 'bottom');
    }
    window.__patientCompletions = 0;
    bus.on('npcWoundHealed', ({ npcId }) => { if (npcId === id) window.__patientCompletions++; });
    npc.show(id);
  });
  await page.locator('[data-dialogue-view="heal"]').tap();
  await page.locator('[data-treatment-action="diagnose"]').tap();
  await page.locator('[data-treatment-action="clean"]').tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('[data-treatment-action="broad_antibiotic"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: output + '/patient-treatment-844.png' });
  assert.equal(await page.locator('[data-treatment-action]').count(), 3);
  assert.equal(await page.locator('[data-treatment-action="antibiotic"]').isDisabled(), true);
  assert.equal(await page.evaluate(() => window.__patientCompletions), 0);
  await page.locator('[data-treatment-action="broad_antibiotic"]').tap();
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.countOnBoard('broad_antibiotic')), 0);
  await page.locator('[data-treatment-action="recover"]').tap();
  assert.equal(await page.evaluate(() => window.__patientCompletions), 1);
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.npcs.states.patient_park_jiyoung_42.healed), true);
  report.checks.push('실제 감염 환자 진단→안정화→합성약 소비→회복 터치, 844px 3대안 표시·부족재료 비활성·완치 이벤트 1회');
  await page.evaluate(async () => {
    const gs = window.__combatTool.GameState;
    const npc = (await import('/js/ui/NPCDialogueModal.js')).default;
    const scene = (await import('/js/ui/DialogueScene.js')).default;
    const intake = (await import('/js/systems/PatientIntakeSystem.js')).default;
    const guard = (await import('/js/systems/GuardSystem.js')).default;
    const dispatch = (await import('/js/systems/DispatchSystem.js')).default;
    const choice = (await import('/js/ui/ContributionChoiceModal.js')).default;
    const bus = (await import('/js/core/EventBus.js')).default;
    npc._close(); scene.reset();
    const id = 'patient_lee_junho_16';
    gs.npcs.states[id] = { spawned: true, healed: true, woundLevel: 0 };
    intake._admitted = [id]; intake._patientMeta[id] = { hp: 100, admissionTP: gs.time.totalTP };
    intake._onNpcHealed(id);
    const saved = gs.serialize();
    scene.reset(); guard.init(); dispatch.init(); intake.init();
    gs.deserialize(saved); bus.emit('loaded', {}); choice.init();
  });
  await page.locator('#contribution-choice-modal [data-pick-index="1"]').tap();
  assert.equal(await page.evaluate(async () => {
    const intake = (await import('/js/systems/PatientIntakeSystem.js')).default;
    return intake.getRescuedInfo('patient_lee_junho_16')?.type;
  }), 'sponsor');
  assert.equal(await page.evaluate(() => window.__combatTool.GameState.ui.modalOpen), false);
  report.checks.push('완치 기여 선택 대기 저장→시스템 재초기화→loaded→실제 대안 버튼 터치→후원 확정·모달 소유권 해제');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${output}/playwright-report.json`, JSON.stringify(report, null, 2));
  await browser?.close(); server?.kill();
}
