// === MAIN QUESTS: 강민준 (soldier) — A경로: 박영철과 구조 작전 ===
// 분기 조건: soldier_branch_a 플래그
// Q11~Q15: 서대문 구조 작전
// Q15: 서울 전역 구조망 엔딩으로 직결 (Settle)

const SOLDIER_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_soldier_a_11: {
    id: 'mq_soldier_a_11', title: '박영철과 합류',
    desc: '서대문구로 이동하라. 박영철 소방관이 구조 작전을 준비 중이다.',
    icon: '🚒', characterId: 'soldier', dayTrigger: 65,
    prerequisite: 'mq_soldier_10', requiresFlag: 'soldier_branch_a',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: 'KBS 좌표를 수첩에서 지웠다. 송출은 신호를 보내는 일이다. 신호는 누군가 받아야 의미가 있고, 받을 사람이 먼저 죽으면 송출할 이유도 없다. 방송을 미룬다. 서대문으로 간다. 박상현이라면 같은 선택을 했을 거다.',
      complete: '서대문 소방서. 박영철 소방위가 구조 장비를 챙기고 있었다. "와줬군요. 군인이 옆에 있으니 든든합니다." 손전등을 받아 들었다. 마이크 대신 들것을 든다. 방송은 살아남은 사람들의 몫으로 남긴다.',
    },
  },

  mq_soldier_a_12: {
    id: 'mq_soldier_a_12', title: '구조 의료 물자',
    desc: '붕대 6개를 수집하라. 구조 작전 중 부상자 치료가 필요하다.',
    icon: '🩹', characterId: 'soldier', dayTrigger: 95,
    prerequisite: 'mq_soldier_a_11', requiresFlag: 'soldier_branch_a',
    objective: { type: 'collect_item', definitionId: 'bandage', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '박영철: "구조된 사람 중에 부상자가 많아요. 붕대가 부족합니다." 전술 지원만큼 의료 물자도 중요하다.',
      complete: '붕대를 확보했다. 수색 중 구급키트도 발견했다. 박영철과 함께 부상자를 처치했다. "역시 군인 손이 다릅니다."',
    },
  },

  mq_soldier_a_13: {
    id: 'mq_soldier_a_13', title: '임시 대피소',
    desc: '구조물 2개를 제작하라. 구조 생존자를 위한 임시 대피소가 필요하다.',
    icon: '🏕️', characterId: 'soldier', dayTrigger: 125,
    prerequisite: 'mq_soldier_a_12', requiresFlag: 'soldier_branch_a',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'spike_trap', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '구조된 생존자들이 임시로 머물 곳이 없다. 방어선 구축은 군인의 전문 분야다.',
      complete: '임시 대피소 완성. 입구에 가시 트랩도 설치했다. 박영철: "구조대원과 군인의 조합이 이렇게 효율적일 줄 몰랐어요."',
    },
  },

  mq_soldier_a_14: {
    id: 'mq_soldier_a_14', title: '구조 생존자 보급',
    desc: '식량 8개를 수집하라. 구조된 생존자 50명에게 보급한다.',
    icon: '🥫', characterId: 'soldier', dayTrigger: 155,
    prerequisite: 'mq_soldier_a_13', requiresFlag: 'soldier_branch_a',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10, items: [{ definitionId: 'battle_ration', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '구조 생존자가 50명을 넘었다. 박영철: "밥이 없으면 살려도 죽어요." 보급이 전술이다.',
      complete: '식량 배급 완료. 군용 전투 식량도 따로 챙겼다. 박영철: "강민준 하사, 덕분에 50명이 살았어요." 그 말이 어떤 명령보다 무겁게 들렸다.',
    },
  },

  mq_soldier_a_15: {
    id: 'mq_soldier_a_15', title: '작전 확대 결정',
    desc: '100일 이상 생존하라. 구조 작전을 서울 전역으로 확대할 때다.',
    icon: '⚖️', characterId: 'soldier', dayTrigger: 175,
    prerequisite: 'mq_soldier_a_14', requiresFlag: 'soldier_branch_a',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 8, items: [{ definitionId: 'stimulant', qty: 1 }], flags: { soldier_end_a1: true } },
    failPenalty: null, deadlineDays: Infinity,
    narrative: {
      start: '100일을 넘겼다. 박영철과 함께한 구조 작전이 성과를 냈다. 서대문 한 구를 지키는 데 100일이 들었다.',
      complete: '박영철: "강 하사, 이제 서울 전역이다. 우리가 해낼 수 있어요." 한 구를 넓히면 손이 닿는 범위가 늘고, 닿지 않는 곳은 더 멀어진다. 각성제를 마셨다. 길은 하나였다.',
    },
  },

  // ── A1 엔딩: 서울 전역 대규모 구조 ──────────────────────────

  mq_soldier_end_a1: {
    id: 'mq_soldier_end_a1', title: '서울 집결 완성',
    desc: '구조물 4개를 제작하라. 서울 전역 구조 작전의 기반을 완성한다.',
    icon: '🏙️', characterId: 'soldier', dayTrigger: 205,
    prerequisite: 'mq_soldier_a_15', requiresFlag: 'soldier_end_a1',
    objective: { type: 'craft_item', category: 'structure', count: 4 },
    reward: { morale: 20, items: [{ definitionId: 'radio', qty: 1 }], flags: { mainQuestComplete_soldier: true, soldier_ending: 'a1_rescue' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '박영철과 전술을 짰다. 서울 구 단위 구조망. 소방관의 현장 경험 + 군인의 전술 체계.',
      complete: 'D+100. 서울 전역 구조망 완성. 서울 전역 통신을 위한 무전기가 지급됐다. 박영철: "우리가 해냈어요." 강민준: "같이 해냈습니다." 박상현, 들었냐.',
    },
  },

};

export default SOLDIER_BRANCH_A;
