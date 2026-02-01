import { pgTable, text, timestamp, uuid, jsonb, integer, index, decimal, date, primaryKey, boolean } from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

// ==========================================
// NextAuth.js Tables
// ==========================================

// Users table for NextAuth
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Accounts table for NextAuth (OAuth providers)
export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

// Sessions table for NextAuth
export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Verification tokens for NextAuth (email verification)
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ==========================================
// Subscription & Usage Tables
// ==========================================

// Subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan", { enum: ["free", "premium"] }).notNull().default("free"),
  status: text("status", { enum: ["active", "cancelled", "expired"] }).notNull().default("active"),
  paymentKey: text("payment_key"), // 토스페이먼츠 결제 키
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
}));

// Daily usage table for freemium limits
export const dailyUsage = pgTable("daily_usage", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  count: integer("count").notNull().default(0),
  bonusCount: integer("bonus_count").notNull().default(0), // IAP 추가 교정권
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdDateIdx: index("daily_usage_user_date_idx").on(table.userId, table.date),
}));

// ==========================================
// Application Tables
// ==========================================

// 1. Chat Sessions
export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(), // Conversation summary
  mood: text("mood", { enum: ["happy", "neutral", "sad", "excited", "tired", "anxious"] }), // 일기 기분
  wordCount: integer("word_count").notNull().default(0), // 원문 단어 수
  challengeWordUsed: boolean("challenge_word_used").notNull().default(false), // 오늘의 단어 사용 여부
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdCreatedAtIdx: index("chats_user_created_idx").on(table.userId, table.createdAt),
}));

// 2. Chat Messages
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role", { enum: ["user", "assistant", "penpal"] }).notNull(), // penpal: AI Pen Pal 답장
  content: text("content").notNull(), // User: raw text | Assistant: JSON string | Penpal: plain text
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. User Profile (Fact Memory / Singleton)
// Stores recurring mistake patterns that persist across all conversations
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  learningGoal: text("learning_goal"), // User's learning objectives
  recurringMistakes: jsonb("recurring_mistakes").notNull().default('[]'), // Array of mistake patterns
  // Example: [{ pattern: "subject-verb agreement", examples: ["he go", "she have"], count: 5 }]
  learningPreferences: jsonb("learning_preferences").notNull().default('{}'), // User preferences (including explanation_style: detailed/concise)
  // v3.0 Gamification fields
  xp: integer("xp").notNull().default(0), // 누적 경험치
  xpLevel: integer("xp_level").notNull().default(1), // 현재 레벨 (1~30)
  title: text("title").notNull().default("Diary Beginner"), // 현재 칭호
  equippedTitle: text("equipped_title"), // 장착 중인 레어 칭호
  earnedTitles: jsonb("earned_titles").notNull().default('[]'), // 획득한 칭호 목록
  streakFreezeCount: integer("streak_freeze_count").notNull().default(0), // Streak Freeze 보유 수 (max 2)
  xpBoosterExpiresAt: timestamp("xp_booster_expires_at"), // XP 2배 부스터 만료 시각
  chestKeyCount: integer("chest_key_count").notNull().default(0), // 보물상자 열쇠 보유 수
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_profiles_user_id_idx").on(table.userId),
}));

// 4. User Mistakes
// Tracks individual mistake patterns with detailed analytics
export const userMistakes = pgTable("user_mistakes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  mistakeType: text("mistake_type", {
    enum: ["grammar", "vocabulary", "expression"] // v3.0: 3-category system
  }).notNull(), // Category of the mistake
  subType: text("sub_type"), // v3.0: 세부 유형 (tense, agreement, preposition, etc.)
  pattern: text("pattern").notNull(), // Specific mistake pattern (e.g., "subject-verb agreement")
  frequency: integer("frequency").notNull().default(1), // Number of times this mistake occurred
  examples: jsonb("examples").notNull().default('[]'), // Array of example sentences showing the mistake
  // Example: ["He go to school", "She have a car"]
  lastOccurredAt: timestamp("last_occurred_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_mistakes_user_id_idx").on(table.userId),
  mistakeTypeIdx: index("user_mistakes_type_idx").on(table.mistakeType),
  userIdPatternIdx: index("user_mistakes_user_pattern_idx").on(table.userId, table.pattern),
}));

// 6. Diary Streaks
// Tracks user writing streaks for the diary feature
export const diaryStreaks = pgTable("diary_streaks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastWrittenAt: date("last_written_at"), // Last diary entry date
  totalEntries: integer("total_entries").notNull().default(0),
  // v3.0 Streak Freeze & Comeback fields
  previousStreak: integer("previous_streak").notNull().default(0), // 리셋 전 스트릭 (Comeback 50% 복구용)
  streakFreezeUsedAt: date("streak_freeze_used_at"), // 마지막 Freeze 자동 소비일
  comebackStartedAt: date("comeback_started_at"), // 복귀 후 연속 작성 추적 시작일
  comebackDays: integer("comeback_days").notNull().default(0), // 복귀 후 연속 작성 일수
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("diary_streaks_user_id_idx").on(table.userId),
}));

// 7. Learning Statistics
// Daily/weekly aggregated learning metrics
export const learningStats = pgTable("learning_stats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(), // Statistics date
  mistakeRate: decimal("mistake_rate", { precision: 5, scale: 2 }), // Percentage of mistakes (0.00 - 100.00)
  mistakeBreakdown: jsonb("mistake_breakdown").notNull().default('{}'), // Breakdown by mistake type
  // Example: { "grammar": 5, "vocabulary": 3, "pronunciation": 2 }
  totalMessages: integer("total_messages").notNull().default(0), // Total messages sent on this date
  totalMistakes: integer("total_mistakes").notNull().default(0), // Total mistakes on this date
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("learning_stats_user_id_idx").on(table.userId),
  dateIdx: index("learning_stats_date_idx").on(table.date),
  userIdDateIdx: index("learning_stats_user_date_idx").on(table.userId, table.date),
}));

// 8. Vocabulary (Personal Word Bank)
// Stores user's saved words and phrases for review
export const vocabulary = pgTable("vocabulary", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  word: text("word").notNull(), // Saved word or phrase
  meaning: text("meaning"), // Optional meaning/translation
  example: text("example"), // Optional example sentence
  memo: text("memo"), // Optional user notes
  sourceType: text("source_type", { enum: ["diary", "chat", "manual"] }).notNull().default("manual"), // Where this word came from
  sourceId: uuid("source_id"), // Reference to chat/diary entry (nullable for manual entries)
  // AI-enriched fields
  pronunciation: text("pronunciation"), // IPA pronunciation (e.g., /ˈɡreɪtfəl/)
  partOfSpeech: text("part_of_speech"), // Part of speech (e.g., noun, verb, adjective)
  synonyms: text("synonyms").array(), // Array of synonyms (max 3)
  context: text("context"), // Original context from source text
  difficulty: text("difficulty", { enum: ["beginner", "intermediate", "advanced"] }), // Difficulty level
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("vocabulary_user_id_idx").on(table.userId),
  createdAtIdx: index("vocabulary_created_at_idx").on(table.createdAt),
  userIdCreatedAtIdx: index("vocabulary_user_created_idx").on(table.userId, table.createdAt),
}));

// ==========================================
// v3.0 Gamification Tables
// ==========================================

// 9. XP History
// Tracks all XP gain events for debugging, abuse detection, and analytics
export const xpHistory = pgTable("xp_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // XP gained (positive only)
  action: text("action", {
    enum: [
      "diary_submit",      // 30 XP
      "challenge_word",    // 15 XP
      "perfect_diary",     // 20 XP
      "expression_save",   // 5 XP
      "streak_7d",         // 100 XP
      "streak_30d",        // 500 XP
      "weekly_quest",      // 80-200 XP
      "weekly_bonus",      // 100 XP
      "monthly_challenge", // 1000 XP
      "welcome_back",      // 50 XP
      "comeback_kid",      // 100 XP
      "treasure_chest",    // 10-50 XP
    ]
  }).notNull(),
  boosterApplied: boolean("booster_applied").notNull().default(false), // XP 2x booster applied
  referenceId: uuid("reference_id"), // Related entity ID (chat_id, quest_id, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("xp_history_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("xp_history_user_created_idx").on(table.userId, table.createdAt),
  userIdActionIdx: index("xp_history_user_action_idx").on(table.userId, table.action),
}));

// 10. Treasure Chest Log
// Tracks treasure chest reward history
export const treasureChestLog = pgTable("treasure_chest_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rewardType: text("reward_type", {
    enum: ["xp_bonus", "quote", "rare_expression", "streak_freeze", "rare_title"]
  }).notNull(),
  rewardData: jsonb("reward_data").notNull().default('{}'), // Reward details (varies by type)
  source: text("source", { enum: ["daily", "key"] }).notNull().default("daily"), // Daily auto / IAP key
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("treasure_chest_log_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("treasure_chest_log_user_created_idx").on(table.userId, table.createdAt),
}));

// 11. Weekly Quests
// Defines 3 quests per week (generated every Monday at midnight KST)
export const weeklyQuests = pgTable("weekly_quests", {
  id: uuid("id").defaultRandom().primaryKey(),
  weekStart: date("week_start").notNull(), // Monday date of the week
  slot: integer("slot").notNull(), // 1, 2, or 3
  questType: text("quest_type", {
    enum: ["frequency", "challenge", "expression", "length", "perfect"]
  }).notNull(),
  description: text("description").notNull(), // Quest description
  targetCount: integer("target_count").notNull(), // Target completion count
  xpReward: integer("xp_reward").notNull(), // XP reward on completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  weekStartIdx: index("weekly_quests_week_start_idx").on(table.weekStart),
  weekStartSlotIdx: index("weekly_quests_week_slot_idx").on(table.weekStart, table.slot),
}));

// 12. User Quest Progress
// Tracks user progress on weekly quests
export const userQuestProgress = pgTable("user_quest_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questId: uuid("quest_id")
    .notNull()
    .references(() => weeklyQuests.id, { onDelete: "cascade" }),
  currentCount: integer("current_count").notNull().default(0), // Current progress
  completed: boolean("completed").notNull().default(false), // Completion status
  completedAt: timestamp("completed_at"), // Completion timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_quest_progress_user_id_idx").on(table.userId),
  userIdQuestIdIdx: index("user_quest_progress_user_quest_idx").on(table.userId, table.questId),
}));

// 13. Monthly Challenges
// Defines monthly challenge (created by admin on 1st of each month)
export const monthlyChallenges = pgTable("monthly_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  theme: text("theme").notNull(), // Challenge theme
  expressions: jsonb("expressions").notNull(), // 10 expressions array
  xpReward: integer("xp_reward").notNull().default(1000), // Completion reward
  badgeName: text("badge_name").notNull(), // Badge/title name on completion
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  yearMonthIdx: index("monthly_challenges_year_month_idx").on(table.year, table.month),
}));

// 14. User Challenge Progress
// Tracks user progress on monthly challenges
export const userChallengeProgress = pgTable("user_challenge_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id")
    .notNull()
    .references(() => monthlyChallenges.id, { onDelete: "cascade" }),
  usedExpressions: jsonb("used_expressions").notNull().default('[]'), // Array of used expressions
  completed: boolean("completed").notNull().default(false), // 10 expressions used
  completedAt: timestamp("completed_at"), // Completion timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_challenge_progress_user_id_idx").on(table.userId),
  userIdChallengeIdIdx: index("user_challenge_progress_user_challenge_idx").on(table.userId, table.challengeId),
}));

// 15. IAP Purchases
// Tracks in-app purchase transactions
export const iapPurchases = pgTable("iap_purchases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productType: text("product_type", {
    enum: ["extra_correction", "streak_freeze_1", "streak_freeze_3", "xp_booster", "chest_key_5"]
  }).notNull(),
  amount: integer("amount").notNull(), // Payment amount in KRW
  paymentKey: text("payment_key").notNull(), // Toss Payments payment key
  status: text("status", {
    enum: ["pending", "completed", "failed", "refunded"]
  }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("iap_purchases_user_id_idx").on(table.userId),
  userIdCreatedAtIdx: index("iap_purchases_user_created_idx").on(table.userId, table.createdAt),
}));
