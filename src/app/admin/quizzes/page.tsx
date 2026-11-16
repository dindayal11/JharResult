"use client";
import Link from "next/link";
import { useEffect,useState } from "react";

type Category={id:number;name:string;parent_name:string|null};
type Question={question_text:string;question_text_hi:string;explanation:string;explanation_hi:string;difficulty:string;options:{text:string}[];correct_index:number};
type Quiz={id:number;title:string;slug:string;status:string;question_count:number;duration_minutes:number;category_name:string;parent_name:string|null};
const blankQuestion=():Question=>({question_text:"",question_text_hi:"",explanation:"",explanation_hi:"",difficulty:"medium",options:[{text:""},{text:""},{text:""},{text:""}],correct_index:0});
const blankForm=()=>({id:0,title:"",category_id:"",description:"",instructions:"",duration_minutes:20,marks_per_question:1,negative_marking:0,language:"both",status:"draft",questions:[blankQuestion()] as Question[]});
export default function QuizManager(){
 const [categories,setCategories]=useState<Category[]>([]);const [quizzes,setQuizzes]=useState<Quiz[]>([]);const [form,setForm]=useState<any>(blankForm());const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
 async function load(){setLoading(true);const r=await fetch("/api/admin/quizzes");if(r.status===401){location.href="/admin/login";return;}const d=await r.json();setCategories(d.categories||[]);setQuizzes(d.quizzes||[]);setError(d.error||"");setLoading(false);}
 useEffect(()=>{load()},[]);
 function setQuestion(index:number,key:string,value:any){setForm((f:any)=>({...f,questions:f.questions.map((q:Question,i:number)=>i===index?{...q,[key]:value}:q)}));}
 function setOption(qi:number,oi:number,value:string){setForm((f:any)=>({...f,questions:f.questions.map((q:Question,i:number)=>i===qi?{...q,options:q.options.map((o,j)=>j===oi?{text:value}:o)}:q)}));}
 function addQuestion(){setForm((f:any)=>({...f,questions:[...f.questions,blankQuestion()]}));}
 async function edit(id:number){setError("");setNotice("");const r=await fetch("/api/admin/quizzes?id="+id);const d=await r.json();if(!r.ok){setError(d.error||"Could not load quiz");return;}const q=d.questions.map((item:any)=>({...item,correct_index:Math.max(0,item.options.findIndex((o:any)=>Number(o.is_correct)===1)),options:item.options.map((o:any)=>({text:o.option_text}))}));setForm({...d.quiz,id:d.quiz.id,category_id:String(d.quiz.category_id),questions:q});window.scrollTo({top:0,behavior:"smooth"});}
 async function save(e:any){e.preventDefault();setBusy(true);setError("");setNotice("");const r=await fetch("/api/admin/quizzes",{method:form.id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();setBusy(false);if(!r.ok){setError(d.error||"Could not save quiz");return;}setNotice(form.status==="published"?"Quiz published successfully.":"Quiz saved as draft.");setForm(blankForm());await load();}
 async function remove(id:number){if(!confirm("Delete this quiz and its questions? This cannot be undone."))return;const r=await fetch("/api/admin/quizzes?id="+id,{method:"DELETE"});const d=await r.json();if(!r.ok){setError(d.error||"Delete failed");return;}setNotice("Quiz deleted.");load();}
 return <main className="container" style={{padding:"28px 0 45px",maxWidth:1120}}>
 <div style={{marginBottom:18}}><Link href="/admin">← Admin Dashboard</Link><h1 style={{margin:"9px 0 3px",color:"#173f68"}}>Quiz Manager</h1><p className="muted">Create practice tests, manage question banks and publish quizzes for JAC and Jharkhand competitive exams.</p></div>
 <section className="panel" style={{padding:20,borderRadius:10,border:"1px solid #dce4ee"}}>
 <h2 style={{marginTop:0}}>{form.id?"Edit Quiz":"Create New Quiz"}</h2>
 <form onSubmit={save} style={{display:"grid",gap:14}}>
 <div className="qm-grid">
 <label>Quiz title<input required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. JAC Class 10 Science Practice Test"/></label>
 <label>Class / Exam category<select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Select category</option>{categories.map(c=><option key={c.id} value={c.id}>{c.parent_name?c.parent_name+" / ":""}{c.name}</option>)}</select></label>
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
 <label>Question (English – optional)<textarea rows={2} value={q.question_text} onChange={e=>setQuestion(i,"question_text",e.target.value)}/></label>
 <label>Question (Hindi – optional)<textarea rows={2} value={q.question_text_hi} onChange={e=>setQuestion(i,"question_text_hi",e.target.value)}/></label>
 <div className="qm-options">{q.options.map((o,j)=><label key={j}>Option {String.fromCharCode(65+j)}<input required value={o.text} onChange={e=>setOption(i,j,e.target.value)}/></label>)}</div>
 <label>Correct answer<select value={q.correct_index} onChange={e=>setQuestion(i,"correct_index",Number(e.target.value))}>{q.options.map((o,j)=><option key={j} value={j}>{String.fromCharCode(65+j)} – {o.text||"Option "+(j+1)}</option>)}</select></label>
 <label>Explanation (optional)<textarea rows={2} value={q.explanation} onChange={e=>setQuestion(i,"explanation",e.target.value)}/></label>
 <label>Explanation (Hindi – optional)<textarea rows={2} value={q.explanation_hi} onChange={e=>setQuestion(i,"explanation_hi",e.target.value)}/></label>
 <label>Difficulty<select value={q.difficulty} onChange={e=>setQuestion(i,"difficulty",e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
 </section>)}
 <div className="qm-grid"><label>Save status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Draft</option><option value="published">Publish now</option></select></label></div>
 {error&&<p style={{margin:0,color:"#b42318",fontWeight:600}}>{error}</p>}{notice&&<p style={{margin:0,color:"#16834a",fontWeight:600}}>{notice}</p>}
 <div style={{display:"flex",gap:9,flexWrap:"wrap"}}><button className="btn" disabled={busy}>{busy?"Saving...":form.id?"Update Quiz":"Save Quiz"}</button>{form.id&&<button type="button" className="btn" style={{background:"#64748b"}} onClick={()=>setForm(blankForm())}>Cancel Edit</button>}</div>
 </form>
 </section>
 <section className="panel" style={{marginTop:20,padding:18,overflowX:"auto"}}><h2 style={{marginTop:0}}>Existing Quizzes ({quizzes.length})</h2>{loading?<p>Loading quizzes…</p>:quizzes.length===0?<p className="muted">No quizzes created yet.</p>:<table style={{width:"100%",minWidth:650,borderCollapse:"collapse",fontSize:13}}><thead><tr><th align="left">Quiz</th><th align="left">Category</th><th>Questions</th><th>Status</th><th>Actions</th></tr></thead><tbody>{quizzes.map(q=><tr key={q.id} style={{borderTop:"1px solid #e6eaf0"}}><td style={{padding:"11px 5px",fontWeight:700}}>{q.title}</td><td>{q.parent_name?q.parent_name+" / ":""}{q.category_name}</td><td align="center">{q.question_count}</td><td align="center">{q.status}</td><td style={{whiteSpace:"nowrap",padding:8}}><button className="btn" type="button" onClick={()=>edit(q.id)}>Edit</button> <button className="btn" type="button" style={{background:"#b42318"}} onClick={()=>remove(q.id)}>Delete</button></td></tr>)}</tbody></table>}</section>
 <style>{`.qm-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.qm-grid label,form>label,section>label{display:grid;gap:6px;font-size:13px;font-weight:700;color:#34445a}.qm-grid input,.qm-grid select,form>label input,form>label textarea,form>label select,section>label textarea,section>label select{width:100%;padding:10px 11px;border:1px solid #bdc9d7;border-radius:5px;background:white;color:#182638;font:inherit;font-weight:400}.qm-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}.qm-options label{display:grid;gap:5px;font-size:12px;font-weight:700;color:#52657c}.qm-options input{width:100%;padding:10px;border:1px solid #bdc9d7;border-radius:5px}@media(max-width:650px){.qm-grid,.qm-options{grid-template-columns:1fr}}`}</style>
 </main>;
}
