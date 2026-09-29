# 직업별 진행 개편 구현·검증 기록

작성일: 2026-09-17, 최종 기능 검증 갱신: 2026-09-20. 기능 구현과 구간 검증 결과이며 연속 캠페인 밸런스 완료 보고가 아니다.

## 구현 상태

| 단계 | 상태 | 근거 |
|---|---|---|
| 0 제작 목표 판정 | 완료 | 결과물·레시피·카테고리 교집합 판정, 제작 완료 횟수 저장, 84개 회귀 통과, 별도 검수 통과 |
| 1 대화 장면 | 완료 | 큐·저장·키보드 보완 후 별도 재검수 PASS, 브라우저 치료/거래/분기 및 축소 가독성 검증 |
| 2 의료 제작·치료 | 치료 실행 완료 | 13환자·3사례·합성약·저장 통합, 기여 복원3건 수정 후442테스트/브라우저/독립 재검수 PASS. 연구 프로젝트는 작업4 의존 |
| 3 수급 기반 | 완료 | 청구 이력·고정 수량·11공급처·최초조사·구세이브 발견권·실제 UI. 자동저장 P2 수정 후86테스트/독립 재검수 PASS |
| 4 직업별 프로젝트 | 완료 | 79공정·227분기 보존, 305회귀+수정112회귀, 실제 발전 소비/백신 이관 보완 후 독립 재검수 PASS |
| 5 지역 경제 | 구현 완료 | 75보상/34공급/25발견·구세이브·UI. 스택배수산출 P1 보완 후80회귀/독립38사례 재검수 PASS. 최종 경제 실측은 작업6 |
| 6 통합 검증 | 기능·구간 검증 완료 / 연속 경제 검증 일부 미완료 | 최종 재검수 PASS, 초반24/준비 중반24, 빌드·E2E 통과. 전투 포함 캠페인과 모든 중반 자연 수급 미검증 |

## 기준선과 기존 문제

- 전체 `npm test`, `npm test -- --maxWorkers=2`를 시도한 뒤 출력 지연으로 중단했다. 이것만으로 무한 대기 오류라고 판단하지 않았다.
- `node tools/verify-progression-tests.mjs`로 단위 테스트 파일을 개별 실행했다. 파일당 45초 제한, 2개 프로세스 병행. 234개 파일 중 229개 통과, 1개 실패, 4개 시간 초과.
- 기존 실패: `CompanionSidePanel.test.js`의 그레인·비네팅 inset 검사. 현행 CSS는 `.bc-main` 내부 레이어 `inset: 0`인데 테스트는 사이드바 너비가 명시된 inset을 찾는다. 이번 제작·퀘스트 수정 전 단독 실행에서도 실패했다.
- 시간 초과: `BossMotionAssetContract`, `CombatPlayerMotionAssets`, `CombatSpriteChromaCleanup`, `CompanionMotionQuality`. Python을 통한 이미지 처리·검증이 포함된다. 통과도 기능 회귀도 확정하지 않았다.
- 후속 확인: 위 4개 이미지 테스트를 파일당 45초 제한 없이 `npx vitest run ... --maxWorkers=2`로 실행하여 **4파일 62테스트 통과**했다(344.32초). 기준선의 시간 초과 4건은 해소됐으며 기존 CSS 검사 1건은 남는다. 로그: `progression-execution/test-results/asset-long-suite.log`.
- `npx vitest run testdata --maxWorkers=2`: 8파일 48개 통과.
- `node tools/check-effect-wiring.mjs`: 효과 키 96개 소비 코드 존재.
- `node tools/editor/check-help-coverage.mjs`: 아이템 필드 208개 도움말 존재. 이 검사는 모든 새 도메인 데이터의 편집기 지원까지 보증하지 않는다.

## 작업별 증거

의료 구현 전 추가 확인: `js/data/patients` 13종은 `woundHealItem` 없이 `NPCS`에 병합된다. 기존 `DragDrop._isWoundHealDrag`와 `NPCDialogueModal` 치료 메뉴는 이 필드를 요구하지만, `BodyStatusModal._renderWoundedNPCs`는 붕대 폴백 안내를 표시한다. 안내와 실행 조건의 연결 누락을 작업 2의 실제 환자 회귀 대상으로 추가했다.

추가 제작 추적 결함: `GameData.blueprints`는 기본·히든만 병합하고 `CraftSystem`은 기본·고급·히든을 병합한다. Node에서 실제 `wind_copper_coil` 조회가 undefined인 것을 확인했다. 작업 0의 산출물 필터 검증과 별개로 고급 레시피 등록 누락이 있어 작업 2에 중앙 데이터 병합 및 실제 고급 레시피 회귀를 추가했다.

- [실행 기록](progression-execution/progress.md)
- [제작 판정 구현 보고](progression-execution/task-0-report.md)
- [제작 판정 별도 검수](progression-execution/task-0-review.md)
- [대화씬 재검수](progression-execution/task-1-rereview.md)
- [의료 치료 구현](progression-execution/task-2-report.md) / [기여 저장 수정](progression-execution/task-2-fix-report.md) / [의료 재검수](progression-execution/task-2-rereview.md)
- [탐색·공급 기반 구현](progression-execution/task-3-report.md) / [자동저장 경계 수정](progression-execution/task-3-fix-report.md) / [공급 재검수](progression-execution/task-3-rereview.md)
- [파일별 테스트 요약](progression-execution/test-results/summary.json)

저장 호환 한계: 변경 전 세이브는 파견 완료 횟수를 저장하지 않았다. 이 값을 0으로 추정해 보상을 재지급하지 않도록 과거 파견자는 등록 복원 후 retired로 이전한다. 이번 변경 이후 저장은 진행 중 파견·남은 기간·횟수를 보존한다.

## 아직 확인하지 않은 범위

6직업 × 봄/겨울 × 난수 조건의 초반24/준비 중반24 구간 검증은 실행했다. 전투를 제외하고 목표 접근을 열거나 준비 재료를 둔 시험의 범위는 task-6-report.md에 명시한다. 정규 신규게임부터 전투·선행퀘스트·장기 생존을 포함하는 연속 완주는 실행하지 않았다.


## 2026-09-20 작업4 마감 및 추가 대화 계획

작업4는 task-4-report.md, task-4-fix-report.md, task-4-rereview.md 참조. 최종 발전은 연료→지역 운영 가능 횟수→실제 펌프/전동 정비 소비로 연결되며 기존 영구 설비의 시운전만 있다는 초기 설명을 대체한다. 연구 해금은 신규/구버전 version1의 완료 상태에서 접근권만 복구한다. 자연 수급/24조건 플레이는 아직 작업6에 남아 있다.

추가 요청의 대화 현황 감사와 선택 확장은 `2026-09-20-dialogue-interaction-plan.md`에 작성했다. 정의 수 집계와 호출 경로를 확인했으며 신규60주제 콘텐츠 구현 완료를 뜻하지 않는다.

## 최종 통합 실행 (2026-09-20)

- 웹 빌드 종료0,29.60초: test-results/final-build.log. 작업5 배수산출 수정 이후 실행.
- 효과 연결96개, 에디터 설명208필드 검사 통과. 데이터 검증 Errors0/기존Warnings183(task-5-fix-validate.txt).
- 실제 대화 E2E 최종 실행 종료0: test-results/final-dialogue-e2e.log. 시작/완료/미결분기/거래/치료/기여선택 저장복원,1920·1280·844뷰포트, pageerrors=[]. 1280/844 최소글자14px/버튼40px 확인. 좁은 기능fixture이며 전체캠페인완주가 아님.
- 전체 npm test -- --maxWorkers=2 실행 완료: 278파일 중272통과/6실패, 3877테스트 중3859통과/15실패/3건 건너뜀(431.69초). 기존 CompanionSidePanel 1건 외14건은 치료 이벤트·탐색 보상·프로젝트 목표의 이전 계약을 검사하므로 실제 새 경로와 대조 중이다. 이 집계를 전체 성공으로 표시하지 않는다. 로그: test-results/final-full-suite.log.

## 최종 수정 이후 검증

- 고급 레시피 자동 해금 누락, 겨울 셰프 운영 선행 잠금, 치료 레벨업 중간 저장을 수정하고 독립 재검수 PASS(task-6-rereview.md). seasonalFallback 에디터 설명도 추가했다.
- 변경 계약 관련 5파일77테스트 통과(task-6-contract-tests.md). 이후 전체에서 자산4파일만 제외한 재실행: 275파일 중274통과/1실패,3816통과/1실패/3skip,60.00초. 남은 실패는 기존 CompanionSidePanel이며 자산4파일62테스트는 앞선 실행 통과(task-6-final-suite.log).
- 최종 빌드20.90초 종료0(task-6-final-build.log), 최종 데이터0오류/183기존경고, 효과96/설명208검사 통과.
- 최종 대화E2E 종료0(task-6-dialogue-e2e.log), 겨울교환 실제1280 UI 클릭·비용·3TP·저장·재입고 비활성 확인/오류0(task-6-winter-ui.json).
- 전체 검토 요약: [직업 진행·수급·대화 검증 정리](2026-09-20-progression-verification-summary.md). 신규 대화60주제는 계획이며 미구현이다.

마지막 수급정책 보강: 드랍 데이터 변경 없이 통나무·잔해 분해/인접 지역 수급으로 최종 초반24조건 모두 탐색도 최대30% 이내 완료. 기계공29~51TP. 셰프 시작완성식 소모 후 실제원료 조리·제공4표본 성공, 작업대분해회수 후재제작2표본 성공. 무보상도구삭제나전체캠페인검증으로확장하지않는다(task-6-report.md).
