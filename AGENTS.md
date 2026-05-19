# AGENTS.md — React 컴포넌트 생성기

## 운영 명령어

```bash
bun install          # 의존성 설치 (반드시 bun 사용)
bun run dev          # API 서버(3002) + Vite(5173) 동시 실행
bun run server       # API 서버만 실행 (--watch 포함)
bun run build        # TypeScript 컴파일 후 Vite 번들
bun run lint         # ESLint 검사
bun run preview      # 빌드 결과물 미리보기
```

**도구 제약**: 반드시 `bun`을 사용한다. `npm`, `yarn`, `pnpm` 사용 금지.

## 프로젝트 컨텍스트

프롬프트 입력 → AI(Claude/Gemini) 호출 → React 컴포넌트 코드 반환 → react-live로 즉시 렌더링하는 애플리케이션.
Tech Stack: React 19, TypeScript, Vite (FE) / Bun + TypeScript (BE) / react-live (런타임 미리보기)

## Golden Rules

### 절대 금지

- API 키 하드코딩 금지 — `.env` 또는 `.env.local`에만 저장
- `npm`/`yarn`/`pnpm` 명령어 사용 금지 — `bun`만 허용
- `server/index.ts`의 `SYSTEM_PROMPT` 무단 수정 금지 — 변경 시 생성 컴포넌트 전체 형식이 바뀜
- Node.js 전용 패키지 도입 금지 — Bun 런타임과 호환성 문제 발생 가능

### 필수 준수

- `.env` 파일은 반드시 `.gitignore`에 포함되어 있어야 한다
- 프론트엔드에서 API 호출 시 `/api/*` 프록시 경로를 사용한다 (직접 `localhost:3002` 참조 금지)
- 클라이언트에서 받은 API 키가 `.env` 키보다 항상 우선한다 (`resolveApiKey` 로직 유지)
- react-live 렌더링용 생성 코드는 plain JavaScript여야 한다 (TypeScript 문법 금지)

## Generator-Evaluator 패턴

TDD 적용 대상 파일을 수정한 후에는 **반드시** evaluator 서브에이전트를 스폰한다.

**트리거 조건** — 다음 파일을 추가하거나 수정한 경우:
- `src/hooks/**/*.ts`
- `server/index.ts` (함수 추가·변경 시)
- 신규 유틸리티 함수 (`stripCodeFences`, `ensureRenderCall`, `resolveApiKey` 등)

**실행 방법**: Agent 도구로 `.claude/skills/evaluator/SKILL.md` 내용을 프롬프트로 전달한다. 변경된 파일 경로를 명시한다. 모델: `sonnet`.

**차단 조건**: evaluator가 FAIL을 반환하면 evaluator가 수정을 완료할 때까지 다음 작업으로 넘어가지 않는다.

## 커밋 및 브랜치 전략

- Conventional Commits 형식: `feat(scope):`, `fix(scope):`, `chore(scope):`
- 한국어 커밋 메시지 사용
- 스코프 예시: `server`, `ui`, `hooks`, `styles`, `config`

## Context Map

- **[API 서버 수정 (BE)](./server/AGENTS.md)** — Bun 서버, AI API 연동, SYSTEM_PROMPT, 엔드포인트 수정 시.
- **[프론트엔드 수정 (FE)](./src/AGENTS.md)** — React 컴포넌트, 훅, react-live, 스타일 수정 시.

## 유지보수 정책

이 파일의 규칙이 실제 코드와 괴리가 발생하면, 에이전트는 즉시 업데이트를 제안해야 한다.
