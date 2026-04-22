# 의사(이지수) 플레이 경험 개선 계획 — 8개 개선안

> 최종 업데이트: 2026-04-22
> 상태: Wave 1 착수
> 선행 완료: HospitalSiegeSystem Phase 4 + EmergencyRoomModal UI + 페르소나 5→13 확장 (160/160 테스트 통과)

## 배경

의사 캐릭터 Day 1~30 시뮬레이션 결과, 8개 주요 문제점 식별:
1. Day 10 첫 습격 필패 디자인 (guard 페르소나 확보 확률 ~15%)
2. 원정-환자 허브 이중 손실 (세브란스 원정 5일 간 사기 -10+ 누적)
3. 환자 기여 타입 무작위 (전략 빌드 불가)
4. 사기 이코노미 단방향 (패널티 빈발, 회복 빈약)
5. 의사 전투 약자인데 현장 분기만 존재
6. Day 10/Day 30 이벤트 중첩
7. 루팅 -1/일 영구 감소 비가시 (실제로는 미구현)
8. 시간(TP 72) 감각 추상적

## 실행 계획 — 3 Wave

### Wave 1 — 상수·플래그 조정 (단순, ~4 파일)

| # | 태스크 | 수정 대상 |
|---|-------|---------|
| W1-1 (#4) | 사기 리밸런스 | PatientIntakeSystem, HospitalSiegeSystem, gameBalance.js |
| W1-2 (#5) | Day10↔30 중첩 완화 | HospitalSiegeSystem._checkSchedule |
| W1-3 (#6) | 시간대 HUD 아이콘 | NightSystem 또는 Main.js 렌더 루프 |

### Wave 2 — 시스템 수정·퀘스트 추가 (중간, ~7 파일)

| # | 태스크 | 수정 대상 |
|---|-------|---------|
| W2-1 (#2) | 간호사 자동 대행 + tryIntake 위치 체크 | PatientIntakeSystem, npcs.js |
| W2-2 (#1) | 튜토리얼 습격 + Day7 예고 | mq_doctor_shared, HospitalSiegeSystem |
| W2-3 (#3a) | 환자 롤 기여 타입 가중치 | PatientIntakeSystem._rollPersona |

### Wave 3 — 신규 모달·미니게임 (복잡, ~8 파일)

| # | 태스크 | 수정 대상 |
|---|-------|---------|
| W3-1 (#3b) | 환자 기여 타입 선택권 UI | ContributionChoiceModal 신규, 환자 스키마 altContributions |
| W3-2 (#7) | 서브로케이션 루팅 고갈 구현+UI | GameState, ExploreSystem, LandmarkModal |
| W3-3 (#8) | 의사 전용 대피 미니게임 | HospitalSiegeSystem, Encounter.js |

## Wave별 검증

- 각 Wave 완료 시 `node --input-type=module js/data/validate.js` ALL CLEAR
- 각 Wave 완료 시 `npx vitest run` 전체 통과
- 각 Wave 종료마다 `feat:` 커밋

## 이전 계획

→ `prompt_plan.old2.md` (HospitalSiegeSystem Phase 4 기록)
