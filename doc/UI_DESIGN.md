# Card Survival: Ruined City — UI 디자인 문서

> 기준일: 2026-04-10 | 해상도: 1920×1080 (Scale 방식)

---

## 1. 전체 구조 개요

싱글-페이지 애플리케이션. 화면(Screen)이 상호 배타적으로 전환되며, 모달이 최상단에 오버레이된다.

```
#app (100vw × 100vh)
├── 화면 레이어 (한 번에 하나만 .active)
│   ├── #screen-main-menu       — 메인 메뉴
│   ├── #screen-char-create     — 캐릭터 생성
│   ├── #screen-basecamp        — 게임 메인 화면 ★
│   ├── #screen-explore         — 지도 탐색
│   ├── #screen-encounter       — NPC/이벤트 조우
│   ├── #screen-combat          — 전투
│   ├── #screen-combat-result   — 전투 결과
│   ├── #screen-rest            — 휴식
│   ├── #screen-game-over       — 게임 오버
│   ├── #screen-pause           — 일시정지 (z-index: 500)
│   ├── #screen-ending          — 엔딩
│   └── #screen-ending-gallery  — 엔딩 갤러리
│
├── 공유 오버레이 레이어
│   ├── #modal-overlay          — 범용 모달 (z: 900)
│   ├── #settings-modal         — 설정 다이얼로그
│   ├── #notification-container — 토스트 알림 (z: 999)
│   └── #npc-panel              — 우측 NPC 패널 (z: 200)
│
└── 시스템 레이어
    ├── #loading-overlay        — 로딩 스피너 (z: 9999)
    └── #debug-panel            — 디버그 콘솔 (?debug=1)
```

---

## 2. 베이스캠프 레이아웃 (메인 게임 화면)

### 2-컬럼 그리드

```
#screen-basecamp
├── .bc-sidebar   (200px 고정, 좌측)
└── .bc-main      (1fr, 보드 컨테이너)
```

### 좌측 사이드바 (.bc-sidebar)

배경 `#141414`, 우측 테두리 1px, overflow-y: auto, flex column

```
.bc-sidebar
├── .bc-minimap          — 지도 미리보기 + 서울 지도 조각 배지
├── .bc-time-block       — 날짜/시간/계절/날씨
├── .bc-disease-status   — 활성 질병 상태 (있을 때만)
├── .bc-char-block       — 캐릭터 아이콘 + 이름 + HP
├── .bc-noise-block      — 소음 미터
├── .bc-enc-block        — 무게 과부하 표시
├── .bc-quests-block     — 진행 중 퀘스트 목록
└── .bc-sidebar-btns     — 장비·베이스·스킬·건설 버튼
```

#### 미니맵 블록 (.bc-minimap)
- 헤더: 🗺️ MINIMAP 레이블 + `N/3 조각` 배지 (수집한 지도 조각 수 표시)
- 본문: SVG 지도 프리뷰 (min-height: 200px)
- 호버: 따뜻한 배경 틴트 + 테두리 하이라이트

#### 시간 블록 (.bc-time-block)
```
.bc-day-row
  ├── .bc-day           "15일차"
  ├── .bc-clock         "08:00"
  └── .bc-night-indicator  🌙 (야간 시 표시)

.bc-season-weather-row
  ├── .bc-season-badge  계절 (색상 코딩)
  └── .bc-weather-badge 날씨 (색상 코딩)

.bc-temp-display        "온도: -5°C"
  └── 색상 클래스: temp-very-cold / cold / normal / hot / extreme

.bc-weather-widget
  ├── .ww-hints         환경 힌트 태그들 (flex row)
  └── .ww-event         진행 중 날씨 이벤트 + 지속 바
```

**계절 배지 색상:**
| 계절 | 배경 | 텍스트 |
|------|------|--------|
| spring | 분홍/라벤더 | 동색 |
| summer | 오렌지 | 동색 |
| autumn | 오렌지-레드 | 동색 |
| winter | 파랑 | 동색 |

**날씨 배지:** hot(적등색) / storm(파랑) / monsoon(청록) / blizzard(연파랑) / snow(아이시 블루) / rainy(회색-파랑) 등 11종

#### 캐릭터 블록 (.bc-char-block)
- 26px 이모지 아이콘 + 이름 + 직업/역할 + HP 상태

#### 질병 상태 (.bc-disease-status)
- 펄스 애니메이션이 있는 배지
- 심각도별 색상: sev-low(초록) / sev-mid(오렌지) / sev-high(빨강 + 빠른 펄스)

#### 퀘스트 블록 (.bc-quests-block)
- 퀘스트명 + 황금 그래디언트 진행 바 + 진행 수치
- 진행 바 전환: `width 0.4s ease`

#### 사이드바 버튼 (.bc-sidebar-btns)
- 100% width, 좌측 정렬 flex
- `.btn-build-highlight`: 초록색 + 2s 펄스 애니메이션

---

## 3. 보드 레이아웃

### 3-행 flex column

```
.bc-main
└── .board (flex column, flex: 1)
    ├── .board-row[data-key="top"]     장소 행  (10슬롯, flex)
    ├── .board-row[data-key="middle"]  바닥 행  (10슬롯, flex)
    └── .board-row[data-key="bottom"]  휴대 행  (20슬롯, grid)
```

### 행 구조
```
.board-row (flex: 1)
├── .board-row-label   📍 장소 / ◆ 바닥 / 🎒 휴대
└── .board-row-slots
    └── .slot × N
        └── .card (있을 때)
```

### 행별 스펙

| 행 | 슬롯 수 | 레이아웃 | flex 비율 | 라벨 색상 |
|----|---------|---------|-----------|-----------|
| top (장소) | 10 | flex, `flex: 1 1 0` | 1 | 앰버 (#c8a060) |
| middle (바닥) | 10 | flex, `flex: 1 1 0` | 1 | 보조 (#8a8070) |
| bottom (휴대) | 20 | grid 10열×2행 | 1.84 | 파랑 (#4488cc) |

### 슬롯 상태 클래스
| 클래스 | 시각 효과 |
|--------|-----------|
| `.drag-over-valid` | 초록 테두리 + 유효 드롭 하이라이트 |
| `.drag-over-invalid` | 빨간 테두리 + 무효 드롭 |
| `.drag-over-hover` | 앰버 틴트 |
| `.slot-disabled` | opacity 0.35, 🔒 아이콘, 비대화형 (잠긴 가방 슬롯) |

**휴대 행:** 기본 10슬롯 활성, 가방 장착 시 `extraSlots`만큼 추가 해금

---

## 4. 카드 컴포넌트

### 4-1. 표준 카드 (.card)

```html
<div class="card" data-rarity="uncommon" data-type="consumable">
  <div class="card-header">
    <div class="card-icon">🧪</div>
    <div class="card-name">정수 알약 <span class="card-name-qty">×3</span></div>
  </div>
  <div class="card-body">
    <div class="card-type-row">
      <span class="card-type-badge">CONSUMABLE</span>
      <div class="card-stats">
        <span class="card-stat">수분 +20</span>
      </div>
    </div>
    <div class="card-art"><img class="card-img" src="..."></div>
    <div class="card-durability"><div class="card-durability-fill"></div></div>
  </div>
  <!-- 플로팅 인디케이터 -->
  <div class="card-stack">×3</div>
  <div class="card-contamination">☢️</div>
  <div class="card-weight">50g</div>
</div>
```

**크기:** `var(--card-w)` × 슬롯 높이 100%
**테두리:** 2px solid, 희귀도 색상

**희귀도 테두리 색상:**
| 희귀도 | 색상 | 효과 |
|--------|------|------|
| common | #555555 | — |
| uncommon | #336633 | 초록 글로우 |
| rare | #334488 | 파랑 글로우 |
| unique | #774422 | 오렌지 글로우 |

**품질 글로우 (data-quality):**
| 품질 | 글로우 색상 |
|------|------------|
| good | 초록 (50,180,80) |
| excellent | 파랑 (60,110,230) |
| masterwork | 황금 (210,165,20) |

**타입별 배경 틴트 (data-type):**
consumable(초록) / tool(오렌지) / weapon(빨강) / material(회색) / structure(파랑)

**내구도 바:** 3px, 앰버→경고(오렌지)→위험(빨강)
**플로팅 요소:**
- `.card-stack` (우하단): ×N 스택 수량
- `.card-contamination` (우상단): ☢️ 오염 표시
- `.card-weight` (좌하단): 무게 표시

### 4-2. 장소 카드 (.location-card)

```html
<div class="location-card is-current-loc">
  <div class="lc-header">
    <span class="lc-current-badge">CURRENT</span>
    <span class="lc-visited-dot">✓</span>
  </div>
  <div class="lc-icon">🏢</div>
  <div class="lc-scene" style="background-image: url(...)"></div>
  <div class="lc-name">강남구 아파트단지</div>
  <div class="lc-danger">DANGER: 2</div>
  <div class="lc-meta"><span>자원</span><span>이벤트</span></div>
</div>
```

**크기:** 151×155px 고정
**배경:** `#141414` (bg-surface)
**현재 위치 (`.is-current-loc`):** 앰버 테두리 + 글로우, 호버 비활성

### 4-3. 랜드마크 카드 (.landmark-card)

**서울 25개 자치구 특수 카드**
- 테두리: 앰버 55% opacity
- 배경: 따뜻한 오렌지 틴트 7%
- "LANDMARK" 배지 (앰버)
- 호버: `translateY(-4px)` + 강한 글로우

### 4-4. 환경 카드 (날씨 위젯)

사이드바의 `.bc-weather-widget` 내 표시 (보드 슬롯 아님)
- `.env-weather`: 파랑 테마
- `.env-event`: 오렌지 테마

### 4-5. NPC 카드 (.npc-card)

```
├── .npc-type-badge  "COMPANION"
├── .npc-card-icon   이모지 (28px)
├── .npc-card-name
├── .npc-card-trust  ⭐⭐⭐
├── .npc-card-hint
└── .npc-card-hp     HP 바 + 텍스트
```

**크기:** 151×155px, 초록 테마

---

## 5. 장비 모달 (Equipment Modal)

**크기:** 최소 940px × 680px
**3-패널 수평 레이아웃:**

```
#equip-modal
├── .equip-modal-header  "EQUIPMENT" + 닫기 버튼
└── .equip-modal-body (flex row)
    ├── .equip-left-col   (210px) — 효과 패널
    ├── .equip-char-panel (flex: 1) — 캐릭터 장비 슬롯
    └── .equip-inv-panel  (280px) — 인벤토리 탭
```

### 왼쪽: 효과 패널 (.equip-effects-panel)
- "EFFECTS" 제목
- 스탯 변화 행: 라벨 + 수치 (색상 코딩)

### 중앙: 캐릭터 패널 (.equip-char-panel)
```
.equip-char-layout (flex row, gap 16px)
├── .equip-char-figure (👤 실루엣, padding-top: 90px으로 중간 위치)
└── .equip-char-grid (2열 grid, gap 6px)
    ├── .equip-grid-full  [머리]           (2열 전체, 중앙)
    ├──                   [얼굴] [상체]
    ├──                   [손]   [가방]
    ├──                   [주무기] [보조무기/방패]
    └── .equip-grid-full  [신발]           (2열 전체, 중앙)
```

> **weapon_sub 슬롯:** 무기(melee/firearm/ranged/throwable)와 방패(offhand 아머) 겸용.
> 구버전 세이브의 `offhand` 슬롯 데이터는 `weapon_sub`로 자동 마이그레이션됨.

**장비 슬롯 (.equip-slot):**
- 크기: 82×108px
- 테두리: 1.5px dashed
- 상태: `.has-item`(실선), `.highlight-valid`(초록 글로우), `.locked`(opacity 0.45)

### 오른쪽: 인벤토리 패널 (.equip-inv-panel)
- 탭: 방어구 / 무기 / 가방 / 인벤토리
- 아이템 행: 아이콘 + 이름/내구도 + 장착 액션

---

## 6. 우측 NPC 패널 (#npc-panel)

우측 고정, 수직 중앙 정렬, z: 200

```
#npc-panel
├── .npc-panel-toggle   👥 (6px 슬림 토글 버튼)
└── .npc-panel-inner (120px, 접기 가능)
    ├── 🤝 동반자 섹션
    │   └── .npc-mini-card × N
    ├── 📍 현재 위치 섹션
    │   └── .npc-mini-card × N
    └── #npc-panel-group-stats (그룹 있을 때)
        ├── 사기 바
        ├── 결속 바
        ├── 식량 바
        └── 안전 바
```

**접기 애니메이션:** `.collapsed` → width: 0, opacity: 0, 250ms ease

---

## 7. 범용 모달 시스템

```html
<div class="modal-overlay open">
  <div class="modal-box">
    <h2 class="modal-title">제목</h2>
    <div class="modal-body">내용</div>
    <div class="modal-actions">
      <button class="modal-btn cancel">취소</button>
      <button class="modal-btn confirm">확인</button>
    </div>
  </div>
</div>
```

- 오버레이: fixed inset, `rgba(0,0,0,0.85)`, z: 950
- 박스: bg-surface, border-radius-lg, 너비 90% (300–520px)
- 열림 애니메이션: `scale(0.96) → scale(1)`, 220ms

**버튼 스타일:**
- 기본: bg-raised, 테두리, 120ms 전환
- confirm: 앰버 텍스트 + 테두리
- cancel: 보조 텍스트
- danger: 빨간 텍스트 + 어두운 빨간 테두리

---

## 8. 디자인 시스템 토큰

### 색상 팔레트

**배경 계층:**
| 변수 | 값 | 용도 |
|------|-----|------|
| `--bg-void` | #0a0a0a | 화면 외부 |
| `--bg-base` | #0d0d0d | 보드 영역 (야간: #090d12) |
| `--bg-surface` | #141414 | 패널, 사이드바 |
| `--bg-raised` | #1a1a1a | 카드, 버튼 |
| `--bg-hover` | #222222 | 호버 상태 |

**텍스트:**
| 변수 | 값 | 용도 |
|------|-----|------|
| `--text-primary` | #d4c9a8 | 메인 텍스트 (따뜻한 담황색) |
| `--text-secondary` | #8a8070 | 보조 정보 |
| `--text-dim` | #555040 | 라벨, 비활성 |
| `--text-danger` | #e05050 | 위험, 체력 위기 |
| `--text-warn` | #e0a030 | 경고 |
| `--text-good` | #60b060 | 성공, 긍정 |
| `--text-info` | #5090c0 | **야간 액센트** |

**액센트:**
| 변수 | 값 | 용도 |
|------|-----|------|
| `--accent-primary` | #c8a060 | 웜 액센트 — 낮/제작/퀘스트 |
| `--accent-dim` | #6b5535 | 액센트 테두리/약화 |

**스탯 색상:**
| 스탯 | 색상 |
|------|------|
| HP | #dd4444 (빨강) |
| 스태미너 | #44aadd (청록) |
| 수분 | #4488cc (파랑) |
| 영양 | #66aa44 (초록) |
| 체온 | #cc8833 (오렌지) |
| 사기 | #aa66cc (보라) |
| 방사능 | #99cc22 (라임) |
| 감염 | #cc3333 (크림슨) |
| 피로 | #888844 (올리브) |

**슬롯 상태:**
- `--slot-empty`: #111111
- `--slot-occupied`: #161616
- `--slot-valid`: rgba(80,160,80,0.25)
- `--slot-invalid`: rgba(160,60,60,0.25)
- `--slot-hover`: rgba(200,160,80,0.15)

### 타이포그래피

- **본문 전체:** `'JetBrains Mono', 'Courier New', monospace`
- **모달 타이틀 / 주요 헤딩:** `'Geist', 'JetBrains Mono', monospace`

| 변수 | 값 | 용도 |
|------|----|------|
| `--font-size-xs` | 14px | 배지, 스탯 라벨 |
| `--font-size-sm` | 15px | 카드명, 버튼 |
| `--font-size-base` | 17px | 본문 |
| `--font-size-md` | 19px | 서브헤딩 |
| `--font-size-lg` | 22px | 모달 타이틀 (Geist) |
| `--font-size-xl` | 28px | 화면 타이틀 |

### 간격 (기본 단위: 4px)

| 변수 | 값 |
|------|----|
| `--gap-xs` | 4px |
| `--gap-sm` | 8px |
| `--gap-md` | 12px |
| `--gap-lg` | 16px |
| `--gap-xl` | 24px |

### 테두리 반경

| 변수 | 값 | 용도 |
|------|----|------|
| `--radius-sm` | 4px | 버튼, 배지 |
| `--radius-md` | 6px | 카드, 슬롯 |
| `--radius-lg` | 10px | 모달, 주요 컨테이너 |

### Z-Index 레이어

| 변수 | 값 | 레이어 |
|------|----|--------|
| `--z-board` | 10 | 보드 기반 |
| `--z-card` | 20 | 카드 요소 |
| `--z-drag` | 100 | 드래그 중 카드 |
| `--z-hud` | 200 | 사이드바 HUD |
| `--z-panel` | 300 | 우측 패널 |
| `--z-modal` | 900 | 모달 다이얼로그 |
| `--z-overlay` | 950 | 모달 배경막 |
| `--z-notify` | 999 | 알림 토스트 |

### 전환/애니메이션

| 변수 | 값 | 용도 |
|------|----|------|
| `--transition-fast` | 120ms ease | 호버, 색상 전환 |
| `--transition-mid` | 220ms ease | 모달 스케일, 오버레이 |
| `--transition-slow` | 400ms ease | 퀘스트 바, 계절 배지 |

---

## 9. 애니메이션 목록

| 애니메이션 | 대상 | 설명 |
|-----------|------|------|
| `cardSpawn` | `.card` | opacity 0→1, translateY(-12px)→0, scale(0.92→1), 250ms |
| `locSpawn` | `.location-card` | opacity 0→1, 180ms (이동 없음) |
| `cardRemove` | `.card` | opacity 1→0, scale(1→0.88), translateY(0→8px), 200ms |
| `dangerPulse` | `.stat-bar-fill.danger` | 0.8s 무한 opacity 깜빡 |
| `warnPulse` | `.stat-bar-fill.warn` | 1.8s 무한 opacity 깜빡 |
| `radiationFlicker` | 방사능 스탯 | 1.5s 무한 색상 플리커 |
| `diseasePulse` / `Fast` | 질병 배지 | 심각도별 속도 다름 |
| `bc-build-pulse` | `.btn-build-highlight` | 2s 무한, opacity 1↔0.65 |
| `slideInRight` | 알림 토스트 | 우측에서 슬라이드 인 |
| 야간 HUD 플리커 | 야간 상태 전체 | 8s, opacity 1→0.85→0.92→0.88→1 |

---

## 10. 낮/밤 시스템 시각 변화

| 요소 | 낮 | 밤 |
|------|----|----|
| `--bg-base` | #0d0d0d | #090d12 (청색 틴트) |
| 주요 액센트 | 앰버 (#c8a060) | 블루 (#5090c0) |
| HUD | 일반 | 플리커 애니메이션 |
| 배경 | 일반 | 스캔라인 오버레이 |
| 야간 표시 | — | 🌙 아이콘 |

---

## 11. CSS 파일 구조

```
css/
├── variables.css        — 디자인 토큰 (색상, 간격, 타이포, z-index)
├── reset.css            — 전역 리셋, 폰트 스택, 포커스 상태
├── layout.css           — 화면 레이아웃, 베이스캠프 사이드바/메인 그리드
├── cards.css            — 카드 전 종류 (표준/장소/랜드마크/NPC/환경)
├── board.css            — 3행 보드, 슬롯 그리드, 드롭 상태
├── ui.css               — HUD, 스탯 바, 소음/무게 미터
├── modals.css           — 범용 모달 오버레이 시스템
├── animations.css       — 키프레임 애니메이션 전체
├── equipment.css        — 장비 모달 3-패널 레이아웃
├── skills.css           — 스킬 모달
├── landmark.css         — 랜드마크 카드 특수 스타일
├── basecamp-modal.css   — 베이스캠프 모달
├── settings.css         — 설정 모달
├── screens-menu.css     — 메뉴 화면들
├── screens-combat.css   — 전투 화면
├── screens-game.css     — 게임 화면 (레거시)
├── npc-panel.css        — 우측 NPC 패널
├── npc-group.css        — 그룹 스탯 패널
├── cinematic.css        — 시네마틱 연출
└── mobile.css           — 모바일 보정
```

---

## 12. 접근성

- 모든 화면/패널/모달에 `role`, `aria-label` 적용
- 모달: `role="dialog" aria-modal="true"`
- 알림: `role="log" aria-live="polite"`
- 포커스 가시화: `outline: 2px solid var(--accent-primary)`
- 스탯 색상은 텍스트/아이콘으로 보조 (색상만 의존 않음)
- ESC 키로 모달 닫기, 모달 포커스 트랩

---

## 13. 디자인 의도 & 원칙

**무드:** 화려한 판타지 어둠이 아닌 관료적 붕괴의 질감. 군사 매뉴얼과 한국 공공기관 서류가 뒤섞인 생존 기록.

**참고작:** Balatro (잠긴 팔레트 + 레트로 일관성), Cultist Simulator (레이아웃 자체가 분위기)

**핵심 원칙:**
1. 색상이 게임 상태를 전달 — 장식 없음
2. 모든 애니메이션은 의도적 — 상태 변화 전달 목적
3. 앰버 = 낮/생존/제작, 블루 = 야간/위험/정보 (이분법 엄수)
4. 정보 밀도 우선 — compact spacing
5. 그레인 텍스처(SVG 인라인 노이즈)로 물리적 실감 차별화
