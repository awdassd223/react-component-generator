# AGENTS.md — server/

Bun HTTP 서버 모듈. Anthropic/Google AI API를 호출하여 React 컴포넌트 코드를 생성하여 반환한다.
루트 규칙(`../AGENTS.md`)이 우선 적용된다.

## 기술 제약

- Bun 런타임 전용 — `Bun.serve()` API 사용, `express`/`fastify` 등 외부 HTTP 프레임워크 도입 금지
- AI API 호출에 `fetch` 사용 — axios 등 HTTP 클라이언트 라이브러리 도입 금지
- 테스트는 `bun test` 명령어 사용 (Jest 미사용)

## 엔드포인트 규칙

| 경로 | 메서드 | 역할 |
|------|--------|------|
| `/api/config` | GET | `.env` 키 존재 여부 반환 |
| `/api/generate` | POST | 프롬프트 → AI → 컴포넌트 코드 반환 |

- 모든 응답에 `CORS_HEADERS` 포함 필수
- `OPTIONS` preflight 요청은 반드시 `null` body로 응답

## SYSTEM_PROMPT 수정 규칙

`SYSTEM_PROMPT`는 생성되는 모든 컴포넌트의 형식을 결정한다. 수정 시 반드시 유지해야 할 제약:

- `render(<ComponentName />)` 호출 필수 (react-live 실행 조건)
- import 문 금지 (react-live 글로벌 스코프에서 React 제공)
- TypeScript 문법 금지 (plain JavaScript만)
- 인라인 스타일만 허용

## 구현 패턴

**API 키 우선순위**: 클라이언트 전달 키 → `.env` 키 순서. `resolveApiKey()` 함수가 담당.

**코드 후처리 파이프라인**:
```
AI 응답 텍스트
  → stripCodeFences()   // 마크다운 코드 펜스 제거
  → ensureRenderCall()  // render() 호출 없으면 자동 추가
  → 클라이언트에 반환
```

**AI 모델 지정**:
- Anthropic: `claude-haiku-4-5-20251001` (변경 시 `callAnthropic()` 내부)
- Google: `gemini-2.5-flash` (변경 시 `callGoogle()` 내부)

## Do's & Don'ts

- DO: 새 AI 프로바이더 추가 시 `callXxx()` 함수 패턴 따르고 `Provider` 타입 확장
- DO: 에러 응답 시 적절한 HTTP 상태 코드(400/429/503/500) 사용
- DON'T: `CORS_HEADERS`를 특정 엔드포인트에만 적용하는 것 — 모든 응답에 포함
- DON'T: `ensureRenderCall()` 제거 — AI가 render() 빠뜨릴 경우 react-live 렌더링 실패
