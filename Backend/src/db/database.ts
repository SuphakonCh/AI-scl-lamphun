import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const sslEnabled = (process.env.DB_SSL ?? 'false') === 'true'
const sslCa = process.env.DB_SSL_CA

const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432
const sslConfig = sslEnabled
  ? sslCa
    ? {
        rejectUnauthorized: true,
        ca: sslCa
      }
    : 'require'
  : undefined

const connectTimeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000)
const idleTimeoutMs = Number(process.env.DB_IDLE_TIMEOUT_MS ?? 600000)

const client = postgres({
  host: process.env.DB_HOST,
  port: dbPort,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: sslConfig,
  max: Number(process.env.DB_POOL_LIMIT ?? 10),
  idle_timeout: Math.max(1, Math.ceil(idleTimeoutMs / 1000)),
  connect_timeout: Math.max(1, Math.ceil(connectTimeoutMs / 1000)),
  // Suppress benign CREATE TABLE IF NOT EXISTS notices (relation already exists).
  onnotice: (notice) => {
    if (notice.code === "42P07") {
      return;
    }
    console.warn("PostgreSQL notice:", notice.message);
  }
});

export async function initialize() {
  await client`
    SELECT 1
  `

  await client`
    CREATE TABLE IF NOT EXISTS devices (
      id SERIAL PRIMARY KEY,
      "deviceId" VARCHAR(255) UNIQUE,
      "deviceKey" VARCHAR(255),
      "monitorItem" VARCHAR(255),
      "customName" VARCHAR(255),
      "deviceName" VARCHAR(255),
      warning_level INTEGER NOT NULL DEFAULT 0,
      latitude VARCHAR(100),
      longitude VARCHAR(100)
    )
  `

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firstname VARCHAR(255),
      lastname VARCHAR(255),
      username VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      role VARCHAR(100),
      password VARCHAR(255)
    )
  `

  await client`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token VARCHAR(255) UNIQUE,
      expires_at VARCHAR(100)
    )
  `

  await client`
    CREATE TABLE IF NOT EXISTS device_data (
      id SERIAL PRIMARY KEY,
      "deviceId" VARCHAR(255),
      "monitorItem" VARCHAR(255),
      "monitorTime" VARCHAR(100),
      "monitorValue" VARCHAR(100),
      CONSTRAINT unique_device_time UNIQUE ("deviceId", "monitorTime")
    )
  `

  await client`
    CREATE TABLE IF NOT EXISTS device_owners (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
      CONSTRAINT unique_device_owner UNIQUE (user_id, device_id)
    )
  `

  await client`
    CREATE TABLE IF NOT EXISTS cache_entries (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      expires_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  return drizzle(client);
}
