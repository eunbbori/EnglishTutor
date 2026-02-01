/**
 * Treasure Chest Reward Engine
 * v3.0: Variable reward system with probability-based selection
 */

import { db } from "@/db";
import { userProfiles, treasureChestLog, vocabulary } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { grantXp } from "./xp-service";

/**
 * Reward types
 */
export type RewardType = "xp_bonus" | "quote" | "rare_expression" | "streak_freeze" | "rare_title";

/**
 * Reward probabilities (must sum to 100)
 */
const REWARD_PROBABILITIES = {
  xp_bonus: 40,           // 40%
  quote: 25,              // 25%
  rare_expression: 20,    // 20%
  streak_freeze: 10,      // 10%
  rare_title: 5,          // 5%
};

/**
 * Rare titles pool
 */
const RARE_TITLES = [
  "Night Owl",          // 밤 올빼미
  "Weekend Warrior",    // 주말 전사
  "Morning Person",     // 아침형 인간
  "Consistency King",   // 꾸준함의 왕
  "Word Wizard",        // 단어 마법사
  "Grammar Guru",       // 문법 구루
  "Expression Expert",  // 표현 전문가
  "Diary Devotee",      // 일기 헌신자
];

/**
 * English quotes pool (famous quotes)
 */
const QUOTE_POOL = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    translation: "위대한 일을 하는 유일한 방법은 자신이 하는 일을 사랑하는 것이다.",
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    translation: "인생이란 당신이 다른 계획을 세우느라 바쁠 때 일어나는 것이다.",
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    translation: "미래는 자신의 꿈이 아름답다고 믿는 사람들의 것이다.",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    translation: "성공은 최종적이지 않고, 실패는 치명적이지 않다. 중요한 것은 계속할 용기다.",
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    translation: "할 수 있다고 믿으면 이미 절반은 이룬 것이다.",
  },
];

/**
 * Rare expressions pool (native speaker phrases)
 */
const EXPRESSION_POOL = [
  {
    word: "piece of cake",
    meaning: "아주 쉬운 일",
    example: "The exam was a piece of cake!",
    partOfSpeech: "idiom",
    difficulty: "intermediate",
  },
  {
    word: "break the ice",
    meaning: "어색한 분위기를 깨다",
    example: "He told a joke to break the ice.",
    partOfSpeech: "idiom",
    difficulty: "intermediate",
  },
  {
    word: "hit the nail on the head",
    meaning: "정곡을 찌르다",
    example: "You hit the nail on the head with that analysis.",
    partOfSpeech: "idiom",
    difficulty: "advanced",
  },
  {
    word: "under the weather",
    meaning: "몸이 좀 안 좋은",
    example: "I'm feeling a bit under the weather today.",
    partOfSpeech: "idiom",
    difficulty: "intermediate",
  },
  {
    word: "once in a blue moon",
    meaning: "아주 드물게",
    example: "I only see him once in a blue moon.",
    partOfSpeech: "idiom",
    difficulty: "advanced",
  },
];

/**
 * Reward result interface
 */
export interface RewardResult {
  type: RewardType;
  data: Record<string, unknown>;
  message: string;
}

/**
 * Select reward type based on probability
 */
function selectRewardType(hasFreezeRoom: boolean): RewardType {
  // If user has max Freeze (2), replace Freeze with XP
  const probabilities = hasFreezeRoom
    ? REWARD_PROBABILITIES
    : {
        ...REWARD_PROBABILITIES,
        xp_bonus: REWARD_PROBABILITIES.xp_bonus + REWARD_PROBABILITIES.streak_freeze,
        streak_freeze: 0,
      };

  const random = Math.random() * 100;
  let cumulative = 0;

  for (const [type, prob] of Object.entries(probabilities)) {
    cumulative += prob;
    if (random <= cumulative) {
      return type as RewardType;
    }
  }

  return "xp_bonus"; // Fallback
}

/**
 * Generate XP bonus reward (10-50 XP)
 */
function generateXpBonus(): RewardResult {
  const amount = Math.floor(Math.random() * 41) + 10; // 10-50
  return {
    type: "xp_bonus",
    data: { amount },
    message: `${amount} XP 보너스!`,
  };
}

/**
 * Generate quote reward
 */
function generateQuote(): RewardResult {
  const quote = QUOTE_POOL[Math.floor(Math.random() * QUOTE_POOL.length)];
  return {
    type: "quote",
    data: quote,
    message: "오늘의 명언",
  };
}

/**
 * Generate rare expression reward
 */
function generateRareExpression(): RewardResult {
  const expression = EXPRESSION_POOL[Math.floor(Math.random() * EXPRESSION_POOL.length)];
  return {
    type: "rare_expression",
    data: expression,
    message: "희귀 표현 카드",
  };
}

/**
 * Generate Streak Freeze reward
 */
function generateStreakFreeze(): RewardResult {
  return {
    type: "streak_freeze",
    data: { count: 1 },
    message: "Streak Freeze 획득!",
  };
}

/**
 * Generate rare title reward
 */
function generateRareTitle(currentTitles: string[]): RewardResult {
  // Select a title user doesn't have yet
  const availableTitles = RARE_TITLES.filter((t) => !currentTitles.includes(t));
  const title = availableTitles.length > 0
    ? availableTitles[Math.floor(Math.random() * availableTitles.length)]
    : RARE_TITLES[Math.floor(Math.random() * RARE_TITLES.length)];

  return {
    type: "rare_title",
    data: { title },
    message: "레어 칭호 획득!",
  };
}

/**
 * Decide reward and apply side effects
 */
export async function openTreasureChest(
  userId: string,
  source: "daily" | "key" = "daily"
): Promise<RewardResult> {
  try {
    // Get user profile
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      throw new Error("User profile not found");
    }

    const userProfile = profile[0];
    const currentFreezeCount = userProfile.streakFreezeCount;
    const hasFreezeRoom = currentFreezeCount < 2; // Max 2 Freeze
    const currentTitles = Array.isArray(userProfile.earnedTitles)
      ? (userProfile.earnedTitles as string[])
      : [];

    // Select reward type
    const rewardType = selectRewardType(hasFreezeRoom);

    // Generate reward
    let reward: RewardResult;
    switch (rewardType) {
      case "xp_bonus":
        reward = generateXpBonus();
        break;
      case "quote":
        reward = generateQuote();
        break;
      case "rare_expression":
        reward = generateRareExpression();
        break;
      case "streak_freeze":
        reward = generateStreakFreeze();
        break;
      case "rare_title":
        reward = generateRareTitle(currentTitles);
        break;
      default:
        reward = generateXpBonus();
    }

    // Apply side effects
    await applySideEffects(userId, reward, userProfile);

    // Log reward
    await db.insert(treasureChestLog).values({
      userId,
      rewardType: reward.type,
      rewardData: reward.data,
      source,
    });

    console.log(`[Treasure Chest] ✓ Opened for user ${userId}: ${reward.message} (${source})`);

    return reward;
  } catch (error) {
    console.error("[Treasure Chest] ✗ Error opening chest:", error);
    throw error;
  }
}

/**
 * Apply side effects based on reward type
 */
async function applySideEffects(
  userId: string,
  reward: RewardResult,
  userProfile: any
): Promise<void> {
  switch (reward.type) {
    case "xp_bonus":
      // Grant XP
      const amount = reward.data.amount as number;
      await grantXp(userId, "treasure_chest");
      break;

    case "streak_freeze":
      // Add Freeze to profile
      await db
        .update(userProfiles)
        .set({
          streakFreezeCount: userProfile.streakFreezeCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId));
      break;

    case "rare_title":
      // Add title to earned titles
      const title = reward.data.title as string;
      const currentTitles = Array.isArray(userProfile.earnedTitles)
        ? (userProfile.earnedTitles as string[])
        : [];

      if (!currentTitles.includes(title)) {
        await db
          .update(userProfiles)
          .set({
            earnedTitles: [...currentTitles, title],
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.userId, userId));
      }
      break;

    case "rare_expression":
      // Auto-add to vocabulary
      const expr = reward.data as any;
      await db.insert(vocabulary).values({
        userId,
        word: expr.word,
        meaning: expr.meaning,
        example: expr.example,
        partOfSpeech: expr.partOfSpeech,
        difficulty: expr.difficulty,
        sourceType: "manual",
        context: "보물상자에서 획득",
      });
      break;

    case "quote":
      // No side effect - just display
      break;
  }
}

/**
 * Check if user can open daily chest today
 */
export async function canOpenDailyChest(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogs = await db
    .select()
    .from(treasureChestLog)
    .where(
      and(
        eq(treasureChestLog.userId, userId),
        eq(treasureChestLog.source, "daily"),
        gte(treasureChestLog.createdAt, today)
      )
    )
    .limit(1);

  return todayLogs.length === 0;
}
