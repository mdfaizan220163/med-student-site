import {NextRequest,NextResponse} from "next/server";
import PptxGenJS from "pptxgenjs";
import {generateWithFallback} from "@/lib/ai-providers";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=240;

type Slide={title:string;bullets:string[];visual?:string};
type DeckImage={name:string;data:string;type:string;credit:string;animated:boolean};
const clean=(v:unknown,f="")=>typeof v==="string"?v.replace(/[\\u0000-\\u001F]/g," ").trim():f;
function addAutoDiagram(s:PptxGenJS.Slide,item:Slide,topic:string,navy:string){
 const title=clean(item.title);
 const bullets=(Array.isArray(item.bullets)?item.bullets:[]).slice(0,4).map(x=>clean(x).slice(0,100)).filter(Boolean);
 const cardiac=/cardiac cycle|heart cycle|ventricular systole|atrial systole/i.test(topic+" "+title);
 s.addText(cardiac?"CARDIAC CYCLE · MECHANICAL SEQUENCE":"CONCEPT MAP · KEY MECHANISM",{x:7.15,y:1.55,w:5.45,h:.3,fontFace:"Arial",fontSize:10,bold:true,color:"477EAA",charSpacing:1.1,fit:"shrink"});
 if(cardiac){
  const phases=["Atrial systole","Isovolumetric contraction","Ventricular ejection","Isovolumetric relaxation","Ventricular filling"];
  const desc=["AV valves open","All valves closed","Semilunar valves open","All valves closed","AV valves open"];
  phases.forEach((p,i)=>{
   const y=2.05+i*.83;
   s.addShape("roundRect",{x:7.2,y,w:4.9,h:.62,rectRadius:.08,line:{color:"C9D9E7",width:1},fill:{color:i%2?"F5F8FB":"EAF2F8"}});
   s.addText(p,{x:7.4,y:y+.08,w:2.75,h:.2,fontFace:"Arial",fontSize:11,bold:true,color:navy,fit:"shrink",margin:0});
   s.addText(desc[i],{x:10.05,y:y+.1,w:1.85,h:.18,fontFace:"Arial",fontSize:9,color:"42627D",fit:"shrink",align:"right",margin:0});
   if(i<phases.length-1)s.addShape("line",{x:9.65,y:y+.62,w:0,h:.2,line:{color:"477EAA",width:1.5,beginArrowType:"none",endArrowType:"triangle"}});
  });
  s.addText("Pressure rises → ejection → pressure falls → filling",{x:7.25,y:6.35,w:5.25,h:.3,fontFace:"Arial",fontSize:9,bold:true,color:"2E6F9E",fit:"shrink",align:"center"});
 }else{
  const nodes=bullets.slice(0,4);
  const count=Math.max(nodes.length,1), gap=.12, h=Math.min(.82,(4.1-gap*(count-1))/count);
  nodes.forEach((p,i)=>{
   const y=2.05+i*(h+gap);
   s.addShape("roundRect",{x:7.2,y,w:4.95,h,line:{color:"C9D9E7",width:1},fill:{color:i%2?"F5F8FB":"EAF2F8"}});
   s.addShape("ellipse",{x:7.4,y:y+h/2-.14,w:.28,h:.28,line:{color:"477EAA"},fill:{color:"477EAA"}});
   s.addText(String(i+1),{x:7.4,y:y+h/2-.1,w:.28,h:.16,fontFace:"Arial",fontSize:8,bold:true,color:"FFFFFF",align:"center",margin:0});
   s.addText(p,{x:7.85,y:y+.08,w:4.05,h:h-.16,fontFace:"Arial",fontSize:10,color:"263849",fit:"shrink",valign:"middle",margin:.03});
   if(i<nodes.length-1)s.addShape("line",{x:9.65,y:y+h,w:0,h:gap,line:{color:"477EAA",width:1.5,endArrowType:"triangle"}});
  });
 }
}

type ResearchRef={title:string;year:string;journal:string;pmid:string;doi:string};
async function recentPubMed(topic:string):Promise<ResearchRef[]>{
 try{
  const term=encodeURIComponent(topic + " AND 2021:2026[dp]");
  const sr=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=6&term="+term,{signal:AbortSignal.timeout(10000)});
  if(!sr.ok)return [];
  const ids:string[]=(await sr.json())?.esearchresult?.idlist||[];
  if(!ids.length)return [];
  const er=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id="+ids.join(","),{signal:AbortSignal.timeout(10000)});
  if(!er.ok)return [];
  const data=await er.json();
  return ids.map(id=>data?.result?.[id]).filter(Boolean).map((p:any)=>({title:String(p.title||"").replace(/<[^>]*>/g,"").slice(0,180),year:String(p.pubdate||"").match(/20\d{2}/)?.[0]||"",journal:String(p.fulljournalname||p.source||"").slice(0,80),pmid:String(p.uid||""),doi:String((p.articleids||[]).find((a:any)=>a.idtype==="doi")?.value||"")})).filter((p:ResearchRef)=>p.title&&p.pmid).slice(0,5);
 }catch(e){console.warn("[Faizan AI] PubMed lookup unavailable",e);return []}
}

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

  const research=await recentPubMed(topic);\n  const researchContext=research.length?JSON.stringify(research):"No recent PubMed records were retrieved; do not invent recent research.";\n  const prompt=`Create a medically accurate MBBS presentation in ${language} about ${topic}. Use the relevant standard textbook for established foundational knowledge. Recent PubMed records retrieved for this topic: ${researchContext}. Where relevant, explain recent findings accurately and distinguish them from established textbook knowledge. Mark every research-derived statement with the exact bold prefix **RECENT RESEARCH**. Do not infer findings from a title alone; only describe what the cited record supports. Return only JSON: {"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"visual":"..."}]}. Create exactly ${count} slides, 3-5 concise bullets each. Include objectives, core concepts, clinical relevance, summary and review questions. Never invent citations or guidelines.`;
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

  // Mandatory AI quality checkpoint: never finalize an unreviewed deck.
  const reviewPrompt=`Act as the final medical quality-control reviewer for an MBBS teaching presentation about "${topic}" in ${language}. Review EVERY slide. Check: (1) factual medical accuracy and terminology, (2) direct relevance to the requested topic, (3) correct mechanisms, sequences and relationships, (4) missing essential high-yield concepts, (5) duplication and logical order, (6) useful and medically relevant visual/diagram instructions. Correct errors; remove irrelevant content; improve weak slides. Preserve exactly ${count} slides. Return ONLY valid JSON: {"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"visual":"..."}]}. Each slide must have 3-5 concise bullets. Do not invent citations, references, guidelines or facts. If a fact is uncertain, phrase it cautiously. DRAFT TO REVIEW:\n${JSON.stringify(outline)}`;
  const reviewSystem="You are the mandatory final quality-control reviewer for medical education slides. Be strict, verify each statement for standard MBBS-level medical accuracy, correct mistakes, remove irrelevant content and ensure every visual instruction matches the topic. Return one complete JSON object only, with exactly the requested slide count and required fields. No markdown.";
  let qualityCheckpointPassed=false;
  try {
    const reviewed=await generateWithFallback([{role:"user",content:reviewPrompt}],reviewSystem,provider,7000);
    const improved=parseOutline(reviewed.answer);
    if(!Array.isArray(improved.slides)||improved.slides.length!==count) {
      throw new Error(`Review returned ${improved.slides?.length??0} slides; expected exactly ${count}.`);
    }
    const checkedSlides=improved.slides.map((s,index)=>{
      const title=clean(s?.title);
      const bullets=Array.isArray(s?.bullets)?s.bullets.map(x=>clean(x)).filter(Boolean).slice(0,5):[];
      if(!title||bullets.length<3)throw new Error(`Slide ${index+1} is incomplete after review.`);
      return {title,bullets,visual:clean(s.visual,"Create a topic-specific labeled medical diagram.")};
    });
    outline={title:clean(improved.title,clean(outline.title,topic)),subtitle:clean(improved.subtitle,clean(outline.subtitle,"Medical learning presentation")),slides:checkedSlides};
    qualityCheckpointPassed=true;
    console.info("[Faizan AI] Mandatory medical quality checkpoint passed",reviewed.provider);
  } catch (reviewError) {
    console.error("[Faizan AI] Mandatory quality checkpoint failed",reviewError);
    throw new Error("The medical quality checkpoint could not be completed. Your PowerPoint was not finalized. Please try again or select another AI provider.");
  }
  if(!qualityCheckpointPassed)throw new Error("The medical quality checkpoint was not passed. Presentation finalization stopped.");


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

  const slides=(outline.slides??[]).slice(0,count);
  // Visual and animation assets are added in the next implementation pass; keep generated diagrams until those assets are validated.

  const cover=pptx.addSlide();
  cover.background={color:navy};
  cover.addText(clean(outline.title,topic),{x:.8,y:1.7,w:11.3,h:1.5,fontFace:"Arial",fontSize:30,bold:true,color:"FFFFFF",fit:"shrink",breakLine:false});
  cover.addText(clean(outline.subtitle,"Medical learning presentation"),{x:.85,y:3.5,w:10.8,h:.5,fontFace:"Arial",fontSize:17,color:"D5E4F0"});

  cover.addText("Prepared with Faizan AI",{x:.85,y:6.65,w:5,h:.3,fontFace:"Arial",fontSize:11,color:"B8CDDF"});
  mark(cover);
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
   if(text)s.addText(text,{x:.75,y:1.72,w:5.8,h:4.85,fontFace:"Arial",fontSize:15,color:"263849",breakLine:false,paraSpaceAfter:12,fit:"shrink",margin:.12,valign:"top",lineSpacingMultiple:1.05});
   addAutoDiagram(s,item,topic,navy);
   if(item.visual)s.addText(clean(item.visual),{x:.9,y:6.55,w:5.8,h:.3,fontFace:"Arial",fontSize:9,color:"2E6F9E",italic:true,fit:"shrink"});
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

  // Recent research references are displayed separately from textbook foundations.\n  if(research.length){\n   const rs=pptx.addSlide();\n   rs.background={color:"FFFFFF"};\n   rs.addText("RECENT RESEARCH",{x:.7,y:.55,w:11.8,h:.55,fontFace:"Arial",fontSize:24,bold:true,color:"9B3D26",margin:0});\n   rs.addText("PubMed records retrieved for this topic · verify full methods and findings before clinical application",{x:.72,y:1.15,w:11.8,h:.3,fontFace:"Arial",fontSize:9,color:"60788D",margin:0});\n   research.forEach((p,i)=>{const y=1.7+i*1.0;rs.addText([{text:"RECENT RESEARCH · ",options:{bold:true,color:"9B3D26"}},{text:p.title,options:{bold:true,color:navy}}],{x:.8,y,w:11.7,h:.38,fontFace:"Arial",fontSize:11,fit:"shrink",margin:0});rs.addText([p.journal,p.year,p.doi?"DOI: "+p.doi:"PMID: "+p.pmid].filter(Boolean).join(" · "),{x:.82,y:y+.4,w:11.4,h:.22,fontFace:"Arial",fontSize:8,color:"60788D",margin:0});rs.addText("https://pubmed.ncbi.nlm.nih.gov/"+p.pmid+"/",{x:.82,y:y+.64,w:11.4,h:.2,fontFace:"Arial",fontSize:8,color:"2E6F9E",margin:0});});\n   mark(rs);\n  }\n\n  // Fast, editable final revision slide. No image-generation API call or extra API key required.
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
  return new NextResponse(ab,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":'attachment; filename="Faizan-AI-Presentation.pptx"',"Cache-Control":"no-store","X-Faizan-AI-Provider":result.provider,"X-Faizan-AI-Image-Count":"0","X-Faizan-AI-Animated-Count":"0","X-Faizan-AI-Slide-Count":String(slides.length)}});
 }catch(e){
  console.error("Presentation:",e);
  return NextResponse.json({error:e instanceof Error?e.message:"PowerPoint generation failed."},{status:502});
 }
}
