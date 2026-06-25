import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./api/v2/auth";
import { deviceRoutes } from "./api/v2/device";
import { userRoutes } from "./api/v2/user";
import {db, initialize } from "./db/database";
import { startMainStreamCorrectionSync, startMainStreamLatestSync } from "./services/mainStream";

const port = Number(process.env.PORT ?? 3000);

// 1. ลองดึงค่า URL ของเว็บ Frontend เราจาก .env (ถ้าไม่มีให้ยอมรับหมดแบบชั่วคราวไปก่อน)
const allowedOrigin = process.env.FRONTEND_URL ?? "*";

try {
  // 2. ใช้ await เพื่อ "หยุดรอ" ให้ Database เชื่อมต่อให้เสร็จสมบูรณ์ 100% 
  // ก่อนที่จะไปเปิด Server (แก้ปัญหา Race Condition)
  const database = await initialize();
  console.log("✅ Database connected successfully");
  
  // 3. เริ่มทำงาน Background Services
  startMainStreamLatestSync(db);
  startMainStreamCorrectionSync(db);

  // 4. พอ DB พร้อมปุ๊บ เราค่อยสร้างแอป Elysia และเปิดประตูรับ Request
  const app = new Elysia()
    .use(
      cors({
        origin: allowedOrigin, // <--- ใช้ตัวแปรแทน "*" 
      })
    )
    .use(deviceRoutes)
    .use(authRoutes)
    .use(userRoutes)
    .get("/", () => "Hello Elysia - API v2 is running")
    .listen({ port, hostname: "0.0.0.0" });

  console.log(
    `🦊 Elysia is running securely at http://${app.server?.hostname}:${app.server?.port}`
  );

} catch (error) {
  // 5. ถ้าต่อ DB ไม่ติด ก็ไม่ต้องเปิด Server ให้โปรแกรมแจ้งเตือนแล้วตายไปเลย (Fail-Fast)
  console.error("❌ Failed to start server: Database connection error", error);
  process.exit(1); 
}