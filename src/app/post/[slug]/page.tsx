
import SiteHeader from "@/components/SiteHeader";
import { getPostBySlug, getPublishedPosts, parseJson } from "@/lib/posts";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DOMPurify from "isomorphic-dompurify";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);

  return {
    title: p?.seo_title || p?.title || "Update",
    description:
      p?.seo_description || p?.short_description || "",
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

  const visibleRows = rows.filter(
    (row: any) =>
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
      <h2 style={{ background: primary, color: "#fff" }}>
        {table.title}
      </h2>

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
  {visibleRows.map((row: string[], rowIndex: number) => (
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
            {/<[a-z][\\s\\S]*>/i.test(value) ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(value, {
                    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "a", "blockquote"],
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
  ))}
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
            ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "span", "h2", "h3", "h4", "a", "blockquote"],
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

  const latestPosts = (await getPublishedPosts(9))
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

      <style>{`
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
              href="/category/admit-card"
            >
              Admit Cards
            </a>

            <a
              className="side-link"
              href="/category/results"
            >
              Results
            </a>

            <a
              className="side-link"
              href="/category/answer-key"
            >
              Answer Keys
            </a>

            <a
              className="side-link"
              href="/category/admissions"
            >
              Admissions
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
