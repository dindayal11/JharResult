import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { sendPostNotification } from "@/lib/push";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid post ID." }, { status: 400 });
    const [rows]: any = await getPool().execute("SELECT title, slug, short_description, status FROM posts WHERE id=? LIMIT 1", [id]);
    if (!rows.length) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    if (rows[0].status !== "published") return NextResponse.json({ error: "Only published posts can be notified." }, { status: 400 });
    const result = await sendPostNotification(rows[0], "manual");
    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("Manual push notification error:", error);
    return NextResponse.json({ error: unauthorized ? "Please sign in." : "Could not send notification. Check VAPID configuration and database migration." }, { status: unauthorized ? 401 : 500 });
  }
}
