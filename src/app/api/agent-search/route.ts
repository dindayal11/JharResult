import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  if (query.length < 2) {
    return NextResponse.json({ query, results: [], message: "Enter at least two characters." });
  }
  const like = `%${query}%`;
  const [rows] = await getPool().execute(
    `SELECT DISTINCT p.title, p.slug, p.short_description, p.published_at,
            c.name AS category_name
     FROM posts p
     JOIN categories c ON c.id = p.category_id
     LEFT JOIN post_categories pc ON pc.post_id = p.id
     WHERE p.status = 'published'
       AND (p.title LIKE ? OR p.short_description LIKE ? OR p.organization LIKE ?)
     ORDER BY p.published_at DESC
     LIMIT 10`,
    [like, like, like]
  );
  const results = (rows as any[]).map((post) => ({
    title: post.title,
    description: String(post.short_description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400),
    category: post.category_name,
    publishedAt: post.published_at,
    url: `https://jharresult.in/post/${encodeURIComponent(post.slug)}`,
  }));
  return NextResponse.json({ query, count: results.length, results }, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
