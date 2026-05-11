# PD 결정 — pharmacist 메인 퀘스트 미로드 P0 hotfix

> 작성: PD 김재훈 / 2026-05-10
> 목적: 약사 메인 퀘스트가 게임 런타임에 로드되지 않는 P0 결함을 차단하고, 동일 결함 재발을 막는 룰을 신설한다.
> 결정: 한다 — 즉시 hotfix.

---

## 1. 컨텍스트 (Why)

`js\data\mainQuests\index.js` 4~9행 import 목록에 `PHARMACIST_QUESTS`가 빠져 있다. 12~20행 병합 객체에서도 누락. 결과: 디스크에 존재하는 `mainQuests\pharmacist\branch_a.js` `branch_b.js` `shared.js` `index.js`가 게임에 도달하지 않는다.

병행 발견 — `mainQuests\pharmacist.js`(단일파일) 1행 주석 "윤재혁 (chef) — 20 퀘스트". 파일명은 pharmacist이지만 내용은 chef 퀘스트의 잔재본. 폴더(`mainQuests\pharmacist\`)가 진짜 약사 퀘스트.

영향: 약사 직업 선택 시 메인 퀘스트 첫 트리거 발화 안 됨. 6직업 다회차 가치 즉시 손상.

---

## 2. 수용 기준 (Definition of Done)

- 약사 시작 → `mq_pharmacist_*` 첫 퀘스트가 `MAIN_QUESTS` 키에 노출
- 다른 5직업(`doctor`, `soldier`, `firefighter`, `homeless`, `chef`, `engineer`) 메인 퀘스트 키 회귀 없음
- `node --input-type=module js/data/validate.js` 통과
- `mainQuests\pharmacist.js`(잔재 chef 내용) 처리 정책 결정·기록

---

## 3. 트레이드오프

| 항목 | 결정 | 사유 |
|------|------|------|
| 진행 중 P2 작업 일시 중지 | 한다 | hotfix 머지 윈도우 우선 |
| `pharmacist.js` 단일파일 즉시 삭제 | 안 한다 | 파일 참조 검사 후 다음 마일스톤 정리 |
| validate.js 룰 신설 | 한다 | 동일 결함 재발 차단 |

---

## 4. 트랙 분배

| 담당 | 작업 | 데드라인 |
|------|------|----------|
| 시스템 백승호 | `mainQuests/index.js` 패치 + validate.js 룰 추가 | 5/14 |
| 시나리오 한도연 | 약사 시작 회귀 확인 | 5/14 |
| 설정 이수정 | `LORE_GLOSSARY.md` 약사 어휘 시드 | M1 |
| 밸런스 권지나 | 약사 100회 시뮬을 baseline에 포함 | M1 |

---

## 5. 패치 (적용 대기)

`js\data\mainQuests\index.js`

```diff
 import DOCTOR_QUESTS      from './doctor/index.js';
 import SOLDIER_QUESTS     from './soldier/index.js';
 import FIREFIGHTER_QUESTS from './firefighter/index.js';
 import HOMELESS_QUESTS    from './homeless/index.js';
 import CHEF_QUESTS        from './chef/index.js';
 import ENGINEER_QUESTS    from './engineer/index.js';
+import PHARMACIST_QUESTS  from './pharmacist/index.js';
 import GLOBAL_QUESTS      from './global.js';

 const MAIN_QUESTS = {
   ...DOCTOR_QUESTS,
   ...SOLDIER_QUESTS,
   ...FIREFIGHTER_QUESTS,
   ...HOMELESS_QUESTS,
   ...CHEF_QUESTS,
   ...ENGINEER_QUESTS,
+  ...PHARMACIST_QUESTS,
   ...GLOBAL_QUESTS,
 };
```

키 충돌 검사: `pharmacist/branch_a.js` `branch_b.js` `shared.js`의 quest id가 다른 직업 키와 겹치지 않는지 grep 검증 후 적용.

---

## 6. 잔재 파일 처리 정책

`mainQuests\pharmacist.js`는 chef 콘텐츠를 보유하나 import 그래프에서 사용 여부 미상. 하나의 PR로 묶지 않는다.

- 1차(M0): 신규 import는 폴더(`pharmacist/index.js`)만 사용. 단일파일은 손대지 않음.
- 2차(M1): `pharmacist.js` 사용처 grep. 미사용이면 삭제, 참조처 있으면 시스템에 분리 PR.

---

## 7. validate.js 룰 신설

신설 검증 항목.
1. 6직업 정식 식별자(`doctor` `soldier` `firefighter` `homeless` `chef` `engineer` `pharmacist`)에 해당하는 quest id prefix가 `MAIN_QUESTS` 키에 최소 1건씩 존재한다.
2. `mainQuests\{직업}\index.js`가 존재하면 `mainQuests/index.js` import 목록에 등록되어 있다.

코드 위치: `js\data\validate.js`. 시스템 백승호 PR.

---

## 8. 위험 요소 (Risk)

- **R1.** `pharmacist.js` 단일파일이 어딘가에서 직접 import 되고 있으면 hotfix 후 키 충돌. → 적용 전 `import.+pharmacist\.js` grep 1회.
- **R2.** 약사 직업의 NPC trust·아이템 보상이 다른 직업 키와 의도치 않게 공유. → 시나리오 한도연 회귀 확인에서 첫 트리거 발화 외 첫 보상 분배 검사 포함.

---

## 9. 측정 지표 (KPI)

- **PASS:** 약사 시작 직후 `MAIN_QUESTS`에서 약사 prefix quest 1개 이상 노출.
- **PASS:** 다른 6직업 시작 회귀 정상.
- **PASS:** `validate.js` 신설 룰 통과.
- **PASS:** 약사 100회 시뮬 결과 100일 생존율 10~20% 범위 (밸런스 후속).

---

*문서 끝. 적용 승인 시 시스템 백승호가 패치 + validate.js 룰 추가, 시나리오 한도연이 회귀 확인.*
