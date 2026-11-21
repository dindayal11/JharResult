import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const value = await request.json();
    const endpoint = String(value?.endpoint || "");
    const p256dh = String(value?.keys?.p256dh || "");
    const auth = String(value?.keys?.auth || "");
    let endpointHost = "";
    try { endpointHost = new URL(endpoint).hostname.toLowerCase(); } catch {}
    const trustedPushHost = endpointHost === "fcm.googleapis.com" || endpointHost.endsWith(".push.services.mozilla.com") || endpointHost === "push.services.mozilla.com" || endpointHost === "web.push.apple.com" || endpointHost === "notify.windows.com" || endpointHost.endsWith(".notify.windows.com");
    if (!endpoint.startsWith("https://") || !trustedPushHost || !p256dh || !auth || endpoint.length > 2048) {
      return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
    }
    await getPool().execute(
      "INSERT INTO push_subscriptions (endpoint, subscription_json, user_agent) VALUES (?,?,?) ON DUPLICATE KEY UPDATE subscription_json=VALUES(subscription_json), user_agent=VALUES(user_agent), updated_at=CURRENT_TIMESTAMP",
      [endpoint, JSON.stringify({ endpoint, keys: { p256dh, auth } }), request.headers.get("user-agent")?.slice(0, 500) || null]
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Could not save notification subscription." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const value = await request.json();
    const endpoint = String(value?.endpoint || "");
    if (!endpoint.startsWith("https://")) return NextResponse.json({ error: "Invalid endpoint." }, { status: 400 });
    await getPool().execute("DELETE FROM push_subscriptions WHERE endpoint=?", [endpoint]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not remove notification subscription." }, { status: 500 });
  }
}
