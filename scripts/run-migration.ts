import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import path from "path";

// Load environment variables
config({ path: ".env" });

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = neon(process.env.DATABASE_URL);

  // Read the latest migration file (Phase 4: DROP)
  const migrationPath = path.join(process.cwd(), "drizzle/0011_living_ronan.sql");
  const migrationSQL = readFileSync(migrationPath, "utf-8");

  console.log("Running migration:", migrationPath);
  console.log("\n--- SQL to execute ---");
  console.log(migrationSQL);
  console.log("--- End of SQL ---\n");

  try {
    // Split SQL by statement-breakpoint and execute each statement separately
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${statements.length} statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`[${i + 1}/${statements.length}] Executing:`);
      console.log(statement.substring(0, 100) + "...\n");

      try {
        await sql(statement);
        console.log("  ✓ Success\n");
      } catch (error: any) {
        // Check if column already exists (error code 42701)
        if (error.code === '42701') {
          console.log("  ⚠ Column already exists, skipping\n");
          continue;
        }
        // Check if relation already exists (error code 42P07)
        if (error.code === '42P07') {
          console.log("  ⚠ Relation already exists, skipping\n");
          continue;
        }
        // Other errors should fail
        throw error;
      }
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

runMigration();
