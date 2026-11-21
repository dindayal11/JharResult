import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { getPool } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Category = { id:number; parent_id:number|null; name:string; slug:string; description:string|null; category_type:string };
type Quiz = { id:number; title:string; slug:string; description:string|null; question_count:number; duration_minutes:number; language:string };

export async function generateMetadata({params}:{params:Promise<{slug:string[]}>}):Promise<Metadata>{
  const {slug}=await params;
  if(!slug?.length) return {title:"Online MCQ Practice Quizzes | JharResult"};
  try {
    const names:string[]=[];
    for(const part of slug){
      const [rows]:any=await getPool().execute(
        "SELECT name FROM quiz_categories WHERE slug=? AND is_active=1 LIMIT 1",[part]
      );
      if(!rows.length) return {title:"Quiz Category Not Found | JharResult",robots:{index:false,follow:true}};
      names.push(String(rows[0].name));
    }
    const category=names[names.length-1];
    const hierarchy=names.join(" ");
    const isJac=slug[0]==="jac-board";
    const title=isJac
      ? `${hierarchy} Online Quiz – Chapter-wise MCQ Practice | JharResult`
      : `${hierarchy} Mock Test & Online Quiz – Free MCQ Practice | JharResult`;
    const description=`Practice free ${category} online quizzes on JharResult. Attempt chapter-wise and subject-wise MCQs with answers, Hindi and English questions, instant results and score improvement practice.`;
    const canonical=`/quiz/${slug.map(part=>encodeURIComponent(part)).join("/")}`;
    return {
      title,
      description,
      keywords:[`${hierarchy} quiz`,`${category} online test`,`${category} MCQ`,`${category} mock test`,"JAC Board online quiz","Jharkhand MCQ practice"],
      alternates:{canonical},
      openGraph:{title,description,url:`https://jharresult.in${canonical}`,siteName:"JharResult",type:"website"},
      robots:{index:true,follow:true}
    };
  } catch(error) {
    console.error("Quiz category metadata failed:",error);
    return {title:"Online MCQ Practice Quizzes | JharResult",robots:{index:true,follow:true}};
  }
}

export default async function QuizCategoryPage({params}:{params:Promise<{slug:string[]}>}){
  const {slug}=await params;
  if(!slug?.length) notFound();
  let current:Category|null=null;
  const trail:Category[]=[];
  try{
    for(const part of slug){
      const [rows]:any=await getPool().execute(
        "SELECT id,parent_id,name,slug,description,category_type FROM quiz_categories WHERE slug=? AND is_active=1 LIMIT 1",[part]
      );
      const found=rows[0] as Category|undefined;
      if(!found || (current && Number(found.parent_id)!==Number(current.id))) notFound();
      current=found;
      trail.push(found);
    }
  }catch(error){if(error instanceof Error && error.message==="NEXT_HTTP_ERROR_FALLBACK;404") throw error; console.error("Quiz category lookup failed:",error); notFound();}
  if(!current) notFound();
  let children:Category[]=[];
  let quizzes:Quiz[]=[];
  try{
    const [childRows]:any=await getPool().execute("SELECT id,parent_id,name,slug,description,category_type FROM quiz_categories WHERE parent_id=? AND is_active=1 ORDER BY sort_order,id",[current.id]);
    children=childRows;
    if(!children.length){
      const [quizRows]:any=await getPool().execute("SELECT id,title,slug,description,question_count,duration_minutes,language FROM quizzes WHERE category_id=? AND status='published' ORDER BY published_at DESC,id DESC",[current.id]);
      quizzes=quizRows;
    }
  }catch(error){console.error("Quiz list load failed:",error);}
  return <><SiteHeader/><main className="container" style={{padding:"24px 0 42px"}}>
    <div className="quiz-breadcrumb"><Link href="/quiz">Quiz Zone</Link>{trail.map((item,index)=><span key={item.id}> / {index===trail.length-1?<strong>{item.name}</strong>:<Link href={`/quiz/${slug.slice(0,index+1).join("/")}`}>{item.name}</Link>}</span>)}</div>
    <section className="quiz-category-heading"><div className="quiz-heading-copy"><span>JHARRESULT QUIZ ZONE</span><h1>{current.name} Quizzes</h1><p>{current.description||`Choose a practice quiz for ${current.name}.`}</p><div className="quiz-heading-tags"><b>✓ Free practice</b><b>✓ Instant results</b><b>✓ Best-score ranking</b></div></div><Link className="quiz-leaderboard-link" href={`/quiz/leaderboard/${current.slug}`}><span>🏆</span><span><b>Leaderboard</b><small>See top performers</small></span><strong>→</strong></Link></section>
    {children.length>0?<div className="quiz-subcategory-grid">{children.map(child=><Link key={child.id} href={`/quiz/${[...slug,child.slug].join("/")}`} className="quiz-subcategory"><span className="quiz-subcategory-icon">📘</span><span className="quiz-subcategory-copy"><strong>{child.name}</strong><small>{child.description||"Explore practice material and quizzes"}</small></span><span className="quiz-card-arrow">↗</span></Link>)}</div>:quizzes.length>0?<div className="quiz-list">{quizzes.map(quiz=><article className="quiz-list-card" key={quiz.id}><div className="quiz-test-icon">✎</div><div className="quiz-test-copy"><h2>{quiz.title}</h2><p>{quiz.description||"Practice and improve your preparation."}</p><div className="quiz-test-meta"><span>☷ {quiz.question_count} Questions</span><span>◷ {quiz.duration_minutes} Minutes</span><span>文 {quiz.language==="both"?"Hindi + English":quiz.language}</span></div></div><Link className="quiz-start-link" href={`/quiz/start/${quiz.slug}`}>Take Test <strong>→</strong></Link></article>)}</div>:<section className="quiz-empty"><h2>Quizzes coming soon</h2><p>Practice quizzes for this category will be published here.</p></section>}
    <style>{`.quiz-breadcrumb{font-size:12px;color:#758195;margin-bottom:15px}.quiz-breadcrumb a{color:#1d5a91;font-weight:700}.quiz-category-heading{display:flex;justify-content:space-between;align-items:center;gap:22px;padding:28px;background:linear-gradient(115deg,#fff 55%,#fff8ef);border:1px solid #e2e8f0;border-left:5px solid #e87920;border-radius:13px;box-shadow:0 8px 24px #173f6809}.quiz-heading-copy>span{font-size:10px;letter-spacing:1.2px;font-weight:900;color:#d97706}.quiz-category-heading h1{margin:6px 0;color:#173f68;font-size:clamp(24px,3vw,32px);text-transform:capitalize}.quiz-category-heading p{margin:0;color:#667085;font-size:13px}.quiz-heading-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.quiz-heading-tags b{padding:7px 10px;border-radius:20px;background:#f0f6fb;color:#41617e;font-size:10px}.quiz-leaderboard-link{display:flex;align-items:center;gap:10px;min-width:190px;padding:13px 15px;border:1px solid #f1d3b5;border-radius:10px;background:#fff;box-shadow:0 5px 16px #e8792010}.quiz-leaderboard-link>span:first-child{font-size:25px}.quiz-leaderboard-link>span:nth-child(2){display:grid;gap:3px;flex:1}.quiz-leaderboard-link b{font-size:12px;color:#173f68}.quiz-leaderboard-link small{font-size:10px;color:#8290a2}.quiz-leaderboard-link>strong{font-size:20px;color:#d97706}.quiz-subcategory-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:20px}.quiz-subcategory{display:flex;align-items:center;gap:14px;min-width:0;padding:19px;background:#fff;border:1px solid #e2e8f0;border-radius:11px;box-shadow:0 5px 18px #173f6808;transition:transform .18s,border-color .18s,box-shadow .18s}.quiz-subcategory:hover,.quiz-list-card:hover{transform:translateY(-2px);border-color:#efb77f;box-shadow:0 10px 24px #173f6812}.quiz-subcategory-icon,.quiz-test-icon{display:grid;place-items:center;flex:0 0 46px;width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#fff2e3,#ffdfbd);font-size:22px}.quiz-subcategory-copy{display:grid;gap:4px;min-width:0;flex:1}.quiz-subcategory-copy strong{color:#173f68;font-size:14px}.quiz-subcategory-copy small{color:#8491a2;font-size:11px;line-height:1.4}.quiz-card-arrow{font-size:22px;color:#d97706}.quiz-list{display:grid;gap:13px;margin-top:20px}.quiz-list-card{display:flex;align-items:center;gap:15px;padding:19px;background:#fff;border:1px solid #e2e8f0;border-radius:11px;box-shadow:0 5px 18px #173f6808;transition:transform .18s,border-color .18s,box-shadow .18s}.quiz-test-icon{background:linear-gradient(135deg,#eaf3ff,#d9eaff);color:#245b91;font-size:21px}.quiz-test-copy{flex:1;min-width:0}.quiz-list-card h2{font-size:16px;color:#173f68;margin:0}.quiz-list-card p{font-size:12px;color:#667085;margin:5px 0 9px}.quiz-test-meta{display:flex;flex-wrap:wrap;gap:7px}.quiz-test-meta span{padding:5px 8px;border-radius:6px;background:#f3f6fa;color:#5c6d81;font-size:10px;font-weight:700}.quiz-start-link{display:inline-flex;align-items:center;gap:12px;padding:11px 15px;border-radius:8px;background:linear-gradient(135deg,#ed8b2e,#d96513);color:#fff;font-size:12px;font-weight:800;white-space:nowrap;box-shadow:0 5px 13px #e879202b}.quiz-start-link strong{font-size:18px}.quiz-empty{margin-top:18px;padding:22px;background:#fff;border:1px solid #e2e8f0;border-radius:10px}.quiz-empty h2{margin:0;color:#173f68}.quiz-empty p{color:#667085;font-size:13px}@media(max-width:650px){.quiz-category-heading{align-items:stretch;flex-direction:column;padding:20px}.quiz-leaderboard-link{width:100%}.quiz-subcategory-grid{grid-template-columns:1fr}.quiz-list-card{align-items:flex-start;flex-wrap:wrap;padding:15px}.quiz-test-copy{width:calc(100% - 62px)}.quiz-start-link{margin-left:61px}.quiz-test-meta{gap:5px}}`}</style>
  </main></>;
}
