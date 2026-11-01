import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { makeSlug } from "@/lib/slug";

export async function GET(){
  try { await requireAdmin(); const [rows]=await getPool().query("SELECT id,name,slug,description,is_active,created_at FROM categories ORDER BY name ASC"); return NextResponse.json({categories:rows}); }
  catch(e:any){ return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":"Could not load categories."},{status:e.message==="UNAUTHORIZED"?401:500}); }
}
export async function POST(req:Request){
  try {
    await requireAdmin(); const b=await req.json();
    const name=String(b.name||"").trim(); const slug=makeSlug(String(b.slug||name)); const description=String(b.description||"").trim();
    if(!name||!slug) return NextResponse.json({error:"Category name and slug are required."},{status:400});
    const [r]:any=await getPool().execute("INSERT INTO categories (name,slug,description,is_active) VALUES (?,?,?,?)",[name,slug,description||null,b.is_active===false?0:1]);
    return NextResponse.json({ok:true,id:r.insertId});
  } catch(e:any){return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":e.code==="ER_DUP_ENTRY"?"This category slug already exists.":"Could not create category."},{status:e.message==="UNAUTHORIZED"?401:400});}
}
export async function PATCH(req:Request){
  try { await requireAdmin(); const b=await req.json(); const id=Number(b.id); const name=String(b.name||"").trim(); const slug=makeSlug(String(b.slug||name)); if(!id||!name||!slug) return NextResponse.json({error:"Invalid category details."},{status:400});
    await getPool().execute("UPDATE categories SET name=?,slug=?,description=?,is_active=? WHERE id=?",[name,slug,String(b.description||"").trim()||null,b.is_active===false?0:1,id]); return NextResponse.json({ok:true});
  } catch(e:any){return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":e.code==="ER_DUP_ENTRY"?"This category slug already exists.":"Could not update category."},{status:e.message==="UNAUTHORIZED"?401:400});}
}
export async function DELETE(req:Request){
  try { await requireAdmin(); const id=Number(new URL(req.url).searchParams.get("id")); if(!id)return NextResponse.json({error:"Invalid category."},{status:400});
    const [used]:any=await getPool().execute("SELECT COUNT(*) AS total FROM posts WHERE category_id=?",[id]); if(Number(used[0].total)>0)return NextResponse.json({error:"This category has posts. Move or delete those posts before deleting the category."},{status:409});
    await getPool().execute("DELETE FROM categories WHERE id=?",[id]); return NextResponse.json({ok:true});
  } catch(e:any){return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":"Could not delete category."},{status:e.message==="UNAUTHORIZED"?401:400});}
}
