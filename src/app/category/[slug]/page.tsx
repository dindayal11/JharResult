import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import { getPool } from "@/lib/db";
import type { PostRow } from "@/lib/posts";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function CategoryPage({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params;
 const [cats]=await getPool().execute("SELECT id,name FROM categories WHERE slug=? LIMIT 1",[slug]);
 const cat=(cats as any[])[0]; if(!cat) notFound();
 const [rows]=await getPool().execute(`SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM posts p JOIN categories c ON c.id=p.category_id WHERE p.category_id=? AND p.status='published' ORDER BY p.published_at DESC LIMIT 100`,[cat.id]);
 const posts=rows as PostRow[];
 return <><SiteHeader/><main className="container" style={{padding:"28px 0"}}><h1>{cat.name}</h1><p className="muted">Jharkhand {cat.name.toLowerCase()} updates</p>{posts.length?<div className="grid">{posts.map(p=><PostCard key={p.id} post={p}/>)}</div>:<div className="panel">No updates in this category yet.</div>}</main></>;
}
