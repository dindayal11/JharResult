
import SiteHeader from "@/components/SiteHeader";
import { getPostBySlug, getPublishedPosts, parseJson } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

function isRecentlyPublished(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const publishedAt = new Date(value).getTime();
  const age = Date.now() - publishedAt;
  return Number.isFinite(publishedAt) && age >= -12 * 60 * 60 * 1000 && age <= 7 * 24 * 60 * 60 * 1000;
}

function getAbsoluteImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;

  try {
    return new URL(value.trim(), "https://jharresult.in").toString();
  } catch {
    return undefined;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);

  const title = p?.seo_title || p?.title || "Update";
  const description = p?.seo_description || p?.short_description || "";
  const imageUrl = getAbsoluteImageUrl((p as any)?.image_url);
  const imageAlt = (p as any)?.image_title || p?.title || title;
  const publishedTime = p?.published_at
    ? new Date(p.published_at).toISOString()
    : undefined;
  const modifiedTime = (p as any)?.updated_at
    ? new Date((p as any).updated_at).toISOString()
    : publishedTime;

  return {
    title,
    description,
    alternates: { canonical: `/post/${encodeURIComponent(slug)}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime,
      modifiedTime,
      ...(imageUrl
        ? { images: [{ url: imageUrl, alt: imageAlt }] }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl ? { images: [{ url: imageUrl, alt: imageAlt }] } : {}),
    },
  };
}

function safeColor(value: any, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "")
    ? value
    : fallback;
}

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    ensp: " ",
    emsp: " ",
  };

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === "#") {
      const isHex = code[1]?.toLowerCase() === "x";
      const number = Number.parseInt(code.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      return Number.isFinite(number) && number >= 0 && number <= 0x10ffff
        ? String.fromCodePoint(number)
        : entity;
    }

    return named[code.toLowerCase()] ?? entity;
  });
}

function isEmpty(value: any) {
  return (
    value === null ||
    value === undefined ||
    value === "" ||
    value === "N/A" ||
    value === "n/a" ||
    (Array.isArray(value) && value.length === 0)
  );
}

function parseCustom(value: any): any[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed : [];
}

function CustomTable({ table }: { table: any }) {
  const primary = safeColor(
    table.theme_primary,
    "#173f70"
  );
  const accent = safeColor(
    table.theme_accent,
    "#e87920"
  );
  const background = safeColor(
    table.theme_background,
    "#ffffff"
  );
  const text = safeColor(
    table.theme_text,
    "#182638"
  );

  const columns = Array.isArray(table.columns)
    ? table.columns
    : [];

  const rows = Array.isArray(table.rows)
    ? table.rows
    : [];

  const visibleRows = rows
    .map((row: any, index: number) => ({ row, index }))
    .filter(({ row }: any) =>
      Array.isArray(row) &&
      row.some((cell: any) => !isEmpty(cell))
    );

  if (!table.title || !columns.length || !visibleRows.length) {
    return null;
  }

  return (
    <section
      className="detail-section"
      style={{
        borderColor: primary,
        minWidth: 0,
        background,
        color: text,
        gridColumn:
          table.layout_direction === "column"
            ? "1 / -1"
            : `span ${Math.min(
                3,
                Math.max(1, Number(table.layout_columns) || 2)
              )}`,
      }}
    >
      <h2 style={{ background: primary, color: "#fff", display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        {table.title}
        {(() => {
          const tableTimestamp = table.tableUpdatedAt ? new Date(table.tableUpdatedAt).getTime() : 0;
          const tableIsNew = Boolean(tableTimestamp && Date.now() >= tableTimestamp && Date.now() - tableTimestamp <= 7 * 24 * 60 * 60 * 1000);
          return tableIsNew ? (
            <span
              className="new-badge"
              title={`This table was added on ${new Date(table.tableUpdatedAt).toLocaleDateString("en-IN")}`}
              style={{ display: "inline-flex", verticalAlign: "middle" }}
            >
              NEW
            </span>
          ) : null;
        })()}
      </h2>

      {table.description && (
        <div
          className="table-description"
          style={{ padding: "12px 12px 0", lineHeight: 1.7, overflowWrap: "anywhere", color: text }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(String(table.description), {
              ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "p", "div", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "a", "blockquote"],
              ALLOWED_ATTR: ["style", "href", "target", "rel"],
              ALLOW_DATA_ATTR: false,
            }),
          }}
        />
      )}

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            color: text,
            fontSize: 14,
            background,
          }}
        >
          <thead>
            <tr>
              {columns.map((column: string, index: number) => (
                <th
                  key={index}
                  style={{
                    padding: "10px 9px",
                    textAlign: "left",
                    border: "1px solid #dce3ec",
                    background: accent,
                    color: "#ffffff",
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>

<tbody>
  {visibleRows.map(({ row, index: rowIndex }: { row: string[]; index: number }) => {
    const rowUpdatedAt = Array.isArray(table.rowUpdatedAt) ? table.rowUpdatedAt[rowIndex] : null;
    const rowTimestamp = rowUpdatedAt ? new Date(rowUpdatedAt).getTime() : 0;
    const rowIsNew = Boolean(rowTimestamp && Date.now() >= rowTimestamp && Date.now() - rowTimestamp <= 7 * 24 * 60 * 60 * 1000);
    return (
    <tr key={rowIndex}>
      {columns.map((column: string, colIndex: number) => {
        const value = decodeHtmlEntities(String(row[colIndex] ?? ""))
          .replace(/\\+(?=[<>])/g, "")
          .trim();

        // Detect a URL/email from the cell content, regardless of its heading.
        // Also support Markdown-style links pasted into a table cell.
        const markdownLink = value.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/i);
        const candidate = markdownLink ? markdownLink[2] : value;
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate);
        const isWebsite = /^https?:\/\/\S+$/i.test(candidate);
        const href = isEmail
          ? `mailto:${candidate}`
          : isWebsite
            ? candidate
            : "";
        const linkLabel = markdownLink?.[1] || "Click Here ↗";

        return (
          <td
            key={colIndex}
            style={{
              padding: "10px 9px",
              border: "1px solid #dce3ec",
              verticalAlign: "top",
              whiteSpace: "pre-wrap",
            }}
          >
            {colIndex === 0 && rowIsNew && (
              <span
                className="new-badge"
                title={`This row was updated on ${new Date(rowUpdatedAt).toLocaleDateString("en-IN")}`}
                style={{ display: "inline-flex", verticalAlign: "middle", marginRight: 7, marginBottom: 5 }}
              >
                NEW
              </span>
            )}
            {/<[a-z][\s\S]*>/i.test(value) ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(value, {
                    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "p", "div", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "a", "blockquote"],
                    ALLOWED_ATTR: ["style", "href", "target", "rel"],
                    ALLOW_DATA_ATTR: false,
                  }),
                }}
              />
            ) : href ? (
              <a
                href={href}
                target={isEmail ? undefined : "_blank"}
                rel={isEmail ? undefined : "noopener noreferrer"}
                style={{ color: "#145da0", fontWeight: 600, textDecoration: "underline" }}
              >
                Click Here ↗
              </a>
            ) : (
              value || "—"
            )}
          </td>
        );
      })}
    </tr>
    );
  })}
</tbody>
        </table>
      </div>
    </section>
  );
}

function TextSection({
  title,
  value,
  primary,
}: {
  title: string;
  value: any;
  primary: string;
}) {
  if (isEmpty(value)) return null;

  return (
    <section
      className="detail-section"
      style={{ borderColor: primary, gridColumn: "1 / -1" }}
    >
      <h2 style={{ background: primary, color: "#fff" }}>
        {title}
      </h2>

      <div
        style={{ padding: "0 12px 12px", lineHeight: 1.7, overflowWrap: "anywhere" }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(String(value), {
            ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "p", "div", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "a", "blockquote"],
            ALLOWED_ATTR: ["style", "href", "target", "rel"],
            ALLOW_DATA_ATTR: false,
          }),
        }}
      />
    </section>
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPostBySlug(slug);

  if (!p) notFound();

  const tickerPosts = await getPublishedPosts(10);
  const tickerItems = tickerPosts.length ? [...tickerPosts, ...tickerPosts] : [];
  const latestPosts = tickerPosts
    .filter((post) => post.slug !== slug)
    .slice(0, 8);

  // Sanitize description HTML before rendering it.
  const safeDescription = p.short_description
    ? DOMPurify.sanitize(String(p.short_description), {
        ALLOWED_TAGS: [
          "b",
          "strong",
          "i",
          "em",
          "u",
          "p",
          "div",
          "br",
          "ul",
          "ol",
          "li",
          "span",
          "h2",
          "h3",
          "h4",
          "a",
          "blockquote",
        ],
        ALLOWED_ATTR: [
          "style",
          "href",
          "target",
          "rel",
        ],
        ALLOW_DATA_ATTR: false,
      })
    : "";

  const primary = "#173f70";
  const accent = "#e87920";
  const background = "#ffffff";
  const text = "#182638";

  let customTables = parseCustom(
    (p as any).custom_tables
  );

  // Backward compatibility for older posts.
  // Show the old fixed tables if custom tables are not available.
  if (!customTables.length) {
    const oldDefinitions = [
      ["Important Dates", p.important_dates],
      ["Application Fee", p.application_fee],
      ["Age Limit", p.age_limit],
      ["Vacancy Details", p.vacancy_details],
      ["Important Links", p.important_links],
      ["Frequently Asked Questions", p.faqs],
    ] as const;

    customTables = oldDefinitions.flatMap(([title, raw]) => {
      const data = parseJson(raw);

      if (isEmpty(data)) return [];

      const entries = Array.isArray(data)
        ? data
        : typeof data === "object"
          ? Object.entries(data).map(([k, v]) => ({
              label: k,
              value: v,
            }))
          : [{ label: title, value: data }];

      const rows = entries.map((item: any) => [
        String(
          item?.label ??
            item?.event ??
            item?.category ??
            item?.post ??
            item?.question ??
            ""
        ),
        String(
          item?.value ??
            item?.date ??
            item?.amount ??
            item?.age ??
            item?.vacancies ??
            item?.url ??
            item?.answer ??
            item ??
            ""
        ),
      ]);

      return [
        {
          title,
          columns: ["Details", "Information"],
          rows,
        },
      ];
    });
  }

  return (
    <>
      <SiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: p.title,
              description: p.seo_description || p.short_description || undefined,
              datePublished: p.published_at ? new Date(p.published_at).toISOString() : undefined,
              dateModified: (p as any).updated_at
                ? new Date((p as any).updated_at).toISOString()
                : p.published_at
                  ? new Date(p.published_at).toISOString()
                  : undefined,
              url: `https://jharresult.in/post/${encodeURIComponent(p.slug)}`,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://jharresult.in/post/${encodeURIComponent(p.slug)}`,
              },
              author: { "@id": "https://jharresult.in/#organization" },
              publisher: { "@id": "https://jharresult.in/#organization" },
              image: getAbsoluteImageUrl((p as any).image_url)
                ? [getAbsoluteImageUrl((p as any).image_url)]
                : undefined,
              inLanguage: "en-IN",
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://jharresult.in/",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: p.category_name,
                  item: `https://jharresult.in/category/${encodeURIComponent(p.category_slug)}`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: p.title,
                  item: `https://jharresult.in/post/${encodeURIComponent(p.slug)}`,
                },
              ],
            },
          ]).replace(/</g, "\\u003c"),
        }}
      />

      {tickerItems.length > 0 && (
        <div className="container">
          <div className="ticker" style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0", background: "#fff", border: "1px solid #e6eaf0", overflow: "hidden" }}>
            <b style={{ background: "#c62828", color: "#fff", padding: "11px 14px", whiteSpace: "nowrap" }}>BREAKING</b>
            <div className="ticker-window" style={{ overflowX: "hidden", flex: 1, minWidth: 0 }}>
              <div className="ticker-track" style={{ display: "flex", gap: 22, width: "max-content", whiteSpace: "nowrap", animation: "ticker-scroll 28s linear infinite" }}>
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

      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track:hover { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) { .ticker-track { animation: none !important; } }
        @media (max-width: 760px) {
          .post-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .article-summary {
          margin: 18px 0;
          padding: 15px 17px;
          border: 1px solid #dce3ec;
          border-left: 4px solid #e87920;
          border-radius: 7px;
          background: #f8fafc;
          color: #182638;
          line-height: 1.75;
          overflow-wrap: anywhere;
        }

        .article-summary p {
          margin: 0 0 10px;
        }

        .article-summary p:last-child {
          margin-bottom: 0;
        }

        .table-description ul {
          list-style: disc !important;
          padding-left: 25px !important;
          margin: 8px 0 !important;
        }

        .table-description ol {
          list-style: decimal !important;
          padding-left: 25px !important;
          margin: 8px 0 !important;
        }

        .table-description li {
          display: list-item !important;
          margin: 5px 0 !important;
        }

        .table-description h2 {
          font-size: 1.35rem;
          font-weight: 700;
          margin: 12px 0 8px;
        }

        .table-description h3 {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 10px 0 6px;
        }

        .detail-section td p,
        .detail-section td div {
          display: block;
          margin: 0 0 7px;
          line-height: 1.65;
        }

        .detail-section td p:last-child,
        .detail-section td div:last-child {
          margin-bottom: 0;
        }

        .detail-section td br {
          display: block;
          content: "";
          margin-top: 4px;
        }

        .detail-section td ul,
        .detail-section td ol {
          margin: 6px 0;
          padding-left: 22px;
        }

        .detail-section td li {
          margin: 4px 0;
        }

        .detail-section td span {
          white-space: normal;
        }

        .article-summary b,
        .article-summary strong {
          font-weight: 700;
        }

        .article-summary ul,
        .article-summary ol {
          padding-left: 25px;
          margin: 10px 0;
        }

        .article-summary li {
          margin: 5px 0;
        }

        .article-summary a {
          color: #145da0;
          text-decoration: underline;
          overflow-wrap: anywhere;
        }

        .article-summary blockquote {
          margin: 12px 0;
          padding: 9px 14px;
          border-left: 3px solid #e87920;
          background: #fff;
        }
      `}</style>

      <main className="container article-layout">
        <article
          className="article"
          style={{ background, color: text }}
        >
          <div className="breadcrumb">
            <a href="/">Home</a>
            {" / "}
            <a href={`/category/${p.category_slug}`}>
              {p.category_name}
            </a>
            {" / Details"}
          </div>

          <span
            className="article-category"
            style={{
              background: accent,
              color: "#fff",
            }}
          >
            {p.category_name}
          </span>

          <h1 style={{ color: primary }}>
            {p.title}
          </h1>

          <div className="article-meta">
            {p.organization || "Jharkhand Update"}
            <span>•</span>
            {p.published_at
              ? new Date(p.published_at).toLocaleDateString(
                  "en-IN",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )
              : "Recently Updated"}
            <span>•</span>
            {p.verification_status === "verified"
              ? "Verified by admin"
              : "Please verify official notice"}
            {(p as any).updated_at && (
              <>
                <span>•</span>
                Updated {new Date((p as any).updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </>
            )}
          </div>

          {safeDescription && (
            <div
              className="article-summary"
              dangerouslySetInnerHTML={{
                __html: safeDescription,
              }}
            />
          )}

          {(p as any).image_url && (
            <figure
              style={{
                margin: "18px 0 22px",
                padding: 10,
                border: `1px solid ${primary}`,
                borderRadius: 9,
                background,
              }}
            >
              <img
                src={(p as any).image_url}
                alt={(p as any).image_title || p.title}
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: 460,
                  objectFit: "contain",
                  borderRadius: 6,
                }}
              />

              {(p as any).image_title && (
                <figcaption
                  style={{
                    marginTop: 9,
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: text,
                  }}
                >
                  {(p as any).image_title}
                </figcaption>
              )}
            </figure>
          )}

          <div className="article-content">
            <h2 style={{ color: primary }}>
              {p.title} – Details
            </h2>

            <div
              className="post-detail-grid"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, minmax(0, 1fr))",
                gap: 16,
                alignItems: "start",
              }}
            >
              {customTables.map(
                (table: any, index: number) => (
                  <CustomTable
                    key={table.id || index}
                    table={table}
                  />
                )
              )}

              <TextSection
                title="Educational Qualification"
                value={p.qualification}
                primary={primary}
              />

              <TextSection
                title="Selection Process"
                value={p.selection_process}
                primary={primary}
              />

              <TextSection
                title="How to Apply / Important Instructions"
                value={p.how_to_apply}
                primary={primary}
              />
            </div>
          </div>

          <div className="official-actions">
            {p.application_url && (
              <a
                className="action-primary"
                style={{ background: accent }}
                href={p.application_url}
                target="_blank"
                rel="noreferrer"
              >
                Apply Online ↗
              </a>
            )}

            {p.source_url && (
              <a
                className="action-secondary"
                href={p.source_url}
                target="_blank"
                rel="noreferrer"
              >
                Official Notification / Source ↗
              </a>
            )}
          </div>

          <section
            aria-label="Join JharResult Telegram Channel"
            style={{
              margin: "22px 0",
              padding: "16px 18px",
              background: "#eaf5ff",
              border: "1px solid #c8e4fa",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div>
              <strong style={{ display: "block", color: "#174b80", fontSize: 16 }}>
                Join Our Telegram Channel
              </strong>
              <span style={{ display: "block", color: "#52657c", fontSize: 13, marginTop: 3 }}>
                Get the latest Jharkhand job, result and education updates directly on Telegram.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
<a
              href="https://t.me/+_hj11IZ9nktjOWM1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join JharResult Telegram Channel"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "#229ED9",
                color: "#fff",
                borderRadius: 5,
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22 2 2.8 9.5c-1.3.5-1.3 1.2-.2 1.5l4.9 1.5 1.9 6c.2.7.1 1 .8 1 .5 0 .8-.2 1.1-.5l2.8-2.7 5.8 4.3c1.1.6 1.9.3 2.2-1L24 3.5C24.3 2 23.4 1.3 22 2ZM9.2 12.2 20 5.4c.5-.3 1-.1.6.3l-8.9 8-.4 4.1-2.1-5.6Z" />
              </svg>
              Join Telegram
            <
<a
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
</div>/a>
          </section>

          <p style={{ margin: "12px 0", fontSize: 13, color: "#52657c" }}>
            Found an error or outdated detail? <a href="/contact" style={{ color: "#145da0", fontWeight: 700, textDecoration: "underline" }}>Report a correction</a> and include the post title and official source.
          </p>

          <div className="disclaimer-box">
            <b>Note:</b> Candidates are advised to read the
            official notification carefully before applying.
            Information is provided for guidance; always verify
            dates, eligibility and fees from the official website.
          </div>
        </article>

        <aside className="article-sidebar">
          <div className="listing-box">
            <div className="section-heading">
              <h2>Quick Links</h2>
            </div>

            <a
              className="side-link"
              href="/category/latest-jobs"
            >
              Latest Jobs
            </a>

            <a
              className="side-link"
              href="/category/previous-papers"
            >
              Previous Year Papers
            </a>

            <a
              className="side-link"
              href="/category/board"
            >
              Board Updates
            </a>

            <a
              className="side-link"
              href="/category/scholarships"
            >
              Scholarship
            </a>
          </div>

          {latestPosts.length > 0 && (
            <div className="listing-box">
              <div className="section-heading">
                <h2>Latest Updates</h2>
              </div>
              {latestPosts.map((post) => (
                <a
                  key={post.id}
                  className="side-link"
                  href={`/post/${post.slug}`}
                >
                  {post.title}
                </a>
              ))}
            </div>
          )}
        </aside>
      </main>

      <footer className="footer">
        <div className="container">
          JharResult • Jharkhand Education &amp; Career Portal
        </div>
      </footer>
    </>
  );
}
