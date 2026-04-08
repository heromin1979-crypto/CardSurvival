// === SEASONAL EVENTS ===
// 날짜 기반 1회성 이벤트 테이블 — 봄(1-90) → 여름(91-180) → 가을(181-270) → 겨울(271+)

export const SEASONAL_EVENTS = [

  // ── 봄 (Day 1-90) ─────────────────────────────────────────────

  {
    day: 7,  id: 'spring_rain',
    title: '봄비',
    message: '🌧 봄비가 내렸습니다. 오염된 빗물이 고였습니다. 보관 식량을 점검하십시오.',
    type: 'warn',
    effects: { contaminateFood: 10 },
  },

  {
    day: 14, id: 'spring_pollen',
    title: '꽃가루 시즌',
    message: '🌸 꽃가루가 날립니다. 호흡기가 약해집니다. 감염 위험이 증가했습니다.',
    type: 'warn',
    effects: { infection: 5 },
  },

  {
    day: 30, id: 'spring_warmth',
    title: '따뜻한 봄',
    message: '🌤 봄 기운이 완연합니다. 기온이 오르고 있습니다. 여름 준비가 필요합니다.',
    type: 'info',
    effects: { morale: 5 },
  },

  // ── 여름 (Day 91-180) ─────────────────────────────────────────

  {
    day: 100, id: 'summer_drought',
    title: '가뭄',
    message: '🏜 극심한 가뭄이 이어지고 있습니다. 수원이 마르고 있습니다.',
    type: 'danger',
    effects: { morale: -10 },
  },

  {
    day: 110, id: 'food_poisoning_alert',
    title: '식중독 주의보',
    message: '🤮 고온으로 보관 식량의 부패가 빨라지고 있습니다. 식량 오염 주의!',
    type: 'warn',
    effects: { contaminateFood: 20 },
  },

  {
    day: 91, id: 'summer_start',
    title: '여름 시작',
    message: '☀️ 폭염이 시작되었습니다! 수분 소비가 크게 늘어납니다. 물 비축이 최우선입니다!',
    type: 'danger',
    effects: {},
  },

  {
    day: 120, id: 'heat_wave',
    title: '폭염 경보',
    message: '🌡 극심한 폭염입니다. 체온이 위험 수준으로 치솟습니다.',
    type: 'danger',
    effects: { temperature: 15 },
  },

  {
    day: 135, id: 'monsoon',
    title: '장마 시작',
    message: '🌊 장마가 시작되었습니다. 습기와 빗물이 감염과 오염 위험을 높입니다.',
    type: 'warn',
    effects: { contaminateFood: 15, infection: 8 },
  },

  {
    day: 150, id: 'typhoon',
    title: '태풍 상륙',
    message: '🌀 강력한 태풍이 상륙했습니다! 구조물이 손상되었습니다.',
    type: 'danger',
    effects: { structureDamage: 30 },
  },

  // ── 가을 (Day 181-270) ────────────────────────────────────────

  {
    day: 181, id: 'autumn_start',
    title: '가을 시작',
    message: '🍂 선선한 가을바람이 불어옵니다. 수확의 계절입니다. 식량을 비축하십시오.',
    type: 'success',
    effects: { morale: 10 },
  },

  {
    day: 185, id: 'zombie_migration',
    title: '좀비 대이동',
    message: '🧟 대규모 좀비 무리가 이동 중입니다. 조우 확률이 크게 증가했습니다!',
    type: 'danger',
    effects: { morale: -5 },
  },

  {
    day: 195, id: 'acid_rain_warning',
    title: '산성비 경보',
    message: '☢ 대기 오염으로 산성비가 내리기 시작합니다. 텃밭 작물이 고사할 수 있습니다!',
    type: 'danger',
    effects: { contaminateFood: 15, morale: -5 },
  },

  {
    day: 210, id: 'autumn_harvest',
    title: '풍성한 수확',
    message: '🌾 가을 들판이 풍성합니다. 탐색 시 식량 발견이 늘어납니다.',
    type: 'success',
    effects: { morale: 5 },
  },

  {
    day: 240, id: 'first_frost',
    title: '첫 서리',
    message: '❄️ 첫 서리가 내렸습니다. 겨울이 다가오고 있습니다. 방한 준비를 하십시오.',
    type: 'warn',
    effects: { temperature: -10 },
  },

  // ── 겨울 (Day 271-365) ────────────────────────────────────────

  {
    day: 271, id: 'winter_start',
    title: '한겨울 시작',
    message: '❄️ 혹독한 겨울이 시작되었습니다! 캠프파이어 없이는 생존이 위험합니다!',
    type: 'danger',
    effects: { temperature: -15 },
  },

  {
    day: 285, id: 'heavy_snow',
    title: '폭설',
    message: '⛄ 기록적인 폭설이 쏟아졌습니다. 이동이 더욱 어려워졌습니다.',
    type: 'warn',
    effects: { morale: -5 },
  },

  {
    day: 300, id: 'extreme_cold',
    title: '강추위',
    message: '🥶 영하 20도를 넘어섰습니다. 방한 장비 없이는 몇 시간도 버티기 힘듭니다.',
    type: 'danger',
    effects: { temperature: -20 },
  },

  {
    day: 315, id: 'winter_solstice',
    title: '동지 — 가장 긴 밤',
    message: '🌙 일 년 중 가장 긴 밤입니다. 식량 비축량을 점검하십시오.',
    type: 'warn',
    effects: { morale: -5 },
  },

  {
    day: 330, id: 'midwinter',
    title: '한겨울 절정',
    message: '⚠️ 한겨울의 절정입니다. 겨울이 끝날 때까지 버텨야 합니다.',
    type: 'danger',
    effects: {},
  },

  {
    day: 365, id: 'year_survived',
    title: '1년 생존',
    message: '🎖 믿기 힘든 일이 일어났습니다. 당신은 폐허가 된 서울에서 1년을 버텼습니다!',
    type: 'success',
    effects: { morale: 20 },
  },
];

export default SEASONAL_EVENTS;
