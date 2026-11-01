import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getPool } from "@/lib/db";
import PostEditor from "@/components/PostEditor";
export const dynamic="force-dynamic";
export default async function EditPost({params}:{params:Promise<{id:string}>}){
 if(!await getSession()) redirect("/admin/login");
 const {id}=await params;
 const [rows]=await getPool().execute("SELECT * FROM posts WHERE id=?",[id]);
 const p=(rows as any[])[0]; if(!p) notFound();
 const [cats]=await getPool().query("SELECT id,name FROM categories ORDER BY name");
 return <main className="container" style={{padding:"30px 0"}}><h1>Edit Update</h1><PostEditor categories={cats as {id:number;name:string}[]} post={p}/></main>;
}
