import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { q = "", from = "", to = "" } = await searchParams;
  const search = q.trim();
  const conditions: string[] = [];
  const values: string[] = [];

  if (search) {
    conditions.push("(title LIKE ? OR slug LIKE ? OR organization LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    conditions.push("DATE(COALESCE(published_at, created_at)) >= ?");
    values.push(from);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    conditions.push("DATE(COALESCE(published_at, created_at)) <= ?");
    values.push(to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getPool().execute(
    `SELECT id,title,slug,status,verification_status,created_at,published_at
     FROM posts ${where}
     ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?`,
    [...values, search || from || to ? 500 : 100]
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
          <form action="/api/admin/logout" method="post" style={{ display: "inline" }}>
            <button className="btn" style={{ background: "#34465d" }}>
              Logout
            </button>
          </form>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 22, overflowX: "auto" }}>
        <h2>Manage Posts</h2>
        <form
          action="/admin"
          method="GET"
          style={{
            display: "flex",
            alignItems: "end",
            gap: 8,
            flexWrap: "wrap",
            margin: "12px 0 18px",
          }}
        >
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search by title, slug or organization..."
            aria-label="Search posts"
            style={{
              flex: "1 1 250px",
              minWidth: 0,
              padding: "11px 12px",
              border: "1px solid #b9c5d3",
              borderRadius: 5,
              fontSize: 14,
            }}
          />
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#34445a" }}>
            From date
            <input type="date" name="from" defaultValue={from} style={{ padding: "9px", border: "1px solid #b9c5d3", borderRadius: 5 }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#34445a" }}>
            To date
            <input type="date" name="to" defaultValue={to} style={{ padding: "9px", border: "1px solid #b9c5d3", borderRadius: 5 }} />
          </label>
          <button className="btn" type="submit">Apply Filters</button>
          {(search || from || to) && (
            <Link className="btn" href="/admin" style={{ background: "#64748b" }}>
              Clear
            </Link>
          )}
        </form>

        <p className="muted" style={{ margin: "0 0 10px" }}>
          {(search || from || to)
            ? `Filtered posts: ${(rows as any[]).length} result(s). Date filter uses publish date, or creation date for drafts.`
            : "Showing the 100 most recent posts. Use search or date filters to find older posts."}
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th align="left">Title</th>
              <th>Date</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #e6eaf0" }}>
                <td style={{ padding: "12px 6px" }}>{p.title}</td>
                <td style={{ whiteSpace: "nowrap", padding: "8px 6px" }}>
                  {p.published_at || p.created_at
                    ? new Date(p.published_at || p.created_at).toLocaleDateString("en-IN")
                    : "—"}
                </td>
                <td>{p.status}</td>
                <td>{p.verification_status}</td>
                <td>
                  <Link href={`/admin/posts/${p.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
            {(rows as any[]).length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 18, textAlign: "center" }}>
                  No posts found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
