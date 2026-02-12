# Memory Management Architecture

## Overview
AI English Tutor는 LangGraph 기반의 3-tier 메모리 관리 시스템을 사용하여 사용자의 학습 패턴을 추적하고 대화를 효율적으로 관리합니다.

## Memory Architecture

### 1. Event-based Memory (Checkpointer)
**목적**: 대화의 스냅샷을 저장하여 세션 복구 및 히스토리 추적

**구현**: `lib/ai/checkpointer.ts`
- `NeonCheckpointer` 클래스가 LangGraph의 `BaseCheckpointSaver`를 확장
- Neon Postgres의 `checkpoints` 테이블에 대화 상태 저장
- Thread ID로 대화를 구분하고 각 상태 변경마다 스냅샷 생성

**데이터베이스 스키마**:
```sql
checkpoints:
  - id: UUID
  - chatId: UUID (foreign key)
  - threadId: TEXT (LangGraph thread identifier)
  - checkpointId: TEXT (LangGraph checkpoint identifier)
  - state: JSONB (전체 대화 상태)
  - metadata: JSONB
  - messageCount: INTEGER
  - createdAt: TIMESTAMP
```

**사용 예시**:
```typescript
const checkpointer = new NeonCheckpointer(chatId);
const graph = workflow.compile({ checkpointer });
```

### 2. Fact Memory (User Profile - Singleton)
**목적**: 사용자의 반복되는 실수 패턴을 모든 대화에서 참조

**구현**: `lib/ai/user-profile.ts`
- `UserProfileManager` 클래스로 사용자별 프로필 관리
- 실수 패턴을 자동으로 감지하고 카운팅
- LLM에게 컨텍스트로 제공하여 개인화된 피드백 가능

**데이터베이스 스키마**:
```sql
user_profiles:
  - id: UUID
  - userId: TEXT (unique)
  - recurringMistakes: JSONB
    예시: [
      {
        pattern: "subject-verb agreement",
        examples: ["he go", "she have"],
        count: 5,
        lastSeen: "2024-01-15T10:30:00Z"
      }
    ]
  - learningPreferences: JSONB
  - createdAt, updatedAt: TIMESTAMP
```

**주요 메서드**:
- `getProfile()`: 사용자 프로필 조회 또는 생성
- `addRecurringMistake(pattern, example)`: 반복 실수 추가/업데이트
- `getRecurringMistakesSummary()`: LLM 컨텍스트용 요약 생성

### 3. Conversation Summarization (Compact)
**목적**: 5개 이상의 대화가 쌓이면 이전 대화를 LLM으로 요약하여 메모리 절약

**구현**: `lib/ai/summarizer.ts`
- `ConversationSummarizer` 클래스로 자동 요약
- 메시지 수가 임계값(기본 5개)을 초과하면 트리거
- Tool results 등 불필요한 데이터 제거
- 최근 3개 메시지는 원본 유지

**주요 메서드**:
- `shouldSummarize(messageCount)`: 요약 필요 여부 판단
- `summarizeMessages(messages)`: LLM으로 메시지 요약 생성
- `compactMessages(allMessages, keepRecentCount)`: 오래된 메시지 요약 + 최근 메시지 유지
- `cleanMessages(messages)`: Tool results 제거

**데이터베이스**:
- `chats.summary` 필드에 요약 저장
- 요약은 LLM에게 컨텍스트로 제공됨

## LangGraph Architecture

### State Definition
```typescript
ConversationState = {
  messages: BaseMessage[],        // 대화 메시지
  summary: string,                 // LLM 생성 요약
  userProfile: RecurringMistake[], // 사용자 실수 패턴
  messageCount: number,            // 메시지 카운트
  chatId: string,                  // 채팅 세션 ID
  userId: string,                  // 사용자 ID
  correctionResult: any,           // AI 교정 결과
}
```

### Graph Flow
```
[Entry]
   ↓
[generate_response]
   ↓
[update_memory] (비동기)
   ↓
[END]
```

#### Node 1: generate_response
1. 사용자 프로필에서 반복 실수 패턴 로드
2. 기존 요약이 있으면 컨텍스트에 추가
3. 최근 메시지와 함께 LLM 호출
4. JSON 형식의 교정 결과 반환

#### Node 2: update_memory (Async)
사용자 응답과 별개로 비동기 처리:
1. **User Profile Update**: 교정 결과에서 반복 실수 패턴 감지 시 DB 업데이트
2. **Summarization**: 메시지 수가 5개 초과 시:
   - 오래된 메시지들을 LLM으로 요약
   - `chats.summary` 업데이트
   - 최근 3개 메시지는 원본 유지

## API Route Integration

### 새로운 플로우 (`app/api/chat/route.ts`)
```typescript
1. Request 받기 (messages, chatId)
2. Chat session 생성/조회
3. DB에서 기존 메시지 로드
4. LangChain Message 형식으로 변환
5. 기존 summary 로드
6. LangGraph 초기화 (with Checkpointer)
7. Graph invoke (비동기 memory update 포함)
8. 교정 결과 반환
9. DB에 메시지 저장
```

### Key Features
- **Checkpointer**: 매 상태 변경마다 스냅샷 저장
- **User Profile**: 실수 패턴 자동 추적 및 LLM 컨텍스트 제공
- **Auto Summarization**: 5개 초과 시 자동 요약
- **Async Memory Updates**: 사용자 응답 속도에 영향 없음

## Configuration

### 환경 변수
```bash
DATABASE_URL=          # Neon Postgres connection string
GOOGLE_GENERATIVE_AI_API_KEY=  # Gemini API key
```

### 커스터마이징 가능한 파라미터
- `messageThreshold` (summarizer): 요약 트리거 임계값 (기본 5)
- `keepRecentCount` (summarizer): 유지할 최근 메시지 수 (기본 3)
- `temperature` (graph): LLM 온도 설정 (기본 0.7)

## Benefits

1. **메모리 효율성**:
   - 오래된 메시지는 요약으로 압축
   - Tool results 등 불필요한 데이터 제거
   - 토큰 사용량 최적화

2. **개인화된 학습**:
   - 사용자별 반복 실수 패턴 추적
   - 모든 대화에서 일관된 피드백
   - 학습 진도 시각화 가능

3. **세션 복구**:
   - Checkpointer를 통한 완전한 상태 복원
   - 서버 재시작 후에도 대화 컨텍스트 유지

4. **비동기 처리**:
   - 메모리 업데이트가 응답 속도에 영향 없음
   - 백그라운드에서 프로필 업데이트 및 요약 생성

## Migration from Old System

기존 `lib/ai/memory.ts`는 단순한 요약 시스템이었습니다.
새 시스템은:
- ✅ LangGraph 기반 상태 관리
- ✅ Checkpointer로 스냅샷 저장
- ✅ User Profile 추적
- ✅ 비동기 메모리 업데이트
- ✅ 더 정교한 요약 로직

기존 파일은 레거시로 보관하거나 삭제할 수 있습니다.

## Testing

### 로컬 테스트
```bash
npm run dev:log  # .dev.log에 로그 기록
```

### 확인 사항
1. 메시지 5개 이후 `chats.summary` 업데이트 확인
2. `user_profiles.recurringMistakes`에 패턴 저장 확인
3. `checkpoints` 테이블에 스냅샷 저장 확인
4. 응답 속도가 메모리 업데이트에 영향받지 않는지 확인

## Future Enhancements

- [ ] 사용자별 학습 통계 대시보드
- [ ] 실수 패턴 시각화
- [ ] 요약 품질 개선 (더 나은 프롬프트)
- [ ] Multi-user support with authentication
- [ ] Checkpoint 기반 대화 롤백 기능
