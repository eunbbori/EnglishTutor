CREATE TABLE "vocabulary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"word" text NOT NULL,
	"meaning" text,
	"example" text,
	"memo" text,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"source_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vocabulary" ADD CONSTRAINT "vocabulary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vocabulary_user_id_idx" ON "vocabulary" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vocabulary_created_at_idx" ON "vocabulary" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "vocabulary_user_created_idx" ON "vocabulary" USING btree ("user_id","created_at");