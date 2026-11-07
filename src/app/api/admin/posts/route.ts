import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { makeSlug } from "@/lib/slug";
import { z } from "zod";
export async function POST(req:Request){
 try{
  await requireAdmin(); const b=z.record(z.any()).parse(await req.json());
  if(!String(b.title||"").trim()) return NextResponse.json({error:"Title is required."},{status:400});
  const slug=makeSlug(String(b.title));
  const pool=getPool();
  const categoryIds=[...new Set((Array.isArray(b.category_ids)?b.category_ids:[b.category_id]).map((value:any)=>Number(value)).filter((value:number)=>Number.isInteger(value)&&value>0))];
  if(!categoryIds.length) return NextResponse.json({error:"Select at least one category."},{status:400});
  const [validCategories]:any=await pool.query("SELECT id FROM categories WHERE id IN (?) AND is_active=1",[categoryIds]);
  if(validCategories.length!==categoryIds.length) return NextResponse.json({error:"One or more selected categories are invalid."},{status:400});
  const connection=await pool.getConnection();
  const json=(v:any)=>{if(!v)return null;try{return JSON.stringify(JSON.parse(v))}catch{return JSON.stringify({details:String(v)})}};
  let result:any;
  try {
  await connection.beginTransaction();
  [result]=await connection.execute(`INSERT INTO posts
  (title,slug,category_id,short_description,organization,source_url,application_url,status,verification_status,important_dates,application_fee,age_limit,vacancy_details,qualification,selection_process,how_to_apply,important_links,faqs,notice_text,seo_title,seo_description,layout_direction,layout_columns,theme_primary,theme_accent,theme_background,theme_text,image_url,image_title,custom_tables,published_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,IF(?='published',NOW(),NULL))`,
  [b.title,slug,categoryIds[0],b.short_description||null,b.organization||null,b.source_url||null,b.application_url||null,b.status||"draft",b.verification_status||"unverified",json(b.important_dates),json(b.application_fee),json(b.age_limit),json(b.vacancy_details),b.qualification||null,b.selection_process||null,b.how_to_apply||null,json(b.important_links),json(b.faqs),b.notice_text||null,b.seo_title||null,b.seo_description||null,b.layout_direction||"row",Number(b.layout_columns)||2,b.theme_primary||"#173f70",b.theme_accent||"#e87920",b.theme_background||"#ffffff",b.theme_text||"#182638",b.image_url||null,b.image_title||null,json(b.custom_tables),b.status||"draft"]);
  await connection.execute("INSERT INTO post_categories (post_id,category_id) VALUES ?",[categoryIds.map((categoryId:number)=>[result.insertId,categoryId])]);
  await connection.commit();
  return NextResponse.json({ok:true,id:result.insertId});
  } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
 }catch(e:any){return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":e.code==="ER_DUP_ENTRY"?"A post with a similar title already exists.":"Could not save post."},{status:e.message==="UNAUTHORIZED"?401:400});}
}
