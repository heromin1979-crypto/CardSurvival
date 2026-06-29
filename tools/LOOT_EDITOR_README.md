# District Loot Editor

`js/data/districts.js`의 25개 구 lootTable을 시각적으로 편집하는 도구.

## 3가지 실행 모드

| 모드 | 실행 방법 | 자동 로드 | 저장 |
|---|---|---|---|
| ⚡ **서버 (권장)** | `loot-editor.bat` 더블클릭 | ✅ 자동 | ✅ 디스크 직접 |
| 🚀 **FSA** | `python -m http.server` + Chromium | 폴더 선택 | ✅ 디스크 직접 |
| 📁 **드롭** | HTML을 `file://`로 열기 | 폴더 드래그 | ⬇ 다운로드 후 수동 교체 |

---

## 1. ⚡ 서버 모드 (가장 편함, 권장)

**Windows**:
```
tools\loot-editor.bat   ← 더블클릭
```

**macOS / Linux**:
```bash
chmod +x tools/loot-editor.sh
./tools/loot-editor.sh
```

자동으로 다음 동작:
- 프로젝트 루트(`js/data/districts.js`가 있는 폴더) 자동 탐지
- `http://127.0.0.1:7321/` 에서 로컬 서버 시작
- 기본 브라우저로 에디터 페이지 자동 오픈
- 사이드바에 `⚡ 서버 (자동 저장)` 칩 표시
- 편집 후 **"💾 저장"** (또는 Ctrl+S) → 즉시 디스크에 기록

종료: 콘솔 창에서 **Ctrl+C**.

### 환경 변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `LOOT_EDITOR_PORT` | `7321` | 서버 포트 |
| `LOOT_EDITOR_NO_OPEN` | (unset) | 브라우저 자동 오픈 비활성화 |

```cmd
set LOOT_EDITOR_PORT=8080 && tools\loot-editor.bat
```

### 필요 환경

- **Node.js ≥ 18** (LTS 권장). https://nodejs.org/
- 외부 패키지 의존 **없음** — `node:http`, `node:fs` 내장 모듈만 사용

---

## 2. 🚀 FSA 모드 (Chromium + localhost)

서버 모드를 못 쓰는 경우(Node 미설치 등) 대안:

```cmd
python -m http.server 8080
```

브라우저: `http://localhost:8080/tools/loot-editor.html` → "📂 js/data/ 폴더 열기 (FSA)" → 폴더 선택 + 편집 권한 허용.

---

## 3. 📁 드롭 모드 (서버 없음, 모든 브라우저)

`tools/loot-editor.html`을 더블클릭하여 `file://`로 열기 → `js/data` 폴더를 **드래그**하거나 "📁 폴더 선택" 클릭.

저장 시 `districts.js`가 **다운로드 폴더에 저장**되므로 수동으로 `js/data/`에 교체해야 합니다.

---

## 단일 `.exe`로 패키징 (선택)

서버 모드를 Node 미설치 환경에 배포하려면:

### A) Node 22+ SEA (Single Executable Application)

공식 방식. 빌드 단계:

```cmd
:: 1. SEA config
echo { "main": "tools/loot-editor-server.mjs", "output": "tools/loot-editor.blob" } > tools/sea-config.json

:: 2. Generate blob
node --experimental-sea-config tools/sea-config.json

:: 3. Copy node binary and inject
copy "%ProgramFiles%\nodejs\node.exe" tools\loot-editor.exe
npx postject tools\loot-editor.exe NODE_SEA_BLOB tools\loot-editor.blob ^
    --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
```

결과: `tools/loot-editor.exe` (약 80MB, Node 포함).

⚠️ HTML/JS는 외부 파일로 남아야 하므로 `tools/` 폴더 전체를 함께 배포.

### B) `pkg` (deprecated이지만 동작, 더 작음)

```cmd
npm i -g pkg
pkg tools/loot-editor-server.mjs --targets node18-win-x64 -o tools/loot-editor.exe
```

같은 제약: HTML/JS 정적 파일은 `tools/`에 함께 있어야 함.

### C) `nexe`

```cmd
npm i -g nexe
nexe tools/loot-editor-server.mjs -t windows-x64-18.16.0 -o tools/loot-editor.exe
```

---

## 파일 구성

```
tools/
├── loot-editor.html         UI 셸
├── loot-editor.js           파서 + 에디터 + 저장 라우터 (server/FSA/drop)
├── loot-editor-server.mjs   Node 로컬 서버 (zero-dependency)
├── loot-editor.bat          Windows 런처
├── loot-editor.sh           macOS/Linux 런처
└── LOOT_EDITOR_README.md    이 문서
```

`tmp/`:
```
test_loot_editor.mjs     파서/직렬화 라운드트립 회귀 테스트
server_roundtrip.mjs     서버 GET/POST/정적 서빙 검증
```

---

## 안전장치

- **Surgical replace**: 편집한 구의 `lootTable: [ ... ]` 배열 내부만 교체. 주석/메타 필드/다른 구는 그대로.
- **저장 직전 재파싱 검증**: 구 개수·항목 개수 일치 확인 → 실패 시 저장 차단.
- **Atomic write**: `.tmp` 파일에 쓰고 `rename`으로 원자적 교체 (부분 쓰기 방지).
- **검증 결과**:
  - 25개 구 484개 entry 라운드트립 바이트 동일
  - 단일 구 편집 시 나머지 24개 구는 바이트 동일
  - identity save → 디스크 파일 바이트 동일
  - 8개 `items_*.js` 자동 로드 (525개 아이템 한글명 매핑)

---

## 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| `.bat` 더블클릭 시 "Node.js not found" | https://nodejs.org/ 에서 LTS 설치 후 재시도 |
| 브라우저가 자동으로 열리지 않음 | 콘솔의 URL을 수동으로 복사하여 열기 |
| 저장 후 게임에서 반영 안 됨 | Vite dev 서버 재시작 또는 hot reload 트리거 |
| 포트 충돌 | `set LOOT_EDITOR_PORT=9000` 후 재실행 |
| 다른 폴더에서 실행 시 "districts.js를 찾을 수 없습니다" | 카드 서바이벌 프로젝트 루트나 그 하위에서 실행 |
