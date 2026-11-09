import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import PreviousPapersList from "@/components/PreviousPapersList";
import { getPool } from "@/lib/db";
import type { PostRow } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
 const { slug } = await params;
 const [rows] = await getPool().execute("SELECT name FROM categories WHERE slug=? AND is_active=1 LIMIT 1", [slug]);
 const category = (rows as { name: string }[])[0];
 if (!category) return { title: "Category not found", robots: { index: false, follow: false } };
 const title = `${category.name} Updates`;
 return {
  title,
  description: `Latest Jharkhand ${category.name.toLowerCase()} notifications, important dates, results and official updates on JharResult.`,
  alternates: { canonical: `/category/${encodeURIComponent(slug)}` },
  openGraph: { title: `${title} | JharResult`, description: `Latest Jharkhand ${category.name.toLowerCase()} updates.`, type: "website" },
 };
}
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const [cats]=await getPool().execute("SELECT id,name FROM categories WHERE slug=? LIMIT 1",[slug]);
 const cat=(cats as any[])[0]; if(!cat) notFound();
 const [rows]=await getPool().execute(`SELECT DISTINCT p.*,c.name AS category_name,c.slug AS category_slug FROM posts p JOIN categories c ON c.id=p.category_id LEFT JOIN post_categories pc ON pc.post_id=p.id WHERE (p.category_id=? OR pc.category_id=?) AND p.status='published' ORDER BY p.published_at DESC LIMIT 100`,[cat.id,cat.id]);
 const posts=rows as PostRow[];
 let papers: any[] = [];
 if (slug === "previous-papers") {
   const [paperRows] = await getPool().execute(
     `SELECT id, title, exam_name, course, stream, subject, year,
             semester, description, pdf_url, solution_pdf_url, created_at
      FROM previous_year_papers
      WHERE status = 'published'
      ORDER BY year DESC, created_at DESC`
   );
   papers = paperRows as any[];
 }
 return (
  <>
    <SiteHeader />
    <main className="container" style={{ padding: "28px 0" }}>
      <h1>{cat.name}</h1>
      <p className="muted">Jharkhand {cat.name.toLowerCase()} updates</p>

      {posts.length > 0 && (
        <div className="grid" style={{ marginBottom: 20 }}>
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {slug === "previous-papers" && (
        papers.length ? (
          <PreviousPapersList papers={papers} />
        ) : posts.length === 0 ? (
          <div className="panel">No previous year papers or updates have been published yet.</div>
        ) : null
      )}

      {slug !== "previous-papers" && posts.length === 0 && (
        <div className="panel">No updates in this category yet.</div>
      )}
    </main>
  </>
 );
}
