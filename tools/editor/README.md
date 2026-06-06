# 데이터 에디터 (Data Editor)

장소(`districts.js`), 랜드마크 드랍(`landmarks.js`), 메인 퀘스트(`mainQuests.js`)를
**웹에서 보고 수정한 뒤 저장소에 바로 커밋(푸시)** 하는 정적 도구입니다.

## 동작 방식

- **정적 페이지**입니다. 서버가 없습니다 — GitHub Pages에 함께 배포되어 휴대폰/외부에서 접속 가능합니다.
- 읽기/쓰기는 **사용자가 입력한 GitHub PAT**로 GitHub Contents API를 직접 호출합니다.
  PAT는 이 기기의 `localStorage`에만 저장되며 페이지 자체에는 어떤 비밀도 없습니다.
- 저장 시 **변경된 데이터 객체 블록만** 재직렬화되어 지정 브랜치에 커밋됩니다.
  파일 헤더·헬퍼 함수·export·바깥 주석은 그대로 보존됩니다.

## 접속

- **로컬**: 저장소 루트에서 `node serve.js` → `http://localhost:8080/tools/editor/`
  (또는 `npm run dev:web` 후 `/tools/editor/`)
- **외부(배포 후)**: GitHub Pages URL 뒤에 `/tools/editor/`
  (에디터를 공개하려면 이 도구를 `master`에 병합 → `deploy.yml`이 gh-pages로 배포)

## 사용법

1. **⚙️ 설정** 탭에서 `owner` / `repo` / `branch`를 확인하고 **PAT**를 입력합니다.
   - PAT: GitHub → Settings → Developer settings → **Fine-grained tokens**
   - 이 저장소에 **Contents: Read and write** 권한 부여
2. **저장 & 불러오기** → 대상 브랜치에서 데이터를 읽어옵니다.
3. **장소 / 랜드마크 / 퀘스트** 탭에서 수정합니다.
   - 드랍 테이블: weight 옆에 실시간 **드랍 %**가 표시됩니다.
   - 존재하지 않는 아이템 ID는 빨간 테두리로 표시됩니다.
   - 퀘스트: `prerequisite`(선행)로 **연계 체인**을 편집하고, 후속 퀘스트 목록을 확인합니다.
4. **저장 (커밋)** → 변경된 파일이 지정 브랜치에 커밋됩니다.

## 주의

- **데이터 블록 내부의 인라인 주석은 보존되지 않습니다.** 커밋 후 `git diff`로 확인하세요.
- 아이템 ID 자동완성/검증은 **현재 배포된 사이트의 `items.js`** 기준입니다.
- 데이터 무결성 최종 검증: 저장소에서 `node js/data/validate.js`.

## 테스트

직렬화기 라운드트립 + 편집 영속성 검증:

```bash
node tools/editor/serialize.test.mjs   # 또는 npm run test:editor
```
