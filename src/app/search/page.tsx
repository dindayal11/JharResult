import SiteHeader from "@/components/SiteHeader";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";
import { getPool } from "@/lib/db";
import type { PostRow } from "@/lib/posts";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search Updates", robots: { index: false, follow: true } };
export default async function SearchPage({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const {q=""}=await searchParams; const term=q.trim().slice(0,100); let posts:PostRow[]=[];
  if(term) {
    const [rows]=await getPool().execute(`SELECT DISTINCT p.*,c.name AS category_name,c.slug AS category_slug FROM posts p JOIN categories c ON c.id=p.category_id LEFT JOIN post_categories pc ON pc.post_id=p.id WHERE p.status='published' AND (p.title LIKE ? OR p.short_description LIKE ? OR p.organization LIKE ?) ORDER BY p.published_at DESC LIMIT 50`,[`%${term}%`,`%${term}%`,`%${term}%`]);
    posts=rows as PostRow[];
  }
  return <><SiteHeader/><main className="container" style={{padding:"28px 0"}}><h1>Search results</h1><p className="muted">Search: {term}</p>{posts.length?<div className="grid">{posts.map(p=><PostCard key={p.id} post={p}/>)}</div>:<div className="panel">No matching published updates found.</div>}</main></>;
}
