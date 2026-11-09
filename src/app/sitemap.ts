import type { MetadataRoute } from "next";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

// Keep sitemap URLs on the canonical production domain.
const SITE_URL = "https://jharresult.in";

function validLastModified(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

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
    priority: route === "" ? 1 : route === "/previous-year-papers" ? 0.8 : 0.5,
  }));

  try {
    const [postRows] = await getPool().query(
      "SELECT slug, updated_at, published_at FROM posts WHERE status = 'published' AND slug IS NOT NULL AND slug <> ''"
    );
    const [categoryRows] = await getPool().query(
      `SELECT DISTINCT c.slug
       FROM categories c
       LEFT JOIN posts p
         ON p.category_id = c.id AND p.status = 'published'
       LEFT JOIN post_categories pc
         ON pc.category_id = c.id
       LEFT JOIN posts p2
         ON p2.id = pc.post_id AND p2.status = 'published'
       WHERE c.is_active = 1
         AND c.slug IS NOT NULL
         AND c.slug <> ''
         AND (p.id IS NOT NULL OR p2.id IS NOT NULL)`
    );

    const posts: MetadataRoute.Sitemap = (postRows as any[]).map((post) => ({
      url: `${SITE_URL}/post/${encodeURIComponent(post.slug)}`,
      lastModified: validLastModified(post.updated_at) || validLastModified(post.published_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    const categories: MetadataRoute.Sitemap = (categoryRows as any[]).map((category) => ({
      url: `${SITE_URL}/category/${encodeURIComponent(category.slug)}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [...staticEntries, ...categories, ...posts];
  } catch (error) {
    console.error("Sitemap database query failed; serving static URLs only:", error);
    return staticEntries;
  }
}
