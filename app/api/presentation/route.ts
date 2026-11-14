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
   s.addText(p,{x:7.85,y:y+.08,w:4.05,h:h-.16,fontFace:"Arial",fontSize:10,color:"263849",fit:"shrink",valign:"mid",margin:.03});
   if(i<nodes.length-1)s.addShape("line",{x:9.65,y:y+h,w:0,h:gap,line:{color:"477EAA",width:1.5,endArrowType:"triangle"}});
  });
 }
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

  // AI quality checkpoint: review and improve the complete outline before PPTX assembly.
  const reviewPrompt=`Review this MBBS presentation about "${topic}" in ${language}. Check medical accuracy, relevance to the exact topic, logical slide order, duplication, missing high-yield concepts, and whether each visual instruction describes a useful topic-specific medical diagram. Correct errors and improve weak slides. Preserve the requested slide count (${count}) and return ONLY valid JSON in this exact shape: {"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"visual":"..."}]}. Keep 3-5 concise bullets per slide. Do not add unsupported facts or citations. ORIGINAL OUTLINE:\\n${JSON.stringify(outline)}`;
  const reviewSystem="You are a strict MBBS medical educator and presentation quality reviewer. Verify the outline for medical accuracy and relevance, correct issues, remove irrelevant visual ideas, and return only one complete valid JSON object with the required title, subtitle, and slides fields. No markdown.";
  try {
    const reviewed=await generateWithFallback([{role:"user",content:reviewPrompt}],reviewSystem,provider,6500);
    const improved=parseOutline(reviewed.answer);
    if(Array.isArray(improved.slides)&&improved.slides.length>=Math.min(5,count)){
      outline={title:clean(improved.title,clean(outline.title,topic)),subtitle:clean(improved.subtitle,clean(outline.subtitle,"Medical learning presentation")),slides:improved.slides.slice(0,count).map((s)=>({title:clean(s.title,"Key concept"),bullets:Array.isArray(s.bullets)?s.bullets.map(x=>clean(x)).filter(Boolean).slice(0,5):[],visual:clean(s.visual,"")}))};
      console.info("[Faizan AI] AI quality checkpoint passed",reviewed.provider);
    } else {
      console.warn("[Faizan AI] Quality checkpoint returned an incomplete outline; using validated draft.");
    }
  } catch (reviewError) {
    console.warn("[Faizan AI] Quality checkpoint unavailable; using validated draft.",reviewError);
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

  const slides=outline.slides.slice(0,count);
  // Do not insert unverified stock photos. Build editable, topic-specific diagrams instead.

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
  return new NextResponse(ab,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":'attachment; filename="Faizan-AI-Presentation.pptx"',"Cache-Control":"no-store","X-Faizan-AI-Provider":result.provider,"X-Faizan-AI-Image-Count":"0","X-Faizan-AI-Animated-Count":"0","X-Faizan-AI-Slide-Count":String(slides.length)}});
 }catch(e){
  console.error("Presentation:",e);
  return NextResponse.json({error:e instanceof Error?e.message:"PowerPoint generation failed."},{status:502});
 }
}
