import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import { getPool } from "@/lib/db";
import type { PostRow } from "@/lib/posts";
export const dynamic = "force-dynamic";
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=""}=await searchParams; let posts:PostRow[]=[];
  if(q.trim()) {
    const [rows]=await getPool().execute(`SELECT p.*,c.name AS category_name,c.slug AS category_slug FROM posts p JOIN categories c ON c.id=p.category_id WHERE p.status='published' AND (p.title LIKE ? OR p.short_description LIKE ? OR p.organization LIKE ?) ORDER BY p.published_at DESC LIMIT 50`,[`%${q}%`,`%${q}%`,`%${q}%`]);
    posts=rows as PostRow[];
  }
  return <><SiteHeader/><main className="container" style={{padding:"28px 0"}}><h1>Search results</h1><p className="muted">Search: {q}</p>{posts.length?<div className="grid">{posts.map(p=><PostCard key={p.id} post={p}/>)}</div>:<div className="panel">No matching published updates found.</div>}</main></>;
}
