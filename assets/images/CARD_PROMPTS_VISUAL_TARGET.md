# 시각 타겟 이미지 프롬프트 (나노 바나나 / Genspark)

> 작성: 2026-04-28
> 대상: `시작화면 컬라주` + `캐릭터선택 풀-바디` (트랙 I-1 / I-2)
> 기준: `docs/VISUAL_TARGET_GAP_ANALYSIS.md`, `DESIGN.md`
> 권장 해상도:
>   - 캐릭터 풀-바디: **768×1024** (세로 비율, 1:1.33)
>   - 캐릭터 초상화: **512×512** (정사각, 풀-바디에서 크롭 가능)
>   - 신문/문서/배경: **1024×1024** 또는 **1920×1080**

---

## 공통 스타일 접두어 (모든 프롬프트 앞에 붙이기)

```
post-apocalyptic Seoul Korea 2026, photorealistic detailed illustration,
worn weathered texture, muted desaturated color palette amber and teal,
military manual aesthetic, no text overlay, no watermark
```

> **금지 색감**: 보라/마젠타/네온 그린 (DESIGN.md 신념 #4)
> **권장 톤**: 앰버(낮)/청색(밤) 이분법, 어두운 배경 강조

---

# A. 시작화면 컬라주 에셋 — `assets/images/menu/`

가상 이미지의 신문/문서 컬라주 레이아웃을 만들기 위한 분리된 에셋. CSS로 합성.

## A-1. 종이 배경 텍스처 (필수)

### `paper_bg.jpg` (1920×1080, JPEG로 용량 절약)
```
old aged yellowish brown paper texture sheet, full background,
public document official paper with subtle stains and wrinkles,
Korean civil defense bureaucratic paper, slight ink smudges,
post-apocalyptic survival document, photorealistic, no text
```

## A-2. 신문 클리핑 (2종)

### `clipping_news_subway.png` (768×512, transparent BG)
```
torn newspaper clipping piece, rough paper edges, slight curling,
front page article photo of Seoul subway station entrance with
"운행 중단" warning sign, riot barriers, panicked crowd in background,
black and white photo style, news article header above photo,
post-apocalyptic Korea civil unrest, transparent background, no readable text
```

### `clipping_news_hospital.png` (768×512, transparent BG)
```
torn newspaper clipping piece showing doctor in white coat with
stethoscope at Boramae Hospital emergency room, dim emergency lighting,
Korean hospital sign visible, news photo style with grainy texture,
clipping has uneven torn edges, post-apocalyptic medical chaos atmosphere,
transparent background, no readable text
```

## A-3. 통제 테이프 (반복 패턴)

### `control_tape.png` (1024×128, transparent BG, tile-able horizontally)
```
yellow caution tape barrier strip with diagonal black stripes pattern,
weathered slightly torn edges, old worn vinyl plastic texture,
post-apocalyptic Seoul Korea civil defense tape, transparent background,
horizontal repeating pattern, photorealistic, no text overlay
```

> 사용처: CSS `background: url() repeat-x` — 시작화면 하단 띠

## A-4. 폐허 사진 (2종, 신문 안에 들어갈 작은 사진)

### `ruin_gwanghwamun.png` (768×768)
```
ruined Gwanghwamun Square in Seoul Korea, broken stone walls,
debris on ground, abandoned riot police shields scattered,
overcast gray sky, post-apocalyptic atmosphere,
black and white photo style with grainy texture, no people, no text
```

### `ruin_hangang_bridge.png` (768×768)
```
collapsed Hangang river bridge section in Seoul, twisted steel beams,
broken concrete, abandoned cars on bridge surface, dim foggy weather,
muted desaturated photo style, post-apocalyptic disaster scene,
no people, photorealistic news photo style, no text
```

> 사용처: 신문 클리핑 안 또는 종이 배경 위 작은 사진 컬라주

---

# B. 캐릭터선택 화면 에셋 — `assets/images/characters/`

각 캐릭터의 풀-바디 일러스트 + 초상화. **일관된 디자인 모델**로 batch 생성 권장 (같은 화풍, 같은 조명).

## B-0. 캐릭터선택 배경

### `assets/images/menu/charcreate_bg.jpg` (1920×1080)
```
ruined Seoul cityscape with collapsed Hangang Bridge in distance,
gentle snow falling, dim winter dusk lighting, abandoned vehicles
half-buried in snow, smoke columns rising from far buildings,
muted gray-blue palette with faint amber sunset glow on horizon,
photorealistic, no people in foreground, no text
```

---

## B-1. 이지수 — 응급의학과 전문의 (38세 여)

### `lee_jisoo_full.png` (768×1024) — 풀-바디
```
Korean female doctor age 38, full body standing pose facing camera,
short dark hair tied back, intelligent tired eyes with dark circles,
white medical coat over olive-drab shirt, stethoscope around neck,
medical satchel bag on shoulder, blood-stained surgical gloves,
worn combat boots, post-apocalyptic ER survivor,
muted desaturated palette, dramatic rim lighting from above,
dark plain background, photorealistic illustration
```

### `lee_jisoo_portrait.png` (512×512) — 초상화
```
Korean female doctor age 38, head and shoulders portrait,
short dark hair tied back, intelligent tired eyes, faint scar on cheek,
white medical coat collar visible, stethoscope partially visible,
post-apocalyptic survivor portrait, muted desaturated palette,
dramatic rim lighting, dark plain background, photorealistic
```

## B-2. 강민준 — 특수전 부사관 (29세 남)

### `kang_minjun_full.png` (768×1024)
```
Korean male special forces sergeant age 29, full body standing pose,
short military buzz cut, alert sharp eyes, faint scar on jaw,
tactical olive-drab combat uniform, plate carrier vest with magazines,
combat knife on hip, holstered sidearm, scuffed combat boots,
slung military backpack, post-apocalyptic Seoul soldier,
muted desaturated palette, dramatic rim lighting from above,
dark plain background, photorealistic illustration
```

### `kang_minjun_portrait.png` (512×512)
```
Korean male special forces sergeant age 29, head and shoulders portrait,
military buzz cut, alert sharp eyes, faint jaw scar, hardened expression,
combat uniform collar visible, plate carrier strap visible,
muted desaturated palette, dramatic rim lighting, dark background
```

## B-3. 박영철 — 소방관 (44세 남)

### `park_youngchul_full.png` (768×1024)
```
Korean male firefighter age 44, full body standing pose,
salt-and-pepper hair, weathered kind face with deep wrinkles,
soot-stained turnout coat with reflective stripes, fire helmet under arm,
heavy boots, axe and rope coil at belt, sturdy build,
worn but resolute expression, post-apocalyptic Seoul rescuer,
muted desaturated palette, dramatic rim lighting from above,
dark plain background, photorealistic illustration
```

### `park_youngchul_portrait.png` (512×512)
```
Korean male firefighter age 44, head and shoulders portrait,
salt-and-pepper hair, weathered kind face with deep wrinkles,
soot-stained turnout coat collar with reflective stripe visible,
muted desaturated palette, dramatic rim lighting, dark background
```

## B-4. 최형식 — 전직 사업가 노숙인 (52세 남)

### `choi_hyungsik_full.png` (768×1024)
```
Korean male homeless man age 52 former businessman, full body standing pose,
unkempt graying long hair, tired weathered face with stubble beard,
layered worn clothing, faded suit jacket over hoodie over thermal shirt,
threadbare scarf, ragged backpack, fingerless gloves,
worn boots wrapped with duct tape, post-apocalyptic street survivor,
muted desaturated palette, dramatic rim lighting from above,
dark plain background, photorealistic illustration
```

### `choi_hyungsik_portrait.png` (512×512)
```
Korean male homeless man age 52, head and shoulders portrait,
unkempt graying long hair, weathered face with gray stubble,
tired knowing eyes, layered scarf over thermal shirt collar,
muted desaturated palette, dramatic rim lighting, dark background
```

## B-5. 윤재혁 — 호텔 셰프 (33세 남)

### `yoon_jaehyuk_full.png` (768×1024)
```
Korean male hotel chef age 33, full body standing pose,
short clean-cut black hair, sharp focused eyes, kitchen burn scar on forearm,
white chef double-breasted coat slightly stained, dark chef pants,
chef knife strapped to thigh, kitchen apron with tools,
non-slip kitchen shoes, post-apocalyptic Seoul gourmet survivor,
muted desaturated palette, dramatic rim lighting from above,
dark plain background, photorealistic illustration
```

### `yoon_jaehyuk_portrait.png` (512×512)
```
Korean male hotel chef age 33, head and shoulders portrait,
short clean-cut black hair, sharp focused eyes, slight stubble,
white chef coat collar visible with subtle stains,
muted desaturated palette, dramatic rim lighting, dark background
```

## B-6. 정대한 — 기계공학자 (35세 남)

### `jeong_daehan_full.png` (768×1024)
```
Korean male mechanical engineer age 35, full body standing pose,
short messy dark hair, intelligent observant eyes behind safety glasses,
gray work coverall with oil stains, tool belt with wrench and screwdrivers,
heavy work gloves, leather apron over shoulder, sturdy work boots,
schematic notebook tucked under arm,
post-apocalyptic Seoul factory engineer,
muted desaturated palette, dramatic rim lighting from above,
dark plain background, photorealistic illustration
```

### `jeong_daehan_portrait.png` (512×512)
```
Korean male mechanical engineer age 35, head and shoulders portrait,
short messy dark hair, intelligent eyes behind safety glasses,
gray coverall collar with oil smudge, slight stubble,
muted desaturated palette, dramatic rim lighting, dark background
```

---

# 생성 후 적용 가이드

## 폴더 신설 (Git이 빈 폴더 무시하므로 .gitkeep 추가 권장)

```bash
mkdir -p assets/images/menu
mkdir -p assets/images/characters
touch assets/images/menu/.gitkeep
touch assets/images/characters/.gitkeep
```

## 파일 매핑

| ZIP 결과 | 최종 경로 |
|----------|-----------|
| 6 풀-바디 PNG | `assets/images/characters/{이름}_full.png` |
| 6 초상화 PNG | `assets/images/characters/{이름}_portrait.png` |
| 6 메뉴 컬라주 (배경/신문/테이프/폐허) | `assets/images/menu/{이름}.png` |
| 캐릭터선택 배경 1 | `assets/images/menu/charcreate_bg.jpg` |

## CharCreate.js / MainMenu.js 적용 (별도 PR)

`js/data/characters.js`에 `portrait`, `portraitFull`, `englishLabel` 필드 추가 (트랙 I-2 워커 브리프에서 처리):

```js
{
  id: 'doctor',
  name: '이지수',
  portrait: 'assets/images/characters/lee_jisoo_portrait.png',
  portraitFull: 'assets/images/characters/lee_jisoo_full.png',
  englishLabel: 'MEDICAL',  // 의료형
  // ... 기존 필드 유지
}
```

---

# 톤 가이드 체크리스트

생성된 이미지마다 확인:

- [ ] **모든 캐릭터 동일한 화풍/조명** — batch 생성 또는 같은 모델·시드
- [ ] **앰버/청색 이분법** 색감 (보라/마젠타/네온 그린 0건)
- [ ] **마모된 질감** (worn, weathered, slight stains) — 깨끗한 신품 X
- [ ] **DESIGN.md 정렬** — 군용 매뉴얼 + 한국 공공기관 톤
- [ ] **포스트아포칼립틱 서울** — 서울 특유 디테일 (신호등, 한국식 표지판, 소주병)
- [ ] **얼굴 표정 일관성** — 6 캐릭터 모두 "지친 결의" 톤 (밝은 미소 X)
- [ ] **캐릭터별 직업 식별성** — 보지 않고도 어느 직업인지 알 수 있어야 함

---

# 우선순위

**P0 (먼저 생성)**:
1. 6 캐릭터 풀-바디 (B-1~B-6 _full) — 캐릭터선택의 핵심
2. `paper_bg.jpg` — 시작화면 컬라주의 베이스
3. `charcreate_bg.jpg` — 캐릭터선택 배경

**P1 (다음)**:
4. 6 캐릭터 초상화 (B-1~B-6 _portrait) — 작은 카드용
5. 신문 클리핑 2종 (A-2)

**P2 (마감 보강)**:
6. 통제 테이프 (A-3)
7. 폐허 사진 2종 (A-4)

총 **20개 이미지**. 풀-바디 6개를 먼저 만들고 일관성 확인 → 나머지 batch.

---

*프롬프트 끝. 이미지 ZIP 받으면 AD에게 전달 → 파일명 매칭 + 코드 적용 별도 PR.*
