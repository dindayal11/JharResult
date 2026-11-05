
"use client";

import { useMemo, useState } from "react";

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
        <div className="panel" style={{ padding: 0, overflowX: "auto" }}>
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
                    <th
                      key={heading}
                      align="left"
                      style={{ padding: "13px 12px" }}
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredPapers.map((paper) => (
                <tr
                  key={paper.id}
                  style={{ borderBottom: "1px solid #e6eaf0" }}
                >
                  <td style={{ padding: "13px 12px" }}>
                    <strong style={{ color: "#174b80" }}>{paper.title}</strong>
                    <div className="muted" style={{ fontSize: 12, marginTop: 5 }}>
                      {paper.exam_name}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {[paper.course, paper.stream, paper.semester]
                        .filter(Boolean)
                        .join(" • ")}
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
                      <a
                        href={paper.solution_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#15803d", fontWeight: 700 }}
                      >
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
      )}

      <style jsx>{`
        @media (max-width: 600px) {
          .panel {
            min-width: 0;
          }
        }
      `}</style>
    </>
  );
}
