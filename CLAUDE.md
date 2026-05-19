@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**React 컴포넌트 생성기**: 프롬프트를 입력하면 AI가 React 컴포넌트를 생성하고, 실시간 미리보기와 코드를 제공하는 애플리케이션입니다.

## 기술 스택

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Bun (런타임) + TypeScript
- **Runtime Preview**: react-live (사용자가 생성한 컴포넌트를 즉시 렌더링)
- **AI API**: Anthropic Claude 또는 Google Gemini (선택 가능)

## 아키텍처

### 전체 흐름

```
User Input → Frontend (App.tsx) → Vite Proxy (/api/*) → Backend (server/index.ts)
                ↓
           Backend calls Claude/Gemini API
                ↓
           Returns React component code (plain JS)
                ↓
           Frontend renders via react-live (LivePreview.tsx)
                ↓
           Display preview + code (ComponentCard.tsx)
```

### 프론트엔드 구조

- **src/App.tsx**: 메인 레이아웃, 프로바이더 선택, API 키 관리
- **src/components/PromptInput.tsx**: 사용자 프롬프트 입력 폼, 예시 프롬프트
- **src/components/ComponentCard.tsx**: 생성된 컴포넌트를 카드 형식으로 표시 (미리보기, 코드, 버튼)
- **src/components/LivePreview.tsx**: react-live의 LiveProvider/LivePreview 래퍼
- **src/components/CodeView.tsx**: 생성된 코드를 syntax highlighting과 함께 표시
- **src/hooks/useComponentGenerator.ts**: 컴포넌트 생성 상태 관리 (components 배열, isLoading, error)

### 백엔드 구조 (server/index.ts)

- **`/api/config`** (GET): .env에 설정된 API 키 여부 반환 (`{ envKeys: { anthropic: boolean, google: boolean } }`)
- **`/api/generate`** (POST): 프롬프트 → Claude/Gemini API 호출 → React 컴포넌트 코드 반환
  - Request: `{ prompt: string, apiKey?: string, provider?: 'anthropic' | 'google' }`
  - Response: `{ code: string }` (또는 `{ error: string }`)

**중요한 구현 디테일**:
- `SYSTEM_PROMPT`: 생성되는 React 컴포넌트의 형식을 결정 (인라인 스타일만, TypeScript 금지, render() 호출 필수)
- `stripCodeFences()`: 마크다운 코드 펜스 제거
- `ensureRenderCall()`: 컴포넌트 코드 끝에 render(<Component />) 추가
- 클라이언트 API 키가 우선 사용되고, 없으면 .env 키 사용

## 주요 개발 명령어

```bash
# 의존성 설치
bun install

# 개발 서버 실행 (API 서버 + Vite 동시 실행)
bun run dev
# → Frontend: http://localhost:5173
# → Backend: http://localhost:3002

# Vite만 실행
bun run dev  # 내부적으로 concurrently로 server와 vite 동시 실행

# API 서버만 실행 (개발 중 수정 감지)
bun run server

# 빌드
bun run build

# 린트
bun run lint

# 프리뷰 (빌드 후 결과물 확인)
bun run preview
```

## 환경 설정

`.env` 또는 `.env.local` 파일에서 설정:

```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
```

둘 다 설정할 필요는 없음. 어떤 것이든 설정되면 UI에서 프로바이더로 선택 가능.

## 생성되는 React 컴포넌트의 제약사항

서버의 `SYSTEM_PROMPT`에 명시된 규칙:

1. **인라인 스타일만** - CSS 파일이나 CSS 모듈 임포트 불가
2. **import 문 없음** - React는 글로벌 스코프에서 사용 가능
3. **plain JavaScript** - TypeScript 문법 금지 (타입 어노테이션, 인터페이스 등)
4. **자체 포함** - 외부 의존성 없이 동작해야 함
5. **render() 호출 필수** - 컴포넌트 정의 후 `render(<ComponentName />)` 필수

예시:
```javascript
const Button = () => {
  const [count, setCount] = React.useState(0);
  return (
    <button 
      onClick={() => setCount(count + 1)}
      style={{ padding: '10px' }}
    >
      Click: {count}
    </button>
  );
};
render(<Button />);
```

## Vite 프록시 설정

Vite는 `/api/*` 경로의 요청을 자동으로 `http://localhost:3002`로 프록시합니다 (vite.config.ts 참고).

따라서 프론트엔드 코드에서:
```javascript
fetch('/api/generate', { method: 'POST', body: ... })
// → 실제로는 http://localhost:3002/api/generate로 요청됨
```

## 주의사항

- **SYSTEM_PROMPT 수정**: `server/index.ts`의 `SYSTEM_PROMPT`를 수정하면 생성되는 컴포넌트의 스타일과 동작이 바뀝니다. 신중하게 수정할 것.
- **API 키 보안**: `.env`에 API 키를 저장하면 git에서 제외되어야 합니다 (.gitignore 확인).
- **react-live 제약**: react-live는 스코프 격리를 위해 Web Worker를 사용하므로, 일부 API에 제약이 있을 수 있습니다.
- **Bun 런타임**: Node.js가 아닌 Bun을 사용하므로, Node.js 전용 패키지는 호환성 문제가 있을 수 있습니다.

## 파일 구조

```
.
├── src/
│   ├── App.tsx                 # 메인 레이아웃
│   ├── App.css                 # 스타일 (어두운 테마)
│   ├── index.css               # 글로벌 스타일
│   ├── main.tsx                # 엔트리 포인트
│   ├── components/
│   │   ├── PromptInput.tsx      # 사용자 입력 폼
│   │   ├── ComponentCard.tsx    # 생성된 컴포넌트 카드
│   │   ├── LivePreview.tsx      # react-live 래퍼
│   │   └── CodeView.tsx         # 코드 표시
│   ├── hooks/
│   │   └── useComponentGenerator.ts  # 상태 관리
│   └── types/
│       └── index.ts            # Provider 등 타입 정의
├── server/
│   └── index.ts                # Bun API 서버
├── vite.config.ts              # Vite 설정 + /api 프록시
├── tsconfig.json               # TypeScript 설정
├── package.json                # 의존성 및 스크립트
└── .env.example                # 환경변수 예시
```

## 자주 수정하는 파일

1. **SYSTEM_PROMPT** (`server/index.ts:1-43`): 생성되는 컴포넌트 형식 변경
2. **App.css**: UI 테마, 레이아웃, 색상
3. **useComponentGenerator.ts**: 생성 로직, 상태 관리
4. **PromptInput.tsx**: 예시 프롬프트, 입력 폼
