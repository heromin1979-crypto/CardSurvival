# 데이터 에디터 (Data Editor) — 로컬

장소(`districts.js`), 랜드마크 드랍(`landmarks.js`), 메인 퀘스트(`mainQuests.js`)를
**로컬에서 읽어 웹 UI로 수정한 뒤, 로컬 git으로 커밋·푸시**하는 도구입니다.

## 동작 방식

- 데이터는 **로컬 파일**에서 읽습니다 (GitHub API/PAT 불필요).
- 저장 시 변경된 **데이터 객체 블록만** 재직렬화 → 로컬 디스크에 기록 →
  `serve.js`가 현재 git 브랜치로 `git commit` + `git push` 합니다.
- 파일 헤더·헬퍼 함수·export·바깥 주석은 그대로 보존됩니다.

## 실행

저장소 루트에서:

```bash
node serve.js
```

브라우저(자동으로 열리며, 안 열리면 직접):

```
http://localhost:8080/tools/editor/
```

> `serve.js`는 로컬 전용(`127.0.0.1`)이며, 데이터 읽기/저장/푸시 API(`/api/*`)를 제공합니다.
> 쓰기는 `districts.js` / `landmarks.js` / `mainQuests.js` 3개 파일로만 제한됩니다.

## 사용법

1. 접속하면 **자동으로 로컬 데이터를 불러옵니다** (상단에 현재 브랜치 표시).
2. **장소 / 랜드마크 / 퀘스트** 탭에서 수정합니다.
   - 드랍 테이블: weight 옆에 실시간 **드랍 %** 표시.
   - 존재하지 않는 아이템 ID는 빨간 테두리로 경고.
   - 퀘스트: `prerequisite`(선행)로 **연계 체인** 편집 + 후속 퀘스트 표시.
3. **⚙️ 설정** 탭에서 커밋 메시지를 바꿀 수 있습니다.
4. 우상단 **[저장 (커밋&푸시)]** → 로컬 기록 + 현재 브랜치로 커밋·푸시.

## 주의

- **데이터 블록 내부의 인라인 주석은 보존되지 않습니다.** push 후 `git diff`로 확인하세요.
- 아이템 ID 자동완성/검증은 로컬 `items.js` 기준입니다.
- 데이터 무결성 최종 검증: `node js/data/validate.js`.

## 테스트

```bash
node tools/editor/serialize.test.mjs   # 직렬화 라운드트립 + 편집 영속성 (의존성 없음)
node tools/editor/dom-smoke.test.mjs   # UI 부팅 스모크 (happy-dom 필요)
```
