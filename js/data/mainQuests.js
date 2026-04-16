// === MAIN QUEST DEFINITIONS (67 quests) ===
// 6 캐릭터별 메인 퀘스트 체인. Day 1~365 스토리라인.
// doctor: 11 (05b 분기 포함), soldier: 10, firefighter: 12, homeless: 10, chef: 10, engineer: 12
// objective types: collect_item, craft_item, survive_days, visit_district, collect_item_type
// deadlineDays: Infinity(∞) = 기한 없음

const MAIN_QUESTS = {

  // ══════════════════════════════════════════════════════════════════
  // 이지수 (doctor) — 11 퀘스트 (05b 분기 포함)
  // 루트: gangnam → seodaemun(or gangnam 분기) → yeongdeungpo → 야전병원 → 백신
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
    alternativePrerequisites: ['mq_doctor_05', 'mq_doctor_05b'],
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
    title: '365일의 기록',
    desc: '365일을 생존하라. 치료의 증거를 완성한다.',
    icon: '📖',
    characterId: 'doctor',
    dayTrigger: 70,
    prerequisite: 'mq_doctor_07',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, flags: { mainQuestComplete_doctor: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '방송이 나갔다. 이제 할 수 있는 것은 기다리는 것. 그리고 계속 살아남는 것.',
      complete: '365일. 무전에서 첫 번째 응답이 들렸다. "프로토콜을 받았습니다. 효과가 있습니다." 메모지에 적었다. "D+365. 치료법 확인."',
    },
  },

  // ── 분기 퀘스트: 삼성병원 대안 루트 ──────────────────────────────
  mq_doctor_05b: {
    id: 'mq_doctor_05b',
    title: '강남 삼성병원 재탐색',
    desc: '세브란스 대신 삼성병원 지하 연구실에서 데이터를 확보할 수도 있다.',
    icon: '🔬',
    characterId: 'doctor',
    dayTrigger: null,
    prerequisite: 'mq_doctor_04',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'antiseptic', qty: 3 }] },
    failPenalty: null,
    deadlineDays: null,
    narrative: {
      start: '세브란스까지 가는 건 위험하다. 삼성병원 지하에도 연구 데이터가 있을 수 있다. 더 안전한 경로를 택할 수 있다.',
      complete: '삼성병원 지하에서 부분적인 연구 데이터를 확보했다. 완전하진 않지만, 치료에 도움이 될 것이다.',
    },
  },

  // ── 확장 퀘스트: 야전 병원 설립 ─────────────────────────────────
  mq_doctor_09: {
    id: 'mq_doctor_09',
    title: '야전 병원 설립',
    desc: '생존자들을 치료할 수 있는 야전 병원을 세워라.',
    icon: '🏥',
    characterId: 'doctor',
    dayTrigger: null,
    prerequisite: 'mq_doctor_06',
    objective: { type: 'build_structure', structureId: 'medical_station', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'first_aid_kit', qty: 2 }] },
    failPenalty: null,
    deadlineDays: null,
    narrative: {
      start: '의료 데이터를 분석한 결과, 이동식 치료소가 필요하다. 세브란스에서 가져온 장비로 야전 병원을 세울 수 있다.',
      complete: '야전 병원이 완성됐다. 이제 감염자들을 체계적으로 치료할 수 있다.',
    },
  },

  // ── 확장 퀘스트: 백신 프로토타입 ────────────────────────────────
  mq_doctor_10: {
    id: 'mq_doctor_10',
    title: '백신 프로토타입',
    desc: '수집한 의료 데이터로 백신 시제품을 만들어라.',
    icon: '💉',
    characterId: 'doctor',
    dayTrigger: null,
    prerequisite: 'mq_doctor_09',
    objective: { type: 'collect_item', itemId: 'purified_medicine', count: 3 },
    reward: { morale: 20, items: [{ definitionId: 'synthetic_antibiotics', qty: 1 }] },
    failPenalty: null,
    deadlineDays: null,
    narrative: {
      start: '야전 병원에서 감염 패턴을 분석할 수 있게 됐다. 정제약 3개를 모아 백신 시제품을 만들어야 한다.',
      complete: '백신 시제품이 완성됐다! 아직 대량 생산은 불가능하지만, 치료의 희망이 보인다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 강민준 (soldier) — 10 퀘스트
  // 루트: yongsan → jongno(dl4!) → yeongdeungpo
  // 체인: 01→02→02b→02c→03→04→05→05b→05c→06
  // ══════════════════════════════════════════════════════════════════

  mq_soldier_01: {
    id: 'mq_soldier_01',
    title: '용산 기지 생존',
    desc: '용산 미군기지의 무기고에서 버티고 있다. 돌칼을 제작하라.',
    icon: '🔪',
    characterId: 'soldier',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'craft_item', definitionId: 'stone_knife', count: 1 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '용산 미군기지의 무기고에서 버티고 있다. 무기를 만들어 나가야 한다.',
      complete: '돌칼을 만들었다. 이제 밖으로 나갈 준비가 됐다.',
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

  mq_soldier_02b: {
    id: 'mq_soldier_02b',
    title: '무전기 복원',
    desc: '기지의 무전기가 고장났다. 천 5개로 안테나를 보수하라.',
    icon: '📡',
    characterId: 'soldier',
    dayTrigger: 5,
    prerequisite: 'mq_soldier_02',
    objective: { type: 'collect_item', definitionId: 'cloth', count: 5 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 20,
    narrative: {
      start: '기지 무전기의 안테나가 망가졌다. 천으로 보수할 수 있다. 주변에서 찾아보자.',
      complete: '무전기에서 잡음이 들린다. "...KBS... 방송 중..." 그리고 또 하나. "광화문... 정부청사... 최종 명령..."',
    },
  },

  mq_soldier_02c: {
    id: 'mq_soldier_02c',
    title: '야전 식량',
    desc: '광화문까지의 여정에 식량이 필요하다. 식량 5개를 비축하라.',
    icon: '🍖',
    characterId: 'soldier',
    dayTrigger: 8,
    prerequisite: 'mq_soldier_02b',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'military_ration', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 25,
    narrative: {
      start: '광화문까지 최소 이틀. 전투가 불가피하다. 식량을 충분히 확보해야 한다.',
      complete: '배낭이 묵직하다. 이 정도면 광화문까지 버틸 수 있다.',
    },
  },

  mq_soldier_03: {
    id: 'mq_soldier_03',
    title: '광화문 돌파',
    desc: '정부청사에 마지막 지령이 있을 수 있다. 종로구로 돌파하라. 방사선 주의.',
    icon: '🏛️',
    characterId: 'soldier',
    dayTrigger: 12,
    prerequisite: 'mq_soldier_02c',
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

  mq_soldier_05b: {
    id: 'mq_soldier_05b',
    title: '전우의 인식표',
    desc: '방송국에서 전사한 전우들의 인식표를 발견했다. 유품을 수습하라.',
    icon: '🎖️',
    characterId: 'soldier',
    dayTrigger: 45,
    prerequisite: 'mq_soldier_05',
    objective: { type: 'collect_item', definitionId: 'knife', count: 2 },
    reward: { morale: 15, items: [{ definitionId: 'military_ration', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 80,
    narrative: {
      start: 'KBS 방송국 복도에서 군번줄을 발견했다. 광화문에서 함께 후퇴했던... 유품을 수습해야 한다.',
      complete: '인식표 4개. 박상현, 김태호, 이동훈, 정재민. 전우들의 이름을 기억한다. 기록에서 군 비상 주파수를 발견했다.',
    },
  },

  mq_soldier_05c: {
    id: 'mq_soldier_05c',
    title: '비상 주파수 송출',
    desc: '전우의 기록에서 발견한 군 비상 주파수로 집결 좌표를 송출하라.',
    icon: '📻',
    characterId: 'soldier',
    dayTrigger: 55,
    prerequisite: 'mq_soldier_05b',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 2 },
    reward: { morale: 15, flags: { military_frequency_active: true } },
    failPenalty: { morale: -5 },
    deadlineDays: 90,
    narrative: {
      start: '군 비상 주파수. 민간 방송보다 범위가 넓다. 전자 부품으로 증폭기를 만들면 전국에 닿는다.',
      complete: '두 개의 주파수로 동시 송출. 민간 KBS와 군 비상 채널. 이제 누군가는 듣고 있을 것이다.',
    },
  },

  mq_soldier_06: {
    id: 'mq_soldier_06',
    title: '서울 집결 좌표',
    desc: '365일을 생존하라. 방송이 닿는 곳을 기다린다.',
    icon: '📖',
    characterId: 'soldier',
    dayTrigger: 65,
    prerequisite: 'mq_soldier_05c',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, flags: { mainQuestComplete_soldier: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '방송이 나갔다. 좌표와 함께. 이제 기다린다. 누군가 응답할 때까지.',
      complete: '365일. 무전에서 신호가 들린다. 경기도 수원에서 첫 번째 응답. "KBS 수신했습니다. 이동 중입니다."',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 박영철 (firefighter) — 10 퀘스트
  // 루트: yongsan → seodaemun → eunpyeong
  // 체인: 01→02→02b→02c→03→04→05→05b→05c→06
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

  mq_fire_02b: {
    id: 'mq_fire_02b',
    title: '응급 구조 키트',
    desc: '은평까지의 여정에 의료 물자가 필수다. 의료 아이템 3개를 수집하라.',
    icon: '🩹',
    characterId: 'firefighter',
    dayTrigger: 5,
    prerequisite: 'mq_fire_02',
    objective: { type: 'collect_item_type', itemType: 'medical', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 20,
    narrative: {
      start: '소방관의 본능이 말한다. 의료 물자 없이 이동하면 죽는다. 구급 키트를 꾸려야 한다.',
      complete: '응급 키트가 갖춰졌다. 이재훈이 이것만 있었어도... 아니, 지금은 앞만 보자.',
    },
  },

  mq_fire_02c: {
    id: 'mq_fire_02c',
    title: '탈출 경로',
    desc: '건물 사이를 안전하게 이동하려면 로프가 필요하다. 로프 2개를 확보하라.',
    icon: '🧗',
    characterId: 'firefighter',
    dayTrigger: 10,
    prerequisite: 'mq_fire_02b',
    objective: { type: 'collect_item', definitionId: 'rope', count: 2 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 30,
    narrative: {
      start: '서대문까지 직선 루트는 감염자로 가득하다. 옥상과 비상계단을 연결해야 한다.',
      complete: '로프를 확보했다. 이제 건물 사이를 안전하게 이동할 수 있다.',
    },
  },

  mq_fire_03: {
    id: 'mq_fire_03',
    title: '은평을 향해',
    desc: '서대문구에 도달하라. 은평구로 가는 길목이다.',
    icon: '🗺️',
    characterId: 'firefighter',
    dayTrigger: 15,
    prerequisite: 'mq_fire_02c',
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

  mq_fire_05b: {
    id: 'mq_fire_05b',
    title: '동료 이재훈의 메모',
    desc: '은평 소방서에서 감염된 동료의 유품을 발견했다. 서대문 소방서를 다시 방문하라.',
    icon: '📝',
    characterId: 'firefighter',
    dayTrigger: 50,
    prerequisite: 'mq_fire_05',
    objective: { type: 'visit_district', districtId: 'seodaemun', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'first_aid_kit', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 85,
    narrative: {
      start: '은평 소방서 사물함에서 이재훈의 메모를 발견했다. "서대문 지하 창고... 특수 장비... 네가 쓸 수 있을 거야."',
      complete: '서대문 소방서 지하 창고. 이재훈이 숨겨둔 물자가 있었다. 마지막까지 동료를 생각한 녀석.',
    },
  },

  mq_fire_05c: {
    id: 'mq_fire_05c',
    title: '생존자 대피소',
    desc: '가족 외에도 생존자들이 모여들고 있다. 대피소를 확장하라.',
    icon: '🏘️',
    characterId: 'firefighter',
    dayTrigger: 55,
    prerequisite: 'mq_fire_05b',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 15, flags: { eunpyeong_shelter_built: true } },
    failPenalty: { morale: -5 },
    deadlineDays: 90,
    narrative: {
      start: '이웃들이 하나둘 모여든다. "소방관 아저씨, 여기 안전한가요?" 대피소가 필요하다.',
      complete: '바리케이드, 캠프파이어, 정수 시설. 은평 대피소가 완성됐다. 12명의 생존자가 여기에 의지하고 있다.',
    },
  },

  mq_fire_05d: {
    id: 'mq_fire_05d',
    title: '은평 대피소 방어전',
    desc: '대피소를 방어할 추가 구조물이 필요하다. 구조물 3개를 제작하라.',
    icon: '🛡️',
    characterId: 'firefighter',
    dayTrigger: 60,
    prerequisite: 'mq_fire_05c',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 15 },
    failPenalty: { morale: -5 },
    deadlineDays: 100,
    narrative: {
      start: '감염자 군집이 은평 쪽으로 이동하고 있다. 대피소 방어를 강화해야 한다.',
      complete: '삼중 방벽이 완성됐다. 이 정도면 군집도 막을 수 있다.',
    },
  },

  mq_fire_05e: {
    id: 'mq_fire_05e',
    title: '용산 생존자 구출',
    desc: '용산구에 고립된 생존자가 있다. 용산구를 방문하라.',
    icon: '🚑',
    characterId: 'firefighter',
    dayTrigger: 70,
    prerequisite: 'mq_fire_05d',
    objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },
    reward: { morale: 15 },
    failPenalty: { morale: -5 },
    deadlineDays: 120,
    narrative: {
      start: '무전에서 구조 요청. "여기는 용산... 3명이 고립..." 소방관의 본능이 움직인다.',
      complete: '생존자 3명을 구출했다. 은평 대피소로 데려온다. 이제 15명이다.',
    },
  },

  mq_fire_06: {
    id: 'mq_fire_06',
    title: '은평의 수호자',
    desc: '365일을 생존하라. 가족과 함께.',
    icon: '📖',
    characterId: 'firefighter',
    dayTrigger: 80,
    prerequisite: 'mq_fire_05e',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, flags: { mainQuestComplete_firefighter: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '가족과 함께 버틴다. 하루하루가 선물이다.',
      complete: '365일. 가족과 함께 버텼다. 이 곳이 새로운 집이다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 최형식 (homeless) — 10 퀘스트
  // 루트: gangnam → songpa (1홉)
  // 체인: 01→02→02b→02c→03→04→05→05b→05c→06
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

  mq_homeless_02b: {
    id: 'mq_homeless_02b',
    title: '거리의 기술',
    desc: '오래 거리에서 살았다. 쓸모 있는 재료 5개를 수집하라.',
    icon: '🔍',
    characterId: 'homeless',
    dayTrigger: 5,
    prerequisite: 'mq_homeless_02',
    objective: { type: 'collect_item_type', itemType: 'material', count: 5 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 18,
    narrative: {
      start: '쓰레기통 속에서 보물을 찾는 법을 안다. 남들이 버린 것에서 가치를 발견하는 것. 그게 거리의 기술이다.',
      complete: '재료가 모였다. 2년간 다리 밑에서 배운 기술이 이제야 빛을 발한다.',
    },
  },

  mq_homeless_02c: {
    id: 'mq_homeless_02c',
    title: '한강의 길',
    desc: '롯데타워까지 가려면 한강을 건너야 한다. 깨끗한 물 3개를 비축하라.',
    icon: '🌊',
    characterId: 'homeless',
    dayTrigger: 7,
    prerequisite: 'mq_homeless_02b',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 22,
    narrative: {
      start: '한강 다리를 건너야 한다. 물이 없으면 이동 중에 쓰러진다.',
      complete: '물을 확보했다. 동호대교가 보인다. 저 너머에 롯데타워가 있다.',
    },
  },

  mq_homeless_03: {
    id: 'mq_homeless_03',
    title: '롯데타워의 불빛',
    desc: '송파구에 도달하라. 롯데타워에서 사람들이 손을 흔드는 것 같았다.',
    icon: '🗼',
    characterId: 'homeless',
    dayTrigger: 10,
    prerequisite: 'mq_homeless_02c',
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

  mq_homeless_05b: {
    id: 'mq_homeless_05b',
    title: '거리의 지혜',
    desc: '타워 사람들이 네 생존 노하우에 의지한다. 재료 10개를 수급하라.',
    icon: '🧠',
    characterId: 'homeless',
    dayTrigger: 35,
    prerequisite: 'mq_homeless_05',
    objective: { type: 'collect_item_type', itemType: 'material', count: 10 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 70,
    narrative: {
      start: '"대표님, 물자 수급 좀 가르쳐주세요." 타워 사람들이 물었다. 건설회사 사장이었다는 건 비밀이다.',
      complete: '물자 수급 루트를 확립했다. 타워에서 네 자리가 만들어지고 있다.',
    },
  },

  mq_homeless_05c: {
    id: 'mq_homeless_05c',
    title: '과거의 빚',
    desc: '타워에서 옛 사업 파트너를 만났다. 화해의 의미로 식량 5개를 모아라.',
    icon: '🤝',
    characterId: 'homeless',
    dayTrigger: 45,
    prerequisite: 'mq_homeless_05b',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 20, flags: { past_reconciled: true } },
    failPenalty: { morale: -10 },
    deadlineDays: 80,
    narrative: {
      start: '"형식이... 형식이야?" 타워 3층에서 마주친 얼굴. 2023년, 보증 실패의 원인이 된 그 사람. 화해할 수 있을까.',
      complete: '식량을 나누며 오래된 이야기를 했다. "미안했다." "나도." 빚은 사라졌다. 남은 건 동료뿐.',
    },
  },

  mq_homeless_06: {
    id: 'mq_homeless_06',
    title: '새 집',
    desc: '365일을 생존하라. 처음으로 집이 생겼다.',
    icon: '📖',
    characterId: 'homeless',
    dayTrigger: 50,
    prerequisite: 'mq_homeless_05c',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, flags: { mainQuestComplete_homeless: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '타워가 집이 됐다. 처음으로 집이 생겼다. 이제 지킨다.',
      complete: '365일. 롯데타워가 새 집이 됐다. 처음으로 집이 생겼다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 윤재혁 (chef) — 10 퀘스트
  // 루트: junggoo → gangnam → yongsan
  // 체인: 01→02→03→04→05→06→07→08→09→10
  // ══════════════════════════════════════════════════════════════════

  mq_chef_01: {
    id: 'mq_chef_01',
    title: '남대문 식재료',
    desc: '남대문시장에서 식재료를 확보하라. 식량 3개를 수집하라.',
    icon: '🛒',
    characterId: 'chef',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '명동 소피텔 호텔에서 탈출했다. 남대문시장에 아직 쓸 만한 식재료가 있을 것이다.',
      complete: '식재료를 확보했다. 셰프의 본능이 되살아난다.',
    },
  },

  mq_chef_02: {
    id: 'mq_chef_02',
    title: '조리대 설치',
    desc: '요리를 하려면 조리 공간이 필요하다. 구조물을 제작하라.',
    icon: '🏗️',
    characterId: 'chef',
    dayTrigger: 3,
    prerequisite: 'mq_chef_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'salt', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 15,
    narrative: {
      start: '시장 한쪽에 임시 조리대를 세운다. 불과 냄비, 그리고 셰프의 손.',
      complete: '조리대가 완성됐다. 조악하지만, 요리할 수 있다.',
    },
  },

  mq_chef_03: {
    id: 'mq_chef_03',
    title: '안전한 식수',
    desc: '요리에 깨끗한 물이 필수다. 깨끗한 물 3개를 확보하라.',
    icon: '💧',
    characterId: 'chef',
    dayTrigger: 5,
    prerequisite: 'mq_chef_02',
    objective: { type: 'collect_item', definitionId: 'clean_water', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 20,
    narrative: {
      start: '오염된 물로는 요리할 수 없다. 깨끗한 물을 찾아야 한다.',
      complete: '깨끗한 물을 확보했다. 이제 제대로 된 요리를 할 수 있다.',
    },
  },

  mq_chef_04: {
    id: 'mq_chef_04',
    title: '식재료 대량 비축',
    desc: '급식소를 열려면 식량이 많이 필요하다. 식량 8개를 비축하라.',
    icon: '🍖',
    characterId: 'chef',
    dayTrigger: 10,
    prerequisite: 'mq_chef_03',
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 35,
    narrative: {
      start: '사람들이 모여들고 있다. 굶주린 얼굴들. 많은 식량이 필요하다.',
      complete: '식재료가 넉넉히 모였다. 급식소를 열 수 있다.',
    },
  },

  mq_chef_05: {
    id: 'mq_chef_05',
    title: '생존자 급식소',
    desc: '급식소를 운영하려면 구조물이 더 필요하다. 구조물 2개를 제작하라.',
    icon: '🍲',
    characterId: 'chef',
    dayTrigger: 25,
    prerequisite: 'mq_chef_04',
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 15, flags: { chef_canteen_open: true } },
    failPenalty: { morale: -5 },
    deadlineDays: 55,
    narrative: {
      start: '조리대만으로는 부족하다. 테이블, 지붕, 저장 공간. 급식소를 세운다.',
      complete: '급식소가 열렸다. 첫 번째 줄이 섰다. "한 그릇 더 있어요."',
    },
  },

  mq_chef_06: {
    id: 'mq_chef_06',
    title: '식량 자급 루트',
    desc: '강남구를 방문해 식량 수급 루트를 개척하라.',
    icon: '🗺️',
    characterId: 'chef',
    dayTrigger: 35,
    prerequisite: 'mq_chef_05',
    objective: { type: 'visit_district', districtId: 'gangnam', count: 1 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 65,
    narrative: {
      start: '남대문시장의 식재료는 바닥나고 있다. 강남 지역에 대형 마트가 있을 것이다.',
      complete: '강남 대형 마트에서 수급 루트를 확보했다. 정기적으로 식재료를 가져올 수 있다.',
    },
  },

  mq_chef_07: {
    id: 'mq_chef_07',
    title: '옛 호텔 동료',
    desc: '용산구를 방문해 소피텔 호텔의 옛 동료를 수색하라.',
    icon: '👨‍🍳',
    characterId: 'chef',
    dayTrigger: 45,
    prerequisite: 'mq_chef_06',
    objective: { type: 'visit_district', districtId: 'yongsan', count: 1 },
    reward: { morale: 15 },
    failPenalty: { morale: -5 },
    deadlineDays: 80,
    narrative: {
      start: '소피텔 호텔의 동료 셰프가 용산 쪽으로 피신했다는 소문이 있다. 찾아야 한다.',
      complete: '동료를 찾았다. 함께라면 급식소를 더 크게 운영할 수 있다.',
    },
  },

  mq_chef_08: {
    id: 'mq_chef_08',
    title: '급식소 확장',
    desc: '더 많은 생존자를 위해 급식소를 확장하라. 구조물 3개를 제작하라.',
    icon: '🏘️',
    characterId: 'chef',
    dayTrigger: 55,
    prerequisite: 'mq_chef_07',
    objective: { type: 'craft_item', category: 'structure', count: 3 },
    reward: { morale: 15 },
    failPenalty: { morale: -5 },
    deadlineDays: 100,
    narrative: {
      start: '급식소에 사람이 너무 많다. 확장해야 한다. 더 큰 조리 공간, 더 많은 테이블.',
      complete: '급식소가 확장됐다. 이제 50명 이상을 먹일 수 있다.',
    },
  },

  mq_chef_09: {
    id: 'mq_chef_09',
    title: '식량 저장고',
    desc: '겨울을 대비해 식량을 대량 비축하라. 식량 15개를 확보하라.',
    icon: '📦',
    characterId: 'chef',
    dayTrigger: 70,
    prerequisite: 'mq_chef_08',
    objective: { type: 'collect_item_type', itemType: 'food', count: 15 },
    reward: { morale: 20, flags: { chef_storage_complete: true } },
    failPenalty: { morale: -10 },
    deadlineDays: 150,
    narrative: {
      start: '겨울이 온다. 식량 저장고를 가득 채워야 한다. 15개 이상의 식량이 필요하다.',
      complete: '저장고가 가득 찼다. 이 겨울을 넘길 수 있다.',
    },
  },

  mq_chef_10: {
    id: 'mq_chef_10',
    title: '새로운 시작',
    desc: '365일을 생존하라. 서울의 식량 자급 체계를 증명한다.',
    icon: '📖',
    characterId: 'chef',
    dayTrigger: 80,
    prerequisite: 'mq_chef_09',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, flags: { mainQuestComplete_chef: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '급식소는 이제 서울 최대의 식량 거점이다. 이대로 계속 살아남는다.',
      complete: '365일. 남대문 급식소는 서울의 희망이 됐다. 칼이 아닌 국자로 세상을 바꿨다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 정대한 (engineer) — 10 퀘스트
  // 루트: yongsan → seongdong → guro
  // 체인: 01→02→02b→02c→03→04→05→05b→05c→06
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

  mq_eng_02b: {
    id: 'mq_eng_02b',
    title: '전자 부품 수거',
    desc: '용산 전자상가에서 전자 부품 3개를 수거하라. 발전기 수리에 필요하다.',
    icon: '💡',
    characterId: 'engineer',
    dayTrigger: 5,
    prerequisite: 'mq_eng_02',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 20,
    narrative: {
      start: '전자상가 3층에 부품이 남아있을 것이다. 발전기를 고치려면 전자 부품이 필수다.',
      complete: '부품 확보. 발전기의 제어 회로를 교체할 수 있다. 연료만 있으면 전력이 나온다.',
    },
  },

  mq_eng_02c: {
    id: 'mq_eng_02c',
    title: '아버지의 메모',
    desc: '공장으로 돌아가기 전에 와이어 3개를 수집하라. 배선 작업에 필요하다.',
    icon: '📐',
    characterId: 'engineer',
    dayTrigger: 8,
    prerequisite: 'mq_eng_02b',
    objective: { type: 'collect_item', definitionId: 'wire', count: 3 },
    reward: { morale: 5 },
    failPenalty: { morale: -5 },
    deadlineDays: 25,
    narrative: {
      start: '아버지의 공장에 설계도가 있다. 가기 전에 배선 재료를 준비해야 한다. 와이어가 필수다.',
      complete: '와이어 확보. 이제 성수동으로 돌아갈 준비가 됐다.',
    },
  },

  mq_eng_03: {
    id: 'mq_eng_03',
    title: '성수동 복귀',
    desc: '성동구에 도달하라. 공장에 설계도와 도구가 있다.',
    icon: '🏭',
    characterId: 'engineer',
    dayTrigger: 12,
    prerequisite: 'mq_eng_02c',
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

  mq_eng_05b: {
    id: 'mq_eng_05b',
    title: '연료 문제',
    desc: '이동수단은 완성됐지만 연료가 없다. 전자 부품 3개로 대체 동력을 설계하라.',
    icon: '🔋',
    characterId: 'engineer',
    dayTrigger: 45,
    prerequisite: 'mq_eng_05',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 3 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 80,
    narrative: {
      start: '경유는 없다. 하지만 배터리와 모터가 있다면 전기 동력으로 전환할 수 있다.',
      complete: '전기 모터 프로토타입 완성. 아버지의 설계도에 있던 것과 비슷하다. 이제 시운전만 남았다.',
    },
  },

  mq_eng_05c: {
    id: 'mq_eng_05c',
    title: '시운전',
    desc: '이동수단 조립 완료. 시험 도로가 있는 구로구에 도달하라.',
    icon: '🚗',
    characterId: 'engineer',
    dayTrigger: 55,
    prerequisite: 'mq_eng_05b',
    objective: { type: 'visit_district', districtId: 'guro', count: 1 },
    reward: { morale: 15, flags: { vehicle_tested: true } },
    failPenalty: { morale: -10 },
    deadlineDays: 90,
    narrative: {
      start: '구로 디지털단지의 넓은 도로. 시운전에 최적이다. 이동수단을 끌고 가야 한다.',
      complete: '시동이 걸렸다. 느리지만 움직인다. 100미터... 200미터... 작동한다! 서울 밖으로 갈 수 있다.',
    },
  },

  mq_eng_05d: {
    id: 'mq_eng_05d',
    title: '함정 설치',
    desc: '공장 주변에 감염자 방어 함정을 설치하라. 고철 5개를 수집하라.',
    icon: '⚠️',
    characterId: 'engineer',
    dayTrigger: 60,
    prerequisite: 'mq_eng_05c',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 5 },
    reward: { morale: 10 },
    failPenalty: { morale: -5 },
    deadlineDays: 100,
    narrative: {
      start: '시운전 중 감염자 무리와 마주쳤다. 공장 주변에 함정을 설치해야 안전하다.',
      complete: '가시 함정 5개 설치 완료. 이제 공장은 안전하다.',
    },
  },

  mq_eng_05e: {
    id: 'mq_eng_05e',
    title: '발전기 수리',
    desc: '공장 발전기를 완전히 수리하라. 전자 부품 5개를 확보하라.',
    icon: '🔋',
    characterId: 'engineer',
    dayTrigger: 70,
    prerequisite: 'mq_eng_05d',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 5 },
    reward: { morale: 15, flags: { generator_repaired: true } },
    failPenalty: { morale: -5 },
    deadlineDays: 130,
    narrative: {
      start: '발전기를 완전히 수리하면 공장의 모든 장비를 가동할 수 있다. 전자 부품이 더 필요하다.',
      complete: '발전기가 완전히 복구됐다. 전력이 안정적으로 공급된다. 이제 뭐든 만들 수 있다.',
    },
  },

  mq_eng_06: {
    id: 'mq_eng_06',
    title: '탈출 기계',
    desc: '365일을 생존하라. 이동수단을 완성한다.',
    icon: '📖',
    characterId: 'engineer',
    dayTrigger: 80,
    prerequisite: 'mq_eng_05e',
    objective: { type: 'survive_days', count: 365 },
    reward: { morale: 25, flags: { mainQuestComplete_engineer: true } },
    failPenalty: null,
    deadlineDays: Infinity,
    narrative: {
      start: '조향 장치까지 완성됐다. 이제 조립만 남았다. 365일을 버텨야 한다.',
      complete: '365일. 이동수단이 완성됐다. 서울 외곽으로 달린다.',
    },
  },

  // ══════════════════════════════════════════════════════════════════
  // 글로벌 퀘스트 — 모든 캐릭터 공통 (characterId 없음)
  // Day 30 / 45 / 60 단기 미션으로 중반 동기 제공
  // ══════════════════════════════════════════════════════════════════

  mq_global_30: {
    id: 'mq_global_30',
    title: '첫 번째 물결',
    desc: '군집이 몰려온다. 방어 구조물을 2개 확보하라.',
    icon: '🧟',
    characterId: null,
    dayTrigger: 28,
    prerequisite: null,
    objective: { type: 'craft_item', category: 'structure', count: 2 },
    reward: { morale: 20 },
    failPenalty: { morale: -10 },
    deadlineDays: 20,
    narrative: {
      start: 'Day 30이 다가오고 있다. 서울 어딘가에서 군집의 발소리가 들린다. 방어선을 준비하라.',
      complete: '바리케이드가 세워졌다. 이 정도면 첫 번째 물결은 막을 수 있을 것이다.',
    },
  },

  mq_global_45: {
    id: 'mq_global_45',
    title: '중반의 고비',
    desc: '45일을 버텨라. 이 도시에서 이만큼 살아남은 사람은 많지 않다.',
    icon: '🗺️',
    characterId: null,
    dayTrigger: 40,
    prerequisite: null,
    objective: { type: 'survive_days', count: 45 },
    reward: { morale: 15 },
    failPenalty: { morale: -5 },
    deadlineDays: 25,
    narrative: {
      start: '한 곳에만 머물러서는 살아남을 수 없다. 서울을 더 알아야 한다.',
      complete: '도시의 윤곽이 눈에 익기 시작했다. 어디에 뭐가 있는지 감이 잡힌다.',
    },
  },

  mq_global_60: {
    id: 'mq_global_60',
    title: '60일 생존자',
    desc: '60일을 버텼다. 식량 비축을 늘려라. 식량 8개를 확보하라.',
    icon: '🥫',
    characterId: null,
    dayTrigger: 55,
    prerequisite: null,
    objective: { type: 'collect_item_type', itemType: 'food', count: 8 },
    reward: { morale: 25 },
    failPenalty: { morale: -10 },
    deadlineDays: 20,
    narrative: {
      start: 'Day 60. 절반의 사람들이 여기까지 못 왔다. 하지만 배고픔과 싸우는 건 아직도 끝나지 않았다.',
      complete: '창고가 조금 더 찼다. 이것이 생존이다.',
    },
  },
};

export { MAIN_QUESTS };
export default MAIN_QUESTS;
