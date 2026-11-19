import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { makeSlug } from "@/lib/slug";

export async function GET(){
  try{
    await requireAdmin();
    const [categories]:any=await getPool().query(
      "SELECT id,parent_id,name,slug,category_type,description,sort_order,is_active FROM quiz_categories WHERE is_active=1 ORDER BY sort_order,id"
    );
    return NextResponse.json({categories});
  }catch(e:any){
    const unauthorized=e.message==="UNAUTHORIZED";
    return NextResponse.json({error:unauthorized?"Please sign in.":"Could not load quiz categories."},{status:unauthorized?401:500});
  }
}

export async function POST(req:Request){
  try{
    await requireAdmin();
    const body=await req.json();
    const name=String(body.name||"").trim();
    const parentId=Number(body.parent_id);
    const description=String(body.description||"").trim()||null;
    if(!name||name.length>120||!Number.isInteger(parentId)||parentId<1)
      return NextResponse.json({error:"Enter a category name and select its parent category."},{status:400});

    const [parents]:any=await getPool().execute(
      "SELECT id,category_type FROM quiz_categories WHERE id=? AND is_active=1 LIMIT 1",[parentId]
    );
    if(!parents.length)
      return NextResponse.json({error:"Selected parent category is not available."},{status:400});

    const base=makeSlug(name).slice(0,130)||"quiz-category";
    let slug=base;
    let suffix=2;
    while(true){
      const [existing]:any=await getPool().execute("SELECT id FROM quiz_categories WHERE slug=? LIMIT 1",[slug]);
      if(!existing.length)break;
      slug=`${base.slice(0,130-suffix.toString().length-1)}-${suffix++}`;
    }
    const [result]:any=await getPool().execute(
      "INSERT INTO quiz_categories (parent_id,name,slug,category_type,description,sort_order,is_active) VALUES (?,?,?,?,?,0,1)",
      [parentId,name,slug,parents[0].category_type,description]
    );
    return NextResponse.json({ok:true,id:result.insertId,slug});
  }catch(e:any){
    const unauthorized=e.message==="UNAUTHORIZED";
    return NextResponse.json({error:unauthorized?"Please sign in.":e.code==="ER_DUP_ENTRY"?"A category with this URL already exists.":"Could not create category."},{status:unauthorized?401:400});
  }
}

export async function PUT(req:Request){
  try{
    await requireAdmin();
    const body=await req.json();
    const id=Number(body.id);
    const name=String(body.name||"").trim();
    const description=String(body.description||"").trim()||null;
    const parentId=body.parent_id===null||body.parent_id===""?null:Number(body.parent_id);
    if(!Number.isInteger(id)||id<1||!name||name.length>120)
      return NextResponse.json({error:"Enter a valid category and name."},{status:400});
    if(parentId!==null&&(!Number.isInteger(parentId)||parentId<1||parentId===id))
      return NextResponse.json({error:"Select a valid parent category."},{status:400});

    const pool=getPool();
    const [currentRows]:any=await pool.execute("SELECT id,parent_id,slug FROM quiz_categories WHERE id=? AND is_active=1 LIMIT 1",[id]);
    if(!currentRows.length)return NextResponse.json({error:"Category not found."},{status:404});

    if(parentId!==null){
      const [parentRows]:any=await pool.execute("SELECT id,category_type FROM quiz_categories WHERE id=? AND is_active=1 LIMIT 1",[parentId]);
      if(!parentRows.length)return NextResponse.json({error:"Selected parent category is not available."},{status:400});
      // Walk upward from the proposed parent; encountering this category would create a cycle.
      let cursor:number|null=parentId;
      const visited=new Set<number>();
      while(cursor!==null){
        if(cursor===id)return NextResponse.json({error:"A category cannot be moved inside itself or one of its child categories."},{status:400});
        if(visited.has(cursor))return NextResponse.json({error:"The existing category hierarchy contains a cycle."},{status:400});
        visited.add(cursor);
        const [rows]:any=await pool.execute("SELECT parent_id FROM quiz_categories WHERE id=? AND is_active=1 LIMIT 1",[cursor]);
        cursor=rows.length&&rows[0].parent_id!==null?Number(rows[0].parent_id):null;
      }
    }

    const base=makeSlug(name).slice(0,130)||"quiz-category";
    let slug=base,suffix=2;
    while(true){
      const [existing]:any=await pool.execute("SELECT id FROM quiz_categories WHERE slug=? AND id<>? LIMIT 1",[slug,id]);
      if(!existing.length)break;
      slug=`${base.slice(0,130-suffix.toString().length-1)}-${suffix++}`;
    }
    await pool.execute(
      "UPDATE quiz_categories SET parent_id=?,name=?,slug=?,description=? WHERE id=? AND is_active=1",
      [parentId,name,slug,description,id]
    );
    return NextResponse.json({ok:true,id,slug});
  }catch(e:any){
    const unauthorized=e.message==="UNAUTHORIZED";
    return NextResponse.json({error:unauthorized?"Please sign in.":e.code==="ER_DUP_ENTRY"?"A category with this URL already exists.":"Could not update category."},{status:unauthorized?401:400});
  }
}


export async function DELETE(req:Request){
  let connection:any;
  try{
    await requireAdmin();
    const id=Number(new URL(req.url).searchParams.get("id"));
    if(!Number.isInteger(id)||id<1)
      return NextResponse.json({error:"Invalid category ID."},{status:400});
    connection=await getPool().getConnection();
    await connection.beginTransaction();
    const [rows]:any=await connection.execute("SELECT id,name FROM quiz_categories WHERE id=? AND is_active=1 LIMIT 1",[id]);
    if(!rows.length)throw new Error("Category not found or already deleted.");
    const [categoryRows]:any=await connection.query("SELECT id,parent_id FROM quiz_categories WHERE is_active=1");
    const descendants=new Set<number>([id]);let changed=true;
    while(changed){
      changed=false;
      for(const row of categoryRows){
        const childId=Number(row.id),parentId=row.parent_id===null?null:Number(row.parent_id);
        if(parentId!==null&&descendants.has(parentId)&&!descendants.has(childId)){
          descendants.add(childId);changed=true;
        }
      }
    }
    const ids=Array.from(descendants);
    const placeholders=ids.map(()=>"?").join(",");
    const [quizRows]:any=await connection.execute("SELECT id FROM quizzes WHERE category_id IN ("+placeholders+")",ids);
    const quizIds=quizRows.map((row:any)=>Number(row.id));
    let deletedAttempts=0;
    if(quizIds.length){
      const quizPlaceholders=quizIds.map(()=>"?").join(",");
      const [attemptRows]:any=await connection.execute("SELECT id FROM quiz_attempts WHERE quiz_id IN ("+quizPlaceholders+")",quizIds);
      const attemptIds=attemptRows.map((row:any)=>Number(row.id));
      if(attemptIds.length){
        const attemptPlaceholders=attemptIds.map(()=>"?").join(",");
        await connection.execute("DELETE FROM quiz_attempt_questions WHERE attempt_id IN ("+attemptPlaceholders+")",attemptIds);
        await connection.execute("DELETE FROM quiz_answers WHERE attempt_id IN ("+attemptPlaceholders+")",attemptIds);
        const [deleted]:any=await connection.execute("DELETE FROM quiz_attempts WHERE id IN ("+attemptPlaceholders+")",attemptIds);
        deletedAttempts=Number(deleted.affectedRows||0);
      }
      await connection.execute("DELETE qo FROM quiz_options qo INNER JOIN quiz_questions qq ON qq.id=qo.question_id WHERE qq.quiz_id IN ("+quizPlaceholders+")",quizIds);
      await connection.execute("DELETE FROM quiz_questions WHERE quiz_id IN ("+quizPlaceholders+")",quizIds);
      await connection.execute("DELETE FROM quizzes WHERE id IN ("+quizPlaceholders+")",quizIds);
    }
    const [deletedCategories]:any=await connection.execute("DELETE FROM quiz_categories WHERE id IN ("+placeholders+")",ids);
    await connection.commit();
    return NextResponse.json({ok:true,message:"Category tree and all related quizzes, attempts and results permanently deleted.",deleted_quizzes:quizIds.length,deleted_attempts:deletedAttempts,deleted_categories:Number(deletedCategories.affectedRows||0),deleted_category_ids:ids});
  }catch(e:any){
    if(connection)await connection.rollback();
    const unauthorized=e.message==="UNAUTHORIZED";
    return NextResponse.json({error:unauthorized?"Please sign in.":e.message||"Could not delete category."},{status:unauthorized?401:400});
  }finally{connection?.release();}
}
