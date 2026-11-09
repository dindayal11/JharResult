"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewPreviousPaperPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pdfMode, setPdfMode] = useState<"upload" | "link">("upload");

  async function uploadPDF(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/admin/previous-papers/upload", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "PDF upload failed.");
    return result.url as string;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const form = e.currentTarget;
      const data = new FormData(form);
      const questionFile = data.get("pdf_file");
      const link = String(data.get("pdf_link") || "").trim();
      const solutionFile = data.get("solution_file");

      let pdfUrl = "";
      if (pdfMode === "upload") {
        if (!(questionFile instanceof File) || questionFile.size === 0) throw new Error("Please select the question paper PDF.");
        if (link) throw new Error("Choose either PDF upload or PDF link, not both.");
        pdfUrl = await uploadPDF(questionFile);
      } else {
        if (!link) throw new Error("Please enter the question paper PDF link.");
        if (questionFile instanceof File && questionFile.size > 0) throw new Error("Choose either PDF upload or PDF link, not both.");
        pdfUrl = link;
      }

      let solutionPdfUrl = "";
      if (solutionFile instanceof File && solutionFile.size > 0) solutionPdfUrl = await uploadPDF(solutionFile);

      const payload = {
        title: String(data.get("title") || ""), exam_name: String(data.get("exam_name") || ""),
        course: String(data.get("course") || ""), stream: String(data.get("stream") || ""),
        subject: String(data.get("subject") || ""), year: Number(data.get("year")),
        semester: String(data.get("semester") || ""), description: String(data.get("description") || ""),
        pdf_url: pdfUrl, solution_pdf_url: solutionPdfUrl, status: String(data.get("status") || "draft"),
      };
      const response = await fetch("/api/admin/previous-papers", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save paper.");
      setMessage("Previous year paper saved successfully!");
      form.reset(); setPdfMode("upload");
      router.refresh();
    } catch (err: any) { setError(err.message || "Something went wrong."); }
    finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 12px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 14, marginTop: 6, background: "#fff" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, color: "#263449", marginBottom: 15 };

  return (
    <main className="container" style={{ padding: "30px 0", maxWidth: 850 }}>
      <div style={{ marginBottom: 22 }}>
        <a href="/admin" style={{ color: "#0756a5", fontSize: 14 }}>← Back to Admin Dashboard</a>
        <h1 style={{ margin: "12px 0 5px", fontSize: 27 }}>Upload Previous Year Paper</h1>
        <p style={{ color: "#64748b", fontSize: 14 }}>Add question papers for students. Solution PDF is optional.</p>
      </div>
      <form onSubmit={handleSubmit} className="panel" style={{ padding: 22 }}>
        <label style={labelStyle}>Paper Title *<input name="title" required placeholder="e.g. B.Tech CSE Mathematics 2025" style={inputStyle} /></label>
        <label style={labelStyle}>Exam Name *<input name="exam_name" required placeholder="e.g. JBIT University Examination" style={inputStyle} /></label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 15 }}>
          <label style={labelStyle}>Course<input name="course" placeholder="e.g. B.Tech" style={inputStyle} /></label>
          <label style={labelStyle}>Stream / Branch<input name="stream" placeholder="e.g. Computer Science" style={inputStyle} /></label>
          <label style={labelStyle}>Subject *<input name="subject" required placeholder="e.g. Digital Electronics" style={inputStyle} /></label>
          <label style={labelStyle}>Year *<input name="year" type="number" min="1950" max="2100" defaultValue={new Date().getFullYear()} required style={inputStyle} /></label>
          <label style={labelStyle}>Semester<input name="semester" placeholder="e.g. Semester 3" style={inputStyle} /></label>
        </div>
        <label style={labelStyle}>Description<textarea name="description" rows={4} placeholder="Write a short description about this question paper..." style={{ ...inputStyle, resize: "vertical" }} /></label>

        <div style={labelStyle}>
          Question Paper PDF *
          <div style={{ display: "flex", gap: 18, margin: "10px 0 12px", flexWrap: "wrap" }}>
            <label style={{ fontWeight: 500 }}><input type="radio" name="pdf_mode" checked={pdfMode === "upload"} onChange={() => setPdfMode("upload")} /> Upload PDF</label>
            <label style={{ fontWeight: 500 }}><input type="radio" name="pdf_mode" checked={pdfMode === "link"} onChange={() => setPdfMode("link")} /> PDF Link</label>
          </div>
          {pdfMode === "upload" ? (
            <input name="pdf_file" type="file" accept=".pdf,application/pdf" required style={inputStyle} />
          ) : (
            <input name="pdf_link" type="url" required placeholder="https://example.com/question-paper.pdf" style={inputStyle} />
          )}
          <small style={{ color: "#64748b", fontWeight: 400 }}>
            {pdfMode === "upload" ? "Upload a PDF file. Maximum file size: 20 MB." : "Paste a direct public HTTPS link to the PDF. The link will be used by the existing Download PDF button; no copy is stored on JharResult."}
          </small>
        </div>

        <label style={labelStyle}>Solution PDF (Optional)<input name="solution_file" type="file" accept=".pdf,application/pdf" style={inputStyle} /><small style={{ color: "#64748b", fontWeight: 400 }}>Upload solutions if available. Maximum file size: 20 MB.</small></label>
        <label style={labelStyle}>Publication Status<select name="status" defaultValue="draft" style={inputStyle}><option value="draft">Draft</option><option value="published">Published</option></select></label>
        {error && <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>}
        {message && <p style={{ color: "#15803d", fontSize: 14 }}>{message}</p>}
        <button type="submit" disabled={loading} style={{ padding: "12px 22px", border: 0, borderRadius: 5, background: loading ? "#64748b" : "#0756a5", color: "#fff", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Uploading & Saving..." : "Save Previous Year Paper"}</button>
      </form>
    </main>
  );
}
