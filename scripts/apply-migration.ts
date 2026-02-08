/**
 * Manual migration script for daily_xp_tracking table
 * Run: npx tsx scripts/apply-migration.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "@/db";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("🚀 Applying migration: daily_xp_tracking table...");

  try {
    // Check if table already exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'daily_xp_tracking'
      );
    `);

    const exists = (tableCheck.rows[0] as any)?.exists;

    if (exists) {
      console.log("⚠️  Table 'daily_xp_tracking' already exists. Skipping creation.");
      return;
    }

    // Create table
    await db.execute(sql`
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
    `);

    console.log("✅ Table 'daily_xp_tracking' created");

    // Add foreign key constraint
    await db.execute(sql`
      ALTER TABLE "daily_xp_tracking"
      ADD CONSTRAINT "daily_xp_tracking_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
    `);

    console.log("✅ Foreign key constraint added");

    // Create index
    await db.execute(sql`
      CREATE INDEX "daily_xp_tracking_user_date_idx"
      ON "daily_xp_tracking"
      USING btree ("user_id","date");
    `);

    console.log("✅ Index created");
    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
