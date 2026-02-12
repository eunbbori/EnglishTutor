# SigNoz 모니터링 가이드

> **Last Updated**: 2026-02-12
> **상태**: 미구현 (향후 도입 예정)

---

## 개요

현재 Daily English는 `console.log` / `console.error` 기반의 기본 로깅만 사용한다. 이 문서는 SigNoz 기반 모니터링 도입 시 참고할 가이드라인을 정리한다.

---

## 1. 현재 로깅 현황

### 로깅 패턴

코드 전반에서 `[컴포넌트]` 접두사 + 상태 아이콘 패턴을 사용:

```typescript
// 성공
console.log("[Streak] ✓ Recorded diary entry for user:", userId);
console.log("[XP] ✓ Granted 30 XP for diary_submit");

// 실패
console.error("[Treasure Chest] ✗ Error opening chest:", error);
console.error("[API Error]", error);

// 정보
console.log("[Profile API] GET request - Fetching user profile");
console.log("[Chat] Processing message for chat:", chatId);
```

### 로깅 위치

| 모듈 | 파일 | 주요 로그 |
|------|------|----------|
| Chat API | `app/api/chat/route.ts` | 요청 처리, 에러 |
| Streak | `lib/streak/streak-manager.ts` | 스트릭 기록, Freeze 소비 |
| XP | `lib/gamification/xp-service.ts` | XP 지급, 레벨업 |
| Treasure Chest | `lib/gamification/treasure-chest.ts` | 보상 결정, 부작용 |
| Profile | `app/api/user/profile/route.ts` | 프로필 CRUD |

### 한계

- 구조화되지 않은 텍스트 로그
- 로그 검색/필터링 불가
- 성능 메트릭 수집 없음
- 분산 트레이싱 없음
- 알림/대시보드 없음

---

## 2. SigNoz 도입 계획

### SigNoz란?

OpenTelemetry 네이티브 오픈소스 APM 도구. 로그, 메트릭, 트레이스를 통합 관리한다.

### 도입 목표

1. **API 응답 시간 모니터링**: Chat API (Gemini 호출 포함) 지연 시간 추적
2. **에러 추적**: 에러율, 에러 패턴 시각화
3. **사용자 행동 분석**: 일일 활성 사용자, 교정 요청 수
4. **인프라 모니터링**: Serverless Function 실행 시간, 메모리 사용

---

## 3. 통합 방법 (가이드)

### 3.1 의존성 설치

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http
```

### 3.2 초기화 파일

`instrumentation.ts` (Next.js 15 계측 파일):

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { getNodeAutoInstrumentations } = await import(
      "@opentelemetry/auto-instrumentations-node"
    );

    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + "/v1/traces",
      }),
      instrumentations: [getNodeAutoInstrumentations()],
      serviceName: "daily-english",
    });

    sdk.start();
  }
}
```

### 3.3 Next.js 설정

`next.config.mjs`에 계측 활성화:

```javascript
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
};
```

### 3.4 환경 변수

```env
# SigNoz
OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.<region>.signoz.cloud:443
SIGNOZ_ACCESS_TOKEN=your_signoz_token
```

---

## 4. 추적 대상 메트릭

### 4.1 API 메트릭

| 메트릭 | 설명 | 임계값 |
|--------|------|--------|
| `chat.response_time` | 교정 API 응답 시간 | p95 < 30s |
| `chat.error_rate` | 교정 API 에러율 | < 1% |
| `api.request_count` | 전체 API 호출 수 | - |
| `api.status_429_count` | 사용 제한 초과 횟수 | - |

### 4.2 비즈니스 메트릭

| 메트릭 | 설명 |
|--------|------|
| `diary.submissions_daily` | 일일 교정 요청 수 |
| `user.active_daily` | DAU (일일 활성 사용자) |
| `xp.granted_total` | 총 XP 지급량 |
| `streak.active_users` | 활성 스트릭 사용자 수 |
| `subscription.conversions` | Free → Premium 전환 |
| `treasure_chest.opens` | 보물상자 오픈 수 |

### 4.3 인프라 메트릭

| 메트릭 | 설명 | 임계값 |
|--------|------|--------|
| `function.duration` | Serverless Function 실행 시간 | < 60s |
| `function.cold_start` | Cold Start 발생 비율 | < 10% |
| `db.query_time` | DB 쿼리 시간 | p95 < 500ms |

---

## 5. 커스텀 스팬 (향후)

주요 비즈니스 로직에 수동 스팬 추가:

```typescript
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("daily-english");

export async function POST(req: Request) {
  return tracer.startActiveSpan("chat.correction", async (span) => {
    try {
      span.setAttribute("user.id", userId);
      span.setAttribute("chat.mode", "diary");

      // Gemini API 호출
      const result = await tracer.startActiveSpan("gemini.invoke", async (aiSpan) => {
        const res = await graph.invoke(state);
        aiSpan.setAttribute("ai.model", "gemini-2.5-pro");
        aiSpan.setAttribute("ai.tokens", res.tokenCount);
        aiSpan.end();
        return res;
      });

      span.setStatus({ code: SpanStatusCode.OK });
      return Response.json(result);
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

---

## 6. 알림 규칙 (향후)

| 조건 | 심각도 | 알림 채널 |
|------|--------|----------|
| Chat API 에러율 > 5% (5분) | Critical | Slack + Email |
| Chat API p95 > 45s (5분) | Warning | Slack |
| DAU < 이전 주 대비 50% | Warning | Email |
| Function Timeout 발생 | Critical | Slack |
| DB 쿼리 시간 p95 > 2s | Warning | Slack |

---

## 7. 대시보드 구성 (향후)

### 운영 대시보드

- API 응답 시간 (p50, p95, p99)
- 에러율 트렌드
- 초당 요청 수 (RPS)
- Serverless Function 실행 시간 분포

### 비즈니스 대시보드

- DAU / WAU / MAU 트렌드
- 일일 교정 건수
- Free/Premium 사용자 비율
- 구독 전환율
- 스트릭 유지율

---

## 8. 마이그레이션 단계

### Phase 1: 구조화된 로깅

기존 `console.log`를 구조화된 JSON 로그로 전환:

```typescript
// Before
console.log("[Streak] ✓ Recorded diary entry for user:", userId);

// After
logger.info("diary_entry_recorded", {
  module: "streak",
  userId,
  currentStreak: streak.currentStreak,
});
```

### Phase 2: OpenTelemetry 계측

`instrumentation.ts`를 추가하고 자동 계측 활성화.

### Phase 3: 커스텀 메트릭 / 스팬

비즈니스 메트릭 수집을 위한 수동 계측 추가.

### Phase 4: 대시보드 / 알림

SigNoz 대시보드와 알림 규칙 구성.
