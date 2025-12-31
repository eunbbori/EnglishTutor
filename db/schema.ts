import { pgTable, text, timestamp, uuid, jsonb, integer, index, decimal, date } from "drizzle-orm/pg-core";

// 1. Chat Sessions
export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(), // MVP: simple string ID (or generic 'user')
  title: text("title").notNull(), // Conversation summary
  summary: text("summary"), // LLM-generated summary of old conversations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 2. Chat Messages
export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(), // User: raw text | Assistant: JSON string
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. User Profile (Fact Memory / Singleton)
// Stores recurring mistake patterns that persist across all conversations
export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  level: text("level", { enum: ["detailed", "concise"] }).notNull().default("detailed"), // Explanation style preference
  learningGoal: text("learning_goal"), // User's learning objectives
  recurringMistakes: jsonb("recurring_mistakes").notNull().default('[]'), // Array of mistake patterns
  // Example: [{ pattern: "subject-verb agreement", examples: ["he go", "she have"], count: 5 }]
  learningPreferences: jsonb("learning_preferences").notNull().default('{}'), // User preferences
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_profiles_user_id_idx").on(table.userId),
}));

// 4. Checkpoints (Event-based Memory)
// Stores conversation state snapshots for LangGraph
export const checkpoints = pgTable("checkpoints", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  threadId: text("thread_id").notNull(), // LangGraph thread identifier
  checkpointId: text("checkpoint_id").notNull(), // LangGraph checkpoint identifier
  state: jsonb("state").notNull(), // Full conversation state
  metadata: jsonb("metadata").notNull().default('{}'), // Additional metadata
  messageCount: integer("message_count").notNull().default(0), // Track number of messages
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. User Mistakes
// Tracks individual mistake patterns with detailed analytics
export const userMistakes = pgTable("user_mistakes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  mistakeType: text("mistake_type", {
    enum: ["grammar", "vocabulary", "pronunciation", "fluency", "comprehension"]
  }).notNull(), // Category of the mistake
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

// 6. Learning Statistics
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
