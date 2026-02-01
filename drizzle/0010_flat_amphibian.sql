CREATE TABLE "iap_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_type" text NOT NULL,
	"amount" integer NOT NULL,
	"payment_key" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"theme" text NOT NULL,
	"expressions" jsonb NOT NULL,
	"xp_reward" integer DEFAULT 1000 NOT NULL,
	"badge_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treasure_chest_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"reward_type" text NOT NULL,
	"reward_data" jsonb DEFAULT '{}' NOT NULL,
	"source" text DEFAULT 'daily' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_challenge_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"challenge_id" uuid NOT NULL,
	"used_expressions" jsonb DEFAULT '[]' NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_quest_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"quest_id" uuid NOT NULL,
	"current_count" integer DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_quests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_start" date NOT NULL,
	"slot" integer NOT NULL,
	"quest_type" text NOT NULL,
	"description" text NOT NULL,
	"target_count" integer NOT NULL,
	"xp_reward" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"amount" integer NOT NULL,
	"action" text NOT NULL,
	"booster_applied" boolean DEFAULT false NOT NULL,
	"reference_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iap_purchases" ADD CONSTRAINT "iap_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasure_chest_log" ADD CONSTRAINT "treasure_chest_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenge_progress" ADD CONSTRAINT "user_challenge_progress_challenge_id_monthly_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."monthly_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quest_progress" ADD CONSTRAINT "user_quest_progress_quest_id_weekly_quests_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."weekly_quests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_history" ADD CONSTRAINT "xp_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "iap_purchases_user_id_idx" ON "iap_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "iap_purchases_user_created_idx" ON "iap_purchases" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "monthly_challenges_year_month_idx" ON "monthly_challenges" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "treasure_chest_log_user_id_idx" ON "treasure_chest_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "treasure_chest_log_user_created_idx" ON "treasure_chest_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "user_challenge_progress_user_id_idx" ON "user_challenge_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_challenge_progress_user_challenge_idx" ON "user_challenge_progress" USING btree ("user_id","challenge_id");--> statement-breakpoint
CREATE INDEX "user_quest_progress_user_id_idx" ON "user_quest_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_quest_progress_user_quest_idx" ON "user_quest_progress" USING btree ("user_id","quest_id");--> statement-breakpoint
CREATE INDEX "weekly_quests_week_start_idx" ON "weekly_quests" USING btree ("week_start");--> statement-breakpoint
CREATE INDEX "weekly_quests_week_slot_idx" ON "weekly_quests" USING btree ("week_start","slot");--> statement-breakpoint
CREATE INDEX "xp_history_user_id_idx" ON "xp_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "xp_history_user_created_idx" ON "xp_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "xp_history_user_action_idx" ON "xp_history" USING btree ("user_id","action");