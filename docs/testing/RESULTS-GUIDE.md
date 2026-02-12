# Test Results & Debugging Guide

| 항목 | 값 |
|------|-----|
| **버전** | 1.0.0 |
| **상태** | `완료` |
| **최종 수정일** | 2026-02-12 |
| **관련 문서** | [TESTING-STRATEGY.md](./TESTING-STRATEGY.md) · [TEST-ENVIRONMENT.md](./TEST-ENVIRONMENT.md) · [UNIT-TESTS.md](./UNIT-TESTS.md) · [E2E-TESTS.md](./E2E-TESTS.md) |

---

## 목차

1. [리포트 개요](#1-리포트-개요)
2. [Vitest 결과 해석](#2-vitest-결과-해석)
3. [커버리지 리포트 분석](#3-커버리지-리포트-분석)
4. [Playwright 결과 해석](#4-playwright-결과-해석)
5. [실패 디버깅 가이드](#5-실패-디버깅-가이드)
6. [CI/CD 리포트 활용](#6-cicd-리포트-활용)
7. [테스트 품질 메트릭](#7-테스트-품질-메트릭)
8. [자주 발생하는 실패 패턴](#8-자주-발생하는-실패-패턴)

---

## 1. 리포트 개요

### 1.1 리포트 종류 및 위치

| 리포트 | 생성 명령 | 출력 경로 | 형식 |
|--------|-----------|-----------|------|
| Vitest 콘솔 | `npx vitest run` | stdout | 텍스트 |
| Vitest 커버리지 (텍스트) | `npx vitest run --coverage` | stdout | 텍스트 테이블 |
| Vitest 커버리지 (HTML) | `npx vitest run --coverage` | `coverage/index.html` | HTML |
| Vitest 커버리지 (lcov) | `npx vitest run --coverage` | `coverage/lcov.info` | lcov |
| Vitest UI | `npx vitest --ui` | `http://localhost:51204` | 웹 UI |
| Playwright 리포트 | `npx playwright test` | `playwright-report/index.html` | HTML |
| Playwright 트레이스 | 실패 시 자동 | `test-results/*/trace.zip` | Trace Viewer |

### 1.2 리포트 열기 명령

```bash
# Vitest 커버리지 HTML
open coverage/index.html            # macOS
xdg-open coverage/index.html        # Linux

# Playwright 리포트
npx playwright show-report

# Playwright 트레이스 뷰어
npx playwright show-trace test-results/<test>/trace.zip
```

---

## 2. Vitest 결과 해석

### 2.1 콘솔 출력 구조

```
 ✓ __tests__/unit/lib/gamification/xp-constants.test.ts (45 tests) 23ms
   ✓ xp-constants > calculateLevel > should return level 1 for 0 XP
   ✓ xp-constants > calculateLevel > should return level 10 for free user at cap
   ✗ xp-constants > checkLevelUp > should detect multi-level jump
     → AssertionError: expected null to deeply equal { from: 1, to: 3 }
 ✓ __tests__/unit/lib/validation/ttr.test.ts (20 tests) 8ms

 Test Files  2 passed | 1 failed (3)
 Tests       64 passed | 1 failed (65)
 Duration    156ms
```

### 2.2 상태 아이콘 해석

| 아이콘 | 의미 | 대응 방법 |
|--------|------|-----------|
| `✓` | 통과 | — |
| `✗` | 실패 | 에러 메시지 확인 → 수정 |
| `○` | 건너뜀 (`skip`) | 의도적 건너뜀 확인, 임시면 TODO 생성 |
| `◌` | 미실행 (`todo`) | 구현 예정 테스트 |

### 2.3 에러 메시지 읽기

```
FAIL  __tests__/unit/lib/gamification/xp-constants.test.ts

 ✗ xp-constants > checkLevelUp > should detect multi-level jump

   AssertionError: expected null to deeply equal { from: 1, to: 3 }

   ❯ __tests__/unit/lib/gamification/xp-constants.test.ts:87:25
      85|   it('should detect multi-level jump', () => {
      86|     const result = checkLevelUp(0, 300, false);
    > 87|     expect(result).toEqual({ from: 1, to: 3, title: 'Diary Beginner' });
      88|   });

   Expected: { from: 1, to: 3, title: 'Diary Beginner' }
   Received: null
```

**해석 순서**:
1. **파일/테스트명**: 어떤 테스트가 실패했는지 확인
2. **에러 타입**: `AssertionError` = 기대값 불일치
3. **위치**: `xp-constants.test.ts:87:25` — 파일의 87번 라인
4. **Expected vs Received**: 기대한 값과 실제 값 비교
5. **근본 원인 추론**: 함수가 `null`을 반환 → `checkLevelUp` 로직 확인 필요

---

## 3. 커버리지 리포트 분석

### 3.1 텍스트 리포트 읽기

```
-----------------------------|---------|----------|---------|---------|
File                         | % Stmts | % Branch | % Funcs | % Lines |
-----------------------------|---------|----------|---------|---------|
All files                    |   82.15 |    76.32 |   87.50 |   82.15 |
 lib/gamification            |   91.20 |    85.71 |   95.00 |   91.20 |
  xp-constants.ts            |   98.00 |    95.00 |  100.00 |   98.00 |
  xp-service.ts              |   85.00 |    78.00 |   90.00 |   85.00 |
  treasure-chest.ts          |   88.00 |    82.00 |   92.00 |   88.00 |
 lib/validation              |   95.00 |    92.00 |  100.00 |   95.00 |
  ttr.ts                     |   95.00 |    92.00 |  100.00 |   95.00 |
 lib/ai                      |   78.00 |    70.00 |   85.00 |   78.00 |
  schema.ts                  |   90.00 |    85.00 |  100.00 |   90.00 |
  response-validator.ts      |   88.00 |    80.00 |   90.00 |   88.00 |
  graph.ts                   |   55.00 |    45.00 |   65.00 |   55.00 |
-----------------------------|---------|----------|---------|---------|
```

### 3.2 메트릭 설명

| 메트릭 | 의미 | 설명 |
|--------|------|------|
| **Statements (Stmts)** | 구문 커버리지 | 실행된 코드 구문 비율 |
| **Branches** | 분기 커버리지 | `if/else`, `switch`, `?:` 등 조건 분기 비율 |
| **Functions (Funcs)** | 함수 커버리지 | 1회 이상 호출된 함수 비율 |
| **Lines** | 라인 커버리지 | 실행된 코드 라인 비율 |

### 3.3 HTML 리포트 활용

```
coverage/index.html
├── 파일 목록 (커버리지 %, 막대 그래프)
├── 파일 클릭 → 소스 코드 뷰
│   ├── 🟢 초록: 실행된 라인
│   ├── 🔴 빨강: 미실행 라인
│   ├── 🟡 노랑: 부분 실행 분기 (일부 조건만 테스트됨)
│   └── 숫자 표시: 해당 라인 실행 횟수
└── 폴더별 집계
```

### 3.4 커버리지 개선 판단 기준

| 상황 | 판단 | 행동 |
|------|------|------|
| 빨간 라인이 에러 핸들링 | 테스트 추가 필요 | 에러 경로 테스트 케이스 작성 |
| 빨간 라인이 미사용 코드 | 코드 제거 검토 | Dead code 확인 후 삭제 |
| 노란 분기가 edge case | 경계값 테스트 추가 | 누락된 조건 분기 커버 |
| 전체 커버리지가 임계값 미달 | 우선순위 높은 모듈부터 | P0 모듈 → P1 → P2 순서 |

### 3.5 프로젝트 임계값 기준

| 메트릭 | 임계값 | 미달 시 |
|--------|:------:|---------|
| Lines | 80% | CI 경고 (선택적 차단) |
| Branches | 75% | CI 경고 |
| Functions | 85% | CI 경고 |
| Statements | 80% | CI 경고 |

> 임계값 설정: `vitest.config.ts` → `coverage.thresholds`

---

## 4. Playwright 결과 해석

### 4.1 콘솔 출력

```
Running 6 tests using 1 worker

  ✓  1 diary-correction.spec.ts:12:5 › S1: 비로그인 일기 교정 (28s)
  ✓  2 diary-correction.spec.ts:45:5 › S2: 로그인 일기 교정 + XP (42s)
  ✗  3 usage-limit.spec.ts:10:5 › S3: 사용량 초과 시나리오 (31s)
  ✓  4 vocabulary.spec.ts:8:5 › S4: 표현노트 CRUD (38s)
  ✓  5 calendar.spec.ts:8:5 › S5: 캘린더 + 히스토리 (27s)
  ✓  6 payment.spec.ts:8:5 › S6: 결제 흐름 (44s)

  5 passed (3.5m)
  1 failed
```

### 4.2 실패 분석

```
  ✗  3 usage-limit.spec.ts:10:5 › S3: 사용량 초과 시나리오

    Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

    Locator: getByTestId('upgrade-modal')

    Call log:
      - waiting for getByTestId('upgrade-modal')
      -   locator resolved to 0 elements

    Screenshot: test-results/usage-limit-S3/screenshot.png
    Trace: test-results/usage-limit-S3/trace.zip
```

**해석 순서**:
1. **에러 타입**: `Timed out` → 요소가 나타나지 않음
2. **로케이터**: `getByTestId('upgrade-modal')` → `data-testid` 확인
3. **스크린샷**: 실패 시점의 화면 상태 확인
4. **트레이스**: 전체 액션 히스토리 재생

### 4.3 트레이스 뷰어 활용

```bash
npx playwright show-trace test-results/usage-limit-S3/trace.zip
```

트레이스 뷰어에서 확인할 수 있는 항목:

| 탭 | 내용 |
|----|------|
| **Actions** | 각 액션의 시간순 목록 + 스크린샷 |
| **Network** | API 요청/응답 (상태 코드, 본문) |
| **Console** | 브라우저 콘솔 로그 |
| **Source** | 테스트 코드의 실행 위치 |

---

## 5. 실패 디버깅 가이드

### 5.1 디버깅 의사결정 트리

```
테스트 실패
│
├── Unit Test 실패?
│   ├── AssertionError (기대값 불일치)
│   │   ├── 기대값이 잘못됨 → 테스트 수정
│   │   └── 함수 로직 변경됨 → 의도적? → 테스트 갱신
│   │                         └── 버그? → 코드 수정
│   ├── TypeError / ReferenceError
│   │   ├── Mock 누락 → Mock 설정 확인
│   │   └── Import 경로 오류 → alias 확인
│   └── Timeout
│       └── 비동기 Mock 미해결 → Promise resolve 확인
│
├── Integration Test 실패?
│   ├── 401 / 403 → Auth Mock 확인
│   ├── 400 → Request 형식 확인
│   ├── 500 → 서비스 레이어 Mock 확인
│   └── Timeout → MSW 핸들러 매칭 확인
│
└── E2E Test 실패?
    ├── Element not found → 셀렉터 확인 (testid, role)
    ├── Timeout waiting → 네트워크/렌더링 지연
    ├── Navigation error → URL 라우팅 확인
    └── 스크린샷에 에러 UI → 앱 에러 확인
```

### 5.2 유형별 디버깅 절차

#### A. Unit Test — AssertionError

```
1. 에러 메시지에서 Expected vs Received 확인
2. 해당 함수의 소스 코드 확인 (최근 변경?)
3. git blame으로 최근 수정자/커밋 확인
4. 변경이 의도적이면 → 테스트 케이스 갱신
5. 변경이 비의도적이면 → 코드 롤백 또는 수정
```

#### B. Unit Test — Mock 관련 에러

```
1. vi.mock() 경로가 정확한지 확인 (alias 주의)
2. mockResolvedValue / mockReturnValue 반환값 확인
3. beforeEach에서 vi.clearAllMocks() 호출 확인
4. 다른 테스트의 Mock이 누출되지 않았는지 확인
5. Mock 체이닝 순서 확인 (Drizzle: select → from → where)
```

#### C. Integration Test — HTTP 상태 코드 오류

| 상태 코드 | 확인 항목 |
|-----------|-----------|
| 401 | `auth()` Mock이 세션을 반환하는지 |
| 400 | Request body 구조가 스키마와 일치하는지 |
| 404 | URL 파라미터 (dynamic route)가 올바른지 |
| 429 | 사용량 Mock이 한도 초과 상태인지 |
| 500 | 내부 서비스 Mock이 에러를 던지는지 |

#### D. E2E Test — 타임아웃

```
1. 스크린샷 확인 → 화면이 어떤 상태인지 파악
2. 트레이스 뷰어로 네트워크 탭 확인 → API 응답 확인
3. 로케이터 확인:
   - data-testid가 컴포넌트에 존재하는지
   - 컴포넌트가 조건부 렌더링되는지
   - 비동기 로딩 후에만 표시되는 요소인지
4. 타임아웃 값 조정 (기본 5000ms → 15000ms)
5. 개발 서버에서 수동으로 동일 흐름 확인
```

### 5.3 디버그 모드 실행

```bash
# Vitest 디버그 (Node Inspector)
npx vitest --inspect-brk --single-thread
# Chrome DevTools: chrome://inspect에서 연결

# Playwright 디버그 (브라우저 표시 + 스텝 실행)
npx playwright test --debug

# Playwright 특정 테스트만 headed 모드
npx playwright test --headed -g "S1"
```

---

## 6. CI/CD 리포트 활용

### 6.1 GitHub Actions 아티팩트

| 아티팩트 | 용도 | 다운로드 방법 |
|----------|------|-------------|
| `coverage-report` | 커버리지 HTML | Actions → Artifacts |
| `playwright-report` | E2E 리포트 HTML | Actions → Artifacts |
| `test-results` | 스크린샷, 트레이스 | Actions → Artifacts |

### 6.2 PR 코멘트 통합

커버리지 변화를 PR 코멘트로 자동 게시:

```yaml
# .github/workflows/test.yml 내 추가 단계
- name: Coverage Report
  uses: davelosert/vitest-coverage-report-action@v2
  if: always()
  with:
    json-summary-path: coverage/coverage-summary.json
```

출력 예시:

```
📊 Coverage Report

| Category   | Coverage | Threshold | Status |
|------------|----------|-----------|--------|
| Lines      | 83.2%    | 80%       | ✅     |
| Branches   | 77.1%    | 75%       | ✅     |
| Functions  | 89.5%    | 85%       | ✅     |
| Statements | 83.2%    | 80%       | ✅     |

Changed Files:
| File              | Lines | Branches | Change |
|-------------------|-------|----------|--------|
| xp-service.ts     | 87%   | 80%      | +5%    |
| streak-manager.ts | 82%   | 75%      | new    |
```

### 6.3 실패 알림

| 채널 | 트리거 | 내용 |
|------|--------|------|
| GitHub Status Check | 테스트 실패 시 | PR Merge 차단 |
| Slack (선택) | main 브랜치 실패 시 | 실패 요약 + 링크 |

---

## 7. 테스트 품질 메트릭

### 7.1 추적 메트릭

| 메트릭 | 측정 방법 | 건강 기준 |
|--------|-----------|-----------|
| **테스트 수** | `npx vitest run --reporter=json` | 증가 추세 |
| **통과율** | passed / total × 100 | ≥ 99% (main 브랜치) |
| **실행 시간** | Vitest/Playwright 출력 | Unit < 10s, E2E < 5m |
| **코드 커버리지** | coverage/coverage-summary.json | 임계값 이상 |
| **Flaky 테스트 비율** | 재시도 성공 횟수 / 전체 | < 2% |
| **테스트/코드 비율** | 테스트 라인 / 소스 라인 | 0.8~1.5 |

### 7.2 Flaky 테스트 관리

```
Flaky Test = 동일 코드에서 통과/실패가 비결정적으로 발생하는 테스트
```

| 원인 | 식별 방법 | 해결 방법 |
|------|-----------|-----------|
| 시간 의존 | 특정 시간대에만 실패 | `vi.useFakeTimers()` 적용 |
| 난수 의존 | 간헐적 실패 | `Math.random` Mock |
| 비동기 경쟁 조건 | 재실행 시 통과 | `waitFor` / `expect.poll()` 사용 |
| 테스트 순서 의존 | 단독 실행 시 통과 | `beforeEach` 초기화 강화 |
| 네트워크 지연 | CI에서만 실패 | MSW Mock 또는 타임아웃 증가 |

**관리 절차**:

```
1. Flaky 테스트 식별 (CI 로그에서 retry 성공 건 추적)
2. @flaky 태그 부착 (임시)
3. 근본 원인 분석 (위 표 참조)
4. 수정 후 태그 제거
5. 3회 이상 Flaky → 격리 또는 재작성
```

---

## 8. 자주 발생하는 실패 패턴

### 8.1 패턴 카탈로그

#### Pattern 1: KST 타임존 미스매치

```
증상: 스트릭/캘린더 테스트가 특정 시간대에 실패
원인: Date Mock이 UTC 기준, 비즈니스 로직은 KST 기준
해결: setKSTTime() 헬퍼 사용 (TEST-ENVIRONMENT.md §6.3)
확인: formatDateKST()의 반환값이 기대 KST 날짜와 일치하는지
```

#### Pattern 2: Drizzle 체이닝 Mock 불일치

```
증상: TypeError: db.select(...).from is not a function
원인: Mock 객체의 체이닝 메서드 누락
해결: db-mock.ts의 chainable() 패턴 적용
확인: select → from → where → limit 체이닝 전부 반환
```

#### Pattern 3: Zod 스키마 변경 후 테스트 미갱신

```
증상: 다수의 schema.test.ts 케이스 동시 실패
원인: lib/ai/schema.ts 수정 후 테스트 미동기화
해결: 스키마 변경 시 해당 테스트 파일 동시 갱신 (커밋 규칙)
확인: git diff로 스키마 변경 확인 → 테스트 파일도 변경되었는지
```

#### Pattern 4: XP 임계값 변경 후 대규모 실패

```
증상: xp-constants 관련 테스트 다수 실패
원인: LEVEL_THRESHOLDS 상수 변경
해결: 상수 변경 시 관련 테스트의 기대값 일괄 갱신
확인: LEVEL_THRESHOLDS 배열의 값과 테스트 기대값 동기화
```

#### Pattern 5: E2E 로케이터 깨짐

```
증상: Element not found — getByTestId('...')
원인: 컴포넌트 리팩토링 시 data-testid 제거
해결: E2E 대상 컴포넌트의 testid는 제거 전 E2E 파일 확인
확인: grep -r "getByTestId" e2e/ → 사용 중인 testid 목록 확보
```

### 8.2 실패 시 체크리스트

테스트 실패 시 아래 순서로 점검:

- [ ] 최근 코드 변경 사항 확인 (`git log -5`)
- [ ] 로컬에서 해당 테스트만 단독 실행 (`npx vitest run -t "테스트명"`)
- [ ] Mock 설정 검증 (경로, 반환값, 초기화)
- [ ] 환경 변수 확인 (`.env.test` 존재, 값 정상)
- [ ] Node.js 버전 확인 (`node -v` ≥ 18.17)
- [ ] `node_modules` 재설치 (`rm -rf node_modules && npm ci`)
- [ ] 스크린샷/트레이스 확인 (E2E 한정)
- [ ] 다른 브랜치에서 동일 테스트 실행 (환경 문제 분리)
