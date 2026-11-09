"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function EditPreviousPaperPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [paper, setPaper] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfMode, setPdfMode] = useState<"upload" | "link">("upload");

  useEffect(() => {
    fetch(`/api/admin/previous-papers/${id}`).then(async r => {
      const d = await r.json(); if (!r.ok) throw new Error(d.error); setPaper(d.paper);
    }).catch(e => setError(e.message || "Could not load paper."));
  }, [id]);

  async function upload(file: File) {
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/previous-papers/upload", { method: "POST", body: fd });
    const d = await r.json(); if (!r.ok) throw new Error(d.error || "PDF upload failed."); return d.url as string;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const fd = new FormData(e.currentTarget);
      const pdfFile = fd.get("pdf_file") as File;
      const link = String(fd.get("pdf_link") || "").trim();
      const solutionFile = fd.get("solution_file") as File;
      let pdf = paper.pdf_url;
      if (pdfMode === "upload" && pdfFile?.size) {
        if (link) throw new Error("Choose either PDF upload or PDF link, not both.");
        pdf = await upload(pdfFile);
      } else if (pdfMode === "link" && link) {
        if (pdfFile?.size) throw new Error("Choose either PDF upload or PDF link, not both.");
        pdf = link;
      }
      const solution = solutionFile?.size ? await upload(solutionFile) : paper.solution_pdf_url || "";
      const payload = { title: fd.get("title"), exam_name: fd.get("exam_name"), course: fd.get("course"), stream: fd.get("stream"), subject: fd.get("subject"), year: Number(fd.get("year")), semester: fd.get("semester"), description: fd.get("description"), pdf_url: pdf, solution_pdf_url: solution, status: fd.get("status") };
      const r = await fetch(`/api/admin/previous-papers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Update failed.");
      router.push("/admin/previous-papers"); router.refresh();
    } catch (e: any) { setError(e.message || "Could not update paper."); }
    finally { setLoading(false); }
  }

  if (error && !paper) return <main className="container" style={{ padding: "30px 0" }}><p style={{ color: "#dc2626" }}>{error}</p><Link href="/admin/previous-papers">Back</Link></main>;
  if (!paper) return <main className="container" style={{ padding: "30px 0" }}>Loading paper...</main>;
  const input: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 5, marginTop: 6, background: "#fff" };
  const label: React.CSSProperties = { display: "block", fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#263449" };

  return <main className="container" style={{ padding: "30px 0", maxWidth: 850 }}>
    <Link href="/admin/previous-papers" style={{ color: "#0756a5" }}>← Manage Previous Papers</Link><h1 style={{ margin: "12px 0 18px" }}>Edit Previous Year Paper</h1>
    <form className="panel" onSubmit={submit} style={{ padding: 22 }}>
      <label style={label}>Paper Title *<input name="title" required defaultValue={paper.title} style={input} /></label>
      <label style={label}>Exam Name *<input name="exam_name" required defaultValue={paper.exam_name} style={input} /></label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
        <label style={label}>Course<input name="course" defaultValue={paper.course || ""} style={input} /></label>
        <label style={label}>Stream / Branch<input name="stream" defaultValue={paper.stream || ""} style={input} /></label>
        <label style={label}>Subject *<input name="subject" required defaultValue={paper.subject} style={input} /></label>
        <label style={label}>Year *<input name="year" type="number" min="1950" max="2100" required defaultValue={paper.year} style={input} /></label>
        <label style={label}>Semester<input name="semester" defaultValue={paper.semester || ""} style={input} /></label>
      </div>
      <label style={label}>Description<textarea name="description" rows={3} defaultValue={paper.description || ""} style={{ ...input, resize: "vertical" }} /></label>
      <div style={label}>
        Replace Question Paper PDF
        <p style={{ margin: "6px 0", fontWeight: 400 }}>Current PDF: <a href={paper.pdf_url} target="_blank" rel="noreferrer">View PDF</a>. Leave both replacement fields empty to keep it.</p>
        <div style={{ display: "flex", gap: 18, margin: "10px 0 12px", flexWrap: "wrap" }}>
          <label style={{ fontWeight: 500 }}><input type="radio" name="pdf_mode" checked={pdfMode === "upload"} onChange={() => setPdfMode("upload")} /> Upload replacement</label>
          <label style={{ fontWeight: 500 }}><input type="radio" name="pdf_mode" checked={pdfMode === "link"} onChange={() => setPdfMode("link")} /> Replace with link</label>
        </div>
        {pdfMode === "upload" ? <input name="pdf_file" type="file" accept=".pdf,application/pdf" style={input} /> : <input name="pdf_link" type="url" placeholder="https://example.com/question-paper.pdf" style={input} />}
        <small style={{ fontWeight: 400, color: "#64748b" }}>Choose one replacement method. A direct public HTTPS PDF link is saved as-is; it is not copied to JharResult storage.</small>
      </div>
      <label style={label}>Replace Solution PDF (optional)<input name="solution_file" type="file" accept=".pdf,application/pdf" style={input} /><small>{paper.solution_pdf_url ? <a href={paper.solution_pdf_url} target="_blank" rel="noreferrer">View current solution</a> : "No solution uploaded."} Leave empty to keep it.</small></label>
      <label style={label}>Publication Status<select name="status" defaultValue={paper.status} style={input}><option value="draft">Draft</option><option value="published">Published</option></select></label>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      <button disabled={loading} type="submit" style={{ padding: "11px 20px", border: 0, borderRadius: 5, background: "#0756a5", color: "#fff", fontWeight: 600, cursor: "pointer" }}>{loading ? "Saving..." : "Save Changes"}</button>
    </form>
  </main>;
}
