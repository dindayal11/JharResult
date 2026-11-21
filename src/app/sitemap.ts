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
    "/quiz",
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

    const [quizCategoryRows] = await getPool().query(
      `SELECT r.slug AS root_slug, c.slug AS category_slug
       FROM quiz_categories c
       INNER JOIN quiz_categories r ON r.id = c.parent_id
       WHERE c.is_active = 1 AND r.is_active = 1
         AND c.slug IS NOT NULL AND c.slug <> ''
         AND r.slug IS NOT NULL AND r.slug <> ''`
    );

    const [quizRows] = await getPool().query(
      `SELECT q.slug, q.updated_at, q.published_at
       FROM quizzes q
       INNER JOIN quiz_categories c ON c.id = q.category_id
       INNER JOIN quiz_categories r ON r.id = c.parent_id
       WHERE q.status = 'published'
         AND c.is_active = 1 AND r.is_active = 1
         AND q.slug IS NOT NULL AND q.slug <> ''`
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

    const quizCategories: MetadataRoute.Sitemap = (quizCategoryRows as any[]).map((category) => ({
      url: `${SITE_URL}/quiz/${encodeURIComponent(category.root_slug)}/${encodeURIComponent(category.category_slug)}`,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    const quizzes: MetadataRoute.Sitemap = (quizRows as any[]).map((quiz) => ({
      url: `${SITE_URL}/quiz/start/${encodeURIComponent(quiz.slug)}`,
      lastModified: validLastModified(quiz.updated_at) || validLastModified(quiz.published_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticEntries, ...categories, ...posts, ...quizCategories, ...quizzes];
  } catch (error) {
    console.error("Sitemap database query failed; serving static URLs only:", error);
    return staticEntries;
  }
}
