require("@next/env").loadEnvConfig(process.cwd());
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
async function check() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME
  });
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const [rows] = await db.execute(
    "SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1",
    [email]
  );
  const admin = rows[0];
  console.log("Configured email:", email);
  console.log("Admin found:", !!admin);
  if (admin) {
    console.log("Database email:", admin.email);
    console.log(
      "Password matches .env.local:",
      await bcrypt.compare(process.env.ADMIN_PASSWORD || "", admin.password_hash)
    );
  }
  await db.end();
}
check().catch(e => console.log("Diagnostic error:", e.message));
