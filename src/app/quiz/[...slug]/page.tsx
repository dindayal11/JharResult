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
  return {title:`${slug[slug.length-1]?.replace(/-/g," ")} Quizzes`,robots:{index:true,follow:true}};
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
    <section className="quiz-category-heading"><span>JHARRESULT QUIZ ZONE</span><h1>{current.name} Quizzes</h1><p>{current.description||`Choose a practice quiz for ${current.name}.`}</p><Link href={`/quiz/leaderboard/${current.slug}`} style={{display:"inline-block",marginTop:12,color:"#c66b15",fontSize:12,fontWeight:800}}>View Category Leaderboard →</Link></section>
    {children.length>0?<div className="quiz-subcategory-grid">{children.map(child=><Link key={child.id} href={`/quiz/${[...slug,child.slug].join("/")}`} className="quiz-subcategory"><strong>{child.name}</strong><span>Explore quizzes →</span></Link>)}</div>:quizzes.length>0?<div className="quiz-list">{quizzes.map(quiz=><article className="quiz-list-card" key={quiz.id}><div><h2>{quiz.title}</h2><p>{quiz.description||"Practice and improve your preparation."}</p><small>{quiz.question_count} Questions · {quiz.duration_minutes} Minutes · {quiz.language==="both"?"Hindi + English":quiz.language}</small></div><Link href={`/quiz/start/${quiz.slug}`}>View Quiz →</Link></article>)}</div>:<section className="quiz-empty"><h2>Quizzes coming soon</h2><p>Practice quizzes for this category will be published here.</p></section>}
    <style>{`.quiz-breadcrumb{font-size:12px;color:#758195;margin-bottom:15px}.quiz-breadcrumb a{color:#1d5a91;font-weight:700}.quiz-category-heading{padding:25px;background:#fff;border:1px solid #e2e8f0;border-left:4px solid #e87920;border-radius:8px}.quiz-category-heading>span{font-size:10px;letter-spacing:1px;font-weight:800;color:#d97706}.quiz-category-heading h1{margin:5px 0;color:#173f68;font-size:27px;text-transform:capitalize}.quiz-category-heading p{margin:0;color:#667085;font-size:13px}.quiz-subcategory-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.quiz-subcategory,.quiz-list-card{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:18px;background:#fff;border:1px solid #e2e8f0;border-radius:8px}.quiz-subcategory strong{color:#173f68}.quiz-subcategory span,.quiz-list-card>a{color:#c66b15;font-size:12px;font-weight:800}.quiz-list{display:grid;gap:12px;margin-top:18px}.quiz-list-card h2{font-size:16px;color:#173f68;margin:0}.quiz-list-card p{font-size:12px;color:#667085;margin:4px 0}.quiz-list-card small{font-size:11px;color:#8993a2}.quiz-empty{margin-top:18px;padding:20px;background:#fff;border:1px solid #e2e8f0;border-radius:8px}.quiz-empty h2{margin:0;color:#173f68}.quiz-empty p{color:#667085;font-size:13px}@media(max-width:600px){.quiz-subcategory-grid{grid-template-columns:1fr}.quiz-list-card{align-items:flex-start;flex-direction:column}}`}</style>
  </main></>;
}
