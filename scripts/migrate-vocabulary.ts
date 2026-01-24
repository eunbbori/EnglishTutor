// Load environment variables FIRST, before any other imports
import { config } from "dotenv";
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import * as fs from "fs";
import * as path from "path";

async function migrate() {
  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    console.log("Reading migration file...");
    const migrationPath = path.join(
      process.cwd(),
      "drizzle",
      "0007_fantastic_wallop.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("Connecting to database...");
    const sql = neon(process.env.DATABASE_URL);

    // Split SQL by statement-breakpoint
    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute...`);

    for (let i = 0; i < statements.length; i++) {
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await sql(statements[i]);
    }

    console.log("✓ Migration applied successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
