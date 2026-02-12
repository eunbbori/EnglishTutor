# 프로젝트 셋업 가이드

> **Last Updated**: 2026-02-12

---

## 사전 요구사항

| 도구 | 최소 버전 | 용도 |
|------|----------|------|
| Node.js | 18.17+ | 런타임 |
| npm | 9+ | 패키지 관리 |
| Git | 2.30+ | 버전 관리 |

---

## 1. 저장소 클론

```bash
git clone https://github.com/eunbbori/EnglishTutor.git
cd EnglishTutor
```

---

## 2. 의존성 설치

```bash
npm install
```

### 주요 의존성

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `next` | ^15.1.0 | App Router 프레임워크 |
| `react` / `react-dom` | ^19.0.0 | UI 라이브러리 |
| `typescript` | ^5.7.0 | 타입 시스템 |
| `drizzle-orm` | ^0.36.0 | ORM |
| `next-auth` | ^5.0.0-beta.30 | 인증 (v5 Beta) |
| `@langchain/langgraph` | ^1.0.7 | AI 워크플로우 |
| `@langchain/google-genai` | ^2.1.1 | Google Gemini |
| `ai` | ^4.0.0 | Vercel AI SDK |
| `tailwindcss` | ^3.4.0 | CSS 유틸리티 |
| `zod` | ^3.24.0 | 스키마 검증 |

---

## 3. 환경 변수 설정

`.env.example`을 복사하여 `.env.local`을 생성한다:

```bash
cp .env.example .env.local
```

### 필수 환경 변수

```env
# Google Gemini API (필수)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Neon Serverless Postgres (필수)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 인증 관련 환경 변수

```env
# NextAuth.js v5 (Google OAuth)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth Secret (자동 생성 가능)
AUTH_SECRET=your_random_secret
```

### 결제 관련 환경 변수 (선택)

```env
# Toss Payments
NEXT_PUBLIC_TOSS_CLIENT_KEY=your_toss_client_key
TOSS_SECRET_KEY=your_toss_secret_key
```

### API 키 발급 방법

| 서비스 | 발급 URL | 비고 |
|--------|---------|------|
| Google Gemini | Google AI Studio | API Key 생성 |
| Google OAuth | Google Cloud Console | OAuth 2.0 클라이언트 ID |
| Neon Database | Neon Console | 프로젝트 생성 후 연결 문자열 |
| Toss Payments | Toss Developers | 테스트 키 사용 가능 |

---

## 4. 데이터베이스 설정

### 4.1 Neon 프로젝트 생성

1. Neon Console에서 새 프로젝트 생성
2. 연결 문자열을 `.env.local`의 `DATABASE_URL`에 설정

### 4.2 스키마 마이그레이션

```bash
# 마이그레이션 파일 생성
npm run db:generate

# 마이그레이션 실행
npm run db:migrate
```

또는 개발 시 빠른 스키마 동기화:

```bash
# 스키마를 DB에 직접 push (개발용)
npm run db:push
```

### 4.3 Drizzle 설정

`drizzle.config.ts`:

```typescript
export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

- **스키마 파일**: `db/schema.ts` (21개 테이블)
- **마이그레이션 디렉토리**: `drizzle/`
- **환경 변수**: `.env.local`에서 자동 로드

---

## 5. 개발 서버 실행

```bash
# 기본 개발 서버 (http://localhost:3000)
npm run dev

# 포트 충돌 해결 후 실행
npm run dev:clean

# 로그 파일로 출력
npm run dev:log
```

---

## 6. NPM 스크립트 요약

| 스크립트 | 명령어 | 설명 |
|----------|--------|------|
| `dev` | `next dev` | 개발 서버 실행 |
| `dev:clean` | `npx kill-port 3000 && next dev` | 포트 정리 후 개발 서버 |
| `dev:log` | `npm run dev > .dev.log 2>&1` | 로그 파일 출력 |
| `build` | `next build` | 프로덕션 빌드 |
| `start` | `next start` | 프로덕션 서버 |
| `lint` | `next lint` | ESLint 검사 |
| `db:generate` | `drizzle-kit generate` | 마이그레이션 파일 생성 |
| `db:migrate` | `drizzle-kit migrate` | 마이그레이션 실행 |
| `db:push` | `drizzle-kit push` | 스키마 직접 동기화 |
| `db:apply-migration` | `node scripts/apply-migration.mjs` | 커스텀 마이그레이션 |

---

## 7. 프로젝트 설정 파일

### TypeScript (`tsconfig.json`)

- **Strict 모드**: 활성화
- **경로 별칭**: `@/` → 프로젝트 루트
- **대상**: ES2017
- **모듈**: ESNext + Bundler resolution
- **제외**: `node_modules`, `scripts`

### Next.js (`next.config.mjs`)

- TypeScript 오류 시 빌드 실패 (`ignoreBuildErrors: false`)
- ESLint 오류 시 빌드 실패 (`ignoreDuringBuilds: false`)

### Shadcn UI (`components.json`)

- **스타일**: New York
- **RSC**: 활성화 (React Server Components)
- **TSX**: 활성화
- **기본 색상**: Slate
- **CSS 변수**: 활성화

---

## 8. 유틸리티 스크립트

`scripts/` 디렉토리에 DB 관리 스크립트가 있다:

| 스크립트 | 용도 |
|----------|------|
| `apply-migration.mjs` | 대기 중인 마이그레이션 적용 |
| `data-migration.ts` | 데이터 변환 |
| `diagnose-xp.ts` | XP 시스템 감사 |
| `migrate-level.ts` | 레벨 마이그레이션 |
| `set-usage-zero.ts` | 일일 사용량 초기화 |
| `test-xp-grant.ts` | XP 지급 테스트 |

---

## 9. 트러블슈팅

### 포트 3000 충돌

```bash
npm run dev:clean
# 또는
npx kill-port 3000
```

### DATABASE_URL 연결 오류

- `.env.local` 파일이 존재하는지 확인
- Neon 대시보드에서 연결 문자열 확인
- `?sslmode=require` 파라미터 포함 여부 확인

### Google OAuth 콜백 오류

- Google Cloud Console에서 승인된 리디렉션 URI 설정:
  - 개발: `http://localhost:3000/api/auth/callback/google`
  - 프로덕션: `https://your-domain.com/api/auth/callback/google`

### Drizzle 마이그레이션 오류

```bash
# 마이그레이션 상태 확인 후 수동 적용
npm run db:apply-migration
```
