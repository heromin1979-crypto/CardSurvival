# 글로서리 (Lore Glossary) — v0.5

> 작성: 설정 이수정 / 2026-05-10
> 목적: Card Survival: Ruined City의 모든 고유 명칭·어휘의 단일 진리. 신규 텍스트는 본 글로서리 등록 후에만 사용.
> 결정: 시드. 25개 구·6직업·핵심 어휘만 포함. 이벤트·NPC·아이템 어휘는 후속 추가.

---

## 1. 사용 규칙

- 등록되지 않은 어휘를 본문(`description` `narrative` `body` 등)에 사용 시 검수에서 거절.
- 어휘 신설은 설정 페르소나 이수정 승인. 등록 폼: 이 문서 §5 양식.
- 한/영 라벨 동기화는 워커 윤하민 트랙 G에 통보.

---

## 2. 25개 구 — 정식 명칭

| ID | 한국어 | 영문 | 비고 |
|----|--------|------|------|
| gangnam | 강남구 | Gangnam-gu | dangerLevel 3 / medical |
| gangdong | 강동구 | Gangdong-gu | dangerLevel 2 / urban |
| gangbuk | 강북구 | Gangbuk-gu | dangerLevel 1 / safe |
| gangseo | 강서구 | Gangseo-gu | dangerLevel 2 / urban |
| gwanak | 관악구 | Gwanak-gu | dangerLevel 2 / urban |
| gwangjin | 광진구 | Gwangjin-gu | dangerLevel 2 / urban |
| guro | 구로구 | Guro-gu | dangerLevel 2 / industrial |
| geumcheon | 금천구 | Geumcheon-gu | dangerLevel 2 / industrial / radiation |
| nowon | 노원구 | Nowon-gu | dangerLevel 2 / urban |
| dobong | 도봉구 | Dobong-gu | dangerLevel 1 / safe |
| dongdaemun | 동대문구 | Dongdaemun-gu | dangerLevel 2 / urban |
| dongjak | 동작구 | Dongjak-gu | dangerLevel 2 / urban |
| mapo | 마포구 | Mapo-gu | dangerLevel 2 / urban / radiation |
| seodaemun | 서대문구 | Seodaemun-gu | dangerLevel 3 / medical |
| seocho | 서초구 | Seocho-gu | dangerLevel 3 / urban |
| seongdong | 성동구 | Seongdong-gu | dangerLevel 2 / industrial / radiation |
| seongbuk | 성북구 | Seongbuk-gu | dangerLevel 2 / urban |
| songpa | 송파구 | Songpa-gu | dangerLevel 3 / urban |
| yangcheon | 양천구 | Yangcheon-gu | dangerLevel 1 / safe |
| yeongdeungpo | 영등포구 | Yeongdeungpo-gu | dangerLevel 3 / urban |
| yongsan | 용산구 | Yongsan-gu | dangerLevel 3 / urban / military |
| eunpyeong | 은평구 | Eunpyeong-gu | dangerLevel 1 / safe |
| jongno | 종로구 | Jongno-gu | dangerLevel 4 / warzone / military |
| junggoo | 중구 | Jung-gu | dangerLevel 3 / urban |
| jungrang | 중랑구 | Jungrang-gu | dangerLevel 2 / urban |

→ 어휘 사용 시 한국어 정식 표기 우선, 영문은 코드 식별자 외 용도에 사용 금지.

---

## 3. 6직업 — 정식 명칭과 어휘 톤

| 코드 ID | 한국어 직책 | 영문 | 어휘 톤 (이 직업 시각의 본문에서 쓰는 명사) |
|---------|-------------|------|---------------------------------------------|
| firefighter | 소방관 | Firefighter | 출동, 진압, 구조대, 화점, 인명검색, 무전 |
| soldier | 군인 | Soldier | 통제구역, 차단선, 식별, 교전수칙, 진지, 차질 |
| doctor | 의사 | Doctor | 트리아지, 바이탈, 처치, 격리병동, 응급분류, 진료기록 |
| pharmacist | 약사 | Pharmacist | 처방전, 약효, 상호작용, 변질, 보관조건, 약품식별 |
| homeless | 노숙인 | Homeless | 임시거처, 잠자리, 식권, 단속, 방역소, 무료급식소 |
| engineer | 엔지니어 | Engineer | 점검, 부품, 누전, 폐쇄회로, 작업지시서, 정비기록 |
| chef | 셰프 | Chef | 보존식, 위생, 변질, 식중독, 표준식단표, 식자재 검수 |

→ 한 직업 시각의 본문에서 위 어휘 외 영어 음역(예: 메디컬, 시큐어 등) 사용 금지.

---

## 3.5. 7직업 정식 캐릭터 이름 (`characters.js` 단일 진리)

플레이어 캐릭터의 정식 이름·나이·직함. 시뮬·시나리오·다이얼로그 본문에서 사용 시 본 표 참조.

| 코드 ID | 한국어 이름 | 영문 표기 | 나이 | 직함 | 출처 |
|---------|-------------|-----------|------|------|------|
| firefighter | 박영철 | Park Yeong-cheol | 44 | 소방관 | `characters.js` |
| soldier | 강민준 | Kang Min-jun | 29 | 특수전 부사관 | `characters.js` |
| doctor | 이지수 | Lee Ji-su | 38 | 응급의학과 전문의 | `characters.js` |
| pharmacist | 한소희 | Han So-hui | 31 | 약국 원장 (홍대 입구) | `characters.js` |
| homeless | 최형식 | Choi Hyeong-sik | 52 | 전직 사업가 · 노숙인 | `characters.js` |
| engineer | 정대한 | Jeong Dae-han | 35 | 기계공학자 | `characters.js` |
| chef | 윤재혁 | Yoon Jae-hyeok | 33 | 호텔 셰프 | `characters.js` |

→ 본문에서 인물 호칭은 한국어 이름 단독 또는 "직함 ○○○" 형식. 영문 표기는 코드 식별자·UI 라벨 외 사용 금지.

→ 라인 번호는 갱신 비용이 크고 stale 위험이 있어 출처는 파일명만 표기. 단일 진리는 `characters.js`.

---

## 3.6. 캐릭터 어빌리티 어휘 (`characters.js` abilities)

직업별 ability id·이름·서술의 정식 표기. UI 카드와 다이얼로그 본문에서 일관 사용.

### chef (5 abilities)

| id | 한국어 이름 | 서술 어휘 | 출처 |
|----|-------------|----------|------|
| gourmet_sense | 미식 감각 | 요리 아이템 효과 | `characters.js` |
| ingredient_eye | 식재료 감별 | 독성 음식 감지 | `characters.js` |
| warm_meal | 따뜻한 한 끼 | 동료 사기 | `characters.js` |
| knife_mastery | 칼 다루기 | 주방 칼·식재료 | `characters.js` |
| **cook_intuition** | **셰프의 직감** | **명동·남대문 골목 익숙함, 시작 7일 조우 확률 50% 감소** | `characters.js` |

### pharmacist (4 abilities)

| id | 한국어 이름 | 서술 어휘 | 출처 |
|----|-------------|----------|------|
| pharma_kit | 약품 키트 | 진통제·소독약·붕대 | `characters.js` |
| compounding | 조제 숙련 | 의약품 제작 성공률 | `characters.js` |
| natural_remedy | 천연물 지식 | 독성 음식 감지 | `characters.js` |
| medicine_efficacy | 약효 숙지 | 의료 아이템 사용 효과·붕대 HP 보너스 | `characters.js` |

### 어휘 검수 결과

- "셰프의 직감" — 영어 음역 0건, 클리셰 0건, 직업 시각 어휘 (chef row of §3) 정합. ✓
- "조제 숙련" / "약효 숙지" / "천연물 지식" — pharmacist 어휘 (처방전·약효·상호작용) 정합. ✓
- "주방 칼" / "식재료" — chef 어휘 (식자재 검수·보존식) 정합. ✓
- "명동·남대문 골목 익숙함" — narrative와 정합 (`mq_pharma_01`은 약사·`mq_chef_01`은 셰프, 두 직업 모두 도심). ✓

---

## 4. 핵심 시스템 어휘

| 한국어 | 영문/코드 | 정의 |
|--------|-----------|------|
| 통제구역 | controlled zone | 군이 차단선을 친 후 출입을 제한한 구역. dangerLevel 4+ 구의 본문에 사용 권장. |
| 검역 / 격리 | quarantine | 감염자 분류·격리. doctor·pharmacist 본문에서 우선. |
| 민방위 | civil defense | 폐허 도시의 자치 조직 어휘. homeless·engineer 본문에서 우선. |
| 재난문자 | emergency alert | 게임 내 텍스트가 폐허 잔재로 등장할 때의 형식. cinematicScenes·notify 톤에 사용 가능. |
| 봉쇄선 / 차단선 | cordon | 군용 어휘. soldier·firefighter 본문에서 우선. |
| 임시청 / 합동대책본부 | task force HQ | 폐허 거점 어휘. landmark description에 사용 가능. |
| 트리아지 / 응급분류 | triage | doctor 어휘. `mq_doctor_*` 본문에 사용. |
| 약효 / 상호작용 | efficacy / interaction | pharmacist 어휘. |
| 출동 / 진압 | dispatch / suppress | firefighter 어휘. |
| 야전교범 / 작전명령서 | field manual / operation order | soldier 어휘. |
| 처방전 | prescription | pharmacist 어휘. |
| 보존식 / 식자재 검수 | preserved food / inspection | chef 어휘. |
| 작업지시서 / 정비기록 | work order / maintenance log | engineer 어휘. |

---

## 5. 어휘 등록 양식

신규 어휘 추가 시 다음 양식으로 §4 또는 §6에 추가.

```
| 한국어 | 영문/코드 | 정의 | 사용 직업/문맥 | 등록일 |
|--------|-----------|------|----------------|--------|
| 약효 | efficacy | 약품의 작용 강도. 변질 시 감소. | pharmacist | 2026-05-10 |
```

---

## 6. 금지 어휘 (블랙리스트)

본문에 사용 시 검수 거절.

| 금지 어휘 | 사유 | 대체 |
|-----------|------|------|
| 마법, 마나, 던전, 보스, 레이드 | 판타지 톤 (신념 §2 위반) | 시스템 명칭으로만 한정. 본문 사용 금지. |
| 아포칼립스 | 영어 음역 | 재난, 붕괴, 폐허 |
| 운명, 각성, 선택받은 자 | 클리셰 | 구체적 사건·상황 묘사로 대체 |
| ~의 기록, ~의 흔적 | 클리셰 | 구체적 잔재(공고문 일부, 메모 한 줄, 서식 일부) 묘사 |
| 소녀, 모에, ~짱 | 일본 게임 톤 (신념 §3 위반) | — |
| 은자, 은둔자 | 판타지 인접 (예: `hidden_dobong_hermit_cave`) | 장기 격리자, 자가격리 거주자 |
| 한때 ~였던 (예: "한때 젊음의 거리") | 회고 클리셰 | 직접 묘사 |
| (감상적 1인칭 회고) | 군용 매뉴얼 톤 위반 | 3인칭 관찰자 톤 |

---

## 7. 검수 우선순위 (이슈 1·2·3·4 회의 결과 반영)

1. **`hidden_dobong_hermit_cave.name` "도봉산 은자의 동굴"** — §6 위반. 보완안: "도봉산 자가격리 거처". 시나리오·시스템 PR 시 함께 변경.
2. **`lm_mapo.description` "한때 젊음의 거리였던 홍대"** — §6 회고 클리셰. 보완안: "홍대 클럽 거리 잔해와 합정 발전소 인근이 혼재한다".
3. **`endings.js` death_* narrative** — 회고적 1인칭 톤. 3인칭 관찰자 톤 재작성 권고. 우선순위 P2 (M3 이후).
4. **약사 직업 어휘 시드** — §3 등록 완료. 메인 퀘스트 본문 작성 시 본 글로서리 기반으로 검수.

---

## 8. 갱신 이력

| 날짜 | 버전 | 변경 |
|------|------|------|
| 2026-05-10 | v0.1 | 시드 작성. 25개 구 + 6직업 + 핵심 시스템 어휘 + 블랙리스트. |
| 2026-05-10 | v0.2 | §3.5 7직업 정식 캐릭터 이름 등록 (`characters.js` 단일 진리). 시뮬 v2 검토 L1 보완. |
| 2026-05-11 | v0.3 | §3.5 한소희(약사) 나이 31·직함 등록 + 박영철·강민준 나이·직함 보완 (P0 hotfix v2 머지 후). |
| 2026-05-11 | v0.4 | §3.6 신설 — chef·pharmacist abilities 어휘 정식 등록. cook_intuition "셰프의 직감" 검수 통과. |
| 2026-05-11 | v0.5 | §3.5 doctor 이지수 나이 38·응급의학과 전문의, homeless 최형식 나이 52·전직 사업가 · 노숙인 보완. 라인 번호 stale 위험으로 출처 컬럼은 파일명만 유지. |

---

*문서 끝. 후속: 25 랜드마크 정식 명칭, NPC 명칭, 아이템 명칭, 적/이벤트 명칭 차수 등록 예정.*
