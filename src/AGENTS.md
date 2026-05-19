# AGENTS.md — src/

React 19 + TypeScript + Vite 프론트엔드 모듈. react-live를 통해 생성된 컴포넌트를 즉시 렌더링한다.
루트 규칙(`../AGENTS.md`)이 우선 적용된다.

## react-live 제약

`LivePreview.tsx`에서 `LiveProvider`/`LivePreview`로 AI 생성 코드를 실행한다.

- react-live의 `scope`에 전달되지 않은 심볼은 렌더링 중 참조 불가 — 외부 라이브러리 주입 불가
- Web Worker 기반 격리 — `window`, `document` 직접 접근 제한
- 생성된 코드가 TypeScript 문법을 포함하면 파싱 오류 발생 (서버 측 SYSTEM_PROMPT가 방지)

## 컴포넌트 패턴

**새 컴포넌트 추가 시 위치**: `src/components/`

**명명 규칙**:
- 컴포넌트 파일: PascalCase (`ComponentCard.tsx`)
- 훅 파일: camelCase with `use` prefix (`useComponentGenerator.ts`)
- 타입 정의: `src/types/index.ts`에 중앙 관리

**상태 관리 패턴**: 전역 상태 라이브러리 없음. `useComponentGenerator` 훅에서 `components` 배열, `isLoading`, `error`를 관리하고 `App.tsx`에서 prop drilling으로 전달.

## API 호출 규칙

- 항상 `/api/generate`, `/api/config` 경로 사용 — `http://localhost:3002/...` 직접 참조 금지
- Vite 프록시(`vite.config.ts`)가 `/api/*`를 `localhost:3002`로 자동 전달

## 스타일 규칙

- 전역 스타일: `src/index.css`
- 컴포넌트 스타일: `src/App.css` (어두운 테마 기준)
- CSS 변수 사용 — 하드코딩된 색상값 직접 추가 금지, `App.css`의 변수 참조

## GeneratedComponent 타입

```typescript
interface GeneratedComponent {
  id: string;        // `${Date.now()}-${random}`
  prompt: string;
  code: string;
  createdAt: Date;
}
```

새 필드 추가 시 `src/types/index.ts` 수정 후 `useComponentGenerator.ts`의 생성 로직도 함께 수정.

## Do's & Don'ts

- DO: 사이드 이펙트(fetch 등)는 `useCallback`으로 감싸 불필요한 재생성 방지
- DO: 에러 상태는 `useComponentGenerator`의 `error` 상태로 일원화
- DON'T: `App.tsx` 내부에 fetch 로직 직접 작성 — `useComponentGenerator` 훅 사용
- DON'T: react-live `scope`에 외부 라이브러리 추가 — 생성 컴포넌트의 자체 포함 원칙 위반
- DON'T: `App.css` 없이 인라인 스타일로 레이아웃 작성 — 테마 일관성 파괴
