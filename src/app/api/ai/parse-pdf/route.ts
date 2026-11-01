import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

// Import the parser implementation directly. The package's top-level
// index.js contains a test-only block that tries to read a missing PDF
// during Next.js production build when webpack bundles the route.
const pdf = require("pdf-parse/lib/pdf-parse.js") as (
  dataBuffer: Buffer
) => Promise<{ text: string }>;

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const data = await req.formData();
    const file = data.get("file");

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Upload a PDF file." },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF must be smaller than 8 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);

    if (!parsed.text.trim()) {
      return NextResponse.json(
        {
          error:
            "No selectable text found. Scanned PDFs need OCR and are not supported in this version.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ text: parsed.text.slice(0, 60000) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const unauthorized = message === "UNAUTHORIZED";

    return NextResponse.json(
      {
        error: unauthorized ? "Please sign in." : "PDF extraction failed.",
      },
      { status: unauthorized ? 401 : 400 }
    );
  }
}
