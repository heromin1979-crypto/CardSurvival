// === 이지수 (doctor) — 히든 장소 안내 퀘스트 ===
// 메인 체인의 선행 조건이 아니다. 놓쳐도 진행이 막히지 않는 곁가지로 두고,
// 히든 장소의 존재와 필요한 준비물만 알려준다. 발견 판정 자체는
// HiddenElementSystem이 하고, 여기서는 discover_location으로 완료만 받는다.

const DOCTOR_HIDDEN = {

  mq_doctor_hl_pharmacy: {
    id: 'mq_doctor_hl_pharmacy', title: '봉인된 약제실',
    desc: '삼성병원 마약류 관리 구역이 봉인된 채 남아 있다. 강남구로 가라. 셔터를 뜯을 쇠지렛대가 필요하다.',
    icon: '💊', characterId: 'doctor', dayTrigger: 24,
    prerequisite: 'mq_doctor_05',
    objective: { type: 'discover_location', locationId: 'hidden_gangnam_samsung_pharmacy', count: 1 },
    reward: { morale: 10, items: [{ definitionId: 'crowbar', qty: 1 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '동기에게서 들은 이야기가 떠올랐다. 마약류 관리 구역은 이중 셔터에 봉인 스티커까지 붙는다. 아무도 손대지 못했다면, 아직 그대로일 것이다.',
      complete: '봉인 스티커가 붙은 채였다. 아무도 여기까지 오지 못했다. 이지수는 장갑을 끼고 셔터를 들어올렸다.',
    },
  },

  mq_doctor_hl_p4: {
    id: 'mq_doctor_hl_p4', title: '지하 4층',
    desc: '세브란스 본관 지하에 P4 등급 연구실이 있다. 서대문구로 가라. 방호복 없이는 기밀문도 열 수 없다.',
    icon: '🧫', characterId: 'doctor', dayTrigger: 42,
    prerequisite: 'mq_doctor_08',
    objective: { type: 'discover_location', locationId: 'hidden_seodaemun_severance_lab', count: 1 },
    reward: { morale: 15, items: [{ definitionId: 'antiseptic', qty: 2 }] },
    deadlineDays: Infinity,
    narrative: {
      start: '학회에서 딱 한 번 들어가 봤다. 지하 4층, 이중 기밀문, 음압 유지. 그 안에 원본 샘플이 있다면 — 백신을 이야기할 수 있는 유일한 출발점이다. 방호복부터 구해야 한다.',
      complete: '음압 경보가 아직 낮게 울리고 있었다. 전원이 끊기지 않았다는 뜻이다. 이지수는 기밀문 안으로 한 걸음 들어섰다.',
    },
  },

};

export default DOCTOR_HIDDEN;
