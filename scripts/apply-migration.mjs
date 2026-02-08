/**
 * Manual migration script for daily_xp_tracking table
 * Run: node scripts/apply-migration.mjs
 */

import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";
import { neon } from "@neondatabase/serverless";

// Load environment variables (.env.local or .env)
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.error("   Please ensure .env or .env.local file exists with DATABASE_URL");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function applyMigration() {
  console.log("🚀 Applying migration: daily_xp_tracking table...");

  try {
    // Check if table already exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'daily_xp_tracking'
      );
    `;

    const exists = tableCheck[0]?.exists;

    if (exists) {
      console.log("⚠️  Table 'daily_xp_tracking' already exists. Skipping creation.");
      process.exit(0);
    }

    // Create table
    await sql`
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
    `;

    console.log("✅ Table 'daily_xp_tracking' created");

    // Add foreign key constraint
    await sql`
      ALTER TABLE "daily_xp_tracking"
      ADD CONSTRAINT "daily_xp_tracking_user_id_users_id_fk"
      FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
      ON DELETE cascade ON UPDATE no action;
    `;

    console.log("✅ Foreign key constraint added");

    // Create index
    await sql`
      CREATE INDEX "daily_xp_tracking_user_date_idx"
      ON "daily_xp_tracking"
      USING btree ("user_id","date");
    `;

    console.log("✅ Index created");
    console.log("🎉 Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

applyMigration();
