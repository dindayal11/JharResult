
require("@next/env").loadEnvConfig(process.cwd());

const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function main() {
  const required = [
    "DB_HOST",
    "DB_USER",
    "DB_NAME",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "AUTH_SECRET"
  ];

  for (const key of required) {
    if (process.env[key] === undefined || process.env[key] === "") {
      throw new Error(`Missing ${key}. Configure .env.local first.`);
    }
  }

  if (process.env.ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }

  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME
  });

  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);

  await db.execute(
    `INSERT INTO admins (name,email,password_hash)
     VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE
     name=VALUES(name), password_hash=VALUES(password_hash)`,
    [
      process.env.ADMIN_NAME || "JharResult Admin",
      process.env.ADMIN_EMAIL.toLowerCase(),
      hash
    ]
  );

  console.log("Admin account created/updated.");
  console.log("Login URL: http://localhost:3000/admin/login");

  await db.end();
}

main().catch(error => {
  console.error("Setup failed:", error.message);
  process.exit(1);
});
