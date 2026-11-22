import SiteHeader from "@/components/SiteHeader";
import { getPool } from "@/lib/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = "https://jharresult.in";

type Paper = {
  id: number;
  title: string;
  exam_name: string;
  course: string | null;
  stream: string | null;
  subject: string;
  year: number;
  semester: string | null;
  description: string | null;
  pdf_url: string;
  solution_pdf_url: string | null;
  created_at?: Date | string | null;
};

async function getPaper(id: string): Promise<Paper | null> {
  if (!/^\d+$/.test(id)) return null;
  const [rows] = await getPool().execute(
    `SELECT id, title, exam_name, course, stream, subject, year, semester,
            description, pdf_url, solution_pdf_url, created_at
     FROM previous_year_papers
     WHERE id = ? AND status = 'published'
     LIMIT 1`,
    [id]
  );
  return ((rows as Paper[])[0] || null);
}

function cleanDescription(value: string | null | undefined, fallback: string) {
  const text = String(value || fallback).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 155 ? `${text.slice(0, 152).trim()}...` : text;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const paper = await getPaper(id);
    if (!paper) return { title: "Previous Year Paper Not Found" };
    const title = `${paper.title} – Previous Year Question Paper ${paper.year} | JharResult`;
    const description = cleanDescription(
      paper.description,
      `Download ${paper.exam_name} ${paper.subject} previous year question paper for ${paper.year}${paper.course ? ` – ${paper.course}` : ""} from JharResult.`
    );
    const url = `${SITE_URL}/previous-year-papers/${paper.id}`;
    return {
      title,
      description,
      keywords: [
        paper.title, paper.exam_name, paper.subject, String(paper.year),
        "previous year question paper", "question paper PDF", "JharResult",
        paper.course, paper.stream, paper.semester,
      ].filter(Boolean) as string[],
      alternates: { canonical: url },
      openGraph: {
        type: "article",
        url,
        siteName: "JharResult",
        title,
        description,
      },
      robots: { index: true, follow: true },
    };
  } catch (error) {
    console.error("Previous paper metadata error:", error);
    return { title: "Previous Year Question Papers | JharResult" };
  }
}

export default async function PreviousYearPaperDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let paper: Paper | null = null;
  try {
    paper = await getPaper(id);
  } catch (error) {
    console.error("Previous paper detail error:", error);
  }
  if (!paper) notFound();

  const url = `${SITE_URL}/previous-year-papers/${paper.id}`;
  const description = cleanDescription(
    paper.description,
    `Download the ${paper.exam_name} ${paper.subject} previous year question paper for ${paper.year}.`
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: paper.title,
    description,
    learningResourceType: "Previous year question paper",
    educationalUse: "Practice",
    inLanguage: ["en", "hi"],
    url,
    provider: { "@type": "Organization", name: "JharResult", url: SITE_URL },
    about: [paper.exam_name, paper.subject, paper.course, paper.stream].filter(Boolean),
    datePublished: paper.created_at ? (paper.created_at instanceof Date ? paper.created_at : new Date(String(paper.created_at))).toISOString() : undefined,
    encoding: {
      "@type": "MediaObject",
      contentUrl: paper.pdf_url,
      encodingFormat: "application/pdf",
    },
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Previous Year Papers", item: `${SITE_URL}/previous-year-papers` },
      { "@type": "ListItem", position: 3, name: paper.title, item: url },
    ],
  };

  const details = [
    ["Exam", paper.exam_name],
    ["Course", paper.course],
    ["Stream / Branch", paper.stream],
    ["Subject", paper.subject],
    ["Year", String(paper.year)],
    ["Semester", paper.semester],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ padding: "26px 0 44px", maxWidth: 900 }}>
        <nav aria-label="Breadcrumb" style={{ marginBottom: 18, color: "#64748b", fontSize: 14 }}>
          <Link href="/" style={{ color: "#0756a5" }}>Home</Link>
          {" / "}
          <Link href="/previous-year-papers" style={{ color: "#0756a5" }}>Previous Year Papers</Link>
          {" / "}
          <span>{paper.title}</span>
        </nav>

        <article className="panel" style={{ padding: "clamp(18px, 4vw, 30px)" }}>
          <p style={{ color: "#e87516", fontWeight: 700, fontSize: 13, margin: "0 0 10px" }}>
            PREVIOUS YEAR QUESTION PAPER
          </p>
          <h1 style={{ color: "#173f68", fontSize: "clamp(25px, 4vw, 36px)", lineHeight: 1.2, margin: "0 0 14px" }}>
            {paper.title}
          </h1>
          <p style={{ color: "#64748b", margin: "0 0 22px", lineHeight: 1.7 }}>
            {paper.exam_name} · {paper.subject} · {paper.year}
          </p>

          <section aria-labelledby="paper-details-heading" style={{ marginBottom: 24 }}>
            <h2 id="paper-details-heading" style={{ color: "#173f68", fontSize: 21, marginBottom: 12 }}>Paper Details</h2>
            <div style={{ border: "1px solid #dbe3ed", borderRadius: 9, overflow: "hidden" }}>
              {details.map(([label, value]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "minmax(115px, 0.8fr) minmax(0, 1.5fr)", gap: 12, padding: "12px 14px", borderBottom: "1px solid #e7edf4" }}>
                  <strong style={{ color: "#52657d" }}>{label}</strong>
                  <span style={{ color: "#1e293b", overflowWrap: "anywhere" }}>{value}</span>
                </div>
              ))}
            </div>
          </section>

          {paper.description && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ color: "#173f68", fontSize: 21, marginBottom: 8 }}>About This Question Paper</h2>
              <p style={{ color: "#334155", lineHeight: 1.8, whiteSpace: "pre-line" }}>{paper.description}</p>
            </section>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 48, padding: "12px 16px", borderRadius: 7, background: "#e87516", color: "#fff", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
              Download Question Paper PDF
            </a>
            {paper.solution_pdf_url && (
              <a href={paper.solution_pdf_url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 48, padding: "12px 16px", borderRadius: 7, border: "1px solid #15803d", background: "#f0fdf4", color: "#15803d", fontWeight: 700, textDecoration: "none", textAlign: "center" }}>
                Download Solution PDF
              </a>
            )}
          </div>
        </article>
        <p style={{ marginTop: 18, textAlign: "center", fontSize: 14 }}>
          <Link href="/previous-year-papers" style={{ color: "#0756a5", fontWeight: 700 }}>← Browse More Previous Year Papers</Link>
        </p>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema).replace(/</g, "\\u003c") }} />
    </>
  );
}
