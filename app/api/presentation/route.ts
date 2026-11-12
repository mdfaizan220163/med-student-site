import {NextRequest,NextResponse} from "next/server";
import PptxGenJS from "pptxgenjs";
import {generateWithFallback} from "@/lib/ai-providers";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=60;

type Slide={title:string;bullets:string[];visual?:string};
type DeckImage={name:string;data:string;type:string;credit:string};
async function fetchOpenImage(query:string):Promise<DeckImage|null>{
 try{
  const url="https://api.openverse.org/v1/images/?"+new URLSearchParams({q:query,license_type:"commercial",page_size:"8",mature:"false"});
  const res=await fetch(url,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(7000)});
  if(!res.ok)return null;
  const body=await res.json();
  for(const item of (body.results||[]).slice(0,8)){
   if(!item.url||!/^https?:\/\//i.test(item.url))continue;
   const img=await fetch(item.url,{signal:AbortSignal.timeout(7000)});
   if(!img.ok)continue;
   const type=(img.headers.get("content-type")||"").split(";")[0];
   if(!["image/jpeg","image/png"].includes(type))continue;
   const bytes=Buffer.from(await img.arrayBuffer());
   if(!bytes.length||bytes.length>4*1024*1024)continue;
   const license=String(item.license||"").toUpperCase();
   const creator=String(item.creator||"Unknown creator").slice(0,80);
   const title=String(item.title||"Open-license image").slice(0,80);
   const page=String(item.foreign_landing_url||item.detail_url||"");
   const licenseUrl=String(item.license_url||"");
   return {name:title,data:bytes.toString("base64"),type,credit:[creator,license,licenseUrl,page].filter(Boolean).join(" · ")};
  }
 }catch(e){console.warn("Openverse image lookup:",e);}
 return null;
}
function addAutoDiagram(s:PptxGenJS.Slide,item:Slide,navy:string){
 const points=(Array.isArray(item.bullets)?item.bullets:[]).slice(0,3).map(x=>clean(x).slice(0,78)).filter(Boolean);
 const heading=clean(item.visual,"Key concepts");
 s.addText("KEY CONCEPTS",{x:8.25,y:1.68,w:4.35,h:.3,fontFace:"Arial",fontSize:10,bold:true,color:"477EAA",charSpacing:1.2,fit:"shrink"});
 s.addText(heading.slice(0,120),{x:8.25,y:2.05,w:4.35,h:.75,fontFace:"Arial",fontSize:14,bold:true,color:navy,fit:"shrink",valign:"mid"});
 points.forEach((p,i)=>{
  const y=3.0+i*1.0;
  s.addShape(PptxGenJS.ShapeType.roundRect,{x:8.25,y,w:4.35,h:.78,rectRadius:.08,line:{color:"D8E5EF",width:1},fill:{color:i===0?"EEF5FA":"F7FAFC"}});
  s.addShape(PptxGenJS.ShapeType.ellipse,{x:8.43,y:y+.22,w:.32,h:.32,line:{color:"477EAA"},fill:{color:"477EAA"}});
  s.addText(String(i+1),{x:8.43,y:y+.245,w:.32,h:.2,fontFace:"Arial",fontSize:9,bold:true,color:"FFFFFF",align:"center",margin:0});
  s.addText(p,{x:8.9,y:y+.12,w:3.48,h:.55,fontFace:"Arial",fontSize:10,color:"263849",fit:"shrink",valign:"mid",margin:.04});
 });
}
const clean=(v:unknown,f="")=>typeof v==="string"?v.replace(/[\u0000-\u001F]/g," ").trim():f;

export async function POST(req:NextRequest){
 try{
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"Please log in to create presentations.",loginRequired:true},{status:401});

  const form=await req.formData();
  const topic=clean(form.get("topic"));
  const language=clean(form.get("language"),"English");
  const count=Math.min(20,Math.max(5,Number(form.get("slides"))||10));
  const provider=clean(form.get("provider"),"auto");
  if(!topic||topic.length>300)return NextResponse.json({error:"Enter a topic (maximum 300 characters)."},{status:400});

  const images:{name:string;data:string;type:string}[]=[];
  let total=0;
  for(const f of form.getAll("images")){
   if(!(f instanceof File)||!["image/png","image/jpeg","image/webp"].includes(f.type))continue;
   total+=f.size;
   if(total>12*1024*1024)return NextResponse.json({error:"Uploaded images must be under 12 MB total."},{status:413});
   images.push({name:f.name,data:Buffer.from(await f.arrayBuffer()).toString("base64"),type:f.type});
  }

  const prompt=`Create a medically accurate MBBS presentation in ${language} about ${topic}. Return only JSON: {"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"visual":"..."}]}. Create exactly ${count} slides, 3-5 concise bullets each. Include objectives, core concepts, clinical relevance, summary and review questions. Never invent citations or guidelines.`;
  const result=await generateWithFallback([{role:"user",content:prompt}],"Create accurate medical education slides. Return valid JSON only.",provider,5000);
  const raw=result.answer.replace(/^\uFEFF/,"").replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  const outline=JSON.parse(raw) as {title?:string;subtitle?:string;slides?:Slide[]};
  if(!Array.isArray(outline.slides)||!outline.slides.length)throw Error("AI returned an invalid slide outline.");

  const pptx=new PptxGenJS();
  pptx.layout="LAYOUT_WIDE";
  pptx.author="Faizan AI";
  pptx.company="Faizan AI";
  pptx.subject=topic;
  pptx.title=clean(outline.title,topic);
  // Arial is widely available in PowerPoint and PDF converters; avoid font substitution.
  pptx.theme={headFontFace:"Arial",bodyFontFace:"Arial"};
  const navy="102B4E";
  const mark=(s:PptxGenJS.Slide)=>s.addText("FAIZAN AI",{x:10.15,y:7.13,w:2.45,h:.18,fontFace:"Arial",fontSize:8,bold:true,color:"8BA2B7",align:"right",margin:0});

  const cover=pptx.addSlide();
  cover.background={color:navy};
  cover.addText(clean(outline.title,topic),{x:.8,y:1.7,w:11.3,h:1.5,fontFace:"Arial",fontSize:30,bold:true,color:"FFFFFF",fit:"shrink",breakLine:false});
  cover.addText(clean(outline.subtitle,"Medical learning presentation"),{x:.85,y:3.5,w:10.8,h:.5,fontFace:"Arial",fontSize:17,color:"D5E4F0"});
  cover.addText("Prepared with Faizan AI",{x:.85,y:6.65,w:5,h:.3,fontFace:"Arial",fontSize:11,color:"B8CDDF"});
  mark(cover);

  const slides=outline.slides.slice(0,count);
  // Prefer user uploads; search Openverse for up to 8 suitable openly licensed images.
  const visualImages:(DeckImage|null)[]=slides.map((_,i)=>images[i]?{...images[i],credit:"User-uploaded image"}:null);
  const candidates=slides.map((item,i)=>({item,i})).filter(x=>!visualImages[x.i]).slice(0,8);
  await Promise.all(candidates.map(async({item,i})=>{
   const terms=[item.title,topic].filter(Boolean).join(" ").slice(0,130);
   visualImages[i]=await fetchOpenImage(terms);
  }));
  for(let i=0;i<slides.length;i++){
   if(!visualImages[i]&&aiFallbacks<3&&process.env.OPENAI_API_KEY){
    visualImages[i]=await generateAiImage([topic,slides[i].title,slides[i].visual||"",...(slides[i].bullets||[]).slice(0,2)].join(". ").slice(0,900));
    if(visualImages[i])aiFallbacks++;
   }
  }
  for(let i=0;i<slides.length;i++){
   const item=slides[i];
   const s=pptx.addSlide();
   s.background={color:"FFFFFF"};
   s.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:.16,line:{color:navy},fill:{color:navy}});
   s.addText(clean(item.title,"Section "+(i+1)),{x:.65,y:.55,w:11.9,h:.72,fontFace:"Arial",fontSize:25,bold:true,color:navy,fit:"shrink"});
   const bullets=Array.isArray(item.bullets)?item.bullets.slice(0,6):[];
   // Use literal bullet characters rather than PowerPoint bullet metadata.
   // This avoids first-character clipping in some PPTX-to-PDF converters.
   const text=bullets.map(b=>"•  "+clean(b)).join("\n");
   const visual=visualImages[i];
   const hasImage=Boolean(visual);
   if(text)s.addText(text,{x:.9,y:1.65,w:hasImage?7.0:7.0,h:4.8,fontFace:"Arial",fontSize:16,color:"263849",breakLine:false,paraSpaceAfter:14,fit:"shrink",margin:.12,valign:"top",lineSpacingMultiple:1.05});
   if(visual){
    s.addImage({data:`data:${visual.type};base64,${visual.data}`,x:8.25,y:1.75,w:4.35,h:4.15});
    s.addText((visual.name+" · "+visual.credit).slice(0,180),{x:8.25,y:5.98,w:4.35,h:.48,fontFace:"Arial",fontSize:6,color:"60788D",fit:"shrink"});
   }else{
    addAutoDiagram(s,item,navy);
   }
   if(item.visual)s.addText("Visual idea: "+clean(item.visual),{x:.9,y:6.55,w:hasImage?7:11.4,h:.25,fontFace:"Arial",fontSize:10,color:"2E6F9E",italic:true,fit:"shrink"});
   s.addText((i+1)+" / "+slides.length,{x:.65,y:7.12,w:.6,h:.18,fontFace:"Arial",fontSize:8,color:"8BA2B7",margin:0});
   mark(s);
  }

  // Keep any additional uploaded images in a clearly labeled gallery slide.
  if(images.length>slides.length){
   const s=pptx.addSlide();
   s.addText("Additional uploaded images",{x:.65,y:.55,w:11.9,h:.7,fontFace:"Arial",fontSize:25,bold:true,color:navy});
   const pos=[{x:.8,y:1.5,w:5.6,h:2.3},{x:6.9,y:1.5,w:5.6,h:2.3},{x:.8,y:4.1,w:5.6,h:2.3},{x:6.9,y:4.1,w:5.6,h:2.3}];
   images.slice(slides.length,4).forEach((im,i)=>{
    const p=pos[i];
    s.addImage({data:`data:${im.type};base64,${im.data}`,x:p.x,y:p.y,w:p.w,h:p.h});
    s.addText(im.name.slice(0,50),{x:p.x,y:p.y+p.h+.05,w:p.w,h:.2,fontFace:"Arial",fontSize:8,color:"60788D"});
   });
   mark(s);
  }

  const out=await pptx.write({outputType:"nodebuffer"});
  const b=Buffer.isBuffer(out)?out:Buffer.from(out as ArrayBuffer);
  const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;
  return new NextResponse(ab,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":'attachment; filename="Faizan-AI-Presentation.pptx"',"Cache-Control":"no-store","X-Faizan-AI-Provider":result.provider}});
 }catch(e){
  console.error("Presentation:",e);
  return NextResponse.json({error:e instanceof Error?e.message:"PowerPoint generation failed."},{status:502});
 }
}
