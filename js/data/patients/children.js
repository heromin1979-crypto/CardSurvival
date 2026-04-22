// === PATIENT POOL — CHILDREN (6~18세) ===
// 증분 2: 3종 (sponsor 위주)
// 스키마: prompt_plan.md Phase 3 참조.

const CHILDREN = {

  patient_kim_minseo_11: {
    id: 'patient_kim_minseo_11',
    name: '김민서',
    age: 11,
    gender: 'female',
    ageBracket: 'child',
    portraitIcon: '👧',

    // ── 표면 정보 (환자 선택 UI에 노출) ─────────────────
    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['팔 찰과상', '미열', '두려움'],
    admissionDialogue: '"엄마… 아빠… 어디 있어요…?"',

    // ── 숨겨진 배경 (치료 진행 중 단계적 공개) ────────
    hiddenBackground: {
      profession: 'student_elementary',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"제 이름은 민서예요. 11살이에요."',
            '"학교 가다가 이상한 사람들이 따라와서… 넘어졌어요."',
            '"엄마가 학교 앞에서 기다린다고 했는데…"',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"저 텃밭 가꾸는 거 좋아했어요. 방과후에 꽃도 심었어요."',
            '"선생님이 저더러 손재주가 좋대요."',
            '"씨앗을 주머니에 몇 개 숨겨왔어요… 보실래요?"',
            '"해바라기랑 방울토마토 씨앗이에요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"아저씨, 제가 여기서 식물 키울 수 있을까요?"',
            '"꽃 피면 예뻐질 거예요."',
            '"엄마가 돌아오면 자랑할 거예요."',
            '"치료해주셔서 감사해요."',
          ],
        },
      ],
    },

    // ── 완치 후 기여 ────────────────────────────────────
    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'herb_seed', qty: 2 },
      ],
      recurring: {
        items: [{ id: 'herb_seed', qty: 1 }],
        intervalDays: 7,
        maxCount: 3,
      },
    },
  },

  // ── 박준우 (9·남) — 학교 원예부, sponsor ─────────────────
  patient_park_junwoo_9: {
    id: 'patient_park_junwoo_9',
    name: '박준우',
    age: 9,
    gender: 'male',
    ageBracket: 'child',
    portraitIcon: '👦',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['무릎 찰과상', '두려움', '탈수'],
    admissionDialogue: '"선생님, 저 안 울래요… 그냥 좀 누워있고 싶어요…"',

    hiddenBackground: {
      profession: 'student_elementary',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"선생님 고맙습니다. 저는 준우예요. 아홉 살이에요."',
            '"학교에서 원예부 했어요. 해바라기도 키우고, 상추도 키웠어요."',
            '"가방에 씨앗 봉투가 여러 개 있어요. 엄마 드리려고 했어요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"저 씨앗 키우는 거 잘해요. 선생님이 상도 줬어요."',
            '"병원 옥상에 해 들어오는 곳 있어요? 거기면 다 키울 수 있어요."',
            '"토마토 씨앗도 있고, 허브 씨앗도 있어요. 반반씩 나눠요."',
            '"엄마 찾으면 저도 엄마한테 씨앗 가져갈래요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"이제 안 아파요. 선생님 덕분에요."',
            '"씨앗 봉투 다 여기 뒀어요. 선생님이 필요한 거 쓰세요."',
            '"저는 가끔 도와드릴게요. 저도 의사 되고 싶어요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'herb_seed', qty: 3 },
      ],
      recurring: {
        items: [{ id: 'herb_seed', qty: 1 }],
        intervalDays: 6,
        maxCount: 4,
      },
    },
  },

  // ── 이유나 (14·여) — 고아원 출신, sponsor(약초) ────────────
  patient_lee_yuna_14: {
    id: 'patient_lee_yuna_14',
    name: '이유나',
    age: 14,
    gender: 'female',
    ageBracket: 'child',
    portraitIcon: '🧒',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['어깨 타박', '감기 증상', '영양실조'],
    admissionDialogue: '"…선생님… 저 병원에 와본 거 처음이에요…"',

    hiddenBackground: {
      profession: 'orphan_runaway',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"고맙습니다. 지금까지 아프면 혼자 참았어요."',
            '"저 유나예요. 열넷. 구로구 보육원에서 컸어요."',
            '"사태 나고 사람들 따라 피난 다녔어요. 얻어맞으면서요."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"보육원에 원예 선생님이 계셨어요. 저한테 약초 가르쳐 주셨어요."',
            '"삼백초, 질경이, 쑥 — 뒷마당에서 다 키웠어요."',
            '"씨앗이랑 마른 약초 몇 묶음 가방에 있어요."',
            '"이거 선생님께 드릴래요. 받아주세요."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"덕분에 오래간만에 잘 먹고 잘 잤어요."',
            '"여기서 일 거들면서 지내도 될까요? 방 구석이라도 괜찮아요."',
            '"약초 말리고 손질하는 거, 저 잘해요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'herb',      qty: 3 },
        { id: 'herb_seed', qty: 1 },
      ],
      recurring: {
        items: [{ id: 'herb', qty: 1 }],
        intervalDays: 5,
        maxCount: 5,
      },
    },
  },

};

export default CHILDREN;
