import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    $schema: "https://modelcontextprotocol.io/schemas/server-card.json",
    name: "JharResult",
    title: "JharResult Public Information",
    description: "Public information portal for Jharkhand government jobs, results, admit cards, answer keys, admissions, scholarships and previous year question papers.",
    version: "1.0.0",
    websiteUrl: "https://jharresult.in/",
    contact: { email: "dindayal8456@gmail.com" },
    endpoints: [{ url: "https://jharresult.in/", transport: "https" }],
    capabilities: { tools: false, resources: false, prompts: false },
  }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
