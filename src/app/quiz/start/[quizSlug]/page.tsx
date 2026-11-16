import {notFound} from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import {getPool} from "@/lib/db";
import QuizRunner from "../../QuizRunner";
import type {Metadata} from "next";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{quizSlug:string}>}):Promise<Metadata>{const {quizSlug}=await params;const [rows]:any=await getPool().execute("SELECT title FROM quizzes WHERE slug=? AND status='published' LIMIT 1",[quizSlug]);return {title:rows[0]?rows[0].title+" – Online Quiz":"Online Quiz"};}
export default async function StartQuizPage({params}:{params:Promise<{quizSlug:string}>}){const {quizSlug}=await params;let rows:any[]=[];try{const [data]:any=await getPool().execute("SELECT q.id,q.title,q.description,q.instructions,q.question_count,q.duration_minutes,q.language,c.slug AS category_slug FROM quizzes q JOIN quiz_categories c ON c.id=q.category_id WHERE q.slug=? AND q.status='published' LIMIT 1",[quizSlug]);rows=data;}catch{notFound();}if(!rows.length)notFound();return <><SiteHeader/><main className="container" style={{padding:"10px 0 40px"}}><QuizRunner quiz={rows[0]}/></main></>;}
