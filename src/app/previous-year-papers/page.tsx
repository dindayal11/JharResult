
import SiteHeader from "@/components/SiteHeader";
import PreviousPapersList from "@/components/PreviousPapersList";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PreviousYearPapersPage() {
  let papers: any[] = [];
  let dbError = false;

  try {
    const [rows] = await getPool().query(
      `SELECT id, title, exam_name, course, stream, subject, year,
              semester, description, pdf_url, solution_pdf_url, created_at
       FROM previous_year_papers
       WHERE status = 'published'
       ORDER BY year DESC, created_at DESC`
    );

    papers = rows as any[];
  } catch (error) {
    console.error("Previous papers listing error:", error);
    dbError = true;
  }

  return (
    <>
      <SiteHeader />

      <main className="container" style={{ padding: "28px 0 40px" }}>
        <h1 style={{ color: "#17365d", marginBottom: 6 }}>
          Previous Year Question Papers
        </h1>

        <p className="muted" style={{ marginBottom: 22 }}>
          Search and download previous year question papers and available solutions.
        </p>

        {dbError ? (
          <div className="panel">
            Papers could not be loaded. Please try again later.
          </div>
        ) : (
          <PreviousPapersList papers={papers} />
        )}
      </main>
    </>
  );
}
