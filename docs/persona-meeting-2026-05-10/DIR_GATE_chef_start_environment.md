# Director 게이트 — chef 시작 환경 비대칭

> 작성: Director 서민호 / 2026-05-11
> 의제: chef `homeDist: 'junggoo'` dangerLevel **5** 격차를 어떻게 처리할 것인가
> 결정: **option (c) 통과** — junggoo 유지 + chef 전용 시작 보정 ability 신설. 수치는 밸런스 권지나 위임.

---

## 1. 컨텍스트 (Why)

`SYS_PR1_sim_v2_report.md` § 5 실측 발견:

| 직업 | startDistrict | dangerLevel |
|------|---------------|-------------|
| doctor | dongjak | 1 |
| soldier | dobong | 1 |
| firefighter | eunpyeong | 1 |
| homeless | gwangjin | 2 |
| engineer | yongsan | 3 |
| pharmacist | gangnam | 3 |
| **chef** | **junggoo** | **5** ⚠️ |

chef만 dangerLevel 5. 다른 6직업 평균 1.83. **격차 +3.2 등급.**

추가 실측 (인접 구):
- junggoo adjacent: yongsan(dangerLevel 3, encounter 0.15) / dongdaemun(dangerLevel 2, encounter 0.05)
- junggoo 자체: dangerLevel 5, encounter 0.35

C1 PR(`SCN_PR_chef_knife_mastery.md`)로 자원 비대칭은 해소했으나 **환경 비대칭은 그대로.** baseline 측정 시 chef K1이 다른 직업 대비 -10%p 이상 가능성. PD 김재훈 `BAL_SIM_baseline_v1.md` § 4의 회귀 영향 검사 기준 위반.

---

## 2. 옵션 분석

| 옵션 | 내용 | 게임 정체성 | 사망률 | 다른 직업 영향 |
|------|------|-------------|--------|----------------|
| (a) 현행 유지 | junggoo dangerLevel 5 시작 | ✅ 100% | ❌ 매우 높음 | 없음 |
| (b) startDistrict 변경 | dongdaemun(인접, dangerLevel 2)으로 이동 | ⚠️ narrative 약간 어긋남 | ✅ 다른 직업 수준 | 없음 |
| (c) junggoo 유지 + chef 전용 ability | "셰프의 직감" — 시작 7일 encounter ×0.5 | ✅ 100% | ✅ 완화 | 없음 |
| (d) junggoo dangerLevel 자체 변경 | 5 → 3으로 하향 | ⚠️ 도심 무너짐 어휘 약화 | ✅ 완화 | ⚠️ 모든 직업의 junggoo 방문 영향 |

---

## 3. Director 6 게이트 — 각 옵션별 평가

### 옵션 (a) — 현행 유지

| 게이트 | 결과 |
|--------|------|
| 1. 약속 강화 | 필러 §3 ✅ + 필러 §4 ⚠️ (자원 부족 = OK이지만 절단 효과는 게임 불가능) |
| 2. 카드 표현 | junggoo 카드 = OK |
| 3. 트레이드오프 | ❌ chef 사망 곡선이 너무 급해 트레이드 자체 발생 안 함 |
| 4. 6직업 차이 | ❌ 격차 +3.2 등급. 5%p 룰 위반 가능성 |
| 5. 세계관 정합성 | ✅ |
| 6. 삭제 가능성 | ❌ 빼면 잃는 것이 명확한가? — "어려운 chef"는 빼도 게임 동일 |

**4 게이트 통과, 2 게이트 거절.** → **거절.**

### 옵션 (b) — startDistrict 변경 (dongdaemun)

| 게이트 | 결과 |
|--------|------|
| 1. 약속 강화 | 필러 §3 ⚠️ (chef = 남대문시장 일부 약화) |
| 2. 카드 표현 | dongdaemun 카드 (의류시장) = chef와 어색함 |
| 3. 트레이드오프 | ⚠️ chef goal은 남대문이지만 시작이 dongdaemun이면 둘이 분리 |
| 4. 6직업 차이 | ✅ 다른 직업 수준 |
| 5. 세계관 정합성 | ⚠️ chef story·goal과 어긋남 |
| 6. 삭제 가능성 | dongdaemun 시작을 빼고 junggoo 복귀하면 잃는 것 있는가 — 없음 |

**4 게이트 통과 (대부분 부분적).** → **보완 후 재검토.**

### 옵션 (c) — junggoo 유지 + chef 전용 ability ⭐

| 게이트 | 결과 |
|--------|------|
| 1. 약속 강화 | ✅ 필러 §3 (chef 정체성), §4 (자원 부족 유지하되 절단 회피), §5 (회색 — 7일 보정 후 위험 풀가동) |
| 2. 카드 표현 | ✅ chef 능력 카드 ("셰프의 직감") + junggoo 카드 |
| 3. 트레이드오프 | ✅ chef는 7일 보정 윈도우 안에 자원 채집 vs 인접 구 이동 결정 |
| 4. 6직업 차이 | ✅ chef만의 시작 메커니즘. 다른 직업과 카드로 구별 |
| 5. 세계관 정합성 | ✅ chef = 호텔 셰프 = 명동(junggoo) 익숙함. narrative 정합 |
| 6. 삭제 가능성 | ✅ 보정 없으면 chef 직업 게임 불가능. 빼면 잃는 것 명확 |

**6 게이트 모두 통과.** → **통과.**

### 옵션 (d) — junggoo dangerLevel 자체 변경

| 게이트 | 결과 |
|--------|------|
| 1. 약속 강화 | ⚠️ 필러 §1 (관료적 붕괴) — 도심 무너짐 어휘 약화 |
| 2. 카드 표현 | ⚠️ junggoo dangerLevel 3 카드는 narrative description ("좀비 무리가 도심을 완전히 점령")과 불일치 |
| 3. 트레이드오프 | ✅ |
| 4. 6직업 차이 | — chef 외에는 영향 없음 |
| 5. 세계관 정합성 | ❌ "도심을 완전히 점령" + dangerLevel 3은 모순 |
| 6. 삭제 가능성 | — |

**5 게이트 통과, 2 게이트 거절 (필러 §1 + 세계관).** → **거절.**

---

## 4. 페르소나 발언

### 4.1 Director 서민호
> "결론 — option (c). 6 게이트 모두 통과. junggoo의 위험은 게임 약속이고 chef의 절단 회피도 게임 약속이다. 두 약속을 동시에 지키는 유일한 옵션."

### 4.2 시나리오 한도연
> "동의. chef abilities에 5번째 '셰프의 직감' ability 추가 또는 기존 ability(예: `ingredient_eye`)에 효과 통합. 'toxinDetect: true'와 'startDistrictGracePeriod: 7'을 같은 ability에 결합하면 narrative ('식재료 감별' 능력자가 명동 골목을 잘 안다)와도 정합."

### 4.3 시스템 백승호
> "구현 측면: `gs.player.startDistrictGracePeriod` 플레이어 필드 신규 + `NoiseSystem` 또는 `ExploreSystem` 에 day < graceEnd 분기 추가. 또는 character abilities effect에 새 키 `encounterMultDays: { days: 7, mult: 0.5 }` 도입 후 ExploreSystem에서 처리. 후자가 단일 진리·범용성에 더 좋다."

### 4.4 밸런스 권지나
> "수치는 baseline 결과 보고 결정. 일단 시안 — 시작 7일 encounter ×0.5. baseline에서 chef K1이 -5%p 이내면 OK. 격차 -5%p ~ -10%p면 ×0.4로 강화. -10%p 초과면 7일 → 10일로 윈도우 확장. 본 게이트 통과로 메커니즘 도입은 승인, 수치는 BAL_TUNING_chef_grace.md 후속."

### 4.5 설정 이수정
> "어휘 — '셰프의 직감'은 LORE_GLOSSARY 신규 등록. 직업 시각 어휘 (chef: 식자재 검수·보존식)와 정합. 다만 '7일 윈도우'를 narrative에 어떻게 풀지는 시나리오·시스템 합의 후 본문 등록."

### 4.6 레벨 조윤성
> "junggoo 자체는 변경 없음. dongdaemun(adj, dangerLevel 2)이 chef의 자연 이주 경로. baseline 시뮬에서 chef가 day 8 이후 dongdaemun으로 빠지는 빈도를 K2 (이주 빈도) 신규 KPI로 측정 권고."

### 4.7 PD 김재훈
> "통과. baseline 측정 결과로 (c) 수치 확정. C1 PR과 본 게이트 결정은 모두 chef 직업 정상화에 필요. M2에서 시나리오·시스템 합동 PR."

---

## 5. 결정 (Director)

**option (c) 통과.**

### 5.1 후속 PR (M2)

**PR 1 — 새 ability effect 키 도입 (시스템 백승호):**
- `js/data/characters.js` chef abilities 1개에 `encounterMultDays: { days: 7, mult: 0.5 }` 추가.
- `js/screens/CharCreate.js` line 280대에 `e.encounterMultDays` 적용 분기 추가.
- `gs.player.encounterMultDaysEnd` 플레이어 필드 신규 (시작 day + days).
- `js/systems/ExploreSystem.js` 또는 `NoiseSystem.js`에서 `gs.time.day <= gs.player.encounterMultDaysEnd` 분기로 encounter ×0.5.

**PR 2 — chef ability 설계 결합 (시나리오 한도연):**
- 옵션 A: 신규 ability `cook_intuition` (셰프의 직감) 추가.
- 옵션 B: 기존 `ingredient_eye`에 startingDistrictGracePeriod 결합.
- 권고: 옵션 A (ability 4 → 5개, 다른 직업 abilities 5~6개와 정합).

**PR 3 — 글로서리 (설정 이수정):**
- LORE_GLOSSARY v0.4에 "셰프의 직감" 어휘 등록.

**PR 4 — 시뮬 v2 갱신 (시스템 백승호):**
- characterAdapter.mjs가 `encounterMultDays` 자동 derive.
- 시뮬에서 day < 8 분기 검증.

### 5.2 baseline 측정 (밸런스 권지나)
- chef 100회 baseline. K1 측정.
- 시안 ×0.5 / 7일이 다른 직업 K1과 5%p 이내 격차 만들면 채택.
- 격차 5%p 초과 시 수치 재조정 후 100회 재측정.

### 5.3 검수 (Director 후속)
PR 1~4 머지 후 `DIR_VERIFY_chef_start_grace.md` 별도 산출. 6 게이트 재검증.

---

## 6. 위임 / 후속

| ID | 작업 | 담당 | 데드라인 |
|----|------|------|----------|
| D1.1 | `encounterMultDays` effect 키 시스템 도입 PR | 시스템 백승호 | M2 |
| D1.2 | chef abilities 5번째 `cook_intuition` 추가 PR | 시나리오 한도연 | M2 |
| D1.3 | LORE_GLOSSARY v0.4 어휘 등록 | 설정 이수정 | M2 |
| D1.4 | 시뮬 v2 characterAdapter 자동 derive 검증 | 시스템 백승호 | M2 |
| D1.5 | `BAL_TUNING_chef_grace.md` baseline 측정 후 수치 확정 | 밸런스 권지나 | M2 (baseline 후) |
| D1.6 | Director 검수 `DIR_VERIFY_chef_start_grace.md` | Director 서민호 | M2 종료 직전 |

---

## 7. 위험

- **R1.** chef abilities 5개 = doctor(5)·soldier(5)·firefighter(5)·homeless(5)·engineer(5)·pharmacist(4)와 정합. 단 ability 개수가 시각 슬롯에 영향 — AD 정해린 검수 필요.
- **R2.** `encounterMultDays` 키가 다른 직업에도 확장 가능 — 직업별 시작 환경 보정 시스템으로 일반화 가능. 단 chef 외 활용처 미상.
- **R3.** baseline 시점에 chef가 7일 안에 dongdaemun으로 이주하지 않으면 보정 의미가 약함. 시나리오의 chef AI(자동 이동?) 또는 메인 퀘스트 가이드 필요. 한도연 후속.

---

## 8. 결론

chef 시작 환경 비대칭은 **option (c)** 로 해소. 게임 정체성(junggoo 시작) 유지 + 절단 효과 회피 + 6 게이트 모두 통과 + 다른 직업 영향 0. M2에서 5 PR 합동 진행.

baseline 결과가 본 결정의 수치 최종 확정 입력.

---

*문서 끝. M2 진입 시 D1.1~D1.6 트리거. Director 검수는 M2 종료 직전.*
