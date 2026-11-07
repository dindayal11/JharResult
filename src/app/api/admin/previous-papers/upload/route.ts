import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_PAGES = 300;
const MAX_OUTPUT_SIZE = 25 * 1024 * 1024;

async function applyWatermark(input: Buffer) {
  const document = await PDFDocument.load(input, { updateMetadata: false });
  const pages = document.getPages();
  if (!pages.length || pages.length > MAX_PAGES) throw new Error("PDF_PAGE_LIMIT");

  const font = await document.embedFont(StandardFonts.HelveticaBold);
  for (const page of pages) {
    const { width, height } = page.getSize();
    const fontSize = Math.max(18, Math.min(48, Math.min(width, height) * 0.085));
    const label = "JharResult";
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    page.drawText(label, {
      x: Math.max(8, (width - textWidth) / 2),
      y: Math.max(8, (height - fontSize) / 2),
      size: fontSize,
      font,
      color: rgb(0.48, 0.48, 0.48),
      opacity: 0.16,
    });
  }
  return Buffer.from(await document.save({ useObjectStreams: true }));
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Please select a PDF file." }, { status: 400 });
    if (!file.name.toLowerCase().endsWith(".pdf") || (file.type && file.type !== "application/pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed." }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "PDF must be between 1 byte and 20 MB." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") return NextResponse.json({ error: "Invalid PDF file." }, { status: 400 });

    let watermarked: Buffer;
    try {
      watermarked = await applyWatermark(bytes);
    } catch (error: any) {
      if (error?.message === "PDF_PAGE_LIMIT") return NextResponse.json({ error: `PDF must contain between 1 and ${MAX_PAGES} pages.` }, { status: 400 });
      return NextResponse.json({ error: "This PDF is damaged, encrypted, or cannot be processed. Please upload an unlocked PDF." }, { status: 400 });
    }

    if (watermarked.length > MAX_OUTPUT_SIZE) return NextResponse.json({ error: "The processed PDF is too large. Please upload a smaller PDF." }, { status: 400 });

    const directory = path.join(process.cwd(), "public", "uploads", "previous-papers");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}.pdf`;
    await writeFile(path.join(directory, filename), watermarked, { flag: "wx" });

    return NextResponse.json({ ok: true, url: `/uploads/previous-papers/${filename}`, filename, size: watermarked.length, watermarked: true });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("PDF upload error:", error);
    return NextResponse.json({ error: unauthorized ? "Please sign in as admin." : "Could not upload and watermark PDF." }, { status: unauthorized ? 401 : 500 });
  }
}
