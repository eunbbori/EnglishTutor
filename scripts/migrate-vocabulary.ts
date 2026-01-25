import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" }); // Fallback to .env if .env.local doesn't exist

const sql = neon(process.env.DATABASE_URL!);

async function migrateVocabulary() {
  try {
    console.log("Applying vocabulary table migrations...");
    
    await sql`ALTER TABLE "vocabulary" ADD COLUMN IF NOT EXISTS "pronunciation" text`;
    console.log("✓ Added pronunciation column");
    
    await sql`ALTER TABLE "vocabulary" ADD COLUMN IF NOT EXISTS "part_of_speech" text`;
    console.log("✓ Added part_of_speech column");
    
    await sql`ALTER TABLE "vocabulary" ADD COLUMN IF NOT EXISTS "synonyms" text[]`;
    console.log("✓ Added synonyms column");
    
    await sql`ALTER TABLE "vocabulary" ADD COLUMN IF NOT EXISTS "context" text`;
    console.log("✓ Added context column");
    
    await sql`ALTER TABLE "vocabulary" ADD COLUMN IF NOT EXISTS "difficulty" text`;
    console.log("✓ Added difficulty column");
    
    console.log("\n✅ Migration completed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

migrateVocabulary();
