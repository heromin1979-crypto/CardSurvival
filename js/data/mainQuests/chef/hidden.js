// === 윤재혁 (chef) — 히든 장소 안내 퀘스트 ===
// 곁가지. 메인 체인의 선행 조건이 아니다.
// 냉동 창고에는 보스가 있다. 세부장소 진입 시 스폰되므로 desc로 미리 경고한다.

const CHEF_HIDDEN = {

  mq_chef_hl_cold_storage: {
    id: 'mq_chef_hl_cold_storage', title: '아직 영하인 곳',
    desc: '남대문시장 지하 냉동 창고가 발전기로 버티고 있다. 중구로 가라. 방독면이 필요하고, 안에 누가 있다.',
    icon: '❄️', characterId: 'chef', dayTrigger: 24,
    prerequisite: 'mq_chef_05',
    objective: { type: 'discover_location', locationId: 'hidden_namdaemun_cold_storage', count: 1 },
    reward: { morale: 14, items: [{ definitionId: 'salt', qty: 3 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '시장 지하 대형 냉동고는 자체 발전기를 돌린다. 아직 영하라면 안의 것들도 그대로다. 다만 냉매가 샜을 것이다 — 방독면 없이 문을 열면 안 된다. 그리고 그 창고를 나만큼 잘 아는 사람이 하나 더 있다.',
      complete: '문틈에서 냉기가 새어나왔다. 아직 살아 있다. 윤재혁은 방독면을 고쳐 쓰고 손잡이를 잡았다.',
    },
  },

  mq_chef_hl_pantry: {
    id: 'mq_chef_hl_pantry', title: '출입 코드',
    desc: '장충동 호텔 지하 저장고는 비상용 재고가 남아 있다. 중구로 가라. 코드를 아는 사람은 그뿐이다.',
    icon: '🍳', characterId: 'chef', dayTrigger: 1,
    prerequisite: 'mq_chef_01',
    objective: { type: 'discover_location', locationId: 'hidden_junggoo_hotel_kitchen', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'herb', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '지하 저장고 출입 코드는 주방장과 총지배인만 안다. 비상용으로 쌓아둔 재고가 그대로일 것이다. 마지막 재고 조사를 한 게 그 주였다.',
      complete: '선반에 붙은 재고 목록이 그의 글씨였다. 숫자 하나 틀리지 않게 남아 있었다.',
    },
  },

};

export default CHEF_HIDDEN;
