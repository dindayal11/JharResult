import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "jharresult_admin";
function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters.");
  return new TextEncoder().encode(value);
}
export async function createSession(admin: { id: number; email: string }) {
  const token = await new SignJWT({ email: admin.email })
    .setProtectedHeader({ alg: "HS256" }).setSubject(String(admin.id))
    .setIssuedAt().setExpirationTime("8h").sign(secret());
  const jar = await cookies();
  jar.set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 8 * 60 * 60 });
}
export async function getSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email) return null;
    return { id: Number(payload.sub), email: String(payload.email) };
  } catch { return null; }
}
export async function requireAdmin() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}
