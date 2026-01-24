/**
 * Daily Mission & Word of the Day
 * 매일 자정에 갱신되는 미션과 단어 목록
 */

export interface WordOfTheDay {
  word: string;
  meaning: string;
  example: string;
}

export const WORDS_OF_THE_DAY: WordOfTheDay[] = [
  {
    word: "grateful",
    meaning: "감사하는",
    example: "I'm grateful for the support from my friends.",
  },
  {
    word: "accomplish",
    meaning: "성취하다",
    example: "I want to accomplish my goals this year.",
  },
  {
    word: "exhausted",
    meaning: "지친",
    example: "I felt exhausted after a long day at work.",
  },
  {
    word: "inspired",
    meaning: "영감을 받은",
    example: "I was inspired by the movie I watched yesterday.",
  },
  {
    word: "comfortable",
    meaning: "편안한",
    example: "I feel comfortable when I'm at home.",
  },
  {
    word: "challenging",
    meaning: "도전적인",
    example: "This project is challenging but rewarding.",
  },
  {
    word: "delicious",
    meaning: "맛있는",
    example: "The pasta I had for lunch was delicious.",
  },
  {
    word: "nervous",
    meaning: "긴장한",
    example: "I was nervous before the presentation.",
  },
  {
    word: "excited",
    meaning: "신나는, 흥분한",
    example: "I'm excited about the upcoming trip.",
  },
  {
    word: "peaceful",
    meaning: "평화로운",
    example: "The garden feels so peaceful in the morning.",
  },
  {
    word: "fascinating",
    meaning: "매혹적인",
    example: "The documentary was absolutely fascinating.",
  },
  {
    word: "confident",
    meaning: "자신감 있는",
    example: "I feel more confident after practicing.",
  },
  {
    word: "appreciate",
    meaning: "감사하다, 고마워하다",
    example: "I appreciate your help with this task.",
  },
  {
    word: "wonderful",
    meaning: "멋진, 훌륭한",
    example: "We had a wonderful time at the party.",
  },
  {
    word: "anxious",
    meaning: "걱정스러운",
    example: "I felt anxious about the exam results.",
  },
  {
    word: "memorable",
    meaning: "기억에 남는",
    example: "It was a memorable experience for everyone.",
  },
  {
    word: "productive",
    meaning: "생산적인",
    example: "Today was a very productive day at work.",
  },
  {
    word: "refreshing",
    meaning: "상쾌한",
    example: "The morning walk was so refreshing.",
  },
  {
    word: "overcome",
    meaning: "극복하다",
    example: "I managed to overcome my fear of public speaking.",
  },
  {
    word: "determined",
    meaning: "결심한, 단호한",
    example: "She is determined to finish the marathon.",
  },
];

/**
 * Get today's word based on date
 */
export function getTodayWord(): WordOfTheDay {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return WORDS_OF_THE_DAY[dayOfYear % WORDS_OF_THE_DAY.length];
}

/**
 * Check if text contains the target word (case-insensitive)
 */
export function checkWordUsage(text: string, targetWord: string): boolean {
  const regex = new RegExp(`\\b${targetWord}\\b`, "gi");
  return regex.test(text);
}
