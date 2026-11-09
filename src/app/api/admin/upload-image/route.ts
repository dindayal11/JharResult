import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
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
  // Font-independent vector lettering avoids missing-font boxes on Linux hosts.
  const glyphs: Record<string, string[]> = {
    J: ["00111","00010","00010","00010","10010","10010","01100"],
    H: ["10001","10001","10001","11111","10001","10001","10001"],
    A: ["01110","10001","10001","11111","10001","10001","10001"],
    R: ["11110","10001","10001","11110","10100","10010","10001"],
    E: ["11111","10000","10000","11110","10000","10000","11111"],
    S: ["01111","10000","10000","01110","00001","00001","11110"],
    U: ["10001","10001","10001","10001","10001","10001","01110"],
    L: ["10000","10000","10000","10000","10000","10000","11111"],
    T: ["11111","00100","00100","00100","00100","00100","00100"],
  };
  const word = "JHARRESULT";
  const wordPath = (centerX: number, centerY: number, height: number) => {
    const cell = height / 7;
    const advance = cell * 6;
    const totalWidth = (word.length * 6 - 1) * cell;
    const left = centerX - totalWidth / 2;
    const top = centerY - height / 2;
    const parts: string[] = [];
    [...word].forEach((letter, index) => {
      glyphs[letter].forEach((row, rowIndex) => {
        [...row].forEach((bit, columnIndex) => {
          if (bit === "1") {
            const x = left + index * advance + columnIndex * cell;
            const y = top + rowIndex * cell;
            parts.push(`M${x.toFixed(2)} ${y.toFixed(2)}h${cell.toFixed(2)}v${cell.toFixed(2)}h-${cell.toFixed(2)}Z`);
          }
        });
      });
    });
    return parts.join("");
  };

  const patternHeight = Math.max(18, Math.min(30, Math.min(width, pageHeight) * 0.045));
  const centerHeight = Math.max(24, Math.min(42, Math.min(width, pageHeight) * 0.065));
  const totalHeight = pageHeight * pages;
  const labels = Array.from({ length: pages }, (_, index) =>
    `<path d="${wordPath(width / 2, index * pageHeight + pageHeight / 2, centerHeight)}" fill="#555555" fill-opacity="0.18"/>`
  ).join("");
  const pattern = `<defs><pattern id="watermark" width="420" height="240" patternUnits="userSpaceOnUse" patternTransform="rotate(-28)"><path d="${wordPath(210, 120, patternHeight)}" fill="#666666" fill-opacity="0.14"/></pattern></defs><rect width="${width}" height="${totalHeight}" fill="url(#watermark)"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}">${pattern}${labels}</svg>`);
}

async function storeImageRemotely(bytes: Buffer, filename: string, mime: string) {
  const secret = process.env.FILE_API_SECRET;
  if (!secret) throw new Error("FILE_API_SECRET is not configured in the Web App environment.");

  const body = new FormData();
  body.append("file", new File([new Uint8Array(bytes)], filename, { type: mime }));

  const response = await fetch("https://files.jharresult.in/api/v1/upload.php", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body,
    signal: AbortSignal.timeout(60000),
    cache: "no-store",
  });

  const result = await response.json().catch(() => null) as { ok?: boolean; url?: string; error?: string } | null;
  if (!response.ok || !result?.ok || !result.url) {
    console.error("Persistent image storage rejected upload:", response.status, result?.error);
    throw new Error(result?.error || `Persistent storage returned HTTP ${response.status}`);
  }
  return result.url;
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

    const filename = `jharresult-${Date.now()}${extension}`;
    const url = await storeImageRemotely(watermarked, filename, file.type);

    return NextResponse.json({ ok: true, url, size: watermarked.length, watermarked: true, watermark: "JharResult", storage: "persistent" });
  } catch (error: any) {
    const unauthorized = error?.message === "UNAUTHORIZED";
    console.error("Image upload error:", error);
    const message = error?.message === "FILE_API_SECRET is not configured in the Web App environment."
      ? "Persistent file storage is not configured. Add FILE_API_SECRET in Hostinger Web App environment variables."
      : "Could not process or save image to persistent storage. Please try again.";
    return NextResponse.json({ error: unauthorized ? "Please sign in." : message }, { status: unauthorized ? 401 : 502 });
  }
}
