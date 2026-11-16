import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { getPool } from "@/lib/db";
export const runtime="nodejs";
export async function POST(req:Request){
 try{
  const jar=await cookies();const token=jar.get("jhar_quiz_token")?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return NextResponse.json({error:"Quiz session not found."},{status:401});
  const tokenHash=createHash("sha256").update(token).digest("hex");
  const body=await req.json();const attemptId=String(body.attempt_id||"");const questionId=Number(body.question_id);const optionId=body.selected_option_id==null?null:Number(body.selected_option_id);
  if(!attemptId||!Number.isInteger(questionId)||questionId<1||(optionId!==null&&(!Number.isInteger(optionId)||optionId<1)))return NextResponse.json({error:"Invalid answer."},{status:400});
  const [rows]:any=await getPool().execute("SELECT a.id,a.status,a.expires_at FROM quiz_attempts a JOIN quiz_participants p ON p.id=a.participant_id WHERE a.public_id=? AND p.token_hash=? LIMIT 1",[attemptId,tokenHash]);
  if(!rows.length)return NextResponse.json({error:"Quiz attempt not found."},{status:404});
  const attempt=rows[0];if(attempt.status!=="in_progress"||new Date(attempt.expires_at).getTime()<=Date.now())return NextResponse.json({error:"Time is up. Submit your quiz to see the result."},{status:409});
  const [allowed]:any=await getPool().execute("SELECT aq.question_id FROM quiz_attempt_questions aq WHERE aq.attempt_id=? AND aq.question_id=?",[attempt.id,questionId]);
  if(!allowed.length)return NextResponse.json({error:"Question does not belong to this attempt."},{status:400});
  if(optionId!==null){const [valid]:any=await getPool().execute("SELECT id FROM quiz_options WHERE id=? AND question_id=?",[optionId,questionId]);if(!valid.length)return NextResponse.json({error:"Selected option is invalid."},{status:400});}
  await getPool().execute("INSERT INTO quiz_answers(attempt_id,question_id,selected_option_id,answered_at) VALUES(?,?,?,NOW()) ON DUPLICATE KEY UPDATE selected_option_id=VALUES(selected_option_id),answered_at=NOW()",[attempt.id,questionId,optionId]);
  return NextResponse.json({ok:true});
 }catch(error){console.error("Quiz answer save failed:",error);return NextResponse.json({error:"Could not save this answer."},{status:500});}
}
