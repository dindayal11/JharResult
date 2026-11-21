import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getPool } from "@/lib/db";
import { sendPostNotification } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get("authorization") || "";
  if (!expected || expected.length < 32 || !supplied.startsWith("Bearer ")) return false;
  const actual = supplied.slice(7);
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const pool = getPool();
    const [duePosts]: any = await pool.query("SELECT id, title, slug, short_description FROM posts WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=NOW()");
    if (duePosts.length) {
      await pool.execute("UPDATE posts SET status='published', published_at=NOW(), scheduled_at=NULL WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=NOW()");
      for (const post of duePosts) {
        try { await sendPostNotification(post, "new_post"); }
        catch (pushError) { console.error("Scheduled post notification failed:", post.id, pushError); }
      }
    }
    return NextResponse.json({ ok: true, published: duePosts.length, checked_at: new Date().toISOString() });
  } catch (error) {
    console.error("Scheduled publishing error:", error);
    return NextResponse.json({ error: "Could not publish scheduled posts." }, { status: 500 });
  }
}
