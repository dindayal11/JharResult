"use client";
import Link from "next/link";
import { useEffect,useMemo,useState } from "react";

type Category={id:number;parent_id:number|null;name:string;slug:string;category_type:string;description?:string|null};
export default function QuizCategoryManager(){
 const [categories,setCategories]=useState<Category[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [newCategory,setNewCategory]=useState({name:"",parent_id:"",description:""});
 const [editing,setEditing]=useState<Category|null>(null);
 const [editName,setEditName]=useState("");
 const [editParent,setEditParent]=useState("");
 const [editDescription,setEditDescription]=useState("");
 const [search,setSearch]=useState("");

 async function load(){
  setLoading(true);setError("");
  try{
   const r=await fetch("/api/admin/quiz-categories");
   const d=await r.json();
   if(r.status===401){location.href="/admin/login";return;}
   if(!r.ok)throw new Error(d.error||"Could not load categories.");
   setCategories(d.categories||[]);
  }catch(e:any){setError(e.message||"Could not load categories.");}
  finally{setLoading(false);}
 }
 useEffect(()=>{load();},[]);
 const byId=useMemo(()=>new Map(categories.map(c=>[c.id,c])),[categories]);
 function pathOf(category:Category):string{
  const parts=[category.name];let parent=category.parent_id;let guard=0;
  while(parent!==null&&guard++<30){const p=byId.get(parent);if(!p)break;parts.unshift(p.name);parent=p.parent_id;}
  return parts.join(" / ");
 }
 function depthOf(category:Category){return Math.max(0,pathOf(category).split(" / ").length-1);}
 const filtered=categories.filter(c=>pathOf(c).toLowerCase().includes(search.toLowerCase()));
 const roots=categories.filter(c=>c.parent_id===null);
 function beginEdit(c:Category){setEditing(c);setEditName(c.name);setEditParent(c.parent_id===null?"":String(c.parent_id));setEditDescription(c.description||"");setError("");setNotice("");}
 async function createCategory(e:any){
  e.preventDefault();setSaving(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/quiz-categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newCategory)});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not create category.");
   setNotice("Subcategory created successfully.");setNewCategory({name:"",parent_id:"",description:""});await load();
  }catch(e:any){setError(e.message||"Could not create category.");}
  finally{setSaving(false);}
 }
 async function deleteCategory(category:Category){
  const confirmed=window.confirm(`Delete category "${category.name}"? This is allowed only when it has no quizzes and no active child categories.`);
  if(!confirmed)return;
  setSaving(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/quiz-categories?id="+category.id,{method:"DELETE"});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not delete category.");
   if(editing?.id===category.id)setEditing(null);
   setNotice("Category deleted successfully.");await load();
  }catch(e:any){setError(e.message||"Could not delete category.");}
  finally{setSaving(false);}
 }
 async function updateCategory(e:any){
  e.preventDefault();if(!editing)return;setSaving(true);setError("");setNotice("");
  try{
   const r=await fetch("/api/admin/quiz-categories",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:editing.id,name:editName,parent_id:editParent===""?null:Number(editParent),description:editDescription})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not update category.");
   setNotice("Category updated successfully.");setEditing(null);await load();
  }catch(e:any){setError(e.message||"Could not update category.");}
  finally{setSaving(false);}
 }
 return <main className="container" style={{maxWidth:1120,padding:"28px 0 48px"}}>
  <div style={{marginBottom:20}}>
   <Link href="/admin/quizzes">← Back to Quiz Manager</Link>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap",marginTop:10}}>
    <div><h1 style={{margin:"0 0 5px",color:"#173f68"}}>Category Structure Manager</h1><p className="muted" style={{margin:0}}>Manage parent categories, subjects, subcategories and nested chapters in one place.</p></div>
    <span style={{background:"#eef5ff",color:"#1756a9",padding:"8px 12px",borderRadius:8,fontWeight:700,fontSize:13}}>{categories.length} Categories · {roots.length} Parent Categories</span>
   </div>
  </div>
  {error&&<div role="alert" style={{padding:12,marginBottom:14,borderRadius:8,background:"#fff1f0",color:"#b42318",fontWeight:600}}>{error}</div>}
  {notice&&<div role="status" style={{padding:12,marginBottom:14,borderRadius:8,background:"#ecfdf3",color:"#16834a",fontWeight:600}}>{notice}</div>}
  <div className="managerGrid">
   <section className="panel managerCard">
    <div className="sectionHead"><div><span className="eyebrow">CREATE NEW</span><h2>Create Subcategory</h2><p>Add a subject, chapter or another nested level under an existing parent.</p></div><span className="sectionIcon">＋</span></div>
    <form onSubmit={createCategory} className="managerForm">
     <label>Category name<input required maxLength={120} value={newCategory.name} onChange={e=>setNewCategory({...newCategory,name:e.target.value})} placeholder="e.g. Science or Chapter 1"/></label>
     <label>Parent category<select required value={newCategory.parent_id} onChange={e=>setNewCategory({...newCategory,parent_id:e.target.value})}><option value="">Choose parent category</option>{categories.map(c=><option key={c.id} value={c.id}>{pathOf(c)}</option>)}</select></label>
     <label>Description <span className="optional">(optional)</span><textarea rows={3} value={newCategory.description} onChange={e=>setNewCategory({...newCategory,description:e.target.value})} placeholder="Short description"/></label>
     <button className="btn" disabled={saving}>{saving?"Saving...":"Create Subcategory"}</button>
    </form>
   </section>
   <section className="panel managerCard">
    <div className="sectionHead"><div><span className="eyebrow">EDIT SELECTED</span><h2>{editing?"Edit Category":"Edit Any Category"}</h2><p>{editing?"Update its name, description or move it to another parent.":"Choose Edit from the category list to open its details here."}</p></div><span className="sectionIcon">✎</span></div>
    {editing?<form onSubmit={updateCategory} className="managerForm">
     <div className="selectedPath">Selected: {pathOf(editing)}</div>
     <label>Category name<input required maxLength={120} value={editName} onChange={e=>setEditName(e.target.value)}/></label>
     <label>Parent category<select value={editParent} onChange={e=>setEditParent(e.target.value)}><option value="">No parent · Make this a root category</option>{categories.filter(c=>c.id!==editing.id).map(c=><option key={c.id} value={c.id}>{pathOf(c)}</option>)}</select></label>
     <label>Description <span className="optional">(optional)</span><textarea rows={3} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>
     <div className="buttonRow"><button className="btn" disabled={saving}>{saving?"Saving...":"Save Changes"}</button><button type="button" className="btn secondary" onClick={()=>setEditing(null)}>Cancel</button></div>
    </form>:<div className="emptyEdit"><div className="emptyIcon">✎</div><strong>No category selected</strong><span>Use the Edit button in the category list below.</span></div>}
   </section>
  </div>
  <section className="panel managerCard listCard">
   <div className="listHeader"><div><span className="eyebrow">CATEGORY TREE</span><h2>All Parent & Nested Categories</h2><p>Every level is listed with its complete parent path.</p></div><input className="searchBox" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search categories..."/></div>
   {loading?<p className="muted">Loading category structure…</p>:filtered.length===0?<p className="muted">No categories found.</p>:<div className="categoryList">{filtered.map(c=><div className="categoryRow" key={c.id} style={{paddingLeft:12+Math.min(depthOf(c),6)*22}}>
    <div className="categoryMark" style={{background:depthOf(c)===0?"#eaf2ff":depthOf(c)===1?"#e9f8f1":"#f4efff",color:depthOf(c)===0?"#2563eb":depthOf(c)===1?"#16834a":"#7c3aed"}}>{depthOf(c)===0?"P":depthOf(c)===1?"S":"N"}</div>
    <div className="categoryInfo"><strong>{c.name}</strong><span>{pathOf(c)}</span></div>
    <span className="levelTag">{depthOf(c)===0?"Parent":depthOf(c)===1?"Subcategory":"Nested L"+(depthOf(c)+1)}</span>
    <button type="button" className="btn editBtn" onClick={()=>beginEdit(c)}>Edit</button><button type="button" className="btn deleteBtn" disabled={saving} onClick={()=>deleteCategory(c)}>Delete</button>
   </div>)}</div>}
  </section>
  <style>{`
   .managerGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:16px}
   .managerCard{padding:20px;border:1px solid #dce4ee;border-radius:12px;background:#fff}
   .sectionHead,.listHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
   .sectionHead h2,.listHeader h2{font-size:19px;margin:5px 0;color:#173f68}
   .sectionHead p,.listHeader p{font-size:12px;color:#64748b;margin:0;line-height:1.5}
   .eyebrow{font-size:10px;letter-spacing:1.2px;font-weight:800;color:#64748b}
   .sectionIcon{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#edf4ff;color:#1756a9;font-size:22px;flex-shrink:0}
   .managerForm{display:grid;gap:12px;margin-top:18px}
   .managerForm label{display:grid;gap:6px;font-size:13px;font-weight:700;color:#34445a}
   .managerForm input,.managerForm select,.managerForm textarea,.searchBox{width:100%;padding:10px 11px;border:1px solid #bdc9d7;border-radius:7px;background:white;color:#182638;font:inherit;font-weight:400}
   .optional{font-weight:400;color:#94a3b8}
   .managerForm button{justify-self:start}
   .selectedPath{padding:9px 10px;border-radius:7px;background:#eef5ff;color:#1756a9;font-size:12px;overflow-wrap:anywhere}
   .emptyEdit{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#64748b;text-align:center}
   .emptyEdit strong{color:#334155}.emptyEdit span{font-size:12px}
   .emptyIcon{width:46px;height:46px;border-radius:50%;background:#f1f5f9;display:grid;place-items:center;font-size:22px}
   .buttonRow{display:flex;gap:8px;flex-wrap:wrap}.secondary{background:#64748b}
   .listCard{padding:20px}.listHeader{align-items:center;margin-bottom:14px}
   .searchBox{max-width:260px}
   .categoryList{display:grid;gap:7px}
   .categoryRow{display:flex;align-items:center;gap:11px;padding:9px 10px;border:1px solid #e6ebf1;border-radius:9px;background:#fff;min-width:0}
   .categoryMark{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;font-size:11px;font-weight:800;flex-shrink:0}
   .categoryInfo{display:grid;gap:2px;min-width:0;flex:1}.categoryInfo strong{font-size:13px;color:#263548}.categoryInfo span{font-size:11px;color:#8290a2;overflow-wrap:anywhere}
   .levelTag{font-size:10px;font-weight:700;color:#64748b;background:#f1f5f9;padding:5px 7px;border-radius:20px;white-space:nowrap}
   .editBtn{padding:6px 11px;font-size:12px;flex-shrink:0}.deleteBtn{padding:6px 11px;font-size:12px;flex-shrink:0;background:#b42318}
   @media(max-width:760px){.managerGrid{grid-template-columns:1fr}.listHeader{align-items:stretch;flex-direction:column}.searchBox{max-width:none}.levelTag{display:none}.categoryRow{gap:7px}.categoryInfo span{font-size:10px}}
  `}</style>
 </main>;
}
