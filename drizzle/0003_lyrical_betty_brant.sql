CREATE TABLE "learning_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"mistake_rate" numeric(5, 2),
	"mistake_breakdown" jsonb DEFAULT '{}' NOT NULL,
	"total_messages" integer DEFAULT 0 NOT NULL,
	"total_mistakes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mistakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"mistake_type" text NOT NULL,
	"pattern" text NOT NULL,
	"frequency" integer DEFAULT 1 NOT NULL,
	"examples" jsonb DEFAULT '[]' NOT NULL,
	"last_occurred_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "level" text DEFAULT 'beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "learning_goal" text;--> statement-breakpoint
CREATE INDEX "learning_stats_user_id_idx" ON "learning_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "learning_stats_date_idx" ON "learning_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "learning_stats_user_date_idx" ON "learning_stats" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "user_mistakes_user_id_idx" ON "user_mistakes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_mistakes_type_idx" ON "user_mistakes" USING btree ("mistake_type");--> statement-breakpoint
CREATE INDEX "user_mistakes_user_pattern_idx" ON "user_mistakes" USING btree ("user_id","pattern");--> statement-breakpoint
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles" USING btree ("user_id");