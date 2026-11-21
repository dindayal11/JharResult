import {notFound} from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {getPool} from "@/lib/db";
import QuizRunner from "../../QuizRunner";
import type {Metadata} from "next";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{quizSlug:string}>}):Promise<Metadata>{
  const {quizSlug}=await params;
  const [rows]:any=await getPool().execute(
    "SELECT q.title,q.description,c.name AS category_name,p.name AS parent_name FROM quizzes q JOIN quiz_categories c ON c.id=q.category_id LEFT JOIN quiz_categories p ON p.id=c.parent_id WHERE q.slug=? AND q.status='published' AND c.is_active=1 LIMIT 1",
    [quizSlug]
  );
  if(!rows.length) return {title:"Online Quiz | JharResult",robots:{index:false,follow:true}};
  const quiz=rows[0];
  const title=`${quiz.title} – Online MCQ Test | JharResult`;
  const description=(quiz.description || `Attempt the ${quiz.title} online MCQ quiz on JharResult. Practice ${quiz.parent_name?quiz.parent_name+" ":""}${quiz.category_name} questions and check your score instantly.`).slice(0,155);
  const canonical=`/quiz/start/${encodeURIComponent(quizSlug)}`;
  return {
    title,description,
    keywords:[quiz.title,quiz.category_name+" quiz",quiz.category_name+" MCQ","online practice test"],
    alternates:{canonical},
    openGraph:{title,description,url:`https://jharresult.in${canonical}`,siteName:"JharResult",type:"website"},
    robots:{index:true,follow:true}
  };
}
export default async function StartQuizPage({params}:{params:Promise<{quizSlug:string}>}){const {quizSlug}=await params;let rows:any[]=[];try{const [data]:any=await getPool().execute("SELECT q.id,q.title,q.description,q.instructions,q.question_count,q.duration_minutes,q.language,c.slug AS category_slug FROM quizzes q JOIN quiz_categories c ON c.id=q.category_id WHERE q.slug=? AND q.status='published' LIMIT 1",[quizSlug]);rows=data;}catch{notFound();}if(!rows.length)notFound();return <><SiteHeader/><main className="container" style={{padding:"10px 0 40px"}}><QuizRunner quiz={rows[0]}/></main></>;}
