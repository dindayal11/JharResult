import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  html: z.string().min(1).max(20000),
  direction: z.enum(["hi-en", "en-hi"]),
});

function cleanTranslatedHtml(value: string) {
  return value
    .replace(/```(?:html)?/gi, "")
    .replace(/```/g, "")
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/<(\/?)([a-zA-Z0-9]+)(?:\s[^>]*)?>/g, (tag, slash, name) => {
      const allowed = ["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "blockquote"];
      const lower = String(name).toLowerCase();
      return allowed.includes(lower) ? `<${slash}${lower}>` : "";
    })
    .trim();
}

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const { html, direction } = requestSchema.parse(await req.json());
    if (!process.env.AI_API_KEY) {
      return NextResponse.json(
        { error: "AI_API_KEY is not configured in .env.local." },
        { status: 503 }
      );
    }

    const sourceLanguage = direction === "hi-en" ? "Hindi/Hinglish" : "English";
    const targetLanguage = direction === "hi-en" ? "natural English" : "natural Hindi";
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const isGemini = baseUrl.includes("generativelanguage.googleapis.com");
    const model = process.env.AI_TRANSLATE_MODEL || (isGemini ? "gemini-3.8-flash" : process.env.AI_MODEL || "gpt-4o-mini");
    const response = await fetch(
      `${(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `Translate the supplied post description from ${sourceLanguage} to ${targetLanguage}. The source may be Hinglish written in Roman letters, Hindi in Devanagari, or a mixture of Hindi and English. Understand the intended meaning and translate the Hindi/Hinglish portions into fluent, natural English; do not simply copy Roman Hindi words. For English-to-Hindi, use natural, readable Hindi in Devanagari. Preserve the exact meaning, facts, dates, names, numbers, URLs and formatting. Do not add or remove information. The input may contain HTML: preserve its structure and tags, but do not add attributes, scripts, styles or links. Return only the translated HTML/content, with no markdown fences or explanation.`,
            },
            { role: "user", content: html },
          ],
        }),
      }
    );

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      console.error("Description translation provider error:", response.status, detail);
      return NextResponse.json(
        { error: `Translation provider error (${response.status}). Check AI provider key, model, quota and base URL.` },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const translated = payload.choices?.[0]?.message?.content;
    if (typeof translated !== "string" || !translated.trim()) {
      return NextResponse.json(
        { error: "AI provider returned an empty translation." },
        { status: 502 }
      );
    }

    return NextResponse.json({ html: cleanTranslatedHtml(translated) });
  } catch (error: any) {
    const message = error?.name === "TimeoutError"
      ? "Translation timed out. Please try again."
      : error?.message === "UNAUTHORIZED"
        ? "Please sign in again."
        : error?.message || "Translation failed.";
    return NextResponse.json(
      { error: message },
      { status: error?.message === "UNAUTHORIZED" ? 401 : 400 }
    );
  }
}
