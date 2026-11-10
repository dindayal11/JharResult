import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

const headers = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, MCP-Protocol-Version",
};

function rpc(id: unknown, result: unknown) {
  return NextResponse.json({ jsonrpc: "2.0", id, result }, { headers });
}

function rpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 200, headers });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers });
}

export async function GET() {
  return new NextResponse("MCP Streamable HTTP endpoint. Send JSON-RPC requests using POST.", {
    status: 405,
    headers: { ...headers, Allow: "POST, OPTIONS" },
  });
}

export async function POST(request: NextRequest) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, "Parse error");
  }

  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return rpcError(body?.id ?? null, -32600, "Invalid Request");
  }

  const id = body.id;
  if (body.method === "notifications/initialized" || body.method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202, headers });
  }

  if (body.method === "initialize") {
    return rpc(id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "jharresult-public", title: "JharResult Public Information", version: "1.0.0" },
      instructions: "Search public JharResult updates about Jharkhand jobs, results and education. Verify important dates and eligibility with the official notification.",
    });
  }

  if (body.method === "ping") return rpc(id, {});

  if (body.method === "tools/list") {
    return rpc(id, {
      tools: [{
        name: "search_jharresult_updates",
        description: "Search publicly published Jharkhand government jobs, results, admit cards, answer keys, admissions and education updates on JharResult.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string", description: "Search words or phrase." } },
          required: ["query"],
          additionalProperties: false,
        },
      }],
    });
  }

  if (body.method === "tools/call") {
    const name = body.params?.name;
    const query = String(body.params?.arguments?.query || "").trim().slice(0, 100);
    if (name !== "search_jharresult_updates") return rpcError(id, -32602, "Unknown tool");
    if (query.length < 2) return rpc(id, { isError: true, content: [{ type: "text", text: "Enter at least two characters." }] });

    try {
      const like = `%${query}%`;
      const [rows] = await getPool().execute(
        `SELECT DISTINCT p.title, p.slug, p.short_description, p.published_at,
                c.name AS category_name
         FROM posts p
         JOIN categories c ON c.id = p.category_id
         LEFT JOIN post_categories pc ON pc.post_id = p.id
         WHERE p.status = 'published'
           AND (p.title LIKE ? OR p.short_description LIKE ? OR p.organization LIKE ?)
         ORDER BY p.published_at DESC
         LIMIT 10`,
        [like, like, like]
      );
      const results = (rows as any[]).map((post) => ({
        title: post.title,
        description: String(post.short_description || "").replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 400),
        category: post.category_name,
        publishedAt: post.published_at,
        url: `https://jharresult.in/post/${encodeURIComponent(post.slug)}`,
      }));
      return rpc(id, { content: [{ type: "text", text: JSON.stringify({ query, count: results.length, results }) }] });
    } catch {
      return rpc(id, { isError: true, content: [{ type: "text", text: "Search is temporarily unavailable." }] });
    }
  }

  if (id === undefined) return new NextResponse(null, { status: 202, headers });
  return rpcError(id, -32601, "Method not found");
}
