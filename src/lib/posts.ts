import { getPool } from "@/lib/db";

export type PostRow = {
  id: number; title: string; slug: string; category_name: string; category_slug: string;
  short_description: string | null; organization: string | null; published_at: string | null;
  seo_title: string | null; seo_description: string | null; important_dates: unknown;
  application_fee: unknown; age_limit: unknown; vacancy_details: unknown; qualification: string | null;
  selection_process: string | null; how_to_apply: string | null; important_links: unknown; faqs: unknown;
  source_url: string | null; application_url: string | null; verification_status: string;
};
export async function getPublishedPosts(limit = 30): Promise<PostRow[]> {
  const [rows] = await getPool().query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
       COALESCE(
         (SELECT GROUP_CONCAT(DISTINCT mapped.slug ORDER BY mapped.name SEPARATOR ',')
          FROM post_categories pc JOIN categories mapped ON mapped.id=pc.category_id
          WHERE pc.post_id=p.id),
         c.slug
       ) AS category_slugs
     FROM posts p JOIN categories c ON c.id=p.category_id
     WHERE p.status='published' ORDER BY p.published_at DESC LIMIT ?`, [limit]
  );
  return rows as PostRow[];
}
export async function getPostBySlug(slug: string): Promise<PostRow | null> {
  const [rows] = await getPool().execute(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
     FROM posts p JOIN categories c ON c.id=p.category_id
     WHERE p.slug=? AND p.status='published' LIMIT 1`, [slug]
  );
  return (rows as PostRow[])[0] || null;
}
export function parseJson(value: unknown) {
  if (typeof value === "string") { try { return JSON.parse(value); } catch { return null; } }
  return value ?? null;
}
