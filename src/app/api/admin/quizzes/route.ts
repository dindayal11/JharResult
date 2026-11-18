import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { makeSlug } from "@/lib/slug";

function cleanQuiz(body:any){
  const title=String(body.title||"").trim();
  const categoryId=Number(body.category_id);
  const questions=Array.isArray(body.questions)?body.questions:[];
  if(!title||!Number.isInteger(categoryId)||categoryId<1) throw new Error("Quiz title and category are required.");
  if(!questions.length) throw new Error("Add at least one question before saving.");
  if(questions.length>200) throw new Error("A quiz can contain up to 200 questions.");
  const normalized=questions.map((q:any,i:number)=>{
    const question=String(q.question_text||"").trim();
    const questionHi=String(q.question_text_hi||"").trim();
    const options=Array.isArray(q.options)?q.options.map((o:any)=>({text:String(o.text||"").trim(),textHi:String(o.text_hi||"").trim()||null})):[];
    const correct=Number(q.correct_index);
    if((!question&&!questionHi)||options.length!==4||options.some((o:any)=>!o.text&&!o.textHi)||!Number.isInteger(correct)||correct<0||correct>3)
      throw new Error(`Question ${i+1}: enter the question in Hindi or English, all four options and select the correct answer.`);
    return {question,questionHi,explanation:String(q.explanation||"").trim()||null,explanationHi:String(q.explanation_hi||"").trim()||null,difficulty:["easy","medium","hard"].includes(q.difficulty)?q.difficulty:"medium",options,correct};
  });
  const duration=Math.max(1,Math.min(240,Number(body.duration_minutes)||20));
  const marks=Math.max(0.25,Math.min(100,Number(body.marks_per_question)||1));
  const negative=Math.max(0,Math.min(marks,Number(body.negative_marking)||0));
  const language=["both","hindi","english"].includes(body.language)?body.language:"both";
  const status=body.status==="published"?"published":"draft";
  return {title,categoryId,questions:normalized,duration,marks,negative,language,status,description:String(body.description||"").trim()||null,instructions:String(body.instructions||"").trim()||null};
}
async function saveQuiz(connection:any,body:any,id?:number){
  const b=cleanQuiz(body);
  const [cats]:any=await connection.execute("SELECT c.id,(SELECT COUNT(*) FROM quiz_categories child WHERE child.parent_id=c.id AND child.is_active=1) AS child_count FROM quiz_categories c WHERE c.id=? AND c.is_active=1",[b.categoryId]);
  if(!cats.length) throw new Error("Selected quiz category is not available.");
  if(Number(cats[0].child_count)>0) throw new Error("Please select the deepest category (subject or chapter) for this quiz.");
  const base=makeSlug(b.title).slice(0,220)||"practice-quiz";
  let slug=base,n=2;
  while(true){
    const [found]:any=await connection.execute(`SELECT id FROM quizzes WHERE slug=? ${id?"AND id<>?":""} LIMIT 1`,id?[slug,id]:[slug]);
    if(!found.length)break;
    slug=`${base.slice(0,230)}-${n++}`;
  }
  if(id){
    const [exists]:any=await connection.execute("SELECT id FROM quizzes WHERE id=?",[id]);
    if(!exists.length) throw new Error("Quiz not found.");
    await connection.execute("UPDATE quizzes SET category_id=?,title=?,slug=?,description=?,instructions=?,question_count=?,duration_minutes=?,marks_per_question=?,negative_marking=?,language=?,status=?,published_at=IF(?,COALESCE(published_at,NOW()),NULL) WHERE id=?",
      [b.categoryId,b.title,slug,b.description,b.instructions,b.questions.length,b.duration,b.marks,b.negative,b.language,b.status,b.status==="published"?1:0,id]);
    await connection.execute("DELETE FROM quiz_questions WHERE quiz_id=?",[id]);
  }else{
    const [result]:any=await connection.execute("INSERT INTO quizzes (category_id,title,slug,description,instructions,question_count,duration_minutes,marks_per_question,negative_marking,language,status,published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,IF(?,NOW(),NULL))",
      [b.categoryId,b.title,slug,b.description,b.instructions,b.questions.length,b.duration,b.marks,b.negative,b.language,b.status,b.status==="published"?1:0]);
    id=Number(result.insertId);
  }
  for(const q of b.questions){
    const [qr]:any=await connection.execute("INSERT INTO quiz_questions (quiz_id,question_text,question_text_hi,explanation,explanation_hi,difficulty) VALUES (?,?,?,?,?,?)",[id,q.question,q.questionHi,q.explanation,q.explanationHi,q.difficulty]);
    const values=q.options.map((option:any,index:number)=>[qr.insertId,option.text,option.textHi,index===q.correct?1:0,index+1]);
    await connection.query("INSERT INTO quiz_options (question_id,option_text,option_text_hi,is_correct,sort_order) VALUES ?",[values.map((v:any)=>[v[0],v[1],v[2],v[3],v[4]])]);
  }
  return {id,slug};
}
export async function GET(req:Request){
  try{
    await requireAdmin();
    const id=Number(new URL(req.url).searchParams.get("id"));
    if(id){
      const [rows]:any=await getPool().execute("SELECT * FROM quizzes WHERE id=?",[id]);
      if(!rows.length)return NextResponse.json({error:"Quiz not found."},{status:404});
      const [questions]:any=await getPool().execute("SELECT * FROM quiz_questions WHERE quiz_id=? ORDER BY id",[id]);
      for(const q of questions){const [opts]:any=await getPool().execute("SELECT option_text,option_text_hi,is_correct FROM quiz_options WHERE question_id=? ORDER BY sort_order",[q.id]);q.options=opts;}
      return NextResponse.json({quiz:rows[0],questions});
    }
    const [categories]:any=await getPool().query("SELECT c.id,c.parent_id,c.name,c.slug,c.category_type,p.name AS parent_name FROM quiz_categories c LEFT JOIN quiz_categories p ON p.id=c.parent_id WHERE c.is_active=1 AND NOT EXISTS (SELECT 1 FROM quiz_categories child WHERE child.parent_id=c.id AND child.is_active=1) ORDER BY c.sort_order,c.id");
    const [quizzes]:any=await getPool().query("SELECT q.id,q.title,q.slug,q.status,q.question_count,q.duration_minutes,q.created_at,c.name AS category_name,p.name AS parent_name FROM quizzes q JOIN quiz_categories c ON c.id=q.category_id LEFT JOIN quiz_categories p ON p.id=c.parent_id ORDER BY q.created_at DESC LIMIT 300");
    return NextResponse.json({categories,quizzes});
  }catch(e:any){return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":"Could not load quiz manager."},{status:e.message==="UNAUTHORIZED"?401:500});}
}
export async function POST(req:Request){
  let connection:any;
  try{
    await requireAdmin();
    const body=await req.json();
    connection=await getPool().getConnection();
    await connection.beginTransaction();
    if(Array.isArray(body.quizzes)){
      const classId=Number(body.replace_class_id);
      if(!Number.isInteger(classId)||classId<1)throw new Error("Select a valid JAC class for replacement.");
      if(!body.quizzes.length)throw new Error("The import file contains no quizzes.");
      if(body.quizzes.length>300)throw new Error("A class import can contain up to 300 quizzes.");
      const [categoryRows]:any=await connection.query("SELECT id,parent_id,slug,category_type FROM quiz_categories WHERE is_active=1");
      const byId=new Map<number,any>(categoryRows.map((row:any)=>[Number(row.id),row]));
      const classCategory=byId.get(classId);
      const root=classCategory?.parent_id===null?null:byId.get(Number(classCategory?.parent_id));
      if(!classCategory||!root||root.slug!=="jac-board"||classCategory.category_type!=="jac_board")
        throw new Error("Replacement is allowed only for a class directly under JAC Board.");
      const descendants=new Set<number>([classId]);let changed=true;
      while(changed){changed=false;for(const row of categoryRows){const id=Number(row.id),parent=row.parent_id===null?null:Number(row.parent_id);if(parent!==null&&descendants.has(parent)&&!descendants.has(id)){descendants.add(id);changed=true;}}}
      const seenCategories=new Set<number>();
      for(let i=0;i<body.quizzes.length;i++){
        const quiz=body.quizzes[i];const categoryId=Number(quiz.category_id);
        if(!Number.isInteger(categoryId)||!descendants.has(categoryId)||categoryId===classId)
          throw new Error("Quiz "+(i+1)+" does not belong to the selected class.");
        if(seenCategories.has(categoryId))throw new Error("The import file contains more than one quiz for the same final category. Combine those questions into one quiz.");
        seenCategories.add(categoryId);
        cleanQuiz(quiz);
      }
      const ids=Array.from(descendants);const placeholders=ids.map(()=>"?").join(",");
      await connection.execute("UPDATE quizzes SET status='archived' WHERE category_id IN ("+placeholders+") AND status IN ('draft','published')",ids);
      const imported=[];
      for(const quiz of body.quizzes)imported.push(await saveQuiz(connection,{...quiz,status:"published"}));
      await connection.commit();
      return NextResponse.json({ok:true,imported_count:imported.length,class_category_id:classId});
    }
    const result=await saveQuiz(connection,body);
    await connection.commit();
    return NextResponse.json({ok:true,...result});
  }catch(e:any){
    if(connection)await connection.rollback();
    const unauthorized=e.message==="UNAUTHORIZED";
    return NextResponse.json({error:unauthorized?"Please sign in.":e.message||"Could not save quiz."},{status:unauthorized?401:400});
  }finally{connection?.release();}
}
export async function PUT(req:Request){
  let connection:any;
  try{await requireAdmin();const body=await req.json();const id=Number(body.id);if(!Number.isInteger(id)||id<1)return NextResponse.json({error:"Invalid quiz ID."},{status:400});connection=await getPool().getConnection();await connection.beginTransaction();const result=await saveQuiz(connection,body,id);await connection.commit();return NextResponse.json({ok:true,...result});}
  catch(e:any){if(connection)await connection.rollback();const unauthorized=e.message==="UNAUTHORIZED";return NextResponse.json({error:unauthorized?"Please sign in.":e.message||"Could not update quiz."},{status:unauthorized?401:400});}
  finally{connection?.release();}
}
export async function DELETE(req:Request){
  try{await requireAdmin();const id=Number(new URL(req.url).searchParams.get("id"));if(!Number.isInteger(id)||id<1)return NextResponse.json({error:"Invalid quiz ID."},{status:400});await getPool().execute("DELETE FROM quizzes WHERE id=?",[id]);return NextResponse.json({ok:true});}
  catch(e:any){const unauthorized=e.message==="UNAUTHORIZED";return NextResponse.json({error:unauthorized?"Please sign in.":"Could not delete quiz."},{status:unauthorized?401:500});}
}