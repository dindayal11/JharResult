"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";

type Category={id:number;parent_id:number|null;name:string;slug:string;category_type:string;parent_name?:string|null};
type Question={question_text:string;question_text_hi:string;explanation:string;explanation_hi:string;difficulty:string;options:{text:string}[];correct_index:number};
type Quiz={id:number;title:string;slug:string;status:string;question_count:number;duration_minutes:number;category_name:string;parent_name:string|null};
const blankQuestion=():Question=>({question_text:"",question_text_hi:"",explanation:"",explanation_hi:"",difficulty:"medium",options:[{text:""},{text:""},{text:""},{text:""}],correct_index:0});
const blankForm=()=>({id:0,title:"",category_id:"",description:"",instructions:"",duration_minutes:20,marks_per_question:1,negative_marking:0,language:"both",status:"draft",questions:[blankQuestion()] as Question[]});
export default function QuizManager(){
 const [categories,setCategories]=useState<Category[]>([]);const [allCategories,setAllCategories]=useState<Category[]>([]);const [quizzes,setQuizzes]=useState<Quiz[]>([]);const [form,setForm]=useState<any>(blankForm());const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");const [autoSaveStatus,setAutoSaveStatus]=useState("");const [recoveryReady,setRecoveryReady]=useState(false);const autoSavePromiseRef=useRef<Promise<void>|null>(null);const editingPublishedRef=useRef(false);const recoveryKey="jharresult-quiz-manager-recovery-v1";
 async function load(){setLoading(true);const [r,cr]=await Promise.all([fetch("/api/admin/quizzes"),fetch("/api/admin/quiz-categories")]);if(r.status===401||cr.status===401){location.href="/admin/login";return;}const d=await r.json();const cd=await cr.json();setCategories(d.categories||[]);setAllCategories(cd.categories||[]);setQuizzes(d.quizzes||[]);setError(d.error||cd.error||"");setLoading(false);}
 function categoryPath(id:number):string{const c=allCategories.find(x=>x.id===id);if(!c)return "";return c.parent_id?categoryPath(c.parent_id)+" / "+c.name:c.name;}
 async function importQuizFile(e:any){
  const input=e.currentTarget as HTMLInputElement;const file=input.files?.[0];if(!file)return;let imported=false;
  setBusy(true);setError("");setNotice("");
  try{
   const raw=JSON.parse(await file.text());
   if(raw.format!=="jharresult.quiz-import.v1")throw new Error("Invalid JharResult quiz import file.");
   const cr=await fetch("/api/admin/quiz-categories");const cd=await cr.json();if(!cr.ok)throw new Error(cd.error||"Could not load categories.");
   let list:Category[]=cd.categories||[];
   async function resolveCategoryPath(path:any){
    if(!Array.isArray(path)||!path.length||path.some((name:any)=>typeof name!=="string"||!name.trim()))throw new Error("Every quiz must include a complete category_path.");
    let parentId:number|null=null;
    for(const rawName of path){
     const name=rawName.trim();
     let found=list.find(c=>c.name===name&&c.parent_id===parentId);
     if(!found){
      if(parentId===null)throw new Error("Parent category not found: "+name);
      const created=await fetch("/api/admin/quiz-categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,parent_id:parentId,description:""})});
      const data=await created.json();if(!created.ok)throw new Error(data.error||("Could not create category: "+name));
      const refreshed=await fetch("/api/admin/quiz-categories");const refreshedData=await refreshed.json();if(!refreshed.ok)throw new Error(refreshedData.error||"Could not refresh categories.");
      list=refreshedData.categories||[];found=list.find(c=>c.id===Number(data.id));
     }
     if(!found)throw new Error("Could not resolve category: "+name);
     parentId=found.id;
    }
    if(!parentId)throw new Error("Category path is incomplete.");
    return parentId;
   }
   if(Array.isArray(raw.quizzes)){
    if(!Array.isArray(raw.class_path)||raw.class_path.length!==2)throw new Error("Class-wise JSON must include class_path with JAC Board and one class name.");
    if(!raw.quizzes.length)throw new Error("The class-wise JSON contains no quizzes.");
    const className=String(raw.class_path[1]);
    const confirmed=window.confirm("Replace all existing quizzes for "+className+" with "+raw.quizzes.length+" quizzes from this file?\\n\\nOther classes will remain unchanged. Previous quiz attempts and results will be preserved.");
    if(!confirmed)return;
    const classId=await resolveCategoryPath(raw.class_path);
    const prepared=[];
    for(let i=0;i<raw.quizzes.length;i++){
     const quiz=raw.quizzes[i];
     if(!quiz||!Array.isArray(quiz.category_path)||quiz.category_path.length<3||quiz.category_path[0]!==raw.class_path[0]||quiz.category_path[1]!==raw.class_path[1])throw new Error("Quiz "+(i+1)+": category_path must start with the selected class path.");
     const categoryId=await resolveCategoryPath(quiz.category_path);
     prepared.push({...quiz,category_id:categoryId});
    }
    const saved=await fetch("/api/admin/quizzes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({replace_class_id:classId,quizzes:prepared})});
    const result=await saved.json();if(!saved.ok)throw new Error(result.error||"Class-wise replacement failed.");
    setNotice(className+" MCQs replaced successfully. "+result.imported_count+" quizzes imported; previous attempts and results preserved.");imported=true;await load();
   }else{
    if(!raw.quiz||!Array.isArray(raw.quiz.category_path)||!Array.isArray(raw.quiz.questions)||!raw.quiz.questions.length)throw new Error("Invalid JharResult quiz import file.");
    const categoryId=await resolveCategoryPath(raw.quiz.category_path);
    const payload={...raw.quiz,category_id:categoryId,status:"published"};
    const saved=await fetch("/api/admin/quizzes",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const result=await saved.json();if(!saved.ok)throw new Error(result.error||"Quiz import failed.");
    setNotice("Quiz imported and published successfully: "+raw.quiz.title);imported=true;await load();
   }
  }catch(err:any){setError(err.message||"Could not import quiz file.");}
  finally{setBusy(false);if(imported)input.value="";}
 }

 useEffect(()=>{load()},[]);
 useEffect(()=>{try{const raw=window.localStorage.getItem(recoveryKey);if(raw){const snapshot=JSON.parse(raw);const age=Date.now()-Number(snapshot.savedAt||0);if(snapshot.version===1&&age>=0&&age<=7*24*60*60*1000&&snapshot.form){if(window.confirm("A recently auto-saved Quiz Manager draft was found. Restore your unsaved quiz changes?")){setForm(snapshot.form);setAutoSaveStatus("Recovered unsaved quiz changes from this browser");}else{window.localStorage.removeItem(recoveryKey);}}else{window.localStorage.removeItem(recoveryKey);}}}catch{}finally{setRecoveryReady(true);}},[]);
 useEffect(()=>{if(!recoveryReady||busy)return;const timer=window.setTimeout(()=>{try{if(form.title?.trim()||form.questions?.some((q:Question)=>q.question_text||q.question_text_hi||q.options.some(o=>o.text))){window.localStorage.setItem(recoveryKey,JSON.stringify({version:1,savedAt:Date.now(),form}));if(!autoSaveStatus.startsWith("Draft saved")&&!autoSaveStatus.startsWith("Recovered"))setAutoSaveStatus("Recovery copy saved on this computer");}}catch{setAutoSaveStatus("Browser recovery unavailable — keep this page open and save manually.");}},500);return()=>window.clearTimeout(timer);},[recoveryReady,form,busy]);
 // Automatically save valid quiz drafts on the server. Published quiz edits are kept locally until manually submitted.
 useEffect(()=>{if(editingPublishedRef.current||!recoveryReady||busy||!form.title?.trim()||!form.category_id||form.status!=="draft")return;const questions=form.questions||[];if(!questions.length||questions.some((q:Question)=>(!q.question_text?.trim()&&!q.question_text_hi?.trim())||q.options.length!==4||q.options.some(o=>!o.text.trim())))return;const timer=window.setTimeout(()=>{const previous=autoSavePromiseRef.current;const request=(async()=>{try{if(previous)await previous;const payload={...form,status:"draft"};const response=await fetch("/api/admin/quizzes",{method:form.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error||"Auto-save failed");if(!form.id&&data.id)setForm((current:any)=>({...current,id:Number(data.id)}));setAutoSaveStatus("Draft saved automatically");}catch{setAutoSaveStatus("Auto-save pending — keep this page open and use Save Quiz before leaving.");}})();const tracked=request.finally(()=>{if(autoSavePromiseRef.current===tracked)autoSavePromiseRef.current=null;});autoSavePromiseRef.current=tracked;},1200);return()=>window.clearTimeout(timer);},[recoveryReady,form,busy]);
 function setQuestion(index:number,key:string,value:any){setForm((f:any)=>({...f,questions:f.questions.map((q:Question,i:number)=>i===index?{...q,[key]:value}:q)}));}
 function setOption(qi:number,oi:number,value:string){setForm((f:any)=>({...f,questions:f.questions.map((q:Question,i:number)=>i===qi?{...q,options:q.options.map((o,j)=>j===oi?{text:value}:o)}:q)}));}
 function addQuestion(){setForm((f:any)=>({...f,questions:[blankQuestion(),...f.questions]}));setAutoSaveStatus("New question added at the top");}
 async function edit(id:number){setError("");setNotice("");const r=await fetch("/api/admin/quizzes?id="+id);const d=await r.json();if(!r.ok){setError(d.error||"Could not load quiz");return;}const q=d.questions.map((item:any)=>({...item,correct_index:Math.max(0,item.options.findIndex((o:any)=>Number(o.is_correct)===1)),options:item.options.map((o:any)=>({text:o.option_text}))}));editingPublishedRef.current=d.quiz.status==="published";setForm({...d.quiz,id:d.quiz.id,category_id:String(d.quiz.category_id),questions:q});window.scrollTo({top:0,behavior:"smooth"});}
 async function save(e:any){e.preventDefault();setBusy(true);setError("");setNotice("");if(autoSavePromiseRef.current)await autoSavePromiseRef.current;const r=await fetch("/api/admin/quizzes",{method:form.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();setBusy(false);if(!r.ok){setError(d.error||"Could not save quiz");return;}setNotice(form.status==="published"?"Quiz published successfully.":"Quiz saved as draft.");try{window.localStorage.removeItem(recoveryKey);}catch{}editingPublishedRef.current=false;setAutoSaveStatus("");setForm(blankForm());await load();}
 async function remove(id:number){if(!confirm("Delete this quiz and its questions? This cannot be undone."))return;const r=await fetch("/api/admin/quizzes?id="+id,{method:"DELETE"});const d=await r.json();if(!r.ok){setError(d.error||"Delete failed");return;}setNotice("Quiz deleted.");load();}
 return <main className="container" style={{padding:"28px 0 45px",maxWidth:1120}}>
 <div style={{marginBottom:18}}><Link href="/admin">← Admin Dashboard</Link><h1 style={{margin:"9px 0 3px",color:"#173f68"}}>Quiz Manager</h1><p className="muted">Create practice tests, manage question banks and publish quizzes for JAC and Jharkhand competitive exams.</p></div>
 <section className="panel" style={{padding:18,borderRadius:10,border:"1px solid #dce4ee",marginBottom:18}}><h2 style={{marginTop:0}}>Bulk Quiz Import</h2><p className="muted" style={{fontSize:13}}>Upload the existing single-quiz JSON format or a class-wise JSON package with <code>class_path</code> and <code>quizzes</code>. Class-wise imports replace all quizzes in that class in one transaction; other classes stay unchanged and previous attempts/results are preserved.</p><label style={{display:"grid",gap:8,fontSize:13,fontWeight:700,color:"#34445a"}}>Choose quiz import file<input type="file" accept=".json,application/json" onChange={importQuizFile}/></label>{busy&&<p role="status" aria-live="polite" style={{color:"#1756a9",fontWeight:600}}>Importing quiz and preparing categories… Please wait.</p>}{error&&<p role="alert" style={{color:"#b42318",fontWeight:700,whiteSpace:"pre-wrap"}}>{error}</p>}{notice&&<p role="status" style={{color:"#16834a",fontWeight:700}}>{notice}</p>}</section>
 <section className="panel" style={{padding:16,borderRadius:10,border:"1px solid #dce4ee",marginBottom:18,display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap"}}><div><h2 style={{margin:"0 0 5px"}}>Category Structure Manager</h2><p className="muted" style={{fontSize:13,margin:0}}>Manage parent categories, subcategories and nested chapters on a separate page.</p></div><Link className="btn" href="/admin/quiz-categories">Open Category Manager →</Link></section>
 <section className="panel" style={{padding:20,borderRadius:10,border:"1px solid #dce4ee"}}>
 <h2 style={{marginTop:0}}>{form.id?"Edit Quiz":"Create New Quiz"}</h2>
 <form onSubmit={save} style={{display:"grid",gap:14}}>
 <div className="qm-grid">
 <label>Quiz title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. JAC Class 10 Science Practice Test"/></label>
 <label>Class / Exam category<select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{categoryPath(c.id)||c.name}</option>)}</select></label>
 <label>Duration (minutes)<input type="number" min="1" max="240" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:Number(e.target.value)})}/></label>
 <label>Marks per question<input type="number" min=".25" max="100" step=".25" value={form.marks_per_question} onChange={e=>setForm({...form,marks_per_question:Number(e.target.value)})}/></label>
 <label>Negative marking<input type="number" min="0" step=".25" value={form.negative_marking} onChange={e=>setForm({...form,negative_marking:Number(e.target.value)})}/></label>
 <label>Language<select value={form.language} onChange={e=>setForm({...form,language:e.target.value})}><option value="both">Hindi + English</option><option value="hindi">Hindi</option><option value="english">English</option></select></label>
 </div>
 <label>Description<textarea rows={2} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Short introduction shown to students"/></label>
 <label>Instructions<textarea rows={2} value={form.instructions||""} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Instructions before starting the quiz"/></label>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,flexWrap:"wrap"}}><h3 style={{margin:0}}>Question Bank ({form.questions.length})</h3><button type="button" className="btn" onClick={addQuestion}>＋ Add Question</button></div>
 {form.questions.map((q:Question,i:number)=><section key={i} style={{padding:15,border:"1px solid #dce4ee",borderRadius:8,background:"#f9fbfd"}}>
 <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><strong style={{color:"#173f68"}}>Question {i+1}</strong><button type="button" onClick={()=>setForm((f:any)=>({...f,questions:f.questions.filter((_:any,j:number)=>j!==i)}))} disabled={form.questions.length===1} style={{border:0,background:"transparent",color:"#b42318",fontWeight:700,cursor:"pointer"}}>Remove</button></div>
 <label>Question (Hindi – optional)<textarea rows={2} value={q.question_text_hi} onChange={e=>setQuestion(i,"question_text_hi",e.target.value)}/></label>
 <label>Question (English – optional)<textarea rows={2} value={q.question_text} onChange={e=>setQuestion(i,"question_text",e.target.value)}/></label>
 <div className="qm-options">{q.options.map((o,j)=><label key={j}>Option {String.fromCharCode(65+j)}<input required value={o.text} onChange={e=>setOption(i,j,e.target.value)}/></label>)}</div>
 <label>Correct answer<select value={q.correct_index} onChange={e=>setQuestion(i,"correct_index",Number(e.target.value))}>{q.options.map((o,j)=><option key={j} value={j}>{String.fromCharCode(65+j)} – {o.text||"Option "+(j+1)}</option>)}</select></label>
 <label>Explanation (optional)<textarea rows={2} value={q.explanation} onChange={e=>setQuestion(i,"explanation",e.target.value)}/></label>
 <label>Explanation (Hindi – optional)<textarea rows={2} value={q.explanation_hi} onChange={e=>setQuestion(i,"explanation_hi",e.target.value)}/></label>
 <label>Difficulty<select value={q.difficulty} onChange={e=>setQuestion(i,"difficulty",e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
 </section>)}
 <div className="qm-grid"><label>Save status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Draft</option><option value="published">Publish now</option></select></label></div>
 {error&&<p style={{margin:0,color:"#b42318",fontWeight:600}}>{error}</p>}{notice&&<p style={{margin:0,color:"#16834a",fontWeight:600}}>{notice}</p>}
 <div style={{display:"flex",gap:9,flexWrap:"wrap",alignItems:"center"}}><button className="btn" disabled={busy}>{busy?"Saving...":form.id?"Update Quiz":"Save Quiz"}</button><span role="status" aria-live="polite" style={{fontSize:12,color:autoSaveStatus.startsWith("Draft saved")?"#16834a":"#64748b"}}>{autoSaveStatus||"Auto-save starts after quiz title, category and complete question details are entered."}</span>{form.id&&<button type="button" className="btn" style={{background:"#64748b"}} onClick={()=>setForm(blankForm())}>Cancel Edit</button>}</div>
 </form>
 </section>
 <section className="panel" style={{marginTop:20,padding:18,overflowX:"auto"}}><h2 style={{marginTop:0}}>Existing Quizzes ({quizzes.length})</h2>{loading?<p>Loading quizzes…</p>:quizzes.length===0?<p className="muted">No quizzes created yet.</p>:<table style={{width:"100%",minWidth:650,borderCollapse:"collapse",fontSize:13}}><thead><tr><th align="left">Quiz</th><th align="left">Category</th><th>Questions</th><th>Status</th><th>Actions</th></tr></thead><tbody>{quizzes.map(q=><tr key={q.id} style={{borderTop:"1px solid #e6eaf0"}}><td style={{padding:"11px 5px",fontWeight:700}}>{q.title}</td><td>{q.parent_name?q.parent_name+" / ":""}{q.category_name}</td><td align="center">{q.question_count}</td><td align="center">{q.status}</td><td style={{whiteSpace:"nowrap",padding:8}}><button className="btn" type="button" onClick={()=>edit(q.id)}>Edit</button> <button className="btn" type="button" style={{background:"#b42318"}} onClick={()=>remove(q.id)}>Delete</button></td></tr>)}</tbody></table>}</section>
 <style>{`.qm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.qm-grid label,form>label,section>label{display:grid;gap:6px;font-size:13px;font-weight:700;color:#34445a}.qm-grid input,.qm-grid select,form>label input,form>label textarea,form>label select,section>label textarea,section>label select{width:100%;padding:10px 11px;border:1px solid #bdc9d7;border-radius:5px;background:white;color:#182638;font:inherit;font-weight:400}.qm-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}.qm-options label{display:grid;gap:5px;font-size:12px;font-weight:700;color:#52657c}.qm-options input{width:100%;padding:10px;border:1px solid #bdc9d7;border-radius:5px}@media(max-width:650px){.qm-grid,.qm-options{grid-template-columns:1fr}}`}</style>
 </main>;
}
