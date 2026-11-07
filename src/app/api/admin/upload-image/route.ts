import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function matchesSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (type === "image/webp") return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  if (type === "image/gif") return ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
  return false;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Please select an image." }, { status: 400 });

    const extension = EXTENSIONS[file.type];
    if (!extension) return NextResponse.json({ error: "Only JPG, PNG, WEBP and GIF images are allowed." }, { status: 400 });
    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) return NextResponse.json({ error: "Image must be between 1 byte and 5 MB." }, { status: 400 });

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!matchesSignature(file.type, bytes)) return NextResponse.json({ error: "The image file content does not match its selected file type." }, { status: 400 });

    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(path.join(directory, filename), bytes, { flag: "wx" });

    return NextResponse.json({ ok: true, url: `/uploads/${filename}`, size: bytes.length, optimized: file.type === "image/webp" });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("Image upload error:", error);
    return NextResponse.json({ error: unauthorized ? "Please sign in." : "Could not upload image. Please try again." }, { status: unauthorized ? 401 : 500 });
  }
}
