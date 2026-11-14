import {NextRequest,NextResponse} from "next/server";
import PptxGenJS from "pptxgenjs";
import {generateWithFallback} from "@/lib/ai-providers";
import {createClient} from "@/lib/supabase/server";

export const runtime="nodejs";
export const maxDuration=240;

type Slide={title:string;bullets:string[];visual?:string};
type PubMedSummary={title?:string;pubdate?:string;fulljournalname?:string;source?:string;uid?:string;articleids?:{idtype?:string;value?:string}[]};
type CommonsMetadata={value?:string};
type CommonsImageInfo={mime?:string;url?:string;thumburl?:string;extmetadata?:Record<string,CommonsMetadata>};
type CommonsPage={title?:string;imageinfo?:CommonsImageInfo[]};
const clean=(v:unknown,f="")=>typeof v==="string"?v.replace(/[\u0000-\u001F]/g," ").trim():f;
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

type ResearchRef={title:string;year:string;journal:string;pmid:string;doi:string;abstract:string};
async function recentPubMed(topic:string):Promise<ResearchRef[]>{
 try{
  const year=new Date().getFullYear();
  const term=encodeURIComponent(topic + " AND "+(year-4)+":"+year+"[dp]");
  const sr=await fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=pub_date&retmax=6&term="+term,{signal:AbortSignal.timeout(10000)});
  if(!sr.ok)return [];
  const ids:string[]=(await sr.json())?.esearchresult?.idlist||[];
  if(!ids.length)return [];
  const [summaryRes,abstractRes]=await Promise.all([
   fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id="+ids.join(","),{signal:AbortSignal.timeout(12000)}),
   fetch("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id="+ids.join(","),{signal:AbortSignal.timeout(12000)})
  ]);
  if(!summaryRes.ok)return [];
  const data=await summaryRes.json();
  const xml=abstractRes.ok?await abstractRes.text():"";
  const abstractById=new Map<string,string>();
  for(const block of xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g)||[]){
   const id=block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1]||"";
   const parts=[...block.matchAll(/<AbstractText(?:[^>]*)>([\s\S]*?)<\/AbstractText>/g)].map(m=>m[1].replace(/<[^>]+>/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/\s+/g," ").trim());
   if(id&&parts.length)abstractById.set(id,parts.join(" "));
  }
  return ids.map(id=>data?.result?.[id]).filter(Boolean).map((p:PubMedSummary)=>({title:String(p.title||"").replace(/<[^>]*>/g,"").slice(0,180),year:String(p.pubdate||"").match(/20\d{2}/)?.[0]||"",journal:String(p.fulljournalname||p.source||"").slice(0,80),pmid:String(p.uid||""),doi:String((p.articleids||[]).find((a)=>a.idtype==="doi")?.value||""),abstract:abstractById.get(String(p.uid||""))||""})).filter((p:ResearchRef)=>p.title&&p.pmid&&p.abstract).slice(0,5);
 }catch(e){console.warn("[Faizan AI] PubMed lookup unavailable",e);return []}
}


type MedicalVisual={data:string;mime:string;title:string;page:string;license:string;artist:string;animated:boolean};
async function fetchCommonsVisual(query:string,preferGif=false):Promise<MedicalVisual|null>{
 // Try the exact slide topic first, then broader medically relevant Commons searches.
 const normalized=query.replace(/\\s+/g," ").trim();
 const searches=preferGif
  ? ["filetype:gif "+normalized, "filetype:gif medical animation physiology"]
  : [normalized, normalized+" anatomy illustration", normalized+" medical diagram", normalized+" histology OR physiology OR anatomy"];
 for(const search of searches){
  try{
   const params=new URLSearchParams({action:"query",generator:"search",gsrnamespace:"6",gsrsearch:search,gsrlimit:"20",prop:"imageinfo",iiprop:"url|extmetadata|size|mime",iiurlwidth:"1600",format:"json",origin:"*"});
   const res=await fetch("https://commons.wikimedia.org/w/api.php?"+params.toString(),{headers:{"User-Agent":"FaizanAIMedicalPresentation/1.1 (educational use)"},signal:AbortSignal.timeout(15000)});
   if(!res.ok)continue;
   const json=await res.json();
   const pages=Object.values(json?.query?.pages||{}) as CommonsPage[];
   for(const p of pages){
    const info=p?.imageinfo?.[0];if(!info)continue;
    const mime=String(info.mime||"").toLowerCase();
    if(preferGif?mime!=="image/gif":!["image/jpeg","image/png","image/webp"].includes(mime))continue;
    const url=preferGif?(info.url||""):(info.thumburl||info.url||"");
    if(!url||!/^https:\/\//i.test(url))continue;
    const image=await fetch(url,{signal:AbortSignal.timeout(15000)});
    if(!image.ok)continue;
    const bytes=Buffer.from(await image.arrayBuffer());
    if(bytes.length>(preferGif?4:2.5)*1024*1024||bytes.length<1000)continue;
    // Reject HTML/error payloads masquerading as successful downloads.
    const isJpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;
    const isPng=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const isWebp=bytes.toString("ascii",0,4)==="RIFF"&&bytes.toString("ascii",8,12)==="WEBP";
    const isGif=bytes.toString("ascii",0,3)==="GIF";
    if(!(preferGif?isGif:(isJpeg||isPng||isWebp)))continue;
    const actualMime=isJpeg?"image/jpeg":isPng?"image/png":isWebp?"image/webp":"image/gif";
    const meta=info.extmetadata||{};
    const strip=(v?:CommonsMetadata)=>String(v?.value||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").trim().slice(0,240);
    return {data:bytes.toString("base64"),mime:actualMime,title:String(p.title||"Wikimedia Commons file"),page:"https://commons.wikimedia.org/wiki/"+encodeURIComponent(String(p.title||"").replace(/ /g,"_")),license:strip(meta.LicenseShortName)||"See source page for license",artist:strip(meta.Artist)||"Author listed on source page",animated:actualMime==="image/gif"};
   }
  }catch(e){console.warn("[Faizan AI] Commons visual search attempt failed",search,e)}
 }
 return null;
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

  const sources=clean(form.get("sources"),"upload,web,ai").split(",").filter(Boolean);
  const research=await recentPubMed(topic);
  const researchContext=research.length?JSON.stringify(research.map(({title,year,journal,pmid,doi,abstract})=>({title,year,journal,pmid,doi,abstract}))):"No recent PubMed abstracts were retrieved; do not invent recent research.";
  const textbookMap=/physiology|cardiac|heart|respirat|renal|neurophys/i.test(topic)?"Guyton and Hall Textbook of Medical Physiology":/patholog|inflammation|necrosis|neoplasm|hypersensitiv/i.test(topic)?"Robbins & Cotran Pathologic Basis of Disease":/anatom/i.test(topic)?"Gray's Anatomy":/pharm|drug|receptor|antibiotic/i.test(topic)?"Katzung & Trevor's Basic & Clinical Pharmacology":/microb|bacter|virus|fung|parasite/i.test(topic)?"Jawetz, Melnick & Adelberg's Medical Microbiology":"the most relevant standard MBBS textbook";
  const prompt=`Create a medically accurate MBBS presentation in ${language} about ${topic}. Use ${textbookMap} as the primary textbook framework for established knowledge; do not invent page numbers or pretend to quote inaccessible textbook text. Recent PubMed records retrieved for this topic: ${researchContext}. Use only abstract-supported findings for recent research. Cite PMID/DOI next to each research-derived claim and mark it **RECENT RESEARCH** in bold. Distinguish established textbook knowledge from research findings. If abstracts are unavailable, do not make specific claims about those studies. Return only JSON: {"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"visual":"..."}]}. Create exactly ${count} slides, 3-5 concise bullets each. Include objectives, core concepts, clinical relevance, summary and review questions. For every mechanism or physiological/pathological process, give the correct chronological sequence with numbered steps or arrows; do not reorder stages or confuse cause, mediator, and effect. Check each sequence against established textbook physiology/pathology/pharmacology. Keep valves, pressure changes, timing, cell types, mediators and receptor names internally consistent. Never invent citations or guidelines.`;
  const system = "Create medically accurate MBBS slides. Return exactly one valid JSON object. Use double quotes for every key and string. No markdown fences, comments, or trailing commas. Required shape: {\"title\":\"...\",\"subtitle\":\"...\",\"slides\":[{\"title\":\"...\",\"bullets\":[\"...\"],\"visual\":\"...\"}]}";
  let result = await generateWithFallback([{role:"user",content:prompt}], system, provider, 5000);
  const parseOutline = (answer: string): {title?:string;subtitle?:string;slides?:Slide[]} => {
    const cleaned = answer.replace(/^\uFEFF/,"").replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"").trim();
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
  let reviewProvider=provider;
  let lastReviewError:unknown=null;
  // Retry once with explicit JSON-repair instructions; never finalize an unreviewed deck.
  for(let attempt=0;attempt<2&&!qualityCheckpointPassed;attempt++){
   try{
    const retryInstruction=attempt===0?"":"\\nYour previous review response was invalid or incomplete. Return ONLY one complete valid JSON object, no markdown. Include exactly "+count+" slides, each with a title and at least 3 concise bullet strings.";
    const reviewed=await generateWithFallback([{role:"user",content:reviewPrompt+retryInstruction}],reviewSystem,reviewProvider,7000);
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
    reviewProvider=reviewed.provider;
    qualityCheckpointPassed=true;
    console.info("[Faizan AI] Mandatory medical quality checkpoint passed",reviewed.provider,"attempt",attempt+1);
   }catch(reviewError){
    lastReviewError=reviewError;
    console.error("[Faizan AI] Quality checkpoint attempt",attempt+1,"failed",reviewError);
   }
  }
  if(!qualityCheckpointPassed){
   const detail=lastReviewError instanceof Error?lastReviewError.message:"Unknown review error";
   throw new Error("The medical quality checkpoint failed after 2 attempts: "+detail+". No PowerPoint was finalized. Try again or choose another AI provider.");
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
  // Retrieve topic-matched, openly licensed Commons visuals. Uploaded images are prioritized and distributed across slides.
  const visualAssets:(MedicalVisual|null)[]=await Promise.all(slides.map(async(item,index)=>{
   if(sources.includes("upload")&&images[index%Math.max(images.length,1)]){
    const im=images[index%images.length];
    return {data:im.data,mime:im.type,title:im.name,page:"User-provided image",license:"User supplied",artist:"User supplied",animated:false};
   }
   return await fetchCommonsVisual(topic+" "+item.title,false);
  }));
  const missingVisuals=visualAssets.map((v,i)=>v?null:(i+1)+": "+slides[i].title).filter(Boolean);
  if(missingVisuals.length)return NextResponse.json({error:"Could not find a usable medical image for every slide. No incomplete deck was created. Missing: "+missingVisuals.join("; ")+" Enable image search or upload relevant images and try again."},{status:422});
  // Use silent animated GIFs only. GIF has no audio track, so the deck contains no voice or sound.
  let animatedAsset:MedicalVisual|null=null;
  if(sources.includes("web"))animatedAsset=await fetchCommonsVisual(topic+" "+clean(slides[0]?.title),true);



  const cover=pptx.addSlide();
  cover.background={color:navy};
  cover.addText(clean(outline.title,topic),{x:.95,y:1.7,w:11.0,h:1.5,fontFace:"Arial",fontSize:28,bold:true,color:"FFFFFF",margin:[0.12,0.2,0.12,0.2],fit:"shrink"});
  cover.addText(clean(outline.subtitle,"Medical learning presentation"),{x:1.0,y:3.5,w:10.5,h:.6,fontFace:"Arial",fontSize:16,color:"D5E4F0",margin:.15,fit:"shrink"});

  cover.addText("Prepared with Faizan AI",{x:.85,y:6.65,w:5,h:.3,fontFace:"Arial",fontSize:11,color:"B8CDDF"});
  mark(cover);
  for(let i=0;i<slides.length;i++){
   const item=slides[i];
   const s=pptx.addSlide();
   s.background={color:"FFFFFF"};
   s.addShape("rect",{x:0,y:0,w:13.333,h:.16,line:{color:navy},fill:{color:navy}});
   s.addText(clean(item.title,"Section "+(i+1)),{x:.95,y:.55,w:11.4,h:.82,fontFace:"Arial",fontSize:23,bold:true,color:navy,margin:[0.12,0.2,0.12,0.2],fit:"shrink"});
   const bullets=Array.isArray(item.bullets)?item.bullets.slice(0,5):[];
   // Separate bullet text boxes avoid rich-text run boundary clipping in PowerPoint.
   const bulletTop=1.72, bulletGap=0.16, bulletHeight=(4.85-bulletGap*(bullets.length-1))/Math.max(bullets.length,1);
   bullets.forEach((bullet,index)=>{
    const y=bulletTop+index*(bulletHeight+bulletGap);
    // Keep each bullet in one plain-text box to avoid lost characters at rich-text run boundaries.
    s.addText("•  "+clean(bullet),{x:.98,y,w:5.85,h:bulletHeight,fontFace:"Arial",fontSize:14,color:"263849",fit:"shrink",margin:[0.08,0.08,0.08,0.08],valign:"middle"});
   });
   const visual=visualAssets[i];
   if(visual){
    s.addImage({data:`data:${visual.mime};base64,${visual.data}`,x:7.05,y:1.8,w:5.55,h:4.55});
    s.addText("VISUAL · "+visual.title.slice(0,90),{x:7.1,y:6.42,w:5.4,h:.24,fontFace:"Arial",fontSize:7,color:"60788D",fit:"shrink",margin:0});
   }else addAutoDiagram(s,item,topic,navy);
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

  // Textbook reference is explicitly identified; no page numbers are fabricated.
  const textbookSlide=pptx.addSlide();textbookSlide.background={color:"FFFFFF"};
  textbookSlide.addText("TEXTBOOK FOUNDATION",{x:.7,y:.55,w:11.8,h:.55,fontFace:"Arial",fontSize:24,bold:true,color:navy,margin:0});
  textbookSlide.addText(textbookMap,{x:.85,y:1.55,w:11.5,h:.55,fontFace:"Arial",fontSize:18,bold:true,color:navy,fit:"shrink"});
  textbookSlide.addText("Used as the standard subject reference framework. Consult your institution's assigned edition for exact chapter and page references; no page numbers are inferred.",{x:.85,y:2.25,w:11.5,h:.7,fontFace:"Arial",fontSize:12,color:"263849",fit:"shrink"});
  mark(textbookSlide);

  // Always show the research section, including an explicit no-results state.
  {
   const rs=pptx.addSlide();rs.background={color:"FFFFFF"};
   rs.addText("RECENT RESEARCH",{x:.7,y:.55,w:11.8,h:.55,fontFace:"Arial",fontSize:24,bold:true,color:"9B3D26",margin:0});
   rs.addText("Recent PubMed literature · separate from established textbook knowledge",{x:.72,y:1.15,w:11.8,h:.3,fontFace:"Arial",fontSize:9,color:"60788D",margin:0});
   if(research.length){
    research.slice(0,3).forEach((p,i)=>{
     const y=1.62+i*1.72;
     rs.addText(p.title,{x:.82,y,w:11.45,h:.38,fontFace:"Arial",fontSize:11,bold:true,color:navy,fit:"shrink",margin:[0.04,0.06,0.04,0.06]});
     const abstractSummary=p.abstract.length>420?p.abstract.slice(0,417)+"…":p.abstract;
     rs.addText(abstractSummary,{x:.84,y:y+.42,w:11.35,h:.72,fontFace:"Arial",fontSize:9,color:"263849",fit:"shrink",valign:"top",margin:[0.05,0.06,0.05,0.06]});
     rs.addText([p.journal,p.year,p.doi?"DOI: "+p.doi:"PMID: "+p.pmid].filter(Boolean).join(" · ")+" · https://pubmed.ncbi.nlm.nih.gov/"+p.pmid+"/",{x:.84,y:y+1.18,w:11.35,h:.22,fontFace:"Arial",fontSize:8,color:"2E6F9E",fit:"shrink",margin:0});
    });
   }else{
    rs.addText("No recent PubMed abstracts were retrieved for this topic during generation. No study-specific research claims are included. Retry later or search PubMed directly.",{x:.9,y:2.0,w:11.2,h:1.15,fontFace:"Arial",fontSize:16,color:"263849",fit:"shrink",valign:"top",margin:.12});
   }
   mark(rs);
  }
  const visualCredits=visualAssets.filter((v):v is MedicalVisual=>!!v);
  if(visualCredits.length||animatedAsset){
   const creditSlide=pptx.addSlide();creditSlide.background={color:"FFFFFF"};
   creditSlide.addText("IMAGE & MEDIA CREDITS",{x:.7,y:.45,w:11.8,h:.5,fontFace:"Arial",fontSize:22,bold:true,color:navy});
   const credits=[...visualCredits,...(animatedAsset?[animatedAsset]:[])];
   credits.slice(0,18).forEach((v,i)=>{const y=1.15+i*.31;creditSlide.addText([{text:(i+1)+". "+v.title+" · ",options:{bold:true}},{text:v.license+" · "+v.artist+" · "+(v.animated?"ANIMATED GIF":"image"),options:{}}],{x:.8,y,w:11.6,h:.2,fontFace:"Arial",fontSize:7,color:"263849",fit:"shrink",margin:0});creditSlide.addText(v.page,{x:.8,y:y+.14,w:11.6,h:.13,fontFace:"Arial",fontSize:6,color:"2E6F9E",fit:"shrink",margin:0});});
   mark(creditSlide);
  }
  if(animatedAsset){
   const mediaSlide=pptx.addSlide();mediaSlide.background={color:"FFFFFF"};
   mediaSlide.addText("ANIMATED MEDICAL MEDIA",{x:.7,y:.55,w:11.8,h:.55,fontFace:"Arial",fontSize:23,bold:true,color:navy});
   mediaSlide.addImage({data:`data:image/gif;base64,${animatedAsset.data}`,x:2.1,y:1.55,w:9.1,h:4.9});
   mediaSlide.addText("Embedded animated GIF · playback depends on PowerPoint version and viewer",{x:1.1,y:6.65,w:11,h:.25,fontFace:"Arial",fontSize:9,color:"60788D",align:"center"});
   mark(mediaSlide);
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
  return new NextResponse(ab,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":'attachment; filename="Faizan-AI-Presentation.pptx"',"Cache-Control":"no-store","X-Faizan-AI-Provider":result.provider,"X-Faizan-AI-Image-Count":String(visualAssets.filter(Boolean).length),"X-Faizan-AI-Animated-Count":String(animatedAsset?1:0),"X-Faizan-AI-Slide-Count":String(slides.length)}});
 }catch(e){
  console.error("Presentation:",e);
  return NextResponse.json({error:e instanceof Error?e.message:"PowerPoint generation failed."},{status:502});
 }
}
