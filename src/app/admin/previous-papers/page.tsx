import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPool } from "@/lib/db";
import DeletePreviousPaperButton from "@/components/DeletePreviousPaperButton";

export const dynamic="force-dynamic";

export default async function ManagePreviousPapersPage(){
  if(!await getSession()) redirect("/admin/login");
  const [rows]=await getPool().query("SELECT id,title,subject,year,status FROM previous_year_papers ORDER BY created_at DESC");
  const papers=rows as any[];
  return <main className="container" style={{padding:"30px 0"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:20}}>
      <div><Link href="/admin" style={{color:"#0756a5"}}>← Admin Dashboard</Link><h1 style={{margin:"10px 0 4px"}}>Manage Previous Year Papers</h1><p className="muted">Edit, publish, unpublish or delete uploaded papers.</p></div>
      <Link className="btn" href="/admin/previous-papers/new">+ Add Paper</Link>
    </div>
    <div className="panel" style={{overflowX:"auto"}}>
      {papers.length===0?<p>No papers uploaded yet.</p>:<table style={{width:"100%",borderCollapse:"collapse",fontSize:14,minWidth:620}}>
        <thead><tr><th align="left">Paper</th><th>Subject</th><th>Year</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{papers.map(p=><tr key={p.id} style={{borderTop:"1px solid #e6eaf0"}}>
          <td style={{padding:"12px 6px"}}>{p.title}</td><td>{p.subject}</td><td>{p.year}</td><td>{p.status}</td>
          <td style={{padding:"12px 6px",whiteSpace:"nowrap"}}><Link href={`/admin/previous-papers/${p.id}/edit`} style={{color:"#0756a5",fontWeight:600,marginRight:14}}>Edit</Link><DeletePreviousPaperButton id={p.id}/></td>
        </tr>)}</tbody>
      </table>}
    </div>
  </main>;
}
