# Card Survival: Ruined City — 서울 25개 구 지도 시스템

> 최종 확정: 2026-03-05
> 이전 계획(Phase A~C 엔딩 시스템)은 하단 아카이브 참조

---

## 요구사항

1. 서울 25개 구(區)로 지역 체계 전환 (기존 12개 동 + 30개 SUB_LOCATIONS 삭제)
2. 실제 지리 기반 인접 구 이동
3. 미니맵에 25개 구 전부 표현 + 현재 위치 표시
4. 베이스캠프를 별도 지역으로 취급하지 않음
5. 카드 이동 = 구 단위로 통일

---

## 변경 파일 목록 (14개)

- [ ] js/data/districts.js — 전면 재작성 (25개 구, SUB_LOCATIONS 삭제)
- [ ] js/data/nodes.js — basecamp 노드 제거, district 기반 통합
- [ ] js/data/items.js — loc_ 카드 31개 → 25개 구 카드 교체
- [ ] js/data/stackConfig.js — loc_ 항목 교체
- [ ] js/data/endings.js — subLocationsVisited 참조 제거, 구 방문 플래그로 교체
- [ ] js/core/GameState.js — subLocationsVisited 제거, districtsLooted 추가
- [ ] js/systems/ExploreSystem.js — exploreCurrentDistrict() 신규, returnToBasecamp() 제거
- [ ] js/ui/ExploreUI.js — 전면 재작성 (인접 구 + 탐색 버튼)
- [ ] js/ui/SeoulMapModal.js — 25개 구 좌표 + SVG 확장
- [ ] js/screens/CharCreate.js — DISTRICTS 25개, homeCampDistrict 제거
- [ ] js/screens/Basecamp.js — 현재 구 이름 표시 추가
- [ ] js/ui/BoardRenderer.js — basecamp 판별 로직 수정
- [ ] js/systems/NoiseSystem.js — basecamp 상태 참조 수정
- [ ] js/systems/CombatSystem.js — nodeId !== 'basecamp' 조건 수정

---

## 이전 계획 (아카이브)

Phase A (서울 지역 시스템) — 완료
Phase B (100종 아이템 시스템) — 완료
Phase C (다중 엔딩 시스템) — 완료
