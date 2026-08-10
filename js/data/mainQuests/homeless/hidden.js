// === 최형식 (homeless) — 히든 장소 안내 퀘스트 ===
// 곁가지. 메인 체인의 선행 조건이 아니다.

const HOMELESS_HIDDEN = {

  mq_home_hl_shelter: {
    id: 'mq_home_hl_shelter', title: '2년의 자리',
    desc: '동호대교 아래 은신처는 성동구에 있다. 두고 온 물건들이 그대로 있을 것이다.',
    icon: '🌉', characterId: 'homeless', dayTrigger: 1,
    prerequisite: 'mq_homeless_01',
    objective: { type: 'discover_location', locationId: 'hidden_yangcheon_dongho_bridge', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'cloth', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '강남 쪽으로 넘어오느라 챙기지 못한 것들이 있다. 침낭, 박스, 그리고 매일 적던 것. 다리 아래는 아무도 뒤지지 않는다.',
      complete: '플라스틱 박스도 침낭도 그대로였다. 2년치 자리가 아직 그를 기다리고 있었다.',
    },
  },

  mq_home_hl_fortress: {
    id: 'mq_home_hl_fortress', title: '손을 흔들던 사람들',
    desc: '롯데타워 저층부를 점거한 생존자 집단이 있다. 송파구로 가라. 거리에서 쌓은 이름이 통할 것이다.',
    icon: '🏢', characterId: 'homeless', dayTrigger: 16,
    prerequisite: 'mq_homeless_05',
    objective: { type: 'discover_location', locationId: 'hidden_jamsil_lotte_tower_lobby', count: 1 },
    reward: { morale: 14, items: [{ definitionId: 'canned_food', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '그날 밤 저 위에서 누군가 손을 흔들었다. 로비를 통째로 막고 사람이 산다는 소문이 돌았다. 거리에서 이름이 도는 게 이럴 때 쓸모가 있다.',
      complete: '로비의 바리케이드가 열렸다. "오셨군요, 형식 씨." 이름을 아는 사람이 있었다.',
    },
  },

};

export default HOMELESS_HIDDEN;
