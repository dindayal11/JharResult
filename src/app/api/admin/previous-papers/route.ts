import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

function isAllowedPdfUrl(value: string) {
  if (value.startsWith("/uploads/previous-papers/")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    const title = String(body.title || "").trim();
    const examName = String(body.exam_name || "").trim();
    const course = String(body.course || "").trim();
    const stream = String(body.stream || "").trim();
    const subject = String(body.subject || "").trim();
    const year = Number(body.year);
    const semester = String(body.semester || "").trim();
    const description = String(body.description || "").trim();
    const pdfUrl = String(body.pdf_url || "").trim();
    const solutionPdfUrl = String(body.solution_pdf_url || "").trim();
    const status = body.status === "published" ? "published" : "draft";

    if (!title || !examName || !subject || !pdfUrl) {
      return NextResponse.json(
        { error: "Title, exam name, subject and question paper PDF are required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
      return NextResponse.json(
        { error: "Please enter a valid year." },
        { status: 400 }
      );
    }

    if (
      !isAllowedPdfUrl(pdfUrl) ||
      (solutionPdfUrl && !isAllowedPdfUrl(solutionPdfUrl))
    ) {
      return NextResponse.json(
        { error: "Please provide a valid HTTPS PDF link or upload a PDF file." },
        { status: 400 }
      );
    }

    const [result]: any = await getPool().execute(
      `INSERT INTO previous_year_papers
      (title, exam_name, course, stream, subject, year, semester,
       description, pdf_url, solution_pdf_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        examName,
        course || null,
        stream || null,
        subject,
        year,
        semester || null,
        description || null,
        pdfUrl,
        solutionPdfUrl || null,
        status,
      ]
    );

    return NextResponse.json({
      ok: true,
      message: "Previous year paper saved successfully.",
      id: result.insertId,
    });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";

    console.error("Previous paper save error:", error);

    return NextResponse.json(
      {
        error: unauthorized
          ? "Please sign in as admin."
          : "Could not save previous year paper.",
      },
      { status: unauthorized ? 401 : 500 }
    );
  }
}