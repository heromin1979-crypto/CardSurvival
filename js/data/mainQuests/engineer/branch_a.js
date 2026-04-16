// === MAIN QUESTS: 정대한 (engineer) — A경로: 아버지 설계도로 탈출 ===
// 분기 조건: eng_branch_a 플래그
// Q11~Q15: 구로 공장에서 탈출 차량 완성
// Q15 분기점: 탈출 방향 선택 → 3가지 엔딩

const ENGINEER_BRANCH_A = {

  // ── A경로 공통 (Q11-Q15) ─────────────────────────────────────

  mq_eng_a_11: {
    id: 'mq_eng_a_11', title: '구로 공장 도착',
    desc: '구로구에 도달하라. 탈출 차량을 만들 공장이 있다.',
    icon: '🏭', characterId: 'engineer', dayTrigger: 65,
    prerequisite: 'mq_eng_10', requiresFlag: 'eng_branch_a',
    objective: { type: 'visit_district', districtId: 'guro', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'scrap_metal', qty: 3 }, { definitionId: 'wire', qty: 2 }] },
    failPenalty: { morale: -10 }, deadlineDays: 120,
    narrative: {
      start: '구로 디지털단지. 금속 가공 시설이 있다. 아버지의 설계도를 현실로 만들 수 있는 곳.',
      complete: '구로 공장 도착. 전동 공구가 있다. 창고에서 고철과 전선도 발견했다. 아버지의 설계도를 펼쳤다. "여기서 만든다."',
    },
  },

  mq_eng_a_12: {
    id: 'mq_eng_a_12', title: '차량 프레임',
    desc: '고철 6개를 수집하라. 탈출 차량의 골격 재료다.',
    icon: '🚗', characterId: 'engineer', dayTrigger: 95,
    prerequisite: 'mq_eng_a_11', requiresFlag: 'eng_branch_a',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 6 },
    reward: { morale: 10, items: [{ definitionId: 'rubber', qty: 2 }, { definitionId: 'leather', qty: 1 }] },
    failPenalty: { morale: -5 }, deadlineDays: 150,
    narrative: {
      start: '차량 프레임 설계 완료. 고철 6개면 충분하다. 구로 일대 폐자동차에서 구할 수 있다.',
      complete: '고철 확보. 폐차에서 고무 패킹과 가죽 시트도 뜯어냈다. 방수와 충격 흡수에 쓸 수 있다. 차량 골격 제작 시작. 아버지 설계대로다.',
    },
  },

  mq_eng_a_13: {
    id: 'mq_eng_a_13', title: '전기 시스템',
    desc: '전자부품 4개를 수집하라. 탈출 차량의 전기 동력 시스템이다.',
    icon: '⚡', characterId: 'engineer', dayTrigger: 125,
    prerequisite: 'mq_eng_a_12', requiresFlag: 'eng_branch_a',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 4 },
    reward: { morale: 12, items: [{ definitionId: 'electronic_parts', qty: 2 }] },
    failPenalty: { morale: -5 }, deadlineDays: 185,
    narrative: {
      start: '아버지의 설계는 전기 동력이다. 연료 없이 움직인다. 전자부품으로 모터를 만든다.',
      complete: '전기 모터 조립 완료. 수집 중 여분 부품도 챙겼다. 예비 전자부품은 언제나 필요하다. 아버지, 20년 전 아이디어가 지금 실현되고 있어요.',
    },
  },

  mq_eng_a_14: {
    id: 'mq_eng_a_14', title: '최종 조립',
    desc: '로프 4개를 수집하라. 조향 장치 완성에 필요하다.',
    icon: '🔧', characterId: 'engineer', dayTrigger: 155,
    prerequisite: 'mq_eng_a_13', requiresFlag: 'eng_branch_a',
    objective: { type: 'collect_item', definitionId: 'rope', count: 4 },
    reward: { morale: 10, items: [{ definitionId: 'duct_tape', qty: 3 }] },
    failPenalty: { morale: -5 }, deadlineDays: 225,
    narrative: {
      start: '조향 장치는 로프 기반이다. 아버지의 설계에서 가장 독창적인 부분. 고장 날 부품이 적다.',
      complete: '조향 장치 완성. 조립 마무리에 덕트 테이프를 아낌없이 썼다. 여분도 충분히 챙겼다. 핸들을 돌리면 로프가 당겨진다. 차량이 형태를 갖췄다.',
    },
  },

  mq_eng_a_15: {
    id: 'mq_eng_a_15', title: '탈출 방향 결정',
    desc: '180일 이상 생존하라. 탈출 차량이 완성에 가까워졌다.',
    icon: '⚖️', characterId: 'engineer', dayTrigger: 185,
    prerequisite: 'mq_eng_a_14', requiresFlag: 'eng_branch_a',
    objective: { type: 'survive_days', count: 180 },
    reward: { morale: 8, items: [{ definitionId: 'binoculars', qty: 1 }] },
    failPenalty: null, deadlineDays: Infinity,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '서울 완전 탈출',
        desc: '차량을 완성해 서울을 빠져나간다. 아버지의 설계도로 만든 차가 달린다.',
        setsFlag: 'eng_end_a1',
      },
      {
        label: '차량 테스트 후 귀환',
        desc: '탈출보다 차량 성능을 검증하고 돌아온다.',
        setsFlag: 'eng_end_a2',
      },
      {
        label: '탈출 포기, 거점 구축',
        desc: '탈출 대신 차량 기술로 이 도시에 기여한다.',
        setsFlag: 'eng_end_a3',
      },
    ],
    narrative: {
      start: '180일. 차량이 거의 완성됐다. 이제 어떻게 할지 결정해야 한다.',
      complete: '공장 비상 키트에서 쌍안경을 발견했다. 차량을 바라봤다. 아버지의 설계도로 만든 것. 이제 어디로 갈 것인가.',
    },
  },

  // ── A1 엔딩: 서울 완전 탈출 ─────────────────────────────────

  mq_eng_a1_prep: {
    id: 'mq_eng_a1_prep', title: '탈출 보강 작업',
    desc: '차량 최종 보강. 구조물 2개를 제작하고 식량 8개를 비축하라.',
    icon: '🔧', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_a_15', requiresFlag: 'eng_end_a1',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '차량 외장 보강. 서울 외곽까지 버텨야 한다. 방벽용 구조물을 차체에 부착한다.',
      complete: '차체 보강 완료. 이제 식량을 싣고 출발한다.',
    },
  },

  mq_eng_end_a1: {
    id: 'mq_eng_end_a1', title: '서울 탈출',
    desc: '탈출 식량 8개를 비축하고 출발하라.',
    icon: '🚗', characterId: 'engineer', dayTrigger: 230,
    prerequisite: 'mq_eng_a1_prep', requiresFlag: 'eng_end_a1',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 20, items: [{ definitionId: 'battle_ration', qty: 3 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'a1_escape' } },
    failPenalty: { morale: -10 }, deadlineDays: Infinity,
    narrative: {
      start: '차량 준비 완료. 탈출 식량만 남았다. 서울 밖에서 며칠을 버텨야 할지 모른다.',
      complete: '시동이 걸린다. 구로 국도. 수원 방향. 차 안에 전투 식량을 실었다. "아버지의 설계도로 만든 차가 서울을 빠져나간다." 그렇게 적었다.',
    },
  },

  // ── A2 엔딩: 차량 테스트 후 귀환 ─────────────────────────────

  mq_eng_a2_prep: {
    id: 'mq_eng_a2_prep', title: '시험 주행 준비',
    desc: '로프 3개와 전자부품 2개를 확보하라. 차량 계기판 정비에 필요하다.',
    icon: '📊', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_a_15', requiresFlag: 'eng_end_a2',
    objective: { type: 'collect_item', definitionId: 'rope', count: 3 },
    reward: { morale: 8 },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '시험 주행 전 계기판과 조향 시스템 최종 점검. 로프가 더 필요하다.',
      complete: '정비 완료. 이제 성수 공장으로 돌아가 시험 주행을 한다.',
    },
  },

  mq_eng_end_a2: {
    id: 'mq_eng_end_a2', title: '성수 시험 주행',
    desc: '성동구를 방문하라. 성수 공장에서 차량 성능을 최종 검증한다.',
    icon: '🔬', characterId: 'engineer', dayTrigger: 230,
    prerequisite: 'mq_eng_a2_prep', requiresFlag: 'eng_end_a2',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'pipe_wrench', qty: 1 }, { definitionId: 'whetstone', qty: 1 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'a2_test' } },
    failPenalty: { morale: -8 }, deadlineDays: Infinity,
    narrative: {
      start: '아버지가 일하던 성수 공장. 시험 주행의 출발점이자 도착점.',
      complete: '성수 공장 앞 도로. 시동. 출발. 500미터. 1킬로미터. 돌아왔다. 아버지 서랍에서 파이프렌치와 숫돌을 꺼냈다. "탈출 준비는 됐다. 언제든."',
    },
  },

  // ── A3 엔딩: 탈출 포기, 거점 구축 ────────────────────────────

  mq_eng_a3_prep: {
    id: 'mq_eng_a3_prep', title: '거점 인프라 구축',
    desc: '구로 공장을 거점으로 만들어라. 구조물 3개를 제작하라.',
    icon: '🏗️', characterId: 'engineer', dayTrigger: 205,
    prerequisite: 'mq_eng_a_15', requiresFlag: 'eng_end_a3',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '탈출하지 않기로 했다. 대신 이 공장을 서울의 기계 거점으로 만든다.',
      complete: '작업장, 정비소, 방벽. 구로 거점의 뼈대가 완성됐다.',
    },
  },

  mq_eng_end_a3: {
    id: 'mq_eng_end_a3', title: '구로 거점 완성',
    desc: '식량 10개를 비축하라. 거점 운영에 필요한 물자를 확보한다.',
    icon: '🏠', characterId: 'engineer', dayTrigger: 230,
    prerequisite: 'mq_eng_a3_prep', requiresFlag: 'eng_end_a3',
    objective: { type: 'collect_item_type', itemType: 'food', count: 10 },
    reward: { morale: 15, items: [{ definitionId: 'rope_ladder', qty: 1 }, { definitionId: 'flashlight', qty: 1 }], flags: { mainQuestComplete_engineer: true, engineer_ending: 'a3_base' } },
    failPenalty: { morale: -5 }, deadlineDays: Infinity,
    narrative: {
      start: '거점 운영에 식량이 필수다. 정비 인력을 먹여야 한다.',
      complete: '구로 공장 거점. 차량 수리와 물자 운반의 중심. 로프 사다리와 손전등이 정비됐다. 아버지의 설계도가 서울 재건에 쓰이고 있다.',
    },
  },
};

export default ENGINEER_BRANCH_A;
