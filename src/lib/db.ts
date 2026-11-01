import mysql from "mysql2/promise";

const globalForDb = globalThis as unknown as { mysqlPool?: mysql.Pool };

export function getPool() {
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
    throw new Error("Database environment variables are not configured.");
  }
  if (!globalForDb.mysqlPool) {
    globalForDb.mysqlPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 8,
      queueLimit: 0,
      charset: "utf8mb4",
      timezone: "Z"
    });
  }
  return globalForDb.mysqlPool;
}
