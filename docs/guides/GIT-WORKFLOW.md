# Git 워크플로우

> **Last Updated**: 2026-02-12

---

## 1. 브랜치 전략

### 주요 브랜치

| 브랜치 | 용도 | 배포 대상 |
|--------|------|----------|
| `main` | 프로덕션 안정 버전 | Vercel Production |
| `develop` | 개발 통합 (선택적) | Vercel Preview |

### 기능 브랜치

`main`에서 분기하여 작업 후 PR을 통해 병합한다.

```
main
 └── feature/diary-mood-selector
 └── fix/streak-freeze-count
 └── docs/architecture-overview
 └── refactor/xp-calculation
```

### 브랜치 네이밍 규칙

```
<type>/<short-description>
```

| 타입 | 용도 | 예시 |
|------|------|------|
| `feature/` | 새 기능 | `feature/treasure-chest` |
| `fix/` | 버그 수정 | `fix/streak-reset-timezone` |
| `refactor/` | 리팩토링 | `refactor/xp-service` |
| `docs/` | 문서 작업 | `docs/api-specification` |
| `chore/` | 설정/의존성 | `chore/upgrade-next-15` |
| `hotfix/` | 긴급 수정 | `hotfix/payment-callback` |

---

## 2. 커밋 메시지 규칙

### Conventional Commits 형식

```
<type>: <description>

[optional body]
```

### 커밋 타입

| 타입 | 용도 | 예시 |
|------|------|------|
| `feat` | 새 기능 | `feat: add treasure chest reward system` |
| `fix` | 버그 수정 | `fix: correct streak freeze consumption logic` |
| `docs` | 문서 | `docs: add API specification document` |
| `refactor` | 리팩토링 | `refactor: simplify XP grant logic` |
| `style` | 코드 스타일 | `style: format diary-editor component` |
| `chore` | 빌드/설정 | `chore: update drizzle-orm to 0.36` |
| `perf` | 성능 개선 | `perf: optimize vocabulary query with index` |
| `test` | 테스트 | `test: add XP calculation unit tests` |

### 커밋 메시지 예시

```bash
# 좋은 예
feat: add mood selector to diary editor
fix: prevent duplicate XP grant on page refresh
docs: add data model documentation
refactor: extract TTR validation to utility function

# 나쁜 예
update code
fix bug
WIP
```

### 커밋 가이드라인

1. **제목은 50자 이내**, 명령형 현재 시제 ("add" not "added")
2. **본문은 72자 줄바꿈**, 변경 이유를 설명
3. **한 커밋 = 하나의 논리적 변경**
4. **빌드 가능한 상태** 유지

---

## 3. Pull Request 워크플로우

### PR 생성 절차

1. 기능 브랜치에서 작업 완료
2. `main` 최신 상태로 리베이스 또는 머지
3. PR 생성 시 아래 템플릿 사용

### PR 템플릿

```markdown
## Summary

- 변경 사항 요약 (1-3줄)

## Changes

- [ ] 구체적인 변경 항목 1
- [ ] 구체적인 변경 항목 2

## Test Plan

- [ ] 테스트 항목 1
- [ ] 테스트 항목 2

## Screenshots (선택)

UI 변경 시 전후 스크린샷 첨부
```

### PR 체크리스트

- [ ] TypeScript 컴파일 오류 없음 (`npm run build`)
- [ ] ESLint 경고/오류 없음 (`npm run lint`)
- [ ] DB 마이그레이션 필요 시 생성 완료
- [ ] 환경 변수 추가 시 `.env.example` 업데이트

---

## 4. 일반적인 워크플로우

### 새 기능 개발

```bash
# 1. main에서 최신 소스 가져오기
git checkout main
git pull origin main

# 2. 기능 브랜치 생성
git checkout -b feature/new-feature

# 3. 작업 & 커밋
git add <files>
git commit -m "feat: add new feature"

# 4. 원격 브랜치 push
git push -u origin feature/new-feature

# 5. GitHub에서 PR 생성
```

### 버그 수정

```bash
git checkout main
git pull origin main
git checkout -b fix/bug-description

# 수정 & 커밋
git add <files>
git commit -m "fix: resolve bug description"
git push -u origin fix/bug-description
```

### DB 스키마 변경 포함 시

```bash
# 1. 스키마 수정 (db/schema.ts)
# 2. 마이그레이션 생성
npm run db:generate

# 3. 마이그레이션 파일과 함께 커밋
git add db/schema.ts drizzle/
git commit -m "feat: add new table for feature X"
```

---

## 5. .gitignore 주요 항목

```gitignore
# Dependencies
node_modules/

# Next.js
.next/
out/

# Environment
.env
.env.local
.env.*.local

# Logs
.dev.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
```

### 절대 커밋하지 않는 파일

- `.env.local` (API 키, DB 연결 문자열)
- `node_modules/`
- `.next/` (빌드 아티팩트)
- `.dev.log` (개발 로그)

---

## 6. 충돌 해결

### 리베이스 방식 (권장)

```bash
# main 최신 상태 가져오기
git fetch origin main

# 현재 브랜치에 리베이스
git rebase origin/main

# 충돌 해결 후
git add <resolved-files>
git rebase --continue
```

### 머지 방식

```bash
git fetch origin main
git merge origin/main

# 충돌 해결 후
git add <resolved-files>
git commit
```

---

## 7. 릴리스 관리

### 버전 관리

`package.json`의 `version` 필드를 기준으로 관리:

```json
{ "version": "0.1.0" }
```

### 배포 흐름

```
feature branch → PR → main → Vercel 자동 배포
```

Vercel이 `main` 브랜치의 push를 감지하여 자동으로 프로덕션 배포를 수행한다.
