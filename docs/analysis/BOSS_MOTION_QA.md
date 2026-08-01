# 보스 전투 모션 QA

검수 일자: 2026-08-01
대상: `SECRET_ENEMIES`의 `isBoss: true` 21종
런타임 계약: 1536×2048 RGBA, 256px 셀, 6열×8행 (`idle/basic_a/basic_b/special/ultimate/hit/charge/death`)

## 판정 기준

- `basic_a`, `basic_b`, `special`, `ultimate`, `hit`, `charge`, `death`의 동작 실루엣과 6프레임 진행을 원본 크기 리뷰 보드로 확인한다.
- 모든 프레임에 주 본체가 있어야 하며 머리, 몸통, 다리, 무기 같은 본체 조각만 따로 남아서는 안 된다.
- 투사체와 효과는 사람이 프레임별로 승인한 정확한 component mask만 보존한다. 행 전체를 일괄 허용하지 않는다.
- `charge`에는 공격 판정처럼 보이는 충돌, 폭발, 타격 효과가 없어야 한다.
- `death`는 전신 와상 또는 설정에 맞는 안정된 소멸 상태로 끝나야 한다.
- 프레임 경계 접촉, 인접 셀 오염, 빈 프레임, 중복 프레임, strict green과 hidden RGB를 허용하지 않는다.

## Round 1 — 독립 리뷰 수정

커밋 `3832748`의 독립 리뷰에서 지적된 조각, 절단, 정체성, 동작 중복을 다음과 같이 교정했다.

- `boss_patient_zero`: ultimate의 부유 살점 조각 제거
- `boss_phantom_sniper`: ultimate의 몸통·소총 절단을 전신 6프레임으로 교체; 2차 검수에서 발견한 death 머리 조각도 전신 와상 진행으로 교체
- `boss_cult_leader`: idle/basic_b/ultimate의 이웃 조각 제거; charge의 두부 상단 절단 교체
- `boss_mutant_alpha_tiger`: ultimate/death의 머리·발·꼬리 조각을 사족보행 전신 진행으로 교체
- `boss_penthouse_survivor`: 공격/special/ultimate의 신발·총기 조각 제거
- `boss_escaped_experiment`: basic_b 마지막 투사체 단독 프레임을 본체+투사체로 교체
- `boss_blizzard_wraith`: ultimate의 반복 sliver 제거. death의 점진적 얼음 소멸은 설정상 허용
- `boss_soldier_nemesis`: basic_b 신발 조각 제거; special/ultimate를 양발과 소총이 온전한 6프레임으로 교체
- `boss_chef_nemesis`: idle/special/ultimate 조각 제거; death를 안정된 전신 와상 진행으로 교체
- `boss_firefighter_nemesis`: death 절단 제거; special은 방어 turnout, ultimate는 폭발 backdraft로 분리; hit/charge의 하체 절단도 전신 보조 행으로 교체
- `boss_feral_dog_alpha`: hit를 포함한 모든 행을 동일한 사족보행 야생견 정체성으로 통일
- 2차 전수 검수 추가 교정: `boss_acid_queen` death, `boss_sewer_king` hit, `boss_swarm_queen_bee` hit/ultimate의 본체 절단 제거

넓은 와상 프레임이 다른 행의 배율을 축소하지 않도록, canonical 행은 기존 공통 배율을 유지하고 supplement 행만 행 단위로 셀에 맞추도록 정규화했다. 사망 자세의 회전은 픽셀 면적과 가로·세로 bbox 면적을 함께 검사하여 허용하되, 작은 머리 조각과 edge sliver는 계속 실패한다.

## 소스·계약 검증

- 21종 manifest `src`와 recipe target은 각 보스 ID의 canonical 경로와 정확히 일치해야 한다. 다른 보스 경로를 공유하면 실패한다.
- `detached_component_selection.json` v2는 `selectedFrames`만 사용하며 `bossId/motionKey/col/componentIndexes/rationale`를 요구한다.
- immutable component 계약은 `tools/materialize_boss_component_contract.py --write`로만 갱신한다. 일반 build/check는 계약을 스스로 승인하거나 다시 쓰지 않는다.
- 15개 보조 행은 `generation_provenance.json`에 chroma/alpha 경로, SHA-256, prompt 요약을 기록하고 recipe의 `rowSourceOverrides`와 정확히 대조한다. 조립에서 제외된 rejected/superseded 원본 3개도 별도 archive 해시로 고정한다.
- `BossMotionAssetContract.test.js`는 잘못된 보스 소스 alias, 작은 본체 조각, bbox 불연속, 프레임 경계 접촉 mutation이 실패하는지 확인한다.

## 원본 크기 2차 수동 QA

21종 리뷰 보드 147행을 최신 산출물 기준으로 다시 열어 확인했다. 최초 지적과 2차 검수 추가 교정을 모두 적용한 뒤 open rework는 0건이다.

설정상 허용한 축소는 다음 세 가지뿐이다.

- `boss_blizzard_wraith` death: 망령의 점진적 얼음 소멸
- `boss_radiation_colossus` death: 방사성 잔해로 붕괴
- `boss_sewer_king` special: 지면 아래 잠복

그 외 행에서는 본체 전신, 무기·꼬리·복부 같은 핵심 부위, 바닥 앵커와 크기 연속성을 확인했다. 세부 보스별 판정과 최신 preview 해시는 `manual_review_evidence.json` v2에 기록했다.

## 고정 증거 SHA-256

- `assembly_recipe.json`: `a085b1343437ae8822f42d0c19624f47d97824136c3227b92221acb035251c8d`
- `detached_component_contract.json`: `68495c2a7d364dbf0cd2698c12e55cd3f8d8c844afbf858a729fb1b6d1f24f0b`
- `generation_provenance.json`: `99094f9dfc4d97b779baf80f39f09d51ed0f899f800d0f662e02d83b6e34e44a`
- `manual_review_evidence.json`: `77398803fc38308cb143aaaa41438bd3c7560b52b669ae70fba78031511f3b06`
- `boss_motion_contact_sheet.png`: `9a3bfb8d04ea93cc7fb897466f8ebe61b04d0f3a374025856cd013e275eee38c`

## 실행 검증

최종 커밋 전 다음을 실행했다.

```powershell
python tools/materialize_boss_component_contract.py --check
python tools/build_boss_motion_sheets.py --check
node tools/verify_boss_motion_qa.mjs
npx vitest run tests/unit/BossMotionAssetContract.test.js tests/unit/CombatMotionManifest.test.js tests/unit/CombatSpriteSheetAssets.test.js
npm run build
```

최종 결과:

- 전체 Vitest: 138개 파일, 1,653개 테스트 PASS
- 보스 focused Vitest: 3개 파일, 41개 테스트 PASS
- 보스 QA verifier: 21종, 147 semantic rows, 1,008 cells, open rework 0, strict chroma issue 0
- deterministic builder: 21개 target 재생성 결과 일치
- component materializer check: frame-level immutable 계약 일치
- 전체 sprite audit: total/referenced 60/60, PASS 57, WARN 3, FAIL 0
- 데이터 validator: items 590, blueprints 351, boss patterns 21, errors 0, 기존 stackConfig warning 215
- Task 6 provenance verifier: 23 sheets, changed 20, historical unexpected alpha loss 0, current pinned 23
- Web build: PASS. runtime boss sheets 21/21, `art_sources` 유출 0
- Electron portable build: PASS. ASAR 5,170 entries, runtime boss sheets 21/21, `art_sources` 유출 0
