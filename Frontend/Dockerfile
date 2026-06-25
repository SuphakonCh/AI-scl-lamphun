# ==========================================
# Stage 1: Build Environment (เป็นห้องครัวปรุงโค้ด)
# ==========================================
FROM oven/bun:1 AS build

WORKDIR /app

# ใช้ Layer Caching เหมือนเดิม
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# เอาโค้ดทั้งหมดเข้ามาแล้วสั่ง Build ให้กลายเป็น Static Files (สมมติว่าโฟลเดอร์ผลลัพธ์ชื่อ dist)
COPY . .
RUN bun run build

# ==========================================
# Stage 2: Production Environment (ใช้ Nginx เป็นคนเสิร์ฟ)
# ==========================================
FROM nginx:alpine

# ก๊อปปี้แค่ไฟล์ Static ที่ Build เสร็จแล้วจาก Stage 1 มาใส่ในโฟลเดอร์ที่ Nginx ใช้เสิร์ฟเว็บ
COPY --from=build /app/dist /usr/share/nginx/html

# เปิดพอร์ต 80 (พอร์ตมาตรฐานของ HTTP)
EXPOSE 80

# สั่งให้ Nginx ทำงานแบบ Background
CMD ["nginx", "-g", "daemon off;"]