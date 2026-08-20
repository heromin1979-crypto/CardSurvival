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
      '방벽이 세워지고, 물이 정화되고, 불이 꺼지지 않는 공간.',
      '완벽하지 않았다. 부족한 것도 많았다. 하지만 여기는 안전했다.',
      '이 도시에서 살아남을 수 있을까 생각했던 첫날이 떠올랐다.',
      '대답은 이미 나와 있었다.',
    ],
  },

  milestone_survived_year: {
    id: 'milestone_survived_year', category: 'milestone',
    title: '1년을 살아내다',       subtitle: 'Day 365 달성',
    gradient: 'linear-gradient(160deg,#0a0a20 0%,#10102a 60%,#080818 100%)',
    condition: (gs) => gs.time.day >= 365,
    narrative: [
      '사계절이 한 바퀴 돌았다. 서울이 무너진 그 날부터 365일.',
      '폭염과 혹한을 모두 넘겼다.',
      '혼자가 아니었다면 더 좋았을까. 아니면 혼자였기에 살아남은 것일까.',
      '내년도 살 것이다. 그것만큼은 확신할 수 있었다.',
    ],
  },

  milestone_scavenger: {
    id: 'milestone_scavenger', category: 'milestone',
    title: '약탈의 귀재',          subtitle: '아이템 200개 수집',
    gradient: 'linear-gradient(160deg,#1a1000 0%,#251800 60%,#180e00 100%)',
    condition: (gs) => gs.time.day >= 180 && (gs.flags.totalItemsFound ?? 0) >= 200,
    narrative: [
      '2백 개. 폐허에서 찾아낸 물건들의 수.',
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
      '자랑스러운 일인지는 모른다. 여기까지 데려온 것은 사실이다.',
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

  // 강민준 전용. 원래 부제가 'KBS 방송 성공'이고 조건도 여의도였던 만큼 처음부터
  // 군인의 이야기였다. id는 시네마틱(cin_escape)·갤러리 힌트가 참조하므로 유지한다.
  escape_helicopter: {
    id: 'escape_helicopter', category: 'escape', characterId: 'soldier',
    title: '마지막 헬기',           subtitle: 'KBS 방송 · 63빌딩 유도 착륙',
    gradient: 'linear-gradient(160deg,#111504 0%,#1c2407 60%,#0b0d03 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'soldier'
          && (gs.flags.mainQuestComplete_soldier ?? false)
          && gs.flags.soldier_ending === 'b2_helicopter'
          && gs.time.day >= 100;
    },
    narrative: [
      'KBS에서 같은 문장을 사흘 내리 송출했다. 좌표와 함께.',
      '63빌딩 옥상. 네 모서리에 유도등을 세웠다. 배터리 넷이 전부였다.',
      '사흘째 새벽, 강 건너에서 프로펠러 소리가 들렸다.',
      '어둠 속에서 사각형이 떠올랐다. 기체가 그 안으로 내려앉는다.',
      '"강민준 하사님? 방송 들었습니다." 마이크를 마지막으로 껐다.',
    ],
  },

  // 이륙 액션으로만 발동한다. condition을 두지 않아 EndingSystem의 일일 검사에서
  // 제외된다(typeof condition !== 'function'이면 건너뛴다). 직업 전용 헬기 엔딩
  // 조건을 통과하지 못한 플레이어가 기체를 띄웠을 때의 귀결.
  escape_helicopter_pilot: {
    id: 'escape_helicopter_pilot', category: 'escape',
    title: '직접 띄우다',            subtitle: '자력 조립 헬기 탈출',
    gradient: 'linear-gradient(160deg,#00131f 0%,#062033 60%,#000a12 100%)',
    narrative: [
      '연료를 붓고 열쇠를 꽂았다. 계기판에 불이 들어온다.',
      '스타터. 엔진이 기침하듯 돌더니 리듬을 잡는다.',
      '로터가 그림자를 그리며 빨라진다. 기체가 떨린다.',
      '콜렉티브를 당겼다. 옥상이 아래로 내려간다.',
      '누가 가르쳐준 것도 아니었다. 그저 살고 싶었을 뿐이다.',
    ],
  },

  // 아래 셋은 탈것 카드의 출발 액션으로만 발동한다(EscapeVehicleSystem).
  // condition을 두지 않아 EndingSystem의 일일 검사에서 제외된다 —
  // 준비물을 갖췄다는 이유만으로 게임이 멋대로 끝나면 안 된다.

  escape_river_boat: {
    id: 'escape_river_boat', category: 'escape',
    title: '뱃길',                  subtitle: '한강 보트 · 자력 도하',
    gradient: 'linear-gradient(160deg,#001624 0%,#012032 60%,#000c16 100%)',
    narrative: [
      '선착장 밧줄을 풀었다. 연료통 두 개가 바닥에서 굴렀다.',
      '시동은 세 번째에 걸렸다. 물이 갈라지기 시작한다.',
      '뒤를 돌아보지 않기로 했는데, 결국 돌아봤다.',
      '강폭이 이렇게 넓은 줄 몰랐다.',
    ],
  },

  escape_light_aircraft: {
    id: 'escape_light_aircraft', category: 'escape',
    title: '활주로 끝에서',          subtitle: '김포공항 격납고 · 경비행기 복원',
    gradient: 'linear-gradient(160deg,#0a1420 0%,#122438 60%,#050b12 100%)',
    narrative: [
      '잭에 올라간 채로 몇 달을 버틴 기체였다. 부품을 맞춰 넣자 자세가 잡혔다.',
      '합금 패널을 덧대고 볼트를 조였다. 손끝이 기억하는 각도가 있었다.',
      '항공 가솔린 두 드럼. 탱크가 차오르는 소리가 격납고를 울렸다.',
      '활주로에는 아무것도 없었다. 관제도, 허가도, 말릴 사람도.',
      '스로틀을 밀었다. 아스팔트의 이음매가 빠르게 지나간다.',
      '기수가 들렸다. 서울이 창밖에서 기울어지며 작아졌다.',
    ],
  },

  escape_rescue_signal: {
    id: 'escape_rescue_signal', category: 'escape',
    title: '응답',                  subtitle: '무선 송신기 · 구조 신호',
    gradient: 'linear-gradient(160deg,#141405 0%,#24240a 60%,#0c0c03 100%)',
    narrative: [
      '배터리 두 개를 물리고 주파수를 맞췄다. 좌표를 반복해서 실어 보냈다.',
      '며칠을 잡음만 들었다. 대답이 없는 쪽으로 계속 말하는 일이었다.',
      '그러다 잡음 사이로 사람 목소리가 섞였다. 좌표를 그대로 되읽어 주었다.',
      '"거기 그대로 계세요."',
      '누군가 나를 찾으러 오고 있었다. 그 문장 하나가 오래 걸렸다.',
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
    // char_*는 메인 퀘스트를 밟지 않고 도달한 결말이다. 성취가 아니라
    // 우연의 톤으로 정규 엔딩과 갈라야 한다 (docs/story/VOICE_GUIDE.md).
    title: '이지수: 우연한 처방',   subtitle: '혼자 도달한 감염 해독',
    gradient: 'linear-gradient(160deg,#000606 0%,#000a0a 60%,#000404 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && !(gs.flags.mainQuestComplete_doctor ?? false)
          && !gs.quests.completed.includes('mq_doctor_01')
          && gs.time.day >= 180
          && (gs.flags.seodaemunVisited ?? false)
          && (gs.flags.infectionCured ?? false);
    },
    narrative: [
      '계획은 없었다. 눈앞의 환자를 처치하다 보니 반년이 지났다.',
      '서대문의 빈 연구동. 남이 쓰다 만 배양기가 전원이 꽂힌 채 있었다.',
      '배합은 세 번째에 맞았다. 왜 맞았는지는 아직 모른다.',
      '수첩에 날짜도 없이 한 줄을 적었다. "일단 듣는다."',
    ],
  },

  char_soldier: {
    id: 'char_soldier', category: 'character', characterId: 'soldier',
    title: '강민준: 방송의 시작',   subtitle: 'KBS 방송 재개',
    gradient: 'linear-gradient(160deg,#040501 0%,#070901 60%,#030300 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'soldier'
          && !(gs.flags.mainQuestComplete_soldier ?? false)
          && !gs.quests.completed.includes('mq_soldier_01')
          && gs.time.day >= 120
          && (gs.flags.yeongdeungpoVisited ?? false)
          && (gs.flags.totalKills ?? 0) >= 30;
    },
    narrative: [
      '여의도 KBS. 잡음뿐이던 무전기가 말했던 곳.',
      '서른을 뚫고 들어갔다. 건물 안은 조용했다.',
      '방송 장비도 발전기도 살아 있었다. 아무도 손대지 않아서.',
      '"여기는 서울 KBS." 명령도 임무도 없이, 그냥 눌렀다.',
    ],
  },

  char_firefighter: {
    id: 'char_firefighter', category: 'character', characterId: 'firefighter',
    title: '박영철: 귀향',           subtitle: '은평 가족 재회',
    gradient: 'linear-gradient(160deg,#0f0201 0%,#190302 60%,#0a0101 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && !(gs.flags.mainQuestComplete_firefighter ?? false)
          && !gs.quests.completed.includes('mq_fire_01')
          && gs.time.day >= 180
          && gs.location.districtsVisited.includes('eunpyeong')
          && (gs.flags.structuresBuilt ?? 0) >= 3;
    },
    narrative: [
      '불광동. 이름만 생각해도 가슴이 조여왔다.',
      '반년이 지나서야 도달했다. 아파트 3층, 빨간 현관문.',
      '노크를 했다. 아무 소리가 없었다. 다시 두드렸다.',
      '"영철이야?" 문 안에서 아내의 목소리가 났다.',
    ],
  },

  char_homeless: {
    id: 'char_homeless', category: 'character', characterId: 'homeless',
    title: '최형식: 새 집',          subtitle: '한강 이남 생존자 거점',
    gradient: 'linear-gradient(160deg,#010603 0%,#020a04 60%,#010402 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && !(gs.flags.mainQuestComplete_homeless ?? false)
          && !gs.quests.completed.includes('mq_homeless_01')
          && gs.time.day >= 90
          && (gs.location.districtsVisited.includes('songpa')
              || gs.location.districtsVisited.includes('gangnam'))
          && (gs.flags.totalItemsFound ?? 0) >= 50;
    },
    narrative: [
      '강을 건넜다. 강 이남 어딘가에 불이 켜진 건물이 있었다.',
      '들어갈 명분은 없었다. 다만 다리 아래보다 따뜻해 보였을 뿐이다.',
      '"올라오세요. 자리 있어요." 누군가 말했다.',
      '장부에 적을 것도 없이, 자리가 하나 생겼다.',
    ],
  },

  char_chef: {
    id: 'char_chef', category: 'character', characterId: 'chef',
    title: '윤재혁: 희망의 한 끼',      subtitle: '급식소 운영 성공',
    gradient: 'linear-gradient(160deg,#070400 0%,#0b0700 60%,#040300 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'chef'
          && !(gs.flags.mainQuestComplete_chef ?? false)
          && !gs.quests.completed.includes('mq_chef_01')
          && gs.time.day >= 150
          && (gs.flags.totalFoodCrafted ?? 0) >= 20;
    },
    narrative: [
      '남대문시장 골목. 주운 냄비를 벽돌 두 장 위에 올렸다.',
      '메뉴랄 것이 없었다. 있는 것을 넣고 간만 맞췄다.',
      '줄이 길어졌다. 세어보니 마흔 몇 명이었다.',
      '"한 그릇 더 있어요." 그 말을 하려고 계속 저었다.',
    ],
  },

  char_engineer: {
    id: 'char_engineer', category: 'character', characterId: 'engineer',
    title: '정대한: 탈출 기계',      subtitle: '이동수단 제작 · 서울 탈출',
    gradient: 'linear-gradient(160deg,#01050c 0%,#020815 60%,#010308 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'engineer'
          && !(gs.flags.mainQuestComplete_engineer ?? false)
          && !gs.quests.completed.includes('mq_eng_01')
          && gs.time.day >= 150
          && (gs.flags.totalCrafted ?? 0) >= 15
          && gs.location.districtsVisited.includes('seongdong');
    },
    narrative: [
      '도면이랄 것이 없었다. 고철과 로프로 붙인 물건에 도면은 사치였다.',
      '용접 자리 열두 군데. 그중 다섯은 두 번 붙였다.',
      '그래도 굴러갔다. 시속 삼십. 그 이상은 무리였다.',
      '아버지에게 보여줄 물건은 아니었다. 나가기엔 충분했다.',
    ],
  },

  // ── 메인 퀘스트 엔딩 (6) ───────────────────────────────────────

  // 이지수의 분기는 넷(a1_vaccine / a3_data / b1_military_hub / c_vaccine)인데
  // mq_doctor 하나가 전부를 받았다. 백신을 완성한 결말과 군 의료본부를 세운
  // 결말이 같은 문장을 읽었다. 서술문은 docs/story/STORY_doctor.md의 해당
  // 절에서 가져오고, docs/story/VOICE_GUIDE.md의 규칙을 따른다.

  mq_doctor_vaccine: {
    id: 'mq_doctor_vaccine', category: 'character', characterId: 'doctor',
    title: '이지수: 치료의 빛',       subtitle: '한소희와 함께 · 백신 프로토타입 32세트',
    gradient: 'linear-gradient(160deg,#03181a 0%,#05272b 60%,#020f10 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && (gs.flags.mainQuestComplete_doctor ?? false)
          && gs.flags.doctor_ending === 'a1_vaccine'
          && gs.time.day >= 100;
    },
    narrative: [
      '48시간을 이어 붙였다. 잠을 약으로 대신하고, 비커를 채우고 비웠다.',
      '한소희가 마지막 병의 마개를 닫았다. "됐어요. 진짜 됐어요."',
      '첫 번째 감염자에게 투여했다. 열이 내렸다.',
      '이지수는 메모지에 적었다. "치료법 확인."',
      '유리병 서른두 개가 선반에서 빛을 머금었다.',
      '누구의 것도 아니었다. 두 사람의 손이 함께 만든 것이었다.',
    ],
  },

  mq_doctor_data: {
    id: 'mq_doctor_data', category: 'character', characterId: 'doctor',
    title: '이지수: 다음 사람에게',    subtitle: '백신 미완 · 연구 노트 세 권 배포',
    gradient: 'linear-gradient(160deg,#030f10 0%,#04191b 60%,#020a0a 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && (gs.flags.mainQuestComplete_doctor ?? false)
          && gs.flags.doctor_ending === 'a3_data'
          && gs.time.day >= 100;
    },
    narrative: [
      '끝내 닫히지 않았다. 백신은 그녀들의 손에서 완성되지 않았다.',
      '대신 노트 세 권이 남았다. 감염 패턴, 실패한 배합, 다음에 볼 곳.',
      '한소희가 말했다. "이게 더 중요한 것일 수도 있어요."',
      '이지수는 마지막 장에 적었다. "여기까지 확인함."',
      '한 사람이 끝내지 못한 일을, 여럿이 이어 끝내는 쪽으로 두 사람은 걸었다.',
    ],
  },

  mq_doctor_military: {
    id: 'mq_doctor_military', category: 'character', characterId: 'doctor',
    title: '이지수: 멈추지 않는 것',   subtitle: '용산 군 의료본부 · 하루 15명',
    gradient: 'linear-gradient(160deg,#011416 0%,#022124 60%,#010c0e 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && (gs.flags.mainQuestComplete_doctor ?? false)
          && gs.flags.doctor_ending === 'b1_military_hub'
          && gs.time.day >= 100;
    },
    narrative: [
      '병상 회전율, 보급선, 외곽 감염 압력. 세 지표가 맞아떨어졌다.',
      '야전병원과 수술대와 약품 보관장이 한 건물 안에 섰다.',
      '하루 열다섯 명이 들어와 열다섯 명이 걸어 나간다.',
      '백신은 없었다. 역병의 원인은 여전히 도시 어딘가에 있다.',
      '끝낸 것은 없다. 대신 멈추지 않는 것을 하나 세웠다.',
    ],
  },

  mq_doctor_plague_end: {
    id: 'mq_doctor_plague_end', category: 'character', characterId: 'doctor',
    title: '이지수: 역병의 종결',      subtitle: '보라매 단독 연구 · 0번 환자 역설계',
    gradient: 'linear-gradient(160deg,#000c0d 0%,#011416 60%,#000709 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && (gs.flags.mainQuestComplete_doctor ?? false)
          && gs.flags.doctor_ending === 'c_vaccine'
          && gs.time.day >= 55;
    },
    narrative: [
      '두 사람의 무전에 답하지 않았다. 그날로 협력자도 보급도 경계도 없어졌다.',
      '남은 것은 임상 지식과 두 손이었다.',
      '소굴로 혼자 들어가 0번 환자의 심장 조직을 채취했다. 손이 떨렸다.',
      '현미경 너머로 항원 구조가 드러났다. 인간이 만든 것이 아니었다.',
      '광범위 항생제와 농축 혈청, 감염 혈액 표본. 마지막 단계였다.',
      '자기 팔에 주사했다. 손끝의 떨림이 멎었다.',
      '아무도 이 이름을 모를 것이다. 그래도 원인을 끊은 것은 이 손이었다.',
    ],
  },

  // 분기 플래그 없이 메인 퀘스트만 완료한 예외 경로 (구버전 세이브 포함).
  mq_doctor: {
    id: 'mq_doctor', category: 'character', characterId: 'doctor',
    title: '이지수: 기록은 남는다',   subtitle: '치료 프로토콜 송출 성공',
    gradient: 'linear-gradient(160deg,#010808 0%,#010e0e 60%,#000505 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'doctor'
          && (gs.flags.mainQuestComplete_doctor ?? false)
          && !gs.flags.doctor_ending
          && gs.time.day >= 100;
    },
    narrative: [
      '무전에서 첫 번째 응답이 들렸다. "프로토콜을 받았습니다. 효과가 있습니다."',
      '이지수는 메모지 맨 아래에 한 줄을 더했다. "확인함."',
      '그녀의 기록은 이제 서울 밖으로 퍼져나가고 있었다.',
    ],
  },

  // 강민준의 분기는 넷(a1/b1/b2/b3)인데 엔딩은 둘뿐이었다. mq_soldier가
  // soldier_ending !== 'b2_helicopter'로 나머지 셋을 통째로 받아, 수원까지
  // 걸어간 플레이어와 전국 통신망을 세운 플레이어가 같은 화면을 봤다.
  // 분기마다 엔딩을 붙이고 mq_soldier는 플래그 없는 예외 경로만 맡는다.

  mq_soldier_rescue: {
    id: 'mq_soldier_rescue', category: 'character', characterId: 'soldier',
    title: '강민준: 서울 구조망',     subtitle: '전역 구조 신호 완성',
    gradient: 'linear-gradient(160deg,#0b0d03 0%,#131606 60%,#070902 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'soldier'
          && (gs.flags.mainQuestComplete_soldier ?? false)
          && gs.flags.soldier_ending === 'a1_rescue'
          && gs.time.day >= 100;
    },
    narrative: [
      '서울 전역에 구조 신호가 깔렸다. 스물다섯 개 구, 스물다섯 개 좌표.',
      '무전기를 켜면 어디서든 누군가 응답한다.',
      '박영철이 손을 내밀었다. "우리가 해냈어요."',
      '"같이 해냈습니다." 강민준은 그 손을 잡았다.',
      '박상현, 들었냐. 이번엔 아무도 두고 오지 않았다.',
    ],
  },

  mq_soldier_network: {
    id: 'mq_soldier_network', category: 'character', characterId: 'soldier',
    title: '강민준: 전국 통신망',     subtitle: '서울-수원-인천-부산 연결',
    gradient: 'linear-gradient(160deg,#080b01 0%,#0d1202 60%,#050701 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'soldier'
          && (gs.flags.mainQuestComplete_soldier ?? false)
          && gs.flags.soldier_ending === 'b1_network'
          && gs.time.day >= 100;
    },
    narrative: [
      '마지막 증폭기를 물렸다. 계기 바늘이 끝까지 올라간다.',
      '"여기는 KBS 서울. 전국 생존자 여러분, 응답해주십시오."',
      '수원. 인천. 부산. 응답이 쏟아졌다.',
      '강민준은 마이크를 놓지 않았다. 밤새 좌표를 받아 적었다.',
      '박상현, 임무 완수다. 이번엔 신호를 놓치지 않았다.',
    ],
  },

  mq_soldier_suwon: {
    id: 'mq_soldier_suwon', category: 'character', characterId: 'soldier',
    title: '강민준: 남쪽으로',        subtitle: '마지막 방송 후 수원 이동',
    gradient: 'linear-gradient(160deg,#0e1203 0%,#171e05 60%,#090b02 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'soldier'
          && (gs.flags.mainQuestComplete_soldier ?? false)
          && gs.flags.soldier_ending === 'b3_suwon'
          && gs.time.day >= 100;
    },
    narrative: [
      '마지막 송출. "여기는 서울 KBS. 이것이 마지막 방송입니다."',
      '스튜디오 불을 끄고 남쪽으로 걸었다. 혼자 걸을 생각이었다.',
      '수원 외곽에서 뒤를 돌아봤을 때, 발소리가 하나가 아니었다.',
      '방송을 듣고 길에서 합류한 사람들이었다. 전투 식량을 나눴다.',
      '박상현, 나는 혼자가 아니야.',
    ],
  },

  // 분기 플래그 없이 메인 퀘스트만 완료한 예외 경로 (구버전 세이브 포함).
  mq_soldier: {
    id: 'mq_soldier', category: 'character', characterId: 'soldier',
    title: '강민준: 서울 집결 좌표',   subtitle: 'KBS 방송 수신 확인',
    gradient: 'linear-gradient(160deg,#060801 0%,#0a0d02 60%,#040501 100%)',
    condition: (gs) => {
      const branch = gs.flags.soldier_ending;
      return gs.player.characterId === 'soldier'
          && (gs.flags.mainQuestComplete_soldier ?? false)
          && !branch
          && gs.time.day >= 100;
    },
    narrative: [
      '경기도 수원에서 응답이 들어왔다. "KBS 수신했습니다. 이동 중입니다."',
      '강민준은 마이크를 다시 잡고 집결 좌표를 읽었다.',
      '박상현, 신호는 갔다.',
    ],
  },

  mq_firefighter: {
    id: 'mq_firefighter', category: 'character', characterId: 'firefighter',
    title: '박영철: 은평의 수호자',   subtitle: '가족과 함께 100일 생존',
    gradient: 'linear-gradient(160deg,#140303 0%,#210504 60%,#0d0202 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && (gs.flags.mainQuestComplete_firefighter ?? false)
          && gs.flags.fire_ending === 'a1_shelter'
          && gs.time.day >= 100;
    },
    narrative: [
      '방벽 위에서 은평구를 내려다봤다. 조용했다.',
      '아내가 아침을 차리는 소리, 아이들이 뛰는 소리가 등 뒤에 있었다.',
      '박영철은 소방관이 아니라 아버지로 서 있었다.',
    ],
  },

  mq_firefighter_b3: {
    id: 'mq_firefighter_b3', category: 'character', characterId: 'firefighter',
    title: '박영철: 떠나는 사람',     subtitle: '대피소를 남기고 서울 밖으로',
    gradient: 'linear-gradient(160deg,#200706 0%,#360c0b 60%,#140504 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && (gs.flags.mainQuestComplete_firefighter ?? false)
          && gs.flags.fire_ending === 'b3_escape'
          && gs.time.day >= 100;
    },
    narrative: [
      '성수동 공장은 수십 명의 대피소가 됐다.',
      '영철은 그곳을 생존자들에게 맡기고 정대한과 길을 나섰다.',
      '한 번도 가보지 못한 은평이 등 뒤로 멀어졌다.',
      '많은 사람을 살렸다. 대신 가족의 생사는 끝내 모른 채로 남았다.',
      '"길이 안전해지면, 그때 불광동으로 갑니다." 북쪽을 한 번 더 봤다.',
    ],
  },

  mq_firefighter_a3: {
    id: 'mq_firefighter_a3', category: 'character', characterId: 'firefighter',
    title: '박영철: 이재훈의 이름으로',  subtitle: '추모로 세운 은평 대피소',
    gradient: 'linear-gradient(160deg,#1b0502 0%,#2e0803 60%,#110301 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'firefighter'
          && (gs.flags.mainQuestComplete_firefighter ?? false)
          && gs.flags.fire_ending === 'a3_memorial'
          && gs.time.day >= 100;
    },
    narrative: [
      '대피소 입구에 작은 돌 하나가 섰다.',
      '"이재훈 (1985–2026). 끝까지 동료였다."',
      '영철은 그가 남긴 로프로 아파트 동들을 이었다.',
      '가족은 살렸다. 함께 불 속에 뛰어든 동료는 그러지 못했다.',
      '그 차이를 매일 지난다. 대피소의 모든 길이 그를 지나간다.',
    ],
  },

  // 최형식의 분기는 셋(a3_journey / b1_kingdom / b3_network)인데 mq_homeless
  // 하나가 전부를 받았다. 서술문은 docs/story/STORY_homeless.md의 각 결말 절에서
  // 가져오고, docs/story/VOICE_GUIDE.md의 회계 어휘 규칙을 따른다.

  mq_homeless_journey: {
    id: 'mq_homeless_journey', category: 'character', characterId: 'homeless',
    title: '최형식: 길동무',          subtitle: '이지수와 함께 강남을 떠나다',
    gradient: 'linear-gradient(160deg,#040f08 0%,#071a0d 60%,#030a05 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && (gs.flags.mainQuestComplete_homeless ?? false)
          && gs.flags.homeless_ending === 'a3_journey'
          && gs.time.day >= 100;
    },
    narrative: [
      '통조림을 배낭 바닥에 깔고 위에 약품을 얹었다. 무거운 것이 아래로.',
      '뒤에는 둘이 세운 마을이 남았고, 앞은 목록에 없는 길이었다.',
      '다리 아래에서 2년. 혼자 정수하고, 혼자 불을 피우고, 혼자 잠들었다.',
      '그것이 거리 생존의 기본값이었다.',
      '규모를 좇다 사람을 잃었던 사람이, 사람을 택했더니 길동무가 남았다.',
    ],
  },

  mq_homeless_kingdom: {
    id: 'mq_homeless_kingdom', category: 'character', characterId: 'homeless',
    title: '최형식: 두 번째 제국',    subtitle: '롯데타워 자치 커뮤니티 · 거주 55명',
    gradient: 'linear-gradient(160deg,#04140a 0%,#072111 60%,#030d06 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && (gs.flags.mainQuestComplete_homeless ?? false)
          && gs.flags.homeless_ending === 'b1_kingdom'
          && gs.time.day >= 100;
    },
    narrative: [
      '장부를 다시 폈다. 거주 55명, 공급망 5개 구역, 부채 0.',
      '첫 번째 회사를 무너뜨린 것은 종이 한 장이었다.',
      '그를 무너뜨릴 종이는 이제 이 세상에 없다.',
      '쇠지렛대와 로프 사다리로 타워를 요새로 바꿨다.',
      '사업 미팅을 다니며 올려다보던 건물의 창 앞에 섰다.',
      '한 번 다 잃어본 자만 같은 실수를 두 번 하지 않는다.',
    ],
  },

  mq_homeless_broker: {
    id: 'mq_homeless_broker', category: 'character', characterId: 'homeless',
    title: '최형식: 서울 중개자',     subtitle: '광화문 거점 · 구역 간 물자 중개',
    gradient: 'linear-gradient(160deg,#020c06 0%,#031309 60%,#010704 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && (gs.flags.mainQuestComplete_homeless ?? false)
          && gs.flags.homeless_ending === 'b3_network'
          && gs.time.day >= 100;
    },
    narrative: [
      '타워에 남지 않기로 했다. 한곳에 전부를 걸면 그곳이 무너질 때 전부를 잃는다.',
      '첫 번째 회사가 정확히 그렇게 무너졌다.',
      '광화문 광장. 나침반과 쌍안경, 그리고 어깨에 멘 교환 목록.',
      '광진 낚시꾼, 강남 의사, 서대문 소방관. 누가 무엇을 갖고 무엇이 없는지.',
      '그 목록이 자산이었다. 창고도 담보도 필요 없는 자산.',
      '가장 높은 자리도 가장 안전한 자리도 아닌, 가장 많이 연결된 자리를 샀다.',
    ],
  },

  // 분기 플래그 없이 메인 퀘스트만 완료한 예외 경로 (구버전 세이브 포함).
  mq_homeless: {
    id: 'mq_homeless', category: 'character', characterId: 'homeless',
    title: '최형식: 집이 생겼다',     subtitle: '롯데타워 거점 확보',
    gradient: 'linear-gradient(160deg,#020804 0%,#030e06 60%,#010502 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'homeless'
          && (gs.flags.mainQuestComplete_homeless ?? false)
          && !gs.flags.homeless_ending
          && gs.time.day >= 100;
    },
    narrative: [
      '창밖으로 서울이 보였다. 다리 아래에서 올려다보던 그 도시.',
      '최형식은 커피를 한 모금 마셨다. 인스턴트지만, 따뜻했다.',
      '아무것도 없던 사람이 집을 얻었다. 세상이 끝난 덕분에.',
    ],
  },

  // ── 윤재혁 (chef) 3개 엔딩: Expansion / Settle / Ascension ──

  mq_chef_network: {
    id: 'mq_chef_network', category: 'character', characterId: 'chef',
    title: '윤재혁: 한강 이남 식량 네트워크',  subtitle: '강남 대형마트 보급망 완성',
    gradient: 'linear-gradient(160deg,#110c03 0%,#1d1405 60%,#0b0802 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'chef'
          && (gs.flags.mainQuestComplete_chef ?? false)
          && gs.flags.chef_ending === 'a1_network'
          && gs.time.day >= 100;
    },
    narrative: [
      '남대문에서 시작한 급식소가 강남·잠실·반포로 뻗어나갔다.',
      '매일 순회 보급 트럭이 4개 마트를 돈다. 하루 87명분.',
      '한 끼 열량 620킬로칼로리. 그 선을 넘기려고 넉 달을 고쳤다.',
      '윤재혁은 지도 위에 붉은 선으로 보급 루트를 그렸다.',
      '"한 사람의 주방이 도시의 식탁이 됐다."',
      '직접 기르지는 못했다. 흩어진 식량을 모아 흐르게 했을 뿐이다.',
      '그래도 오늘 저녁, 여든일곱 명이 굶지 않는다.',
    ],
  },

  mq_chef_farm: {
    id: 'mq_chef_farm', category: 'character', characterId: 'chef',
    title: '윤재혁: 가락 자급 급식소',    subtitle: '옥상 농장 + 남대문 정착',
    gradient: 'linear-gradient(160deg,#0d0901 0%,#151001 60%,#080600 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'chef'
          && (gs.flags.mainQuestComplete_chef ?? false)
          && gs.flags.chef_ending === 'a2_farm'
          && gs.time.day >= 100;
    },
    narrative: [
      '가락시장 옥상. 허브와 잎채소가 바람에 흔들린다.',
      '폐허가 된 도시에서 처음으로, 음식을 직접 길렀다.',
      '파종에서 수확까지 마흔이레. 세 번째 이랑에서야 맞았다.',
      '남대문 급식소는 이제 외부 보급에 의지하지 않는다.',
      '윤재혁은 흙 묻은 손을 앞치마에 닦았다.',
      '주방장의 손이 아니라 농부의 손이 됐다.',
      '"정착이란 이런 것이다. 심고, 기다리고, 수확하는 일."',
    ],
  },

  mq_chef_ascension: {
    id: 'mq_chef_ascension', category: 'character', characterId: 'chef',
    title: '윤재혁: 용산 미식 복원',       subtitle: '종말 이후 다시 태어난 요리',
    gradient: 'linear-gradient(160deg,#0a0601 0%,#100b02 60%,#060401 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'chef'
          && (gs.flags.mainQuestComplete_chef ?? false)
          && gs.flags.chef_ending === 'b1_ascension'
          && gs.time.day >= 100;
    },
    narrative: [
      '용산의 작은 식당. 저녁마다 풀코스가 나간다.',
      '수프는 65도, 메인은 접시째 데워 62도. 온도부터 맞춘다.',
      '소피텔 동료 박민호가 옆에서 플레이팅을 맞춘다.',
      '하루 열두 석. 예약도 값도 없이, 순서만 있다.',
      '"요리가 사치가 아니라 존엄이라는 걸, 여기서 증명했다."',
      '윤재혁은 마지막 접시에 허브 소금을 뿌렸다.',
      '칼끝에서 시작해 칼끝에서 끝나는 하루가 돌아왔다.',
    ],
  },

  mq_engineer_heli: {
    id: 'mq_engineer_heli', category: 'character', characterId: 'engineer',
    title: '정대한: 하늘로',          subtitle: '아버지의 설계도 · 헬기 탈출',
    gradient: 'linear-gradient(160deg,#061028 0%,#0a1b43 60%,#040a19 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'engineer'
          && (gs.flags.mainQuestComplete_engineer ?? false)
          && gs.flags.engineer_ending === 'b3_heli_escape'
          && gs.time.day >= 100;
    },
    narrative: [
      '이륙. 로터가 굉음을 낸다. 동체가 흔들리며 상승.',
      '회전수 390. 진동은 허용치 안. 계기가 전부 초록이다.',
      '10미터. 30미터. 100미터. 서울이 발 밑에 펼쳐진다.',
      '스물다섯 개 구가 한 화면에 들어왔다. 삼백이십오 일 만이다.',
      '아버지가 평생 보지 못했던 각도. 서랍 속 설계도가 하늘을 난다.',
      '박영철이 지상에서 손을 흔든다. 점점 작아진다.',
      '한강을 넘었다. 남쪽으로. 아버지, 이제 하늘로 갑니다.',
    ],
  },

  // ── 정대한 (engineer) 나머지 3개 엔딩 (b3 헬기는 위 mq_engineer_heli) ──

  mq_engineer_escape: {
    id: 'mq_engineer_escape', category: 'character', characterId: 'engineer',
    title: '정대한: 탈출 차량',       subtitle: '아버지 설계도로 서울 탈출',
    gradient: 'linear-gradient(160deg,#03091a 0%,#05102b 60%,#020610 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'engineer'
          && (gs.flags.mainQuestComplete_engineer ?? false)
          && gs.flags.engineer_ending === 'a1_escape'
          && gs.time.day >= 100;
    },
    narrative: [
      '구로 국도. 시동이 걸렸다. 전기 모터가 부드럽게 돈다.',
      '적재 240킬로, 항속 여든. 계산대로 나왔다.',
      '아버지의 20년 전 설계도가 실물이 되어 달리고 있다.',
      '한강 다리를 건넜다. 경사면을 오르며 속도를 줄였다.',
      '차창 밖 하늘이 달랐다. 서울 안에서는 본 적 없는 색이었다.',
      '"아버지, 설계도대로 됐어요. 이제 남쪽으로 갑니다."',
    ],
  },

  mq_engineer_base: {
    id: 'mq_engineer_base', category: 'character', characterId: 'engineer',
    title: '정대한: 구로 기술 거점',   subtitle: '차량 기술로 서울에 남다',
    gradient: 'linear-gradient(160deg,#02070e 0%,#040b17 60%,#020409 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'engineer'
          && (gs.flags.mainQuestComplete_engineer ?? false)
          && gs.flags.engineer_ending === 'a3_base'
          && gs.time.day >= 100;
    },
    narrative: [
      '구로 공장. 작업장, 정비소, 방벽이 섰다.',
      '탈출 차량은 보급 차량이 됐다. 짐칸을 뜯고 적재함을 다시 짰다.',
      '주행거리 계기가 이천을 넘겼다. 서울 안에서만.',
      '"아버지 설계도는 여기서 서울을 살리는 데 쓰입니다."',
      '정대한은 공구함을 닫았다. 떠나지 않기로 했다.',
      '나가는 기계를 만들었는데, 남는 데 썼다. 후회는 없었다.',
    ],
  },

  mq_engineer_rebuild: {
    id: 'mq_engineer_rebuild', category: 'character', characterId: 'engineer',
    title: '정대한: 도시 인프라 복구',  subtitle: '전기·수도·통신 복원',
    gradient: 'linear-gradient(160deg,#060d19 0%,#0a1629 60%,#040810 100%)',
    condition: (gs) => {
      return gs.player.characterId === 'engineer'
          && (gs.flags.mainQuestComplete_engineer ?? false)
          && gs.flags.engineer_ending === 'b1_rebuild'
          && gs.flags.power_station_cleared
          && gs.flags.water_plant_restored
          && gs.flags.comms_tower_active
          && gs.time.day >= 100;
    },
    narrative: [
      '은평구 밤. 가로등이 하나씩 켜지기 시작했다.',
      '전기, 수도, 통신. 세 가지가 돌아간다.',
      '발전 출력 320킬로와트. 급수 계통 압력 정상. 송신 반경 12킬로.',
      '박영철이 옆에서 옅게 웃었다. "대한씨, 도시가 살아나요."',
      '정대한은 안테나 아래에서 서울 지도를 펼쳤다.',
      '"아버지가 만들려 했던 것과 다르지 않았어요."',
    ],
  },

  // ── 질병 사망 엔딩 (3) ─────────────────────────────────────────

  death_disease_water: {
    id: 'death_disease_water', category: 'death',
    title: '오염된 물',            subtitle: '수인성 질병',
    gradient: 'linear-gradient(160deg,#050a08 0%,#0a1410 60%,#050a08 100%)',
    narrative: [
      '그 물을 마신 것이 실수였다.',
      '처음엔 배가 아팠다. 다음엔 멈출 수 없는 구토.',
      '수분이 빠져나갔다. 물이 없었다. 맑은 물이.',
      '서울의 어느 폐건물 구석에서, 홀로.',
      '오염된 도시가 결국 이겼다.',
    ],
  },

  death_disease_infection: {
    id: 'death_disease_infection', category: 'death',
    title: '감염의 끝',            subtitle: '패혈증 · 독감 합병증',
    gradient: 'linear-gradient(160deg,#080508 0%,#120a10 60%,#080508 100%)',
    narrative: [
      '열이 사흘째 내리지 않았다.',
      '항생제가 있었다면. 의료 시설이 있었다면.',
      '폐허의 서울엔 아무것도 없었다.',
      '몸이 스스로를 공격하는 소리가 들리는 것 같았다.',
      '마지막 생각은 이상하게도 봄날의 햇볕이었다.',
    ],
  },

  death_disease_heat: {
    id: 'death_disease_heat', category: 'death',
    title: '폭염의 도시',          subtitle: '열사병',
    gradient: 'linear-gradient(160deg,#1a0800 0%,#200a00 60%,#140600 100%)',
    narrative: [
      '서울의 여름은 살인적이었다. 문자 그대로.',
      '35도를 넘은 날씨에 그늘도, 물도 부족했다.',
      '머리가 흐려졌다. 방향을 잃었다.',
      '아스팔트 위에서 멈췄다. 일어나려 했지만 몸이 말을 듣지 않았다.',
      '태양이 지는 것을 봤다. 마지막으로.',
    ],
  },

  // ── 계절 엔딩 (3) ──────────────────────────────────────────────

  survived_summer: {
    id: 'survived_summer', category: 'milestone',
    title: '폭염을 넘어',            subtitle: '서울의 여름 생존',
    gradient: 'linear-gradient(160deg,#1a0a00 0%,#2a1400 60%,#1a0800 100%)',
    condition: (gs) => {
      return gs.time.day >= 181
          && (gs.flags.survivedSummer ?? false);
    },
    narrative: [
      '영하 20도의 겨울이 지나고, 이번엔 35도를 넘는 여름이었다.',
      '폐허가 된 도시의 여름은 산 자보다 죽은 자에게 더 친절했다.',
      '그러나 당신은 버텼다. 물을 찾고, 그늘을 찾고, 하루씩.',
      '가을바람이 불어왔다. 살아있다는 것이 실감났다.',
    ],
  },

  winter_survivor: {
    id: 'winter_survivor', category: 'milestone',
    title: '한겨울의 생존자',          subtitle: '서울의 겨울 완전 생존',
    gradient: 'linear-gradient(160deg,#000a1a 0%,#00101a 60%,#000610 100%)',
    condition: (gs) => {
      return gs.time.day >= 360
          && gs.player.isAlive;
    },
    narrative: [
      '영하의 서울. 캠프파이어 하나가 전부였다.',
      '좀비들도 추위를 피했다. 오직 당신만이 거리에 있었다.',
      '봄이 올 거라 믿었다. 믿지 않으면 버틸 수 없었기 때문에.',
      '눈이 녹기 시작했다. 겨울을 이겼다.',
    ],
  },

  four_seasons: {
    id: 'four_seasons', category: 'milestone',
    title: '사계절의 서울',            subtitle: '1년 완전 생존',
    gradient: 'linear-gradient(160deg,#0a1a0a 0%,#141a10 60%,#080e08 100%)',
    condition: (gs) => {
      return gs.time.day >= 365
          && gs.player.isAlive;
    },
    narrative: [
      '봄에는 폐허 사이로 꽃이 피었다.',
      '여름엔 모든 것이 타오를 것 같았다. 가을엔 홀로 낙엽을 밟았다.',
      '겨울엔 다 끝날 것이라 생각했다. 틀렸다.',
      '1년이 지났다. 서울은 여전히 폐허지만, 당신은 살아 있다.',
    ],
  },
};

export default ENDINGS;
