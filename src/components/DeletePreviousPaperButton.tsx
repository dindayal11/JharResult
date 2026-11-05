"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePreviousPaperButton({id}:{id:number|string}){
  const [loading,setLoading]=useState(false);
  const router=useRouter();
  async function remove(){
    if(!window.confirm("Delete this paper permanently? Its uploaded PDFs will also be deleted.")) return;
    setLoading(true);
    try{
      const res=await fetch(`/api/admin/previous-papers/${id}`,{method:"DELETE"});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||"Delete failed.");
      router.refresh();
    }catch(e:any){window.alert(e.message||"Could not delete paper.");}
    finally{setLoading(false);}
  }
  return <button type="button" onClick={remove} disabled={loading} style={{border:0,background:"none",color:"#dc2626",fontWeight:600,cursor:loading?"wait":"pointer"}}>{loading?"Deleting...":"Delete"}</button>;
}
