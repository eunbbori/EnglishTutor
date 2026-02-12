# Project Setup Guide

| 항목 | 값 |
|------|-----|
| **버전** | 1.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [OVERVIEW.md](../architecture/OVERVIEW.md) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [CONVENTIONS.md](./CONVENTIONS.md) |

이 문서는 Daily English 프로젝트의 로컬 개발 환경 구축 절차를 기술한다.

---

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [저장소 클론 및 의존성 설치](#2-저장소-클론-및-의존성-설치)
3. [환경 변수 설정](#3-환경-변수-설정)
4. [데이터베이스 설정](#4-데이터베이스-설정)
5. [개발 서버 실행](#5-개발-서버-실행)
6. [주요 npm 스크립트](#6-주요-npm-스크립트)
7. [트러블슈팅](#7-트러블슈팅)

---

## 1. 사전 요구사항

| 항목 | 최소 버전 | 확인 명령어 |
|------|----------|------------|
| Node.js | v18.17+ | `node -v` |
| npm | v9+ | `npm -v` |
| Git | v2.30+ | `git --version` |

### 외부 서비스 계정

| 서비스 | 용도 | 콘솔 URL |
|--------|------|----------|
| **Neon** | Serverless PostgreSQL 데이터베이스 | https://console.neon.tech |
| **Google Cloud** | Gemini API + OAuth 2.0 | https://console.cloud.google.com |
| **토스페이먼츠** | 결제 연동 (선택) | https://developers.tosspayments.com |

---

## 2. 저장소 클론 및 의존성 설치

```bash
# 1. 저장소 클론
git clone <repository-url>
cd EnglishTutor

# 2. 의존성 설치
npm install
```

### 설치되는 핵심 패키지

| 패키지 | 버전 | 역할 |
|--------|------|------|
| `next` | ^15.1.0 | React 프레임워크 (App Router) |
| `react` / `react-dom` | ^19.0.0 | UI 라이브러리 |
| `typescript` | ^5.7.0 | 타입 시스템 (Strict mode) |
| `drizzle-orm` | ^0.36.0 | 타입 안전 ORM |
| `@langchain/langgraph` | ^1.0.7 | AI 상태 머신 |
| `next-auth` | ^5.0.0-beta.30 | 인증 |

> 전체 의존성 목록은 `package.json` 참조.

---

## 3. 환경 변수 설정

`.env.example`을 복사하여 `.env.local`을 생성한다.

```bash
cp .env.example .env.local
```

### 필수 환경 변수

```bash
# ── AI (Google Gemini) ──────────────────────────────
GOOGLE_GENERATIVE_AI_API_KEY=   # Vercel AI SDK용 Gemini API 키
GOOGLE_API_KEY=                 # LangChain용 Gemini API 키
                                # (동일 키 사용 가능)

# ── Database (Neon) ─────────────────────────────────
DATABASE_URL=                   # Neon Postgres 연결 문자열
                                # 형식: postgresql://user:pass@host/dbname?sslmode=require

# ── Auth (NextAuth v5) ──────────────────────────────
AUTH_SECRET=                    # `npx auth secret`으로 생성
GOOGLE_CLIENT_ID=               # Google Cloud Console → OAuth 2.0 Client ID
GOOGLE_CLIENT_SECRET=           # Google Cloud Console → OAuth 2.0 Client Secret
```

### 선택 환경 변수

```bash
# ── Payment (Toss Payments) ─────────────────────────
TOSS_SECRET_KEY=                # 토스페이먼츠 시크릿 키
                                # 결제 기능 미사용 시 생략 가능
```

### 환경 변수 취득 절차

```mermaid
flowchart LR
    subgraph AI["Google Gemini API"]
        A1["Google AI Studio 접속"] --> A2["API 키 생성"]
        A2 --> A3["GOOGLE_GENERATIVE_AI_API_KEY<br/>GOOGLE_API_KEY"]
    end

    subgraph DB["Neon Database"]
        B1["Neon Console 접속"] --> B2["프로젝트 생성"]
        B2 --> B3["Connection String 복사"]
        B3 --> B4["DATABASE_URL"]
    end

    subgraph Auth["Google OAuth"]
        C1["Google Cloud Console"] --> C2["OAuth 동의 화면 설정"]
        C2 --> C3["OAuth 2.0 Client 생성"]
        C3 --> C4["GOOGLE_CLIENT_ID<br/>GOOGLE_CLIENT_SECRET"]
    end

    style AI fill:#e8f4f8,stroke:#2196f3
    style DB fill:#e8f5e9,stroke:#4caf50
    style Auth fill:#fff3e0,stroke:#ff9800
```

#### Google OAuth Redirect URI 설정

Google Cloud Console에서 OAuth 2.0 클라이언트 생성 시 아래 URI를 등록한다:

| 환경 | Redirect URI |
|------|-------------|
| 로컬 개발 | `http://localhost:3000/api/auth/callback/google` |
| 프로덕션 | `https://<your-domain>/api/auth/callback/google` |

#### AUTH_SECRET 생성

```bash
npx auth secret
# 또는
openssl rand -base64 32
```

---

## 4. 데이터베이스 설정

Neon Serverless PostgreSQL에 Drizzle ORM으로 스키마를 적용한다.

### 4.1 Neon 프로젝트 생성

1. [Neon Console](https://console.neon.tech)에서 프로젝트 생성
2. 기본 데이터베이스 `neondb` 자동 생성
3. Connection String을 `DATABASE_URL`에 설정

### 4.2 스키마 적용

```bash
# 방법 1: 개발 환경 빠른 적용 (마이그레이션 파일 미생성)
npm run db:push

# 방법 2: 마이그레이션 파일 생성 후 적용 (프로덕션 권장)
npm run db:generate    # drizzle/ 디렉토리에 SQL 파일 생성
npm run db:migrate     # 마이그레이션 실행
```

### 4.3 스키마 구조 확인

```
db/
├── index.ts        # Neon Serverless 연결 (싱글톤)
└── schema.ts       # 전체 Drizzle 테이블 정의 (15+ 테이블)
```

스키마는 4개 도메인으로 분류된다:

| 도메인 | 테이블 수 | 설명 |
|--------|----------|------|
| Auth | 4 | NextAuth 인증 (users, accounts, sessions, verification_tokens) |
| Core | 6 | 일기/교정/학습 (chats, messages, user_profiles 등) |
| Gamification | 8 | XP/스트릭/퀘스트/보물상자 |
| Billing | 3 | 구독/사용량/IAP |

> 상세 스키마는 [@docs/architecture/DATA-MODEL.md](../architecture/DATA-MODEL.md) 참조.

### 4.4 마이그레이션 워크플로우

```mermaid
flowchart LR
    A["db/schema.ts 수정"] --> B["npm run db:generate"]
    B --> C["drizzle/*.sql 생성"]
    C --> D["npm run db:migrate"]
    D --> E["Neon DB 반영"]

    style A fill:#fff3e0,stroke:#ff9800
    style E fill:#e8f5e9,stroke:#4caf50
```

---

## 5. 개발 서버 실행

```bash
# 표준 실행
npm run dev

# 포트 충돌 방지 (포트 3000 점유 시 자동 kill)
npm run dev:clean

# 로그 파일 저장 (디버깅 용도)
npm run dev:log
```

서버 시작 후 `http://localhost:3000`에서 접속한다.

### 실행 확인 체크리스트

- [ ] `http://localhost:3000` 접속 시 메인 페이지 표시
- [ ] Google 로그인 버튼 동작 (OAuth Redirect URI 설정 확인)
- [ ] 일기 작성 후 AI 교정 응답 수신 (Gemini API 키 확인)
- [ ] 히스토리 페이지에서 기록 조회 (DB 연결 확인)

---

## 6. 주요 npm 스크립트

| 스크립트 | 명령어 | 설명 |
|---------|--------|------|
| `dev` | `next dev` | 개발 서버 실행 (HMR) |
| `dev:clean` | `npx kill-port 3000 && next dev` | 포트 정리 후 실행 |
| `dev:log` | `npm run dev > .dev.log 2>&1` | 로그 파일 저장 모드 |
| `build` | `next build` | 프로덕션 빌드 |
| `start` | `next start` | 프로덕션 서버 |
| `lint` | `next lint` | ESLint 검사 |
| `db:generate` | `drizzle-kit generate` | 마이그레이션 SQL 생성 |
| `db:migrate` | `drizzle-kit migrate` | 마이그레이션 실행 |
| `db:push` | `drizzle-kit push` | 스키마 직접 Push (개발용) |

---

## 7. 트러블슈팅

### 7.1 `EADDRINUSE: address already in use :::3000`

**원인**: 이전 개발 서버 프로세스가 포트를 점유 중.

```bash
# 방법 1: npm 스크립트 사용
npm run dev:clean

# 방법 2: 수동 프로세스 종료
lsof -ti:3000 | xargs kill -9
```

### 7.2 `DATABASE_URL is not defined`

**원인**: 환경 변수 미설정.

- `.env.local` 파일 존재 여부 확인
- `drizzle.config.ts`는 `.env.local`에서 환경 변수를 로드
- Neon Connection String 형식: `postgresql://user:pass@host/db?sslmode=require`

### 7.3 `GOOGLE_GENERATIVE_AI_API_KEY is not set`

**원인**: Gemini API 키 미설정.

- Google AI Studio에서 API 키 발급 확인
- `.env.local`에 키가 올바르게 설정되었는지 확인
- Gemini API가 활성화된 Google Cloud 프로젝트인지 확인

### 7.4 NextAuth `[auth][error] OAuthCallbackError`

**원인**: OAuth Redirect URI 불일치.

- Google Cloud Console에서 Redirect URI 확인
- 로컬: `http://localhost:3000/api/auth/callback/google`
- `AUTH_SECRET` 미설정 시 세션 암호화 실패

### 7.5 Hydration Error (Server/Client Mismatch)

**원인**: 서버/클라이언트 렌더링 불일치.

```typescript
// 해결: 브라우저 API 사용 시 useEffect 래핑
import { useEffect, useState } from 'react';

function Component() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  // 브라우저 전용 렌더링
}

// 또는 Dynamic Import
import dynamic from 'next/dynamic';
const ClientOnly = dynamic(() => import('./component'), { ssr: false });
```

> 추가 개발 규칙은 [@docs/guides/CONVENTIONS.md](./CONVENTIONS.md) 참조.
