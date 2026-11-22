
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
};

export default function PreviousPapersList({ papers }: { papers: Paper[] }) {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");

  const years = useMemo(
    () => [...new Set(papers.map((p) => String(p.year)))].sort(
      (a, b) => Number(b) - Number(a)
    ),
    [papers]
  );

  const filteredPapers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return papers.filter((paper) => {
      const searchableText = [
        paper.title,
        paper.exam_name,
        paper.course,
        paper.stream,
        paper.subject,
        paper.semester,
        paper.description,
        paper.year,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (year === "all" || String(paper.year) === year)
      );
    });
  }, [papers, search, year]);

  return (
    <>
      <div
        className="panel"
        style={{
          marginBottom: 18,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 170px",
          gap: 10,
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search exam, subject, course, stream or year..."
          aria-label="Search previous year papers"
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: 4,
            fontSize: 14,
          }}
        />

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          aria-label="Filter by year"
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #cbd5e1",
            borderRadius: 4,
            background: "#fff",
          }}
        >
          <option value="all">All Years</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
        Showing {filteredPapers.length} of {papers.length} papers
      </p>

      {filteredPapers.length === 0 ? (
        <div className="panel">
          No matching papers found. Try another search.
        </div>
      ) : (
        <>
          {/* Mobile layout: keep download actions visible without horizontal scrolling. */}
          <div className="mobile-paper-list">
            {filteredPapers.map((paper) => (
              <article className="mobile-paper-card" key={paper.id}>
                <div className="mobile-paper-heading">
                  <strong><Link href={`/previous-year-papers/${paper.id}`} style={{ color: "inherit", textDecoration: "none" }}>{paper.title}</Link></strong>
                  <span>{paper.year}</span>
                </div>
                <div className="mobile-paper-meta">
                  <span>{paper.exam_name}</span>
                  {paper.subject && <span>{paper.subject}</span>}
                  {[paper.course, paper.stream, paper.semester].filter(Boolean).length > 0 && (
                    <span>{[paper.course, paper.stream, paper.semester].filter(Boolean).join(" • ")}</span>
                  )}
                </div>
                <div className="mobile-paper-actions">
                  <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="paper-download primary">
                    ↓ Download Question Paper
                  </a>
                  {paper.solution_pdf_url ? (
                    <a href={paper.solution_pdf_url} target="_blank" rel="noopener noreferrer" className="paper-download secondary">
                      ↓ Download Solution
                    </a>
                  ) : (
                    <span className="solution-unavailable">Solution not available</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Desktop/tablet layout remains a table. */}
          <div className="panel desktop-paper-table" style={{ padding: 0, overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                minWidth: 650,
              }}
            >
              <thead>
                <tr style={{ background: "#173f68", color: "#fff" }}>
                  {["Paper Details", "Subject", "Year", "Question Paper", "Solution"].map(
                    (heading) => (
                      <th key={heading} align="left" style={{ padding: "13px 12px" }}>
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredPapers.map((paper) => (
                  <tr key={paper.id} style={{ borderBottom: "1px solid #e6eaf0" }}>
                    <td style={{ padding: "13px 12px" }}>
                      <strong style={{ color: "#174b80" }}><Link href={`/previous-year-papers/${paper.id}`} style={{ color: "inherit", textDecoration: "none" }}>{paper.title}</Link></strong>
                      <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
                        {paper.exam_name}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {[paper.course, paper.stream, paper.semester].filter(Boolean).join(" • ")}
                      </div>
                    </td>
                    <td style={{ padding: "13px 12px" }}>{paper.subject}</td>
                    <td style={{ padding: "13px 12px" }}>{paper.year}</td>
                    <td style={{ padding: "13px 12px" }}>
                      <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "#0756a5", fontWeight: 700 }}>
                        Download PDF
                      </a>
                    </td>
                    <td style={{ padding: "13px 12px" }}>
                      {paper.solution_pdf_url ? (
                        <a href={paper.solution_pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: "#15803d", fontWeight: 700 }}>
                          Download Solution
                        </a>
                      ) : (
                        <span className="muted">Not Available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style jsx>{`
        .mobile-paper-list {
          display: none;
        }

        @media (max-width: 600px) {
          .mobile-paper-list {
            display: grid;
            gap: 12px;
          }

          .desktop-paper-table {
            display: none;
          }

          .mobile-paper-card {
            min-width: 0;
            padding: 16px;
            background: #fff;
            border: 1px solid #dbe3ed;
            border-radius: 10px;
            box-shadow: 0 2px 7px rgba(15, 35, 60, 0.06);
          }

          .mobile-paper-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 10px;
            color: #174b80;
            font-size: 16px;
            line-height: 1.4;
          }

          .mobile-paper-heading span {
            flex: 0 0 auto;
            padding: 3px 8px;
            border-radius: 6px;
            background: #edf4fb;
            color: #173f68;
            font-size: 13px;
            font-weight: 700;
          }

          .mobile-paper-meta {
            display: grid;
            gap: 5px;
            margin-top: 9px;
            color: #64748b;
            font-size: 13px;
            overflow-wrap: anywhere;
          }

          .mobile-paper-meta span + span::before {
            content: "";
          }

          .mobile-paper-actions {
            display: grid;
            grid-template-columns: 1fr;
            gap: 8px;
            margin-top: 14px;
          }

          .paper-download {
            display: flex;
            min-height: 43px;
            align-items: center;
            justify-content: center;
            padding: 10px 12px;
            border-radius: 7px;
            text-align: center;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
          }

          .paper-download.primary {
            background: #173f68;
            color: #fff;
          }

          .paper-download.secondary {
            border: 1px solid #15803d;
            background: #f0fdf4;
            color: #15803d;
          }

          .solution-unavailable {
            color: #64748b;
            font-size: 13px;
          }
        }
      `}</style>
    </>
  );
}
