import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";
import PostEditor from "@/components/PostEditor";
export const dynamic="force-dynamic";
export default async function NewPost(){
 if(!await getSession()) redirect("/admin/login");
 const [cats]=await getPool().query("SELECT id,name FROM categories ORDER BY name");
 return <main className="container" style={{padding:"30px 0"}}><h1>Create Jharkhand Update</h1><PostEditor categories={cats as {id:number;name:string}[]}/></main>;
}
