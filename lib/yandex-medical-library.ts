import pdfParse from "pdf-parse";

export type YandexKnowledgeChunk = { source: string; text: string; score: number };
export type YandexLibraryImage = {
  name: string;
  data: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
  score: number;
};

type DiskItem = {
  name?: string; path?: string; type?: string; mime_type?: string;
  size?: number; file?: string; md5?: string;
  _embedded?: { items?: DiskItem[]; total?: number };
};
const API = "https://cloud-api.yandex.net/v1/disk";
const MAX_LIBRARY_ITEMS = 180;
const MAX_PDF_BYTES = 14 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function tokens(value: string): string[] {
  return Array.from(new Set(value.toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ").split(/\s+/)
    .filter((word) => word.length > 2 && !["the","and","for","with","from","into","about","medical","lecture","notes"].includes(word))));
}
function relevance(text: string, query: string): number {
  const q = tokens(query), words = tokens(text);
  if (!q.length) return 0;
  const set = new Set(words);
  return q.reduce((score, word) => score + (set.has(word) ? 1 : 0), 0) / q.length;
}
export function rankLibraryImage(images: YandexLibraryImage[], query: string, used: Set<string>): YandexLibraryImage | null {
  return images.filter((image) => !used.has(image.name.toLowerCase()))
    .map((image) => ({ image, score: relevance(image.name, query) * 10 + image.score }))
    .sort((a,b) => b.score-a.score)[0]?.image ?? null;
}
async function readJson(url: string): Promise<any> {
  const response = await fetch(url, { headers: { Accept:"application/json", "User-Agent":"FaizanAI-Medical-Library/1.0" }, signal:AbortSignal.timeout(10000), cache:"no-store" });
  if (!response.ok) throw new Error(`Yandex Disk API returned HTTP ${response.status}`);
  return response.json();
}
function makeApiUrl(endpoint: string, publicKey: string, path?: string, offset = 0): string {
  const params = new URLSearchParams({ public_key:publicKey, limit:"1000", offset:String(offset) });
  if (path) params.set("path",path);
  return `${API}/public/resources${endpoint}?${params.toString()}`;
}
async function listLibraryItems(publicKey: string): Promise<DiskItem[]> {
  const found:DiskItem[]=[]; const visited=new Set<string>();
  async function walk(path:string|undefined,depth:number):Promise<void>{
    if(found.length>=MAX_LIBRARY_ITEMS||depth>4)return;
    const key=path||"/"; if(visited.has(key))return; visited.add(key);
    let offset=0;
    while(found.length<MAX_LIBRARY_ITEMS){
      const meta=await readJson(makeApiUrl("",publicKey,path,offset));
      const items:DiskItem[]=meta?._embedded?.items??[]; if(!items.length)break;
      for(const item of items){
        if(item.type==="dir"){
          const child=item.path||(path?`${path.replace(/\/$/,"")}/${item.name||""}`:`/${item.name||""}`);
          await walk(child,depth+1);
        } else if(item.type==="file"){found.push(item);if(found.length>=MAX_LIBRARY_ITEMS)break;}
      }
      offset+=items.length;
      if(items.length<1000||offset>=Number(meta?._embedded?.total||0))break;
    }
  }
  await walk(undefined,0); return found;
}
async function downloadItem(publicKey:string,item:DiskItem,maxBytes:number):Promise<Buffer|null>{
  if(typeof item.size==="number"&&(item.size<=0||item.size>maxBytes))return null;
  let href=item.file;
  if(!href){const link=await readJson(makeApiUrl("/download",publicKey,item.path));href=link?.href;}
  if(typeof href!=="string"||!/^https:\/\//i.test(href))return null;
  const response=await fetch(href,{headers:{"User-Agent":"FaizanAI-Medical-Library/1.0"},signal:AbortSignal.timeout(16000),cache:"no-store"});
  if(!response.ok)return null;
  const bytes=Buffer.from(await response.arrayBuffer());
  return bytes.length>0&&bytes.length<=maxBytes?bytes:null;
}
function splitChunks(text:string,source:string,query:string):YandexKnowledgeChunk[]{
  const paragraphs=text.replace(/\r/g,"").split(/\n{1,}/).map(p=>p.replace(/\s+/g," ").trim()).filter(p=>p.length>100);
  const chunks:string[]=[];
  for(let i=0;i<paragraphs.length;){
    let chunk=paragraphs[i++];
    while(i<paragraphs.length&&chunk.length<1300){chunk+=" "+paragraphs[i++];}
    chunks.push(chunk.slice(0,1800));
  }
  return chunks.map(text=>({source,text,score:relevance(text,query)})).filter(x=>x.score>0.02);
}
export async function getYandexMedicalMaterials(query:string):Promise<{
  knowledge:YandexKnowledgeChunk[]; images:YandexLibraryImage[]; itemCount:number; error?:string;
}>{
  const publicKey=process.env.YANDEX_DISK_PUBLIC_URL?.trim();
  if(!publicKey)return {knowledge:[],images:[],itemCount:0,error:"YANDEX_DISK_PUBLIC_URL is not configured"};
  try{
    const items=await listLibraryItems(publicKey);
    const pdfs=items.filter(x=>/\.pdf$/i.test(x.name||"")&&(!x.size||x.size<=MAX_PDF_BYTES))
      .map(item=>({item,score:relevance(item.name||"",query)})).sort((a,b)=>b.score-a.score).slice(0,7);
    const imageItems=items.filter(x=>/\.(jpe?g|png|webp)$/i.test(x.name||"")&&(!x.size||x.size<=MAX_IMAGE_BYTES))
      .map(item=>({item,score:relevance(item.name||"",query)})).sort((a,b)=>b.score-a.score).slice(0,24);
    const pdfResults=await Promise.all(pdfs.map(async({item})=>{
      try{
        const bytes=await downloadItem(publicKey,item,MAX_PDF_BYTES); if(!bytes)return [];
        const parsed=await pdfParse(bytes);
        return splitChunks(String(parsed.text||""),item.name||"Yandex PDF",query);
      }catch(error){console.warn("[Faizan AI] Yandex PDF extraction failed",item.name,error);return [];}
    }));
    const knowledge=pdfResults.flat().sort((a,b)=>b.score-a.score).slice(0,8);
    const images:YandexLibraryImage[]=[]; const seen=new Set<string>();
    for(const {item,score} of imageItems){
      const identity=(item.md5||item.name||"").toLowerCase();if(!identity||seen.has(identity))continue;seen.add(identity);
      try{
        const bytes=await downloadItem(publicKey,item,MAX_IMAGE_BYTES);if(!bytes)continue;
        const ext=(item.name||"").toLowerCase().split(".").pop();
        const mime=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
        images.push({name:item.name||"Yandex medical image",data:bytes.toString("base64"),mime,score:score*10});
      }catch(error){console.warn("[Faizan AI] Yandex image retrieval failed",item.name,error);}
    }
    return {knowledge,images,itemCount:items.length};
  }catch(error){
    console.warn("[Faizan AI] Yandex library retrieval failed",error);
    return {knowledge:[],images:[],itemCount:0,error:error instanceof Error?error.message:"Yandex retrieval failed"};
  }
}
