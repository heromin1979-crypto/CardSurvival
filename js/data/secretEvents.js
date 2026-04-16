// === SECRET EVENTS ===
// 30 hidden events triggered by specific conditions
// Categories: early (D1-30), mid (D31-100), chain (multi-step), late (D100+), character (캐릭터 전용)

export const SECRET_EVENTS = [

  // ============================================================
  // EARLY EVENTS (D1-30) — 4 events
  // ============================================================

  // 1. event_radio_whisper
  {
    id: 'event_radio_whisper',
    name: '라디오 속삭임',
    icon: '📻',
    description: '심야에 라디오에서 의미심장한 신호가 잡힌다...',
    category: 'early',
    triggerConditions: {
      dayRange: [5, 15],
      timeOfDay: 'night',
      requiredItems: ['radio'],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'track_signal',
        text: '신호를 추적한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '신호의 출처를 찾았다! 근처에 숨겨진 지하 쇼핑몰을 발견한다.',
            effects: {
              revealHiddenLocation: 'hidden_nowon_underground_mall',
              morale: 10,
              items: [],
              flags: { radio_whisper_found: true },
            },
          },
          {
            weight: 30,
            text: '추적 중 어둠 속에서 빠른 발소리가 들린다. 적과 조우!',
            effects: {
              combat: { enemyId: 'zombie_runner', count: 2 },
            },
          },
        ],
      },
      {
        id: 'amplify_signal',
        text: '전자부품으로 신호를 증폭한다',
        conditions: { requiredItems: ['electronic_parts'] },
        outcomes: [
          {
            weight: 85,
            text: '증폭에 성공했다! 숨겨진 장소와 함께 물자 좌표까지 확보한다.',
            effects: {
              revealHiddenLocation: 'hidden_nowon_underground_mall',
              morale: 15,
              items: [
                { id: 'map_fragment', qty: 1 },
              ],
              removeItems: [{ id: 'electronic_parts', qty: 1 }],
              flags: { radio_whisper_found: true },
            },
          },
          {
            weight: 15,
            text: '증폭 과정에서 부품이 과부하로 타버렸다. 신호도 끊겼다.',
            effects: {
              morale: -5,
              removeItems: [{ id: 'electronic_parts', qty: 1 }],
            },
          },
        ],
      },
      {
        id: 'ignore_signal',
        text: '무시한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '신호를 무시했다. 나중에 다시 들릴지도 모른다.',
            effects: { morale: -5 },
          },
        ],
      },
    ],
  },

  // 2. event_abandoned_cart
  {
    id: 'event_abandoned_cart',
    name: '버려진 수레',
    icon: '🛒',
    description: '길가에 뒤집어진 수레가 보인다. 무언가 가득 실려 있었던 흔적...',
    category: 'early',
    triggerConditions: {
      dayRange: [3, 20],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 0.05,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'search_cart',
        text: '수레를 뒤진다',
        conditions: null,
        outcomes: [
          {
            weight: 55,
            text: '식량과 붕대가 남아있다! 운이 좋았다.',
            effects: {
              items: [
                { id: 'canned_food', qty: 3 },
                { id: 'bandage', qty: 2 },
              ],
              morale: 5,
            },
          },
          {
            weight: 30,
            text: '함정이었다! 철사에 걸려 넘어지며 부상을 입는다.',
            effects: {
              hp: -15,
              morale: -5,
              noise: 15,
            },
          },
          {
            weight: 15,
            text: '수레 아래에서 숨어있던 좀비가 튀어나온다!',
            effects: {
              combat: { enemyId: 'zombie_common', count: 1 },
            },
          },
        ],
      },
      {
        id: 'careful_inspect',
        text: '조심스럽게 함정 여부를 확인한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '철사 함정을 발견하고 해제했다. 안전하게 물자를 회수한다.',
            effects: {
              items: [
                { id: 'canned_food', qty: 2 },
                { id: 'wire', qty: 1 },
                { id: 'bandage', qty: 1 },
              ],
              morale: 8,
            },
          },
          {
            weight: 30,
            text: '함정은 없었지만 물자도 거의 남지 않았다.',
            effects: {
              items: [
                { id: 'cloth', qty: 2 },
              ],
            },
          },
        ],
      },
      {
        id: 'ignore_cart',
        text: '위험해 보인다. 지나친다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '수레를 무시하고 지나갔다. 안전하지만 아쉽다.',
            effects: { morale: -3 },
          },
        ],
      },
    ],
  },

  // 3. event_child_crying
  {
    id: 'event_child_crying',
    name: '아이의 울음소리',
    icon: '👶',
    description: '주거 구역 깊숙한 곳에서 아이의 울음소리가 들린다...',
    category: 'early',
    triggerConditions: {
      dayRange: [7, 25],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 30,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'investigate_crying',
        text: '소리를 따라간다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '무너진 건물 안에서 홀로 남겨진 아이를 발견한다. 곁에 메모 한 장이 있다.',
            effects: {
              morale: 15,
              items: [
                { id: 'survivor_note', qty: 1 },
              ],
              flags: { lost_child_found: true },
              chainProgress: { chainId: 'lost_child', step: 1 },
            },
          },
          {
            weight: 25,
            text: '울음소리는 미끼였다. 약탈자들이 매복해 있었다!',
            effects: {
              combat: { enemyId: 'raider', count: 2 },
            },
          },
          {
            weight: 15,
            text: '소리의 근원지에 다다랐지만 아무도 없다. 바람 소리였을까...',
            effects: {
              morale: -10,
              fatigue: 10,
            },
          },
        ],
      },
      {
        id: 'call_out',
        text: '멀리서 소리를 질러 반응을 확인한다',
        conditions: null,
        outcomes: [
          {
            weight: 40,
            text: '아이가 대답한다! 안전하게 접근하여 구출에 성공한다.',
            effects: {
              morale: 20,
              noise: 20,
              flags: { lost_child_found: true },
              chainProgress: { chainId: 'lost_child', step: 1 },
            },
          },
          {
            weight: 60,
            text: '소리에 반응한 좀비 무리가 몰려온다!',
            effects: {
              noise: 30,
              combat: { enemyId: 'zombie_horde', count: 1 },
            },
          },
        ],
      },
      {
        id: 'ignore_crying',
        text: '위험할 수 있다. 떠난다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '울음소리를 뒤로하고 떠났다. 마음이 무겁다.',
            effects: { morale: -15 },
          },
        ],
      },
    ],
  },

  // 4. event_first_rain
  {
    id: 'event_first_rain',
    name: '첫 비',
    icon: '🌧️',
    description: '감염 이후 처음으로 비가 내린다. 빗방울이 먼지를 씻어낸다...',
    category: 'early',
    triggerConditions: {
      dayRange: [7, 14],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: 'rain',
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'collect_rainwater',
        text: '빈 병으로 빗물을 모은다',
        conditions: { requiredItems: ['empty_bottle'] },
        outcomes: [
          {
            weight: 100,
            text: '빗물을 가득 채웠다! 정수하면 마실 수 있을 것이다.',
            effects: {
              items: [
                { id: 'rainwater', qty: 3 },
              ],
              removeItems: [{ id: 'empty_bottle', qty: 3 }],
              morale: 5,
            },
          },
        ],
      },
      {
        id: 'enjoy_rain',
        text: '비를 맞으며 잠시 쉰다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '오랜만의 비에 마음이 편안해진다. 사기가 회복된다.',
            effects: {
              morale: 15,
              fatigue: -10,
              infection: 3,
            },
          },
          {
            weight: 30,
            text: '비에 젖어 체온이 떨어졌다. 감기 기운이 느껴진다.',
            effects: {
              morale: 5,
              hp: -5,
              infection: 8,
            },
          },
        ],
      },
      {
        id: 'seek_shelter',
        text: '비를 피해 실내로 들어간다',
        conditions: null,
        outcomes: [
          {
            weight: 80,
            text: '건물 안에서 안전하게 비를 피했다.',
            effects: {
              morale: 3,
            },
          },
          {
            weight: 20,
            text: '건물 안에 이미 누군가 있었다. 긴장이 감돈다.',
            effects: {
              combat: { enemyId: 'zombie_common', count: 2 },
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // MID EVENTS (D31-100) — 6 events
  // ============================================================

  // 5. event_wandering_trader
  {
    id: 'event_wandering_trader',
    name: '떠돌이 상인',
    icon: '🧳',
    description: '무거운 짐을 진 떠돌이 상인이 나타났다. 경계하면서도 교역을 제안한다.',
    category: 'mid',
    triggerConditions: {
      dayRange: [30, 90],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 0.03,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 60,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'trade',
        text: '통조림 3개로 의약품을 교환한다',
        conditions: { requiredItems: ['canned_food'] },
        outcomes: [
          {
            weight: 75,
            text: '공정한 거래였다. 상인은 고개를 끄덕이고 떠난다.',
            effects: {
              items: [
                { id: 'antibiotics', qty: 1 },
                { id: 'bandage', qty: 3 },
              ],
              removeItems: [{ id: 'canned_food', qty: 3 }],
              morale: 10,
              flags: { trader_met: true },
            },
          },
          {
            weight: 25,
            text: '상인이 희귀한 물건을 보너스로 내놓는다. 단골이 되었다.',
            effects: {
              items: [
                { id: 'first_aid_kit', qty: 1 },
                { id: 'antibiotics', qty: 1 },
              ],
              removeItems: [{ id: 'canned_food', qty: 3 }],
              morale: 15,
              flags: { trader_met: true },
            },
          },
        ],
      },
      {
        id: 'rob_trader',
        text: '무력으로 물자를 빼앗는다',
        conditions: null,
        outcomes: [
          {
            weight: 50,
            text: '상인을 제압하고 짐을 탈취했다. 양심이 찔린다.',
            effects: {
              items: [
                { id: 'canned_food', qty: 4 },
                { id: 'bandage', qty: 3 },
                { id: 'pistol_ammo', qty: 5 },
              ],
              morale: -20,
              flags: { trader_robbed: true },
            },
          },
          {
            weight: 50,
            text: '상인이 만만치 않다! 반격이 시작된다.',
            effects: {
              combat: { enemyId: 'raider_elite', count: 1 },
              morale: -10,
              flags: { trader_robbed: true },
            },
          },
        ],
      },
      {
        id: 'chat_trader',
        text: '교역 없이 정보를 교환한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '상인이 근처 위험 구역과 물자 위치에 대한 정보를 알려준다.',
            effects: {
              morale: 5,
              items: [
                { id: 'map_fragment', qty: 1 },
              ],
              flags: { trader_met: true },
            },
          },
        ],
      },
    ],
  },

  // 6. event_survivor_camp
  {
    id: 'event_survivor_camp',
    name: '생존자 캠프 발견',
    icon: '⛺',
    description: '숲 속에 숨겨진 생존자들의 캠프를 발견했다. 5-6명이 모여 살고 있다.',
    category: 'mid',
    triggerConditions: {
      dayRange: [40, 80],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 50,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'join_camp',
        text: '합류를 제안한다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '따뜻한 환영을 받았다. 하룻밤 쉬어가며 물자를 나눈다.',
            effects: {
              hp: 20,
              morale: 25,
              fatigue: -30,
              infection: -5,
              items: [
                { id: 'canned_food', qty: 2 },
                { id: 'purified_water', qty: 2 },
              ],
              flags: { survivor_camp_joined: true },
            },
          },
          {
            weight: 40,
            text: '경계심이 강한 그들은 거절했다. 하지만 약간의 물자를 나눠준다.',
            effects: {
              morale: 5,
              items: [
                { id: 'bandage', qty: 2 },
              ],
            },
          },
        ],
      },
      {
        id: 'trade_food',
        text: '식량을 교환한다',
        conditions: { requiredItems: ['canned_food'] },
        outcomes: [
          {
            weight: 100,
            text: '식량을 나누니 그들이 고마워하며 의약품을 내놓는다.',
            effects: {
              items: [
                { id: 'first_aid_kit', qty: 1 },
                { id: 'antiseptic', qty: 2 },
              ],
              removeItems: [{ id: 'canned_food', qty: 2 }],
              morale: 15,
              flags: { survivor_camp_traded: true },
            },
          },
        ],
      },
      {
        id: 'observe_camp',
        text: '몰래 관찰만 하고 떠난다',
        conditions: null,
        outcomes: [
          {
            weight: 80,
            text: '그들의 방어 체계를 관찰하여 유용한 지식을 얻었다.',
            effects: {
              morale: 3,
            },
          },
          {
            weight: 20,
            text: '발각되었다! 경비원이 경고 사격을 한다. 서둘러 도망쳤다.',
            effects: {
              noise: 25,
              morale: -10,
              fatigue: 15,
            },
          },
        ],
      },
    ],
  },

  // 7. event_military_airdrop
  {
    id: 'event_military_airdrop',
    name: '군 물자 투하',
    icon: '🪂',
    description: '라디오에서 군 물자 투하 좌표가 잡혔다! 하늘에서 낙하산이 보인다.',
    category: 'mid',
    triggerConditions: {
      dayRange: [50, 90],
      timeOfDay: null,
      requiredItems: ['radio'],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 0.02,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'rush_airdrop',
        text: '전력으로 투하 지점에 달려간다',
        conditions: null,
        outcomes: [
          {
            weight: 40,
            text: '먼저 도착했다! 군용 물자를 확보한다.',
            effects: {
              items: [
                { id: 'military_ration', qty: 3 },
                { id: 'first_aid_kit', qty: 2 },
                { id: 'pistol_ammo', qty: 10 },
              ],
              morale: 20,
              fatigue: 20,
              noise: 15,
            },
          },
          {
            weight: 35,
            text: '다른 생존자들과 동시에 도착했다. 물자를 두고 쟁탈전이 벌어진다!',
            effects: {
              combat: { enemyId: 'raider', count: 3 },
              noise: 30,
            },
          },
          {
            weight: 25,
            text: '투하 지점에 좀비 무리가 이미 모여있다!',
            effects: {
              combat: { enemyId: 'zombie_horde', count: 1 },
              noise: 20,
            },
          },
        ],
      },
      {
        id: 'wait_and_sneak',
        text: '다른 이들이 싸우는 틈에 몰래 접근한다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '혼란 속에서 물자 일부를 조용히 가져왔다.',
            effects: {
              items: [
                { id: 'military_ration', qty: 1 },
                { id: 'first_aid_kit', qty: 1 },
                { id: 'pistol_ammo', qty: 5 },
              ],
              morale: 10,
            },
          },
          {
            weight: 40,
            text: '너무 늦었다. 남은 건 빈 상자뿐이다.',
            effects: {
              items: [
                { id: 'scrap_metal', qty: 2 },
              ],
              morale: -5,
            },
          },
        ],
      },
      {
        id: 'ignore_airdrop',
        text: '너무 위험하다. 포기한다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '총성과 비명이 멀리서 들린다. 포기한 것이 현명했을지도.',
            effects: { morale: -5 },
          },
        ],
      },
    ],
  },

  // 8. event_cursed_hospital
  {
    id: 'event_cursed_hospital',
    name: '저주받은 병원',
    icon: '🏚️',
    description: '폐허가 된 병원에서 이상한 소리가 들린다. 의료 물자가 남아있을지도...',
    category: 'mid',
    triggerConditions: {
      dayRange: [40, 70],
      timeOfDay: 'night',
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'enter_hospital',
        text: '병원 안으로 들어간다',
        conditions: null,
        outcomes: [
          {
            weight: 45,
            text: '약품 창고를 발견했다! 대량의 의료 물자를 확보한다.',
            effects: {
              items: [
                { id: 'first_aid_kit', qty: 2 },
                { id: 'antibiotics', qty: 2 },
                { id: 'surgery_kit', qty: 1 },
              ],
              morale: 15,
            },
          },
          {
            weight: 35,
            text: '약품을 찾았지만 병원 깊은 곳에서 거대한 무언가가 다가온다!',
            effects: {
              items: [
                { id: 'antibiotics', qty: 1 },
                { id: 'bandage', qty: 3 },
              ],
              combat: { enemyId: 'zombie_brute', count: 1 },
            },
          },
          {
            weight: 20,
            text: '내부가 완전히 약탈된 후다. 좀비만 가득하다.',
            effects: {
              combat: { enemyId: 'zombie_common', count: 3 },
              morale: -5,
            },
          },
        ],
      },
      {
        id: 'search_pharmacy',
        text: '1층 약국만 빠르게 수색한다',
        conditions: null,
        outcomes: [
          {
            weight: 65,
            text: '약국 선반에서 쓸만한 약품을 찾았다.',
            effects: {
              items: [
                { id: 'painkiller', qty: 2 },
                { id: 'bandage', qty: 2 },
                { id: 'antiseptic', qty: 1 },
              ],
              morale: 5,
            },
          },
          {
            weight: 35,
            text: '약국은 텅 비어있다. 시간만 낭비했다.',
            effects: {
              fatigue: 10,
              morale: -3,
            },
          },
        ],
      },
      {
        id: 'leave_hospital',
        text: '불길한 기운이 느껴진다. 떠난다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '본능을 믿고 병원을 떠났다. 안에서 무슨 일이 벌어지는지 모르겠지만.',
            effects: { morale: -3 },
          },
        ],
      },
    ],
  },

  // 9. event_bridge_blockade
  {
    id: 'event_bridge_blockade',
    name: '다리 봉쇄',
    icon: '🌉',
    description: '한강을 건너는 다리가 약탈자 무리에 의해 봉쇄되어 있다.',
    category: 'mid',
    triggerConditions: {
      dayRange: [60, 100],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'pay_toll',
        text: '통행료를 지불한다 (식량 3개)',
        conditions: { requiredItems: ['canned_food'] },
        outcomes: [
          {
            weight: 75,
            text: '약탈자가 식량을 받고 길을 열어준다.',
            effects: {
              removeItems: [{ id: 'canned_food', qty: 3 }],
              morale: -5,
              flags: { bridge_passed: true },
            },
          },
          {
            weight: 25,
            text: '식량을 받고도 더 요구한다. 협상이 결렬되었다!',
            effects: {
              removeItems: [{ id: 'canned_food', qty: 3 }],
              combat: { enemyId: 'raider', count: 2 },
              morale: -10,
            },
          },
        ],
      },
      {
        id: 'fight_blockade',
        text: '무력으로 돌파한다',
        conditions: null,
        outcomes: [
          {
            weight: 50,
            text: '봉쇄를 돌파했다! 약탈자들의 물자까지 노획한다.',
            effects: {
              combat: { enemyId: 'raider', count: 3 },
              items: [
                { id: 'pistol_ammo', qty: 8 },
                { id: 'canned_food', qty: 2 },
              ],
              flags: { bridge_passed: true },
            },
          },
          {
            weight: 50,
            text: '약탈자들이 예상보다 강하다. 힘겨운 전투가 시작된다.',
            effects: {
              combat: { enemyId: 'raider_elite', count: 2 },
              noise: 30,
            },
          },
        ],
      },
      {
        id: 'detour_river',
        text: '우회로를 찾는다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '하류 쪽에서 무너진 철도 다리를 발견했다. 위험하지만 건널 수 있다.',
            effects: {
              fatigue: 20,
              hp: -5,
              flags: { bridge_detour: true },
            },
          },
          {
            weight: 40,
            text: '우회 중 길을 잃었다. 체력만 소모하고 되돌아왔다.',
            effects: {
              fatigue: 30,
              morale: -10,
            },
          },
        ],
      },
    ],
  },

  // 10. event_factory_explosion
  {
    id: 'event_factory_explosion',
    name: '공장 폭발',
    icon: '💥',
    description: '멀리서 거대한 폭발음이 들린다. 공업지구 쪽에서 검은 연기가 치솟는다.',
    category: 'mid',
    triggerConditions: {
      dayRange: [45, 80],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 60,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'investigate_explosion',
        text: '폭발 현장으로 가본다',
        conditions: null,
        outcomes: [
          {
            weight: 45,
            text: '폭발로 무너진 벽 뒤에 숨겨진 군수 창고가 드러났다!',
            effects: {
              revealHiddenLocation: 'hidden_guro_factory_forge',
              items: [
                { id: 'scrap_metal', qty: 4 },
                { id: 'electronic_parts', qty: 2 },
              ],
              morale: 15,
              radiation: 5,
            },
          },
          {
            weight: 35,
            text: '잔해 속에서 쓸만한 부품들을 수거했다.',
            effects: {
              items: [
                { id: 'scrap_metal', qty: 6 },
                { id: 'wire', qty: 3 },
                { id: 'fuel_can', qty: 1 },
              ],
              radiation: 8,
            },
          },
          {
            weight: 20,
            text: '화재와 유독 가스가 아직 남아있다. 접근이 어렵다.',
            effects: {
              hp: -10,
              radiation: 15,
              infection: 5,
            },
          },
        ],
      },
      {
        id: 'scavenge_perimeter',
        text: '폭발 주변부만 수색한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '날아온 파편 속에서 쓸만한 재료들을 주웠다.',
            effects: {
              items: [
                { id: 'scrap_metal', qty: 3 },
                { id: 'wire', qty: 2 },
              ],
            },
          },
          {
            weight: 30,
            text: '폭발 소리에 이끌려 좀비들이 모여들고 있다!',
            effects: {
              combat: { enemyId: 'zombie_runner', count: 2 },
              noise: 10,
            },
          },
        ],
      },
      {
        id: 'avoid_explosion',
        text: '폭발 지역을 피해 반대쪽으로 이동한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '폭발로 인해 좀비들이 그쪽으로 몰렸다. 이쪽은 오히려 안전해졌다.',
            effects: {
              morale: 5,
              noise: -10,
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // CHAIN EVENTS — Lost Child (3-part)
  // ============================================================

  // 11. event_lost_child_1
  {
    id: 'event_lost_child_1',
    name: '잃어버린 아이 1: 울음소리',
    icon: '😢',
    description: '구조한 아이가 엄마를 찾는다고 울고 있다. "엄마가 마포구 약국에 간다고 했어요..."',
    category: 'chain',
    triggerConditions: {
      dayRange: [10, 50],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: ['lost_child_found'],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: 'lost_child',
      chainStep: 0,
    },
    choices: [
      {
        id: 'promise_search',
        text: '아이에게 엄마를 찾아주겠다고 약속한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '아이가 울음을 그친다. 마포구 약국으로 가야 한다.',
            effects: {
              morale: 10,
              flags: { lost_child_quest_active: true },
              chainProgress: { chainId: 'lost_child', step: 1 },
            },
          },
        ],
      },
      {
        id: 'give_food',
        text: '우선 식량을 나눠주고 안전한 곳에 둔다',
        conditions: { requiredItems: ['canned_food'] },
        outcomes: [
          {
            weight: 100,
            text: '아이에게 먹을 것을 주고 안전한 곳에 숨겼다. 이제 엄마를 찾으러 가자.',
            effects: {
              removeItems: [{ id: 'canned_food', qty: 1 }],
              morale: 15,
              flags: { lost_child_quest_active: true, lost_child_fed: true },
              chainProgress: { chainId: 'lost_child', step: 1 },
            },
          },
        ],
      },
      {
        id: 'abandon_child',
        text: '너무 위험하다. 혼자 갈 수 없다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '아이를 두고 떠났다. 양심의 가책이 크다.',
            effects: {
              morale: -25,
              flags: { lost_child_abandoned: true },
            },
          },
        ],
      },
    ],
  },

  // 12. event_lost_child_2
  {
    id: 'event_lost_child_2',
    name: '잃어버린 아이 2: 마포 약국',
    icon: '💊',
    description: '마포구의 폐약국에 도착했다. 안에 누군가 있었던 흔적이 남아있다.',
    category: 'chain',
    triggerConditions: {
      dayRange: [15, 70],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: 'mapo',
      probability: 1.0,
      requiredFlags: ['lost_child_quest_active'],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: 'lost_child',
      chainStep: 1,
    },
    choices: [
      {
        id: 'search_pharmacy_thorough',
        text: '약국 내부를 꼼꼼히 수색한다',
        conditions: null,
        outcomes: [
          {
            weight: 65,
            text: '카운터 뒤에서 편지와 목걸이를 발견했다. "딸에게 전해주세요..."',
            effects: {
              items: [
                { id: 'antibiotics', qty: 1 },
                { id: 'bandage', qty: 2 },
              ],
              morale: 5,
              flags: { mothers_letter_found: true },
              chainProgress: { chainId: 'lost_child', step: 2 },
            },
          },
          {
            weight: 35,
            text: '약국은 수색되었지만 지하실에서 새로운 단서를 발견했다.',
            effects: {
              items: [
                { id: 'painkiller', qty: 2 },
              ],
              morale: 3,
              flags: { mothers_letter_found: true },
              chainProgress: { chainId: 'lost_child', step: 2 },
            },
          },
        ],
      },
      {
        id: 'ask_survivors',
        text: '근처 생존자에게 물어본다',
        conditions: null,
        outcomes: [
          {
            weight: 50,
            text: '"그 여자... 며칠 전에 좀비에게 쫓기는 걸 봤어요. 이것을 떨어뜨렸어요."',
            effects: {
              morale: -5,
              flags: { mothers_letter_found: true },
              chainProgress: { chainId: 'lost_child', step: 2 },
            },
          },
          {
            weight: 50,
            text: '아무도 모른다. 직접 더 찾아봐야 한다.',
            effects: {
              fatigue: 10,
            },
          },
        ],
      },
    ],
  },

  // 13. event_lost_child_3
  {
    id: 'event_lost_child_3',
    name: '잃어버린 아이 3: 어머니의 목걸이',
    icon: '📿',
    description: '아이에게 돌아왔다. 엄마의 편지와 유품을 전해줄 시간이다.',
    category: 'chain',
    triggerConditions: {
      dayRange: [20, 100],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: ['mothers_letter_found'],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: 'lost_child',
      chainStep: 2,
    },
    choices: [
      {
        id: 'give_necklace',
        text: '아이에게 편지와 목걸이를 전한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '아이가 목걸이를 꼭 쥐고 운다. "고마워요..." 목걸이가 희미하게 빛난다.',
            effects: {
              items: [
                { id: 'mothers_necklace', qty: 1 },
              ],
              morale: 30,
              flags: { lost_child_complete: true },
            },
          },
        ],
      },
      {
        id: 'keep_necklace',
        text: '목걸이를 간직한다 (아이에게는 편지만 전한다)',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '아이가 편지를 읽고 울음을 그친다. 목걸이의 온기가 손에 남아있다.',
            effects: {
              items: [
                { id: 'mothers_necklace', qty: 1 },
              ],
              morale: 10,
              flags: { lost_child_complete: true },
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // CHAIN EVENTS — Underground Network (3-part)
  // ============================================================

  // 14. event_underground_network_1
  {
    id: 'event_underground_network_1',
    name: '지하 네트워크 1: 지도 조각',
    icon: '🗺️',
    description: '탐색 중 낡은 지도 조각을 발견했다. 지하철 노선도에 누군가 표시를 해두었다.',
    category: 'chain',
    triggerConditions: {
      dayRange: [30, 60],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 10,
      chainId: 'underground',
      chainStep: 0,
    },
    choices: [
      {
        id: 'study_map',
        text: '지도를 자세히 분석한다',
        conditions: null,
        outcomes: [
          {
            weight: 80,
            text: '지하철 3호선 특정 역에 "살아있음"이라는 표시가 있다!',
            effects: {
              items: [
                { id: 'map_fragment', qty: 1 },
              ],
              morale: 10,
              flags: { underground_map_found: true },
              chainProgress: { chainId: 'underground', step: 1 },
            },
          },
          {
            weight: 20,
            text: '지도의 일부가 훼손되어 정확한 위치를 특정하기 어렵다.',
            effects: {
              morale: 3,
              flags: { underground_map_found: true },
              chainProgress: { chainId: 'underground', step: 1 },
            },
          },
        ],
      },
      {
        id: 'share_map',
        text: '다른 생존자에게 보여준다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '"나도 비슷한 지도를 본 적 있어요." 추가 정보를 얻었다.',
            effects: {
              items: [
                { id: 'map_fragment', qty: 2 },
              ],
              morale: 12,
              flags: { underground_map_found: true },
              chainProgress: { chainId: 'underground', step: 1 },
            },
          },
          {
            weight: 40,
            text: '아무도 관심이 없다. 혼자 해결해야 한다.',
            effects: {
              flags: { underground_map_found: true },
              chainProgress: { chainId: 'underground', step: 1 },
            },
          },
        ],
      },
    ],
  },

  // 15. event_underground_network_2
  {
    id: 'event_underground_network_2',
    name: '지하 네트워크 2: 지하철역',
    icon: '🚇',
    description: '지도가 가리키는 지하철역에 도착했다. 입구가 바리케이드로 막혀있지만 틈이 있다.',
    category: 'chain',
    triggerConditions: {
      dayRange: [40, 80],
      timeOfDay: null,
      requiredItems: ['flashlight'],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: ['underground_map_found'],
      minHp: 20,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: 'underground',
      chainStep: 1,
    },
    choices: [
      {
        id: 'enter_subway',
        text: '바리케이드 틈으로 들어간다',
        conditions: null,
        outcomes: [
          {
            weight: 55,
            text: '어둠 속을 손전등으로 비추며 내려간다. 깊은 곳에서 불빛이 보인다!',
            effects: {
              morale: 15,
              fatigue: 15,
              flags: { underground_entrance_found: true },
              chainProgress: { chainId: 'underground', step: 2 },
            },
          },
          {
            weight: 30,
            text: '지하철 터널에서 특수 감염자와 조우! 하지만 그 너머로 길이 이어진다.',
            effects: {
              combat: { enemyId: 'zombie_acid', count: 2 },
              flags: { underground_entrance_found: true },
              chainProgress: { chainId: 'underground', step: 2 },
            },
          },
          {
            weight: 15,
            text: '터널이 붕괴되어 더 이상 진행할 수 없다. 다른 입구를 찾아야 한다.',
            effects: {
              fatigue: 20,
              morale: -10,
            },
          },
        ],
      },
      {
        id: 'knock_barricade',
        text: '바리케이드를 두드려 안에 있는 사람에게 신호를 보낸다',
        conditions: null,
        outcomes: [
          {
            weight: 40,
            text: '안쪽에서 답신이 온다! 바리케이드가 조심스럽게 열린다.',
            effects: {
              morale: 20,
              noise: 10,
              flags: { underground_entrance_found: true },
              chainProgress: { chainId: 'underground', step: 2 },
            },
          },
          {
            weight: 35,
            text: '소음에 반응한 좀비들이 모여든다! 서둘러 진입해야 한다.',
            effects: {
              combat: { enemyId: 'zombie_runner', count: 3 },
              noise: 25,
              flags: { underground_entrance_found: true },
              chainProgress: { chainId: 'underground', step: 2 },
            },
          },
          {
            weight: 25,
            text: '아무 응답이 없다. 텅 빈 지하철역에 적막만 감돈다.',
            effects: {
              morale: -5,
              noise: 10,
            },
          },
        ],
      },
    ],
  },

  // 16. event_underground_network_3
  {
    id: 'event_underground_network_3',
    name: '지하 네트워크 3: 생존자 도시',
    icon: '🏙️',
    description: '터널 깊은 곳에서 빛과 소리가 새어나온다. 누군가가 여기서 살고 있다.',
    category: 'chain',
    triggerConditions: {
      dayRange: [50, 120],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: ['underground_entrance_found'],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: 'underground',
      chainStep: 2,
    },
    choices: [
      {
        id: 'greet_survivors',
        text: '평화적으로 접근하여 인사한다',
        conditions: null,
        outcomes: [
          {
            weight: 75,
            text: '30명 가량의 생존자들이 지하철 플랫폼을 개조하여 살고 있다! 리더가 환영한다.',
            effects: {
              hp: 30,
              morale: 40,
              fatigue: -30,
              infection: -10,
              items: [
                { id: 'purified_water', qty: 3 },
                { id: 'canned_food', qty: 3 },
                { id: 'first_aid_kit', qty: 1 },
              ],
              flags: { underground_city_found: true, underground_complete: true },
            },
          },
          {
            weight: 25,
            text: '경계를 풀지 않는 그들. 하지만 최소한의 교역은 허용한다.',
            effects: {
              morale: 15,
              items: [
                { id: 'purified_water', qty: 2 },
                { id: 'canned_food', qty: 1 },
              ],
              flags: { underground_city_found: true, underground_complete: true },
            },
          },
        ],
      },
      {
        id: 'offer_supplies',
        text: '물자를 선물하며 신뢰를 쌓는다',
        conditions: { requiredItems: ['canned_food'] },
        outcomes: [
          {
            weight: 100,
            text: '아낌없는 나눔에 생존자들이 감동한다. 비밀 교역로와 안전가옥을 알려준다.',
            effects: {
              removeItems: [{ id: 'canned_food', qty: 3 }],
              morale: 50,
              hp: 20,
              fatigue: -20,
              revealHiddenLocation: 'hidden_yangcheon_mokdong_bunker',
              items: [
                { id: 'purified_water', qty: 5 },
                { id: 'antibiotics', qty: 2 },
              ],
              flags: { underground_city_allied: true, underground_complete: true },
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // LATE EVENTS (D100+) — 8 events
  // ============================================================

  // 17. event_helicopter_signal
  {
    id: 'event_helicopter_signal',
    name: '헬기 신호',
    icon: '🚁',
    description: '라디오에서 군 헬기의 교신이 잡혔다! 구출 가능성이 보인다.',
    category: 'late',
    triggerConditions: {
      dayRange: [150, 999],
      timeOfDay: null,
      requiredItems: ['radio'],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'respond_signal',
        text: '무전으로 응답한다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '"생존자 확인. 착륙 가능 지점 좌표를 송신하라." 구출 엔딩의 실마리를 잡았다!',
            effects: {
              morale: 50,
              flags: { helicopter_contact: true, rescue_ending_prep: true },
            },
          },
          {
            weight: 25,
            text: '교신이 끊겼다. 하지만 주파수를 기록해두었다. 다시 시도할 수 있다.',
            effects: {
              morale: 15,
              flags: { helicopter_frequency: true },
            },
          },
          {
            weight: 15,
            text: '응답했지만 약탈자들도 같은 주파수를 듣고 있었다!',
            effects: {
              morale: 10,
              noise: 20,
              flags: { helicopter_frequency: true, raiders_alerted: true },
            },
          },
        ],
      },
      {
        id: 'prepare_signal_fire',
        text: '연료로 신호 화염을 준비한다',
        conditions: { requiredItems: ['fuel_can'] },
        outcomes: [
          {
            weight: 80,
            text: '거대한 신호 화염이 올라간다! 헬기가 방향을 바꾸고 있다.',
            effects: {
              removeItems: [{ id: 'fuel_can', qty: 1 }],
              morale: 40,
              noise: 40,
              flags: { helicopter_contact: true, rescue_ending_prep: true },
            },
          },
          {
            weight: 20,
            text: '화염이 너무 약하다. 헬기는 그대로 지나갔다.',
            effects: {
              removeItems: [{ id: 'fuel_can', qty: 1 }],
              morale: -10,
              noise: 20,
            },
          },
        ],
      },
      {
        id: 'ignore_helicopter',
        text: '함정일 수 있다. 무시한다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '헬기 소리가 멀어져간다. 정말 군이었을까, 아니면...',
            effects: { morale: -10 },
          },
        ],
      },
    ],
  },

  // 18. event_last_winter
  {
    id: 'event_last_winter',
    name: '마지막 겨울',
    icon: '❄️',
    description: '기록적인 한파가 덮친다. 체온이 급격히 떨어지고 있다. 연료가 필요하다.',
    category: 'late',
    triggerConditions: {
      dayRange: [300, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: 'winter',
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'search_fuel',
        text: '연료를 찾아 나선다',
        conditions: null,
        outcomes: [
          {
            weight: 50,
            text: '폐차장에서 연료통을 발견했다! 당분간 버틸 수 있다.',
            effects: {
              items: [
                { id: 'fuel_can', qty: 2 },
              ],
              fatigue: 20,
              hp: -5,
              morale: 10,
            },
          },
          {
            weight: 30,
            text: '연료는 찾지 못했지만 태울 수 있는 목재를 구했다.',
            effects: {
              items: [
                { id: 'wood', qty: 5 },
              ],
              fatigue: 25,
              hp: -10,
            },
          },
          {
            weight: 20,
            text: '한파 속에서 길을 잃었다. 가까스로 돌아왔지만 심하게 탈진했다.',
            effects: {
              hp: -20,
              fatigue: 40,
              morale: -15,
              infection: 10,
            },
          },
        ],
      },
      {
        id: 'dismantle_structures',
        text: '불필요한 구조물을 해체하여 땔감으로 쓴다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '쓰지 않는 바리케이드와 상자를 해체했다. 화덕에 불이 타오른다.',
            effects: {
              items: [
                { id: 'wood', qty: 4 },
                { id: 'scrap_metal', qty: 2 },
              ],
              structureDamage: 15,
              morale: 5,
            },
          },
        ],
      },
      {
        id: 'huddle_together',
        text: '체온을 나누며 버틴다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '서로의 체온으로 밤을 버텼다. 하지만 체력 소모가 심하다.',
            effects: {
              hp: -10,
              fatigue: 20,
              morale: 5,
            },
          },
          {
            weight: 40,
            text: '추위가 너무 심하다. 동상 증세가 나타난다.',
            effects: {
              hp: -25,
              fatigue: 30,
              infection: 5,
              morale: -10,
            },
          },
        ],
      },
    ],
  },

  // 19. event_cure_broadcast
  {
    id: 'event_cure_broadcast',
    name: '치료제 방송',
    icon: '💉',
    description: '라디오에서 놀라운 소식이 들린다. 감염 치료제가 개발되었다는 방송이다!',
    category: 'late',
    triggerConditions: {
      dayRange: [200, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'doctor',
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'follow_broadcast',
        text: '방송 좌표를 따라간다',
        conditions: null,
        outcomes: [
          {
            weight: 50,
            text: '연구소에 도착했다! 의사가 잔존 데이터를 분석하여 치료 실마리를 발견한다.',
            effects: {
              morale: 60,
              infection: -30,
              items: [
                { id: 'antibiotics', qty: 3 },
                { id: 'surgery_kit', qty: 1 },
              ],
              flags: { cure_data_found: true, special_ending_prep: true },
            },
          },
          {
            weight: 30,
            text: '연구소는 파괴되었지만 일부 샘플이 남아있다. 의사가 분석을 시작한다.',
            effects: {
              morale: 20,
              items: [
                { id: 'antibiotics', qty: 2 },
              ],
              flags: { cure_sample_found: true },
            },
          },
          {
            weight: 20,
            text: '함정이었다. 약탈자들이 매복해 있다!',
            effects: {
              combat: { enemyId: 'raider_elite', count: 3 },
              morale: -20,
            },
          },
        ],
      },
      {
        id: 'verify_broadcast',
        text: '의사와 함께 방송의 진위를 분석한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '의학 용어와 주파수를 분석한 결과 실제 군 의료 방송으로 확인된다.',
            effects: {
              morale: 30,
              flags: { cure_broadcast_verified: true },
            },
          },
          {
            weight: 30,
            text: '분석 결과 약탈자들의 미끼 방송일 가능성이 높다.',
            effects: {
              morale: -5,
              flags: { cure_broadcast_fake: true },
            },
          },
        ],
      },
      {
        id: 'ignore_broadcast',
        text: '너무 좋은 소식은 의심한다. 무시한다.',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '방송을 무시했다. 희망과 의심 사이에서 마음이 흔들린다.',
            effects: { morale: -5 },
          },
        ],
      },
    ],
  },

  // 20. event_raider_alliance
  {
    id: 'event_raider_alliance',
    name: '약탈자 동맹 제안',
    icon: '🤝',
    description: '약탈자 두목이 직접 찾아왔다. "같이 손잡자. 서로 죽일 필요 없잖아?"',
    category: 'late',
    triggerConditions: {
      dayRange: [80, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 40,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'accept_alliance',
        text: '동맹을 수락한다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '약탈자들이 물자를 보내고 적대 행동을 중단한다. 불안하지만 유용하다.',
            effects: {
              items: [
                { id: 'pistol_ammo', qty: 15 },
                { id: 'canned_food', qty: 5 },
                { id: 'scrap_metal', qty: 5 },
              ],
              morale: 10,
              flags: { raider_alliance: true },
            },
          },
          {
            weight: 40,
            text: '동맹은 맺었지만 그들은 점점 더 많은 것을 요구하기 시작한다.',
            effects: {
              items: [
                { id: 'pistol_ammo', qty: 10 },
              ],
              morale: -5,
              flags: { raider_alliance: true, raider_demanding: true },
            },
          },
        ],
      },
      {
        id: 'reject_fight',
        text: '거절하고 전투 태세를 갖춘다',
        conditions: null,
        outcomes: [
          {
            weight: 55,
            text: '"그럼 후회하게 될 거다." 두목이 돌아간다. 앞으로 공격이 심해질 것이다.',
            effects: {
              morale: 5,
              flags: { raider_enemy: true },
            },
          },
          {
            weight: 45,
            text: '두목이 즉석에서 공격을 명령한다!',
            effects: {
              combat: { enemyId: 'raider_elite', count: 2 },
              noise: 25,
              flags: { raider_enemy: true },
            },
          },
        ],
      },
      {
        id: 'turn_raiders',
        text: '부하들을 포섭하여 두목을 배신하게 만든다',
        conditions: null,
        outcomes: [
          {
            weight: 35,
            text: '불만을 품은 부하 3명이 탈영하여 합류한다. 무장과 정보를 가져왔다!',
            effects: {
              items: [
                { id: 'pistol_ammo', qty: 20 },
                { id: 'first_aid_kit', qty: 2 },
                { id: 'map_fragment', qty: 1 },
              ],
              morale: 25,
              flags: { raiders_turned: true },
            },
          },
          {
            weight: 40,
            text: '포섭 시도가 발각되었다! 두목이 분노한다.',
            effects: {
              combat: { enemyId: 'raider_elite', count: 3 },
              morale: -10,
              flags: { raider_enemy: true },
            },
          },
          {
            weight: 25,
            text: '부하 1명이 몰래 정보를 넘겨준다. 두목은 눈치채지 못했다.',
            effects: {
              items: [
                { id: 'map_fragment', qty: 1 },
              ],
              morale: 10,
              flags: { raider_insider: true },
            },
          },
        ],
      },
    ],
  },

  // 21. event_mystery_signal
  {
    id: 'event_mystery_signal',
    name: '미스터리 신호',
    icon: '🌕',
    description: '보름달이 뜬 밤, 라디오에서 암호화된 좌표가 반복 송출된다.',
    category: 'late',
    triggerConditions: {
      dayRange: [100, 999],
      timeOfDay: 'night',
      requiredItems: ['radio'],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'decode_signal',
        text: '전자부품으로 신호를 해독한다',
        conditions: { requiredItems: ['electronic_parts'] },
        outcomes: [
          {
            weight: 75,
            text: '좌표 해독 성공! 서울시청 지하 금고의 위치를 알아냈다.',
            effects: {
              removeItems: [{ id: 'electronic_parts', qty: 1 }],
              revealHiddenLocation: 'hidden_junggoo_city_hall_safe',
              morale: 25,
              flags: { city_hall_vault_known: true },
            },
          },
          {
            weight: 25,
            text: '해독에 실패했다. 부품만 낭비했다.',
            effects: {
              removeItems: [{ id: 'electronic_parts', qty: 1 }],
              morale: -5,
            },
          },
        ],
      },
      {
        id: 'record_signal',
        text: '신호를 기록해둔다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '신호 패턴을 메모했다. 나중에 해독할 수 있을 것이다.',
            effects: {
              morale: 5,
              flags: { mystery_signal_recorded: true },
            },
          },
        ],
      },
      {
        id: 'follow_signal_blind',
        text: '좌표 방향으로 무작정 향한다',
        conditions: null,
        outcomes: [
          {
            weight: 40,
            text: '직감이 맞았다! 시청 근처에서 금고 입구의 단서를 찾는다.',
            effects: {
              fatigue: 20,
              morale: 15,
              flags: { city_hall_vault_hint: true },
            },
          },
          {
            weight: 35,
            text: '엉뚱한 곳에 도착했다. 시간과 체력만 낭비했다.',
            effects: {
              fatigue: 30,
              morale: -10,
            },
          },
          {
            weight: 25,
            text: '이동 중 야간 좀비 무리와 맞닥뜨렸다!',
            effects: {
              combat: { enemyId: 'zombie_horde', count: 1 },
              fatigue: 15,
            },
          },
        ],
      },
    ],
  },

  // 22. event_aftershock
  {
    id: 'event_aftershock',
    name: '여진',
    icon: '🌋',
    description: '땅이 갑자기 흔들린다! 건물에서 먼지가 쏟아지고 벽에 금이 간다.',
    category: 'late',
    triggerConditions: {
      dayRange: [120, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 0.01,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'take_cover',
        text: '즉시 안전한 곳으로 대피한다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '튼튼한 문틀 아래로 대피했다. 진동이 멈추자 주변 지형이 변해있다.',
            effects: {
              revealHiddenLocation: 'hidden_dongjak_cemetery_vault',
              structureDamage: 15,
              morale: 5,
            },
          },
          {
            weight: 40,
            text: '대피 중 낙하물에 맞았다! 다행히 경미한 부상이다.',
            effects: {
              hp: -10,
              structureDamage: 15,
              morale: -5,
            },
          },
        ],
      },
      {
        id: 'rescue_trapped',
        text: '무너진 건물에서 생존자를 구한다',
        conditions: null,
        outcomes: [
          {
            weight: 50,
            text: '잔해 속에서 생존자를 구출했다! 보답으로 숨겨둔 물자를 알려준다.',
            effects: {
              hp: -5,
              fatigue: 20,
              morale: 20,
              items: [
                { id: 'canned_food', qty: 3 },
                { id: 'purified_water', qty: 2 },
              ],
              structureDamage: 15,
            },
          },
          {
            weight: 30,
            text: '잔해가 너무 무겁다. 결국 구하지 못했다.',
            effects: {
              hp: -15,
              fatigue: 25,
              morale: -15,
              structureDamage: 15,
            },
          },
          {
            weight: 20,
            text: '구조 도중 2차 붕괴가 발생했다!',
            effects: {
              hp: -25,
              fatigue: 30,
              structureDamage: 25,
            },
          },
        ],
      },
      {
        id: 'explore_rubble',
        text: '지진으로 드러난 새로운 장소를 탐색한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '지반 침하로 지하 시설이 노출되었다! 숨겨진 장소가 해금된다.',
            effects: {
              revealHiddenLocation: 'hidden_dongjak_cemetery_vault',
              items: [
                { id: 'scrap_metal', qty: 3 },
                { id: 'electronic_parts', qty: 2 },
              ],
              structureDamage: 15,
              morale: 10,
            },
          },
          {
            weight: 30,
            text: '불안정한 잔해가 무너져 내린다!',
            effects: {
              hp: -15,
              structureDamage: 15,
              morale: -5,
            },
          },
        ],
      },
    ],
  },

  // 23. event_eclipse
  {
    id: 'event_eclipse',
    name: '일식',
    icon: '🌑',
    description: '하늘이 갑자기 어두워진다. 일식이 시작되었다. 좀비들이 혼란에 빠지고, 약탈자들은 이 기회를 노린다.',
    category: 'late',
    triggerConditions: {
      dayRange: [180, 180],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'hunt_zombies',
        text: '혼란에 빠진 좀비들을 사냥한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '일식 동안 좀비들이 무력화되었다! 대량의 전리품을 확보한다.',
            effects: {
              items: [
                { id: 'cloth', qty: 5 },
                { id: 'scrap_metal', qty: 3 },
                { id: 'bandage', qty: 3 },
              ],
              morale: 20,
              noise: 10,
            },
          },
          {
            weight: 30,
            text: '좀비는 약해졌지만 약탈자들이 배회하고 있다!',
            effects: {
              combat: { enemyId: 'raider', count: 2 },
              noise: 15,
            },
          },
        ],
      },
      {
        id: 'raid_during_eclipse',
        text: '어둠을 이용해 위험 구역을 탐색한다',
        conditions: null,
        outcomes: [
          {
            weight: 55,
            text: '평소 접근 불가능하던 구역에서 귀중한 물자를 발견했다!',
            effects: {
              items: [
                { id: 'military_ration', qty: 2 },
                { id: 'pistol_ammo', qty: 10 },
                { id: 'first_aid_kit', qty: 1 },
              ],
              morale: 25,
            },
          },
          {
            weight: 25,
            text: '어둠 속에서 정예 약탈자 부대와 마주쳤다!',
            effects: {
              combat: { enemyId: 'raider_elite', count: 2 },
            },
          },
          {
            weight: 20,
            text: '일식이 끝나자 좀비들이 다시 활성화된다! 서둘러 도망쳐야 한다.',
            effects: {
              fatigue: 20,
              morale: -5,
              noise: 10,
            },
          },
        ],
      },
      {
        id: 'fortify_base',
        text: '약탈자들에 대비하여 기지를 방어한다',
        conditions: null,
        outcomes: [
          {
            weight: 65,
            text: '약탈자들이 접근했지만 준비된 방어선에 물러났다. 기지가 안전하다.',
            effects: {
              morale: 15,
            },
          },
          {
            weight: 35,
            text: '약탈자 습격을 격퇴했다! 전리품을 노획한다.',
            effects: {
              combat: { enemyId: 'raider', count: 2 },
              items: [
                { id: 'pistol_ammo', qty: 5 },
                { id: 'canned_food', qty: 2 },
              ],
            },
          },
        ],
      },
      {
        id: 'observe_eclipse',
        text: '일식을 관찰하며 기록한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '12TP 동안 하늘이 어둡다. 좀비 -80%, 레이더 +100%. 기록을 남긴다.',
            effects: {
              morale: 10,
              flags: { eclipse_observed: true },
            },
          },
        ],
      },
    ],
  },

  // 24. event_spring_return
  {
    id: 'event_spring_return',
    name: '봄의 귀환',
    icon: '🌸',
    description: '1년이 지났다. 다시 봄이 왔다. 폐허 사이로 꽃이 피어난다. 세상은 여전히 살아있다.',
    category: 'late',
    triggerConditions: {
      dayRange: [365, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: null,
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'celebrate_survival',
        text: '1주년을 기념한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '1년을 살아남았다. 자연이 회복되듯 우리도 계속될 것이다. 감염율이 영구 감소한다.',
            effects: {
              morale: 50,
              hp: 20,
              infection: -10,
              flags: { year_two_unlocked: true, infection_permanent_reduction: true },
            },
          },
        ],
      },
      {
        id: 'plant_garden',
        text: '새 텃밭을 만들어 봄을 맞이한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '따뜻한 봄볕 아래 새싹이 돋아난다. 2년차의 시작이다.',
            effects: {
              morale: 40,
              fatigue: -20,
              infection: -10,
              items: [
                { id: 'purified_water', qty: 3 },
                { id: 'canned_food', qty: 3 },
              ],
              flags: { year_two_unlocked: true, infection_permanent_reduction: true, spring_garden: true },
            },
          },
        ],
      },
      {
        id: 'reflect_silently',
        text: '조용히 지난 1년을 되돌아본다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '잃은 것도 많지만, 살아남았다. 그것만으로 충분하다.',
            effects: {
              morale: 30,
              hp: 10,
              fatigue: -15,
              infection: -10,
              flags: { year_two_unlocked: true, infection_permanent_reduction: true },
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // CHARACTER-SPECIFIC EVENTS — 6 events
  // ============================================================

  // 25. event_doctor_colleague
  {
    id: 'event_doctor_colleague',
    name: '병원 동료의 편지',
    icon: '✉️',
    description: '삼성병원 간호사 라커에서 동료의 편지를 발견했다. 세브란스 연구소의 비밀번호가 적혀 있다.',
    category: 'character',
    triggerConditions: {
      dayRange: [30, 80],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'doctor',
      weather: null,
      season: null,
      minKills: 0,
      district: 'gangnam',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'keep_letter',
        text: '편지를 보관한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '편지에 세브란스 지하 연구실의 접근 코드가 적혀 있다. 나중에 유용할 것이다.',
            effects: {
              morale: 10,
              flags: { severance_code_found: true },
            },
          },
        ],
      },
      {
        id: 'analyze_notes',
        text: '편지에 첨부된 연구 메모를 분석한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '동료가 감염 초기에 기록한 데이터다. 의료 지식이 깊어진다.',
            effects: {
              morale: 15,
              items: [
                { id: 'antibiotics', qty: 1 },
              ],
              flags: { severance_code_found: true, colleague_data_analyzed: true },
            },
          },
        ],
      },
    ],
  },

  // 26. event_soldier_last_order
  {
    id: 'event_soldier_last_order',
    name: '마지막 군명',
    icon: '🎖️',
    description: '미군기지 지하 벙커에서 암호화된 마지막 군명을 발견했다. "서울 포기. 전원 철수."',
    category: 'character',
    triggerConditions: {
      dayRange: [50, 120],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'soldier',
      weather: null,
      season: null,
      minKills: 0,
      district: 'yongsan',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'follow_order',
        text: '명령을 따른다 — 탈출을 준비한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '군인은 명령을 따른다. 탈출 루트를 확인했다. 경기도 방향 좌표가 기록되어 있다.',
            effects: {
              morale: 5,
              items: [
                { id: 'map_fragment', qty: 1 },
              ],
              flags: { last_order_followed: true, escape_route_known: true },
            },
          },
        ],
      },
      {
        id: 'disobey_order',
        text: '명령을 거부한다 — 서울을 지킨다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '"여기 아직 사람이 있다." 명령서를 찢었다. 사기가 크게 오른다.',
            effects: {
              morale: 25,
              flags: { last_order_defied: true },
            },
          },
        ],
      },
    ],
  },

  // 27. event_fire_family_photo
  {
    id: 'event_fire_family_photo',
    name: '가족사진',
    icon: '📸',
    description: '이동 중 무너진 집에서 다른 가족의 사진을 발견했다. 내 가족은 무사할까.',
    category: 'character',
    triggerConditions: {
      dayRange: [10, 40],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'firefighter',
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'keep_photo',
        text: '사진을 간직한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '누군가의 행복했던 순간. 내 가족도 이렇게 웃고 있었으면. 무거운 마음이지만 힘이 된다.',
            effects: {
              morale: 10,
              fatigue: 15,
              flags: { family_photo_kept: true },
            },
          },
        ],
      },
      {
        id: 'leave_photo',
        text: '사진을 내려놓는다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '감상에 빠질 시간이 없다. 빨리 은평에 가야 한다.',
            effects: {
              morale: -5,
            },
          },
        ],
      },
    ],
  },

  // 28. event_homeless_old_office
  {
    id: 'event_homeless_old_office',
    name: '옛 사무실',
    icon: '🏢',
    description: '한때 네 건설회사가 있던 건물 앞을 지나고 있다. 금고에 비상금이 남아있을지도.',
    category: 'character',
    triggerConditions: {
      dayRange: [40, 100],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'homeless',
      weather: null,
      season: null,
      minKills: 0,
      district: 'gangnam',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'open_safe',
        text: '금고를 연다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '금고 안에 돈다발과 비상 물자가 있었다. 돈은 쓸모없지만, 물자는 소중하다.',
            effects: {
              items: [
                { id: 'canned_food', qty: 3 },
                { id: 'first_aid_kit', qty: 1 },
              ],
              morale: 15,
              flags: { old_office_visited: true },
            },
          },
          {
            weight: 30,
            text: '금고는 이미 털렸다. 하지만 서랍 속에 밀봉된 생수가 남아있었다.',
            effects: {
              items: [
                { id: 'clean_water', qty: 2 },
              ],
              morale: 5,
              flags: { old_office_visited: true },
            },
          },
        ],
      },
      {
        id: 'pass_office',
        text: '지나친다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '과거는 과거다. 뒤돌아보지 않는다. 하지만 마음이 무겁다.',
            effects: { morale: -10 },
          },
        ],
      },
    ],
  },

  // 29. event_chef_supply_cache
  {
    id: 'event_chef_supply_cache',
    name: '호텔 식자재 창고',
    icon: '📦',
    description: '명동 소피텔 호텔의 지하 식자재 창고를 발견했다. 아직 쓸 만한 재료가 남아 있다.',
    category: 'character',
    triggerConditions: {
      dayRange: [35, 80],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'chef',
      weather: null,
      season: null,
      minKills: 0,
      district: 'junggoo',
      probability: 1.0,
      requiredFlags: ['chef_hotel_visited'],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'salvage_supplies',
        text: '식자재를 정리하여 비축한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '보존 상태가 좋은 식자재들. 급식소 운영에 큰 도움이 될 것이다.',
            effects: {
              morale: 20,
              items: [
                { id: 'canned_food', qty: 2 },
              ],
              flags: { chef_supply_cache_found: true },
            },
          },
        ],
      },
      {
        id: 'share_records',
        text: '다른 생존자에게 데이터를 공유한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '데이터를 복사하여 나누어주었다. 혹시 다른 의료인이 활용할 수 있을지도 모른다.',
            effects: {
              morale: 25,
              flags: { patient_data_shared: true },
            },
          },
        ],
      },
    ],
  },

  // 30. event_engineer_blueprint
  {
    id: 'event_engineer_blueprint',
    name: '아버지의 설계도',
    icon: '📜',
    description: '성수동 공장에서 돌아가신 아버지의 설계도를 발견했다. 연료 없이 달리는 기계의 원형이다.',
    category: 'character',
    triggerConditions: {
      dayRange: [30, 80],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'engineer',
      weather: null,
      season: null,
      minKills: 0,
      district: 'seongdong',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'study_blueprint',
        text: '설계도를 연구한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '아버지의 필체. "태양열 집열판 → 전기 모터 → 벨트 구동." 이것이면 연료 없이 움직일 수 있다.',
            effects: {
              morale: 20,
              items: [
                { id: 'scrap_metal', qty: 2 },
              ],
              flags: { father_blueprint_found: true },
            },
          },
        ],
      },
      {
        id: 'build_prototype',
        text: '설계도대로 바로 제작을 시도한다',
        conditions: { requiredItems: ['scrap_metal'] },
        outcomes: [
          {
            weight: 60,
            text: '프로토타입 제작 성공! 작지만 작동하는 모터가 만들어졌다.',
            effects: {
              removeItems: [{ id: 'scrap_metal', qty: 2 }],
              morale: 25,
              items: [
                { id: 'electronic_parts', qty: 2 },
              ],
              flags: { father_blueprint_found: true, prototype_built: true },
            },
          },
          {
            weight: 40,
            text: '재료가 부족하다. 하지만 설계 원리는 이해했다.',
            effects: {
              removeItems: [{ id: 'scrap_metal', qty: 1 }],
              morale: 10,
              flags: { father_blueprint_found: true },
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // CHARACTER EVENTS — 캐릭터 전용 구역 방문 이벤트 (6개)
  // ============================================================

  {
    id: 'event_soldier_yongsan',
    name: '용산의 기억',
    icon: '⚔️',
    description: '용산 미군기지. 여기서 모든 것이 시작됐다.',
    category: 'character',
    triggerConditions: {
      dayRange: [1, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'soldier',
      weather: null,
      season: null,
      minKills: 0,
      district: 'yongsan',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'search_armory',
        text: '무기고를 수색한다',
        conditions: null,
        outcomes: [
          {
            weight: 70,
            text: '미군 무기고의 잠금이 풀려 있었다. 탄약과 장비를 발견했다.',
            effects: {
              items: [{ id: 'pistol_ammo', qty: 3 }, { id: 'bandage', qty: 2 }],
              morale: 10,
              flags: { soldier_yongsan_searched: true },
            },
          },
          {
            weight: 30,
            text: '무기고에 이미 감염자 둘이 있었다.',
            effects: {
              combat: { enemyId: 'zombie_soldier', count: 2 },
            },
          },
        ],
      },
      {
        id: 'pay_respects',
        text: '동료들을 추모한다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '팀원 4명의 이름을 벽에 새겼다. 잊지 않겠다는 다짐.',
            effects: {
              morale: 15,
              mental: { trauma: -10, anxiety: -5 },
              flags: { soldier_yongsan_searched: true },
            },
          },
        ],
      },
    ],
  },

  {
    id: 'event_doctor_samsung',
    name: '삼성병원의 기억',
    icon: '🩺',
    description: '강남 삼성서울병원. 지옥이 시작된 곳.',
    category: 'character',
    triggerConditions: {
      dayRange: [1, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'doctor',
      weather: null,
      season: null,
      minKills: 0,
      district: 'gangnam',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'search_pharmacy',
        text: '약품 창고를 다시 뒤진다',
        conditions: null,
        outcomes: [
          {
            weight: 80,
            text: '아직 손대지 않은 약품이 남아 있었다. 전문의의 눈은 다르다.',
            effects: {
              items: [{ id: 'painkiller', qty: 2 }, { id: 'antiseptic', qty: 1 }],
              morale: 8,
              flags: { doctor_samsung_searched: true },
            },
          },
          {
            weight: 20,
            text: '이미 약탈당한 창고. 하지만 메모 한 장을 발견했다.',
            effects: {
              morale: 5,
              flags: { doctor_samsung_searched: true },
            },
          },
        ],
      },
    ],
  },

  {
    id: 'event_firefighter_home',
    name: '은평구, 집',
    icon: '🏠',
    description: '불광동 집. 가족이 있는 곳.',
    category: 'character',
    triggerConditions: {
      dayRange: [1, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'firefighter',
      weather: null,
      season: null,
      minKills: 0,
      district: 'eunpyeong',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'search_family',
        text: '집으로 달려간다',
        conditions: null,
        outcomes: [
          {
            weight: 60,
            text: '집은 비어 있었다. 하지만 냉장고 위에 메모가 있었다. "영철아, 우리 먼저 간다. 처가 쪽으로." 살아있다.',
            effects: {
              morale: 25,
              mental: { trauma: -15 },
              flags: { firefighter_family_found: true },
            },
          },
          {
            weight: 40,
            text: '집 근처에서 감염자들을 발견했다. 하지만 집 안은 안전했다. 가족의 흔적이 남아 있다.',
            effects: {
              morale: 10,
              items: [{ id: 'canned_food', qty: 2 }],
              flags: { firefighter_family_found: true },
            },
          },
        ],
      },
    ],
  },

  {
    id: 'event_homeless_hangang',
    name: '동호대교 아래',
    icon: '🌉',
    description: '2년을 살았던 곳. 낯설지 않다.',
    category: 'character',
    triggerConditions: {
      dayRange: [1, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'homeless',
      weather: null,
      season: null,
      minKills: 0,
      district: 'seongdong',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'old_stash',
        text: '오래된 은신처를 찾는다',
        conditions: null,
        outcomes: [
          {
            weight: 90,
            text: '2년 전 숨겨둔 비상 캐시. 아무도 몰랐다. 담요 하나와 통조림이 남아 있었다.',
            effects: {
              items: [{ id: 'canned_food', qty: 2 }, { id: 'cloth', qty: 1 }],
              morale: 10,
              flags: { homeless_stash_found: true },
            },
          },
        ],
      },
    ],
  },

  {
    id: 'event_chef_hotel_kitchen',
    name: '명동 호텔 주방',
    icon: '🍳',
    description: '내 주방. 마지막으로 요리했던 곳.',
    category: 'character',
    triggerConditions: {
      dayRange: [1, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'chef',
      weather: null,
      season: null,
      minKills: 0,
      district: 'junggoo',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'check_kitchen',
        text: '주방을 뒤져본다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '호텔 주방에 아직 쓸 만한 조리 도구와 양념이 남아 있었다. 셰프의 감각이 되살아난다.',
            effects: {
              items: [{ id: 'salt', qty: 2 }],
              morale: 12,
              flags: { chef_hotel_visited: true },
            },
          },
        ],
      },
    ],
  },

  {
    id: 'event_engineer_factory',
    name: '성수동 공장',
    icon: '🔧',
    description: '내 작업장. 여기서 무언가 만들 수 있다.',
    category: 'character',
    triggerConditions: {
      dayRange: [1, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'engineer',
      weather: null,
      season: null,
      minKills: 0,
      district: 'seongdong',
      probability: 1.0,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'salvage_workshop',
        text: '작업장을 정리한다',
        conditions: null,
        outcomes: [
          {
            weight: 75,
            text: '공장 설비가 손상됐지만 자재는 남아 있다. 익숙한 손길로 부품을 챙긴다.',
            effects: {
              items: [{ id: 'scrap_metal', qty: 3 }, { id: 'wire', qty: 2 }],
              morale: 10,
              flags: { engineer_factory_salvaged: true },
            },
          },
          {
            weight: 25,
            text: '공장 안에 감염자가 있었다. 동료였을 수 있다.',
            effects: {
              combat: { enemyId: 'zombie_worker', count: 2 },
              flags: { engineer_factory_salvaged: true },
            },
          },
        ],
      },
    ],
  },

  // ── 의사 전용: 감염된 생존자 치료 이벤트 ──────────────────
  {
    id: 'evt_doctor_patient',
    name: '감염된 생존자',
    icon: '🩹',
    description: '탐색 중 감염된 생존자를 발견했다. 고열에 시달리며 도움을 구하고 있다.',
    category: 'character',
    triggerConditions: {
      dayRange: [3, 999],
      timeOfDay: null,
      requiredItems: [],
      requiredCharacter: 'doctor',
      weather: null,
      season: null,
      minKills: 0,
      district: null,
      probability: 0.12,
      requiredFlags: [],
      minHp: 0,
      maxNoise: 100,
      minItemsFound: 0,
      chainId: null,
      chainStep: 0,
    },
    choices: [
      {
        id: 'treat_survivor',
        text: '치료를 시도한다',
        conditions: null,
        outcomes: [
          {
            weight: 75,
            text: '치료에 성공했다. 생존자가 감사하며 가진 물자를 나눠줬다.',
            effects: {
              morale: 15,
              items: [
                { id: 'bandage', qty: 2 },
                { id: 'herb', qty: 2 },
              ],
              flags: { doctor_patient_treated: true },
            },
          },
          {
            weight: 25,
            text: '치료를 시도했지만 상태가 너무 심각했다. 감염 위험에 노출됐다.',
            effects: {
              infection: 10,
              morale: -5,
            },
          },
        ],
      },
      {
        id: 'use_supplies',
        text: '의료 물자를 사용해 본격 치료한다',
        conditions: { requiredItems: ['first_aid_kit'] },
        outcomes: [
          {
            weight: 90,
            text: '구급상자를 활용해 완벽히 치료했다. 생존자가 큰 보답을 했다.',
            effects: {
              morale: 20,
              items: [
                { id: 'bandage', qty: 2 },
                { id: 'first_aid_kit', qty: 1 },
                { id: 'herb', qty: 2 },
              ],
              removeItems: [{ id: 'first_aid_kit', qty: 1 }],
              flags: { doctor_patient_treated: true },
            },
          },
          {
            weight: 10,
            text: '최선을 다했지만 이미 늦었다. 물자만 소모됐다.',
            effects: {
              morale: -3,
              removeItems: [{ id: 'first_aid_kit', qty: 1 }],
            },
          },
        ],
      },
      {
        id: 'ignore_survivor',
        text: '지나친다',
        conditions: null,
        outcomes: [
          {
            weight: 100,
            text: '생존자를 두고 떠났다. 마음이 무겁다.',
            effects: { morale: -10 },
          },
        ],
      },
    ],
  },

];

export default SECRET_EVENTS;
