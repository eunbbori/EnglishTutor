/**
 * Diagnostic script to check XP issue
 * Run from project root: npx tsx scripts/diagnose-xp.ts
 */

// Load environment variables before importing db
import { readFileSync } from "fs";
import { resolve } from "path";

// Try .env.local first, then .env
const envFiles = [".env.local", ".env"];
let envLoaded = false;

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
    console.log(`✓ Loaded environment from ${envFile}`);
    envLoaded = true;
    break;
  } catch (error) {
    // Try next file
  }
}

if (!envLoaded) {
  console.error("⚠️  Could not load any .env file");
}

async function diagnose() {
  try {
    console.log("🔍 Diagnosing XP Issue...\n");

    // Dynamically import after env is loaded
    const { db } = await import("../db");
    const { userProfiles, xpHistory, users } = await import("../db/schema");
    const { desc } = await import("drizzle-orm");

    // 1. Get all users
    const allUsers = await db.select().from(users).limit(5);
    console.log(`📊 Found ${allUsers.length} user(s) in database:`);
    allUsers.forEach((u: any) => {
      console.log(`  - ID: ${u.id}, Email: ${u.email || 'N/A'}, Name: ${u.name || 'N/A'}`);
    });
    console.log();

    // 2. Get all user profiles
    const allProfiles = await db.select().from(userProfiles).limit(5);
    console.log(`📊 Found ${allProfiles.length} user profile(s):`);
    allProfiles.forEach((p: any) => {
      console.log(`  - UserID: ${p.userId}`);
      console.log(`    XP: ${p.xp}, Level: ${p.xpLevel}, Title: ${p.title}`);
      console.log(`    Updated: ${p.updatedAt}`);
    });
    console.log();

    // 3. Get recent XP history
    const recentXp = await db
      .select()
      .from(xpHistory)
      .orderBy(desc(xpHistory.createdAt))
      .limit(10);

    console.log(`📊 Found ${recentXp.length} XP history record(s):`);
    if (recentXp.length === 0) {
      console.log("  ⚠️  NO XP HISTORY RECORDS FOUND!");
      console.log("  This means grantXp() has NEVER been called successfully.");
    } else {
      recentXp.forEach((xp: any) => {
        console.log(`  - UserID: ${xp.userId}`);
        console.log(`    Action: ${xp.action}, Amount: ${xp.amount}`);
        console.log(`    Created: ${xp.createdAt}`);
        console.log(`    Booster: ${xp.boosterApplied}, Ref: ${xp.referenceId}`);
      });
    }
    console.log();

    // 4. Summary
    console.log("📋 Summary:");
    if (allUsers.length === 0) {
      console.log("  ❌ NO USERS FOUND - User might not be authenticated");
    }
    if (allProfiles.length === 0) {
      console.log("  ❌ NO USER PROFILES - Profile creation might be failing");
    } else if (allProfiles.every((p: any) => p.xp === 0)) {
      console.log("  ❌ ALL PROFILES HAVE 0 XP - XP grant is not working");
    }
    if (recentXp.length === 0) {
      console.log("  ❌ NO XP HISTORY - grantXp() is not being executed or failing silently");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Diagnostic failed:", error);
    process.exit(1);
  }
}

diagnose();
