/**
 * Manual migration script to update level enum from 3 values to 2 values
 * Run with: npx tsx scripts/migrate-level.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env.local');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Starting level enum migration...\n');

  const sql = neon(DATABASE_URL);

  try {
    // Execute migration steps individually
    console.log('⏳ Step 1: Migrating beginner/intermediate → detailed...');
    await sql`
      UPDATE "user_profiles"
      SET "level" = 'detailed'
      WHERE "level" IN ('beginner', 'intermediate')
    `;
    console.log('✅ Step 1 completed\n');

    console.log('⏳ Step 2: Migrating advanced → concise...');
    await sql`
      UPDATE "user_profiles"
      SET "level" = 'concise'
      WHERE "level" = 'advanced'
    `;
    console.log('✅ Step 2 completed\n');

    console.log('⏳ Step 3: Dropping old constraint...');
    await sql`
      ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_level_check"
    `;
    console.log('✅ Step 3 completed\n');

    console.log('⏳ Step 4: Adding new constraint...');
    await sql`
      ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_level_check"
      CHECK ("level" IN ('detailed', 'concise'))
    `;
    console.log('✅ Step 4 completed\n');

    console.log('⏳ Step 5: Setting new default...');
    await sql`
      ALTER TABLE "user_profiles" ALTER COLUMN "level" SET DEFAULT 'detailed'
    `;
    console.log('✅ Step 5 completed\n');

    console.log('✅ Migration completed successfully!\n');

    // Verify the changes
    console.log('🔍 Verifying migration...');
    const result = await sql`
      SELECT user_id, level, learning_goal
      FROM user_profiles
      ORDER BY updated_at DESC
      LIMIT 5
    `;

    console.log('Current user profiles:');
    console.table(result);

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
