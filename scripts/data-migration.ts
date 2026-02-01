import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Load environment variables
config({ path: ".env" });

async function migrateData() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("📦 Starting Phase 3: Data Migration\n");

  try {
    // 1. Migrate user_profiles.level to learning_preferences
    console.log("[1/3] Migrating user_profiles.level → learning_preferences...");

    const profileUpdateResult = await sql`
      UPDATE user_profiles
      SET learning_preferences = jsonb_build_object('explanation_style', level)
      WHERE level IS NOT NULL
      AND learning_preferences = '{}'::jsonb
    `;

    console.log(`  ✓ Updated ${profileUpdateResult.length} user profiles\n`);

    // 2. Migrate user_mistakes.mistake_type enum values
    console.log("[2/3] Migrating user_mistakes.mistake_type enum values...");

    // pronunciation → expression
    const pronunciationResult = await sql`
      UPDATE user_mistakes
      SET mistake_type = 'expression'
      WHERE mistake_type = 'pronunciation'
    `;
    console.log(`  ✓ Migrated ${pronunciationResult.length} 'pronunciation' → 'expression'`);

    // fluency → expression
    const fluencyResult = await sql`
      UPDATE user_mistakes
      SET mistake_type = 'expression'
      WHERE mistake_type = 'fluency'
    `;
    console.log(`  ✓ Migrated ${fluencyResult.length} 'fluency' → 'expression'`);

    // comprehension → vocabulary
    const comprehensionResult = await sql`
      UPDATE user_mistakes
      SET mistake_type = 'vocabulary'
      WHERE mistake_type = 'comprehension'
    `;
    console.log(`  ✓ Migrated ${comprehensionResult.length} 'comprehension' → 'vocabulary'\n`);

    // 3. Migrate learning_stats.mistake_breakdown jsonb keys
    console.log("[3/3] Migrating learning_stats.mistake_breakdown jsonb keys...");

    const statsUpdateResult = await sql`
      UPDATE learning_stats
      SET mistake_breakdown =
        mistake_breakdown
        - 'pronunciation'
        - 'fluency'
        - 'comprehension'
        || jsonb_build_object(
          'expression',
          COALESCE((mistake_breakdown->>'pronunciation')::int, 0) +
          COALESCE((mistake_breakdown->>'fluency')::int, 0)
        )
        || CASE
          WHEN mistake_breakdown ? 'comprehension'
          THEN jsonb_build_object(
            'vocabulary',
            COALESCE((mistake_breakdown->>'vocabulary')::int, 0) +
            COALESCE((mistake_breakdown->>'comprehension')::int, 0)
          )
          ELSE '{}'::jsonb
        END
      WHERE mistake_breakdown ? 'pronunciation'
        OR mistake_breakdown ? 'fluency'
        OR mistake_breakdown ? 'comprehension'
    `;

    console.log(`  ✓ Updated ${statsUpdateResult.length} learning stats records\n`);

    console.log("✅ Data migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - User profiles updated: ${profileUpdateResult.length}`);
    console.log(`  - User mistakes migrated: ${pronunciationResult.length + fluencyResult.length + comprehensionResult.length}`);
    console.log(`  - Learning stats updated: ${statsUpdateResult.length}`);

  } catch (error) {
    console.error("❌ Data migration failed:", error);
    throw error;
  }
}

migrateData();
