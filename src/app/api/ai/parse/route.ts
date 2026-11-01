import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";
export const runtime="nodejs";
const schema=z.object({
 title:z.string().default(""),short_description:z.string().default(""),organization:z.string().default(""),
 source_url:z.string().default(""),application_url:z.string().default(""),
 important_dates:z.string().default(""),application_fee:z.string().default(""),age_limit:z.string().default(""),
 vacancy_details:z.string().default(""),qualification:z.string().default(""),selection_process:z.string().default(""),
 how_to_apply:z.string().default(""),important_links:z.string().default(""),faqs:z.string().default(""),
 seo_title:z.string().default(""),seo_description:z.string().default("")
});
export async function POST(req:Request){
 try{
  await requireAdmin();
  const {text}=z.object({text:z.string().min(30).max(60000)}).parse(await req.json());
  if(!process.env.AI_API_KEY)return NextResponse.json({error:"AI_API_KEY is not configured in environment variables."},{status:503});
  const response=await fetch(`${(process.env.AI_BASE_URL||"https://api.openai.com/v1").replace(/\/$/,"")}/chat/completions`,{
   method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${process.env.AI_API_KEY}`},
   body:JSON.stringify({model:process.env.AI_MODEL||"gpt-4o-mini",temperature:0.1,response_format:{type:"json_object"},messages:[
    {role:"system",content:`You extract facts from official Jharkhand government recruitment/education notices. Return only JSON with keys: title, short_description, organization, source_url, application_url, important_dates, application_fee, age_limit, vacancy_details, qualification, selection_process, how_to_apply, important_links, faqs, seo_title, seo_description. Values must be strings. For list/structured fields use valid JSON text strings. CRITICAL: never guess or invent facts, dates, numbers, fees, eligibility, or URLs. If missing, return empty string. Preserve exact facts and conditions. If source URL is not explicitly in the notice, leave blank. Do not imply verification. This is a draft extraction.`},
    {role:"user",content:text}
   ]})
  });
  if(!response.ok)return NextResponse.json({error:"AI provider request failed. Check API key, model and provider quota."},{status:502});
  const payload=await response.json();const content=payload.choices?.[0]?.message?.content;
  const data=schema.parse(JSON.parse(content));return NextResponse.json({data});
 }catch(e:any){return NextResponse.json({error:e.message==="UNAUTHORIZED"?"Please sign in.":e.message||"AI extraction failed."},{status:e.message==="UNAUTHORIZED"?401:400});}
}
