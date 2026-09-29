import fs from 'node:fs';
import QUESTS from '../js/data/mainQuests/index.js';
import NPCS from '../js/data/npcs.js';
import { DILEMMAS } from '../js/data/npcDilemmas.js';
import { NPC_MEMORY_TRIGGERS } from '../js/data/npcMemories.js';
import CINEMATICS from '../js/data/cinematicScenes.js';
import EVENTS from '../js/data/secretEvents.js';
import { CHAR_DIALOGUES } from '../js/data/charDialogues.js';
import PATIENTS from '../js/data/patientPool.js';

const quests = Object.values(QUESTS);
const npcs = Object.values(NPCS);
const sum = (rows, key) => rows.reduce((n, row) => n + (row[key]?.length ?? 0), 0);
const careers = Object.keys(CHAR_DIALOGUES).map(career => {
  const rows = quests.filter(q => q.characterId === career);
  const events = EVENTS.filter(e => e.triggerConditions?.requiredCharacter === career);
  return { career, quests: rows.length,
    start: rows.filter(q => q.narrative?.start).length,
    complete: rows.filter(q => q.narrative?.complete).length,
    branchScenes: rows.filter(q => q.branchOptions?.length).length,
    branchChoices: sum(rows, 'branchOptions'),
    secretEvents: events.length, secretWithMultipleChoices: events.filter(e => e.choices.length > 1).length,
    reactionLines: Object.keys(CHAR_DIALOGUES[career]).length };
});
const result = {
  scope: '현재 작업 트리의 정의 수. 실제 한 회차 노출 횟수·도달 가능성·완성 대화 품질을 뜻하지 않음.',
  careers,
  quests: quests.length,
  sharedQuests: quests.filter(q => q.characterId == null).length,
  startCompleteSlots: quests.filter(q => q.narrative?.start).length + quests.filter(q => q.narrative?.complete).length,
  branchScenes: quests.filter(q => q.branchOptions?.length).length,
  branchChoices: sum(quests, 'branchOptions'),
  explicitQuestSpeakers: quests.filter(q => q.scene?.speakerId).length,
  npcObjectiveSpeakers: quests.filter(q => q.objective?.npcId).length,
  npcDefinitions: npcs.length,
  npcsWithDialogueFields: npcs.filter(n => n.dialogues).length,
  dialogueEntries: npcs.reduce((n, row) => n + Object.values(row.dialogues ?? {}).reduce((s, lines) => s + (Array.isArray(lines) ? lines.length : 1), 0), 0),
  npcQuests: sum(npcs, 'quests'),
  patientContributionScenes: Object.values(PATIENTS).filter(p => p.altContributions?.length).length,
  patientContributionChoices: Object.values(PATIENTS).filter(p => p.altContributions?.length).reduce((n, p) => n + 1 + p.altContributions.length, 0),
  dilemmaScenes: DILEMMAS.length, dilemmaChoices: sum(DILEMMAS, 'choices'),
  memoryNpcs: Object.keys(NPC_MEMORY_TRIGGERS).length,
  memoryEntries: Object.values(NPC_MEMORY_TRIGGERS).flat().length,
  cinematics: Object.keys(CINEMATICS).length,
  secretEvents: EVENTS.length,
  secretChoices: sum(EVENTS, 'choices'),
  secretWithMultipleChoices: EVENTS.filter(e => e.choices.length > 1).length,
};
const target = 'docs/analysis/progression-execution/dialogue-content-audit.json';
fs.writeFileSync(target, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
