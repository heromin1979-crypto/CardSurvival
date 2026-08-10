// === 정대한 (engineer) — 히든 장소 안내 퀘스트 ===
// 곁가지. 메인 체인의 선행 조건이 아니다.

const ENGINEER_HIDDEN = {

  mq_eng_hl_workshop: {
    id: 'mq_eng_hl_workshop', title: '문패 없는 작업실',
    desc: '성수동 공장지대 안쪽에 이름 없는 작업실이 있다. 성동구를 충분히 돌아다녀야 찾을 수 있다.',
    icon: '🔨', characterId: 'engineer', dayTrigger: 52,
    prerequisite: 'mq_eng_05',
    objective: { type: 'discover_location', locationId: 'hidden_seongdong_forge_master', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'scrap_metal', qty: 4 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '아버지가 말한 적 있다. 성수동에 문패도 안 걸고 일하는 사람이 있다고. 주문은 소개로만 받았다고. 그 골목을 다 뒤져야 나올 것이다.',
      complete: '3층, 문패 없는 방. 벽 한 면이 전부 공구였다. 걸이마다 자리가 정해져 있고, 빈자리가 하나도 없었다.',
    },
  },

  mq_eng_hl_reactor: {
    id: 'mq_eng_hl_reactor', title: '정지한 노심',
    desc: '서울대 공대 뒤편에 연구용 원자로가 있다. 관악구로 가라. 방호복 없이는 격납 건물에 들어갈 수 없다.',
    icon: '☢️', characterId: 'engineer', dayTrigger: 62,
    prerequisite: 'mq_eng_08',
    objective: { type: 'discover_location', locationId: 'hidden_gwanak_snu_reactor', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'electronic_parts', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '연구용 원자로에는 동위원소 전지가 들어간다. 반감기가 수십 년이라 지금도 살아 있을 것이다. 노심은 정지했겠지만, 방호복 없이 들어갈 생각은 하지 말아야 한다.',
      complete: '계기판에 아직 불이 들어와 있었다. 정대한은 선량계를 확인하고, 숨을 한 번 고른 뒤 격납 건물로 들어갔다.',
    },
  },

  mq_eng_hl_hangar: {
    id: 'mq_eng_hl_hangar', title: '활주로 끝',
    desc: '김포공항 정비 격납고에 분해 중이던 기체가 남아 있다. 강서구로 가라. 정비 도면을 읽으려면 제작 숙련이 필요하다.',
    icon: '✈️', characterId: 'engineer', dayTrigger: 110,
    prerequisite: 'mq_eng_08',
    objective: { type: 'discover_location', locationId: 'hidden_gangseo_airport_hangar', count: 1 },
    reward: { morale: 18, items: [{ definitionId: 'duct_tape', qty: 3 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '정비 격납고에는 늘 분해 중인 기체가 한 대씩 있다. 회전익기 부품을 통째로 구할 수 있는 곳은 여기뿐이다. 다만 항공 정비 도면은 눈으로 읽는 게 아니라 손으로 읽는다.',
      complete: '잭에 올라간 채 멈춘 기체. 카울이 열려 있고 공구가 그대로 놓여 있었다. 누군가 여기서 손을 놓고 떠났다.',
    },
  },

};

export default ENGINEER_HIDDEN;
