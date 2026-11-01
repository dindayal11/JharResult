import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select an image." },
        { status: 400 }
      );
    }

    const extension = EXTENSIONS[file.type];

    if (!extension) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP and GIF images are allowed." },
        { status: 400 }
      );
    }

    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be between 1 byte and 5 MB." },
        { status: 400 }
      );
    }

    const directory = path.join(process.cwd(), "public", "uploads");

    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });

    return NextResponse.json({
      ok: true,
      url: `/uploads/${filename}`,
    });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";

    return NextResponse.json(
      {
        error: unauthorized ? "Please sign in." : "Could not upload image.",
      },
      { status: unauthorized ? 401 : 500 }
    );
  }
}