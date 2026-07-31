# Task 7 구현 보고서

## 완료 내용

- 일반 몬스터 12종의 모션 계약을 `js/data/combatMotionManifest.js`와 동기화된 JSON에 반영했다.
- 9개 확장 시트를 6열·256px 정사각 셀로 승격했고, 3개 기존 4행 시트는 유지했다.
- 원거리 인간 2종, 블로터 자폭, 스크리머 분사 프레임을 생성 원화에서 크로마 제거한 뒤 런타임 시트에 조합했다.
- 휴면 기상 1회, 충전/예고 전용 행, 소환 전용 행, 자폭 몸체→overlay→제거 순서를 production FX에 연결했다.
- normal 그룹 프리뷰 CLI, dormant idle alias 감사, 행 단위 흰색 픽셀 감사 메타데이터를 추가했다.
- `*_sheet_src.png`는 수정하지 않았다.

## 검증

- `node tools/audit_combat_sprites.mjs --check`: 23/23 통과, 경고 0, 실패 0
- `node tools/audit_combat_sprites.mjs --check-allowlist`: diagnostics 0
- `python tools/render_monster_motion_preview.py --group normal --out output/combat/normal_enemy_motion_preview.png`: 12종, 누락/규격 오류/빈 행 0
- `vitest` 관련 4개 파일: 74/74 통과
- `npm.cmd test`: 135개 파일, 1,582/1,582 통과
- `node js/data/validate.js`: 오류 0, 기존 `stackConfig` 경고 215
- `npm.cmd run build:web`: 264개 모듈 변환 성공
- `python tools/verify_combat_chroma_cleanup.py --check`: 변경 시트 23, 재구성 시트의 source 보존, 비크로마 alpha 손실 0
- 프리뷰 육안 검수: `docs/analysis/NORMAL_ENEMY_MOTION_QA.md`, 재작업 0

## 비고

- `raider_elite`의 흰색 픽셀은 프리뷰에서 총구 섬광과 갑옷 하이라이트로 확인했다. 전역 임계값 변경 없이 1·3행과 기타 행을 분리한 상한으로만 예외를 허용했다.
