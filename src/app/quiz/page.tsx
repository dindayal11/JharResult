import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getPool } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "JAC Board Online Quiz 2026 – Class 8 to 12 & Jharkhand Competitive Exams | JharResult",
  description: "Practice free online MCQ quizzes for JAC Board Classes 8–12, Science, Arts, Commerce subjects and Jharkhand competitive exams including JSSC, JPSC, JTET and Jharkhand Police. Hindi and English practice on JharResult.",
  keywords: ["JAC Board online quiz", "JAC Class 12 quiz", "Jharkhand online MCQ", "Class 10 online test", "Class 12 subject wise MCQ", "JSSC mock test", "JPSC practice quiz", "JTET mock test"],
  alternates: { canonical: "/quiz" },
  openGraph: {
    title: "JharResult Quiz Zone – JAC Board & Jharkhand Competitive Exams",
    description: "Free class-wise, subject-wise and exam-wise online MCQ practice in Hindi and English.",
    url: "https://jharresult.in/quiz",
    siteName: "JharResult",
    type: "website",
  },
};

type QuizCategory = { id: number; name: string; slug: string; description: string | null };
type PublishedQuiz = { id:number; title:string; slug:string; question_count:number; duration_minutes:number; published_at:string|null; category_name:string; parent_name:string|null; is_new:number };

export default async function QuizHomePage() {
  let groups: { root: QuizCategory; children: QuizCategory[] }[] = [];
  let unavailable = false;
  let publishedQuizzes: PublishedQuiz[] = [];
  try {
    const [publishedRows]:any = await getPool().query("SELECT q.id,q.title,q.slug,q.question_count,q.duration_minutes,q.published_at,c.name AS category_name,p.name AS parent_name,IF(q.published_at>=DATE_SUB(NOW(),INTERVAL 7 DAY),1,0) AS is_new FROM quizzes q JOIN quiz_categories c ON c.id=q.category_id LEFT JOIN quiz_categories p ON p.id=c.parent_id WHERE q.status='published' AND c.is_active=1 ORDER BY q.published_at DESC,q.created_at DESC LIMIT 7");
    publishedQuizzes = publishedRows as PublishedQuiz[];
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


        {publishedQuizzes.length>0 && (
          <section className="quiz-notifications" aria-label="Newly published tests">
            <div className="quiz-notifications-heading">
              <div><span className="quiz-notification-kicker">LATEST UPDATES</span><h2><span aria-hidden="true">🔔</span> New Test Notifications</h2><p>Recently published tests — tap any test to start practising.</p></div>
              <span className="quiz-notification-count">{publishedQuizzes.length} {publishedQuizzes.length===1?"TEST":"TESTS"}</span>
            </div>
            <div className="quiz-notification-list">
              {publishedQuizzes.map((quiz)=>(
                <Link className="quiz-notification-item" href={`/quiz/start/${quiz.slug}`} key={quiz.id}>
                  <span className="quiz-notification-icon" aria-hidden="true">📝</span>
                  <span className="quiz-notification-copy"><strong>{quiz.title}</strong><small>{quiz.parent_name?quiz.parent_name+" · ":""}{quiz.category_name} · {quiz.question_count} Questions · {quiz.duration_minutes} Minutes</small></span>
                  {quiz.is_new===1&&<span className="new-badge">NEW</span>}
                  <span className="quiz-notification-open" aria-hidden="true">Start →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
        .quiz-notifications{margin-top:22px;padding:19px;background:#fff;border:1px solid #f1d8bd;border-radius:12px;box-shadow:0 7px 22px #173f6809}
        .quiz-notifications-heading{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:13px}
        .quiz-notification-kicker{font-size:10px;font-weight:900;letter-spacing:1.2px;color:#d97706}
        .quiz-notifications-heading h2{display:flex;align-items:center;gap:8px;margin:4px 0;color:#173f68;font-size:20px}
        .quiz-notifications-heading p{margin:0;color:#718096;font-size:12px}
        .quiz-notification-count{padding:7px 10px;border-radius:20px;background:#fff2e5;color:#b45309;font-size:10px;font-weight:900;white-space:nowrap}
        .quiz-notification-list{display:grid;gap:9px}
        .quiz-notification-item{display:flex;align-items:center;gap:12px;min-width:0;padding:12px;border:1px solid #e8edf3;border-radius:9px;background:#fbfcfe;transition:border-color .16s,transform .16s,box-shadow .16s}
        .quiz-notification-item:hover{border-color:#e9a466;transform:translateY(-1px);box-shadow:0 6px 16px #173f680d}
        .quiz-notification-icon{display:grid;place-items:center;flex:0 0 40px;width:40px;height:40px;border-radius:10px;background:#fff0df;font-size:19px}
        .quiz-notification-copy{display:grid;gap:4px;flex:1;min-width:0}
        .quiz-notification-copy strong{color:#173f68;font-size:13px;line-height:1.4}
        .quiz-notification-copy small{color:#78879a;font-size:10px;line-height:1.4}
        .quiz-notification-open{padding:8px 10px;border-radius:7px;background:#173f68;color:#fff;font-size:10px;font-weight:800;white-space:nowrap}
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
        @media(max-width:600px){.quiz-notifications{padding:14px}.quiz-notifications-heading h2{font-size:17px}.quiz-notification-item{gap:8px;padding:10px}.quiz-notification-icon{flex-basis:34px;width:34px;height:34px;font-size:16px}.quiz-notification-copy strong{font-size:12px}.quiz-notification-open{padding:7px 8px;font-size:9px}.quiz-hero{padding:26px 19px}.quiz-hero-points{gap:8px 14px}.quiz-category-grid{grid-template-columns:1fr;padding:12px}.quiz-group-heading{padding:15px}.quiz-group-heading h2{font-size:19px}}
      `}</style>
    </>
  );
}
