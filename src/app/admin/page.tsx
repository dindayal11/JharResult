import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string; category?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const { q = "", from = "", to = "", category = "" } = await searchParams;
  const search = q.trim();
  const conditions: string[] = [];
  const values: (string | number)[] = [];

  const [categoryRows] = await getPool().query(
    "SELECT id, name FROM categories WHERE is_active = 1 ORDER BY name ASC"
  );
  const categories = categoryRows as { id: number; name: string }[];
  const selectedCategoryId = /^\d+$/.test(category) &&
    categories.some((item) => item.id === Number(category))
      ? Number(category)
      : null;

  if (search) {
    conditions.push("(title LIKE ? OR slug LIKE ? OR organization LIKE ?)");
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (selectedCategoryId !== null) {
    conditions.push("(category_id = ? OR id IN (SELECT post_id FROM post_categories WHERE category_id = ?))");
    values.push(selectedCategoryId, selectedCategoryId);
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
    `SELECT id,title,slug,status,verification_status,created_at,published_at,scheduled_at
     FROM posts ${where}
     ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?`,
    [...values, search || from || to || selectedCategoryId !== null ? 500 : 100]
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

      <section
        className="panel"
        style={{
          marginTop: 22,
          padding: 20,
          border: "1px solid #dce4ee",
          borderRadius: 12,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: "#172b4d" }}>Manage Posts</h2>
            <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: 13 }}>Search, filter and manage your published and draft posts.</p>
          </div>
          <span style={{ padding: "6px 11px", borderRadius: 20, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 700 }}>
            {(rows as any[]).length} posts loaded
          </span>
        </div>
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
            Category
            <select name="category" defaultValue={selectedCategoryId === null ? "" : String(selectedCategoryId)} style={{ minWidth: 165, padding: "10px", border: "1px solid #b9c5d3", borderRadius: 5, background: "#fff" }}>
              <option value="">All Categories</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#34445a" }}>
            From date
            <input type="date" name="from" defaultValue={from} style={{ padding: "9px", border: "1px solid #b9c5d3", borderRadius: 5 }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 12, fontWeight: 700, color: "#34445a" }}>
            To date
            <input type="date" name="to" defaultValue={to} style={{ padding: "9px", border: "1px solid #b9c5d3", borderRadius: 5 }} />
          </label>
          <button className="btn" type="submit">Apply Filters</button>
          {(search || from || to || selectedCategoryId !== null) && (
            <Link className="btn" href="/admin" style={{ background: "#64748b" }}>
              Clear
            </Link>
          )}
        </form>

        <p className="muted" style={{ margin: "0 0 10px", fontSize: 12 }}>
          {(search || from || to || selectedCategoryId !== null)
            ? `Filtered posts: ${(rows as any[]).length} result(s). Date filter uses publish date, or creation date for drafts.`
            : "Showing the 100 most recent posts. Use search or date filters to find older posts."}
        </p>

        <div
          style={{
            maxHeight: 560,
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: 9,
            background: "#fff",
          }}
        >
        <table style={{ width: "100%", minWidth: 720, borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 2, background: "#f1f5f9" }}>
            <tr>
              <th align="left" style={{ padding: "12px 14px", background: "#f1f5f9", color: "#334155" }}>Post Title</th>
              <th style={{ padding: "12px 10px", background: "#f1f5f9", color: "#334155" }}>Date</th>
              <th style={{ padding: "12px 10px", background: "#f1f5f9", color: "#334155" }}>Status</th>
              <th style={{ padding: "12px 10px", background: "#f1f5f9", color: "#334155" }}>Verification</th>
              <th style={{ padding: "12px 14px", background: "#f1f5f9", color: "#334155" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(rows as any[]).map((p) => (
              <tr key={p.id} style={{ borderTop: "1px solid #e6eaf0" }}>
                <td style={{ padding: "12px 14px", maxWidth: 420, color: "#172b4d", fontWeight: 600, lineHeight: 1.45 }}>{p.title}</td>
                <td style={{ whiteSpace: "nowrap", padding: "10px", color: "#64748b" }}>
                  {p.published_at || p.created_at
                    ? new Date(p.published_at || p.created_at).toLocaleDateString("en-IN")
                    : "—"}
                </td>
                <td style={{ padding: "10px" }}>
                  <span style={{ display: "inline-block", padding: "4px 9px", borderRadius: 20, background: p.status === "published" ? "#dcfce7" : p.status === "scheduled" ? "#dbeafe" : "#fef3c7", color: p.status === "published" ? "#166534" : p.status === "scheduled" ? "#1d4ed8" : "#92400e", fontSize: 11, fontWeight: 700 }}>
                    {p.status === "scheduled" ? `Scheduled${p.scheduled_at ? ` · ${new Date(p.scheduled_at).toLocaleString("en-IN")}` : ""}` : p.status}
                  </span>
                </td>
                <td style={{ padding: "10px", color: "#475569" }}>{p.verification_status || "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  <Link href={`/admin/posts/${p.id}`} style={{ display: "inline-block", padding: "6px 12px", borderRadius: 6, background: "#eaf2ff", color: "#1d4ed8", fontWeight: 700, textDecoration: "none" }}>Edit</Link>
                </td>
              </tr>
            ))}
            {(rows as any[]).length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 28, textAlign: "center", color: "#64748b" }}>
                  No posts found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </section>
    </main>
  );
}
