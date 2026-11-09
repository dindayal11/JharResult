import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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
    const fontSize = Math.max(18, Math.min(34, Math.min(width, height) * 0.055));
    const centerSize = Math.max(22, Math.min(42, Math.min(width, height) * 0.075));
    const label = "JharResult";
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const centerWidth = font.widthOfTextAtSize(label, centerSize);

    // Repeated diagonal marks make the watermark visible even if a page is cropped.
    const horizontalGap = Math.max(150, textWidth + 95);
    const verticalGap = Math.max(105, fontSize * 4.2);
    for (let y = -height; y <= height * 2; y += verticalGap) {
      for (let x = -width; x <= width * 2; x += horizontalGap) {
        page.drawText(label, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.42, 0.42, 0.42),
          opacity: 0.22,
          rotate: { type: "degrees", angle: -30 },
        });
      }
    }

    // A slightly stronger center mark provides clear brand identification.
    page.drawText(label, {
      x: Math.max(8, (width - centerWidth) / 2),
      y: Math.max(8, (height - centerSize) / 2),
      size: centerSize,
      font,
      color: rgb(0.38, 0.38, 0.38),
      opacity: 0.28,
    });
  }
  return Buffer.from(await document.save({ useObjectStreams: true }));
}

async function storePdfRemotely(bytes: Buffer) {
  const secret = process.env.FILE_API_SECRET;
  if (!secret) throw new Error("FILE_API_SECRET is not configured in the Web App environment.");

  const body = new FormData();
  body.append("file", new File([new Uint8Array(bytes)], `jharresult-${Date.now()}.pdf`, { type: "application/pdf" }));

  const response = await fetch("https://files.jharresult.in/api/v1/upload.php", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body,
    signal: AbortSignal.timeout(60000),
    cache: "no-store",
  });

  const result = await response.json().catch(() => null) as { ok?: boolean; url?: string; id?: string; error?: string } | null;
  if (!response.ok || !result?.ok || !result.url) {
    console.error("Persistent PDF storage rejected upload:", response.status, result?.error);
    throw new Error(result?.error || `Persistent storage returned HTTP ${response.status}`);
  }
  return { url: result.url, id: result.id };
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

    const stored = await storePdfRemotely(watermarked);
    return NextResponse.json({ ok: true, url: stored.url, file_id: stored.id, size: watermarked.length, watermarked: true, storage: "persistent" });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("PDF upload error:", error);
    const message = error?.message === "FILE_API_SECRET is not configured in the Web App environment."
      ? "Persistent file storage is not configured. Add FILE_API_SECRET in Hostinger Web App environment variables."
      : "Could not process or save PDF to persistent storage. Please try again.";
    return NextResponse.json({ error: unauthorized ? "Please sign in as admin." : message }, { status: unauthorized ? 401 : 502 });
  }
}
