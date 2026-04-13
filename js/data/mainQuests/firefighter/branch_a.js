// === MAIN QUESTS: 박영철 (firefighter) — A경로: 가족 구출 ===
// 분기 조건: fire_branch_a 플래그
// Q11~Q15: 은평 가족 구출 및 대피소
// Q15 분기점: 가족 이후 선택 → 3가지 엔딩

const FIREFIGHTER_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_fire_a_11: {
    id: 'mq_fire_a_11', title: '은평 도착',
    desc: '은평구에 도달하라. 가족이 기다리고 있다.',
    icon: '🏠', characterId: 'firefighter', dayTrigger: 65,
    prerequisite: 'mq_fire_10', requiresFlag: 'fire_branch_a',
    objective: { type: 'visit_district', districtId: 'eunpyeong', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'bandage', qty: 3 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '은평구. 거의 다 왔다. 아파트 3층, 빨간 현관문.',
      complete: '"영철이야?" 아내의 목소리였다. 살아있었다. 두 아이도. 무릎이 꺾였다. 이동 중 들른 은평 소방서 비상 창고에서 붕대도 챙겼다.',
    },
  },

  mq_fire_a_12: {
    id: 'mq_fire_a_12', title: '가족 식량',
    desc: '식량 5개를 비축하라. 가족이 배고프다.',
    icon: '🍚', characterId: 'firefighter', dayTrigger: 95,
    prerequisite: 'mq_fire_a_11', requiresFlag: 'fire_branch_a',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 10, items: [{ definitionId: 'canned_food', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '아내가 말했다. "아이들이 3일 동안 제대로 못 먹었어." 소방관보다 아버지로 돌아가야 할 때다.',
      complete: '식량을 가져왔다. 수색 중 통조림도 여분으로 챙겼다. 아이들이 밥을 먹는다. 이것만으로 충분하다.',
    },
  },

  mq_fire_a_13: {
    id: 'mq_fire_a_13', title: '임시 은신처',
    desc: '구조물 2개를 제작하라. 가족을 위한 안전한 거점을 만든다.',
    icon: '🏡', characterId: 'firefighter', dayTrigger: 125,
    prerequisite: 'mq_fire_a_12', requiresFlag: 'fire_branch_a',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'rope', qty: 2 }, { definitionId: 'flashlight', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '아파트 3층만으로는 부족하다. 층계 아래, 현관 입구, 창문. 모두 막아야 한다.',
      complete: '방벽이 세워졌다. 작업 중 로프와 손전등도 발견했다. 아이가 말했다. "아빠가 만들면 튼튼해." 그 말이 힘이 됐다.',
    },
  },

  mq_fire_a_14: {
    id: 'mq_fire_a_14', title: '가족 치료',
    desc: '붕대 5개를 확보하라. 아내가 다쳤다.',
    icon: '🩹', characterId: 'firefighter', dayTrigger: 155,
    prerequisite: 'mq_fire_a_13', requiresFlag: 'fire_branch_a',
    objective: { type: 'collect_item', definitionId: 'bandage', count: 5 },
    reward: { morale: 8, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '아내의 팔에 깊은 상처가 있었다. "넘어졌어." 애써 괜찮은 척하는 것이 더 마음 아팠다.',
      complete: '상처를 치료했다. 수색 중 구급키트도 발견했다. 아내가 말했다. "영철이 덕분에 살았어." 눈이 시리다.',
    },
  },

  mq_fire_a_15: {
    id: 'mq_fire_a_15', title: '은평의 선택',
    desc: '180일 이상 생존하라. 가족과 함께 다음을 결정한다.',
    icon: '⚖️', characterId: 'firefighter', dayTrigger: 185,
    prerequisite: 'mq_fire_a_14', requiresFlag: 'fire_branch_a',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'lighter', qty: 1 }, { definitionId: 'binoculars', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '은평 대피소 완성',
        desc: '이웃들과 함께 은평에 완전한 대피소를 만든다.',
        setsFlag: 'fire_end_a1',
      },
      {
        label: '가족과 함께 다른 곳으로',
        desc: '은평을 떠나 더 안전한 곳으로 이동한다.',
        setsFlag: 'fire_end_a2',
      },
      {
        label: '이재훈을 위한 추모',
        desc: '이재훈의 이름으로 대피소를 완성하고 추모한다.',
        setsFlag: 'fire_end_a3',
      },
    ],
    narrative: {
      start: '180일. 가족과 함께했다. 이제 이 자리에서 무엇을 할지 결정해야 한다.',
      complete: '은평 소방서 창고에서 라이터와 쌍안경을 발견했다. 아내가 말했다. "영철아, 어떻게 할 거야?" 세 가지 답이 머릿속을 맴돈다.',
    },
  },

  // ── A1 엔딩: 은평 대피소 완성 ────────────────────────────────

  mq_fire_end_a1: {
    id: 'mq_fire_end_a1', title: '은평 대피소 완성',
    desc: '구조물 3개를 제작하라. 은평 대피소의 완전한 기반을 갖춘다.',
    icon: '🛡️', characterId: 'firefighter', dayTrigger: 205,
    prerequisite: 'mq_fire_a_15', requiresFlag: 'fire_end_a1',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 20, items: [{ definitionId: 'first_aid_kit', qty: 2 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'a1_shelter' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '이웃들이 모여든다. 소방관의 손으로 만든 대피소라면 믿을 수 있다.',
      complete: 'D+100. 은평 대피소 완성. 생존자 25명. 대피소 의무실용 구급키트 2개도 확보했다. 가족이 옆에 있다. 이재훈. 우리는 살아있어.',
    },
  },

  // ── A2 엔딩: 가족과 이사 ──────────────────────────────────────

  mq_fire_end_a2: {
    id: 'mq_fire_end_a2', title: '가족과 함께',
    desc: '서대문구를 방문하라. 더 안전한 곳으로 이동 루트를 확인한다.',
    icon: '🚶', characterId: 'firefighter', dayTrigger: 205,
    prerequisite: 'mq_fire_a_15', requiresFlag: 'fire_end_a2',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'canned_food', qty: 5 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'a2_family' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '아내가 말했다. "아이들을 위해서라면 어디든 갈 수 있어." 서대문을 경유해 더 안전한 서울 외곽으로.',
      complete: 'D+100. 서대문을 지나 경기도 방향으로. 길에서 통조림 5개를 발견했다. 아이들 몫. 가족이 옆에 있다. 이재훈이 말했을 것이다. "잘 됐다, 형."',
    },
  },

  // ── A3 엔딩: 이재훈 추모 ─────────────────────────────────────

  mq_fire_end_a3: {
    id: 'mq_fire_end_a3', title: '이재훈 추모',
    desc: '로프 5개를 비축하라. 이재훈의 이름으로 대피소 연결망을 완성한다.',
    icon: '🕯️', characterId: 'firefighter', dayTrigger: 205,
    prerequisite: 'mq_fire_a_15', requiresFlag: 'fire_end_a3',
    objective: { type: 'collect_item', definitionId: 'rope', count: 5 },
    reward: { morale: 15, items: [{ definitionId: 'lighter', qty: 1 }, { definitionId: 'herbal_tea', qty: 3 }], flags: { mainQuestComplete_firefighter: true, fire_ending: 'a3_memorial' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '이재훈이 남긴 로프로 아파트 동들을 연결한다. 그의 이름으로 이 대피소를 완성한다.',
      complete: 'D+100. 대피소 입구에 작은 돌을 세웠다. "이재훈 (1985–2026). 끝까지 동료였다." 이재훈이 쓰던 라이터와 허브차가 창고에 있었다. 가족이 함께 묵례했다.',
    },
  },

};

export default FIREFIGHTER_BRANCH_A;
