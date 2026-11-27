import {NextRequest,NextResponse} from "next/server";
import {generateWithFallback,Message,Part} from "@/lib/ai-providers";
import {getYandexMedicalMaterials} from "@/lib/yandex-medical-library";
export const runtime="nodejs";
const SYSTEM=`You are Faizan AI, a medical study assistant for MBBS students. Explain clearly at MBBS level using concise headings and bullets. Clinical cases are educational, not diagnoses. For medical images describe only visible findings and limitations. Never invent citations or guidelines.

MEDICAL KNOWLEDGE PRIORITY:
1. First use the relevant material supplied from the user's Yandex Disk medical library (PDFs and original images attached to this request).
2. Then use established medical knowledge only to clarify gaps, and explicitly distinguish general knowledge from what the uploaded material says.
3. Do not claim a fact is in a source unless it is supported by the attached material. If relevant material was not retrieved or does not cover the question, say so plainly.
4. Never invent book/page references. Do not add book or page numbers unless the user explicitly asks.
5. Preserve the source's terminology and level of detail. For pathology, prioritize Robbins & Cotran and the user's lecture/practical material when those files are supplied.
6. Use attached original images only when relevant to the question. Do not claim generated diagrams are original textbook images.`;
export async function POST(req:NextRequest){try{
 const body=await req.json();const messages=body.messages as Message[];const provider=typeof body.provider==="string"?body.provider:"auto";
 if(!Array.isArray(messages)||!messages.length||messages.length>12)return NextResponse.json({error:"Send between 1 and 12 recent messages."},{status:400});
 if(!["auto","deepseek","gemini","groq","claude","openai"].includes(provider))return NextResponse.json({error:"Unknown provider."},{status:400});
 for(const m of messages){if(!m||!["user","assistant"].includes(m.role)||!(typeof m.content==="string"||Array.isArray(m.content)))return NextResponse.json({error:"Invalid message format."},{status:400});if(typeof m.content==="string"&&m.content.length>12000)return NextResponse.json({error:"A message is too long."},{status:400});if(Array.isArray(m.content))for(const p of m.content)if(p.type==="image_url"&&(!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(p.image_url?.url||"")||p.image_url.url.length>6800000))return NextResponse.json({error:"Unsupported image. Use JPEG, PNG, WebP or GIF under 5 MB."},{status:400});}
 if(messages[messages.length-1].role!=="user")return NextResponse.json({error:"The last message must be from the user."},{status:400});
 const latest=messages[messages.length-1];
 const query=typeof latest.content==="string"?latest.content:latest.content.filter((p)=>p.type==="text").map((p)=>p.text).join(" ");
 const library=await getYandexMedicalMaterials(query);
 const enriched:Message[]=messages.map((m)=>({...m}));
 if(library.documents.length||library.images.length){
   const extra:Part[]=[];
   for(const doc of library.documents.slice(0,3))extra.push({type:"file_pdf",name:doc.name,data:doc.data});
   for(const image of library.images.filter((im)=>im.score>0).slice(0,2))extra.push({type:"image_url",image_url:{url:`data:${image.mime};base64,${image.data}`}});
   const last=enriched[enriched.length-1];
   const original:Part[]=typeof last.content==="string"?[{type:"text",text:last.content}]:last.content;
   last.content=[...original,...extra,{type:"text",text:`\n\n[Retrieved ${library.documents.length} relevant PDF(s) and ${library.images.filter((im)=>im.score>0).slice(0,2).length} relevant original image(s) from the user's Yandex Disk medical library. Use these as primary references.]`}];
 }
 const response=await generateWithFallback(enriched,SYSTEM,provider,1800);
 return NextResponse.json({...response,library:{pdfs:library.documents.length,images:library.images.filter((im)=>im.score>0).slice(0,2).length,itemsScanned:library.itemCount,available:library.documents.length>0||library.images.length>0,error:library.error}});
 }catch(e){const message=e instanceof Error?e.message:"AI request failed.";console.error("Faizan AI:",message);return NextResponse.json({error:message},{status:502});}}
