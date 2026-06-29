# Third Party Asset Candidates

이 문서는 전투 화면 리뉴얼에 사용할 수 있는 외부 무료 자산 후보와 라이선스 판단을 기록한다. 무료 표기만으로는 사용하지 않고, 상업 사용, 수정, 게임 내 배포, attribution 조건을 확인한 후보만 적용 대상으로 둔다.

## 적용 가능 후보

| 우선순위 | 자산 | 용도 | 라이선스/조건 | 판단 |
| --- | --- | --- | --- | --- |
| 1 | City Parallax - Post Soviet World "Yopta" | 어두운 도시 폐허 배경, parallax layer | CC0. 상업 사용, 수정, 재배포 가능. attribution 불필요 | 적용 가능 |
| 2 | Kenney UI Pack RPG Expansion | RPG 패널, 버튼, 슬롯, 프레임 | CC0. 상업 사용, 수정 가능. attribution 불필요 | 적용 가능 |
| 3 | CraftPix Free Urban Zombie Sprite Sheet Pixel Art Pack | 도시형 좀비 idle/walk/attack/hurt/dead 스프라이트 | CraftPix Freebie. 상업 프로젝트/수정/게임 내 배포 가능. 원본/수정 소스파일 단독 재배포 금지 | 적용 가능 |
| 4 | CraftPix Free Raider Sprite Sheets Pixel Art | 생존자/약탈자형 캐릭터 스프라이트 | CraftPix Freebie. 상업 프로젝트/수정/게임 내 배포 가능. 원본/수정 소스파일 단독 재배포 금지 | 적용 가능 |
| 5 | CraftPix Free Homeless Character Sprite Sheets Pixel Art | 도시 생존자/NPC 후보 | CraftPix Freebie. 표현상 낙인화되지 않도록 캐릭터 설정 재가공 필요 | 적용 가능, 표현 주의 |
| 6 | Majadroid 3D Apocalyptic Building / City CC0 | 폐허 빌딩 렌더/실루엣 제작용 | CC0 성격. 상업 사용 가능. attribution 불필요 | 적용 가능 |
| 7 | OpenGameArt UI Graphics | 픽셀 GUI 보조 재료 | CC0 선택 가능. 적용 시 CC0 파일만 사용 | 적용 가능 |

## 주의 후보

| 자산 | 이유 | 판단 |
| --- | --- | --- |
| Free Post Apocalyptic Pixel Art Backgrounds | itch 페이지의 라이선스 표기가 약하고 CraftPix 원 출처 확인이 필요 | CraftPix 원 라이선스와 함께 보관할 때만 사용 |
| Free Pixel Art 8x8 Wasteland Asset Pack | 개인/상업 사용 가능은 보이나 수정/재배포 조건이 약함 | 원본 번들 포함 금지, 프로토타입 참고만 권장 |
| Zombie characters 32x32 | 댓글 기반 상업 사용 언급은 있으나 정식 라이선스 본문 부족 | 적용 보류 |

## 적용 금지 후보

| 자산 | 이유 |
| --- | --- |
| Darkest Dungeon 2 영상/스크린샷/게임 자산 | 상용 게임 저작물. 참조 분석만 가능, 게임 자산으로 사용 금지 |
| Post-Apocalypse Pixel Art Asset Pack by TheLazyStone | 무료판은 비상업 조건. 상업 사용은 결제 필요 |
| Sprout Lands UI Pack 무료판 | 비상업 전용 |
| Apocalypse Tiles 16x16 | "CC 4.0" 표기가 불명확해 CC BY/SA/NC 여부 확인 불가 |

## 권장 보관 구조

```text
assets/
  external/
    city-parallax-yopta/
      LICENSE.txt
      SOURCE.url
      original/
      processed/
    kenney-ui-pack-rpg-expansion/
      LICENSE.txt
      SOURCE.url
      original/
      processed/
    craftpix-free-urban-zombie/
      LICENSE.txt
      SOURCE.url
      original/
      processed/
    craftpix-free-raider/
      LICENSE.txt
      SOURCE.url
      original/
      processed/
  combat/
    backgrounds/
    sprites/
      survivors/
      companions/
      enemies/
    ui/
      frames/
      buttons/
      gauges/
```

## Attribution 기록

현재 1순위 적용 후보 조합은 필수 attribution이 없다. 그래도 추적성을 위해 크레딧 파일이나 릴리스 노트에는 아래 출처를 남긴다.

```text
City Parallax | Post Soviet World "Yopta" by Frontend Pashtet - CC0
https://drxwat.itch.io/city-parallax

UI Pack (RPG Expansion) by Kenney - CC0
https://kenney.nl/assets/ui-pack-rpg-expansion

Free Urban Zombie Sprite Sheet Pixel Art Pack by CraftPix.net
https://craftpix.net/freebies/free-urban-zombie-sprite-sheet-pixel-art-pack/

Free Raider Sprite Sheets Pixel Art by CraftPix.net
https://craftpix.net/freebies/free-raider-sprite-sheets-pixel-art/
```

