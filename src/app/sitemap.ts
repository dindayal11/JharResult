import type { MetadataRoute } from "next";
import { getPool } from "@/lib/db";
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000";
 let rows:any[]=[];try{const [r]=await getPool().query("SELECT slug,updated_at FROM posts WHERE status='published'");rows=r as any[]}catch{}
 return [{url:base,lastModified:new Date()},...rows.map(p=>({url:`${base}/post/${p.slug}`,lastModified:new Date(p.updated_at)}))];
}
