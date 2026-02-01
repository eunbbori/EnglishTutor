ALTER TABLE "chats" ADD COLUMN "mood" text;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "word_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "challenge_word_used" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_usage" ADD COLUMN "bonus_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "diary_streaks" ADD COLUMN "previous_streak" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "diary_streaks" ADD COLUMN "streak_freeze_used_at" date;--> statement-breakpoint
ALTER TABLE "diary_streaks" ADD COLUMN "comeback_started_at" date;--> statement-breakpoint
ALTER TABLE "diary_streaks" ADD COLUMN "comeback_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_mistakes" ADD COLUMN "sub_type" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "xp_level" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "title" text DEFAULT 'Diary Beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "equipped_title" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "earned_titles" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "streak_freeze_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "xp_booster_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "chest_key_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "chats_user_created_idx" ON "chats" USING btree ("user_id","created_at");