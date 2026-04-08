# Design System — 서울 서바이벌 카드 게임

> Created by /design-consultation — 2026.04.01

## Product Context

- **What this is:** 포스트아포칼립틱 서울을 배경으로 한 브라우저 전용 바닐라 JS 카드 서바이벌 게임
- **Who it's for:** 카드 덱빌더/로그라이크 장르 팬, 한국 유저 중심
- **Space/industry:** 브라우저 카드 서바이벌 게임 (Slay the Spire, Cultist Simulator, Balatro 등과 동일 장르)
- **Project type:** Browser game — 인벤토리 보드 + 사이드바 HUD + 모달 오버레이

## Aesthetic Direction

- **Direction:** Industrial/Utilitarian — 서울 일상의 아포칼립스
- **Decoration level:** intentional
  - 미묘한 CSS 그레인 텍스처 (board 배경)
  - 카드 입장 micro-animation
  - 야간 시 앰비언트 플리커 + 스캔라인
  - 장식용 요소 없음 — 모든 장식이 게임 상태를 전달
- **Mood:** 화려한 판타지 어둠이 아닌, 관료적 붕괴의 질감. 군사 매뉴얼과 한국 공공기관 서류가 뒤섞인 생존 기록. 사물이 귀해지는 일상의 끝.
- **Research reference:** Balatro(잠긴 팔레트 + 레트로 일관성), Cultist Simulator(레이아웃 자체가 분위기)
- **Genre differentiation:**
  - Layer 1(기본값): 어두운 배경 + 앰버 액센트 + 등급별 색상 코딩 ✓ 이미 구현
  - Layer 2(트렌드): 잠긴 팔레트 + 레트로 터미널 아이덴티티
  - Layer 3(차별화): 마법이 아닌 일상적 아포칼립스 — 비판타지 색상 어휘, 물리적 질감

## Typography

- **Primary (전체):** `'JetBrains Mono', monospace`
  - Courier New 대비 화면 렌더링 20% 선명, 14px 소문자 가독성 대폭 향상
  - 터미널/산업 톤 유지하면서 실제 가독성 확보
- **Display/Modal title only:** `'Geist', 'JetBrains Mono', monospace`
  - 모달 `.modal-title`, 주요 섹션 헤딩에만 적용
  - 동일한 산업/모노 어휘 유지하되 계층 구조 생성
- **Loading:** Google Fonts CDN
  ```html
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Geist:wght@400;500;700&display=swap" rel="stylesheet">
  ```
- **Scale (기존 변수 유지):**
  - `--font-size-xs: 14px` — 스탯 라벨, 배지, 세부 정보
  - `--font-size-sm: 15px` — 카드명, 버튼
  - `--font-size-base: 17px` — 본문
  - `--font-size-md: 19px` — 서브헤딩
  - `--font-size-lg: 22px` — 모달 타이틀 (Geist 적용)
  - `--font-size-xl: 28px` — 주요 화면 타이틀

## Color

- **Approach:** restrained — 1 웜 액센트 + 1 콜드 액센트 + 뉴트럴. 색상이 게임 상태를 전달.
- **전략:** 앰버(☀) = 낮/생존/제작, 블루(🌙) = 야간/위험/정보. 두 축의 의미적 분리.

### 배경 계층
| 변수 | 값 | 용도 |
|------|-----|------|
| `--bg-void` | `#0a0a0a` | 화면 외부, 최심부 |
| `--bg-base` | `#0d0d0d` | 보드 영역 (야간: `#090d12`) |
| `--bg-surface` | `#141414` | 패널, 사이드바 |
| `--bg-raised` | `#1a1a1a` | 카드, 버튼 기본 |
| `--bg-hover` | `#222222` | 호버 상태 |

### 텍스트
| 변수 | 값 | 용도 |
|------|-----|------|
| `--text-primary` | `#d4c9a8` | 메인 텍스트 — 따뜻한 담황색 |
| `--text-secondary` | `#8a8070` | 보조 정보 |
| `--text-dim` | `#555040` | 라벨, 비활성 |
| `--text-danger` | `#e05050` | 위험, 체력 위기 |
| `--text-warn` | `#e0a030` | 경고 |
| `--text-good` | `#60b060` | 성공, 긍정 |
| `--text-info` | `#5090c0` | **야간 액센트** — 정보, 야간 HUD |

### 액센트
| 변수 | 값 | 용도 |
|------|-----|------|
| `--accent-primary` | `#c8a060` | **웜 액센트** — 제작, 낮, 퀘스트, 중요 UI |
| `--accent-dim` | `#6b5535` | 액센트 테두리, 약화 상태 |

- **야간 모드:** `--bg-base` → `#090d12` (청색 틴트), 야간 HUD 플리커 활성화, 스캔라인 오버레이

## Spacing

- **Base unit:** 4px (현행 유지)
- **Density:** compact — 정보 밀도 우선, 게임 UI에 적합
- **Scale (기존 변수 유지):**
  - `--gap-xs: 4px`
  - `--gap-sm: 8px`
  - `--gap-md: 12px`
  - `--gap-lg: 16px`
  - `--gap-xl: 24px`

## Layout

- **Approach:** grid-disciplined
- **Basecamp:** `200px` 사이드바 + `1fr` 메인 그리드
- **카드:** `110px × 150px` 고정 (유지)
- **슬롯:** `120px × 160px` 고정 (유지)
- **Max content width:** 제한 없음 (전체 뷰포트)
- **Border radius:** 계층적
  - `--radius-sm: 4px` — 버튼, 배지, 소형 요소
  - `--radius-md: 6px` — 카드, 중형 패널
  - `--radius-lg: 10px` — 모달, 주요 컨테이너

## Motion

- **Approach:** intentional — 게임 상태를 물리적으로 전달하는 애니메이션만
- **Easing:** enter(`ease-out`) exit(`ease-in`) move(`ease-in-out`)
- **Duration:**
  - micro: `120ms` — 호버, 색상 전환 (`--transition-fast`)
  - short: `220ms` — 모달 스케일, 오버레이 (`--transition-mid`)
  - medium: `400ms` — 퀘스트 바, 계절 배지 (`--transition-slow`)
- **새로 추가할 애니메이션:**
  1. **카드 입장** `150-180ms ease` — `translateY(6px) + opacity 0→1 + scale(0.97→1)`, 40ms stagger
  2. **야간 HUD 플리커** `8s ease-in-out infinite` — opacity 1→0.85→0.92→0.88→1, 야간 상태 전용
  3. **야간 배경 틴트** CSS 변수 전환으로 구현, `--bg-base` 값 교체
- **이미 구현됨:** 알림 slideInRight + fadeOut ✓, 모달 scale transition ✓, 호버 전환 ✓

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-01 | JetBrains Mono로 폰트 전환 | Courier New는 14px에서 가독성 저하. JetBrains Mono는 화면 렌더링 최적화 모노스페이스로 산업 톤 유지하며 가독성 확보 |
| 2026-04-01 | 모달 타이틀에 Geist 추가 | 동일 산업 어휘 내에서 계층 구조 생성. 모달과 일반 UI 라벨 구분 |
| 2026-04-01 | 야간 액센트 전략 확립 | `--text-info: #5090c0`을 야간 전용 액센트로 공식화. 웜(앰버)=낮, 콜드(블루)=야간 이분법 |
| 2026-04-01 | 보드 배경 그레인 텍스처 | CSS SVG 인라인 노이즈. 장르 내 물리적 실감 가진 게임이 거의 없음 — 차별화 포인트 |
| 2026-04-01 | 카드 입장 micro-animation | 인벤토리 변화 시 시각적 피드백 강화. 150-180ms로 게임 리듬 방해 없음 |
| 2026-04-01 | Courier New 유지 결정 취소 | 연구 결과 JetBrains Mono가 화면 렌더링에 더 적합 |
