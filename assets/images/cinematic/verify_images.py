"""이미지 파일 존재 여부 및 유효성 검증"""
import os

EXPECTED = [
    # 사망
    'death_dehydration.webp',
    'death_starvation.webp',
    'death_hypothermia.webp',
    'death_radiation.webp',
    'death_disease.webp',
    'death_combat.webp',
    'death_infection.webp',
    'death_fall.webp',
    'death_exhaustion.webp',
    'death_other.webp',
    # 계절
    'season_spring.webp',
    'season_summer.webp',
    'season_autumn.webp',
    'season_winter.webp',
    'season_shock.webp',
    # 캐릭터
    'char_doctor_final.webp',
    'char_soldier_final.webp',
    'char_firefighter_final.webp',
    'char_homeless_final.webp',
    'char_pharmacist_final.webp',
    'char_engineer_final.webp',
    # 엔딩
    'ending_escape.webp',
    'ending_survival.webp',
    'ending_broadcast.webp',
    'ending_cure.webp',
]

here = os.path.dirname(os.path.abspath(__file__))
ok, missing, small = [], [], []

for fname in EXPECTED:
    path = os.path.join(here, fname)
    if not os.path.exists(path):
        missing.append(fname)
    elif os.path.getsize(path) < 10_000:  # 10KB 미만은 오류 응답
        small.append((fname, os.path.getsize(path)))
    else:
        ok.append((fname, os.path.getsize(path) // 1024))

print(f'\n✅ 정상: {len(ok)}/{len(EXPECTED)}개')
for name, kb in ok:
    print(f'   {name} ({kb}KB)')

if missing:
    print(f'\n❌ 없음: {len(missing)}개')
    for name in missing:
        print(f'   {name}')

if small:
    print(f'\n⚠️  크기 이상 (재저장 필요): {len(small)}개')
    for name, size in small:
        print(f'   {name} ({size}B) — 오류 응답일 가능성')
