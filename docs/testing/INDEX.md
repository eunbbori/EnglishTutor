# Testing Documentation Index

| 항목 | 값 |
|------|-----|
| **버전** | 1.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) · [UNIT-TESTS.md](./UNIT-TESTS.md) · [API-INTEGRATION-TESTS.md](./API-INTEGRATION-TESTS.md) · [E2E-TESTS.md](./E2E-TESTS.md) |

---

## 목차

1. [개요](#개요)
2. [문서 매트릭스](#문서-매트릭스)
3. [읽기 순서](#읽기-순서)
4. [테스트 범위 요약](#테스트-범위-요약)
5. [테스트 피라미드](#테스트-피라미드)

---

## 개요

본 디렉토리는 Daily English 프로젝트의 **테스트 전략, 명세, 환경 설정, 결과 해석**에 관한 기술 문서를 포함한다. 모든 테스트 문서는 실제 코드베이스의 구조와 비즈니스 로직을 기반으로 작성되었으며, 구현 시 참조 가이드로 활용한다.

---

## 문서 매트릭스

| 문서 | 버전 | 상태 | 대상 독자 | 목적 |
|------|------|------|-----------|------|
| [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) | 1.0.0 | `완료` | 전체 팀 | 테스트 전략, 도구 선정, 커버리지 목표, CI/CD 통합 |
| [TEST-ENVIRONMENT.md](./TEST-ENVIRONMENT.md) | 1.0.0 | `완료` | 개발자 | 테스트 환경 구축, 설정 파일, Mock 전략 |
| [UNIT-TESTS.md](./UNIT-TESTS.md) | 1.0.0 | `완료` | 개발자 | 단위 테스트 명세 (순수 함수, 서비스 레이어) |
| [API-INTEGRATION-TESTS.md](./API-INTEGRATION-TESTS.md) | 1.0.0 | `완료` | 백엔드 개발자 | API Route 통합 테스트 명세 |
| [E2E-TESTS.md](./E2E-TESTS.md) | 1.0.0 | `완료` | QA / 프론트엔드 | E2E 시나리오 및 사용자 흐름 테스트 |
| [RESULTS-GUIDE.md](./RESULTS-GUIDE.md) | 1.0.0 | `완료` | 전체 팀 | 테스트 결과 해석, 리포트 분석, 디버깅 가이드 |

---

## 읽기 순서

```
1. TESTING-STRATEGY.md    ← 전략과 도구 이해 (Why & What)
   │
2. TEST-ENVIRONMENT.md    ← 환경 구축 (How to Set Up)
   │
   ├── 3a. UNIT-TESTS.md              ← 단위 테스트 구현
   │
   ├── 3b. API-INTEGRATION-TESTS.md   ← API 통합 테스트 구현
   │
   └── 3c. E2E-TESTS.md              ← E2E 테스트 구현
       │
4. RESULTS-GUIDE.md       ← 결과 해석 및 디버깅
```

> **참고**: 3a–3c는 독립적으로 읽을 수 있다. 담당 영역에 따라 선택적으로 참조.

---

## 테스트 범위 요약

### 대상 모듈별 테스트 유형

| 모듈 | 단위 | 통합 | E2E | 우선순위 |
|------|:----:|:----:|:---:|:--------:|
| `lib/gamification/xp-constants.ts` | ● | — | — | P0 |
| `lib/validation/ttr.ts` | ● | — | — | P0 |
| `lib/ai/response-validator.ts` | ● | — | — | P0 |
| `lib/ai/schema.ts` | ● | — | — | P0 |
| `lib/calendar/utils.ts` | ● | — | — | P1 |
| `lib/gamification/xp-service.ts` | ● | ● | — | P0 |
| `lib/streak/streak-manager.ts` | ● | ● | — | P0 |
| `lib/gamification/treasure-chest.ts` | ● | ● | — | P1 |
| `lib/subscription/check-usage.ts` | ● | ● | — | P1 |
| `lib/ai/graph.ts` | — | ● | — | P1 |
| `app/api/chat/route.ts` | — | ● | ● | P0 |
| `app/api/history/route.ts` | — | ● | ● | P1 |
| `app/api/vocabulary/route.ts` | — | ● | ● | P1 |
| `app/api/streak/route.ts` | — | ● | — | P2 |
| `app/api/usage/route.ts` | — | ● | — | P2 |
| 일기 작성 → 교정 흐름 | — | — | ● | P0 |
| 표현노트 CRUD 흐름 | — | — | ● | P1 |
| 결제 → 구독 전환 흐름 | — | — | ● | P1 |
| 캘린더/히스토리 조회 | — | — | ● | P2 |

> `●` = 테스트 대상, `—` = 해당 없음, `P0` = 최우선, `P2` = 낮은 우선순위

---

## 테스트 피라미드

```
            ╱╲
           ╱  ╲           E2E Tests
          ╱ E2E╲          · 5~10 시나리오
         ╱──────╲         · Playwright
        ╱        ╲
       ╱Integration╲      Integration Tests
      ╱   Tests     ╲     · 60~80 케이스
     ╱────────────────╲    · Vitest + Supertest
    ╱                  ╲
   ╱    Unit Tests      ╲  Unit Tests
  ╱                      ╲ · 200~300 케이스
 ╱────────────────────────╲ · Vitest
```

| 레이어 | 비율 | 목적 | 실행 속도 |
|--------|------|------|-----------|
| Unit | 70% | 순수 함수, 비즈니스 로직 검증 | < 10초 |
| Integration | 20% | API Route, DB 연동, 서비스 간 협력 검증 | < 60초 |
| E2E | 10% | 사용자 시나리오, 크리티컬 패스 검증 | < 5분 |

---

## 관련 아키텍처 문서

테스트 대상 시스템의 상세 사양은 아래 문서를 참조:

| 도메인 | 참조 문서 |
|--------|-----------|
| API 엔드포인트 | [API-SPEC.md](../architecture/API-SPEC.md) |
| 일기 교정 흐름 | [CHAT-SEQUENCE.md](../architecture/CHAT-SEQUENCE.md) |
| AI 파이프라인 | [AI-PIPELINE-SPEC.md](../spec/system/AI-PIPELINE-SPEC.md) |
| 게이미피케이션 | [GAMIFICATION-SPEC.md](../spec/system/GAMIFICATION-SPEC.md) |
| 데이터 모델 | [DATA-MODEL.md](../architecture/DATA-MODEL.md) |
| 데이터 흐름 | [DATA-FLOW-SPEC.md](../spec/system/DATA-FLOW-SPEC.md) |
| 공통 시스템 | [COMMON-SYSTEMS.md](../architecture/COMMON-SYSTEMS.md) |
| 코드 컨벤션 | [CONVENTIONS.md](../guides/CONVENTIONS.md) |
