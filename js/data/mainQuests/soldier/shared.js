// === MAIN QUESTS: 강민준 (soldier) — 공통 1~10 ===
// Q10 완료 시 분기 선택: A(박영철 구조 작전) vs B(KBS 단독 방송)

const SOLDIER_SHARED = {

  mq_soldier_01: {
    id: 'mq_soldier_01',
    title: '용산 기지 생존',
    desc: '무기고에서 나이프를 확보하라. 기본 무장이 필요하다.',
    icon: '🔪',
    characterId: 'soldier',
    dayTrigger: 1,
    prerequisite: null,
    objective: { type: 'collect_item', definitionId: 'knife', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 10,
    narrative: {
      start: '용산 미군기지 무기고. 강민준 하사(29세). 팀원 4명은 이미 없다. 무기를 확보하고 나간다.',
      complete: '나이프를 확보했다. 무기고 옆 의무실에서 붕대도 챙겼다. 총기는 실탄이 없으면 쇠붙이에 불과하다. 나이프가 더 믿음직하다.',
    },
  },

  mq_soldier_02: {
    id: 'mq_soldier_02',
    title: '방어선 구축',
    desc: '기지 외곽에 방어 구조물을 세워라.',
    icon: '🏗️',
    characterId: 'soldier',
    dayTrigger: 2,
    prerequisite: 'mq_soldier_01',
    objective: { type: 'craft_item', category: 'structure', count: 1 },
    reward: { morale: 5, items: [{ definitionId: 'bandage', qty: 2 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 12,
    narrative: {
      start: '기지 정문이 무너지기 시작했다. 전술적 방어선을 구축한다. 군인의 첫 번째 본능은 진지 구축이다.',
      complete: '바리케이드 완성. 진지 방어 표준 절차대로. 하룻밤은 버틸 수 있다.',
    },
  },

  mq_soldier_03: {
    id: 'mq_soldier_03',
    title: '야전 보급',
    desc: '식량 5개를 확보하라. 원정 전 충분한 보급이 필요하다.',
    icon: '🍖',
    characterId: 'soldier',
    dayTrigger: 4,
    prerequisite: 'mq_soldier_02',
    objective: { type: 'collect_item_type', itemType: 'food', count: 5 },
    reward: { morale: 5, items: [{ definitionId: 'painkiller', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 14,
    narrative: {
      start: '전술 이동 전 보급 확인. 군 규정: 72시간치 식량 없이 작전 수행 불가. 개인 규정도 같다.',
      complete: '3일치 식량 확보. 식량 창고 한쪽에 진통제도 있었다. 이동 준비 완료.',
    },
  },

  mq_soldier_04: {
    id: 'mq_soldier_04',
    title: '무전기 복원',
    desc: '전자 부품 2개로 무전기를 수리하라.',
    icon: '📡',
    characterId: 'soldier',
    dayTrigger: 6,
    prerequisite: 'mq_soldier_03',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 2 },
    reward: { morale: 10, items: [{ definitionId: 'radio', qty: 1 }] },
    failPenalty: { morale: -5 },
    deadlineDays: 16,
    narrative: {
      start: '기지 무전기의 회로가 나갔다. 용산 전자상가에서 부품을 구할 수 있다. 통신 없이는 전술 판단이 불가능하다.',
      complete: '무전기 수리 완료. 신호가 잡혔다. "여기는 여의도 KBS. 아직 방송 중입니다." 그리고 다른 신호. "광화문 정부청사... 최종 명령..."',
    },
  },

  mq_soldier_05: {
    id: 'mq_soldier_05',
    title: '야전 응급처치',
    desc: '붕대 3개를 확보하라. 부상 대비 기본 의료 키트를 갖춘다.',
    icon: '🩹',
    characterId: 'soldier',
    dayTrigger: 8,
    prerequisite: 'mq_soldier_04',
    objective: { type: 'collect_item', definitionId: 'bandage', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'alcohol_swab', qty: 2 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 18,
    narrative: {
      start: '특수전 부사관 기본 훈련. 야전 응급처치. 혼자서 지혈하고 움직일 수 있어야 한다.',
      complete: '의료 키트 준비 완료. 붕대와 소독 솜까지 갖췄다. 전투 중 부상은 피할 수 없다. 대비하는 것뿐이다.',
    },
  },

  mq_soldier_06: {
    id: 'mq_soldier_06',
    title: '무기 정비',
    desc: '고철 3개를 수집하라. 근접 무기를 강화한다.',
    icon: '⚙️',
    characterId: 'soldier',
    dayTrigger: 10,
    prerequisite: 'mq_soldier_05',
    objective: { type: 'collect_item', definitionId: 'scrap_metal', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'sharpened_knife', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 20,
    narrative: {
      start: '나이프 하나로는 부족하다. 고철로 날을 갈아 더 강하게 만든다. 무기 정비는 기본 훈련 과목이다.',
      complete: '날카로운 칼 완성. 고철로 날을 갈아 제대로 된 전투 나이프가 됐다. 이 정도면 돌파가 가능하다.',
    },
  },

  mq_soldier_07: {
    id: 'mq_soldier_07',
    title: '원정 식량',
    desc: '광화문까지의 여정에 식량 3개를 더 비축하라.',
    icon: '🎒',
    characterId: 'soldier',
    dayTrigger: 13,
    prerequisite: 'mq_soldier_06',
    objective: { type: 'collect_item_type', itemType: 'food', count: 3 },
    reward: { morale: 5, items: [{ definitionId: 'military_ration', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 23,
    narrative: {
      start: '광화문까지 최소 이틀. 전투가 불가피하다. 배고픈 전투원은 판단력이 흐려진다.',
      complete: '배낭이 묵직하다. 기지 창고 깊숙이 군용 식량팩도 챙겼다. 출발 준비 완료.',
    },
  },

  mq_soldier_08: {
    id: 'mq_soldier_08',
    title: '광화문 돌파',
    desc: '종로구에 도달하라. 정부청사에 마지막 지령이 있을 수 있다.',
    icon: '🏛️',
    characterId: 'soldier',
    dayTrigger: 15,
    prerequisite: 'mq_soldier_07',
    objective: { type: 'visit_district', districtId: 'jongno', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'pistol_ammo', qty: 3 }, { definitionId: 'compass', qty: 1 }] },
    failPenalty: { morale: -10 },
    deadlineDays: 40,
    narrative: {
      start: '정부청사에 최종 명령이 있을 수 있다. 돌파한다. 방사선 주의.',
      complete: '청사는 텅 비어 있었다. 하지만 벽에 좌표가 적혀 있었다. "KBS 여의도. 방송 가능. 비상전력 72시간." 군번줄 하나. 팀원 박상현. 그리고 탄약 3발과 나침반이 책상 서랍에 남아 있었다.',
    },
  },

  mq_soldier_09: {
    id: 'mq_soldier_09',
    title: '탈출 로프',
    desc: '로프 2개를 확보하라. 건물 간 이동에 필요하다.',
    icon: '🧗',
    characterId: 'soldier',
    dayTrigger: 18,
    prerequisite: 'mq_soldier_08',
    objective: { type: 'collect_item', definitionId: 'rope', count: 2 },
    reward: { morale: 5, items: [{ definitionId: 'rope_ladder', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 43,
    narrative: {
      start: '종로 도심. 지상 이동은 너무 위험하다. 건물 옥상을 통해 이동해야 한다. 로프가 필수다.',
      complete: '로프로 사다리를 만들었다. 수직 이동이 자유로워졌다. 전술 기동력 확보.',
    },
  },

  mq_soldier_10: {
    id: 'mq_soldier_10',
    title: '통신 강화',
    desc: '전자 부품 2개를 더 확보하라. 무전 범위를 늘린다.',
    icon: '📻',
    characterId: 'soldier',
    dayTrigger: 21,
    prerequisite: 'mq_soldier_09',
    objective: { type: 'collect_item', definitionId: 'electronic_parts', count: 2 },
    reward: { morale: 8, items: [{ definitionId: 'binoculars', qty: 1 }] },
    failPenalty: { morale: -3 },
    deadlineDays: 46,
    isBranchPoint: true,
    branchOptions: [
      {
        label: '박영철 소방관과 구조 작전',
        desc: '생존자 구조에 전술 능력을 쓴다.',
        setsFlag: 'soldier_branch_a',
        recruitNpc: 'npc_yeongcheol',
      },
      {
        label: 'KBS 단독 방송 임무',
        desc: '혼자 KBS로 간다. 전국에 신호를 보낸다.',
        setsFlag: 'soldier_branch_b',
      },
    ],
    narrative: {
      start: 'KBS까지 무전이 약하게 잡힌다. 부품으로 증폭기를 만들면 통신 범위가 넓어진다.',
      complete: '증폭기 완성. KBS 신호가 선명해졌다. 전자부품 수거 중 버려진 쌍안경도 발견했다. 두 선택이 기다린다. 박영철의 구조 요청, 그리고 KBS.',
    },
  },

  // ── 사이드 퀘스트: 약탈자 소굴 구출 작전 ─────────────────────
  // Q10 이후 해금. 도봉→종로→영등포 난이도로 이어지는 인질 구출 루트.

  mq_soldier_side_01: {
    id: 'mq_soldier_side_01',
    title: '소규모 소굴 정리',
    desc: '도봉구 인근의 소규모 약탈자 캠프를 소탕하고 인질을 구출하라.',
    icon: '🏴',
    characterId: 'soldier',
    dayTrigger: 25,
    prerequisite: 'mq_soldier_10',
    objective: { type: 'rescue_npc', landmarkId: 'lm_raider_camp_small', count: 1 },
    reward: {
      morale: 12,
      items: [
        { definitionId: 'sharpened_knife', qty: 1 },
        { definitionId: 'pistol_ammo',     qty: 3 },
      ],
    },
    failPenalty: { morale: -5 },
    deadlineDays: 20,
    narrative: {
      start: '도봉산 기슭에서 무전이 잡혔다. "도와주세요… 약탈자들이…" 소규모 캠프다. 셋, 넷 정도. 돌파 가능.',
      complete: '캠프 소탕 완료. 결박된 민간인을 풀어주고 기지까지 호송했다. 약탈자들의 무기고에서 나이프와 탄환도 챙겼다. 시작일 뿐이다.',
    },
  },

  mq_soldier_side_02: {
    id: 'mq_soldier_side_02',
    title: '중형 거점 침투',
    desc: '광화문 인근 약탈자 중간 거점을 침투하여 리더를 제거하고 포로를 구출하라.',
    icon: '⚠️',
    characterId: 'soldier',
    dayTrigger: 40,
    prerequisite: 'mq_soldier_side_01',
    objective: { type: 'rescue_npc', landmarkId: 'lm_raider_camp_medium', count: 1 },
    reward: {
      morale: 15,
      items: [
        { definitionId: 'pistol_ammo',   qty: 6 },
        { definitionId: 'shotgun_ammo',  qty: 3 },
        { definitionId: 'first_aid_kit', qty: 1 },
      ],
      recruitNpc: 'npc_rescued_civilian',
    },
    failPenalty: { morale: -8 },
    deadlineDays: 25,
    narrative: {
      start: '광화문 폐건물에 중간 거점이 있다. 리더와 호위 대여섯. 정면 돌파는 자살이다. 측면 침투, 리더 제거, 포로 구출. 표준 특수전 절차.',
      complete: '리더 사살, 호위 전멸. 포로 감금실에서 구출한 민간인 중 한 명이 기지에 합류하겠다고 한다. 탄약도 대량으로 확보. 다음은 영등포 요새다.',
    },
  },

  mq_soldier_side_03: {
    id: 'mq_soldier_side_03',
    title: '요새 강습',
    desc: '영등포 약탈자 요새를 강습하여 보스를 처치하고 모든 포로를 해방하라.',
    icon: '💀',
    characterId: 'soldier',
    dayTrigger: 60,
    prerequisite: 'mq_soldier_side_02',
    objective: { type: 'rescue_npc', landmarkId: 'lm_raider_camp_large', count: 1 },
    reward: {
      morale: 20,
      items: [
        { definitionId: 'rifle',       qty: 1 },
        { definitionId: 'rifle_ammo',  qty: 8 },
        { definitionId: 'military_ration', qty: 3 },
      ],
      flags: { raider_fortress_cleared: true },
    },
    failPenalty: { morale: -12 },
    deadlineDays: 30,
    narrative: {
      start: '영등포 폐공장이 요새화됐다. 보스와 중무장 부대 열 명 이상. 단독 강습은 무모하지만 수용동에 여러 명의 민간인이 갇혀 있다. 작전 개시.',
      complete: '요새 함락. 보스 처치. 수용동의 민간인을 모두 해방시켰다. 보스 집무실에서 노획한 소총과 탄약, 군용 식량팩을 챙겼다. 서울 서부의 약탈자 세력은 붕괴했다.',
    },
  },

};

export default SOLDIER_SHARED;
