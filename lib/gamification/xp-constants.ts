/**
 * XP Constants & Level Calculation
 * v3.0: XP system with 30 levels, log-curve progression
 */

/**
 * XP Reward Table
 * Defines XP amounts for various user actions
 */
export const XP_REWARDS = {
  // Core diary actions
  diary_submit: 30,           // 일기 제출
  challenge_word: 15,          // 챌린지 단어 사용
  perfect_diary: 20,           // 오답 0개 (완벽한 일기)

  // Expression notebook
  expression_save: 5,          // 표현노트 저장

  // Streak milestones
  streak_7d: 100,              // 연속 7일 달성
  streak_30d: 500,             // 연속 30일 달성

  // Quest rewards (Pro only)
  weekly_quest: 80,            // 주간 퀘스트 (80-200 XP range)
  monthly_challenge: 1000,     // 월간 챌린지
  weekly_bonus: 100,           // 주간 보너스 (2/3 완료)
  treasure_chest: 25,          // 보물상자 (10-50 XP range)

  // Comeback bonuses
  welcome_back: 50,            // 3일+ 미접속 후 복귀
  comeback_kid: 100,           // 리셋 후 3일 연속
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
 * Log-curve: fast early levels → gradual late levels
 */
export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 60,
  3: 120,
  4: 200,
  5: 300,
  6: 420,
  7: 560,
  8: 720,
  9: 900,
  10: 1000,
  11: 1200,
  12: 1450,
  13: 1750,
  14: 2100,
  15: 2500,
  16: 2900,
  17: 3400,
  18: 3950,
  19: 4550,
  20: 5000,
  21: 5600,
  22: 6300,
  23: 7100,
  24: 8000,
  25: 10000,
  26: 12000,
  27: 14500,
  28: 17500,
  29: 21000,
  30: 25000,
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
