import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import { getPublishedPosts } from "@/lib/posts";
import { getPool } from "@/lib/db";
import type { Metadata, Viewport } from "next";

// export const viewport: Viewport = {
//   width: 1200,
//   initialScale: 1,
// };

export const metadata: Metadata = { alternates: { canonical: "/" } };

export const dynamic = "force-dynamic";

type CategoryLink = { name: string; slug: string };

function isRecentlyPublished(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const publishedAt = new Date(value).getTime();
  const age = Date.now() - publishedAt;
  // Allow a small future clock skew between the database and app server.
  return Number.isFinite(publishedAt) && age >= -12 * 60 * 60 * 1000 && age <= 7 * 24 * 60 * 60 * 1000;
}

export default async function Home() {
  let posts: any[] = [];
  let categories: CategoryLink[] = [];
  let previousPapers: any[] = [];
  let dbError = false;

  try {
    const [published, categoryRows, paperRows] = await Promise.all([
      getPublishedPosts(100),
      getPool().query(
        "SELECT name, slug FROM categories WHERE is_active = 1 ORDER BY id ASC"
      ),
      getPool().query(
        `SELECT id, title, exam_name, course, stream, subject, year, semester, pdf_url
         FROM previous_year_papers
         WHERE status = 'published'
         ORDER BY year DESC, created_at DESC
         LIMIT 6`
      ),
    ]);
    posts = published;
    categories = (categoryRows[0] as CategoryLink[]) || [];
    previousPapers = paperRows[0] as any[];
    } catch (error) {
    console.error("Homepage database error:", error);
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
    // Admit Card updates are grouped under Latest Jobs on the homepage.
    .filter((category) => category.slug !== "admit-card")
    .map((category) => ({
      ...category,
      items: posts
        .filter((post) =>
          String(post.category_slugs || post.category_slug).split(",").includes(category.slug) ||
          (category.slug === "latest-jobs" && String(post.category_slugs || post.category_slug).split(",").includes("admit-card"))
        )
        .slice(0, 15),
      paperItems: category.slug === "previous-papers" ? previousPapers : [],
    }))
    .filter((group) => group.items.length > 0 || group.paperItems.length > 0)
    .slice(0, 6);

  const latest = posts.slice(0, 10);
  // Always duplicate the ticker sequence so even one newly published post slides.
  const shouldAnimateTicker = latest.length > 0;
  const tickerItems = shouldAnimateTicker ? [...latest, ...latest] : [];

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": "https://jharresult.in/#latest-updates",
            name: "Latest Jharkhand Jobs, Results & Education Updates",
            url: "https://jharresult.in/",
            isPartOf: { "@id": "https://jharresult.in/#website" },
            mainEntity: {
              "@type": "ItemList",
              itemListOrder: "https://schema.org/ItemListOrderDescending",
              numberOfItems: latest.length,
              itemListElement: latest.map((post, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "NewsArticle",
                  headline: post.title,
                  url: `https://jharresult.in/post/${encodeURIComponent(post.slug)}`
                }
              }))
            }
          }).replace(/</g, "\\u003c")
        }}
      />


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
          <h1 style={{ margin: "0 0 8px", color: "#17365d", fontSize: "clamp(22px, 3vw, 30px)", lineHeight: 1.2 }}>
            Jhar Result – Jharkhand Latest Jobs, Results, Admit Cards &amp; Online Quiz
          </h1>
          <p style={{ maxWidth: 850, margin: "0 auto 14px", color: "#596579", lineHeight: 1.65 }}>
            Find the latest Jharkhand government job notifications, JAC and JSSC results, admit cards, answer keys, admissions, scholarships and free online MCQ practice on JharResult.
          </p>
          <form action="/search" method="GET" style={{ display: "flex", gap: 8, maxWidth: 760, margin: "0 auto" }}>
            <input className="search" type="search" name="q" placeholder="Search jobs, results, updates..." aria-label="Search updates" style={{ border: "1px solid #d8dee8", borderRadius: 4 }} />
            <button className="btn" type="submit" style={{ borderRadius: 4 }}>Search</button>
          </form>
        </section>
        <nav aria-label="Important JharResult sections" className="home-important-links" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 9, margin: "0 0 18px", padding: "12px", background: "#f4f8fc", border: "1px solid #dce7f2", borderRadius: 6 }}>
          <strong style={{ color: "#173f68", marginRight: 4 }}>Explore:</strong>
          {categories.slice(0, 10).map((category) => (
            <a key={category.slug} href={`/category/${encodeURIComponent(category.slug)}`} style={{ display: "inline-flex", padding: "7px 11px", borderRadius: 5, background: "#fff", border: "1px solid #d7e1ec", color: "#174b80", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
              {category.name}
            </a>
          ))}
          <a href="/quiz" style={{ display: "inline-flex", padding: "7px 11px", borderRadius: 5, background: "#fff", border: "1px solid #d7e1ec", color: "#174b80", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Online Quiz</a>
          <a href="/previous-year-papers" style={{ display: "inline-flex", padding: "7px 11px", borderRadius: 5, background: "#fff", border: "1px solid #d7e1ec", color: "#174b80", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Previous Year Papers</a>
        </nav>

        
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
      Join Our Channels
    </strong>
  
  </div>

  
<div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
<a
  className="social-channel-btn social-channel-telegram"
  href="https://t.me/+_hj11IZ9nktjOWM1"
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
<a
  className="social-channel-btn social-channel-whatsapp"
  href="https://whatsapp.com/channel/0029VbEFu6NJuyAHGXVzvS0n"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Join JharResult WhatsApp Channel"
  style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 18px",
    background: "#25D366",
    color: "#fff",
    borderRadius: 5,
    fontWeight: 700,
    fontSize: 14,
    textDecoration: "none",
    whiteSpace: "nowrap",
  }}
>
  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M20.2 3.8A11.5 11.5 0 0 0 2.1 17.6L.8 23.2l5.7-1.3A11.5 11.5 0 0 0 20.2 3.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M8.1 7.2c-.3-.7-.7-.7-1-.7h-.8c-.3 0-.8.1-1.1.6-.4.4-1.4 1.3-1.4 3.1s1.4 3.5 1.6 3.7c.2.3 2.7 4.2 6.5 5.7 3.2 1.3 3.8 1 4.5.9.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.6.2-1.8-.1-.2-.4-.3-.8-.5l-2.5-1.2c-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.5-.2.3-.4.3-.8.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.6.1-.3 0-.5 0-.7L8.1 7.2Z" fill="currentColor" />
  </svg>
  Join WhatsApp
</a>
</div>

</section>


        <section className="home-quiz-promos" aria-label="JAC Board Online Quiz">
          <div className="home-quiz-promo-grid">
            <a href="/quiz" className="home-quiz-promo home-quiz-promo-10">
              <span className="home-quiz-promo-glow" aria-hidden="true" />
              <span className="home-quiz-promo-top"><span className="home-quiz-promo-tag">JAC BOARD • CLASS 10</span><span className="new-badge">NEW</span><span className="home-quiz-promo-icon" aria-hidden="true">✦</span></span>
              <span className="home-quiz-promo-title">Class 10th<br />Online Quiz</span>
              <span className="home-quiz-promo-bottom"><span>Chapter-wise MCQ Practice</span><strong>Start Practice <span aria-hidden="true">→</span></strong></span>
              <span className="home-quiz-promo-number" aria-hidden="true">10</span>
            </a>
            <a href="/quiz" className="home-quiz-promo home-quiz-promo-12">
              <span className="home-quiz-promo-glow" aria-hidden="true" />
              <span className="home-quiz-promo-top"><span className="home-quiz-promo-tag">JAC BOARD • CLASS 12</span><span className="new-badge">NEW</span><span className="home-quiz-promo-icon" aria-hidden="true">✦</span></span>
              <span className="home-quiz-promo-title">Class 12th<br />Online Quiz</span>
              <span className="home-quiz-promo-bottom"><span>Chapter-wise MCQ Practice</span><strong>Start Practice <span aria-hidden="true">→</span></strong></span>
              <span className="home-quiz-promo-number" aria-hidden="true">12</span>
            </a>
            <a href="/quiz" className="home-quiz-promo home-quiz-promo-competitive">
              <span className="home-quiz-promo-glow" aria-hidden="true" />
              <span className="home-quiz-promo-top"><span className="home-quiz-promo-tag">JHARKHAND • COMPETITIVE EXAMS</span><span className="home-quiz-promo-icon" aria-hidden="true">✦</span></span>
              <span className="home-quiz-promo-title">Competitive<br />Exam Practice</span>
              <span className="home-quiz-promo-bottom"><span>JSSC • JPSC • JTET • Police</span><strong>Explore Exams <span aria-hidden="true">→</span></strong></span>
              <span className="home-quiz-promo-number" aria-hidden="true">EX</span>
            </a>
          </div>
        </section>

        {dbError && (
          <div className="panel" style={{ marginBottom: 18, color: "#9b2c2c" }}>
            Updates could not be loaded right now. Please check the database connection.
          </div>
        )}

        <div className="home-main" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
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
                      {group.paperItems.map((paper: any) => (
                        <div key={`paper-${paper.id}`} style={{ padding: "10px 0", borderBottom: "1px dashed #dce2e9" }}>
                          <a href="/previous-year-papers" style={{ color: "#174b80", fontSize: 14, fontWeight: 700, lineHeight: 1.45 }}>{paper.title}</a>
                          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                            {[paper.exam_name, paper.course, paper.stream, paper.semester].filter(Boolean).join(" • ")}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 6, fontSize: 12 }}>
                            <span>{paper.subject} • {paper.year}</span>
                          </div>
                        </div>
                      ))}
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
        .home-quiz-promos{margin:0 0 15px}
        .home-quiz-promo-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .home-quiz-promo{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:space-between;gap:9px;min-height:112px;overflow:hidden;padding:11px 14px;border:1px solid #ffffff55;border-radius:13px;color:#fff;text-decoration:none;box-shadow:0 7px 18px #173f681c;transition:transform .2s ease,box-shadow .2s ease}
        .home-quiz-promo:hover{transform:translateY(-3px);box-shadow:0 13px 25px #173f682b;color:#fff}
        .home-quiz-promo-10{background:linear-gradient(115deg,#123e91 0%,#2563eb 55%,#4388f5 100%)}
        .home-quiz-promo-12{background:linear-gradient(115deg,#075c48 0%,#0d966b 55%,#22b879 100%)}
        .home-quiz-promo-competitive{background:linear-gradient(115deg,#59308e 0%,#7546bb 55%,#9567dc 100%)}
        .home-quiz-promo:before{content:"";position:absolute;z-index:-1;width:190px;height:190px;right:-48px;top:-95px;border:1px solid #ffffff35;border-radius:50%;box-shadow:0 0 0 18px #ffffff0c,0 0 0 38px #ffffff0a,0 0 0 60px #ffffff08}
        .home-quiz-promo-glow{position:absolute;z-index:-1;width:130px;height:130px;right:48px;bottom:-105px;border-radius:50%;background:#ffffff22;filter:blur(5px)}
        .home-quiz-promo-top,.home-quiz-promo-bottom{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .home-quiz-promo-top .new-badge{margin-left:auto;flex:0 0 auto}.home-quiz-promo-tag{display:inline-flex;align-items:center;padding:6px 9px;border:1px solid #ffffff55;border-radius:5px;background:#ffffff18;color:#fff;font-size:10px;font-weight:900;letter-spacing:1px}
        .home-quiz-promo-icon{display:grid;place-items:center;width:24px;height:24px;border:1px solid #ffffff55;border-radius:50%;background:#ffffff18;font-size:15px}
        .home-quiz-promo-title{position:relative;z-index:1;font-size:clamp(17px,2vw,22px);font-weight:900;line-height:1.08;letter-spacing:-.5px;text-shadow:0 2px 8px #001b4533}
        .home-quiz-promo-bottom{flex-wrap:wrap;color:#eaf2ff;font-size:11px;font-weight:600}
        .home-quiz-promo-bottom strong{display:inline-flex;align-items:center;gap:9px;padding:6px 9px;border:1px solid #ffffff70;border-radius:6px;background:#ffffff20;color:#fff;font-size:11px;white-space:nowrap}
        .home-quiz-promo-bottom strong span{font-size:16px;line-height:10px;transition:transform .2s}
        .home-quiz-promo:hover .home-quiz-promo-bottom strong span{transform:translateX(3px)}
        .home-quiz-promo-number{position:absolute;z-index:-1;right:14px;bottom:-27px;color:#ffffff13;font-size:82px;font-weight:900;line-height:1;letter-spacing:-8px;pointer-events:none}
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .update-row { display:flex; gap:8px; align-items:flex-start; padding:10px 0; border-bottom:1px dashed #dce2e9; }
        .update-bullet { color:#e07b22; font-weight:900; }
        .update-copy { min-width:0; flex:1; }
        .update-title { color:#174b80; font-size:14px; font-weight:700; line-height:1.45; }
        .update-meta { color:#748093; font-size:11px; margin-top:4px; }
        .verified { color:#197348; font-size:10px; font-weight:700; }
        .ticker-track:hover { animation-play-state: paused !important; }
        @media(max-width:900px) { .home-quiz-promo-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.home-category-grid { grid-template-columns:repeat(2, minmax(0, 1fr)) !important; } }
        @media(max-width:600px) { .home-quiz-promo-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.home-quiz-promo{min-height:118px;padding:9px 7px;gap:7px;border-radius:9px}.home-quiz-promo-tag{font-size:7px;letter-spacing:.2px;padding:4px 5px}.home-quiz-promo-icon{display:none}.home-quiz-promo-top .new-badge{font-size:8px;padding:2px 4px}.home-quiz-promo-title{font-size:clamp(11px,3.1vw,15px);line-height:1.12;letter-spacing:-.2px}.home-quiz-promo-bottom{font-size:8px;gap:4px}.home-quiz-promo-bottom strong{font-size:8px;padding:5px 5px;gap:3px}.home-quiz-promo-bottom strong span{font-size:11px}.home-quiz-promo-number{font-size:48px;right:5px;bottom:-16px}.home-category-grid { grid-template-columns:repeat(2, minmax(0, 1fr)) !important; gap:10px !important; } }
      `}</style>
    </>
  );
}
