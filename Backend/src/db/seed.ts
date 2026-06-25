import {db, initialize } from "./database"; // ปรับ path ให้ตรงกับไฟล์ของเต้
import { users, devices, deviceData } from "./schema"; // ปรับ path
import { sql } from "drizzle-orm";

async function main() {
  console.log("🌱 [Seeding] Starting database seeding process...");

  // 1. Connect to Database
  await initialize();

  try {
    // ==========================================
    // Step 1: Clean
    // ==========================================
    console.log("🧹 [Seeding] Truncating existing tables (CASCADE)...");
    await db.execute(sql`TRUNCATE TABLE users, devices, device_data, device_owners, sessions RESTART IDENTITY CASCADE`);

    // ==========================================
    // Step 2: Create Admin
    // ==========================================
    console.log("👤 [Seeding] Creating default system administrator...");
    const hashedPassword = await Bun.password.hash("admin123");

    const adminUser = await db.insert(users).values({
      firstname: "System",
      lastname: "Admin",
      username: "admin",
      email: "admin@waterflow.local",
      role: "ADMIN",
      password: hashedPassword
    }).returning(); 

    // ==========================================
    // Step 3: Extract (Read JSON)
    // ==========================================

    // ==========================================
    // Step 4: Transform & Load (Insert to DB)
    // ==========================================
    console.log("💾 [Seeding] Inserting device metadata...");
    
    // Insert mock device to satisfy foreign key constraints
    await db.insert(devices).values({
      deviceId: "DEV-WATER-001",
      customName: "สถานีวัดน้ำปิง", // ชื่อข้อมูลยังเป็นไทยได้ปกติครับ
      monitorItem: "water_level",
      warningLevel: 0
    });

    console.log("⚙️ [Seeding] Processing and inserting telemetry data...");
    /* TODO: Transform logic for waterDataRaw goes here
    */

    console.log("✅ [Seeding] Database seeding completed successfully!");

  } catch (error) {
    console.error("❌ [Seeding] Critical error during seeding process:", error);
  } finally {
    console.log("🔌 [Seeding] Closing database connection...");
    process.exit(0);
  }
}

main();