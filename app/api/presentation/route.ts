import {NextRequest,NextResponse} from "next/server";
import PptxGenJS from "pptxgenjs";
import {generateWithFallback} from "@/lib/ai-providers";

export const runtime="nodejs";
export const maxDuration=240;

type Slide={title:string;bullets:string[];visual?:string};
type DeckImage={name:string;data:string;type:string;credit:string;animated:boolean};
const clean=(v:unknown,f="")=>typeof v==="string"?v.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,"").trim():f;
function addAutoDiagram(s:PptxGenJS.Slide,item:Slide,topic:string,navy:string){
 const title=clean(item.title);
 const bullets=(Array.isArray(item.bullets)?item.bullets:[]).slice(0,4).map(x=>clean(x).slice(0,100)).filter(Boolean);
 const combined=(topic+" "+title+" "+bullets.join(" ")).toLowerCase();
 const hypersensitivity=/hypersensitivity/.test(combined);
 const inflammation=/acute inflammation|inflamm/.test(combined);
 const cardiac=/cardiac cycle|heart cycle|ventricular systole|atrial systole/i.test(combined);
 if(hypersensitivity){
  const typeI=/type i|bronchial asthma|anaphylaxis|urticaria/i.test(combined);
  const typeII=/type ii|goodpasture|pemphigus|pemphigoid/i.test(combined);
  const typeIII=/type iii|vasculitis|lupus nephritis/i.test(combined);
  const tb=/tuberculosis/i.test(combined);
  const leftTitle=tb?"GROSS · CASEATING LUNG LESION":typeI?"GROSS · ORGAN / SKIN LESION":typeII?"GROSS · TARGET-ORGAN LESION":"GROSS · VASCULAR / RENAL LESION";
  const rightTitle=tb?"MICROSCOPY · GRANULOMA":typeI?"MICROSCOPY · EDEMA / EOSINOPHILS":typeII?"MICROSCOPY · NECROSIS / BLISTER":"MICROSCOPY · TISSUE INJURY";
  s.addText(leftTitle,{x:7.18,y:1.55,w:2.55,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:"477EAA",fit:"shrink"});
  s.addText(rightTitle,{x:10.02,y:1.55,w:2.55,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:"477EAA",fit:"shrink"});
  s.addShape("roundRect",{x:7.15,y:1.98,w:2.65,h:3.75,line:{color:"C9D9E7",width:1},fill:{color:"F8FAFC"}});
  s.addShape("roundRect",{x:9.98,y:1.98,w:2.65,h:3.75,line:{color:"C9D9E7",width:1},fill:{color:"F8FAFC"}});
  if(typeI){
   // Paired lung lobes with central bronchus; red plugs mark obstructed airways.
   s.addShape("ellipse",{x:7.45,y:2.55,w:.85,h:1.75,line:{color:"8EAFC2",width:1.5},fill:{color:"E6F0F4"}});
   s.addShape("ellipse",{x:8.45,y:2.55,w:.85,h:1.75,line:{color:"8EAFC2",width:1.5},fill:{color:"E6F0F4"}});
   s.addShape("rect",{x:8.25,y:2.18,w:.25,h:.8,line:{color:"8EAFC2"},fill:{color:"E6F0F4"}});
   [0,1,2].forEach(i=>s.addShape("ellipse",{x:7.72+i*.48,y:3.2+(i%2)*.25,w:.16,h:.16,line:{color:"B65A48"},fill:{color:"B65A48"}}));
   s.addText("Mucus plugs · overinflation",{x:7.32,y:4.65,w:2.3,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
   for(let i=0;i<14;i++)s.addShape("ellipse",{x:10.25+(i%4)*.43,y:2.55+Math.floor(i/4)*.48,w:.12,h:.12,line:{color:"C58A43"},fill:{color:"E7BD7C"}});
   s.addText("Eosinophils · edema",{x:10.2,y:4.65,w:2.2,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
  }else if(typeII){
   s.addShape("ellipse",{x:7.45,y:2.55,w:1.05,h:1.55,line:{color:"9A6A66",width:1.5},fill:{color:"E6B7B2"}});
   s.addShape("ellipse",{x:8.05,y:2.9,w:.42,h:.62,line:{color:"9A6A66"},fill:{color:"A94B4B"}});
   s.addText("Hemorrhage / blister",{x:7.3,y:4.65,w:2.3,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
   s.addShape("rect",{x:10.28,y:2.7,w:1.95,h:.35,line:{color:"C58A43"},fill:{color:"F3D8A8"}});
   s.addShape("rect",{x:10.28,y:3.08,w:1.95,h:.35,line:{color:"9B6A6A"},fill:{color:"E7B9B9"}});
   s.addShape("line",{x:10.28,y:3.04,w:1.95,h:0,line:{color:"A94B4B",width:2}});
   s.addText("Crescent / split plane",{x:10.18,y:4.65,w:2.3,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
  }else if(typeIII){
   s.addShape("ellipse",{x:7.72,y:2.55,w:1.45,h:1.45,line:{color:"A94B4B",width:9},fill:{color:"F8E7E4"}});
   s.addShape("ellipse",{x:8.18,y:3.01,w:.53,h:.53,line:{color:"A94B4B",width:1.5},fill:{color:"FFFFFF"}});
   s.addText("Damaged vessel wall",{x:7.3,y:4.65,w:2.3,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
   for(let i=0;i<10;i++)s.addShape("ellipse",{x:10.35+(i%4)*.38,y:2.55+Math.floor(i/4)*.4,w:.2,h:.2,line:{color:"9A6A66"},fill:{color:"D8A5A0"}});
   s.addText("Inflammatory cells",{x:10.18,y:4.65,w:2.3,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
  }else{
   s.addShape("ellipse",{x:7.5,y:2.55,w:1.5,h:1.5,line:{color:"8A7766",width:1.5},fill:{color:"D9C5A1"}});
   s.addShape("ellipse",{x:7.86,y:2.91,w:.78,h:.78,line:{color:"A58B6C",width:1},fill:{color:"BDA47D"}});
   s.addText("Caseous center",{x:7.3,y:4.65,w:2.3,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:navy,align:"center",fit:"shrink"});
   for(let i=0;i<12;i++)s.addShape("ellipse",{x:10.3+(i%4)*.42,y:2.55+Math.floor(i/4)*.42,w:.18,h:.18,line:{color:"7D9A82"},fill:{color:"B9CDBB"}});
   s.addText("Epithelioid cells · giant cells",{x:10.12,y:4.65,w:2.35,h:.35,fontFace:"Arial",fontSize:8,bold:true,color:navy,align:"center",fit:"shrink"});
  }
  s.addText("SCHEMATIC MORPHOLOGY — NOT A PATIENT SPECIMEN PHOTOGRAPH",{x:7.3,y:5.95,w:5.25,h:.35,fontFace:"Arial",fontSize:8,color:"60788D",italic:true,align:"center",fit:"shrink"});
  return;
 }
 s.addText(inflammation?"ACUTE INFLAMMATION · PATHOLOGICAL MECHANISM":cardiac?"CARDIAC CYCLE · MECHANICAL SEQUENCE":"CONCEPT MAP · KEY MECHANISM",{x:7.15,y:1.55,w:5.45,h:.3,fontFace:"Arial",fontSize:10,bold:true,color:"477EAA",charSpacing:1.1,fit:"shrink"});
 if(inflammation){
  const vascular=/vascular|permeability|vasodilat|vessel/.test(combined);
  const cellular=/cellular|leukocyte|neutrophil|chemotaxis|migration|extravasation/.test(combined);
  const mediators=/mediator|histamine|prostaglandin|complement|cytokine/.test(combined);
  const repair=/resolution|repair|healing|regeneration/.test(combined);
  const labels=vascular?["Arteriolar vasodilation","Increased blood flow","Endothelial gaps open","Protein-rich exudate enters tissue"]:cellular?["Margination at vessel wall","Selectin-mediated rolling","Integrin-mediated adhesion","Diapedesis → chemotaxis"]:mediators?["Histamine · vasodilation","Prostaglandins · pain/fever","C3a/C5a · permeability","TNF / IL-1 · activation"]:repair?["Neutrophil apoptosis","Macrophage efferocytosis","Pro-resolving mediators","Regeneration or fibrosis"]:["Tissue injury / microbes","Vasodilation + permeability","Neutrophil recruitment","Elimination + repair"];
  labels.forEach((label,i)=>{
   const y=2.05+i*.94;
   s.addShape("roundRect",{x:7.25,y,w:4.75,h:.65,line:{color:"C9D9E7",width:1},fill:{color:i%2?"F5F8FB":"EAF2F8"}});
   s.addShape("ellipse",{x:7.48,y:y+.18,w:.28,h:.28,line:{color:"477EAA"},fill:{color:"477EAA"}});
   s.addText(String(i+1),{x:7.48,y:y+.23,w:.28,h:.14,fontFace:"Arial",fontSize:8,bold:true,color:"FFFFFF",align:"center",margin:0});
   s.addText(label,{x:7.95,y:y+.17,w:3.8,h:.28,fontFace:"Arial",fontSize:11,bold:true,color:navy,fit:"shrink",valign:"middle",margin:0});
   if(i<3)s.addShape("line",{x:9.6,y:y+.65,w:0,h:.27,line:{color:"477EAA",width:1.5,endArrowType:"triangle"}});
  });
  s.addText("VASCULAR RESPONSE  →  CELLULAR RESPONSE  →  OUTCOME",{x:7.25,y:6.0,w:4.75,h:.35,fontFace:"Arial",fontSize:9,bold:true,color:"2E6F9E",fit:"shrink",align:"center"});
 }else if(cardiac){
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


type MedicalVisual={data:string;mime:string;title:string;page:string;license:string;artist:string;animated:boolean};
function getSlideVisualQuery(topic:string,title:string,visual=""):string{
 const combined=(topic+" "+title+" "+visual).toLowerCase();
 if(/hypersensitivity/.test(combined)){
  if(/bronchial asthma|type i: immediate hypersensitivity — bronchial/i.test(combined))return "bronchial asthma gross pathology lung mucus plugs Curschmann spirals eosinophils histology";
  if(/anaphylaxis|urticaria/i.test(combined))return "urticaria skin histopathology dermal edema wheal laryngeal edema";
  if(/goodpasture/i.test(combined))return "Goodpasture syndrome pulmonary hemorrhage lung gross crescentic glomerulonephritis histology";
  if(/pemphigus|pemphigoid|blister/i.test(combined))return "pemphigus vulgaris bullous pemphigoid histopathology suprabasal acantholysis subepidermal blister";
  if(/vasculitis/i.test(combined))return "fibrinoid necrosis vasculitis histopathology gross artery aneurysm";
  if(/lupus nephritis/i.test(combined))return "lupus nephritis wire loop glomeruli histopathology immunofluorescence";
  if(/tuberculosis/i.test(combined))return "tuberculosis lung gross caseating granuloma histopathology Langhans giant cells";
  if(/contact dermatitis/i.test(combined))return "allergic contact dermatitis skin histopathology spongiosis vesicles";
  return "hypersensitivity reaction pathological anatomy gross specimen histopathology tissue lesion";
 }
 if(/acute inflammation|inflamm/.test(combined)){
  if(/vascular|permeability|vasodilat|vessel/.test(combined))return "acute inflammation blood vessel vasodilation endothelial gaps histology";
  if(/cellular|leukocyte|neutrophil|chemotaxis|migration|extravasation/.test(combined))return "neutrophil extravasation leukocyte migration acute inflammation";
  if(/mediator|histamine|prostaglandin|complement|cytokine/.test(combined))return "inflammatory mediators histamine prostaglandin complement pathway";
  if(/resolution|repair|healing|regeneration/.test(combined))return "acute inflammation resolution macrophage tissue repair";
  if(/morpholog|microscop|histolog|exudate|pus|suppurat/.test(combined))return "acute inflammation histopathology neutrophils H&E micrograph";
  return "acute inflammation histopathology tissue neutrophils H&E";
 }
 return (topic+" "+title+" "+visual).replace(/[^a-zA-Z0-9 -]/g," ").replace(/\\s+/g," ").trim().slice(0,100);
}
async function fetchCommonsVisual(query:string,preferGif=false):Promise<MedicalVisual|null>{
  const terms=[query,query.replace(/histopathology|micrograph|H&E/gi,"").trim(),query.split(" ").slice(0,4).join(" "),query.split(" ").slice(0,2).join(" ")].filter((v,i,a)=>v.length>4&&a.indexOf(v)===i);
  for(const term of terms){
  try{
   const search=(preferGif?"filetype:gif ":"")+term;
   const api="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch="+encodeURIComponent(search)+"&gsrlimit=30&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=1400&format=json";
   const res=await fetch(api,{headers:{"User-Agent":"FaizanAIMedicalPresentation/1.0 (educational use)","Accept":"application/json"},signal:AbortSignal.timeout(12000)});
   if(res.ok){
    const json=await res.json();
    const pages=Object.values(json?.query?.pages||{}) as any[];
    for(const p of pages){
     const info=p?.imageinfo?.[0]; if(!info)continue;
     const originalMime=String(info.mime||"").toLowerCase();
     if(preferGif?originalMime!=="image/gif":!["image/jpeg","image/png","image/webp","image/svg+xml"].includes(originalMime))continue;
     const url=preferGif?(info.url||""):(info.thumburl||info.url||"");
     if(!url||!/^https:\/\//i.test(url))continue;
     const image=await fetch(url,{headers:{"User-Agent":"FaizanAIMedicalPresentation/1.0"},signal:AbortSignal.timeout(12000)});
     if(!image.ok)continue;
     const bytes=Buffer.from(await image.arrayBuffer());
     const mime=preferGif?"image/gif":String(info.thumbmime||"").toLowerCase()|| (originalMime==="image/svg+xml"?"image/png":originalMime);
     if(!["image/jpeg","image/png","image/webp","image/gif"].includes(mime)||bytes.length>1800000||bytes.length<1000)continue;
     const meta=info.extmetadata||{};
     const strip=(v:any)=>String(v?.value||"").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").trim().slice(0,240);
     return {data:bytes.toString("base64"),mime,title:String(p.title||"Wikimedia Commons file"),page:"https://commons.wikimedia.org/wiki/"+encodeURIComponent(String(p.title||"").replace(/ /g,"_")),license:strip(meta.LicenseShortName)||"See source page for license",artist:strip(meta.Artist)||"Author listed on source page",animated:preferGif};
    }
   }
  }catch(e){console.warn("[Faizan AI] Wikimedia image lookup failed",term,e)}
  }
  if(preferGif)return null;
  // Openverse is a second independent source; it often finds educational cell
  // microscopy and anatomy images when Commons search returns no usable file.
  try{
   const api="https://api.openverse.org/v1/images/?q="+encodeURIComponent(query)+"&page_size=12&license=cc0,by,by-sa,by-nc,by-nc-sa,by-nd,by-nc-nd";
   const res=await fetch(api,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(15000)});
   if(!res.ok)throw new Error("Openverse returned HTTP "+res.status);
   const results:any[]=(await res.json())?.results||[];
   for(const item of results){
    const url=String(item.thumbnail||item.url||"");
    if(!/^https:\/\//i.test(url))continue;
    const image=await fetch(url,{headers:{"User-Agent":"FaizanAIMedicalPresentation/1.0"},signal:AbortSignal.timeout(12000)});
    if(!image.ok)continue;
    const mime=String(image.headers.get("content-type")||"").split(";")[0].toLowerCase();
    if(!["image/jpeg","image/png","image/webp"].includes(mime))continue;
    const bytes=Buffer.from(await image.arrayBuffer());
    if(bytes.length<1000||bytes.length>1800000)continue;
    return {data:bytes.toString("base64"),mime,title:String(item.title||"Open-license medical image").slice(0,180),page:String(item.foreign_landing_url||item.url||"https://openverse.org/"),license:String(item.license||"Open license").toUpperCase(),artist:String(item.creator||"Creator not listed").slice(0,180),animated:false};
   }
  }catch(e){console.warn("[Faizan AI] Openverse image lookup failed",query,e)}
  return null;
}

export async function POST(req:NextRequest){
 try{
  // Public generation: authentication is intentionally not required for this tool.
  // Keep input limits and provider-side safeguards in place to reduce accidental abuse.

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
  const researchContext=research.length?JSON.stringify(research):"No recent PubMed records were retrieved; do not invent recent research.";
  const isHypersensitivity=/hypersensitivity/i.test(topic);
  const pathologyOnly=isHypersensitivity && /patholog|morpholog|anatom/i.test(topic);
  const hypersensitivityOutline = [
   {title:"Scope: Hypersensitivity in Pathological Anatomy",bullets:["Hypersensitivity is an immune-mediated reaction that produces structural tissue injury; this lecture concentrates on the resulting lesions, not immunologic pathways.","Describe each example at two levels: gross (macroscopic organ appearance) and microscopic (cellular and tissue pattern).","There is no single gross appearance for each hypersensitivity type; morphology depends on the target organ and the associated disease.","The four types are used only as an organizing classification for the morphological examples."],visual:"Four-panel overview comparing gross organ specimens and microscopic tissue patterns for hypersensitivity types I–IV."},
   {title:"Type I: Immediate Hypersensitivity — Bronchial Asthma",bullets:["Gross: lungs may be overinflated; bronchi can contain tenacious mucus plugs, especially in severe fatal asthma.","Microscopy: airway mucosa shows edema and eosinophil-rich inflammation; mucus plugs may contain Curschmann spirals and Charcot–Leyden crystals.","Chronic remodeling includes thickened basement membrane, enlarged bronchial smooth muscle and increased mucus glands.","Morphology to recognize: mucus plugging, eosinophils and airway-wall remodeling."],visual:"Gross pathology of hyperinflated lungs with mucus-plugged bronchi alongside an H&E bronchial section showing eosinophils, mucus plug and thickened basement membrane."},
   {title:"Type I: Immediate Hypersensitivity — Anaphylaxis and Urticaria",bullets:["Gross: urticaria produces raised, transient wheals; severe anaphylaxis may cause marked laryngeal and mucosal edema.","Microscopy: dermal edema separates collagen bundles, with dilated small vessels and a variable perivascular inflammatory infiltrate.","Airway edema may narrow the laryngeal lumen; this is a potentially life-threatening gross anatomical change.","Do not confuse the visible wheal/edema with a specific microscopic granulomatous or necrotizing lesion."],visual:"Gross skin wheals and laryngeal edema with a histological skin section showing dermal edema and dilated vessels."},
   {title:"Type II: Antibody-Mediated Injury — Goodpasture Syndrome",bullets:["Gross lungs: areas of pulmonary hemorrhage may appear heavy, wet and dark red-brown; recurrent bleeding can lead to hemosiderin-laden macrophages.","Gross kidneys may show no distinctive external lesion; severe disease can produce enlarged, pale kidneys, but this is not specific.","Microscopy: necrotizing crescentic glomerulonephritis with fibrinoid necrosis and crescents in severe cases.","Immunofluorescence shows a linear IgG pattern along glomerular and alveolar basement membranes; this is a diagnostic tissue pattern, not a gross feature."],visual:"Paired gross lung with pulmonary hemorrhage and kidney section, plus renal glomerulus with crescent formation and linear basement-membrane immunofluorescence."},
   {title:"Type II: Antibody-Mediated Injury — Autoimmune Blistering Disease",bullets:["Pemphigus vulgaris: grossly flaccid, easily ruptured blisters and painful erosions of skin or oral mucosa.","Microscopy: suprabasal acantholysis creates an intraepidermal cleft; basal cells remain attached in a row-of-tombstones appearance.","Bullous pemphigoid: grossly tense blisters; microscopy shows a subepidermal split with eosinophils.","These contrasting cleavage levels are the key pathological-anatomical distinction."],visual:"Gross comparison of flaccid pemphigus and tense pemphigoid blisters with labeled histological intraepidermal versus subepidermal clefts."},
   {title:"Type III: Immune-Complex Injury — Vasculitis",bullets:["Gross: affected medium or small arteries may show segmental wall thickening, thrombosis, hemorrhage or small aneurysmal dilatations; appearance varies by vessel and organ.","Microscopy: vessel walls show fibrinoid necrosis with neutrophilic inflammation and nuclear dust (leukocytoclasia).","Involved organs may develop ischemic infarcts or hemorrhages downstream from damaged vessels.","A classic example of immune-complex vascular injury is the Arthus reaction; do not label every vasculitis as type III without clinical-pathological context."],visual:"Gross arterial segment with focal aneurysmal dilatation and hemorrhage, paired with histology showing fibrinoid necrosis and neutrophilic vessel-wall inflammation."},
   {title:"Type III: Immune-Complex Injury — Lupus Nephritis",bullets:["Gross: kidneys may be enlarged and pale in active diffuse disease, but gross appearance is variable and may be unremarkable.","Microscopy: proliferative lesions show endocapillary hypercellularity, leukocyte influx and, in severe cases, wire-loop capillary-wall thickening.","Immunofluorescence classically shows granular immune deposits; electron microscopy may show subendothelial and other electron-dense deposits.","The diagnostic emphasis is the glomerular pattern and immune deposits, not a unique gross kidney appearance."],visual:"Gross kidney cut section beside renal glomerulus with endocapillary proliferation and wire-loop capillary loops; separate granular immunofluorescence inset."},
   {title:"Type IV: T-Cell-Mediated Injury — Tuberculosis",bullets:["Gross lung: caseating granulomas may appear as yellow-white, cheese-like areas; cavitation can develop in post-primary pulmonary disease.","Microscopy: central caseous necrosis is surrounded by epithelioid histiocytes, Langhans-type giant cells and a rim of lymphocytes.","Fibrosis and calcification may occur in healed lesions.","The granulomatous pattern is a delayed-type cell-mediated tissue reaction; identify the necrotic center and cellular rim."],visual:"Gross lung with yellow-white caseous focus and cut surface, alongside H&E granuloma with central caseation, epithelioid histiocytes, Langhans giant cell and lymphocytes."},
   {title:"Type IV: T-Cell-Mediated Injury — Contact Dermatitis",bullets:["Gross skin: erythema, edema, papules and small vesicles occur at sites of contact; chronic lesions may become scaly and lichenified.","Microscopy: spongiosis (intercellular epidermal edema) is the hallmark; lymphocytes migrate into the epidermis (exocytosis).","A superficial perivascular lymphocytic infiltrate is present in the dermis; severe cases may form intraepidermal vesicles.","This is a useful contrast with antibody-mediated blistering, where the level of epidermal separation differs."],visual:"Gross eczematous contact dermatitis with erythema and vesicles, paired with skin histology showing spongiosis, lymphocyte exocytosis and intraepidermal vesicle."}
  ];
  const prompt=`Create a medically accurate MBBS teaching presentation in ${language} about this exact topic: "${topic}".${pathologyOnly ? " STRICT SCOPE: PATHOLOGICAL ANATOMY ONLY. Use the supplied pathology-focused outline verbatim as the content basis; do not replace it with immunology teaching. Gross/macro morphology and microscopic morphology are the central content on every disease slide. Explain the actual affected organ, its cut-surface/visible appearance, and the tissue-level lesion. Mention immune mechanism only in one short orienting phrase where essential. Do not invent gross changes where none are characteristic; explicitly say when gross appearance is variable or nonspecific. Do not describe normal gross anatomy as a substitute for pathological morphology." : ""} STRICT TOPIC FIDELITY: every slide title, bullet, example, clinical condition, and visual must directly teach this topic. Do not drift into neighboring subjects or add unrelated diseases, case reports, or generic medical facts. Use a coherent textbook-style sequence. Use precise standard medical terminology and explain morphology rather than vague statements. If a detail is uncertain, omit it instead of guessing. Do not create research claims or citations from article titles. Do not invent numerical values, guidelines, references, or facts. Return only JSON: {"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["..."],"visual":"..."}]}. Create exactly ${count-1} content slides (the cover is an additional first slide, making ${count} slides total), with 3-5 concise, topic-specific bullets per slide. The final content slide must be a summary with 2-3 review questions. Each visual field must describe a specific labeled medical illustration, gross specimen, histology image, or morphology comparison that genuinely matches that slide.${pathologyOnly ? " Use these exact nine slide topics and facts as the source outline; preserve all gross and microscopic findings and do not substitute a generic mechanism diagram: "+JSON.stringify(hypersensitivityOutline) : ""}`;
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
    result = await generateWithFallback([{role:"user",content:prompt+"\nYour previous response was invalid JSON. Correct it and return a complete JSON object only. Double-quote every key. No markdown, comments, or trailing commas."}], system, provider, 6000);
    try {
      outline = parseOutline(result.answer);
      if (!Array.isArray(outline.slides) || !outline.slides.length) throw Error("Missing slides");
    } catch {
      throw Error("The AI provider returned invalid presentation data twice. Please try again or choose another AI provider.");
    }
  }

  // Reliable local quality gate: do not make a second AI call a hard dependency.
  // The initial generation already requests medical accuracy; here we validate
  // the structure required for a complete, renderable teaching deck.
  const checkedSlides = (outline.slides ?? []).slice(0, count-1).map((s, index) => {
    const title = clean(s?.title);
    const bullets = Array.isArray(s?.bullets) ? s.bullets.map(x => clean(x)).filter(Boolean).slice(0, 5) : [];
    if (!title) throw new Error(`Slide ${index + 1} is missing a title.`);
    if (bullets.length < 3) throw new Error(`Slide ${index + 1} has fewer than 3 usable bullet points. Please regenerate the presentation.`);
    return { title, bullets, visual: clean(s?.visual, `Create a topic-specific labeled medical diagram for ${title}.`) };
  });
  if (checkedSlides.length !== count-1) {
    throw new Error(`The AI generated ${checkedSlides.length} slides, but ${count} were requested. Please retry or choose another AI provider.`);
  }
  outline = {
    title: clean(outline.title, topic),
    subtitle: clean(outline.subtitle, "Medical learning presentation"),
    slides: checkedSlides
  };
  console.info("[Faizan AI] Local presentation quality validation passed", { slides: checkedSlides.length });


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

  const slides=(outline.slides??[]).slice(0,count-1);
  // Retrieve topic-matched, openly licensed Commons visuals. Uploaded images are prioritized and distributed across slides.
  const visualAssets:(MedicalVisual|null)[]=await Promise.all(slides.map(async(item,index)=>{
   if(sources.includes("upload")&&images[index%Math.max(images.length,1)]){
    const im=images[index%images.length];
    return {data:im.data,mime:im.type,title:im.name,page:"User-provided image",license:"User supplied",artist:"User supplied",animated:false};
   }
   if(sources.includes("web"))return await fetchCommonsVisual(getSlideVisualQuery(topic,item.title,item.visual),false);
   return null;
  }));
  // A failed external image search must not cancel the whole presentation.
  // Each slide still receives an editable, topic-specific PowerPoint diagram below.
  const externalImageCount=visualAssets.filter(Boolean).length;
  console.info("[Faizan AI] External medical images retrieved", {externalImageCount,totalSlides:slides.length});
  // One optional GIF is embedded when Commons has a relevant animated medical asset.
  let animatedAsset:MedicalVisual|null=null;
  if(sources.includes("web"))animatedAsset=await fetchCommonsVisual(topic+" "+clean(slides[0]?.title),true);



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
   const bullets=Array.isArray(item.bullets)?item.bullets.slice(0,4):[];
   // Use literal bullet characters rather than PowerPoint bullet metadata.
   // This avoids first-character clipping in some PPTX-to-PDF converters.
   const text=bullets.map((b:string)=>"•  "+clean(b)).join("\n");
   if(text)s.addText(text,{x:.75,y:1.72,w:5.8,h:4.85,fontFace:"Arial",fontSize:15,color:"263849",breakLine:false,paraSpaceAfter:12,fit:"shrink",margin:.12,valign:"top",lineSpacingMultiple:1.05});
   const visual=visualAssets[i];
   if(visual){
    s.addImage({data:`data:${visual.mime};base64,${visual.data}`,x:7.05,y:1.8,w:5.55,h:4.55, sizing:{type:"contain",w:5.55,h:4.55}});
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

  const out=await pptx.write({outputType:"nodebuffer"});
  const b=Buffer.isBuffer(out)?out:Buffer.from(out as ArrayBuffer);
  const ab=b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength) as ArrayBuffer;
  return new NextResponse(ab,{headers:{"Content-Type":"application/vnd.openxmlformats-officedocument.presentationml.presentation","Content-Disposition":'attachment; filename="Faizan-AI-Presentation.pptx"',"Cache-Control":"no-store","X-Faizan-AI-Provider":result.provider,"X-Faizan-AI-Image-Count":String(visualAssets.filter(Boolean).length),"X-Faizan-AI-Animated-Count":String(animatedAsset?1:0),"X-Faizan-AI-Slide-Count":String(slides.length)}});
 }catch(e){
  console.error("Presentation:",e);
  return NextResponse.json({error:e instanceof Error?e.message:"PowerPoint generation failed."},{status:502});
 }
}
