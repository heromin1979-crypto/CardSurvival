// === 박영철 (firefighter) — 히든 장소 안내 퀘스트 ===
// 곁가지. 메인 체인의 선행 조건이 아니다.

const FIREFIGHTER_HIDDEN = {

  mq_fire_hl_station: {
    id: 'mq_fire_hl_station', title: '두고 온 차고',
    desc: '불광 소방서는 은평구에 있다. 출동 나간 그날 그대로 남아 있을 것이다.',
    icon: '🚒', characterId: 'firefighter', dayTrigger: 1,
    prerequisite: 'mq_fire_01',
    objective: { type: 'discover_location', locationId: 'hidden_eunpyeong_fire_station', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'bandage', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '차고 문을 열어둔 채 나왔다. 이재훈의 사물함도, 장비 창고도 그대로일 것이다. 은평구로 가야 한다.',
      complete: '차고 문이 반쯤 열린 채 멈춰 있었다. 박영철은 한동안 문 앞에 서 있었다.',
    },
  },

};

export default FIREFIGHTER_HIDDEN;
