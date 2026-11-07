import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import { getPool } from "@/lib/db";
import type { PostRow } from "@/lib/posts";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
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
          <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 650 }}>
              <thead>
                <tr style={{ background: "#173f68", color: "#fff" }}>
                  {["Paper Details", "Subject", "Year", "Question Paper", "Solution"].map((heading) => (
                    <th key={heading} align="left" style={{ padding: "13px 12px" }}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {papers.map((paper) => (
                  <tr key={paper.id} style={{ borderBottom: "1px solid #e6eaf0" }}>
                    <td style={{ padding: "13px 12px" }}>
                      <strong style={{ color: "#174b80" }}>{paper.title}</strong>
                      <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>{paper.exam_name}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{[paper.course, paper.stream, paper.semester].filter(Boolean).join(" • ")}</div>
                    </td>
                    <td style={{ padding: "13px 12px" }}>{paper.subject}</td>
                    <td style={{ padding: "13px 12px" }}>{paper.year}</td>
                    <td style={{ padding: "13px 12px" }}>
                      <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0756a5", fontWeight: 700 }}>Download PDF</a>
                    </td>
                    <td style={{ padding: "13px 12px" }}>
                      {paper.solution_pdf_url ? (
                        <a href={paper.solution_pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "#15803d", fontWeight: 700 }}>Download Solution</a>
                      ) : <span className="muted">Not Available</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
