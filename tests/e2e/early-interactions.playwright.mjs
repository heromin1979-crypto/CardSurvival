import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://127.0.0.1:43191';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '43191', '--strictPort'], { stdio: 'pipe' });
const output = 'tmp/early-interactions';
const report = { checks: [], errors: [] };
let browser;
try {
  await mkdir(output, { recursive: true });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', error => report.errors.push(error.message));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(`${base}/?tool=combat`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__combatToolReady);
  for (const character of ['doctor', 'soldier', 'firefighter', 'homeless', 'chef', 'engineer']) {
    await page.evaluate(async id => {
      const { GameState: gs, CharCreate, GameData } = window.__combatTool;
      (await import('/js/ui/DialogueScene.js')).default.reset();
      CharCreate._selectedChar = GameData.characters.find(c => c.id === id);
      CharCreate._selectedDistrict = CharCreate._selectedChar.homeDist;
      gs.ui.currentState = 'char_create';
      CharCreate._startGame('초반 인터랙션 검증');
    }, character);
    await page.waitForTimeout(200);
    await page.locator('.onboarding-close').click({ timeout: 400 }).catch(() => {});
    await page.evaluate(async id => {
      const gs = window.__combatTool.GameState;
      (await import('/js/ui/DialogueScene.js')).default.reset();
      document.querySelectorAll('.modal-overlay.open').forEach(el => el.classList.remove('open'));
      gs.ui.modalOpen = false;
      (await import('/js/ui/CareerDialogueScene.js')).default.open(`${id}_core`);
    }, character);
    await page.locator('[data-scene-choice="ask"]').click();
    assert.match(await page.locator('#dialogue-scene-overlay').innerText(), /다음 단서|준비|처치|구조|제작/);
    await page.locator('[data-scene-choice="later"]').click();
    await page.evaluate(async () => {
      const { GameState: gs } = window.__combatTool;
      const saved = gs.serialize(); gs.deserialize(saved);
      (await import('/js/core/EventBus.js')).default.emit('loaded', {});
    });
    await page.waitForTimeout(100);
    await page.evaluate(async id => {
      (await import('/js/ui/DialogueScene.js')).default.reset();
      window.__combatTool.GameState.ui.modalOpen = false;
      (await import('/js/ui/CareerDialogueScene.js')).default.open(`${id}_core`);
    }, character);
    const choiceId = await page.evaluate(async id => (await import('/js/data/careerDialogues.js')).default[`${id}_core`].choices[0].id, character);
    await page.locator(`[data-scene-choice="${choiceId}"]`).click();
    // 각 공식 도메인에 필요한 물자만 공급하는 통합 시나리오. 자연 수급 캠페인은 별도다.
    await page.evaluate(async id => {
      const { GameState: gs, GameData } = window.__combatTool;
      const topics = (await import('/js/data/careerDialogues.js')).default;
      const dialogues = (await import('/js/systems/CareerDialogueSystem.js')).default;
      const craft = (await import('/js/systems/CraftSystem.js')).default;
      const treatment = (await import('/js/systems/PatientTreatmentSystem.js')).default;
      const topic = topics[`${id}_core`];
      const add = (item, quantity = 1) => {
        const card = gs.createCardInstance(item, { quantity });
        if (!card) throw new Error(`없는 아이템 ${item}`);
        gs.placeCardInRow(card.instanceId, 'bottom');
      };
      for (const [item, qty] of Object.entries(topic.choices[0].costs)) add(item, qty);
      if (topic.evidence === 'treatment') {
        add('bandage', 3);
        for (let step = 0; step < 5 && !gs.npcs.states.npc_wounded_soldier.healed; step++) {
          const inspection = treatment.inspect('npc_wounded_soldier');
          const result = treatment.treat('npc_wounded_soldier', inspection.actions[0].id);
          if (!result.ok) throw new Error(result.reason);
        }
      }
      if (topic.evidence === 'rescueTreatment') {
        const result = dialogues.perform(topic.id);
        if (!result.ok) throw new Error(result.reason);
        add('bandage');
        if (!treatment.treat('npc_early_resident', 'bandage').ok) throw new Error('주민 치료 실패');
      }
      if (['food', 'water'].includes(topic.evidence)) {
        add('campfire'); add('rice'); add('boiled_water'); add('contaminated_water');
        const blueprint = topic.evidence === 'food' ? 'cook_rice' : 'make_boiled_water';
        const can = craft.canStartBlueprint(blueprint);
        if (!can.ok) throw new Error(JSON.stringify(can));
        const random = Math.random;
        try { Math.random = () => 0.99; craft.startBlueprint(blueprint); }
        finally { Math.random = random; }
      }
      if (topic.evidence === 'project') {
        const projects = (await import('/js/systems/CareerProjectSystem.js')).default;
        const def = (await import('/js/data/careerProjects.js')).default[topic.projectId];
        gs.quests.active.push({ id: def.questId, progress: 0 });
        gs.flags.hiddenRecipesUnlocked = [...new Set([...(gs.flags.hiddenRecipesUnlocked ?? []), 'workbench'])];
        for (const stage of GameData.blueprints.workbench.stages) for (const req of stage.requiredItems) add(req.definitionId, req.qty);
        if (!craft.canStartBlueprint('workbench').ok) throw new Error('작업대 제작 준비 실패');
        const random = Math.random;
        try {
          Math.random = () => 0.99;
          craft.startBlueprint('workbench');
          if (!craft.advanceCraftStage(gs.crafting.activeQueue[0].craftCardId)) throw new Error('작업대 제작 실패');
        } finally { Math.random = random; }
        for (const action of def.actions) {
          for (const req of action.items) add(req.definitionId, req.qty);
          const result = projects.contribute(def.id, action.id);
          if (!result.ok) throw new Error(result.reason);
        }
        const result = projects.activate(def.id);
        if (!result.ok) throw new Error(result.reason);
      }
      (await import('/js/ui/DialogueScene.js')).default.reset(); gs.ui.modalOpen = false;
      (await import('/js/ui/CareerDialogueScene.js')).default.open(topic.id);
    }, character);
    assert.equal(await page.locator('[data-scene-choice="perform"]').isEnabled(), true, `${character}: ${await page.locator('#dialogue-scene-overlay').innerText()}`);
    await page.locator('[data-scene-choice="perform"]').click();
    assert.equal(await page.evaluate(id => window.__combatTool.GameState.flags.careerDialogues.topics[`${id}_core`].status, character), 'completed');
    await page.screenshot({ path: `${output}/${character}-result.png` });
    await page.locator('.npc-scene-leave').click();
    // 실제 완료 이벤트가 생성한 성공 연출 확인.
    await page.waitForFunction(() => document.querySelector('.career-outcome'));
    await page.locator('[data-scene-choice="continue"]').click();
    assert.equal(await page.evaluate(id => window.__combatTool.GameState.flags.careerPresentation.seen[`success:${id}`], character), true);
    await page.evaluate(async id => {
      (await import('/js/ui/DialogueScene.js')).default.reset();
      window.__combatTool.GameState.ui.modalOpen = false;
      (await import('/js/ui/CareerDialogueScene.js')).default.open(`${id}_life`);
    }, character);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(120);
    const panel = await page.locator('.npc-scene-panel').boundingBox();
    assert(panel.x >= 0 && panel.y >= 0 && panel.x + panel.width <= 845 && panel.y + panel.height <= 391);
    const body = await page.locator('.npc-scene-body').boundingBox();
    assert(body.height >= 70, `${character}: 선택 목록 때문에 대사 영역이 사라지면 안 됨`);
    await page.screenshot({ path: `${output}/${character}-life-844.png` });
    await page.locator('[data-scene-choice="later"]').click();
    await page.setViewportSize({ width: 1920, height: 1080 });
    report.checks.push(`${character}: 핵심 대화 질문·보류·저장복원·실제 전문행동·결과연출 + 생활 대화 844px`);
  }
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close(); server.kill();
}
