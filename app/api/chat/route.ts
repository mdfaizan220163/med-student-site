import {NextRequest,NextResponse} from "next/server";
import {generateWithFallback,Message} from "@/lib/ai-providers";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
const SYSTEM=`You are Faizan AI, a medical study assistant for MBBS students. Explain clearly at MBBS level using concise headings and bullets. Clinical cases are educational, not diagnoses. For medical images describe only visible findings and limitations. Never invent citations or guidelines.`;
export async function POST(req:NextRequest){try{
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Please log in to use Faizan AI.",loginRequired:true},{status:401});
 const body=await req.json();const messages=body.messages as Message[];const provider=typeof body.provider==="string"?body.provider:"auto";
 if(!Array.isArray(messages)||!messages.length||messages.length>12)return NextResponse.json({error:"Send between 1 and 12 recent messages."},{status:400});
 if(!["auto","gemini","groq","claude","openai"].includes(provider))return NextResponse.json({error:"Unknown provider."},{status:400});
 for(const m of messages){if(!m||!["user","assistant"].includes(m.role)||!(typeof m.content==="string"||Array.isArray(m.content)))return NextResponse.json({error:"Invalid message format."},{status:400});if(typeof m.content==="string"&&m.content.length>12000)return NextResponse.json({error:"A message is too long."},{status:400});if(Array.isArray(m.content))for(const p of m.content)if(p.type==="image_url"&&(!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(p.image_url?.url||"")||p.image_url.url.length>6800000))return NextResponse.json({error:"Unsupported image. Use JPEG, PNG, WebP or GIF under 5 MB."},{status:400});}
 if(messages[messages.length-1].role!=="user")return NextResponse.json({error:"The last message must be from the user."},{status:400});
 return NextResponse.json(await generateWithFallback(messages,SYSTEM,provider,1800));
 }catch(e){const message=e instanceof Error?e.message:"AI request failed.";console.error("Faizan AI:",message);return NextResponse.json({error:message},{status:502});}}