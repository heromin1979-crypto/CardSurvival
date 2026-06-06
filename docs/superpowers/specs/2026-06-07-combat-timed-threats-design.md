# 전투 재미 강화 — 타이밍 압박 적 + 도구/속성 카운터 디자인

**작성일:** 2026-06-07
**범위(MVP):** 타이밍 압박 아키타입 3종(블로터·스크리머·돌진자) + 사기 격파 승리(인간 적) + 약점 어휘 정리(선행)
**후속 분리:** 인레이저·분열체·매개체·보호체 4종 / 무기별 전용 동작 / 결정적 텔레그래프 / 부위 조준은 별도 스코프

---

## 1. 진단 (실제 코드/데이터 기반)

### 통증
현재 전투는 시스템은 풍부하나 **매 턴 결정이 "공격 버튼 한 번"으로 수렴**한다. 가장 공들인 적 의도 예고(`CombatSystem._decideNextIntent`, CombatSystem.js:827)가 *대응 수단이 없는 정보*라 긴장으로 전환되지 않는다.

### 코드 사실 확인
- **적 9종이 전부 "걸어와서 때린다"** — 스탯·DoT 맛만 다름. 플레이어 *플레이 방식을 바꾸게 하는* 적이 0종 (enemies.js 전수 확인).
- **AI 패턴 6종 중 2종(`sniper`/`predator`)은 죽은 코드** — `_pickTargetByPattern`(CombatSystem.js:807-818)에 구현됐으나 어떤 적에게도 미배정 (enemies.js grep으로 확인: aggressive/normal/defensive/horde만 사용).
- **의도 예고는 정보만 제공** — `_nextIntent`/이니셔티브 바(CombatUI.js:118-187)가 아이콘은 표시하나, 플레이어 대응 액션은 공격/방어/타겟변경뿐. Into the Breach의 "취소·차단 가능한 공격" 대응이 없음.
- **투척물 3종 사장** — `molotov_cocktail`(aoe_fire), `nail_bomb`(aoe_bleed), `smoke_bomb`(guaranteed_flee)이 `throwableAction`(CombatActions.js:37)으로 구현돼 있으나 핵심 루프에서 무시됨.
- **약점/저항 사장** — `weaponWeaknessMult: 1.5`(gameBalance.js:118)로 차이는 크나, 무기 교체에 전용 턴/비용이 없어 처음 든 무기로 끝까지 감.
- **약점 어휘 불일치(선결 버그)** — 일부 무기가 `weaponType: 'pierce'`(pipe_shotgun)·`'sharp'`(masamune·forged_sword)를 쓰는데 `WEAKNESS_LABEL`/`RESIST_LABEL`(CombatUI.js:19-20)·적 weaknesses 어휘(fire/blade/bullet/blunt/explosive/electric)에 없어 약점 힌트가 안 뜨고 카운터가 작동하지 않음.

### 진단 분기 (사용자와 합의)
- 개선 축 = **적 다양성·역할 설계**
- 압박 유형 = **타이밍 압박**(지금 vs 나중) — 짧은 전투(시뮬상 2~7라운드)에서도 작동, 의도 HUD 재활용
- 카운터 레버 = **도구/속성 카운터** — 투척물·약점·의도 예고 3개 휴면 시스템 동시 부활
- 구현 접근 = **A안** — `_nextIntent`/`specialSkills` 확장으로 신규 표면 최소화

---

## 2. 설계 철학 (재미를 만드는 3원칙)

타이밍 압박이 *처벌*이 아니라 *재미*가 되려면:

1. **시계가 읽혀야 한다** — 이니셔티브 바에 `💥3 → 💥2 → 💥1` 카운트다운 + 결과 미리보기. (Slay the Spire: "반응이 아니라 계산"으로 전환)
2. **카운터가 정답이 아니라 트레이드오프여야 한다** — 시계를 멈추려 자원·템포를 쓰면 *다른 위협*이 방치됨. "막을까 vs 레이스할까"가 진짜 선택. (Into the Breach: 취소 가능/불가 구분이 결정에 무게)
3. **도구 없어도 살 길은 있다(공정성)** — 카운터 도구가 없으면 *불리하지만* 레이스/방어로 버틸 수 있게. 도구는 "쉬운 길"이지 "유일한 길"이 아님.

---

## 3. 시스템 아키텍처 (A안)

### 핵심: enemy 정의에 `timedThreat` 필드 추가

```
enemy.timedThreat = {
  id:          'self_destruct' | 'summon_horde' | 'charge_strike',
  chargeTurns: 3,                       // 초기 카운트다운 (라운드 아님, '적 자기 턴' 기준)
  counters: {
    weakness:    ['fire','explosive'],  // 이 속성으로 처치 시 '깨끗한 처리'
    stunDelays:  true,                  // 기절 시 chargeRemaining 증감 여부
    silentSuppress: false,              // silent 처치 시 발동 무력화 여부
  },
  params: { ... },                      // 트리거별 파라미터(피해·소환 수 등)
}
```

런타임 필드는 `rollEnemy`(enemies.js:303)에서 초기화:
```
_chargeRemaining: def.timedThreat?.chargeTurns ?? null
```

`timedThreat`에 충전 중 평타 여부 플래그 추가:
```
chargingAttacks: true   // 충전 중에도 약한 평타 (블로터·스크리머)
                 false  // 충전 동안 평타 포기, 순수 와인드업 (돌진자)
```

### 틱/발동 모델 (모호성 제거)
적의 *자기 턴*에 `_runSingleEnemyTurn`이 다음 순서로 처리:
1. `_chargeRemaining > 0` (충전 중):
   - `chargingAttacks === true`면 약한 평타 1회 수행.
   - `_chargeRemaining -= 1`.
   - 의도 예고(`_nextIntent`)에 다음 턴 임박 상태 갱신.
2. `_chargeRemaining === 0` (발동 턴): `_resolveTimedThreat(enemy)` 호출 → 트리거 실행. (블로터는 이 시점 본체 사망.)

→ `chargeTurns: 1`인 돌진자는 **스폰 직후 첫 턴 = 와인드업(평타 없음, 텔레그래프), 다음 턴 = 강타**가 되어 "준비 → 일격" 리듬이 보장됨. `chargeTurns: 3`인 블로터는 3턴 동안 약한 평타를 하며 카운트다운, 4번째 자기 턴에 자폭.

### 데이터/흐름 변경 지점

```
┌──────────────────────────────────────────────────────────────┐
│  enemies.js                                                    │
│   ├─ 신규 적 3종 정의 (timedThreat 포함)                       │
│   ├─ ENCOUNTER_TABLES DL3~5에 가중치 편입                      │
│   └─ rollEnemy: _chargeRemaining 초기화                        │
│                                                                │
│  CombatSystem.js                                               │
│   ├─ _decideNextIntent: timedThreat 적이면 💥+카운트다운 의도 │
│   ├─ _runSingleEnemyTurn: _chargeRemaining 틱 → 0이면 트리거   │
│   ├─ _resolveTimedThreat(enemy): id별 핸들러 분기 (신규)       │
│   │     ├─ self_destruct → 전 아군 AoE + 감염 구름             │
│   │     ├─ summon_horde  → 적 추가 + 소음 급증                 │
│   │     └─ charge_strike → 단일 대상 강타 + 기절               │
│   ├─ _onEnemyKilled: '충전 중 처치 + 속성' 판정 (신규 분기)    │
│   │     ├─ 블로터: 약점 처치 아니면 인접 소형 사체 폭발         │
│   │     └─ 스크리머: silent 처치면 비명 차단                   │
│   └─ _attackAction: 기절(electric)→충전 적 chargeRemaining 조정│
│                                                                │
│  CombatUI.js                                                   │
│   ├─ _renderInitiativeBar: 💥 + 남은 턴 숫자 + 트리거 라벨     │
│   └─ INIT 슬롯 'charging' 클래스(점멸) — 임박 시 강조          │
│                                                                │
│  gameBalance.js                                                │
│   └─ combat.timedThreats: { ... } 상수 블록 추가               │
└──────────────────────────────────────────────────────────────┘
```

### 의도 HUD 확장
`_decideNextIntent`(CombatSystem.js:827)는 timedThreat가 활성인 적에 대해:
- `iconEmoji = '💥'`(자폭) / `'📣'`(소환) / `'⚡'`(돌진)
- `label = '${남은}턴 후 자폭'` 형태
- 신규 필드 `countdown: enemy._chargeRemaining`

`_renderInitiativeBar`(CombatUI.js:118)는 `intentIcon` 옆에 `countdown` 숫자를 렌더하고, `countdown <= 1`이면 슬롯에 `charging` 클래스를 더해 점멸(css/screens-combat.css 신규 키프레임).

---

## 4. 아키타입 3종 (구체 정의)

### ① 블로터 (자폭 감염자) `zombie_bloater`
- **시계:** `chargeTurns: 3`. 자기 턴마다 1씩 감소, 0이면 **광역 자폭**.
- **자폭(self_destruct):** 플레이어 + 살아있는 모든 동료에게 `params.aoeDamage: [25,40]` 광역 피해 + 감염 구름(`infection +15`). 적 본체는 자폭과 함께 사망.
- **약점/저항:** 약점 `fire`,`explosive` / 저항 `blade`,`bullet`. → 칼·총으로 패면 잘 안 죽어 자폭까지 끌려감.
- **카운터(부활):** 화염병/못폭탄 투척 = 약점 ×1.5 + AoE로 충전 중 처치. **약점 속성으로 처치 시 사체 폭발 없음(깨끗한 처리).** 그 외 처치 시 인접(근접 무기 사용 중) 시 소형 사체 폭발 `params.corpseBurst: [8,14]`.
- **스탯 기준:** HP 45~65, def 0, 느린 공격(낮은 위협의 일반 공격) — 위협은 *시계*이지 평타가 아님.

### ② 스크리머 (소환 신호형) `zombie_screamer`
- **시계:** `chargeTurns: 2`. 0이면 **비명 → 증원 소환**.
- **소환(summon_horde):** `rollEnemy(effectiveDanger)`로 1~2마리 추가 + `NoiseSystem.addNoise(25)`. 전투가 눈덩이.
- **카운터(부활):**
  - `silent` 무기(메스·강화 칼·석궁) 처치 → `counters.silentSuppress: true` → 비명 차단(소환 무력화).
  - `electric`(stun_baton) 기절 → `_chargeRemaining += 1`(1턴 지연).
  - 연막탄 → 전투 즉시 이탈(`guaranteed_flee`).
- **스탯 기준:** HP 30~45, 높은 `stealthDifficulty`(은신 처치 어려움), 평타 약함.

### ③ 돌진자 (강타 준비형) `zombie_charger`
- **시계:** `chargeTurns: 1`(짧음 — "준비 → 다음 턴 일격" 리듬). 텔레그래프 후 다음 자기 턴에 **강타**.
- **강타(charge_strike):** 단일 대상 `params.strikeDamage: [30,45]` + 기절(1턴). 텔레그래프 턴에는 일반 공격 안 함(준비 자세).
- **카운터(부활/기존 레버):**
  - **방어(guard):** 돌진 강타에 방어 시 기존 `guardCounterBonus`(+30%)를 **돌진 한정 ×2 증폭** → "받아치기" 손맛. (무기별 동작 시스템 불필요.)
  - **`electric` 기절:** 충전 중 기절 시 **강타 취소** + `_chargeRemaining` 리셋.
  - 원거리 카이팅: 텔레그래프 턴에 원거리로 두들겨 강타 전 처치.
- **스탯 기준:** HP 35~55, 빠름(`aiPattern: 'aggressive'`), 평타는 약하나 강타가 치명적.

### 조우 테이블 편입 (enemies.js `ENCOUNTER_TABLES`)
- DL3: 블로터 w8, 스크리머 w8, 돌진자 w10 (기존 가중치와 합산 재정규화)
- DL4~5: 각 w12~15로 빈출. DL1~2에는 미등장(초반 학습 보호).
- 단독 출현보다 *조합* 권장(스크리머+일반좀비 = 소환 압박, 블로터+돌진자 = 이중 시계). 단 MVP는 기존 `rollEnemyGroup` 독립 롤 유지, "설계된 팩"은 후속.

---

## 5. 사기 격파 승리 (Break Their Will)

CSFF의 "몸이 아니라 싸울 의지를 꺾는" 승리 경로를 **인간 적 한정**으로 도입. 기존 `morale` 어휘·flee 경로 재활용.

### 데이터
- `type: 'human'` 적(`raider`, `raider_elite`)에 `morale: { min, max }` 추가. `rollEnemy`에서 `currentMorale` 초기화.
- gameBalance.js `combat.moraleBreak`:
  ```
  routThreshold: 0,        // 0 이하 → 도주(rout)
  critMoraleDmg: 25,       // 플레이어 크리티컬 1회당
  allyDeathMoraleDmg: 30,  // 인간 동료 적이 죽는 걸 목격
  intimidateBase: 15,      // (후속) 위협 액션
  ```

### 흐름
- `_attackAction` 크리티컬 시 인간 타겟 `currentMorale -= critMoraleDmg`.
- `_onEnemyKilled`에서 죽은 적이 인간이면 *살아있는 인간 적* 전체 `currentMorale -= allyDeathMoraleDmg`.
- 매 적 턴 시작 `currentMorale <= routThreshold` 체크 → **도주(rout)**: 해당 적을 전투에서 제거, `_allEnemiesDead` 판정 시 routed도 사망으로 간주(부분 전리품: 도주한 적은 `enemyDropChance` 절반).
- 전 인간 적이 죽거나 도주 → 승리.

### 효과
- 좀비 전투(물리 처치) ↔ 인간 전투(의지 격파 가능)의 *질적 차이* — 적 다양성을 한 겹 더.
- 크리티컬·우선 처치에 새 의미(연쇄 도주 유발).

---

## 6. 선행 작업 — 약점 어휘 정리

카운터·약점 힌트가 legible하려면 `weaponType` 어휘를 정규 6종(fire/blade/bullet/blunt/explosive/electric)으로 통일.

- `forged_sword`·`masamune`: `weaponType: 'sharp'` → `'blade'`
- `pipe_shotgun`: `weaponType: 'pierce'` → `'bullet'`
- `smoke_bomb`의 `'utility'`는 약점 상호작용 없음 — 유지(투척 전용).
- 검증: 모든 무기 `weaponType` ∈ {6종 ∪ utility}인지 grep. `WEAKNESS_LABEL`/`RESIST_LABEL` 키와 일치 확인.

---

## 7. 밸런스 가드레일

- 신규 적은 *평타가 아니라 시계*로 위협 → 평타 DPS는 동급 적보다 낮게. (시뮬상 거대좀비·정예약탈자 30%+ 전사율 구간을 넘지 않게.)
- `chargeTurns`는 시뮬 평균 전투 길이(2~7라운드) 내에서 *반드시 한 번은 발동될 수 있게* 설정(블로터3/스크리머2/돌진자1).
- 카운터 도구 미보유 플레이어의 단독 전투 전사율이 동 DL 기존 적 대비 +10%p를 넘지 않도록 `testdata/sim_combat_lethality.mjs`에 신규 적 추가 후 재측정.

---

## 8. 검증 방법

1. `node js/data/validate.js` — 신규 적/아이템 데이터 정합성.
2. `testdata/sim_combat_lethality.mjs`에 신규 적 3종 + 사기 격파 분기 추가 → 10,000회 재시뮬, 전사율·평균 라운드 확인.
3. 단위 테스트(tests/unit): `_resolveTimedThreat` id별 핸들러, `_chargeRemaining` 틱/기절 지연, 사기 격파 rout 판정.
4. 통합 테스트(tests/integration): 카운트다운 0 발동, silent 비명 차단, 방어 돌진 반격 증폭.
5. 수동 플레이: DL4 구역에서 3종 각 조우 → 의도 HUD 카운트다운·카운터 동작 육안 확인.

---

## 9. 스코프 아웃 (후속 spec)

- 추가 아키타입 4종: 인레이저(predator 부활)·분열체(처치 방법 분기)·매개체(표식)·보호체(관통 강제)
- 무기별 전용 동작(Weapon Moves) — 돌진자 "받아치기"의 완전판
- 결정적 텔레그래프(취소 가능/불가 명시) 전면화
- 부위 조준(Called Shots) — BodySystem 플레이어측 확장
- 설계된 적 팩(formation) — `rollEnemyGroup` 의도적 조합

### 추후 검토 (유사 게임 조사 — 2026-06-07, 이번 범위 제외)
- **임계 소음 → 전체 격노** (Dead Season 차용): 스크리머 소환/소음 임계 돌파 시 살아있는 전체 적이 1회 격노(추가 행동/명중↑). `NoiseSystem` 연계, `noiseEnrageThreshold` 상수.
- **인터럽트 공통 규칙** (Urban Strife 검증): 기절·넉백이 모든 `timedThreat`의 `_chargeRemaining`을 지연/리셋하는 공통 처리 함수로 명문화.
- **소프트 장갑 / 부위 조준** (Terminus·CDDA 검증): 블로터 "약점 처치만 깨끗"을 부위 조준 시스템의 디딤돌로 확장.
