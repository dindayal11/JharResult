import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import { getPool } from "@/lib/db";
import type { Viewport } from "next";

// export const viewport: Viewport = {
//   width: 1200,
//   initialScale: 1,
// };

export const dynamic = "force-dynamic";

type CategoryLink = { name: string; slug: string };

function isRecentlyPublished(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const publishedAt = new Date(value).getTime();
  const age = Date.now() - publishedAt;
  return Number.isFinite(publishedAt) && age >= 0 && age <= 7 * 24 * 60 * 60 * 1000;
}

export default async function Home() {
  let posts: any[] = [];
  let categories: CategoryLink[] = [];
  let dbError = false;

  try {
    const [published, categoryRows] = await Promise.all([
      getPublishedPosts(100),
      getPool().query(
        "SELECT name, slug FROM categories WHERE is_active = 1 ORDER BY id ASC"
      ),
    ]);
    posts = published;
    categories = (categoryRows[0] as CategoryLink[]) || [];
  } catch {
    dbError = true;
  }

  // If category lookup is unavailable, derive groups from published posts.
  if (!categories.length && posts.length) {
    const seen = new Set<string>();
    categories = posts
      .filter((post) => {
        if (!post.category_slug || seen.has(post.category_slug)) return false;
        seen.add(post.category_slug);
        return true;
      })
      .map((post) => ({ name: post.category_name, slug: post.category_slug }));
  }

  // Hide category sections that do not contain published posts.
  const populatedGroups = categories
    .map((category) => ({
      ...category,
      items: posts
        .filter((post) => post.category_slug === category.slug)
        .slice(0, 15),
    }))
    .filter((group) => group.items.length > 0)
    .slice(0, 6);

  const latest = posts.slice(0, 10);
  // Always duplicate the ticker sequence so even one newly published post slides.
  const shouldAnimateTicker = latest.length > 0;
  const tickerItems = shouldAnimateTicker ? [...latest, ...latest] : [];

  return (
    <>
      <SiteHeader />

      {latest.length > 0 && (
        <div className="container">
          <div className="ticker" style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0", background: "#fff", border: "1px solid #e6eaf0", overflow: "hidden" }}>
            <b style={{ background: "#c62828", color: "#fff", padding: "11px 14px", whiteSpace: "nowrap" }}>BREAKING</b>
            <div className="ticker-window" style={{ overflowX: "hidden", flex: 1, minWidth: 0 }}>
              <div className="ticker-track" style={{ display: "flex", gap: 22, width: "max-content", whiteSpace: "nowrap", animation: shouldAnimateTicker ? "ticker-scroll 28s linear infinite" : "none" }}>
                {tickerItems.map((post, index) => (
                  <a key={`${post.id}-${index}`} href={`/post/${post.slug}`} style={{ padding: "10px 0", color: "#174b80", fontWeight: 700 }}>
                    {post.title}{isRecentlyPublished(post.published_at) && <span className="new-badge new-badge-ticker">NEW</span>}<span style={{ color: "#e07b22", margin: "0 10px" }}>◆</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container" style={{ padding: "18px 0 36px" }}>
        <section className="intro panel" style={{ borderRadius: 4, marginBottom: 18, textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 30px)", margin: "4px 0 10px", color: "#17365d" }}>
            Jharkhand Latest Jobs, Results &amp; Education Updates
          </h1>
          <p style={{ margin: "0 auto 16px", maxWidth: 760, lineHeight: 1.6 }}>
            JAC, JSSC, JPSC, JTET, Jharkhand Police, Scholarships, Admit Cards aur sabhi important updates ek hi jagah.
          </p>
          <form action="/search" method="GET" style={{ display: "flex", gap: 8, maxWidth: 650, margin: "0 auto" }}>
            <input className="search" type="search" name="q" placeholder="Search jobs, results, admit cards..." aria-label="Search updates" style={{ border: "1px solid #d8dee8", borderRadius: 4 }} />
            <button className="btn" type="submit" style={{ borderRadius: 4 }}>Search</button>
          </form>
        </section>

        
<section
  style={{
    marginBottom: 18,
    padding: "13px 16px",
    background: "#eaf5ff",
    border: "1px solid #c8e4fa",
    borderRadius: 5,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  }}
>
  <div>
    <strong style={{ color: "#174b80", fontSize: 16 }}>
      Join Our Telegram Channel
    </strong>
  
  </div>

  
<a
  href="YOUR_TELEGRAM_CHANNEL_LINK"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Join JharResult Telegram Channel"
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 18px",
    background: "#229ED9",
    color: "#fff",
    borderRadius: 5,
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    whiteSpace: "nowrap",
  }}
>
  <svg
    width="23"
    height="23"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M22 2 2.8 9.5c-1.3.5-1.3 1.2-.2 1.5l4.9 1.5 1.9 6c.2.7.1 1 .8 1 .5 0 .8-.2 1.1-.5l2.8-2.7 5.8 4.3c1.1.6 1.9.3 2.2-1L24 3.5C24.3 2 23.4 1.3 22 2ZM9.2 12.2 20 5.4c.5-.3 1-.1.6.3l-8.9 8-.4 4.1-2.1-5.6Z" />
  </svg>
  Join Telegram
</a>

</section>


        {dbError && (
          <div className="panel" style={{ marginBottom: 18, color: "#9b2c2c" }}>
            Updates could not be loaded right now. Please check the database connection.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(220px, 1fr)", gap: 18, alignItems: "start" }}>
          <div>
            {populatedGroups.length > 0 ? (
              <div className="home-category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
                {populatedGroups.map((group) => (
                  <section className="panel" key={group.slug} style={{ borderRadius: 4, padding: 0, overflow: "hidden" }}>
                    <h2 style={{ margin: 0, padding: "11px 14px", background: "#173f68", color: "#fff", fontSize: 18 }}>
                      <a href={`/category/${group.slug}`}>{group.name}</a>
                    </h2>
                    <div style={{ padding: "4px 14px" }}>
                      {group.items.map((post) => <PostCard key={post.id} post={post} />)}
                    </div>
                    <div style={{ padding: "8px 14px", borderTop: "1px solid #e6eaf0", textAlign: "right" }}>
                      <a href={`/category/${group.slug}`} style={{ color: "#174b80", fontWeight: 700, fontSize: 13 }}>View All »</a>
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <section className="panel" style={{ borderRadius: 4 }}>
                <h2 style={{ marginTop: 0, color: "#17365d" }}>Latest Updates</h2>
                <p className="muted">Abhi koi update publish nahi hua hai. Admin panel se naya update publish karne par yahan dikhai dega.</p>
              </section>
            )}
          </div>

        </div>
      </main>

      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .update-row { display:flex; gap:8px; align-items:flex-start; padding:10px 0; border-bottom:1px dashed #dce2e9; }
        .update-bullet { color:#e07b22; font-weight:900; }
        .update-copy { min-width:0; flex:1; }
        .update-title { color:#174b80; font-size:14px; font-weight:700; line-height:1.45; }
        .update-meta { color:#748093; font-size:11px; margin-top:4px; }
        .verified { color:#197348; font-size:10px; font-weight:700; }
        .ticker-track:hover { animation-play-state: paused !important; }
        @media(max-width:900px) { .home-category-grid { grid-template-columns:repeat(2, minmax(0, 1fr)) !important; } }
        @media(max-width:600px) { .home-category-grid { grid-template-columns:1fr !important; } }
      `}</style>
    </>
  );
}
