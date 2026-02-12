# 배포 가이드

> **Last Updated**: 2026-02-12

---

## 개요

Daily English는 **Vercel** 플랫폼에 배포되며, **Neon Serverless Postgres**를 데이터베이스로 사용한다. `main` 브랜치에 push되면 Vercel이 자동으로 프로덕션 배포를 수행한다.

---

## 1. 인프라 구성

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client     │────▶│   Vercel     │────▶│  Neon Postgres   │
│  (Browser)   │     │  (Next.js)   │     │  (Serverless)    │
└─────────────┘     └──────┬───────┘     └─────────────────┘
                           │
                    ┌──────┴───────┐
                    │  Google AI   │
                    │  (Gemini)    │
                    └──────────────┘
```

| 서비스 | 역할 | 플랜 |
|--------|------|------|
| Vercel | Next.js 호스팅, Serverless Functions | Hobby / Pro |
| Neon | PostgreSQL 데이터베이스 | Free / Pro |
| Google AI | Gemini 2.5 Pro API | Pay-as-you-go |
| Toss Payments | 결제 처리 | 가맹점 계약 |

---

## 2. Vercel 배포

### 2.1 프로젝트 연결

1. [Vercel Dashboard](https://vercel.com/dashboard)에서 "New Project" 선택
2. GitHub 저장소 `eunbbori/EnglishTutor` 연결
3. Framework: Next.js (자동 감지)
4. Root Directory: `./` (기본값)

### 2.2 빌드 설정

| 설정 | 값 |
|------|-----|
| Framework | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |
| Node.js Version | 18.x |

### 2.3 환경 변수 설정

Vercel Dashboard → Settings → Environment Variables에서 설정:

**필수 변수**:

| 변수 | 환경 | 설명 |
|------|------|------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Production, Preview | Gemini API 키 |
| `DATABASE_URL` | Production, Preview | Neon 연결 문자열 |
| `GOOGLE_CLIENT_ID` | Production, Preview | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Production, Preview | Google OAuth 시크릿 |
| `AUTH_SECRET` | Production, Preview | NextAuth 시크릿 |

**결제 변수** (프로덕션):

| 변수 | 환경 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | Production | Toss 클라이언트 키 |
| `TOSS_SECRET_KEY` | Production | Toss 시크릿 키 |

### 2.4 배포 흐름

```
git push origin main
      │
      ▼
Vercel 빌드 트리거
      │
      ▼
npm install → next build → next lint
      │
      ▼
TypeScript 검사 (ignoreBuildErrors: false)
      │
      ▼
ESLint 검사 (ignoreDuringBuilds: false)
      │
      ▼
배포 완료 → Production URL 업데이트
```

### 2.5 Preview 배포

PR을 생성하면 Vercel이 자동으로 Preview 배포를 생성한다:

- URL 형식: `https://english-tutor-<hash>-<team>.vercel.app`
- PR 코멘트에 Preview URL이 자동 추가됨
- Preview 환경에서도 환경 변수가 적용됨

---

## 3. Serverless Function 제한

### Vercel Hobby 플랜

| 제한 | 값 |
|------|-----|
| Function 최대 실행 시간 | 60초 |
| Function 최대 크기 | 50MB |
| 월간 Function 호출 | 100,000 |
| Bandwidth | 100GB/월 |

### maxDuration 설정

AI 교정 API는 최대 60초가 필요하므로 명시적으로 설정:

```typescript
// app/api/chat/route.ts
export const maxDuration = 60;
```

---

## 4. 데이터베이스 (Neon)

### 4.1 연결 방식

Neon Serverless Driver를 통해 HTTP 기반으로 연결:

```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### 4.2 프로덕션 마이그레이션

```bash
# 1. 마이그레이션 파일 생성 (로컬)
npm run db:generate

# 2. 마이그레이션 파일을 커밋
git add drizzle/
git commit -m "chore: add database migration"

# 3. 프로덕션 DB에 마이그레이션 적용
DATABASE_URL=<production-url> npm run db:migrate
```

또는 빠른 스키마 동기화:

```bash
DATABASE_URL=<production-url> npm run db:push
```

### 4.3 Neon 브랜칭 (선택)

Neon은 DB 브랜칭을 지원한다. Preview 배포마다 별도 DB 브랜치를 사용 가능:

- Production: `main` 브랜치
- Preview: PR별 DB 브랜치 (Neon-Vercel 통합)

---

## 5. 외부 서비스 설정

### 5.1 Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → API & Services → Credentials
2. OAuth 2.0 Client ID 생성
3. 승인된 리디렉션 URI 추가:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (개발용)

### 5.2 Google Gemini API

1. [Google AI Studio](https://aistudio.google.com/) → API Key 생성
2. Vercel 환경 변수에 `GOOGLE_GENERATIVE_AI_API_KEY` 설정

### 5.3 Toss Payments

1. Toss Developers 가맹점 등록
2. 라이브 키를 Vercel 환경 변수에 설정
3. 결제 성공/실패 URL을 프로덕션 도메인으로 설정

---

## 6. 빌드 검증

### 로컬 빌드 테스트

배포 전 로컬에서 프로덕션 빌드를 확인:

```bash
# 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

### 빌드 체크리스트

- [ ] `npm run build` 성공 (TypeScript 오류 없음)
- [ ] `npm run lint` 통과 (ESLint 오류 없음)
- [ ] 모든 환경 변수 설정 완료
- [ ] DB 마이그레이션 적용 완료
- [ ] Google OAuth 리디렉션 URI 등록 완료

---

## 7. 도메인 설정

### Vercel 커스텀 도메인

1. Vercel Dashboard → Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정:
   - A 레코드: `76.76.21.21`
   - 또는 CNAME: `cname.vercel-dns.com`

### SSL

Vercel이 Let's Encrypt를 통해 SSL 인증서를 자동 관리한다.

---

## 8. 모니터링 / 로그

### Vercel 빌트인

- **Deployment Logs**: 빌드/배포 로그
- **Function Logs**: Serverless Function 실행 로그
- **Analytics**: 페이지 조회, 성능 지표 (Pro 플랜)
- **Speed Insights**: Core Web Vitals (Pro 플랜)

### 로그 확인

```bash
# Vercel CLI로 실시간 로그 확인
npx vercel logs <deployment-url> --follow
```

---

## 9. 롤백

### Vercel 인스턴트 롤백

1. Vercel Dashboard → Deployments
2. 이전 정상 배포 선택
3. "Promote to Production" 클릭

이전 배포로 즉시 롤백되며, 빌드 대기 시간이 없다.

---

## 10. 환경별 설정 요약

| 항목 | 로컬 (dev) | Preview | Production |
|------|-----------|---------|------------|
| URL | localhost:3000 | *.vercel.app | 커스텀 도메인 |
| DB | Neon (개발 브랜치) | Neon (Preview) | Neon (main) |
| AI API | 테스트 키 | 테스트 키 | 프로덕션 키 |
| OAuth | localhost 콜백 | preview 콜백 | 도메인 콜백 |
| 결제 | 테스트 키 | 테스트 키 | 라이브 키 |
| Function Timeout | 없음 | 60초 | 60초 |
