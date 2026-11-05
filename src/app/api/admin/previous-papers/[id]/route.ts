import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { unlink } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{id:string}> }) {
  try {
    await requireAdmin();
    const {id}=await params;
    const [rows]=await getPool().execute("SELECT * FROM previous_year_papers WHERE id=? LIMIT 1",[id]);
    const paper=(rows as any[])[0];
    if(!paper) return NextResponse.json({error:"Paper not found."},{status:404});
    return NextResponse.json({paper});
  } catch(error:any) {
    return NextResponse.json({error:error?.message==="UNAUTHORIZED"?"Please sign in as admin.":"Could not load paper."},{status:error?.message==="UNAUTHORIZED"?401:500});
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{id:string}> }) {
  try {
    await requireAdmin();
    const {id}=await params;
    const b=await request.json();
    const title=String(b.title||"").trim(), exam=String(b.exam_name||"").trim();
    const subject=String(b.subject||"").trim(), year=Number(b.year);
    const pdf=String(b.pdf_url||"").trim(), solution=String(b.solution_pdf_url||"").trim();
    if(!title||!exam||!subject||!pdf) return NextResponse.json({error:"Title, exam, subject and question paper PDF are required."},{status:400});
    if(!Number.isInteger(year)||year<1950||year>2100) return NextResponse.json({error:"Please enter a valid year."},{status:400});
    if(!pdf.startsWith("/uploads/previous-papers/")||(solution&&!solution.startsWith("/uploads/previous-papers/"))) return NextResponse.json({error:"Invalid PDF file path."},{status:400});
    await getPool().execute(`UPDATE previous_year_papers SET title=?,exam_name=?,course=?,stream=?,subject=?,year=?,semester=?,description=?,pdf_url=?,solution_pdf_url=?,status=? WHERE id=?`,
      [title,exam,String(b.course||"").trim()||null,String(b.stream||"").trim()||null,subject,year,String(b.semester||"").trim()||null,String(b.description||"").trim()||null,pdf,solution||null,b.status==="published"?"published":"draft",id]);
    return NextResponse.json({ok:true});
  } catch(error:any) {
    return NextResponse.json({error:error?.message==="UNAUTHORIZED"?"Please sign in as admin.":"Could not update paper."},{status:error?.message==="UNAUTHORIZED"?401:500});
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{id:string}> }) {
  try {
    await requireAdmin();
    const {id}=await params;
    const [rows]=await getPool().execute("SELECT pdf_url,solution_pdf_url FROM previous_year_papers WHERE id=? LIMIT 1",[id]);
    const paper=(rows as any[])[0];
    if(!paper) return NextResponse.json({error:"Paper not found."},{status:404});
    await getPool().execute("DELETE FROM previous_year_papers WHERE id=?",[id]);
    for(const url of [paper.pdf_url,paper.solution_pdf_url]) {
      if(typeof url==="string" && url.startsWith("/uploads/previous-papers/")) {
        const filename=path.basename(url);
        if(filename && filename===url.split("/").pop()) {
          try { await unlink(path.join(process.cwd(),"public","uploads","previous-papers",filename)); } catch {}
        }
      }
    }
    return NextResponse.json({ok:true});
  } catch(error:any) {
    return NextResponse.json({error:error?.message==="UNAUTHORIZED"?"Please sign in as admin.":"Could not delete paper."},{status:error?.message==="UNAUTHORIZED"?401:500});
  }
}
