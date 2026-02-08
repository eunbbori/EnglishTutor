/**
 * XP Constants & Level Calculation
 * v3.1.1: Balanced XP system with daily caps, TTR validation, and anti-gaming measures
 */

/**
 * Daily XP Caps
 * Prevents XP inflation from unlimited submissions
 */
export const DAILY_CAPS = {
  diary_submit: 3,        // 일기 제출 (하루 3회까지 XP 지급)
  expression_save: 5,     // 표현노트 저장 (하루 5회까지 XP 지급)
  weakness_overcome: 1,   // 약점 극복 (하루 1회)
} as const;

/**
 * TTR (Type-Token Ratio) Threshold
 * Minimum TTR required for volume-based rewards
 * TTR = unique words / total words
 */
export const MIN_TTR_FOR_VOLUME_BONUS = 0.4;

/**
 * Duplicate word threshold for client-side validation
 * Reject text if duplicate word ratio exceeds this value
 */
export const MAX_DUPLICATE_WORD_RATIO = 0.5; // 50% (tightened from 70%)

/**
 * XP Reward Table
 * Defines XP amounts for various user actions
 */
export const XP_REWARDS = {
  // Core diary actions
  diary_submit: 30,           // 일기 제출 (하루 3회 상한)
  weakness_overcome: 20,      // 약점 극복 (최근 TOP 1 오답 패턴 미발생, 하루 1회)

  // Volume-based rewards (requires TTR ≥ 0.4)
  // v3.1.1: Simplified to 50/100 word tiers (Issue #133)
  length_50: 10,              // 50단어 이상 (TTR ≥ 0.4)
  length_100: 20,             // 100단어 이상 (TTR ≥ 0.4)

  // Expression notebook
  expression_save: 5,         // 표현노트 저장 (하루 5회 상한)

  // Streak milestones (7 tiers)
  streak_7d: 100,             // 연속 7일 달성
  streak_14d: 200,            // 연속 14일 달성
  streak_30d: 500,            // 연속 30일 달성
  streak_60d: 1000,           // 연속 60일 달성
  streak_100d: 1500,          // 연속 100일 달성
  streak_180d: 3000,          // 연속 180일 달성
  streak_365d: 5000,          // 연속 365일 달성

  // Monthly challenge (stepped rewards)
  monthly_challenge_15: 200,  // 월 15회 작성
  monthly_challenge_20: 400,  // 월 20회 작성
  monthly_challenge_25: 600,  // 월 25회 작성

  // Quest rewards (Pro only)
  weekly_quest: 80,           // 주간 퀘스트 (80-200 XP range)
  weekly_bonus: 100,          // 주간 보너스 (2/3 완료)
  treasure_chest: 25,         // 보물상자 (10-50 XP range)

  // Comeback bonuses
  welcome_back: 50,           // 3일+ 미접속 후 복귀 (이전 스트릭 ≥3일 조건)
  comeback_kid: 100,          // 리셋 후 3일 연속
} as const;

export type XpAction = keyof typeof XP_REWARDS;

/**
 * Level Tiers & Titles
 * 30 levels divided into 6 tiers
 */
export interface LevelTier {
  minLevel: number;
  maxLevel: number;
  title: string;
  minXp: number;
  maxXp: number;
  isPremium: boolean;
}

export const LEVEL_TIERS: LevelTier[] = [
  {
    minLevel: 1,
    maxLevel: 5,
    title: "Diary Beginner",
    minXp: 0,
    maxXp: 300,
    isPremium: false,
  },
  {
    minLevel: 6,
    maxLevel: 10,
    title: "Daily Writer",
    minXp: 300,
    maxXp: 1000,
    isPremium: false,
  },
  {
    minLevel: 11,
    maxLevel: 15,
    title: "Story Teller",
    minXp: 1000,
    maxXp: 2500,
    isPremium: true,
  },
  {
    minLevel: 16,
    maxLevel: 20,
    title: "Word Crafter",
    minXp: 2500,
    maxXp: 5000,
    isPremium: true,
  },
  {
    minLevel: 21,
    maxLevel: 25,
    title: "English Native",
    minXp: 5000,
    maxXp: 10000,
    isPremium: true,
  },
  {
    minLevel: 26,
    maxLevel: 30,
    title: "Master Author",
    minXp: 10000,
    maxXp: Infinity,
    isPremium: true,
  },
];

/**
 * Level Thresholds (XP required to reach each level)
 * Formula: floor(80 × N^1.7)
 * Balanced progression curve for 7.2 months to Lv.30 (premium)
 */
export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 259,
  3: 515,
  4: 844,
  5: 1234,
  6: 1689,
  7: 2206,
  8: 2787,
  9: 3433,
  10: 4009,     // Free tier cap
  11: 4619,
  12: 5260,
  13: 5930,
  14: 6627,
  15: 7351,
  16: 8100,
  17: 8873,
  18: 9669,
  19: 10488,
  20: 11328,
  21: 12189,
  22: 13070,
  23: 13970,
  24: 14889,
  25: 15826,
  26: 16781,
  27: 17753,
  28: 18741,
  29: 19746,
  30: 20766,
};

/**
 * Free tier level cap
 */
export const FREE_LEVEL_CAP = 10;

/**
 * Maximum level
 */
export const MAX_LEVEL = 30;

/**
 * Calculate level from total XP
 * @param xp - Total accumulated XP
 * @param isPremium - Whether user is premium (affects level cap)
 * @returns Current level (1-30)
 */
export function calculateLevel(xp: number, isPremium: boolean): number {
  let level = 1;

  for (let lv = MAX_LEVEL; lv >= 1; lv--) {
    if (xp >= LEVEL_THRESHOLDS[lv]) {
      level = lv;
      break;
    }
  }

  // Apply free tier cap
  if (!isPremium && level > FREE_LEVEL_CAP) {
    return FREE_LEVEL_CAP;
  }

  return level;
}

/**
 * Calculate potential level (without free tier cap)
 * Used to show free users what level they'd be at with premium
 * @param xp - Total accumulated XP
 * @returns Potential level (1-30) without cap
 */
export function calculatePotentialLevel(xp: number): number {
  let level = 1;

  for (let lv = MAX_LEVEL; lv >= 1; lv--) {
    if (xp >= LEVEL_THRESHOLDS[lv]) {
      level = lv;
      break;
    }
  }

  return level;
}

/**
 * Get XP required for next level
 * @param currentLevel - Current level
 * @returns XP needed to reach next level, or 0 if at max level
 */
export function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) {
    return 0;
  }
  return LEVEL_THRESHOLDS[currentLevel + 1];
}

/**
 * Get XP progress to next level
 * @param currentXp - Current total XP
 * @param currentLevel - Current level
 * @returns Object with current, required, and percentage
 */
export function getXpProgress(currentXp: number, currentLevel: number) {
  const currentLevelXp = LEVEL_THRESHOLDS[currentLevel];
  const nextLevelXp = getXpForNextLevel(currentLevel);

  if (nextLevelXp === 0) {
    // Max level reached
    return {
      current: currentXp - currentLevelXp,
      required: 0,
      percentage: 100,
    };
  }

  const xpInCurrentLevel = currentXp - currentLevelXp;
  const xpNeededForLevel = nextLevelXp - currentLevelXp;
  const percentage = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForLevel) * 100));

  return {
    current: xpInCurrentLevel,
    required: xpNeededForLevel,
    percentage,
  };
}

/**
 * Get title for a given level
 * @param level - Level (1-30)
 * @returns Title string
 */
export function getTitleForLevel(level: number): string {
  const tier = LEVEL_TIERS.find(
    (t) => level >= t.minLevel && level <= t.maxLevel
  );
  return tier?.title || "Diary Beginner";
}

/**
 * Check if a level-up occurred
 * @param oldXp - Previous total XP
 * @param newXp - New total XP
 * @param isPremium - Whether user is premium
 * @returns Level-up info if occurred, null otherwise
 */
export function checkLevelUp(
  oldXp: number,
  newXp: number,
  isPremium: boolean
): { oldLevel: number; newLevel: number; newTitle: string } | null {
  const oldLevel = calculateLevel(oldXp, isPremium);
  const newLevel = calculateLevel(newXp, isPremium);

  if (newLevel > oldLevel) {
    return {
      oldLevel,
      newLevel,
      newTitle: getTitleForLevel(newLevel),
    };
  }

  return null;
}

/**
 * Get explanation style based on level
 * @param level - User's current level
 * @returns Explanation style (detailed/concise)
 */
export function getExplanationStyleForLevel(level: number): 'detailed' | 'concise' {
  if (level <= 10) {
    return 'detailed'; // Lv.1-10: Beginner
  } else if (level <= 20) {
    return 'concise'; // Lv.11-20: Intermediate (적당히 concise)
  } else {
    return 'concise'; // Lv.21+: Advanced
  }
}
