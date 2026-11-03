
import { getPool } from "@/lib/db";
import ResponsiveNav from "@/components/ResponsiveNav";

const fallback = [
  { name: "Latest Jobs", slug: "latest-jobs" },
  { name: "Admit Card", slug: "admit-card" },
  { name: "Results", slug: "results" },
  { name: "Answer Key", slug: "answer-key" },
  { name: "Admissions", slug: "admissions" },
  { name: "Scholarships", slug: "scholarships" },
];

export default async function SiteHeader() {
  let links = fallback;

  try {
    const [rows] = await getPool().query(
      "SELECT name,slug FROM categories WHERE is_active=1 ORDER BY id ASC"
    );

    if ((rows as any[]).length) {
      links = rows as any[];
    }
  } catch {}

  const primary = links.slice(0, 6);
  const more = links.slice(6);

  return (
    <>
      <div className="topbar">
        <div className="container">
          Jharkhand Government Jobs • Results • Admit Cards • Education Updates
        </div>
      </div>

      <header className="header">
        <div
          className="container"
          style={{ paddingTop: 16, paddingBottom: 12 }}
        >
          <a className="brand" href="/">
            JHAR<span>RESULT</span>
          </a>

          <div className="muted" style={{ marginTop: 4 }}>
            Jharkhand Career & Education Update Portal
          </div>

          <ResponsiveNav primary={primary} more={more} />
        </div>
      </header>
    </>
  );
}
