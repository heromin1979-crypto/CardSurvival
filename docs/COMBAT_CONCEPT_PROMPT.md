# 전투 화면 컨셉 이미지 — Nano Banana 프롬프트

> 기준: `tmp/combat-screen-selected.png` (2026-09-06, `npm run test:e2e:combat` 캡처)
> 색값 출처: `DESIGN.md`, 배경 에셋: `assets/images/combat_jongno_subway_clean_v2.png`
>
> **주의** — 캡처 우측 상단의 `전투 테스트` 패널은 테스트 하네스다. 실제 UI가 아니므로
> 프롬프트에 넣지 않았다.

---

## A. 메인 프롬프트 (한글 UI 포함)

```
A 16:9 game UI screenshot of a turn-based combat screen from a dark post-apocalyptic
survival card game set in ruined Seoul. Render it as a finished in-game screenshot,
not a concept sketch — crisp UI chrome over a painted environment.

LAYOUT, top to bottom:

1) Top bar, 5% height, near-black (#0d0d0d) with a thin warm amber hairline underneath.
   Far left in pale sand-colored monospace: "서울 생존 · 전투".
   Far right, smaller and dimmer, three inline readouts: "지역 마포구   시간 06:42   날씨 맑음".

2) Turn-order strip, centered under the top bar. Four small hexagonal portrait tokens
   in a row: the first outlined in muted green (the player), the rest in dull crimson
   (enemies), each holding a tiny dark character bust. To their right, an amber
   diamond-shaped badge with "ROUND" above a large numeral "1".

3) Battle stage, filling the middle ~60% — a full-bleed painted environment of a ruined
   Seoul subway platform: derailed train cars receding into darkness, square tiled
   columns, twisted rails, scattered rubble and paper. Volumetric haze. The left third
   is graded cold steel-blue (#5090c0 influence), the right third warm rust-red
   (#e05050 influence), with the center falling into near-black — a soft horizontal
   vignette that pushes both fighters forward.

   A lone survivor in a dark worn jacket stands left of center in a low fighting stance,
   seen from behind three-quarter view, unlit and mostly silhouette.
   An infected figure stands right of center, gaunt and slack-limbed, mid-stride.
   The infected one is enclosed in a tall amber (#c8a060) rounded-rectangle selection
   frame with a faint glow, and a small dark hexagonal name badge floats above its head.
   Between them, faint vertical tick marks numbered 1 2 3 4 mark distance lanes.

4) Two combatant status cards sit low over the stage, side by side and centered.
   Each is a dark translucent slab with a thin border and a square numeral badge on
   its left edge. Left card, amber-bordered: "테스트 생존자" with a steel-blue bar
   reading "100/100" and an amber bar reading "100/100". Right card, crimson-bordered:
   "감염 좀비" with a red bar reading "37/37" and an empty gray bar reading "0/10".

5) A single thin full-width message strip in near-black, centered pale text:
   "전투 시작! (적 1마리)".

6) Action bar, bottom ~27%, on flat near-black. Three large action cards on the left
   and a narrow stack of two smaller ones on the right. Every card carries a small
   amber diamond hotkey badge in its top-right corner and a monochrome line-art icon
   in its middle.
   - First card is SELECTED: amber border, warm inner glow, brighter text.
     Title "강타", subtitle "근접", a bare-knuckle fist icon, and two stat lines at the
     bottom: "피해 4-7" and "명중 85%".
   - Second card, dimmed: "방어" / "보조", fist icon, footer "스태미나 1".
   - Third card, dimmed: "이동" / "보조", running-figure icon, footer "스태미나 1".
   - Right stack, dimmed and smaller: "아이템 사용" and "도주 / 탈출".

STYLE: restrained industrial terminal aesthetic. Monospace type throughout, letter-spaced,
in warm pale sand (#d4c9a8) with dimmer labels (#8a8070). Exactly one warm accent
(amber #c8a060) and one cold accent (steel blue #5090c0) against neutral near-blacks
(#0a0a0a, #0d0d0d, #141414, #1a1a1a). Red (#e05050) only for enemy health and danger.
No saturated colors anywhere else, no neon, no cyberpunk glow, no lens flare.
Thin 1px borders, generous negative space, subtle film grain over the whole frame.
Photographic environment art, flat and precise UI chrome. 1920×1080.
```

---

## B. 한글 텍스트가 깨질 때

이미지 모델은 한글 렌더링이 불안정하다. 글자가 뭉개지면 두 단계로 나눈다.

**1단계 — 텍스트 없이 뽑는다.** A 프롬프트에서 따옴표 안의 한글을 전부 지우고,
그 자리에 이 문장을 넣는다.

```
Leave every text area as empty plates and bars — no lettering anywhere.
Keep the exact shapes, borders, badges, and bar geometry so text can be composited later.
```

**2단계 — 글자를 얹는다.** 나온 이미지를 다시 Nano Banana에 넣고 편집으로 지시한다.

```
Add Korean monospace UI text to this screenshot, keeping every existing pixel of the
artwork and UI chrome unchanged. Top-left: "서울 생존 · 전투". First action card title
"강타", subtitle "근접", footer "피해 4-7 / 명중 85%". ...
```

---

## C. 바꿔 볼 손잡이

| 바꿀 것 | 프롬프트에서 고칠 곳 |
|---|---|
| 장소 | "ruined Seoul subway platform" → 지하상가 / 한강 둔치 / 병원 로비 |
| 시간대 | "cold steel-blue / warm rust-red" 대비를 야간(청색 일변도) 또는 황혼(앰버 일변도)으로 |
| 적 | "infected figure" → 약탈자 / 거대 좀비 / 광견병 걸린 개 (`js/data/combatAssets.js` 참조) |
| 긴장도 | 적 카드 체력을 "37/37" → "6/37", 선택 카드를 "도주 / 탈출"로 |
| 인원 | 턴 순서 토큰과 상태 카드를 늘려 2 대 3 구도로 |

---

## D. 프롬프트를 이렇게 쓴 이유

**영어로 썼다.** 지시 준수도가 한국어보다 안정적이다. UI에 들어갈 한글만 따옴표로
원문 그대로 박았다.

**색을 16진수로 못박았다.** "dark and gloomy" 같은 표현은 모델이 임의로 채도를 올린다.
`DESIGN.md`의 실제 토큰을 넣어 결과물이 게임과 같은 팔레트 위에 앉게 했다.

**금지 목록을 넣었다.** (no neon, no cyberpunk glow, no lens flare)
"post-apocalyptic"은 사이버펑크 네온으로 끌려가는 경향이 강하다. `DESIGN.md`의
"restrained — 1 웜 액센트 + 1 콜드 액센트" 원칙과 정면으로 충돌한다.

**영역을 번호로 나눴다.** 한 문단에 다 쓰면 모델이 UI 요소를 섞거나 빠뜨린다.
위에서 아래로 번호를 매기면 각 띠의 높이 비율까지 지킨다.
