import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function GET() {
  const [posts, categoryResult] = await Promise.all([
    getPublishedPosts(20),
    getPool().query("SELECT name, slug FROM categories WHERE is_active = 1 ORDER BY id ASC"),
  ]);
  const categories = categoryResult[0] as { name: string; slug: string }[];
  const lines = [
    "# JharResult",
    "",
    "Jharkhand government jobs, examination results, admit cards, answer keys, admissions, scholarships and education updates.",
    "",
    "## Main pages",
    "- [Homepage](https://jharresult.in/)",
    "- [Latest Jobs](https://jharresult.in/category/latest-jobs)",
    "- [Previous Year Papers](https://jharresult.in/previous-year-papers)",
    "- [Search](https://jharresult.in/search)",
    "- [Contact](https://jharresult.in/contact)",
    "",
    "## Categories",
    ...categories.map((category) => `- [${category.name}](https://jharresult.in/category/${encodeURIComponent(category.slug)})`),
    "",
    "## Latest published updates",
    ...posts.map((post: any) => `- [${post.title}](https://jharresult.in/post/${encodeURIComponent(post.slug)})${post.short_description ? `: ${String(post.short_description).replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").slice(0, 240)}` : ""}`),
    "",
    "JharResult is an independent information portal, not a government department. Verify time-sensitive details with the relevant official notification.",
    "",
    "Contact: dindayal8456@gmail.com",
  ];
  return new NextResponse(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, max-age=300" },
  });
}
