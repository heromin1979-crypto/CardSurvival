// === 강민준 (soldier) — 히든 장소 안내 퀘스트 ===
// 곁가지. 메인 체인의 선행 조건이 아니다.

const SOLDIER_HIDDEN = {

  mq_soldier_hl_kbs: {
    id: 'mq_soldier_hl_kbs', title: '살아 있는 송출 계통',
    desc: 'KBS 본관 지하에 정규 계통과 분리된 비상 스튜디오가 있다. 영등포구 여의도로 가라.',
    icon: '📡', characterId: 'soldier', dayTrigger: 44,
    prerequisite: 'mq_soldier_05',
    objective: { type: 'discover_location', locationId: 'hidden_yeongdeungpo_kbs_broadcast', count: 1 },
    reward: { morale: 12, items: [{ definitionId: 'battery', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '재난 방송 매뉴얼은 외우고 있었다. 본관 지하에 정규 계통과 분리된 비상 스튜디오가 따로 있다. 송신탑이 서 있다면, 아직 말할 수 있다는 뜻이다.',
      complete: '예비 전원 표시등이 켜져 있었다. 콘솔에 손을 얹었다. 이 도시에서 아직 목소리를 낼 수 있는 자리가 하나 남아 있었다.',
    },
  },

  mq_soldier_hl_armory: {
    id: 'mq_soldier_hl_armory', title: '기지의 마지막 문',
    desc: '용산 기지 무기고는 전자식 잠금이 예비 전원으로 버티고 있다. 용산구로 가라. 우회하려면 전자부품 3개가 필요하고, 경계도 살아 있다.',
    icon: '🔫', characterId: 'soldier', dayTrigger: 70,
    prerequisite: 'mq_soldier_08',
    objective: { type: 'discover_location', locationId: 'hidden_yongsan_us_armory', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'pistol_ammo', qty: 6 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '연합훈련 때 한 번 들어가 봤다. 전자식 잠금은 예비 전원으로 90일을 버틴다. 배선을 우회할 부품과, 거기까지 살아서 갈 실력이 필요하다.',
      complete: '패널 뒤 배선을 더듬어 우회로를 만들었다. 걸쇠가 풀리는 소리. 강민준은 오랜만에 군인의 손으로 문을 열었다.',
    },
  },

};

export default SOLDIER_HIDDEN;
