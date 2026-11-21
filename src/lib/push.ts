import { createCipheriv, createECDH, hkdfSync, randomBytes } from "node:crypto";
import { importJWK, SignJWT } from "jose";
import { getPool } from "@/lib/db";

type PushSubscription = { endpoint: string; keys: { p256dh: string; auth: string } };

function decode(value: string) { return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64"); }
function encode(value: Buffer) { return value.toString("base64url"); }

function vapidKeys() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  if (!publicKey || !privateKey) throw new Error("Web Push VAPID keys are not configured.");
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(decode(privateKey));
  const point = ecdh.getPublicKey(undefined, "uncompressed");
  return { publicKey, privateKey, x: encode(point.subarray(1, 33)), y: encode(point.subarray(33, 65)) };
}

async function authorization(endpoint: string) {
  const keys = vapidKeys();
  const origin = new URL(endpoint).origin;
  const jwk = { kty: "EC", crv: "P-256", d: encode(decode(keys.privateKey)), x: keys.x, y: keys.y };
  const key = await importJWK(jwk, "ES256");
  const token = await new SignJWT({}).setProtectedHeader({ alg: "ES256" }).setAudience(origin).setSubject(process.env.VAPID_SUBJECT || "mailto:admin@jharresult.in").setExpirationTime("12h").sign(key);
  return `vapid t=${token}, k=${keys.publicKey}`;
}

function encryptPayload(subscription: PushSubscription, payload: string) {
  const clientPublic = decode(subscription.keys.p256dh);
  const authSecret = decode(subscription.keys.auth);
  const server = createECDH("prime256v1");
  server.generateKeys();
  const serverPublic = server.getPublicKey(undefined, "uncompressed");
  const sharedSecret = server.computeSecret(clientPublic);
  const authPrk = Buffer.from(hkdfSync("sha256", sharedSecret, authSecret, Buffer.from("Content-Encoding: auth\\0"), 32));
  const keyInfo = Buffer.concat([Buffer.from("WebPush: info\\0"), clientPublic, serverPublic]);
  const ikm = Buffer.from(hkdfSync("sha256", authPrk, Buffer.alloc(0), keyInfo, 32));
  const salt = randomBytes(16);
  const cek = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\\0"), 16));
  const nonce = Buffer.from(hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\\0"), 12));
  const cipher = createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const header = Buffer.alloc(21);
  salt.copy(header, 0);
  header.writeUInt32BE(4096, 16);
  header[20] = serverPublic.length;
  return Buffer.concat([header, serverPublic, encrypted]);
}

export async function sendPushToAll(payload: { title: string; body: string; url: string; tag?: string }) {
  const [rows]: any = await getPool().query("SELECT endpoint, subscription_json FROM push_subscriptions");
  let sent = 0, failed = 0;
  await Promise.all((rows as any[]).map(async (row) => {
    try {
      const subscription = JSON.parse(row.subscription_json) as PushSubscription;
      const body = encryptPayload(subscription, JSON.stringify(payload));
      const response = await fetch(subscription.endpoint, {
        method: "POST",
        headers: {
          Authorization: await authorization(subscription.endpoint),
          "Content-Type": "application/octet-stream",
          "Content-Encoding": "aes128gcm",
          "Content-Length": String(body.length),
          TTL: "86400",
          Urgency: "normal",
        },
        body,
      });
      if (response.status === 404 || response.status === 410) {
        await getPool().execute("DELETE FROM push_subscriptions WHERE endpoint=?", [row.endpoint]);
      }
      if (response.ok) sent++; else failed++;
    } catch (error) {
      failed++;
      console.error("Push delivery failed:", error);
    }
  }));
  return { sent, failed, total: rows.length };
}

export async function sendPostNotification(post: { title: string; slug: string; short_description?: string | null }, kind: "new_post" | "post_update" | "manual") {
  const bodyText = String(post.short_description || "Open JharResult to read the complete update.")
    .replace(/<[^>]*>/g, " ").replace(/\\s+/g, " ").trim().slice(0, 135);
  const result = await sendPushToAll({
    title: kind === "new_post" ? "New on JharResult" : kind === "post_update" ? "Post Updated" : "JharResult Update",
    body: `${post.title} — ${bodyText}`.slice(0, 180),
    url: `/post/${encodeURIComponent(post.slug)}`,
    tag: `jharresult-${post.slug}`,
  });
  await getPool().execute(
    "INSERT INTO push_notification_logs (post_slug, notification_type, sent_count, failed_count) VALUES (?,?,?,?)",
    [post.slug, kind, result.sent, result.failed]
  );
  return result;
}
