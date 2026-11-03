
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a PDF file." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "PDF must be between 1 byte and 20 MB." },
        { status: 400 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // Check actual PDF signature, not just the file extension.
    if (bytes.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return NextResponse.json(
        { error: "Invalid PDF file." },
        { status: 400 }
      );
    }

    const directory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "previous-papers"
    );

    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}.pdf`;
    const filepath = path.join(directory, filename);

    await writeFile(filepath, bytes, { flag: "wx" });

    return NextResponse.json({
      ok: true,
      url: `/uploads/previous-papers/${filename}`,
      filename,
    });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";

    return NextResponse.json(
      {
        error: unauthorized
          ? "Please sign in as admin."
          : "Could not upload PDF.",
      },
      { status: unauthorized ? 401 : 500 }
    );
  }
}
