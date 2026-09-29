# 직업별 초반 인터랙션 구현

승인 근거: `docs/analysis/2026-09-21-early-interaction-and-direction-review.md` 및 사용자의 구현 요청.

실행 상태(2026-09-27): 아래 1~5 구현·기능 검증 완료. 최종 결과와 자연 수급 검증의 한계는 `docs/analysis/early-interaction-execution/verification-summary.md`에 기록했다.

## 범위와 작업 순서

1. 기반 복구: `CharCreate._startGame`, `NPCSystem`의 시작 동료·직업 조건, `NPCStorySystem`의 제작·탐색·동행 계약, `cinematicScenes.js` 자산 경로. 재현 테스트 후 수정한다.
2. 목표 정합성: `QuestSystem`과 여섯 직업 `shared.js`에서 실제 제작·치료와 목표 문안을 맞춘다. 완료 이력과 분기 그래프를 유지하고 진행 중 목표의 이전 기준을 명시한다.
3. 대화 묶음: `careerDialogues.js`, `CareerDialogueSystem.js`, `CareerDialogueScene.js`에 직업당 핵심·생활 각 한 편을 구현한다. 질문·선택·미루기·실제 행동·후속 반응·다음 동선을 연결한다.
4. 통합 및 연출: `main.js`, `QuestPanel.js` 진입·재개 경로, 첫 전문 행동 여섯 결과와 첫 밤·위험 안내를 기존 `DialogueScene` 큐에 연결한다. 효과를 꺼도 정보를 읽을 수 있게 한다.
5. 독립 검토와 통합 검증: 관련 단위/통합 테스트, 데이터 검사, 웹 빌드, 실제 브라우저에서 선택·재개·화면을 확인한다.

## 사전 경계 결정

| 경계 | 결정 | 검증 |
|---|---|---|
| 기존 미커밋 작업 | 현재 `codex/career-progression`을 그대로 사용하고 커밋·정리·체크아웃하지 않는다 | 변경 파일 소유 범위를 분리 |
| 기반/대화 | `exploreCompleted`는 실제 성공 탐색에만 발행, 제작은 `craftComplete` | 취소·실패·중복 회귀 테스트 |
| 대화/퀘스트 | 새 대화 상태는 별도 flags 아래 저장, 기존 완료 이력 취소 금지 | 저장 복원 및 분기 회귀 |
| 상태/연출 | 실제 행동 완료 뒤 연출, 표시·건너뛰기 자체로 보상하지 않는다 | 연타·재생·저장 테스트 |
| 초기 위치 | 현재 직업별 시작 구 유지, 용산 이동 이유를 문안으로 연결 | 캐릭터 데이터 및 목표 확인 |
| 연출 규모 | 기존 장면·자산과 상태 표현 사용, 신규 장편 영상·60편 확장 제외 | 12편과 여섯 성공 장면 확인 |

작업 기록은 `docs/analysis/early-interaction-execution/`에 보존한다. 미커밋 변경을 포함한 검토가 필요하므로 커밋 SHA 기반 scratch 삭제 대신 파일별 보고서와 테스트 증거를 남긴다.
