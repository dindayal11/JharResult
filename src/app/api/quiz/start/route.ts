import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
const COOKIE = "jhar_quiz_token";
const hash = (value:string) => createHash("sha256").update(value).digest("hex");
const shuffle = <T,>(items:T[]) => { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };

export async function POST(req:Request){
  let connection:any;
  try{
    const body=await req.json();
    const quizId=Number(body.quiz_id);
    const displayName=String(body.display_name||"").trim().replace(/\\s+/g," ");
    if(!Number.isInteger(quizId)||quizId<1) return NextResponse.json({error:"Invalid quiz."},{status:400});
    if(displayName.length<2||displayName.length>80) return NextResponse.json({error:"Name must be between 2 and 80 characters."},{status:400});
    connection=await getPool().getConnection(); await connection.beginTransaction();
    const [qz]:any=await connection.execute("SELECT q.*,c.name AS category_name FROM quizzes q JOIN quiz_categories c ON c.id=q.category_id WHERE q.id=? AND q.status='published' AND c.is_active=1 LIMIT 1",[quizId]);
    if(!qz.length){await connection.rollback();return NextResponse.json({error:"This quiz is not available."},{status:404});}
    const quiz=qz[0];
    const [pool]:any=await connection.execute("SELECT id,question_text,question_text_hi FROM quiz_questions WHERE quiz_id=? AND is_active=1",[quizId]);
    if(pool.length<Number(quiz.question_count)){await connection.rollback();return NextResponse.json({error:"This quiz is being prepared. Please try again later."},{status:409});}
    const questions:any[]=shuffle<any>(pool as any[]).slice(0,Number(quiz.question_count));
    const jar=await cookies(); let token=jar.get(COOKIE)?.value;
    if(!token||!/^[a-f0-9]{64}$/.test(token)) token=randomBytes(32).toString("hex");
    const tokenHash=hash(token);
    const [participants]:any=await connection.execute("SELECT id FROM quiz_participants WHERE token_hash=? LIMIT 1",[tokenHash]);
    let participantId:number;
    if(participants.length){participantId=Number(participants[0].id);await connection.execute("UPDATE quiz_participants SET display_name=?,last_seen_at=NOW() WHERE id=?",[displayName,participantId]);}
    else{const [p]:any=await connection.execute("INSERT INTO quiz_participants(display_name,token_hash,last_seen_at) VALUES(?,?,NOW())",[displayName,tokenHash]);participantId=Number(p.insertId);}
    const publicId=randomUUID();
    const [attempt]:any=await connection.execute("INSERT INTO quiz_attempts(public_id,quiz_id,category_id,participant_id,status,total_questions,total_marks,started_at,expires_at) VALUES(?,?,?,?,'in_progress',?,?,NOW(),DATE_ADD(NOW(),INTERVAL ? MINUTE))",[publicId,quizId,quiz.category_id,participantId,questions.length,Number(quiz.marks_per_question)*questions.length,Number(quiz.duration_minutes)]);
    const attemptId=Number(attempt.insertId);
    const payload:any[]=[];
    for(let i=0;i<questions.length;i++){
      const q=questions[i];
      const [opts]:any=await connection.execute("SELECT id,option_text,option_text_hi FROM quiz_options WHERE question_id=? ORDER BY sort_order,id",[q.id]);
      if(opts.length!==4) throw new Error("A question in this quiz does not have four options.");
      const ordered=shuffle(opts);
      await connection.execute("INSERT INTO quiz_attempt_questions(attempt_id,question_id,question_order,option_order) VALUES(?,?,?,?)",[attemptId,q.id,i+1,JSON.stringify(ordered.map((o:any)=>Number(o.id)))]);
      payload.push({id:Number(q.id),question:quiz.language==="hindi"?(q.question_text_hi||q.question_text):q.question_text,question_hi:quiz.language==="english"?null:q.question_text_hi,options:ordered.map((o:any,index:number)=>({id:Number(o.id),label:String.fromCharCode(65+index),text:quiz.language==="hindi"?(o.option_text_hi||o.option_text):o.option_text,text_hi:quiz.language==="english"?null:o.option_text_hi}))});
    }
    await connection.commit();
    const response=NextResponse.json({attempt_id:publicId,title:quiz.title,category:quiz.category_name,duration_minutes:Number(quiz.duration_minutes),expires_at:new Date(Date.now()+Number(quiz.duration_minutes)*60000).toISOString(),questions:payload});
    response.cookies.set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*365});
    return response;
  }catch(error:any){if(connection)await connection.rollback();console.error("Quiz start failed:",error);return NextResponse.json({error:error.message==="A question in this quiz does not have four options."?error.message:"Could not start this quiz. Please try again."},{status:500});}
  finally{connection?.release();}
}
