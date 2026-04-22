// === PATIENT POOL — ADULTS (19~60세, 중장년 포함) ===
// 증분 2: 7종 (sponsor 2, dispatch 2, guard 2, 경계 샘플 1)
// 스키마: prompt_plan.md Phase 3 참조.

const ADULTS = {

  // ── 이준호 (16·남) — 고교 식물부, dispatch 샘플 ─────────────────
  patient_lee_junho_16: {
    id: 'patient_lee_junho_16',
    name: '이준호',
    age: 16,
    gender: 'male',
    ageBracket: 'youth',
    portraitIcon: '🧑',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['팔뚝 찰과상', '탈수'],
    admissionDialogue: '"…선생님, 저 괜찮아요… 그냥… 좀 쉬면…"',

    hiddenBackground: {
      profession: 'highschool_botany',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"죄송해요, 멀쩡한 척했는데 다리가 풀려서…"',
            '"학교 식물부 활동하다 봉쇄에 휩쓸렸어요."',
            '"온실 열쇠, 아직 제가 가지고 있어요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"저희 학교 온실, 허브 씨앗 종류가 꽤 많아요."',
            '"북한산 자락 쪽 학교라 오염도 덜 됐을 거예요."',
            '"몸 좀 나아지면 제가 가서 구해올 수 있어요."',
            '"저 진짜 식물 잘 키워요. 대회도 나갔어요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"선생님 고맙습니다. 저 진짜 괜찮아졌어요."',
            '"약속대로 학교 다녀올게요. 5일이면 충분해요."',
            '"돌아오면 꼭 말씀드릴게요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'dispatch',
      immediate: [
        { id: 'herb_seed', qty: 1 },
      ],
      dispatch: {
        targetDistrict: 'gangbuk',
        intervalDays:   5,
        maxRuns:        6,
        injuryChance:   0.08,
        yield: [
          { id: 'herb',      qty: 2, chance: 0.8 },
          { id: 'herb_seed', qty: 1, chance: 0.5 },
        ],
      },
    },
  },

  // ── 윤태현 (27·남) — 경찰 준비생, guard 샘플 ────────────────────
  patient_yoon_taehyun_27: {
    id: 'patient_yoon_taehyun_27',
    name: '윤태현',
    age: 27,
    gender: 'male',
    ageBracket: 'youth',
    portraitIcon: '👮',

    woundLevel: 3,
    disease: null,
    visibleSymptoms: ['어깨 관통상', '쇼크', '출혈'],
    admissionDialogue: '"…같이 있던 사람들을 지키려다…"',

    hiddenBackground: {
      profession: 'police_candidate',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"감사합니다… 정말 죽는 줄 알았어요."',
            '"저는 경찰 준비하다 사태 났어요."',
            '"체포술, 사격, 경호 훈련은 거의 다 받았어요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"이렇게 보호받는 게 익숙하지 않네요."',
            '"원래 제가 지키는 쪽이었는데…"',
            '"몸 회복되면 저도 여기 지킬 수 있어요."',
            '"병원 근처 감염자 순찰, 습격 대응 훈련돼 있어요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"덕분에 다시 섭니다. 이 빚은 제 몸으로 갚을게요."',
            '"여기 상주해도 될까요. 식량은 최소만 쓰겠습니다."',
            '"습격이 오면 앞에 서겠습니다."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'guard',
      immediate: [
        { id: 'pistol_ammo', qty: 4 },
      ],
      guard: {
        combatDmg:      14,
        safetyAdd:      0.06,
        foodCostPerDay: 1,
        moraleBonus:    2,
      },
    },
  },

  patient_park_jiyoung_42: {
    id: 'patient_park_jiyoung_42',
    name: '박지영',
    age: 42,
    gender: 'female',
    ageBracket: 'middle',
    portraitIcon: '👩',

    // ── 표면 정보 ───────────────────────────────────────
    woundLevel: 3,
    disease: 'infection_mild',
    visibleSymptoms: ['다리 열상', '발열', '출혈'],
    admissionDialogue: '"…아파요… 도와… 주세요…"',

    // ── 숨겨진 배경 ─────────────────────────────────────
    hiddenBackground: {
      profession: 'gardener',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"…고맙습니다. 피가 멈추질 않아서 정신이 아찔했어요."',
            '"제 이름은 박지영이에요. 마흔둘이고요."',
            '"농원에서 일하다 변을 당했어요. 대피하다 철조망에 긁혔어요."',
            '"아이가 둘 있어요. 지금 어디 있는지…"',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"원예 일을 15년 했어요. 남편이 운영하던 농원이에요."',
            '"방울토마토, 상추, 허브… 종자도 직접 교잡해서 보관했어요."',
            '"씨앗 보관 창고가 안산 쪽에 아직 남아있을 거예요."',
            '"텃밭 운영법도 알려드릴 수 있어요. 회복되면요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"덕분에 살았어요. 다시 걸을 수 있게 됐네요."',
            '"여기, 주머니에 종자 몇 봉지 남아있었어요. 써주세요."',
            '"괜찮아지면 창고도 같이 가봐요. 제가 길을 알아요."',
            '"그리고 혹시 아이들 소식 들으시면 꼭 알려주세요."',
            '"저는 여기 이 응급실, 자주 드나들 수 있어요."',
          ],
        },
      ],
    },

    // ── 완치 후 기여 ────────────────────────────────────
    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'herb_seed', qty: 2 },
        { id: 'herb',      qty: 3 },
      ],
      recurring: {
        items: [{ id: 'herb_seed', qty: 1 }],
        intervalDays: 6,
        maxCount: 5,
      },
    },
  },

  // ── 최소연 (29·여) — 간호사, sponsor(의료) ────────────────────
  patient_choi_soyeon_29: {
    id: 'patient_choi_soyeon_29',
    name: '최소연',
    age: 29,
    gender: 'female',
    ageBracket: 'youth',
    portraitIcon: '👩‍⚕️',

    woundLevel: 2,
    disease: 'infection_mild',
    visibleSymptoms: ['복부 열상', '발열', '탈수'],
    admissionDialogue: '"…선생님… 저도 의료인이에요… 도와… 드릴게요…"',

    hiddenBackground: {
      profession: 'nurse',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"고맙습니다… 피를 너무 많이 흘렸어요."',
            '"저는 최소연, 스물아홉이에요. 대학병원 응급실 간호사였어요."',
            '"같은 병동 사람들을 대피시키다 철근에 찔렸어요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"의료 보급 창고 위치를 알고 있어요. 대학병원 뒤편이요."',
            '"주사기, 소독약, 항생제 — 한 상자씩은 남아 있을 거예요."',
            '"제가 선생님 손이 되어드릴 수 있어요."',
            '"환자 분류, 드레싱, 주사 정도는 혼자 처리 가능합니다."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"이제 일어설 수 있겠어요."',
            '"며칠마다 저희 창고에서 물자를 조금씩 가져올게요."',
            '"의사 선생님 곁에 있고 싶어요. 다시 일하고 싶어요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'bandage',    qty: 3 },
        { id: 'antiseptic', qty: 2 },
      ],
      recurring: {
        items: [
          { id: 'bandage',    qty: 2 },
          { id: 'antiseptic', qty: 1 },
        ],
        intervalDays: 5,
        maxCount: 6,
      },
    },
  },

  // ── 정민호 (34·남) — 전기 엔지니어, dispatch(yongsan) ──────────
  patient_jung_minho_34: {
    id: 'patient_jung_minho_34',
    name: '정민호',
    age: 34,
    gender: 'male',
    ageBracket: 'youth',
    portraitIcon: '👨‍🔧',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['손목 인대 손상', '화상', '탈진'],
    admissionDialogue: '"…배선을 마저 복구하려다… 감전될 뻔했어요…"',

    hiddenBackground: {
      profession: 'electrical_engineer',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"살려주셔서 감사합니다. 숨이 막혀올 정도였어요."',
            '"정민호, 서른넷입니다. 전기·배선 쪽 엔지니어였어요."',
            '"용산 전자상가 근처 작업장에서 부품을 수습하다 당했어요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"용산 전자상가, 아직 손상 덜 된 구역이 남아 있어요."',
            '"전선, 변압기 부품, 소형 모터 같은 게 거기 있을 거예요."',
            '"저를 보내주시면 며칠에 한 번씩 수급 가능합니다."',
            '"위험한 건 알지만… 저 그 동네 구조를 손바닥 보듯 알아요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"이제 손이 다시 움직여요."',
            '"약속드린 대로 용산 다녀오겠습니다."',
            '"한 번 가면 닷새 안에 배선 한 묶음은 가져올게요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'dispatch',
      immediate: [
        { id: 'wire',          qty: 4 },
        { id: 'circuit_board', qty: 1 },
      ],
      dispatch: {
        targetDistrict: 'yongsan',
        intervalDays:   5,
        maxRuns:        5,
        injuryChance:   0.10,
        yield: [
          { id: 'wire',          qty: 3, chance: 0.8 },
          { id: 'circuit_board', qty: 1, chance: 0.5 },
          { id: 'scrap_metal',   qty: 2, chance: 0.7 },
        ],
      },
    },
  },

  // ── 서현우 (45·남) — 전직 경호원, guard ────────────────────────
  patient_seo_hyeonwoo_45: {
    id: 'patient_seo_hyeonwoo_45',
    name: '서현우',
    age: 45,
    gender: 'male',
    ageBracket: 'middle',
    portraitIcon: '🕴️',

    woundLevel: 3,
    disease: null,
    visibleSymptoms: ['복부 관통상', '다발성 타박', '쇼크'],
    admissionDialogue: '"…내 임무는… 그 사람들을 지키는 거였는데…"',

    hiddenBackground: {
      profession: 'bodyguard',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"…눈이 떠지네요. 아직 살아있네."',
            '"서현우입니다. 마흔다섯, 경호 일만 이십 년 했습니다."',
            '"의뢰인을 대피시키다 맞았어요. 대신 맞은 겁니다."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"솔직히 말씀드리면 저는 한 입이 큽니다. 배는 많이 먹어요."',
            '"대신 제가 여기 서 있는 동안은 약탈자도 두 번 생각할 겁니다."',
            '"근접전, 야간 경계, 실내 방어 — 어디든 투입 가능합니다."',
            '"이 병원이 제 마지막 의뢰가 되어도 괜찮습니다."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"은혜는 몸으로 갚는 타입입니다."',
            '"허락해 주시면 병원 앞에 서 있겠습니다."',
            '"밥은 두 사람분 드시는 만큼 상대도 둘 몫을 치울게요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'guard',
      immediate: [
        { id: 'pistol_ammo',          qty: 6 },
        { id: 'sharpened_knife_plus', qty: 1 },
      ],
      guard: {
        combatDmg:      20,
        safetyAdd:      0.10,
        foodCostPerDay: 2,
        moraleBonus:    3,
      },
    },
  },

  // ── 한은지 (38·여) — 도시농부, sponsor(식량) ──────────────────
  patient_han_eunji_38: {
    id: 'patient_han_eunji_38',
    name: '한은지',
    age: 38,
    gender: 'female',
    ageBracket: 'middle',
    portraitIcon: '👩‍🌾',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['다리 열상', '저혈당', '탈진'],
    admissionDialogue: '"…창고에 쌀 포대가… 아직 있어요… 가져가셔요…"',

    hiddenBackground: {
      profession: 'urban_farmer',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"정신이 드네요… 고맙습니다."',
            '"한은지예요. 서른여덟. 관악구에서 도시농업 협동조합 운영했어요."',
            '"조합 창고를 지키다 약탈자들이랑 실랑이가 붙었어요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"우리 조합 창고, 쌀이 3톤쯤 남아 있어요."',
            '"통조림도 협약 업체에서 받은 게 제법 있고요."',
            '"열쇠는 제가 갖고 있고, 지도도 머릿속에 있어요."',
            '"나눠 먹읍시다. 혼자 쥐고 있어봤자 썩어요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"발이 다시 움직이네요. 참 다행이에요."',
            '"며칠마다 조합 창고에서 식량을 조금씩 내려드릴게요."',
            '"선생님 환자들 굶기지 말아야죠."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'rice',        qty: 4 },
        { id: 'canned_food', qty: 3 },
      ],
      recurring: {
        items: [
          { id: 'rice',        qty: 2 },
          { id: 'canned_food', qty: 2 },
        ],
        intervalDays: 7,
        maxCount: 5,
      },
    },
  },

};

export default ADULTS;
