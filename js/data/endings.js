// === ENDING DEFINITIONS (24 endings) ===
// categories: 'death' | 'milestone' | 'escape' | 'character'
// condition(gs): function → boolean  (death endings have no condition — triggered by cause)

export const ENDINGS = {

  // ── 죽음 엔딩 (10) ─────────────────────────────────────────────

  death_dehydration: {
    id: 'death_dehydration', category: 'death',
    title: '마지막 갈증',        subtitle: '탈수사',
    gradient: 'linear-gradient(160deg,#0a0808 0%,#1a1005 60%,#0d0a02 100%)',
    narrative: [
      '서울의 잿빛 하늘 아래, 입술이 갈라지고 있었다.',
      '마지막 물 한 모금을 마신 것이 언제였던가. 기억이 희미해졌다.',
      '무릎이 꺾였다. 콘크리트 바닥이 차가웠다. 그것만은 느껴졌다.',
      '눈앞이 흐려지며 멀리서 누군가의 목소리가 들리는 것 같았다.',
      '그것이 마지막이었다.',
    ],
  },

  death_hypothermia: {
    id: 'death_hypothermia', category: 'death',
    title: '얼어붙은 도시',      subtitle: '저체온증',
    gradient: 'linear-gradient(160deg,#030b14 0%,#0a1520 60%,#050d18 100%)',
    narrative: [
      '한겨울의 서울은 잔인했다. 연료가 없고, 불도 없었다.',
      '손가락 끝이 감각을 잃은 것이 두 시간 전. 이제는 발도 느껴지지 않는다.',
      '이상하게도 따뜻한 느낌이 밀려왔다. 이것이 마지막이라는 것을 알면서도.',
      '눈이 내렸다. 파괴된 서울 위에 하얗게.',
      '아무도 없었다.',
    ],
  },

  death_starvation: {
    id: 'death_starvation', category: 'death',
    title: '굶주림의 끝',        subtitle: '아사',
    gradient: 'linear-gradient(160deg,#0f0a00 0%,#1a1200 60%,#0a0800 100%)',
    narrative: [
      '위장은 이미 오래 전에 포기했다. 이제는 아프지도 않았다.',
      '마지막 식량을 먹은 것이 삼일 전이었다.',
      '탐색을 포기할 수 없었다. 어딘가에는 반드시 있을 것이라 믿었다.',
      '그 믿음이 이 거리까지 데려왔지만, 더는 발이 움직이지 않았다.',
      '서서히, 조용히.',
    ],
  },

  death_radiation: {
    id: 'death_radiation', category: 'death',
    title: '보이지 않는 독',      subtitle: '방사선 중독',
    gradient: 'linear-gradient(160deg,#0a0f00 0%,#141f00 60%,#0a1000 100%)',
    narrative: [
      '처음엔 두통이었다. 그다음엔 구토.',
      '방사선 계측기 없이 너무 많은 곳을 돌아다녔다.',
      '몸 내부에서 무언가가 무너지는 느낌. 눈에 보이지 않는 적.',
      '피부에 반점이 생겼을 때, 이미 돌이킬 수 없었다.',
      '조용히, 그리고 고통스럽게.',
    ],
  },

  death_nuclear_zone: {
    id: 'death_nuclear_zone', category: 'death',
    title: '침묵의 땅',           subtitle: '방사선 구역 과다 피폭',
    gradient: 'linear-gradient(160deg,#0a1000 0%,#0f1a00 60%,#060d00 100%)',
    narrative: [
      '경고를 무시했다. 아니면 다른 선택이 없었을지도 모른다.',
      '방사선 구역에 세 번. 매번 몸이 조금씩 더 타들어갔다.',
      '이 도시에는 인간이 감당할 수 없는 무게가 있었다.',
      '마지막 구역에 발을 디딘 순간, 돌아올 수 없다는 것을 알았다.',
      '서울의 한 귀퉁이에서, 소리 없이.',
    ],
  },

  death_infection: {
    id: 'death_infection', category: 'death',
    title: '감염의 침묵',          subtitle: '감염 쇼크',
    gradient: 'linear-gradient(160deg,#0a0010 0%,#12001a 60%,#070010 100%)',
    narrative: [
      '상처는 작았다. 처음엔 별것 아니라 생각했다.',
      '이틀 후 열이 났다. 사흘 후 의식이 흐려졌다.',
      '이 도시에 돌아다니는 것들이 얼마나 오염되었는지 잊고 있었다.',
      '치료약은 없었다. 그것을 찾으러 가야 했지만, 이제 일어설 수가 없었다.',
      '눈이 감겼다. 어두워졌다.',
    ],
  },

  death_combat: {
    id: 'death_combat', category: 'death',
    title: '전장의 끝',            subtitle: '전투 사망',
    gradient: 'linear-gradient(160deg,#14000a 0%,#1f0010 60%,#0f0008 100%)',
    narrative: [
      '마지막 전투였다. 모든 전투가 마지막이 될 수 있다는 것을 알면서도.',
      '상대는 너무 많았다. 아니면 이쪽이 너무 지쳐 있었다.',
      '총이 비었을 때 주먹으로 싸웠다. 그것마저 힘이 빠졌을 때.',
      '바닥에 쓰러지며, 하늘을 봤다.',
      '서울의 하늘은 여전히 잿빛이었다.',
    ],
  },

  death_horde: {
    id: 'death_horde', category: 'death',
    title: '군중에 삼켜지다',      subtitle: '군중 압사',
    gradient: 'linear-gradient(160deg,#180000 0%,#250000 60%,#100000 100%)',
    narrative: [
      '처음에는 둘이었다. 그다음은 넷. 그다음은.',
      '비명을 질렀는지도 모른다. 이미 의미가 없었다.',
      '이 도시에는 혼자 감당할 수 없는 순간들이 있었다.',
      '뒤를 돌아볼 틈이 없었다. 앞만 보며 싸웠지만.',
      '결국, 그것들이 이겼다.',
    ],
  },

  death_despair: {
    id: 'death_despair', category: 'death',
    title: '절망의 끝',            subtitle: '의지 상실',
    gradient: 'linear-gradient(160deg,#080808 0%,#101010 60%,#050505 100%)',
    narrative: [
      '언제부터였을까. 일어나는 것이 의미를 잃었다.',
      '식량이 없어서가 아니었다. 이유가 사라진 것이었다.',
      '서울은 너무 넓고, 너무 조용하고, 너무 오래 이렇게 있었다.',
      '어느 날 아침, 더는 일어나지 않기로 했다.',
      '도시는 계속 침묵했다.',
    ],
  },

  death_exhaustion: {
    id: 'death_exhaustion', category: 'death',
    title: '불귀의 출발',          subtitle: '극도 피로 붕괴',
    gradient: 'linear-gradient(160deg,#0a0a12 0%,#14141a 60%,#080810 100%)',
    narrative: [
      '마지막 탐색을 나갔을 때, 몸은 이미 한계였다.',
      '48시간을 쉬지 않고 움직였다. 이 도시는 쉬는 것을 허락하지 않는 것 같았다.',
      '발이 멈췄다. 의지와 관계없이.',
      '벽에 기대어 앉았다. 잠깐만 쉬자고 생각했다.',
      '그 잠깐이 돌아오지 않았다.',
    ],
  },

  // ── 마일스톤 엔딩 (4) ──────────────────────────────────────────

  milestone_fortified: {
    id: 'milestone_fortified', category: 'milestone',
    title: '요새를 완성하다',      subtitle: '생존 거점 구축',
    gradient: 'linear-gradient(160deg,#0a1a10 0%,#102a18 60%,#081408 100%)',
    condition: (gs) => {
      if (gs.time.day < 180) return false;
      const board = gs.getBoardCards();
      return board.some(c => c.definitionId === 'barricade')
          && board.some(c => c.definitionId === 'water_purifier')
          && board.some(c => c.definitionId === 'campfire');
    },
    narrative: [
      '반년이 지났다. 그 사이 이곳은 달라졌다.',
      '방벽이 세워지고, 물이 정화되고, 불이 꺼지지 않는 공간.',
      '완벽하지 않았다. 부족한 것도 많았다. 하지만 여기는 안전했다.',
      '처음 이 도시를 살아남을 수 있을까 생각했던 그 날이 기억났다.',
      '대답은 이미 나왔다.',
    ],
  },

  milestone_survived_year: {
    id: 'milestone_survived_year', category: 'milestone',
    title: '1년을 살아내다',       subtitle: 'Day 365 달성',
    gradient: 'linear-gradient(160deg,#0a0a20 0%,#10102a 60%,#080818 100%)',
    condition: (gs) => gs.time.day >= 365,
    narrative: [
      '365일이 지났다. 서울이 무너진 그 날부터.',
      '사계절이 돌았다. 폭염과 혹한을 모두 넘겼다.',
      '혼자가 아니었다면 더 좋았을까. 아니면 혼자였기에 살아남은 것일까.',
      '내년도 살 것이다. 그것만큼은 확신할 수 있었다.',
      '이 도시는 아직 끝나지 않았다.',
    ],
  },

  milestone_scavenger: {
    id: 'milestone_scavenger', category: 'milestone',
    title: '약탈의 귀재',          subtitle: '아이템 200개 수집',
    gradient: 'linear-gradient(160deg,#1a1000 0%,#251800 60%,#180e00 100%)',
    condition: (gs) => gs.time.day >= 180 && (gs.flags.totalItemsFound ?? 0) >= 200,
    narrative: [
      '2백 개. 폐허에서 찾아낸 물건들의 수.',
      '필요한 것을 어디서 찾는지 감이 생겼다. 도시의 냄새를 알게 됐다.',
      '약국, 편의점, 주유소, 아파트 창고. 각각 다른 것들이 있었다.',
      '이 지식이 목숨을 구했다. 한 번이 아니라 수십 번.',
      '이제 이 도시가 낯설지 않다.',
    ],
  },

  milestone_warrior: {
    id: 'milestone_warrior', category: 'milestone',
    title: '도시의 전사',           subtitle: '적 100명 처치',
    gradient: 'linear-gradient(160deg,#14000a 0%,#1f0010 60%,#100008 100%)',
    condition: (gs) => gs.time.day >= 180 && (gs.flags.totalKills ?? 0) >= 100,
    narrative: [
      '백 개. 이 도시에서 쓰러뜨린 것들의 수.',
      '처음엔 두려웠다. 그다음엔 익숙해졌다. 이제는.',
      '전투는 달라졌다. 더 조용해졌다. 더 효율적이 됐다.',
      '이것이 자랑스러운 일인지는 모른다. 그러나 여기까지 데려온 것은 사실이다.',
      '살아 있다. 그것으로 충분하다.',
    ],
  },

  // ── 탈출 엔딩 (4) ──────────────────────────────────────────────

  escape_river: {
    id: 'escape_river', category: 'escape',
    title: '한강을 건너다',         subtitle: '강 너머로',
    gradient: 'linear-gradient(160deg,#001a2a 0%,#00253a 60%,#001020 100%)',
    condition: (gs) => {
      return gs.time.day >= 180
          && gs.location.districtsVisited.includes('songpa')
          && gs.location.districtsVisited.includes('yeongdeungpo');
    },
    narrative: [
      '한강은 여전히 흐르고 있었다.',
      '잠실과 여의도. 강의 양쪽을 모두 봤다.',
      '저편에 무엇이 있는지 몰랐다. 하지만 여기보다는 나을 것이었다.',
      '서울을 뒤에 두고, 처음으로 눈물이 났다.',
      '물결이 발목을 감쌌다. 멀어지는 도시.',
    ],
  },

  escape_helicopter: {
    id: 'escape_helicopter', category: 'escape',
    title: '마지막 헬기',           subtitle: 'KBS 방송 성공',
    gradient: 'linear-gradient(160deg,#001020 0%,#001830 60%,#000818 100%)',
    condition: (gs) => {
      return gs.time.day >= 180
          && (gs.flags.yeongdeungpoVisited ?? false)
          && (gs.flags.totalKills ?? 0) >= 50;
    },
    narrative: [
      'KBS에서 방송이 나갔다. 좌표와 함께.',
      '72시간을 기다렸다. 기대하지 않으려 했다.',
      '세 번째 날 새벽, 소리가 들렸다. 프로펠러 소리.',
      '옥상으로 뛰어올라갔다. 손을 흔들었다. 목이 터지도록 소리쳤다.',
      '헬기가 내려왔다. 살았다.',
    ],
  },

  escape_north: {
    id: 'escape_north', category: 'escape',
    title: '북쪽 탈출로',            subtitle: '서울 전역 답파',
    gradient: 'linear-gradient(160deg,#101020 0%,#181830 60%,#0a0a20 100%)',
    condition: (gs) => {
      return gs.time.day >= 200
          && gs.location.districtsVisited.length >= 10;
    },
    narrative: [
      '서울 전역을 누볐다. 모르는 골목이 없을 정도로.',
      '그러다 발견했다. 북쪽으로 이어지는 길 하나.',
      '막혀 있지 않은 도로. 불탄 차들 사이의 틈.',
      '확신이 없었다. 하지만 가지 않으면 영원히 이 도시에 있을 것이었다.',
      '서울의 경계를 넘었다. 하늘이 조금 달랐다.',
    ],
  },

  escape_cure: {
    id: 'escape_cure', category: 'escape',
    title: '치료제와 함께',          subtitle: '감염 해소 · Day 270',
    gradient: 'linear-gradient(160deg,#001a10 0%,#002a18 60%,#001008 100%)',
    condition: (gs) => {
      return gs.time.day >= 270
          && (gs.flags.infectionCured ?? false)
          && (gs.flags.seodaemunVisited ?? false);
    },
    narrative: [
      '9개월이 걸렸다. 세브란스 연구소의 데이터, 수십 번의 실패.',
      '마지막 합성이 성공했을 때, 손이 떨렸다.',
      '이것이 진짜인지 확인하는 데 이틀이 걸렸다. 그렇다. 진짜다.',
      '서울을 떠나야 했다. 이것이 필요한 곳으로.',
      '뒤를 돌아봤다. 이 도시가 남긴 것들을 품고, 앞으로 걸어갔다.',
    ],
  },

  // ── 캐릭터 엔딩 (6) ────────────────────────────────────────────

  char_doctor: {
    id: 'char_doctor', category: 'character', characterId: 'doctor',
    title: '이지수: 치료의 빛',     subtitle: '감염 해독 프로토콜 완성',
    gradient: 'linear-gradient(160deg,#001a20 0%,#00252f 60%,#001018 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && gs.time.day >= 180
          && (gs.flags.seodaemunVisited ?? false)
          && (gs.flags.infectionCured ?? false);
    },
    narrative: [
      '이지수는 메모를 꺼냈다. "신촌 세브란스. 바이러스 연구팀."',
      '그 팀은 없었다. 하지만 데이터가 있었다. 감염 패턴, 샘플, 메모.',
      '반년의 임상 관찰과 결합했다. 프로토콜이 만들어졌다.',
      '첫 번째 감염자에게 투여했을 때, 열이 내렸다.',
      '이지수는 메모지에 적었다. "D+180. 치료법 확인."',
    ],
  },

  char_soldier: {
    id: 'char_soldier', category: 'character', characterId: 'soldier',
    title: '강민준: 방송의 시작',   subtitle: 'KBS 방송 재개',
    gradient: 'linear-gradient(160deg,#100a00 0%,#1a1200 60%,#0a0800 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'soldier'
          && gs.time.day >= 120
          && (gs.flags.yeongdeungpoVisited ?? false)
          && (gs.flags.totalKills ?? 0) >= 30;
    },
    narrative: [
      '여의도 KBS. 잡음뿐이던 무전기가 말했던 곳.',
      '30명을 뚫고 들어갔다. 건물 안은 조용했다.',
      '방송 장비는 살아 있었다. 발전기도.',
      '강민준은 마이크 앞에 앉았다. 한 번 심호흡.',
      '"여기는 서울 KBS. 생존자분들, 들려드릴 말씀이 있습니다."',
    ],
  },

  char_firefighter: {
    id: 'char_firefighter', category: 'character', characterId: 'firefighter',
    title: '박영철: 귀향',           subtitle: '은평 가족 재회',
    gradient: 'linear-gradient(160deg,#1a0800 0%,#251000 60%,#140600 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && gs.time.day >= 180
          && gs.location.districtsVisited.includes('eunpyeong')
          && (gs.flags.structuresBuilt ?? 0) >= 3;
    },
    narrative: [
      '불광동. 이름만 생각해도 가슴이 조여왔다.',
      '반년이 지나서야 도달했다. 아파트 3층, 빨간 현관문.',
      '노크를 했다. 아무 소리가 없었다. 다시 두드렸다.',
      '문 안에서 발소리가 들렸다. 멈추는 소리.',
      '"영철이야?" 아내의 목소리였다.',
    ],
  },

  char_homeless: {
    id: 'char_homeless', category: 'character', characterId: 'homeless',
    title: '최형식: 새 집',          subtitle: '롯데타워 생존자 거점',
    gradient: 'linear-gradient(160deg,#0a1000 0%,#121800 60%,#080c00 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && gs.time.day >= 90
          && gs.location.districtsVisited.includes('songpa')
          && (gs.flags.totalItemsFound ?? 0) >= 50;
    },
    narrative: [
      '롯데타워가 가까워졌다. 위에서 불이 켜져 있었다.',
      '동호대교 아래에서 2년을 살았다. 아무것도 없이.',
      '건물 입구에서 소리가 났다. 사람들. 살아있는 사람들.',
      '"올라오세요. 자리 있어요." 누군가 말했다.',
      '최형식은 처음으로 웃었다. 집이 생겼다.',
    ],
  },

  char_pharmacist: {
    id: 'char_pharmacist', category: 'character', characterId: 'pharmacist',
    title: '한소희: 합성 완료',      subtitle: '항바이러스 합성 성공',
    gradient: 'linear-gradient(160deg,#001a14 0%,#002a1e 60%,#001010 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'pharmacist'
          && gs.time.day >= 180
          && (gs.flags.totalMedicalCrafted ?? 0) >= 5;
    },
    narrative: [
      '5종의 재료. 정확한 온도, 정확한 비율.',
      '한소희의 손은 떨리지 않았다. 이미 수십 번 연습했으니까.',
      '시험지가 파랗게 변했다. 양성.',
      '항바이러스 합성체. 임시 처방이지만, 처방이었다.',
      '작은 약국에서 시작해서. 여기까지.',
    ],
  },

  char_engineer: {
    id: 'char_engineer', category: 'character', characterId: 'engineer',
    title: '정대한: 탈출 기계',      subtitle: '이동수단 제작 · 서울 탈출',
    gradient: 'linear-gradient(160deg,#0a0a00 0%,#141400 60%,#080800 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'engineer'
          && gs.time.day >= 150
          && (gs.flags.totalCrafted ?? 0) >= 15
          && gs.location.districtsVisited.includes('seongdong');
    },
    narrative: [
      '도면이 완성됐다. 고철과 로프로 만든 간이 이동수단.',
      '공학적으로는 조잡했다. 정대한은 그것을 알고 있었다.',
      '하지만 달렸다. 서울의 도로를 따라, 달렸다.',
      '한강 다리를 건넜다. 이후 도로는 막혀 있었다.',
      '경사면을 오르며, 처음으로 서울 외곽을 봤다.',
    ],
  },
};

export default ENDINGS;
