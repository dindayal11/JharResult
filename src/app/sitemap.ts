import type { MetadataRoute } from "next";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/disclaimer",
    "/previous-year-papers",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" ? "daily" : "monthly",
    priority: route === "" ? 1 : 0.5,
  }));

  try {
    const [postRows] = await getPool().query(
      "SELECT slug, updated_at, published_at FROM posts WHERE status = 'published' AND slug IS NOT NULL"
    );
    const [categoryRows] = await getPool().query(
      "SELECT slug FROM categories WHERE is_active = 1 AND slug IS NOT NULL"
    );
    const [paperRows] = await getPool().query(
      "SELECT created_at FROM previous_year_papers WHERE status = 'published'"
    );

    const posts = (postRows as any[]).map((post) => ({
      url: `${SITE_URL}/post/${encodeURIComponent(post.slug)}`,
      lastModified: post.updated_at || post.published_at || undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const categories = (categoryRows as any[]).map((category) => ({
      url: `${SITE_URL}/category/${encodeURIComponent(category.slug)}`,
      
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    return [...staticEntries, ...categories, ...posts];
  } catch {
    // Keep static URLs available if the database is temporarily unreachable.
    return staticEntries;
  }
}
