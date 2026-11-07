import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

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

function watermarkSvg(width: number, pageHeight: number, pages: number) {
  const fontSize = Math.max(18, Math.min(width, pageHeight) * 0.085);
  const totalHeight = pageHeight * pages;
  const labels = Array.from({ length: pages }, (_, index) =>
    `<text x="${width / 2}" y="${index * pageHeight + pageHeight / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="#777777" fill-opacity="0.16">JharResult</text>`
  ).join("");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}">${labels}</svg>`);
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

    const metadata = await sharp(bytes, { animated: true, limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.width || !metadata.height || metadata.width > 12000 || metadata.height > 12000) {
      return NextResponse.json({ error: "Image dimensions are not supported." }, { status: 400 });
    }

    const pages = Math.max(1, metadata.pages || 1);
    const pageHeight = metadata.pageHeight || metadata.height;
    if (pages > 100 || pageHeight * pages > 80_000_000) {
      return NextResponse.json({ error: "This image has too many frames or pixels." }, { status: 400 });
    }

    const rotated = [5, 6, 7, 8].includes(metadata.orientation || 0);
    const outputWidth = rotated ? pageHeight : metadata.width;
    const outputPageHeight = rotated ? metadata.width : pageHeight;
    const overlay = watermarkSvg(outputWidth, outputPageHeight, pages);
    const pipeline = sharp(bytes, { animated: true, limitInputPixels: 40_000_000 })
      .rotate()
      .composite([{ input: overlay, blend: "over" }]);

    const watermarked = file.type === "image/jpeg"
      ? await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer()
      : file.type === "image/png"
        ? await pipeline.png({ compressionLevel: 8 }).toBuffer()
        : file.type === "image/webp"
          ? await pipeline.webp({ quality: 88 }).toBuffer()
          : await pipeline.gif().toBuffer();

    const directory = path.join(process.cwd(), "public", "uploads");
    await mkdir(directory, { recursive: true });
    const filename = `${randomUUID()}${extension}`;
    await writeFile(path.join(directory, filename), watermarked, { flag: "wx" });

    return NextResponse.json({ ok: true, url: `/uploads/${filename}`, size: watermarked.length, watermarked: true, watermark: "JharResult" });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("Image upload error:", error);
    return NextResponse.json({ error: unauthorized ? "Please sign in." : "Could not process and watermark image. Please try another file." }, { status: unauthorized ? 401 : 500 });
  }
}
