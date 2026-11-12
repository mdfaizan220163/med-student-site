import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(req:NextRequest){
 try{
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please log in to use Study Notebook.",loginRequired:true},{status:401});
  const key=process.env.GEMINI_API_KEY;
  if(!key)return NextResponse.json({error:"Add GEMINI_API_KEY in Vercel to use Study Notebook."},{status:503});
  const form=await req.formData();const file=form.get("file");const question=String(form.get("question")||"").trim();const history=String(form.get("history")||"");
  if(!(file instanceof File)||file.type!=="application/pdf")return NextResponse.json({error:"Upload a PDF textbook, lecture handout, or notes file."},{status:400});
  if(file.size>12*1024*1024)return NextResponse.json({error:"PDF must be 12 MB or smaller."},{status:413});
  if(!question||question.length>5000)return NextResponse.json({error:"Enter a question (maximum 5,000 characters)."},{status:400});
  const base64=Buffer.from(await file.arrayBuffer()).toString("base64");
  const prompt=`You are Faizan AI Study Notebook. Answer the student's question using ONLY the uploaded PDF as the source of factual claims. Use clear MBBS-level explanations, headings and concise bullets. Cite the PDF page number beside each important claim when the page is identifiable. Never invent page numbers, quotations, or facts. If the PDF does not contain the answer, say so clearly. Distinguish what the document states from general explanation. Conversation so far:\n${history.slice(-10000)}\n\nStudent question: ${question}`;
  const model=process.env.GEMINI_MODEL||"gemini-2.5-flash";
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt},{inline_data:{mime_type:"application/pdf",data:base64}}]}],generationConfig:{temperature:.2,maxOutputTokens:3500}}),signal:AbortSignal.timeout(55000)});
  const data=await response.json();if(!response.ok)return NextResponse.json({error:data?.error?.message||"Gemini could not read this PDF."},{status:502});
  const answer=data?.candidates?.[0]?.content?.parts?.map((p:{text?:string})=>p.text||"").join("").trim();
  if(!answer)return NextResponse.json({error:"No answer was returned. Try a shorter question or a smaller PDF."},{status:502});
  return NextResponse.json({answer,provider:"Gemini"});
 }catch(e){console.error("Study Notebook:",e);return NextResponse.json({error:e instanceof Error?e.message:"Study Notebook request failed."},{status:502});}
}