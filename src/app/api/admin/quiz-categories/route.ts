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
