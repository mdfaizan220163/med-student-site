import {NextRequest,NextResponse} from "next/server";
import PptxGenJS from "pptxgenjs";
import {generateWithFallback} from "@/lib/ai-providers";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=120;

type Slide={title:string;bullets:string[];visual?:string};
type DeckImage={name:string;data:string;type:string;credit:string;animated:boolean};
const stopWords=new Set(["the","and","for","with","from","into","about","medical","anatomy","diagram","image","illustration","showing","view","of","in","on","to","a","an","assessment","modern","methods","overview","introduction","principles","clinical","study","lecture"]);
function tokens(value:string){
 return [...new Set(value.toLowerCase().replace(/[^a-z0-9\s-]/g," ").split(/\s+/).filter(w=>w.length>2&&!stopWords.has(w)))];
}
function relevanceScore(query:string,candidate:string){
 const terms=tokens(query), words=new Set(tokens(candidate));
 if(!terms.length||!words.size)return 0;
 return terms.filter(w=>words.has(w)||[...words].some(v=>v.length>4&&(v.includes(w)||w.includes(v)))).length/terms.length;
}
async function fetchCommonsImage(query:string):Promise<DeckImage|null>{
 try{
  const params=new URLSearchParams({action:"query",format:"json",formatversion:"2",generator:"search",gsrsearch:"filetype:bitmap "+query,gsrnamespace:"6",gsrlimit:"8",prop:"imageinfo",iiprop:"url|extmetadata",iiurlwidth:"1200"});
  const res=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString(),{headers:{"Accept":"application/json","User-Agent":"FaizanAI-MedicalSlides/1.0"},signal:AbortSignal.timeout(4500)});
  if(!res.ok)return null;
  const body=await res.json();
  for(const page of body?.query?.pages||[]){
   const info=page.imageinfo?.[0],meta=info?.extmetadata||{};
   const plain=(v:unknown)=>typeof v==="object"&&v!==null&&"value" in v?String((v as {value:unknown}).value).replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").trim():"";
   const candidate=[String(page.title||""),plain(meta.ImageDescription),plain(meta.ObjectName)].join(" ");
   if(relevanceScore(query,candidate)<0.2)continue;
   const originalUrl=typeof info?.url==="string"?info.url:"";
   const imageUrl=originalUrl.toLowerCase().includes(".gif")?originalUrl:(info?.thumburl||info?.url);
   if(typeof imageUrl!=="string"||!(imageUrl.startsWith("https://")||imageUrl.startsWith("http://")))continue;
   const img=await fetch(imageUrl,{signal:AbortSignal.timeout(4500)});
   if(!img.ok)continue;
   const type=(img.headers.get("content-type")||"").split(";")[0].toLowerCase();
   if(!["image/jpeg","image/png","image/gif"].includes(type))continue;
   const bytes=Buffer.from(await img.arrayBuffer());
   if(!bytes.length||bytes.length>6*1024*1024)continue;
   const animated=type==="image/gif"&&bytes.toString("latin1").includes("NETSCAPE2.0");
   const artist=plain(meta.Artist)||"Wikimedia Commons contributor",license=plain(meta.LicenseShortName)||"Open license",licenseUrl=plain(meta.LicenseUrl);
   const pageUrl="https://commons.wikimedia.org/wiki/"+encodeURIComponent(String(page.title||"").replace(/ /g,"_"));
   return {name:String(page.title||"Wikimedia Commons image").replace(/^File:/,"").slice(0,80),data:bytes.toString("base64"),type,credit:[artist,license,licenseUrl,pageUrl].filter(Boolean).join(" · "),animated};
  }
 }catch(e){console.warn("Commons lookup:",e);}
 return null;
}
async function fetchOpenImage(query:string):Promise<DeckImage|null>{
 try{
  const url="https://api.openverse.org/v1/images/?"+new URLSearchParams({q:query,page_size:"8",mature:"false"});
  const res=await fetch(url,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(4500)});
  if(!res.ok)return null;
  const body=await res.json();
  for(const item of body.results||[]){
   if(typeof item.url!=="string"||!(item.url.startsWith("https://")||item.url.startsWith("http://")))continue;
   const candidate=[String(item.title||""),String(item.description||""),...(Array.isArray(item.tags)?item.tags.map((t:any)=>typeof t==="string"?t:String(t.name||"")):[])].join(" ");
   if(relevanceScore(query,candidate)<0.15)continue;
   const img=await fetch(item.url,{signal:AbortSignal.timeout(4500)});
   if(!img.ok)continue;
   const type=(img.headers.get("content-type")||"").split(";")[0].toLowerCase();
   if(!["image/jpeg","image/png","image/gif"].includes(type))continue;
   const bytes=Buffer.from(await img.arrayBuffer());
   if(!bytes.length||bytes.length>6*1024*1024)continue;
    const animated=type==="image/gif"&&bytes.toString("latin1").includes("NETSCAPE2.0");
   const license=String(item.license||"").toUpperCase(),creator=String(item.creator||"Unknown creator").slice(0,80),title=String(item.title||"Open-license image").slice(0,80),page=String(item.foreign_landing_url||item.detail_url||""),licenseUrl=String(item.license_url||"");
   return {name:title,data:bytes.toString("base64"),type,credit:[creator,license,licenseUrl,page].filter(Boolean).join(" · "),animated};
  }
 }catch(e){console.warn("Openverse lookup:",e);}
 return null;
}
function addAutoDiagram(s:PptxGenJS.Slide,item:Slide,navy:string){
 const points=(Array.isArray(item.bullets)?item.bullets:[]).slice(0,3).map(x=>clean(x).slice(0,78)).filter(Boolean);
 const heading=clean(item.visual,"Key concepts");
 s.addText("KEY CONCEPTS",{x:8.25,y:1.68,w:4.35,h:.3,fontFace:"Arial",fontSize:10,bold:true,color:"477EAA",charSpacing:1.2,fit:"shrink"});
 s.addText(heading.slice(0,120),{x:8.25,y:2.05,w:4.35,h:.75,fontFace:"Arial",fontSize:14,bold:true,color:navy,fit:"shrink",valign:"middle"});
 points.forEach((p,i)=>{
  const y=3.0+i*1.0;
  s.addShape("roundRect",{x:8.25,y,w:4.35,h:.78,rectRadius:.08,line:{color:"D8E5EF",width:1},fill:{color:i===0?"EEF5FA":"F7FAFC"}});
  s.addShape("ellipse",{x:8.43,y:y+.22,w:.32,h:.32,line:{color:"477EAA"},fill:{color:"477EAA"}});
  s.addText(String(i+1),{x:8.43,y:y+.245,w:.32,h:.2,fontFace:"Arial",fontSize:9,bold:true,color:"FFFFFF",align:"center",margin:0});
  s.addText(p,{x:8.9,y:y+.12,w:3.48,h:.55,fontFace:"Arial",fontSize:10,color:"263849",fit:"shrink",valign:"middle",margin:.04});
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
  const system = "Create medically accurate MBBS slides. Return exactly one valid JSON object. Use double quotes for every key and string. No markdown fences, comments, or trailing commas. Required shape: {\"title\":\"...\",\"subtitle\":\"...\",\"slides\":[{\"title\":\"...\",\"bullets\":[\"...\"],\"visual\":\"...\"}]}";
  let result = await generateWithFallback([{role:"user",content:prompt}], system, provider, 5000);
  const parseOutline = (answer: string): {title?:string;subtitle?:string;slides?:Slide[]} => {
    const cleaned = answer.replace(/^\\uFEFF/,"").replace(/^\x60\x60\x60(?:json)?\\s*/i,"").replace(/\\s*\x60\x60\x60$/,"").trim();
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first < 0 || last <= first) throw Error("AI did not return a JSON presentation outline.");
    return JSON.parse(cleaned.slice(first,last+1));
  };
  let outline: {title?:string;subtitle?:string;slides?:Slide[]};
  try {
    outline = parseOutline(result.answer);
    if (!Array.isArray(outline.slides) || !outline.slides.length) throw Error("Missing slides");
  } catch (firstError) {
    result = await generateWithFallback([{role:"user",content:prompt+"\\nYour previous response was invalid JSON. Correct it and return a complete JSON object only. Double-quote every key. No markdown, comments, or trailing commas."}], system, provider, 6000);
    try {
      outline = parseOutline(result.answer);
      if (!Array.isArray(outline.slides) || !outline.slides.length) throw Error("Missing slides");
    } catch {
      throw Error("The AI provider returned invalid presentation data twice. Please try again or choose another AI provider.");
    }
  }

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
  // Never assign uploads by order; search each slide independently and reject weak matches.
  const visualImages:(DeckImage|null)[]=slides.map(()=>null);
  // Search images with four workers in parallel; avoid long sequential waits.
  let nextImageIndex=0;
  const imageWorker=async()=>{
   while(true){
    const i=nextImageIndex++;
    if(i>=slides.length)return;
    const item=slides[i];
    const query=[clean(item.title),clean(item.visual)].filter(Boolean).join(" ").slice(0,100);
    if(!query.trim())continue;
    visualImages[i]=await fetchCommonsImage(query)||await fetchOpenImage(query);
    console.info("[Faizan AI] slide image",i+1,visualImages[i]?"found":"diagram fallback");
   }
  };
  await Promise.all(Array.from({length:Math.min(4,slides.length)},()=>imageWorker()));
  for(let i=0;i<slides.length;i++){
   const item=slides[i];
   const queries=[clean(item.title),clean(item.visual),clean(item.title)+" medical illustration"].map(q=>q.trim().slice(0,100)).filter((q,index,all)=>q.length>2&&all.indexOf(q)===index);
   for(const query of queries){
    visualImages[i]=await fetchCommonsImage(query)||await fetchOpenImage(query);
    if(visualImages[i])break;
   }
   console.info("[Faizan AI] slide image",i+1,visualImages[i]?"relevant match found":"no suitable open-license image",queries);
  }
  for(let i=0;i<slides.length;i++){
   const item=slides[i];
   const s=pptx.addSlide();
   s.background={color:"FFFFFF"};
   s.addShape("rect",{x:0,y:0,w:13.333,h:.16,line:{color:navy},fill:{color:navy}});
   s.addText(clean(item.title,"Section "+(i+1)),{x:.65,y:.55,w:11.9,h:.72,fontFace:"Arial",fontSize:25,bold:true,color:navy,fit:"shrink"});
   const bullets=Array.isArray(item.bullets)?item.bullets.slice(0,3):[];
   // Use literal bullet characters rather than PowerPoint bullet metadata.
   // This avoids first-character clipping in some PPTX-to-PDF converters.
   const text=bullets.map((b:string)=>"•  "+clean(b)).join("\n");
   const visual=visualImages[i];
   const hasImage=Boolean(visual);
   if(text)s.addText(text,{x:.75,y:1.72,w:hasImage?4.05:5.3,h:4.65,fontFace:"Arial",fontSize:hasImage?15:16,color:"263849",breakLine:false,paraSpaceAfter:12,fit:"shrink",margin:.12,valign:"top",lineSpacingMultiple:1.05});
   if(visual){
    s.addImage({data:`data:${visual.type};base64,${visual.data}`,x:hasImage?5.0:6.35,y:1.55,w:hasImage?7.75:6.25,h:4.95});
    s.addText((visual.name+" · "+visual.credit).slice(0,180),{x:hasImage?5.0:6.35,y:6.55,w:hasImage?7.75:6.25,h:.28,fontFace:"Arial",fontSize:6,color:"60788D",fit:"shrink"});
    if(visual.animated)s.addText("ANIMATED · Plays in PowerPoint Slide Show",{x:hasImage?5.0:6.35,y:6.82,w:hasImage?7.75:6.25,h:.18,fontFace:"Arial",fontSize:7,bold:true,color:"2E6F9E",fit:"shrink"});
   }else{
    addAutoDiagram(s,item,navy);
   }
   if(item.visual)s.addText(clean(item.visual),{x:.9,y:6.55,w:hasImage?3.9:5.2,h:.3,fontFace:"Arial",fontSize:9,color:"2E6F9E",italic:true,fit:"shrink"});
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

  // Fast, editable final revision slide. No image-generation API call or extra API key required.
  const summarySlide=pptx.addSlide();
  summarySlide.background={color:"F7F1E5"};
  summarySlide.addText("FINAL REVISION · "+topic,{x:.65,y:.35,w:12,h:.65,fontFace:"Arial",fontSize:24,bold:true,color:navy,fit:"shrink"});
  const summaryItems=slides.slice(0,8).map(item=>({title:clean(item.title),points:(item.bullets||[]).slice(0,2).map(v=>clean(v))}));
  summaryItems.forEach((item,i)=>{
   const col=i%2,row=Math.floor(i/2),x=.65+col*6.15,y=1.25+row*1.35;
   summarySlide.addShape("roundRect",{x,y,w:5.85,h:1.12,rectRadius:.08,line:{color:"D9E3EA",width:1},fill:{color:"FFFFFF"}});
   summarySlide.addText(item.title,{x:x+.18,y:y+.12,w:5.5,h:.24,fontFace:"Arial",fontSize:11,bold:true,color:navy,fit:"shrink",margin:0});
   summarySlide.addText(item.points.map(p=>"• "+p).join("\n"),{x:x+.18,y:y+.43,w:5.5,h:.58,fontFace:"Arial",fontSize:8,color:"263849",fit:"shrink",valign:"top",margin:0});
  });
  summarySlide.addText("Quick revision · Check detailed explanations and clinical facts against your textbook",{x:1,y:7.02,w:11,h:.2,fontFace:"Arial",fontSize:8,color:"60788D",align:"center",margin:0});
  mark(summarySlide);

  const out=await pptx.write({outputType:"nodebuffer"});
  const b=Buffer.isBuffer(out)?out:Buffer.from(out as ArrayBuffer);
  const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;
  const imageCount=visualImages.filter(Boolean).length;
  return new NextResponse(ab,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":'attachment; filename="Faizan-AI-Presentation.pptx"',"Cache-Control":"no-store","X-Faizan-AI-Provider":result.provider,"X-Faizan-AI-Image-Count":String(imageCount),"X-Faizan-AI-Animated-Count":String(visualImages.filter(v=>v?.animated).length),"X-Faizan-AI-Slide-Count":String(slides.length)}});
 }catch(e){
  console.error("Presentation:",e);
  return NextResponse.json({error:e instanceof Error?e.message:"PowerPoint generation failed."},{status:502});
 }
}
