# UI #5 — 사이드 알림 메시지 묶음(coalesce) + 컨테이너 스크롤 개선

> 작성일: 2026-05-15 (AD 오은별 요청 — `c:\Users\USER\Downloads\창오류.png` 진단 결과 정리)
> 트랙: UI 시안 트랙 (`prompt_plan.md` §UI 시안 트랙 — UI #5 항목)
> 영향 범위: `js/main.js` + `css/ui.css` + `css/variables.css`. 데이터·게임 로직 변경 0.
> 디자인 기준: `DESIGN.md` §Color/Spacing/Motion, `css/variables.css` `--msg-*` / `--notif-*` 토큰
> 호환성: `EventBus.emit('notify', { message, type })` 호출부 시그니처 보존 — 300+개 호출자 그대로

---

## 1. 증상 (이미지 기준)

| # | 증상 | 시각적 결과 |
|---|------|-------------|
| S1 | 첫 "정보" 카드 본문이 잘리고 다음 "성공" 카드와 겹침 | 컨테이너 상하 경계가 카드 본문을 자름 |
| S2 | "방금" 시간 라벨 + "퀘스트" 태그가 본문 텍스트와 충돌 | 우하단 절대 배치 태그가 2줄 body 위에 얹힘 |
| S3 | "새로운 레시피 해금" 알림 5장이 동시에 표시 | 동일 카테고리 토스트 폭주 |
| S4 | 카드 슬라이드인/아웃 도중 컨테이너 폭이 출렁임 | 자체 스크롤바 등장·소실로 라이아웃 시프트 |
| S5 | 토스트 1장 소멸 시 위 카드들이 한 번에 점프 | leave 애니메이션이 height collapse 없이 즉시 `remove()` |

---

## 2. 원인 — 실제 파일/줄

| 증상 | 파일 | 줄 | 코드 사실 |
|------|------|----|-----------|
| S1, S4 | `css/ui.css` | 534–547 | `#notification-container { max-height: 45vh; overflow-y: auto }` — 1080×0.45 ≈ 486px. 카드 4장 이상이면 자체 스크롤 발생 |
| S2 | `css/ui.css` | 652–663 | `.notif-card-tag { position: absolute; right: var(--gap-md); bottom: var(--gap-sm) }` — body 2줄이면 텍스트 위로 얹힘 |
| S3 | `js/main.js` | 395–407 | `_record()`가 들어오는 `notify` 이벤트마다 `_toast(entry)` 1장씩 push. 묶음·디바운스 0 |
| S3 | `js/main.js` | 264 | `TOAST_LIFE = 6800` 단일 수명, 동시 표시 수 제한 0 |
| S5 | `js/main.js` | 391 | `setTimeout(() => card.remove(), TOAST_LIFE)` — 카드 즉시 DOM 제거 + 컨테이너 `gap-sm`이 한 번에 줄어 점프 |
| S5 | `css/ui.css` | 703–713 | `slideOutRight` 키프레임이 `opacity` + `translateX`만 트랜지션 (height/margin collapse 없음) |
| 토큰 | `css/variables.css` | 107–123 | `--notif-panel-w: 380px` / `--notif-card-h: 72px` / `--msg-*` 폰트·아이콘 토큰 |

원인 함수: `_initNotifications` (`js/main.js:236-450`). 묶음 도입은 이 함수 내부의 `TYPE_MAP` + `_record` + `_toast`만 수정 — 외부 인터페이스 변경 없음.

---

## 3. 해결 방향

### §A. 메시지 코일레스 (의미상 동일 토스트 묶음)

- **묶음 키** `groupKey = ${type}|${signature}` — 살아 있는 카드 중 동일 키 검색.
- **`signature` 산정**:
  - 정형 메시지는 패턴 매칭으로 카테고리 키 부여. 1차 후보:
    - `/^새로운 레시피 해금:/` → `recipe-unlock`
    - `/^아이템 획득:/` → `item-gain`
    - `/^레벨업/` → `levelup`
  - 그 외는 `message`의 첫 24자 normalize (공백/숫자 제거 후 hash).
- **카드 갱신 규칙** (동일 키 카드 존재 시):
  1. 새 카드 만들지 않음. 기존 카드의 count 배지 +1.
  2. `notif-card-body` 본문을 "요약 포맷"으로 재작성.
     - 1장: 원문 그대로.
     - 2~3장: `${첫번째 키워드}, ${두번째 키워드} 외 N개`
     - 4장+: `${카테고리 라벨} ${N}개`
  3. `notif-card-time` `_relTime` 재계산.
  4. `setTimeout` 핸들 리셋 — 마지막 갱신 시점부터 `TOAST_LIFE` 재시작.
- **묶음 비대상** (`TYPE_MAP[*].coalesce: false`):
  - `danger` / `error` — 개별 가독성 우선
  - `npc_quest_complete` / `charDialogue` — 화자별 분리 유지
- **로그(`#message-log`)는 묶음 없음** — `_record`에서 `_log.push(entry)`는 항상 1엔트리 (`js/main.js:397`). 사용자가 로그 열면 모든 항목 시간순 그대로.

### §B. 동시 표시 수 제한 + 오버플로 카운터

- 토스트는 최대 **4장**까지만 표시 (`MAX_TOAST_VISIBLE = 4`).
- 5번째 이상부터는 컨테이너 끝에 슬림 라인 1개:
  ```
  +N개 더 — 로그에서 보기
  ```
  클릭 시 `_openLog()` 호출. 이 라인은 `notif-overflow-line` 클래스로 새로 추가.
- §A 묶음과 결합되면 폭주 시에도 4장 + 1 오버플로 라인으로 안정화.

### §C. 컨테이너 비스크롤 + 카드 line-clamp

- `#notification-container`:
  - `max-height: 45vh` 제거.
  - `overflow-y: auto` → `overflow: visible`.
  - 컨테이너는 토스트 4장 + 오버플로 라인만 담음 — 스크롤 영역 자체를 제거해 폭 변동 차단.
- `.notif-card-body`:
  - 2줄 클램프 적용 (3줄 이상은 ...로 자름).
  - 풀 내용은 메시지 로그에서 확인.
  ```css
  .notif-card-body {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  ```
- `.notif-card-tag` 위치 재조정:
  - 우하단 절대 배치 유지하되 카드 `padding-bottom`을 22px (태그 높이 + gap)로 확보해 본문과 충돌 차단.
  - 또는 `notif-card-header`에 태그를 인라인으로 옮기는 대안 (단계 3에서 둘 중 채택 결정).

### §D. 슬라이드아웃 collapse

- `slideOutRight` 키프레임 확장 — `opacity` + `translateX` 종료 후 `height` / `margin` / `padding` 0으로 트랜지션해 leave-shift를 부드럽게.
  ```css
  @keyframes slideOutRight {
    0%   { opacity: 1; transform: translateX(0); max-height: 200px; }
    60%  { opacity: 0; transform: translateX(120%); max-height: 200px; padding-block: var(--gap-md); }
    100% { opacity: 0; max-height: 0; padding-block: 0; margin-block: 0; border-width: 0; }
  }
  ```
- `.notif-card.is-ephemeral` 애니메이션 duration 재조정 — slide 400ms + collapse 220ms.

---

## 4. 진행 순서 체크리스트 (5단계)

### 단계 1 — `TYPE_MAP` coalesce 플래그 + signature 함수

- [ ] `js/main.js:250-261` `TYPE_MAP` 항목에 `coalesce: boolean` 필드 추가.
  - `info` / `good` / `success` / `SUCCESS` / `warn` / `warning` → `coalesce: true`
  - `danger` / `error` / `ERROR` / `npc_quest_complete` → `coalesce: false`
- [ ] `_initNotifications` 상단에 `SIGNATURE_PATTERNS` 배열 + `_signatureOf(message)` 헬퍼 추가.
  - 1차 패턴 3종: `recipe-unlock` / `item-gain` / `levelup`
  - 매칭 실패 시 normalize 후 24자 hash.
- [ ] `MAX_TOAST_VISIBLE = 4` 상수 + `_groupCards = new Map()` (key → card DOM) 도입.

### 단계 2 — `_record` 묶음 매칭

- [ ] `js/main.js:395-407` `_record(entry)` 본문 재작성.
  - `_log.push(entry)` 로그 적재는 그대로.
  - 토스트 부분만 `_coalesceToast(entry)` 신규 함수로 분기.
- [ ] `_coalesceToast(entry)`:
  1. `mapping.coalesce === false` → 기존 `_toast(entry)` 호출 (단일 카드).
  2. `groupKey = ${type}|${_signatureOf(message)}` 산정.
  3. `_groupCards.get(groupKey)` 존재하면 `_updateCardCount(card, entry)` 호출 + 타이머 리셋.
  4. 미존재 시 `_toast(entry)` 호출 후 `_groupCards.set(groupKey, card)`.
- [ ] `_updateCardCount(card, entry)`:
  - `card.dataset.count = (Number(card.dataset.count || 1) + 1)` 갱신.
  - count ≥ 2면 `notif-card-body` 텍스트를 카테고리 요약으로 재작성.
  - `notif-card-time` `_relTime(Date.now())` 갱신.
  - count 배지 (`notif-card-count`) 마크업 삽입/갱신.
  - 기존 `setTimeout` 핸들 `clearTimeout` 후 재등록.
- [ ] 카드 자연 소멸 시 `_groupCards.delete(groupKey)` 호출 — `setTimeout` 콜백에 추가.

### 단계 3 — 카드 마크업 count badge + line-clamp + 오버플로 라인

- [ ] `js/main.js:378-388` `_toast()` innerHTML — `notif-card-header`에 count badge 슬롯 추가.
  ```html
  <span class="notif-card-count" data-show="false">×1</span>
  ```
- [ ] `css/ui.css:617-642` `.notif-card-header` — count badge 표시 규칙 (`[data-show="true"]`만 표시).
- [ ] `css/ui.css:644-650` `.notif-card-body` — line-clamp 2 적용.
- [ ] `css/ui.css:652-663` `.notif-card-tag` — `.notif-card` `padding-bottom`을 22px 확보 (또는 header 인라인 이동 — 시각 검증 후 결정).
- [ ] 신규 `.notif-overflow-line` 스타일 — 슬림 한 줄, `var(--text-dim)`, 호버 시 `var(--accent-primary)`.
- [ ] `_toast` 후처리 — 컨테이너 자식 수가 `MAX_TOAST_VISIBLE` 초과 시 오버플로 라인 렌더/갱신, 미만이면 제거. 클릭 시 `_openLog()` 호출.

### 단계 4 — 컨테이너 overflow visible

- [ ] `css/ui.css:534-547` `#notification-container`:
  - `max-height: 45vh` 제거 (또는 `var(--notif-card-h) * 4 + var(--gap-sm) * 4` 약 320px로 명시).
  - `overflow-y: auto` → `overflow: visible`.
  - `scrollbar-*` 규칙 제거.
- [ ] 좁은 화면(`@media (max-width: 900px)`, `css/ui.css:1007-1018`)에서는 기존 `transform: translateX(100%)` 토글 그대로 — 모바일에서는 패널 전환이라 스크롤 무관.
- [ ] `css/variables.css` `--notif-card-h: 72px` 유지. 단, 카드 평균 시각 높이가 100~120px임을 감안해 컨테이너가 카드 높이에 따라 자유 신장하도록 둠.

### 단계 5 — `slideOutRight` collapse 키프레임

- [ ] `css/ui.css:703-713` `slideOutRight` 확장 — height/margin/padding/border-width를 0으로 단계적 collapse.
- [ ] `.notif-card.is-ephemeral` 애니메이션 — `slideInRight 280ms ease, slideOutRight 620ms ease 6.2s forwards` (slide 400 + collapse 220 = 620ms 가정, slide phase 끝나야 collapse 시작).
- [ ] `js/main.js:264` `TOAST_LIFE` — 기존 6800ms 유지 또는 collapse 시간 포함해 7200ms로 상향 (실측 후 결정).

---

## 5. 검증

### 정적 검증

- [ ] `node --check js/main.js` — 0 errors
- [ ] `node --input-type=module js/data/validate.js` — Errors 0 ALL CLEAR (데이터 무변경이지만 회귀 차원)

### 헤드리스 브라우저 (1920×1080)

- [ ] 단일 메시지 — 기존과 동일하게 1장 카드 슬라이드인, 6.8초 후 소멸
- [ ] 동일 카테고리 5건 연속 (`new Array(5).fill(0).forEach(i => EventBus.emit('notify', { message: '새로운 레시피 해금: 숯 필터 제작!', type: 'good' }))`) — 카드 1장, count `×5`, body "새 레시피 5개 해금" 요약
- [ ] 다른 카테고리 혼합 — info 1, good 3, danger 1 — 카드 3장(info 1 + good 묶음 1 + danger 1), danger는 분리 유지
- [ ] 7건 입력 시 4장 + "+3개 더" 오버플로 라인 표시, 클릭 시 메시지 로그 열림
- [ ] 카드 소멸 시 아래 카드들이 점프 없이 부드럽게 상승 (collapse 키프레임 시각 확인)
- [ ] 컨테이너 폭이 토스트 추가/제거 중 변하지 않음 (스크롤바 미생성 확인)
- [ ] 콘솔 에러 0건

### 회귀 검증

- [ ] `EventBus.emit('notify', { message, type })` 기존 호출부 시그니처 보존 — `Grep "EventBus.emit('notify'" js/` 결과 0건 수정
- [ ] `EventBus.on('charDialogue', ...)` 핸들러 동작 보존 — NPC 대사 카드는 묶음 제외, 화자별 1장씩 유지
- [ ] `#message-log` 본문은 묶음 영향 없음 — 로그 200건 적재 + 필터 칩 동작 확인

---

## 6. 기대 결과

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| 동시 표시 카드 수 | 무제한 (45vh 자체 스크롤) | 최대 4장 + 오버플로 라인 |
| 동일 카테고리 5건 | 카드 5장 | 카드 1장 + count `×5` |
| 컨테이너 폭 변동 | 스크롤바 등장 시 변동 | 변동 0 (overflow visible) |
| 카드 소멸 점프 | 즉시 collapse → 점프 | 220ms collapse → 부드러움 |
| 본문 잘림 | 컨테이너 경계가 자름 | 카드 내부 line-clamp 2줄 + ... |
| 태그 충돌 | body 2줄 위로 얹힘 | padding-bottom 확보 또는 header 인라인 |

---

## 7. 의도적 비범위 (이번 PR 범위 밖)

- **UI #4 항목**: sticky 알림, FAB 동적 표시, 레거시 `.notification` 데드 코드 제거 — 별도 PR 유지.
- **메시지 로그(`#message-log`) 묶음/요약** — 로그는 시간순 원본 보존이 설계 의도. 이번 변경은 토스트만.
- **`charDialogue` 묶음** — NPC 대사는 화자별 인지가 중요하므로 묶음 비대상.
- **알림 사운드/햅틱** — 게임 시스템 결정 사안, 본 트랙 외.
- **다국어 요약 포맷 키** — `js/data/locales.js` 신규 키 도입은 별도 i18n 트랙으로 분리.

---

## 8. 진행 상황

- [x] 2026-05-15 — `c:\Users\USER\Downloads\창오류.png` 진단 완료, 5단계 plan 작성
- [x] 단계 1 — TYPE_MAP coalesce 플래그 + SIGNATURE_PATTERNS 9종 + `_signatureOf` + MAX_TOAST_VISIBLE 4 + `_groupCards`/`_overflowLine`
- [x] 단계 2 — `_record` → `_coalesceToast` 분기, `_updateCardCount` 도입, 자연 소멸 시 `_groupCards.delete`
- [x] 단계 3 — `.notif-card-count` 슬롯 + body line-clamp 2 + 카드 padding-bottom 22px + `.notif-overflow-line` 신규 + is-pulse 강조 320ms
- [x] 단계 4 — `#notification-container` overflow visible 전환, scrollbar 규칙 제거
- [x] 단계 5 — slideOutRight 3단계 collapse 키프레임, .is-ephemeral 620ms

---

## 9. 참고 자료

- `DESIGN.md` §Color (`--text-info` 야간 액센트), §Motion (`220ms`/`400ms` duration 토큰), §Decisions Log 2026-04-01 항목
- `css/variables.css` §Notification 토큰 (`--notif-panel-w` / `--notif-card-h` / `--msg-*`)
- `css/ui.css` 메시지 UI 개선 패치 v2 (UI #1 산출물, master `3a73cb2`)
- `prompt_plan.md` §UI 시안 트랙 UI #3 (시안 정렬 산출물, master `81b574d`) — 본 plan의 출발점
- AD 디렉션: `C:\Users\USER\.claude\Instructions\briefs\AD_GUIDE_UI_REVAMP.md`
