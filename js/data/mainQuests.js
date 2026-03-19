// === MAIN QUEST DEFINITIONS (38 quests) ===
// 6 캐릭터별 메인 퀘스트 체인. Day 1~100 스토리라인.
// objective types: collect_item, craft_item, survive_days, visit_district
// deadlineDays: Infinity(∞) = 기한 없음

const MAIN_QUESTS = {

  // ══════════════════════════════════════════════════════════════════
  // 이지수 (doctor) — 8 퀘스트
  // 루트: gangnam → seodaemun → yeongdeungpo
  // ══════════════════════════════════════════════════════════════════

  mq_doctor_01: {
    id: 'mq_doctor_01',
    title: '삼성병원 생존자',
    desc: '삼성병원에서 식량을 확보하라. 살아남으려면 먹어야 한다.',
    icon: '🏥',
    characterId: 'doctor',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '강남 삼성서울병원 응급실. 약품 창고에서 3일을 버텼다. 밖에 나왔을 때, 병원은 지옥이 되어 있었다. 먼저 식량을 확보해야 한다.',
      complete: '식량을 확보했다. 당분간은 버틸 수 있다. 하지만 여기에 계속 있을 수는 없다.',
    },
  },

  mq_doctor_02: {
    id: 'mq_doctor_02',
    title: '첫 번째 거점',
    desc: '안전한 거점을 만들어라. 구조물을 제작하라.',
    icon: '🏗️',
    characterId: 'doctor',
    dayTrigger: 3,
    prerequisite: 'mq_doctor_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '매일 밤 잠을 설친다. 안전한 거점이 필요하다. 구조물을 세워야 한다.',
      complete: '첫 번째 바리케이드가 세워졌다. 작지만, 이 공간만큼은 안전하다.',
    },
  },

  mq_doctor_03: {
    id: 'mq_doctor_03',
    title: '무전의 신호',
    desc: '무전기에서 신호가 잡혔다. 깨끗한 물 5개를 비축하라.',
    icon: '📻',
    characterId: 'doctor',
    dayTrigger: 7,
    prerequisite: 'mq_doctor_02',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 25,
    narrative: {
      start: '무전기에서 잡음 사이로 목소리가 들린다. "세브란스... 데이터... 아직..." 가야 한다. 하지만 먼저 물을 비축해야 한다.',
      complete: '물을 비축했다. 이제 여정을 준비할 수 있다. 세브란스까지 먼 길이다.',
    },
  },

  mq_doctor_04: {
    id: 'mq_doctor_04',
    title: '여정의 준비',
    desc: '세브란스까지 가려면 의료 물자가 필요하다. 의료 아이템 5개를 수집하라.',
    icon: '💊',
    characterId: 'doctor',
    dayTrigger: 12,
    prerequisite: 'mq_doctor_03',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 35,
    narrative: {
      start: '세브란스까지 가는 길은 위험하다. 의료 물자를 충분히 확보해야 한다.',
      complete: '의료 배낭이 가득 찼다. 이제 출발할 수 있다.',
    },
  },

  mq_doctor_05: {
    id: 'mq_doctor_05',
    title: '세브란스 연구소',
    desc: '서대문구에 도달하라. 세브란스 연구소의 데이터가 필요하다.',
    icon: '🔬',
    characterId: 'doctor',
    dayTrigger: 20,
    prerequisite: 'mq_doctor_04',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 15 },
    failPenalty: { morale: -10 },
    deadlineDays: 60,
    narrative: {
      start: '세브란스 연구소. 바이러스 연구팀은 연락 두절 D+3. 하지만 데이터는 남아있을 것이다.',
      complete: '연구소에 도착했다. 팀은 없었다. 하지만 데이터가 있었다. 감염 패턴, 샘플, 메모. 이것이면 된다.',
    },
  },

  mq_doctor_06: {
    id: 'mq_doctor_06',
    title: '감염 패턴 분석',
    desc: '연구 데이터를 분석하려면 구급상자 3개가 필요하다.',
    icon: '📊',
    characterId: 'doctor',
    dayTrigger: 35,
    prerequisite: 'mq_doctor_05',
    objective: { type: 'collect_item', definitionId: 'first_aid_kit', count: 2 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 120,
    narrative: {
      start: '세브란스 데이터와 현장 관찰을 결합한다. 분석에 필요한 시약이 부족하다. 구급상자에서 추출해야 한다.',
      complete: '패턴이 보이기 시작했다. 감염 초기 48시간이 핵심이다. 이 발견을 알려야 한다.',
    },
  },

  mq_doctor_07: {
    id: 'mq_doctor_07',
    title: '구원의 주파수',
    desc: '영등포구에 도달하라. KBS 방송국에서 치료 프로토콜을 송출한다.',
    icon: '📡',
    characterId: 'doctor',
    dayTrigger: 55,
    prerequisite: 'mq_doctor_06',
    objective: { type: 'visit_district', districtId: 'yeongdeungpo', count: 1 },
    reward: { morale: 20 },
    failPenalty: { morale: -10 },
    deadlineDays: 90,
    narrative: {
      start: '무전의 메시지. "아직 방송 중입니다." KBS에 가야 한다. 이 데이터를 전파해야 한다.',
      complete: '마이크 앞에 앉았다. "여기는 이지수 전문의입니다. 감염 초기 치료 프로토콜을 전송합니다." 누군가 듣고 있기를.',
    },
  },

  mq_doctor_08: {
    id: 'mq_doctor_08',
    title: '100일의 기록',
    desc: '100일을 생존하라. 치료의 증거를 완성한다.',
    icon: '📖',
    characterId: 'doctor',
    dayTrigger: 70,
    prerequisite: 'mq_doctor_07',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 25, flags: { mainQuestComplete_doctor: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '방송이 나갔다. 이제 할 수 있는 것은 기다리는 것. 그리고 계속 살아남는 것.',
      complete: '100일. 무전에서 첫 번째 응답이 들렸다. "프로토콜을 받았습니다. 효과가 있습니다." 메모지에 적었다. "D+100. 치료법 확인."',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 강민준 (soldier) — 6 퀘스트
  // 루트: yongsan → jongno(dl4!) → yeongdeungpo
  // ══════════════════════════════════════════════════════════════════

  mq_soldier_01: {
    id: 'mq_soldier_01',
    title: '용산 기지 생존',
    desc: '용산 미군기지의 무기고에서 버티고 있다. 나이프를 확보하라.',
    icon: '🔪',
    characterId: 'soldier',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'knife', count: 1 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '용산 미군기지의 무기고에서 버티고 있다. 무기를 확보하고 나가야 한다.',
      complete: '나이프를 확보했다. 이제 밖으로 나갈 준비가 됐다.',
    },
  },

  mq_soldier_02: {
    id: 'mq_soldier_02',
    title: '전술 거점',
    desc: '기지 밖은 위험하다. 방어 구조물을 세워라.',
    icon: '🏗️',
    characterId: 'soldier',
    dayTrigger: 3,
    prerequisite: 'mq_soldier_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '기지 밖은 이미 감염자들로 가득하다. 먼저 방어선을 구축한다.',
      complete: '바리케이드 완성. 이 정도면 하룻밤은 버틸 수 있다.',
    },
  },

  mq_soldier_03: {
    id: 'mq_soldier_03',
    title: '광화문 돌파',
    desc: '정부청사에 마지막 지령이 있을 수 있다. 종로구로 돌파하라. 방사선 주의.',
    icon: '🏛️',
    characterId: 'soldier',
    dayTrigger: 12,
    prerequisite: 'mq_soldier_02',
    objective: { type: 'visit_district', districtId: 'jongno', count: 1 },
    reward: { morale: 15 },
    failPenalty: { morale: -10 },
    deadlineDays: 40,
    narrative: {
      start: '정부청사에 마지막 지령이 있을 수 있다. 광화문으로 돌파한다. 방사선 주의.',
      complete: '정부청사는 텅 비어 있었다. 하지만 벽에 적힌 좌표 하나. "KBS 여의도. 방송 가능."',
    },
  },

  mq_soldier_04: {
    id: 'mq_soldier_04',
    title: '통신 장비 확보',
    desc: '여의도까지 가려면 통신 장비가 필요하다. 손전등 2개를 확보하라.',
    icon: '🔦',
    characterId: 'soldier',
    dayTrigger: 25,
    prerequisite: 'mq_soldier_03',
    objective: { type: 'collect_item', definitionId: 'flashlight', count: 2 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 55,
    narrative: {
      start: '여의도까지의 루트를 계획한다. 야간 이동이 불가피하다. 손전등이 필수다.',
      complete: '장비 확보 완료. 이제 여의도로 향한다.',
    },
  },

  mq_soldier_05: {
    id: 'mq_soldier_05',
    title: 'KBS 방송국',
    desc: '영등포구에 도달하라. KBS 방송 장비를 가동한다.',
    icon: '📡',
    characterId: 'soldier',
    dayTrigger: 40,
    prerequisite: 'mq_soldier_04',
    objective: { type: 'visit_district', districtId: 'yeongdeungpo', count: 1 },
    reward: { morale: 20 },
    failPenalty: { morale: -10 },
    deadlineDays: 80,
    narrative: {
      start: '무전의 메시지. "아직 방송 중입니다." 거기에 가야 한다.',
      complete: '마이크 앞에 앉았다. "여기는 서울 KBS. 생존자분들, 서울 집결 좌표를 전송합니다."',
    },
  },

  mq_soldier_06: {
    id: 'mq_soldier_06',
    title: '서울 집결 좌표',
    desc: '100일을 생존하라. 방송이 닿는 곳을 기다린다.',
    icon: '📖',
    characterId: 'soldier',
    dayTrigger: 65,
    prerequisite: 'mq_soldier_05',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 25, flags: { mainQuestComplete_soldier: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '방송이 나갔다. 좌표와 함께. 이제 기다린다. 누군가 응답할 때까지.',
      complete: '100일. 무전에서 신호가 들린다. 경기도 수원에서 첫 번째 응답. "KBS 수신했습니다. 이동 중입니다."',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 박영철 (firefighter) — 6 퀘스트
  // 루트: yongsan → seodaemun → eunpyeong
  // ══════════════════════════════════════════════════════════════════

  mq_fire_01: {
    id: 'mq_fire_01',
    title: '화재 현장 탈출',
    desc: '건물 안에 불길은 없었다. 쓰러진 사람들만. 식량 3개를 수집하라.',
    icon: '🔥',
    characterId: 'firefighter',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '건물 안에 불길은 없었다. 쓰러진 사람들만. 동료 이재훈이 물렸다. 살아남아야 한다.',
      complete: '식량을 확보했다. 이재훈은... 이미 늦었다. 혼자 버텨야 한다.',
    },
  },

  mq_fire_02: {
    id: 'mq_fire_02',
    title: '임시 구호소',
    desc: '안전한 거점을 만들어라. 구조물을 제작하라.',
    icon: '🏗️',
    characterId: 'firefighter',
    dayTrigger: 3,
    prerequisite: 'mq_fire_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'rope', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '임시 구호소를 세운다. 여기서 버티면서 은평까지의 루트를 계획한다.',
      complete: '구호소가 완성됐다. 이제 가족을 찾으러 갈 준비를 해야 한다.',
    },
  },

  mq_fire_03: {
    id: 'mq_fire_03',
    title: '은평을 향해',
    desc: '서대문구에 도달하라. 은평구로 가는 길목이다.',
    icon: '🗺️',
    characterId: 'firefighter',
    dayTrigger: 15,
    prerequisite: 'mq_fire_02',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 45,
    narrative: {
      start: '은평구 불광동. 아내와 두 아이. 서대문을 거쳐야 한다.',
      complete: '서대문에 도착했다. 은평구가 가까워진다. 조금만 더.',
    },
  },

  mq_fire_04: {
    id: 'mq_fire_04',
    title: '은평구 도착',
    desc: '은평구에 도달하라. 가족이 기다리고 있다.',
    icon: '🏠',
    characterId: 'firefighter',
    dayTrigger: 30,
    prerequisite: 'mq_fire_03',
    objective: { type: 'visit_district', districtId: 'eunpyeong', count: 1 },
    reward: { morale: 15 },
    failPenalty: { morale: -10 },
    deadlineDays: 65,
    narrative: {
      start: '은평구. 거의 다 왔다. 아파트 3층, 빨간 현관문.',
      complete: '"영철이야?" 아내의 목소리였다. 살아있었다.',
    },
  },

  mq_fire_05: {
    id: 'mq_fire_05',
    title: '가족의 보금자리',
    desc: '가족을 위한 안전한 거점. 구조물 2개를 제작하라.',
    icon: '🛡️',
    characterId: 'firefighter',
    dayTrigger: 45,
    prerequisite: 'mq_fire_04',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 80,
    narrative: {
      start: '가족을 위한 안전한 거점. 방벽과 불이 필요하다.',
      complete: '방벽이 세워지고, 캠프파이어가 타오른다. 가족이 안전하다.',
    },
  },

  mq_fire_06: {
    id: 'mq_fire_06',
    title: '은평의 수호자',
    desc: '100일을 생존하라. 가족과 함께.',
    icon: '📖',
    characterId: 'firefighter',
    dayTrigger: 65,
    prerequisite: 'mq_fire_05',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 25, flags: { mainQuestComplete_firefighter: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '가족과 함께 버틴다. 하루하루가 선물이다.',
      complete: '100일. 가족과 함께 버텼다. 이 곳이 새로운 집이다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 최형식 (homeless) — 6 퀘스트
  // 루트: gangnam → songpa (1홉)
  // ══════════════════════════════════════════════════════════════════

  mq_homeless_01: {
    id: 'mq_homeless_01',
    title: '다리 아래 생존',
    desc: '세상이 끝나는 날에도 다리 아래에 있었다. 식량 3개를 수집하라.',
    icon: '🌉',
    characterId: 'homeless',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '세상이 끝나는 날에도 다리 아래에 있었다. 겁이 나지 않았다. 이미 한 번 다 잃었으니까.',
      complete: '식량을 찾았다. 없어도 사는 법을 알지만, 있으면 좋다.',
    },
  },

  mq_homeless_02: {
    id: 'mq_homeless_02',
    title: '첫 번째 불',
    desc: '캠프파이어가 필요하다. 구조물을 제작하라.',
    icon: '🔥',
    characterId: 'homeless',
    dayTrigger: 3,
    prerequisite: 'mq_homeless_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '밤이 추워졌다. 불이 필요하다.',
      complete: '불이 피워졌다. 이것만으로도 충분하다.',
    },
  },

  mq_homeless_03: {
    id: 'mq_homeless_03',
    title: '롯데타워의 불빛',
    desc: '송파구에 도달하라. 롯데타워에서 사람들이 손을 흔드는 것 같았다.',
    icon: '🗼',
    characterId: 'homeless',
    dayTrigger: 10,
    prerequisite: 'mq_homeless_02',
    objective: { type: 'visit_district', districtId: 'songpa', count: 1 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 25,
    narrative: {
      start: '저 위, 롯데타워에서 사람들이 손을 흔드는 것 같았다. 가 봐야 한다.',
      complete: '타워 입구에서 소리가 났다. "물자를 가져와. 그러면 올라올 수 있어."',
    },
  },

  mq_homeless_04: {
    id: 'mq_homeless_04',
    title: '입장료',
    desc: '식량 8개가 입장료다. 아무것도 없이 버티는 법을 안다.',
    icon: '🍖',
    characterId: 'homeless',
    dayTrigger: 15,
    prerequisite: 'mq_homeless_03',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 45,
    narrative: {
      start: '식량 8개. 입장료다. 아무것도 없이 버티는 법을 안다.',
      complete: '식량이 모였다. 이제 타워 사람들에게 가져간다.',
    },
  },

  mq_homeless_05: {
    id: 'mq_homeless_05',
    title: '물 공급',
    desc: '타워의 물탱크를 채워라. 깨끗한 물 5개를 모아라.',
    icon: '💧',
    characterId: 'homeless',
    dayTrigger: 30,
    prerequisite: 'mq_homeless_04',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 5 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 65,
    narrative: {
      start: '타워에 올라갔다. 하지만 물이 부족하다. 물탱크를 채워야 한다.',
      complete: '물탱크를 채웠다. 타워 사람들이 고개를 끄덕였다.',
    },
  },

  mq_homeless_06: {
    id: 'mq_homeless_06',
    title: '새 집',
    desc: '100일을 생존하라. 처음으로 집이 생겼다.',
    icon: '📖',
    characterId: 'homeless',
    dayTrigger: 50,
    prerequisite: 'mq_homeless_05',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 25, flags: { mainQuestComplete_homeless: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '타워가 집이 됐다. 처음으로 집이 생겼다. 이제 지킨다.',
      complete: '100일. 롯데타워가 새 집이 됐다. 처음으로 집이 생겼다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 한소희 (pharmacist) — 6 퀘스트
  // 루트: gangnam → gwanak (3홉)
  // ══════════════════════════════════════════════════════════════════

  mq_pharma_01: {
    id: 'mq_pharma_01',
    title: '약국 재고',
    desc: '삼성병원에 피신했다. 붕대 3개를 수집하라.',
    icon: '💊',
    characterId: 'pharmacist',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'bandage', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '삼성병원에 피신했다. 약국 재고가 바닥나기 전에 재료를 모아야 한다.',
      complete: '붕대를 확보했다. 이것으로 기본 치료는 가능하다.',
    },
  },

  mq_pharma_02: {
    id: 'mq_pharma_02',
    title: '임시 실험실',
    desc: '약품 합성을 위한 공간이 필요하다. 구조물을 제작하라.',
    icon: '🧪',
    characterId: 'pharmacist',
    dayTrigger: 3,
    prerequisite: 'mq_pharma_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '약품 합성에는 안정된 공간이 필요하다. 구조물을 세운다.',
      complete: '임시 실험대가 완성됐다. 조악하지만, 작업할 수 있다.',
    },
  },

  mq_pharma_03: {
    id: 'mq_pharma_03',
    title: '의료 재료 수집',
    desc: '항바이러스 합성에 구급상자의 시약이 필수다. 3개를 모아라.',
    icon: '🩹',
    characterId: 'pharmacist',
    dayTrigger: 10,
    prerequisite: 'mq_pharma_02',
    objective: { type: 'collect_item', definitionId: 'first_aid_kit', count: 3 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 35,
    narrative: {
      start: '항바이러스 합성에 의료 키트의 시약이 필수다. 3개가 필요하다.',
      complete: '시약을 확보했다. 이제 연구소의 장비가 필요하다.',
    },
  },

  mq_pharma_04: {
    id: 'mq_pharma_04',
    title: '서울대 연구소',
    desc: '관악구에 도달하라. 서울대학교 연구소에 합성 장비가 있다.',
    icon: '🎓',
    characterId: 'pharmacist',
    dayTrigger: 25,
    prerequisite: 'mq_pharma_03',
    objective: { type: 'visit_district', districtId: 'gwanak', count: 1 },
    reward: { morale: 15 },
    failPenalty: { morale: -10 },
    deadlineDays: 55,
    narrative: {
      start: '서울대학교 연구소. 정수 장비와 의약품 원료가 남아있을 것이다.',
      complete: '연구소에 필요한 장비가 있었다. 합성 작업을 시작할 수 있다.',
    },
  },

  mq_pharma_05: {
    id: 'mq_pharma_05',
    title: '항바이러스 합성',
    desc: '의료 아이템 3개를 제작하라. 합성의 마지막 단계.',
    icon: '⚗️',
    characterId: 'pharmacist',
    dayTrigger: 40,
    prerequisite: 'mq_pharma_04',
    objective: { type: 'craft_item', category: 'medical', count: 3 },
    reward: { morale: 15 },
    failPenalty: { morale: -5 },
    deadlineDays: 75,
    narrative: {
      start: '5종의 재료. 정확한 온도, 정확한 비율. 시작한다.',
      complete: '시험지가 파랗게 변했다. 양성. 항바이러스 합성체 완성.',
    },
  },

  mq_pharma_06: {
    id: 'mq_pharma_06',
    title: '치료의 증명',
    desc: '100일을 생존하라. 합성체의 효과를 증명한다.',
    icon: '📖',
    characterId: 'pharmacist',
    dayTrigger: 60,
    prerequisite: 'mq_pharma_05',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 25, flags: { mainQuestComplete_pharmacist: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '합성체가 완성됐다. 이제 효과를 증명해야 한다. 살아남으면서.',
      complete: '100일. 항바이러스 합성체. 임시 처방이지만, 처방이었다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 정대한 (engineer) — 6 퀘스트
  // 루트: yongsan → seongdong (3홉)
  // ══════════════════════════════════════════════════════════════════

  mq_eng_01: {
    id: 'mq_eng_01',
    title: '발전기 재료',
    desc: '용산 전자상가에서 부품을 찾았다. 고철 3개를 수집하라.',
    icon: '⚙️',
    characterId: 'engineer',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '용산 전자상가에서 부품을 찾았다. 하지만 이동수단을 만들려면 고철이 더 필요하다.',
      complete: '고철을 확보했다. 기본 재료는 갖춰졌다.',
    },
  },

  mq_eng_02: {
    id: 'mq_eng_02',
    title: '공장 바리케이드',
    desc: '작업 공간을 확보하라. 구조물을 제작하라.',
    icon: '🏗️',
    characterId: 'engineer',
    dayTrigger: 3,
    prerequisite: 'mq_eng_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'scrap_metal', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '작업할 공간이 필요하다. 바리케이드를 세운다.',
      complete: '바리케이드 완성. 이제 안전하게 작업할 수 있다.',
    },
  },

  mq_eng_03: {
    id: 'mq_eng_03',
    title: '성수동 복귀',
    desc: '성동구에 도달하라. 공장에 설계도와 도구가 있다.',
    icon: '🏭',
    characterId: 'engineer',
    dayTrigger: 12,
    prerequisite: 'mq_eng_02',
    objective: { type: 'visit_district', districtId: 'seongdong', count: 1 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 40,
    narrative: {
      start: '성수동 공장에 설계도와 도구가 있다. 돌아가야 한다.',
      complete: '공장에 도착했다. 셔터를 내리고 발전기를 확인했다. 아직 돌아간다.',
    },
  },

  mq_eng_04: {
    id: 'mq_eng_04',
    title: '이동수단 설계',
    desc: '도면을 펼쳤다. 고철 8개가 필요하다.',
    icon: '📐',
    characterId: 'engineer',
    dayTrigger: 25,
    prerequisite: 'mq_eng_03',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 8 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 60,
    narrative: {
      start: '도면을 펼쳤다. 고철 8개. 로프 3개. 이동수단을 만든다.',
      complete: '고철 수집 완료. 골격이 만들어졌다.',
    },
  },

  mq_eng_05: {
    id: 'mq_eng_05',
    title: '조향 장치',
    desc: '조향 장치에 로프 3개가 필요하다.',
    icon: '🔧',
    characterId: 'engineer',
    dayTrigger: 40,
    prerequisite: 'mq_eng_04',
    objective: { type: 'collect_item', definitionId: 'rope', count: 3 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 75,
    narrative: {
      start: '골격은 완성됐다. 조향 장치에 로프가 필요하다.',
      complete: '로프 수집 완료. 조향 장치 설계가 마무리됐다.',
    },
  },

  mq_eng_06: {
    id: 'mq_eng_06',
    title: '탈출 기계',
    desc: '100일을 생존하라. 이동수단을 완성한다.',
    icon: '📖',
    characterId: 'engineer',
    dayTrigger: 60,
    prerequisite: 'mq_eng_05',
    objective: { type: 'survive_days', count: 100 },
    reward: { morale: 25, flags: { mainQuestComplete_engineer: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '조향 장치까지 완성됐다. 이제 조립만 남았다. 100일을 버텨야 한다.',
      complete: '100일. 이동수단이 완성됐다. 서울 외곽으로 달린다.',
    },
  },
};

export { MAIN_QUESTS };
export default MAIN_QUESTS;
