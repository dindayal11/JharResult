import { NextResponse } from "next/server";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({
    "$schema": "https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json",
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: {
      name: "jharresult-public",
      title: "JharResult Public Information",
      version: "1.0.0"
    },
    description: "Read-only MCP server for searching publicly published Jharkhand government jobs, results, admit cards, answer keys, admissions and education updates on JharResult.",
    transport: {
      type: "streamable-http",
      endpoint: "https://jharresult.in/mcp"
    },
    capabilities: {
      tools: {}
    },
    authentication: {
      required: false,
      schemes: []
    },
    instructions: "Use search_jharresult_updates to search public JharResult updates. Verify time-sensitive information with the linked official notification.",
    tools: [{
      name: "search_jharresult_updates",
      description: "Search publicly published Jharkhand jobs, results, admit cards, answer keys, admissions and education updates.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search words or phrase." }
        },
        required: ["query"],
        additionalProperties: false
      }
    }]
  }, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
