# Product Specification: AI English Tutor (영어 회화 교정 봇)

## 1. Project Overview
- **Project Name**: AI English Tutor (가칭)
- **Goal**: 사용자가 입력한 문장(한국어 또는 어색한 영어)을 **자연스러운 원어민 영어 표현**으로 교정하고, 문법적/문화적 설명을 제공하는 학습 도구.
- **Target Audience**: 비즈니스 영어 작성이나 자연스러운 회화를 원하는 학습자.
- **Value Proposition**: 단순 번역기(Papago/DeepL)와 달리, **"왜 이 표현이 더 나은지"** 이유를 설명해주고 대안 표현을 제시함.

## 2. Core Features (MVP)
### A. Correction Chat Interface (핵심 기능)
- 사용자가 텍스트를 입력하면 AI가 3가지 요소를 포함한 응답을 제공한다:
  1.  **Corrected Sentence**: 가장 자연스러운 원어민 표현.
  2.  **Explanation**: 왜 틀렸는지, 또는 왜 이 표현이 더 자연스러운지에 대한 한글 설명.
  3.  **Alternative**: 격식(Formal) 있거나, 캐주얼(Casual)한 다른 표현 제안.
- **UI Interaction**:
  - 교정된 문장은 눈에 띄게 강조 (Shadcn Card/Alert 컴포넌트 활용).
  - '복사하기' 버튼 제공.

### B. Conversation History
- 과거 학습 내역을 사이드바에서 날짜별/주제별로 확인.
- Neon DB에 `Chat`과 `Message`를 저장.

### C. Voice/TTS (Optional for MVP)
- Web Speech API를 사용하여 교정된 문장을 읽어주는 기능 (듣기 연습).

## 3. AI Logic & Prompt Engineering
- **Model**: `google/gemini-1.5-flash` (속도와 가성비 최적화)
- **Technology**: Vercel AI SDK Core의 `streamObject` 또는 `generateObject` 사용 권장.
  - *이유: 응답을 단순 텍스트가 아닌 JSON 구조로 받아 UI를 예쁘게 그리기 위함.*
- **System Persona**:
  - "너는 미국 실리콘밸리에서 10년 일한 친절한 영어 튜터다."
  - "한국어 입력이 들어오면 영어로 번역하되, 뉘앙스를 살려라."
  - "영어 입력이 들어오면 문법 오류를 고치고 더 자연스러운 표현(Idiom)을 추천해라."

## 4. Data Model (Conceptual)
### User
- `id`, `email`, `created_at`

### Chat (Session)
- `id`, `user_id`, `title` (첫 문장 요약), `created_at`

### Message (Content)
- `id`, `chat_id`, `role` ('user', 'assistant')
- `content` (Original Text)
- `correction_data` (JSON Type)
  - `original`: string
  - `corrected`: string
  - `explanation`: string
  - `alternatives`: string[]

## 5. UI/UX Guidelines
- **Layout**: Mobile-first Responsive Design.
- **Styling**:
  - **User Message**: 오른쪽 정렬, 기본 말풍선.
  - **AI Response**: 왼쪽 정렬, **카드 형태(Card View)**.
    - 상단: 교정된 영어 문장 (큰 폰트, 강조 색상).
    - 중단: 한글 설명 (작은 폰트, 회색조).
    - 하단: 다른 표현 추천 (Badge 혹은 리스트 형태).
- **Color Palette**: 신뢰감을 주는 블루/그린 계열의 액센트 컬러 사용.

## 6. Development Milestones
1.  **Setup**: Next.js + AI SDK + DB 세팅.
2.  **Basic Chat**: 텍스트 주고받기 구현.
3.  **Structured AI**: `streamObject`를 적용하여 JSON 응답 파싱 및 UI 렌더링.
4.  **Persistence**: DB 연동하여 대화 내용 저장.
5.  **Polish**: UI 디자인 다듬기 및 에러 처리.