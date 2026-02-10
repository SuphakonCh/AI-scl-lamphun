import mysql from 'mysql2/promise'
import { drizzle } from 'drizzle-orm/mysql2'

const sslEnabled = (process.env.DB_SSL ?? 'true') === 'true'
const sslCa = process.env.DB_SSL_CA

const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined
const sslConfig = sslEnabled
  ? {
      rejectUnauthorized: true,
      ca: sslCa ? sslCa : undefined
    }
  : undefined

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: dbPort,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10),
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS ?? 600000),
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS ?? 10000)
});

export async function initialize() {
  const database = process.env.DB_DATABASE;
  if (!database) throw new Error("DB_DATABASE is not set");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: dbPort,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    ssl: sslConfig
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  await connection.query(`USE \`${database}\``);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS devices (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deviceId VARCHAR(255) UNIQUE,
      deviceKey VARCHAR(255),
      monitorItem VARCHAR(255),
      customName VARCHAR(255),
      deviceName VARCHAR(255),
      latitude VARCHAR(100),
      longitude VARCHAR(100)
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      firstname VARCHAR(255),
      lastname VARCHAR(255),
      username VARCHAR(255) UNIQUE,
      email VARCHAR(255) UNIQUE,
      role VARCHAR(100),
      password VARCHAR(255)
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      token VARCHAR(255) UNIQUE,
      expires_at VARCHAR(100)
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS device_data (
      id INT AUTO_INCREMENT PRIMARY KEY,
      deviceId VARCHAR(255),
      monitorItem VARCHAR(255),
      monitorTime VARCHAR(100),
      monitorValue VARCHAR(100),
      UNIQUE KEY unique_device_time (deviceId, monitorTime)
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS device_owners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      device_id INT,
      UNIQUE KEY unique_device_owner (user_id, device_id)
    )
  `);
  await connection.end();

  return drizzle(pool);
}