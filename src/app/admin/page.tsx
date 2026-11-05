
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const [rows] = await getPool().query(
    "SELECT id,title,slug,status,verification_status,created_at FROM posts ORDER BY created_at DESC LIMIT 100"
  );

  return (
    <main className="container" style={{ padding: "30px 0" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <a className="brand" href="/">
            JHAR<span>RESULT</span>
          </a>
          <h1>Admin Dashboard</h1>
          <p className="muted">Signed in as {session.email}</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="btn" href="/admin/categories">
            Manage Categories
          </Link>

          <Link className="btn" href="/admin/posts/new">
            + Create Post
          </Link>

          <Link
            className="btn"
            href="/admin/previous-papers/new"
            style={{ background: "#15803d" }}
          >
            + Previous Year Papers
          </Link>

          <Link className="btn" href="/admin/previous-papers">
            Manage Papers
          </Link>

          <form
            action="/api/admin/logout"
            method="post"
            style={{ display: "inline" }}
          >
            <button className="btn" style={{ background: "#34465d" }}>
              Logout
            </button>
          </form>
        </div>
      </div>

      <div
        className="panel"
        style={{ marginTop: 22, overflowX: "auto" }}
      >
        <h2>Recent Posts</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14,
          }}
        >
          <thead>
            <tr>
              <th align="left">Title</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Open</th>
            </tr>
          </thead>

          <tbody>
            {(rows as any[]).map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #e6eaf0" }}>
                <td style={{ padding: "12px 6px" }}>{p.title}</td>
                <td>{p.status}</td>
                <td>{p.verification_status}</td>
                <td>
                  <Link href={`/admin/posts/${p.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
