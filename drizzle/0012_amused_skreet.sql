CREATE TABLE "daily_xp_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"diary_count" integer DEFAULT 0 NOT NULL,
	"vocab_count" integer DEFAULT 0 NOT NULL,
	"weakness_overcome_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_xp_tracking" ADD CONSTRAINT "daily_xp_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_xp_tracking_user_date_idx" ON "daily_xp_tracking" USING btree ("user_id","date");