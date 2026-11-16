import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { getPool } from "@/lib/db";
export const runtime="nodejs";
export async function POST(req:Request){
 let connection:any;
 try{
  const jar=await cookies();const token=jar.get("jhar_quiz_token")?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Quiz session not found."},{status:401});
  const tokenHash=createHash("sha256").update(token).digest("hex");const body=await req.json();const publicId=String(body.attempt_id||"");
  if(!publicId)return NextResponse.json({error:"Invalid attempt."},{status:400});
  connection=await getPool().getConnection();await connection.beginTransaction();
  const [rows]:any=await connection.execute("SELECT a.*,q.title,q.marks_per_question,q.negative_marking,p.display_name FROM quiz_attempts a JOIN quizzes q ON q.id=a.quiz_id JOIN quiz_participants p ON p.id=a.participant_id WHERE a.public_id=? AND p.token_hash=? FOR UPDATE",[publicId,tokenHash]);
  if(!rows.length){await connection.rollback();return NextResponse.json({error:"Quiz attempt not found."},{status:404});}
  const a=rows[0];
  if(a.status==="in_progress"){
   const [answers]:any=await connection.execute("SELECT aq.question_id,qa.selected_option_id,correct.id AS correct_option_id FROM quiz_attempt_questions aq LEFT JOIN quiz_answers qa ON qa.attempt_id=aq.attempt_id AND qa.question_id=aq.question_id LEFT JOIN quiz_options correct ON correct.question_id=aq.question_id AND correct.is_correct=1 WHERE aq.attempt_id=?",[a.id]);
   let correct=0,wrong=0,unanswered=0,score=0;
   for(const row of answers){const selected=row.selected_option_id==null?null:Number(row.selected_option_id);const isCorrect=selected!==null&&selected===Number(row.correct_option_id);if(selected===null)unanswered++;else if(isCorrect){correct++;score+=Number(a.marks_per_question);}else{wrong++;score-=Number(a.negative_marking);}
    await connection.execute("UPDATE quiz_answers SET is_correct=?,marks_awarded=? WHERE attempt_id=? AND question_id=?",[isCorrect?1:0,isCorrect?Number(a.marks_per_question):(selected===null?0:-Number(a.negative_marking)),a.id,row.question_id]);
   }
   score=Math.max(0,score);const expired=new Date(a.expires_at).getTime()<=Date.now();const duration=Math.max(0,Math.min(Number(a.duration_seconds)||Math.floor((Date.now()-new Date(a.started_at).getTime())/1000),Math.floor((new Date(a.expires_at).getTime()-new Date(a.started_at).getTime())/1000)));
   await connection.execute("UPDATE quiz_attempts SET status=?,score=?,correct_count=?,wrong_count=?,unanswered_count=?,duration_seconds=?,submitted_at=NOW() WHERE id=?",[expired?"expired":"submitted",score,correct,wrong,unanswered,duration,a.id]);
  }
  await connection.commit();
  const [resultRows]:any=await getPool().execute("SELECT a.public_id,a.status,a.score,a.total_marks,a.total_questions,a.correct_count,a.wrong_count,a.unanswered_count,a.duration_seconds,a.submitted_at,a.display_name FROM (SELECT at.*,p.display_name FROM quiz_attempts at JOIN quiz_participants p ON p.id=at.participant_id WHERE at.public_id=?) a",[publicId]);
  const result=resultRows[0];
  const [review]:any=await getPool().execute("SELECT q.id,q.question_text,q.question_text_hi,q.explanation,q.explanation_hi,selected.option_text AS selected_text,selected.option_text_hi AS selected_text_hi,correct.option_text AS correct_text,correct.option_text_hi AS correct_text_hi,qa.is_correct,qa.marks_awarded FROM quiz_attempt_questions aq JOIN quiz_questions q ON q.id=aq.question_id LEFT JOIN quiz_answers qa ON qa.attempt_id=aq.attempt_id AND qa.question_id=aq.question_id LEFT JOIN quiz_options selected ON selected.id=qa.selected_option_id LEFT JOIN quiz_options correct ON correct.question_id=q.id AND correct.is_correct=1 WHERE aq.attempt_id=(SELECT id FROM quiz_attempts WHERE public_id=?) ORDER BY aq.question_order",[publicId]);
  const [leaderboardRows]:any=await getPool().execute("SELECT a.participant_id,p.display_name,a.score,a.total_marks,a.duration_seconds,a.submitted_at,a.quiz_id,q.title FROM quiz_attempts a JOIN quiz_participants p ON p.id=a.participant_id JOIN quizzes q ON q.id=a.quiz_id WHERE a.category_id=? AND a.status IN ('submitted','expired') ORDER BY a.score DESC,a.duration_seconds ASC,a.submitted_at ASC LIMIT 500",[a.category_id]);
  const best=new Map<number,any>();for(const row of leaderboardRows){const participantId=Number(row.participant_id);if(!best.has(participantId))best.set(participantId,row);}
  const leaderboard=Array.from(best.values()).slice(0,100).map((row:any,index:number)=>({...row,rank:index+1,is_current:Number(row.participant_id)===Number(a.participant_id)}));
  return NextResponse.json({result,review,leaderboard});
 }catch(error){if(connection)await connection.rollback();console.error("Quiz submission failed:",error);return NextResponse.json({error:"Could not submit this quiz."},{status:500});}
 finally{connection?.release();}
}
