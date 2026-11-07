
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    }).parse(await req.json());

    const email = body.email.trim().toLowerCase();

    const [rows] = await getPool().execute(
      "SELECT id, email, password_hash FROM admins WHERE email = ? LIMIT 1",
      [email]
    );

    const admin = (rows as any[])[0];

    if (!admin) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(
      body.password,
      admin.password_hash
    );

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    await createSession({
      id: Number(admin.id),
      email: admin.email
    });


    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error("Admin login failed.");

    return NextResponse.json(
      { error: "Login server error. Check the terminal." },
      { status: 500 }
    );
  }
}
