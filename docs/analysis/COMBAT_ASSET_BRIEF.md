# 전투 에셋 제작 브리프 — 플레이어 스프라이트 12종 · 전투 배경 5종

> 작성: 2026-07-03 · 코드 통합 지점은 전부 준비 완료, **이미지 생성만 하면 바로 연결됨**

## 1. 플레이어 스프라이트시트 12종 (직업 6 × 성별 2)

### 시트 계약 (기존 23개 시트와 동일 — `docs/analysis/COMBAT_SPRITE_AUDIT.md`)

| 항목 | 값 |
|------|-----|
| 그리드 | 6열 × 4행 (셀 256×256px, 전체 1536×1024px) |
| 앵커 | 각 셀 바닥-중앙 (발이 셀 하단에 닿게) |
| 배경 | 원본(`*_src.png`)은 크로마키 그린(#00FF00 계열), 정규화 후 투명 |
| 행 구성 | row0 대기(idle) / row1 공격(attack) / row2 버프·가드·회복(buff) / row3 피격→사망(hit/death) |
| 프레임 | 행당 6프레임 루프 (프레임 수 변경 시 `spritesheets/manifest.json`에 cols 기재) |

### 파일명과 등록 (코드 준비 완료)

| 직업 | 남성 파일 | 여성 파일 |
|------|-----------|-----------|
| doctor | `doctor_m_sheet.png` | `doctor_f_sheet.png` ✅(존재) |
| soldier | `soldier_m_sheet.png` | `soldier_f_sheet.png` |
| firefighter | `firefighter_m_sheet.png` | `firefighter_f_sheet.png` |
| homeless | `homeless_m_sheet.png` | `homeless_f_sheet.png` |
| chef | `chef_m_sheet.png` | `chef_f_sheet.png` |
| engineer | `engineer_m_sheet.png` | `engineer_f_sheet.png` |

등록 절차 (시트 1종당 2줄):
1. `js/ui/combat/combatUiAssets.js` — `COMBAT_SPRITE_SHEETS`에 `soldier_m: spriteSheet('/assets/images/combat/spritesheets/soldier_m_sheet.png'),`
2. 같은 파일 `PLAYER_SPRITE_KEYS`에 `'soldier:M': 'soldier_m',`
3. 검증: `python tools/normalize_combat_sprite_sheets.py` → `node tools/audit_combat_sprites.mjs` (pass 필수)

### 생성 프롬프트 템플릿 (기존 doctor_f 시트와 톤 일치)

공통 접두:
```
pixel-painted game sprite sheet, 6 columns x 4 rows grid, each cell 256x256,
character anchored bottom-center of each cell, solid chroma green background (#00FF00),
post-apocalyptic Seoul survivor, dark gritty realistic style, muted colors,
row 1: idle breathing loop (6 frames), row 2: attack swing/shoot loop,
row 3: defensive brace / item use loop, row 4: getting hit then collapsing death,
side view facing right, consistent character across all 24 cells
```

직업별 접미:
- **doctor(M)**: `middle-aged Korean male doctor, torn white coat over sweater, scalpel in hand`
- **soldier(M/F)**: `Korean soldier in worn ROK army fatigues, tactical vest, rifle`
- **firefighter(M/F)**: `Korean firefighter, scuffed orange-black turnout gear, fire axe`
- **homeless(M/F)**: `weathered Korean survivor, layered ragged clothes, knit cap, pipe weapon`
- **chef(M/F)**: `Korean chef, stained white uniform rolled sleeves, kitchen knife`
- **engineer(M/F)**: `Korean engineer, work jumpsuit, tool belt, heavy wrench`

여성형은 `female` 명시 + 동일 복장. 생성 후 원본을 `assets/images/combat/spritesheets/{이름}_src.png`로 저장하고 정규화 스크립트를 돌리면 `_sheet.png`가 산출된다.

## 2. 전투 배경 5종 (1920×1080)

### 씬 목록과 프롬프트

공통 접두: `dark post-apocalyptic Seoul, night ambience, muted amber highlights,
wide empty foreground floor for combat stage, central vanishing point, no people, 1920x1080`

| 파일 | 씬 | 접미 프롬프트 |
|------|-----|---------------|
| `combat_bg_subway.png` | 지하철 승강장 | `ruined subway platform, derailed train, Korean signage Jongno station, flickering lights` |
| `combat_bg_street.png` | 도심 도로 | `abandoned Seoul street canyon, wrecked cars, collapsed billboards, hangul neon remnants` |
| `combat_bg_market.png` | 상가/시장 | `looted traditional market arcade, torn awnings, scattered crates, hanging tarps` |
| `combat_bg_hospital.png` | 병원 복도 | `derelict hospital corridor, overturned gurneys, flickering fluorescent, biohazard stains` |
| `combat_bg_riverside.png` | 한강변 | `Han river embankment at night, collapsed bridge silhouette, reeds, distant dark skyline` |

저장 위치: `assets/images/combat/` (기존 `combat_empty_battlefield.png` 옆).

### 통합 지점 (코드 수정 2곳)

1. `js/data/combatAssets.js` — `COMBAT_ASSETS.scenes`에 씬 엔트리 추가:
   ```js
   street_ruin: { backdrop: 'assets/images/combat/combat_bg_street.png', stagePlate: ..., cardFrame: ... },
   ```
2. `js/systems/CombatSystem.js` `_setupCombat` — 현재 `combat.sceneId`는 미설정(단일 씬 폴백, `combatAssets.js:255`).
   지역→씬 매핑을 넣는다:
   ```js
   gs.combat.sceneId = SCENE_BY_DISTRICT_TYPE[DISTRICTS[gs.location.currentDistrict]?.type] ?? null;
   ```
   매핑 테이블은 `combatAssets.js`에 두고, 미매핑 지역은 기존 기본 씬 폴백 유지.

## 3. 검증 체크리스트

- [ ] `python tools/normalize_combat_sprite_sheets.py` 실행 후 그린 픽셀 잔존 없음
- [ ] `node tools/audit_combat_sprites.mjs` — 신규 시트 전부 pass
- [ ] `npx vitest run tests/unit/CombatSpriteSheetAssets.test.js`
- [ ] combat-test.html에서 해당 직업/성별로 전투 진입 → idle/attack/hit 행 전환 확인
- [ ] 배경: 전투 진입 시 씬별 배경 로드 + 바닥 레인 마커 가독성 확인
