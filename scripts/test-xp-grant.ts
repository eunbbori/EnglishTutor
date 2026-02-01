/**
 * Test XP grant functionality
 * Run: npx tsx scripts/test-xp-grant.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Load environment variables
const envFiles = [".env.local", ".env"];
for (const envFile of envFiles) {
  try {
    const envPath = resolve(process.cwd(), envFile);
    const envContent = readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    });
    console.log(`✓ Loaded environment from ${envFile}\n`);
    break;
  } catch (error) {
    // Try next file
  }
}

async function testXpGrant() {
  try {
    const { grantXp } = await import("../lib/gamification/xp-service");
    const { db } = await import("../db");
    const { users } = await import("../db/schema");

    // Get the actual user
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
      console.error("❌ No users found in database");
      process.exit(1);
    }

    const userId = allUsers[0].id;
    console.log(`Testing XP grant for user: ${allUsers[0].email} (${userId})\n`);

    // Test granting XP (without referenceId to avoid UUID validation error)
    console.log("🧪 Test 1: Granting diary_submit XP...");
    const result = await grantXp(userId, "diary_submit");

    console.log("✅ XP grant successful!");
    console.log(`  XP Gained: +${result.xpGained}`);
    console.log(`  Total XP: ${result.totalXp}`);
    console.log(`  Level: ${result.oldLevel} → ${result.newLevel}`);
    console.log(`  Level Up: ${result.leveledUp}`);
    if (result.leveledUp && result.newTitle) {
      console.log(`  New Title: ${result.newTitle}`);
    }
    console.log(`  Booster Applied: ${result.boosterApplied}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ XP grant test failed:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

testXpGrant();
