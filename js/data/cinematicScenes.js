// === CINEMATIC SCENE DEFINITIONS ===
// 주요 시나리오 분기점에서 표시되는 풀스크린 연출 장면 데이터
//
// image: 'assets/images/cinematic/*.webp' — null이면 그라디언트만 표시
// displayMs: 0 = 클릭 대기, >0 = 자동 진행 (ms)
// lines: 순서대로 fadeIn 표시 (최대 4개 권장)

const IMG = 'assets/images/cinematic/';

const CINEMATIC_SCENES = {

  // ── 사망 장면 (11개) ─────────────────────────────────────────────

  cin_death_dehydration: {
    id: 'cin_death_dehydration',
    image: `${IMG}death_dehydration.webp`,
    gradient: 'linear-gradient(160deg,#0a0808 0%,#1a1005 60%,#0d0a02 100%)',
    title: '마지막 갈증',
    subtitle: '탈수사',
    lines: [
      '입술이 갈라졌다.',
      '마지막 물 한 모금. 그게 언제였더라.',
      '서울의 잿빛 하늘 아래, 무릎이 꺾였다.',
    ],
    displayMs: 0,
  },

  cin_death_hypothermia: {
    id: 'cin_death_hypothermia',
    image: `${IMG}death_hypothermia.webp`,
    gradient: 'linear-gradient(160deg,#030b14 0%,#0a1520 60%,#050d18 100%)',
    title: '얼어붙은 도시',
    subtitle: '저체온증',
    lines: [
      '손가락 끝이 감각을 잃은 게 두 시간 전.',
      '이상하게도 따뜻한 느낌이 밀려왔다.',
      '눈이 내렸다. 파괴된 서울 위에 하얗게.',
    ],
    displayMs: 0,
  },

  cin_death_starvation: {
    id: 'cin_death_starvation',
    image: `${IMG}death_starvation.webp`,
    gradient: 'linear-gradient(160deg,#0f0a00 0%,#1a1200 60%,#0a0800 100%)',
    title: '굶주림의 끝',
    subtitle: '아사',
    lines: [
      '위장은 이미 오래 전에 포기했다.',
      '어딘가에는 반드시 있을 것이라 믿었다.',
      '그 믿음이 이 거리까지 데려왔지만.',
    ],
    displayMs: 0,
  },

  cin_death_radiation: {
    id: 'cin_death_radiation',
    image: `${IMG}death_radiation.webp`,
    gradient: 'linear-gradient(160deg,#0a0f00 0%,#141f00 60%,#0a1000 100%)',
    title: '보이지 않는 독',
    subtitle: '방사선 중독',
    lines: [
      '처음엔 두통이었다. 그다음엔 구토.',
      '눈에 보이지 않는 적.',
      '이미 돌이킬 수 없었다.',
    ],
    displayMs: 0,
  },

  cin_death_infection: {
    id: 'cin_death_infection',
    image: `${IMG}death_infection.webp`,
    gradient: 'linear-gradient(160deg,#0a0010 0%,#12001a 60%,#070010 100%)',
    title: '감염의 침묵',
    subtitle: '감염 쇼크',
    lines: [
      '상처는 작았다. 처음엔 별것 아니라 생각했다.',
      '이틀 후 열이 났다. 사흘 후 의식이 흐려졌다.',
      '눈이 감겼다. 어두워졌다.',
    ],
    displayMs: 0,
  },

  cin_death_combat: {
    id: 'cin_death_combat',
    image: `${IMG}death_combat.webp`,
    gradient: 'linear-gradient(160deg,#14000a 0%,#1f0010 60%,#0f0008 100%)',
    title: '전장의 끝',
    subtitle: '전투 사망',
    lines: [
      '마지막 전투였다.',
      '상대는 너무 많았다. 아니면 이쪽이 너무 지쳐 있었다.',
      '바닥에 쓰러지며, 서울의 잿빛 하늘을 봤다.',
    ],
    displayMs: 0,
  },

  cin_death_fall: {
    id: 'cin_death_fall',
    image: `${IMG}death_fall.webp`,
    gradient: 'linear-gradient(160deg,#0a0a10 0%,#141420 60%,#080810 100%)',
    title: '추락',
    subtitle: '구조물 붕괴',
    lines: [
      '발판이 무너졌다.',
      '손이 허공을 잡았다. 아무것도 없었다.',
      '서울의 폐허가 마지막 풍경이었다.',
    ],
    displayMs: 0,
  },

  cin_death_despair: {
    id: 'cin_death_despair',
    image: `${IMG}death_other.webp`,
    gradient: 'linear-gradient(160deg,#080808 0%,#101010 60%,#050505 100%)',
    title: '절망의 끝',
    subtitle: '의지 상실',
    lines: [
      '일어나는 것이 의미를 잃었다.',
      '서울은 너무 넓고, 너무 조용하고, 너무 오래 이렇게 있었다.',
      '도시는 계속 침묵했다.',
    ],
    displayMs: 0,
  },

  cin_death_exhaustion: {
    id: 'cin_death_exhaustion',
    image: `${IMG}death_exhaustion.webp`,
    gradient: 'linear-gradient(160deg,#0a0a12 0%,#14141a 60%,#080810 100%)',
    title: '불귀의 출발',
    subtitle: '극도 피로 붕괴',
    lines: [
      '48시간을 쉬지 않고 움직였다.',
      '벽에 기대어 앉았다. 잠깐만 쉬자고 생각했다.',
      '그 잠깐이 돌아오지 않았다.',
    ],
    displayMs: 0,
  },

  cin_death_disease: {
    id: 'cin_death_disease',
    image: `${IMG}death_disease.webp`,
    gradient: 'linear-gradient(160deg,#080508 0%,#120a10 60%,#080508 100%)',
    title: '감염의 끝',
    subtitle: '질병 사망',
    lines: [
      '열이 사흘째 내리지 않았다.',
      '폐허의 서울엔 아무것도 없었다.',
      '마지막 생각은 이상하게도 봄날의 햇볕이었다.',
    ],
    displayMs: 0,
  },

  cin_death_other: {
    id: 'cin_death_other',
    image: `${IMG}death_other.webp`,
    gradient: 'linear-gradient(160deg,#0a0a0a 0%,#141414 60%,#080808 100%)',
    title: '서울에서',
    subtitle: '생존 불가',
    lines: [
      '이 도시는 끝까지 가혹했다.',
      '그래도 여기까지 왔다.',
      '그것만큼은 사실이었다.',
    ],
    displayMs: 0,
  },

  // ── 계절 전환 장면 (5개) ─────────────────────────────────────────

  cin_season_spring: {
    id: 'cin_season_spring',
    image: `${IMG}season_spring.webp`,
    gradient: 'linear-gradient(160deg,#0a1400 0%,#142000 60%,#081200 100%)',
    title: '봄이 왔다',
    subtitle: '생존의 첫 봄',
    lines: [
      '폐허 사이로 꽃이 피었다.',
      '서울은 무너졌지만, 자연은 계속됐다.',
      '살아있다. 봄이 왔다.',
    ],
    displayMs: 0,
  },

  cin_season_summer: {
    id: 'cin_season_summer',
    image: `${IMG}season_summer.webp`,
    gradient: 'linear-gradient(160deg,#1a0800 0%,#2a1200 60%,#1a0a00 100%)',
    title: '폭염의 계절',
    subtitle: '봄이 끝났다',
    lines: [
      '서울의 여름이 시작됐다.',
      '열기가 아스팔트에서 피어올랐다.',
      '물이 없으면 하루를 버티기 힘들어진다.',
    ],
    displayMs: 0,
  },

  cin_season_autumn: {
    id: 'cin_season_autumn',
    image: `${IMG}season_autumn.webp`,
    gradient: 'linear-gradient(160deg,#180a00 0%,#251000 60%,#140800 100%)',
    title: '수확과 위기',
    subtitle: '여름이 끝났다',
    lines: [
      '가을이 왔다. 폐허에도 낙엽이 쌓였다.',
      '식량을 비축해야 한다. 겨울이 멀지 않다.',
      '그리고 좀비들이 더 활발해지기 시작했다.',
    ],
    displayMs: 0,
  },

  cin_season_winter: {
    id: 'cin_season_winter',
    image: `${IMG}season_winter.webp`,
    gradient: 'linear-gradient(160deg,#000a1a 0%,#00101a 60%,#000610 100%)',
    title: '혹한의 시작',
    subtitle: '가을이 끝났다',
    lines: [
      '첫눈이 내렸다. 조용하고, 차갑게.',
      '방한이 없으면 체온이 빠르게 떨어진다.',
      '캠프파이어를 꺼뜨리지 마라.',
    ],
    displayMs: 0,
  },

  // 준비 안 됐을 때 — 계절 전환 충격 (danger 연출)
  cin_season_shock: {
    id: 'cin_season_shock',
    image: `${IMG}season_shock.webp`,
    gradient: 'linear-gradient(160deg,#200a00 0%,#300800 60%,#180600 100%)',
    title: '계절이 바뀌었다',
    subtitle: '준비가 부족하다',
    lines: [
      '갑작스러운 변화가 왔다.',
      '비축이 부족했다. 이 도시는 용서하지 않는다.',
      '버텨라.',
    ],
    displayMs: 0,
  },

  // ── 캐릭터 완료 장면 (6개) ──────────────────────────────────────

  cin_char_doctor: {
    id: 'cin_char_doctor',
    image: `${IMG}char_doctor_final.webp`,
    gradient: 'linear-gradient(160deg,#001a20 0%,#003040 60%,#001018 100%)',
    title: '이지수: 치료의 빛',
    subtitle: '감염 해독 프로토콜 완성',
    lines: [
      '100일. 무전에서 첫 번째 응답이 들렸다.',
      '"프로토콜을 받았습니다. 효과가 있습니다."',
      '삼성병원 약품 창고에서 시작해, 이 순간까지.',
    ],
    displayMs: 0,
  },

  cin_char_soldier: {
    id: 'cin_char_soldier',
    image: `${IMG}char_soldier_final.webp`,
    gradient: 'linear-gradient(160deg,#100a00 0%,#201800 60%,#0a0800 100%)',
    title: '강민준: 임무 완수',
    subtitle: '마지막 전투',
    lines: [
      '30명을 뚫고 들어갔다.',
      '방송 장비는 살아 있었다. 발전기도.',
      '강민준은 마이크 앞에 앉았다.',
    ],
    displayMs: 0,
  },

  cin_char_firefighter: {
    id: 'cin_char_firefighter',
    image: `${IMG}char_firefighter_final.webp`,
    gradient: 'linear-gradient(160deg,#1a0800 0%,#301000 60%,#140600 100%)',
    title: '박영철: 귀향',
    subtitle: '은평 가족 재회',
    lines: [
      '불광동. 빨간 현관문.',
      '노크를 했다. 멈추는 발소리.',
      '"영철이야?" 아내의 목소리였다.',
    ],
    displayMs: 0,
  },

  cin_char_homeless: {
    id: 'cin_char_homeless',
    image: `${IMG}char_homeless_final.webp`,
    gradient: 'linear-gradient(160deg,#0a1000 0%,#141c00 60%,#080c00 100%)',
    title: '최형식: 새 집',
    subtitle: '롯데타워 생존자 거점',
    lines: [
      '위에서 불이 켜져 있었다.',
      '"올라오세요. 자리 있어요."',
      '최형식은 처음으로 웃었다. 집이 생겼다.',
    ],
    displayMs: 0,
  },

  cin_char_chef: {
    id: 'cin_char_chef',
    image: `${IMG}char_chef_final.webp`,
    gradient: 'linear-gradient(160deg,#1a0a00 0%,#302000 60%,#100800 100%)',
    title: '윤재혁: 첫 급식 완료',
    subtitle: '생존자 급식소 개소',
    lines: [
      '따뜻한 김이 올라왔다.',
      '남은 식재료로 만든 국밥. 완벽하진 않지만, 한 끼였다.',
      '이것이 시작이다. 끝이 아니라.',
    ],
    displayMs: 0,
  },

  cin_char_engineer: {
    id: 'cin_char_engineer',
    image: `${IMG}char_engineer_final.webp`,
    gradient: 'linear-gradient(160deg,#0a0a00 0%,#181800 60%,#080800 100%)',
    title: '정대한: 탈출 기계',
    subtitle: '이동수단 완성 · 서울 탈출',
    lines: [
      '고철과 로프로 만든 이동수단. 달렸다.',
      '한강 다리를 건넜다.',
      '처음으로 서울 외곽을 봤다. 하늘이 달랐다.',
    ],
    displayMs: 0,
  },

  // ── 탈출 / 방송 장면 ─────────────────────────────────────────────

  cin_escape: {
    id: 'cin_escape',
    image: `${IMG}ending_escape.webp`,
    gradient: 'linear-gradient(160deg,#001a2a 0%,#00253a 60%,#001020 100%)',
    title: '서울을 떠나다',
    subtitle: '탈출 성공',
    lines: [
      '서울의 경계를 넘었다.',
      '뒤를 돌아봤다. 이 도시가 남긴 것들을 품고.',
      '앞으로 걸어갔다.',
    ],
    displayMs: 0,
  },

  cin_escape_cure: {
    id: 'cin_escape_cure',
    image: `${IMG}ending_cure.webp`,
    gradient: 'linear-gradient(160deg,#001a10 0%,#002a18 60%,#001008 100%)',
    title: '치료제와 함께',
    subtitle: '감염 해소',
    lines: [
      '9개월이 걸렸다. 수십 번의 실패.',
      '마지막 합성이 성공했을 때, 손이 떨렸다.',
      '서울을 떠나야 했다. 이것이 필요한 곳으로.',
    ],
    displayMs: 0,
  },

  cin_ending_broadcast: {
    id: 'cin_ending_broadcast',
    image: `${IMG}ending_broadcast.webp`,
    gradient: 'linear-gradient(160deg,#100800 0%,#201200 60%,#0a0800 100%)',
    title: '방송이 나갔다',
    subtitle: 'KBS 서울 방송 성공',
    lines: [
      '"여기는 서울 KBS. 생존자분들, 들려드릴 말씀이 있습니다."',
      '무전에서 신호가 들렸다. 수원에서, 인천에서.',
      '서울은 다시 시작되고 있었다.',
    ],
    displayMs: 0,
  },

  cin_ending_survival: {
    id: 'cin_ending_survival',
    image: `${IMG}ending_survival.webp`,
    gradient: 'linear-gradient(160deg,#0a1a10 0%,#102a18 60%,#081408 100%)',
    title: '살아남았다',
    subtitle: '생존 거점 완성',
    lines: [
      '반년이 지났다. 그 사이 이곳은 달라졌다.',
      '방벽이 세워지고, 물이 정화되고, 불이 꺼지지 않는 공간.',
      '여기는 안전하다.',
    ],
    displayMs: 0,
  },

  // ── 마일스톤 장면 ───────────────────────────────────────────────

  cin_milestone_warrior: {
    id: 'cin_milestone_warrior',
    image: `${IMG}death_combat.webp`,  // 전투 이미지 재활용
    gradient: 'linear-gradient(160deg,#14000a 0%,#1f0010 60%,#100008 100%)',
    title: '도시의 전사',
    subtitle: '적 100명 처치',
    lines: [
      '백 개. 이 도시에서 쓰러뜨린 것들의 수.',
      '전투는 달라졌다. 더 조용해졌다. 더 효율적이 됐다.',
      '살아 있다. 그것으로 충분하다.',
    ],
    displayMs: 0,
  },

  cin_milestone_survived_year: {
    id: 'cin_milestone_survived_year',
    image: `${IMG}ending_survival.webp`,
    gradient: 'linear-gradient(160deg,#0a0a20 0%,#10102a 60%,#080818 100%)',
    title: '1년을 살아내다',
    subtitle: 'Day 100 달성',
    lines: [
      '100일. 한 계절이 돌았다.',
      '폭염과 혹한을 모두 넘겼다.',
      '이 도시는 아직 끝나지 않았다.',
    ],
    displayMs: 0,
  },

  cin_milestone_summer: {
    id: 'cin_milestone_summer',
    image: `${IMG}season_summer.webp`,
    gradient: 'linear-gradient(160deg,#1a0a00 0%,#2a1400 60%,#1a0800 100%)',
    title: '폭염을 넘어',
    subtitle: '서울의 여름 생존',
    lines: [
      '35도를 넘는 여름이었다.',
      '물을 찾고, 그늘을 찾고, 하루씩.',
      '가을바람이 불어왔다. 살아있다는 것이 실감났다.',
    ],
    displayMs: 0,
  },

  cin_milestone_winter: {
    id: 'cin_milestone_winter',
    image: `${IMG}season_winter.webp`,
    gradient: 'linear-gradient(160deg,#000a1a 0%,#00101a 60%,#000610 100%)',
    title: '한겨울의 생존자',
    subtitle: '서울의 겨울 완전 생존',
    lines: [
      '캠프파이어 하나가 전부였다.',
      '봄이 올 거라 믿었다. 믿지 않으면 버틸 수 없었기 때문에.',
      '눈이 녹기 시작했다. 겨울을 이겼다.',
    ],
    displayMs: 0,
  },

  cin_milestone_four_seasons: {
    id: 'cin_milestone_four_seasons',
    image: `${IMG}ending_survival.webp`,
    gradient: 'linear-gradient(160deg,#0a1a0a 0%,#141a10 60%,#080e08 100%)',
    title: '사계절의 서울',
    subtitle: '1년 완전 생존',
    lines: [
      '봄에는 꽃이 피었다. 폐허 사이로.',
      '겨울엔 다 끝날 것이라 생각했다. 틀렸다.',
      '1년이 지났다. 당신은 살아 있다.',
    ],
    displayMs: 0,
  },
};

// ── 엔딩 ID → 시네마틱 장면 ID 매핑 ─────────────────────────────
export const ENDING_TO_CINEMATIC = {
  // 사망 엔딩
  death_dehydration:       'cin_death_dehydration',
  death_hypothermia:       'cin_death_hypothermia',
  death_starvation:        'cin_death_starvation',
  death_radiation:         'cin_death_radiation',
  death_nuclear_zone:      'cin_death_radiation',
  death_infection:         'cin_death_infection',
  death_combat:            'cin_death_combat',
  death_horde:             'cin_death_combat',
  death_despair:           'cin_death_despair',
  death_exhaustion:        'cin_death_exhaustion',
  death_disease_water:     'cin_death_disease',
  death_disease_infection: 'cin_death_disease',
  death_disease_heat:      'cin_death_disease',

  // 캐릭터 엔딩
  char_doctor:      'cin_char_doctor',
  char_soldier:     'cin_char_soldier',
  char_firefighter: 'cin_char_firefighter',
  char_homeless:    'cin_char_homeless',
  char_chef:        'cin_char_chef',
  char_engineer:    'cin_char_engineer',

  // 메인 퀘스트 엔딩 (soldier만 방송 장면 구분)
  mq_doctor:        'cin_char_doctor',
  mq_soldier:       'cin_ending_broadcast',
  mq_firefighter:   'cin_char_firefighter',
  mq_homeless:      'cin_char_homeless',

  // 셰프 3개 엔딩 (각 테마: Expansion / Settle / Ascension)
  mq_chef_network:   'cin_char_chef',
  mq_chef_farm:      'cin_char_chef',
  mq_chef_ascension: 'cin_char_chef',

  // 엔지니어 3개 엔딩 + 헬기 (b3는 별도 mq_engineer_heli)
  mq_engineer_escape:  'cin_char_engineer',
  mq_engineer_base:    'cin_char_engineer',
  mq_engineer_rebuild: 'cin_char_engineer',

  // 탈출 엔딩 (공통 탈출 이미지 공유, 치료제는 별도)
  escape_river:      'cin_escape',
  escape_helicopter: 'cin_escape',
  escape_north:      'cin_escape',
  escape_cure:       'cin_escape_cure',

  // 마일스톤 엔딩
  milestone_fortified:     'cin_ending_survival',
  milestone_warrior:       'cin_milestone_warrior',
  milestone_survived_year: 'cin_milestone_survived_year',
  milestone_scavenger:     null,
  survived_summer:         'cin_milestone_summer',
  winter_survivor:         'cin_milestone_winter',
  four_seasons:            'cin_milestone_four_seasons',
};

export default CINEMATIC_SCENES;
