# Card Survival: Ruined City — 개발 진행 기록

> 최종 업데이트: 2026-03-10
> 이전 계획 아카이브는 하단 참조

---

## 현재 구현 상태 (완료)

### Phase A — 서울 25구 지역 시스템 ✅
- [x] js/data/districts.js — 25개 구, adjacency, 위험도, 랜드마크 필드
- [x] js/data/nodes.js — districts.js 통합 wrapper
- [x] js/data/items.js — loc_{구ID} 카드 25개 + lm_{구ID} 랜드마크 카드 25개
- [x] js/core/GameState.js — board.top 8슬롯, player.equipped, districtsVisited
- [x] js/systems/ExploreSystem.js — exploreCurrentDistrict(), _updateTopRowCards()
- [x] js/ui/ExploreUI.js — 현재 구 배너 + 탐색 버튼 + 인접 구 그리드
- [x] js/ui/SeoulMapModal.js — 25개 구 SVG 미니맵
- [x] js/screens/CharCreate.js — 시작 구 선택 + 랜드마크 카드 배치
- [x] js/screens/Basecamp.js — 현재 구 이름 표시

### Phase B — 100종 아이템 + 제작 시스템 ✅
- [x] items_base.js (41), items_combat.js (25), items_misc.js (34)
- [x] blueprints.js — 36개 레시피
- [x] DismantleSystem, CardContextMenu, InteractionSystem

### Phase C — 전투 + 다중 엔딩 시스템 ✅
- [x] CombatSystem — 다중 적, 상태이상, AI 패턴
- [x] endings.js — 24개 엔딩
- [x] TraitSystem — scavenger / medic / silent

### Phase D — 장비 창 시스템 ✅ (2026-03-06)
- [x] EquipmentSystem.js — equip/unequip, getSlotsForDef
- [x] EquipmentModal.js — 3단 레이아웃 (효과패널·캐릭터·인벤토리)
- [x] StatSystem getArmorEffects() → player.equipped 스캔
- [x] CombatSystem _getPlayerWeapon() → weapon_main 우선

### Phase E — 랜드마크 시스템 ✅ (2026-03-06)
- [x] landmarks.js — 25개 구 × 4~6 세부 장소 (테마별 루팅 테이블)
- [x] LandmarkModal.js — 세부 장소 탐색 UI (1TP, 조우 체크, 루팅)
- [x] CardFactory.js — 현재 위치 카드 클릭 불가 + 골든 테두리
- [x] landmark hover 흔들림 완전 수정

### 밸런스 조정 ✅ (2026-03-06)
- [x] 강남권 8개 구 위험도 +1 (gwanak/dongjak/yangcheon 제외)
- [x] 전 지역 조우 확률 -15%p 일괄 하향

---

### Phase G — 질병·날씨 시스템 ✅ (2026-03-06)
- [x] js/data/diseases.js — 8개 질병 정의 (감기·독감·이질·콜레라·저체온증·열사병·패혈증·방사선질환)
- [x] js/systems/DiseaseSystem.js — 발병·진행·증상·치료·사망 처리
- [x] js/systems/WeatherSystem.js — 계절별 날씨 생성 (4계절×4종), 체온 미세 영향
- [x] js/core/GameState.js — player.diseases[], weather{} 추가 + 직렬화
- [x] js/systems/StatSystem.js — DiseaseSystem.onTP() 연동, 오염 섭취 시 발병 체크
- [x] js/data/endings.js — 질병 사망 엔딩 3개 (오염수, 감염, 열사병)
- [x] js/systems/EndingSystem.js — 질병별 엔딩 매핑 (_selectDiseaseEnding)
- [x] js/screens/CharCreate.js — 신규 시스템 필드 리셋 (봄 시작 보장)
- [x] js/screens/Basecamp.js — 날씨 배지 + 질병 상태 HUD (#disease-status)
- [x] css/layout.css — 날씨 배지·질병 배지·진행 바 스타일
- [x] js/main.js — DiseaseSystem.init(), WeatherSystem.init() 등록

### Phase F — 4계절 서바이벌 시스템 ✅ (2026-03-06)
- [x] js/data/seasonalEvents.js — 날짜 기반 이벤트 16개 (봄4·여름4·가을3·겨울5)
- [x] js/systems/SeasonSystem.js — 계절 판정·수정값·보너스 루팅·이벤트 적용
- [x] js/core/GameState.js — season 필드 + survivedSummer 플래그 + serialize/deserialize
- [x] js/systems/StatSystem.js — 계절별 수분 배수·체온 변화·열사병 로직
- [x] js/systems/ExploreSystem.js — 계절 보너스 루팅 통합
- [x] js/data/endings.js — 계절 엔딩 3개 (survived_summer, winter_survivor, four_seasons)
- [x] js/screens/Basecamp.js — 계절 배지 + SeasonSystem import
- [x] css/layout.css — .bc-season-badge 4계절 색상 스타일
- [x] js/main.js — SeasonSystem.init() 등록

### Phase H — UI/UX 버그 수정 ✅ (2026-03-06)
- [x] 카드 hover 버그 수정 — title 속성 제거, z-index auto, is-current-loc transition:none
- [x] 장소 카드 spawning 애니메이션 → locSpawn(페이드인)으로 교체 (translateY 낙하 제거)
- [x] 랜드마크 카드 위치 변경: top[7](맨끝) → top[1](현재 위치 바로 오른쪽)
- [x] 전투 이미지 깨짐 수정: mix-blend-mode: multiply → normal (어두운 배경에서 이미지 검게 표시되던 문제)
- [x] 위치별 바닥 아이템 저장 — locationFloors{} 시스템 (이동 시 바닥 아이템 해당 지역에 보존)

### Phase I — 스킬 숙련도 시스템 ✅ (2026-03-07)
- [x] js/data/skillDefs.js — 12개 스킬, XP 테이블, getBonuses()
- [x] js/systems/SkillSystem.js — gainXp, getBonus, hasMastery, 레벨업 이벤트
- [x] js/ui/SkillModal.js — 3탭 숙련도 모달 (전투/생존/제작)
- [x] css/skills.css — 모달 스타일
- [x] CombatSystem / StatSystem / ExploreSystem / CraftSystem / DismantleSystem XP 훅 삽입

### Phase J — 게임플레이 확장 ✅ (2026-03-07)
- [x] 장비 슬롯 boots 잠금 해제 + 신발 4종 (running_shoes/hiking_boots/combat_boots/hazmat_boots)
- [x] 랜드마크 탐색 이력 저장 — 재방문 시 루팅 감소 (70%→45%→25%)
- [x] 베이스캠프 레벨업 시스템 Lv.0-5 (js/systems/BasecampSystem.js + BasecampUpgrades 정의)
- [x] 엔딩 갤러리 UI 개선 — 달성일, 카테고리별 통계, 정렬 모드
- [x] 모바일 터치 UX 개선 — 롱프레스 드래그, 햅틱, css/mobile.css
- [x] 퀘스트 시스템 (js/systems/QuestSystem.js) — 7개 계절 퀘스트, 베이스캠프 패널 연동

## 다음 작업 후보

---

## 이전 계획 (아카이브)

### 원래 Phase A 계획 (서울 25구 전환)
변경 파일 14개 — 모두 완료:
districts.js / nodes.js / items.js / stackConfig.js / endings.js / GameState.js / ExploreSystem.js / ExploreUI.js / SeoulMapModal.js / CharCreate.js / Basecamp.js / BoardRenderer.js / NoiseSystem.js / CombatSystem.js
