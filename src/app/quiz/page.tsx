import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getPool } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Online Quiz – JAC Board & Jharkhand Competitive Exams",
  description: "Take free online quizzes for JAC Board Classes 8–12, JSSC, JTET, JPSC and Jharkhand Police exams on JharResult.",
  alternates: { canonical: "/quiz" },
};

type QuizCategory = { id: number; name: string; slug: string; description: string | null };

export default async function QuizHomePage() {
  let groups: { root: QuizCategory; children: QuizCategory[] }[] = [];
  let unavailable = false;
  try {
    const [rows] = await getPool().query(
      "SELECT id,name,slug,description FROM quiz_categories WHERE parent_id IS NULL AND is_active=1 ORDER BY sort_order,id"
    );
    const roots = rows as QuizCategory[];
    for (const root of roots) {
      const [childRows] = await getPool().execute(
        "SELECT id,name,slug,description FROM quiz_categories WHERE parent_id=? AND is_active=1 ORDER BY sort_order,id",
        [root.id]
      );
      groups.push({ root, children: childRows as QuizCategory[] });
    }
  } catch (error) {
    console.error("Quiz category load failed:", error);
    unavailable = true;
  }

  return (
    <>
      <SiteHeader />
      <main className="container" style={{ padding: "24px 0 42px" }}>
        <section className="quiz-hero">
          <span className="quiz-eyebrow">JHARRESULT • FREE ONLINE PRACTICE</span>
          <h1>JharResult Quiz Zone</h1>
          <p>Practice for your next exam. Choose your class or competitive examination, take a quiz and compare your best score on the category leaderboard.</p>
          <div className="quiz-hero-points"><span>✓ No account required</span><span>✓ Unlimited attempts</span><span>✓ Fresh question sets</span></div>
        </section>

        {unavailable ? (
          <section className="quiz-empty"><h2>Quiz Zone is being prepared</h2><p>Quiz categories will appear here once the Quiz Zone database migration has been applied.</p></section>
        ) : groups.length ? (
          <div className="quiz-groups">
            {groups.map(({ root, children }) => (
              <section className="quiz-group" key={root.id}>
                <div className="quiz-group-heading">
                  <div><span>{root.slug === "jac-board" ? "SCHOOL EXAMINATION" : "GOVERNMENT EXAMINATION"}</span><h2>{root.name}</h2><p>{root.description}</p></div>
                  <span className="quiz-group-count">{children.length} categories</span>
                </div>
                <div className="quiz-category-grid">
                  {children.map((category) => (
                    <Link className="quiz-category-card" href={`/quiz/${root.slug}/${category.slug}`} key={category.id}>
                      <span className="quiz-card-icon">{root.slug === "jac-board" ? "📚" : "🏆"}</span>
                      <span className="quiz-card-copy"><strong>{category.name}</strong><small>{category.description || "Explore available practice quizzes"}</small></span>
                      <span className="quiz-card-arrow">→</span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <section className="quiz-empty"><h2>Quizzes are coming soon</h2><p>We are preparing class-wise and exam-wise practice categories.</p></section>
        )}
        <section className="quiz-note"><strong>How it works</strong><p>Enter your display name before starting a quiz. Your answers are checked after submission and your best valid score appears on the relevant category leaderboard.</p></section>
      </main>
      <style>{`
        .quiz-hero{position:relative;overflow:hidden;padding:34px 30px;border-radius:12px;background:linear-gradient(120deg,#122e50,#1d527e);color:#fff;box-shadow:0 12px 28px rgba(20,43,73,.14)}
        .quiz-hero:after{content:"";position:absolute;width:250px;height:250px;border:1px solid #ffffff20;border-radius:50%;right:-65px;top:-110px;box-shadow:0 0 0 28px #ffffff09,0 0 0 58px #ffffff07}
        .quiz-eyebrow{font-size:11px;font-weight:800;letter-spacing:1.4px;color:#ffcf91}
        .quiz-hero h1{font-size:clamp(27px,4vw,40px);line-height:1.15;margin:10px 0;color:#fff}
        .quiz-hero p{max-width:700px;margin:0;color:#e1eaf4;font-size:15px;line-height:1.7}
        .quiz-hero-points{display:flex;gap:10px 22px;flex-wrap:wrap;margin-top:20px;font-size:12px;font-weight:700;color:#fff}
        .quiz-groups{display:grid;gap:22px;margin-top:24px}
        .quiz-group{background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
        .quiz-group-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px 20px;background:#f7f9fc;border-bottom:1px solid #e8edf3}
        .quiz-group-heading span:first-child{font-size:10px;letter-spacing:1px;font-weight:800;color:#d97706}
        .quiz-group-heading h2{margin:3px 0;color:#173f68;font-size:21px}
        .quiz-group-heading p{margin:0;color:#667085;font-size:12px}
        .quiz-group-count{font-size:11px;font-weight:700;color:#52657c;background:#e9eff6;padding:6px 9px;border-radius:20px;white-space:nowrap}
        .quiz-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:16px}
        .quiz-category-card{position:relative;display:flex;align-items:center;gap:14px;min-width:0;padding:18px;border:1px solid #e5eaf0;border-radius:11px;background:linear-gradient(120deg,#fff,#fbfdff);box-shadow:0 5px 16px #173f6808;transition:border-color .18s,transform .18s,box-shadow .18s;overflow:hidden}.quiz-category-card:after{content:"";position:absolute;width:90px;height:90px;right:-42px;bottom:-52px;border:1px solid #e8792022;border-radius:50%;box-shadow:0 0 0 13px #e8792008}
        .quiz-category-card:hover{border-color:#e89a4b;transform:translateY(-3px);box-shadow:0 12px 25px #173f6815;color:#173f68}
        .quiz-card-icon{position:relative;z-index:1;display:grid;place-items:center;flex:0 0 48px;width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#fff2e3,#ffdfbd);font-size:23px;box-shadow:inset 0 0 0 1px #f2d6b8}
        .quiz-card-copy{display:grid;gap:3px;min-width:0;flex:1}
        .quiz-card-copy strong{font-size:15px;color:#173f68;line-height:1.35}
        .quiz-card-copy small{font-size:11px;line-height:1.45;color:#718096}
        .quiz-card-arrow{position:relative;z-index:1;display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#fff4e8;font-size:19px;color:#d97706;transition:transform .18s}.quiz-category-card:hover .quiz-card-arrow{transform:translateX(3px)}
        .quiz-empty,.quiz-note{margin-top:22px;padding:20px;background:#fff;border:1px solid #e2e8f0;border-radius:9px}
        .quiz-empty h2,.quiz-note strong{margin:0;color:#173f68}
        .quiz-empty p,.quiz-note p{margin:6px 0 0;color:#667085;font-size:13px;line-height:1.6}
        @media(max-width:600px){.quiz-hero{padding:26px 19px}.quiz-hero-points{gap:8px 14px}.quiz-category-grid{grid-template-columns:1fr;padding:12px}.quiz-group-heading{padding:15px}.quiz-group-heading h2{font-size:19px}}
      `}</style>
    </>
  );
}
