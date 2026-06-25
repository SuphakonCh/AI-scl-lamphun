import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./api/v2/auth";
import { deviceRoutes } from "./api/v2/device";
import { userRoutes } from "./api/v2/user";
import {db, initialize } from "./db/database";
import { startMainStreamCorrectionSync, startMainStreamLatestSync } from "./services/mainStream";
import { staticPlugin } from "@elysiajs/static";

const port = Number(process.env.PORT ?? 3000);

// 1. ลองดึงค่า URL ของเว็บ Frontend เราจาก .env (ถ้าไม่มีให้ยอมรับหมดแบบชั่วคราวไปก่อน)
const allowedOrigin = process.env.FRONTEND_URL ?? "*";

try {
  const database = await initialize();
  console.log("✅ Database connected successfully");
  
  startMainStreamLatestSync(db);
  startMainStreamCorrectionSync(db);

  const app = new Elysia()
    // 2. ใช้ staticPlugin เสิร์ฟไฟล์หน้าเว็บ (React/Vite)
    .use(staticPlugin({
      assets: './public',
      prefix: '/' 
    }))
    // 3. ใช้ CORS (ถ้า frontend อยู่ที่เดียวกับ backend แล้ว เต้จะเปิดไว้ก็ไม่เสียหายครับ)
    .use(cors({ origin: allowedOrigin }))
    .use(deviceRoutes)
    .use(authRoutes)
    .use(userRoutes)
    // 4. API Routes ควรขึ้นต้นด้วย /api เพื่อไม่ให้ชนกับไฟล์หน้าเว็บ
    .group("/api", (app) => app
      .use(deviceRoutes)
      .use(authRoutes)
      .use(userRoutes)
    )
    .listen({ port, hostname: "0.0.0.0" });

  console.log(`🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`);

} catch (error) {
  // 5. ถ้าต่อ DB ไม่ติด ก็ไม่ต้องเปิด Server ให้โปรแกรมแจ้งเตือนแล้วตายไปเลย (Fail-Fast)
  console.error("❌ Failed to start server: Database connection error", error);
  process.exit(1); 
}