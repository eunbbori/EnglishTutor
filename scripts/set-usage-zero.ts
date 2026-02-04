/**
 * Set user usage to 0 for testing upgrade modal trigger
 * Run: npx tsx scripts/set-usage-zero.ts
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

async function setUsageToZero() {
  try {
    const { db } = await import("../db");
    const { users, diaryUsage } = await import("../db/schema");
    const { eq } = await import("drizzle-orm");

    // Get the actual user
    const allUsers = await db.select().from(users).limit(1);
    if (allUsers.length === 0) {
      console.error("❌ No users found in database");
      process.exit(1);
    }

    const userId = allUsers[0].id;
    console.log(`Setting usage to 0 for user: ${allUsers[0].email} (${userId})\n`);

    // Get today's date (KST)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if usage record exists for today
    const existingUsage = await db
      .select()
      .from(diaryUsage)
      .where(eq(diaryUsage.userId, userId))
      .limit(1);

    if (existingUsage.length > 0) {
      // Update to max (3 for free users)
      await db
        .update(diaryUsage)
        .set({
          count: 3, // Max for free users
          lastUsedAt: today,
        })
        .where(eq(diaryUsage.userId, userId));

      console.log("✅ Usage set to 3/3 (0 remaining)");
      console.log("Now try clicking '오늘 쓰기' button - upgrade modal should appear!");
    } else {
      // Insert new record with max count
      await db.insert(diaryUsage).values({
        userId,
        count: 3,
        lastUsedAt: today,
      });

      console.log("✅ Usage record created: 3/3 (0 remaining)");
      console.log("Now try clicking '오늘 쓰기' button - upgrade modal should appear!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to set usage:", error);
    process.exit(1);
  }
}

setUsageToZero();
