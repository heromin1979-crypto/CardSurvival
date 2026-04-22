// === PATIENT POOL — ELDERS (61세+) ===
// 증분 2: 3종 (sponsor 위주)
// 스키마: prompt_plan.md Phase 3 참조.

const ELDERS = {

  patient_kim_sunja_71: {
    id: 'patient_kim_sunja_71',
    name: '김순자',
    age: 71,
    gender: 'female',
    ageBracket: 'elder',
    portraitIcon: '👵',

    // ── 표면 정보 ───────────────────────────────────────
    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['골반 타박', '탈수', '어지럼'],
    admissionDialogue: '"아이고… 할미는 괜찮아… 손주만 살려주이소…"',

    // ── 숨겨진 배경 ─────────────────────────────────────
    hiddenBackground: {
      profession: 'retired_gardener',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"고맙네… 살려줘서."',
            '"나는 김순자라고 해. 일흔하나."',
            '"손주 손잡고 피난 가다가 돌부리에 넘어졌어…"',
            '"아이는 먼저 보내고 나만 남았지."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"내가 젊을 적엔 이 동네서 원예원을 했거든."',
            '"온상에 허브씨며 약초씨며 가득 쟁여놨지."',
            '"지금도 베란다에 종자 몇 봉지 두고 왔어."',
            '"회복되면 자네한테 몇 개 갖다 주려고 하는데, 괜찮겠지?"',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"자네 덕에 다시 걸을 수 있겠네."',
            '"이거, 내 집 열쇠야. 베란다 상자 속 종자들 꺼내 써."',
            '"당분간은 내가 이 병원까지 왔다 갔다 할게."',
            '"심어서 꽃이 피면 같이 봐주게나."',
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
        intervalDays: 8,
        maxCount: 4,
      },
    },
  },

  // ── 최선옥 (68·여) — 전직 한의사, sponsor(약초/차) ────────────
  patient_choi_seonok_68: {
    id: 'patient_choi_seonok_68',
    name: '최선옥',
    age: 68,
    gender: 'female',
    ageBracket: 'elder',
    portraitIcon: '👵',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['허리 염좌', '기침', '탈수'],
    admissionDialogue: '"…아이고… 뼈는 안 부러진 거 같은데… 꽉 찍어주게…"',

    hiddenBackground: {
      profession: 'retired_herbalist',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"덕분일세. 바닥에 깔려 숨이 안 쉬어졌어."',
            '"나는 최선옥, 예순여덟. 동대문서 한의원 사십 년 했지."',
            '"피난 짐 사이에 약초 상자가 몇 개 있어. 그것들 좀 잘 놓아주게."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"사십 년 약초만 만진 손이라네."',
            '"말린 삼백초, 쑥, 인진쑥 — 이거면 열 명은 다스릴 수 있어."',
            '"차로 우려내면 환자 진정에도 좋고, 상처에 붙여도 돼."',
            '"회복되면 내 약재 손질해서 계속 자네에게 갖다주지."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"허리는 돌아왔네. 자네 솜씨가 좋아."',
            '"이 약초 상자는 자네 것으로 하게. 내 손으로 다 말린 거야."',
            '"닷새마다 한 번씩 들러서 새 약재 다듬어 줄 테니 걱정 말게."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'herb',       qty: 4 },
        { id: 'herbal_tea', qty: 2 },
      ],
      recurring: {
        items: [
          { id: 'herb',       qty: 2 },
          { id: 'herbal_tea', qty: 1 },
        ],
        intervalDays: 5,
        maxCount: 5,
      },
    },
  },

  // ── 김병철 (74·남) — 전직 공무원, sponsor(생활물자) ───────────
  patient_kim_byungchul_74: {
    id: 'patient_kim_byungchul_74',
    name: '김병철',
    age: 74,
    gender: 'male',
    ageBracket: 'elder',
    portraitIcon: '👴',

    woundLevel: 2,
    disease: null,
    visibleSymptoms: ['갈비뼈 금', '저혈압', '피로'],
    admissionDialogue: '"…주민 센터 창고 열쇠는… 내 외투 주머니에…"',

    hiddenBackground: {
      profession: 'retired_public_servant',
      storyFragments: [
        {
          stage: 'wound3to2',
          lines: [
            '"고마워요. 숨이 쉬어지네."',
            '"김병철입니다. 일흔넷. 동작구청에서 총무과장으로 정년했습니다."',
            '"사태 초기에 주민 대피 매뉴얼 따라 센터 물자 지키고 있었습니다."',
          ],
        },
        {
          stage: 'wound2to1',
          lines: [
            '"관악로 쪽 주민 센터 비상 창고, 내가 다 담당했어요."',
            '"담요, 끈, 방수포, 생필품 — 재난용으로 매년 갱신했지요."',
            '"문서상으로 소진된 걸로 돼 있어도 창고 뒤에는 예비가 있어요."',
            '"내가 열쇠를 갖고 있어요. 회복되면 같이 갑시다."',
          ],
        },
        {
          stage: 'wound1to0',
          lines: [
            '"덕분에 다시 일어섰습니다. 일흔 넘어 새 목숨을 받았어요."',
            '"주민 센터 창고를 우리 공동 창고로 씁시다. 정기적으로 보급할게요."',
            '"원칙대로 분배합시다. 선생께서 이끌어 주세요."',
          ],
        },
      ],
    },

    contributionOnCure: {
      type: 'sponsor',
      immediate: [
        { id: 'cloth', qty: 4 },
        { id: 'rope',  qty: 2 },
      ],
      recurring: {
        items: [
          { id: 'cloth', qty: 2 },
          { id: 'rope',  qty: 1 },
        ],
        intervalDays: 6,
        maxCount: 5,
      },
    },
  },

};

export default ELDERS;
