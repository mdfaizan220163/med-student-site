export type Provider="deepseek"|"gemini"|"groq"|"claude"|"openai";
export type Part={type:"text";text:string}|{type:"image_url";image_url:{url:string}};
export type Message={role:"user"|"assistant";content:string|Part[]};
export const providerNames:Record<Provider,string>={deepseek:"DeepSeek",gemini:"Gemini",groq:"Groq",claude:"Claude",openai:"ChatGPT"};
export function availableProviders():Provider[]{const a:Provider[]=[];if(process.env.DEEPSEEK_API_KEY)a.push("deepseek");if(process.env.GEMINI_API_KEY)a.push("gemini");if(process.env.GROQ_API_KEY)a.push("groq");if(process.env.ANTHROPIC_API_KEY)a.push("claude");if(process.env.OPENAI_API_KEY)a.push("openai");return a;}
export async function askProvider(p:Provider,m:Message[],system:string,maxTokens=1800):Promise<string>{
 const plain=m.map(x=>({role:x.role,content:typeof x.content==="string"?x.content:x.content.map(y=>y.type==="text"?y.text:"").join("\n")}));
 if(p==="deepseek"){
  if(m.some(x=>Array.isArray(x.content)&&x.content.some(y=>y.type==="image_url")))throw Error("DeepSeek chat mode cannot process images. Choose Gemini, Claude or ChatGPT for image questions.");
  const r=await fetch("https://api.deepseek.com/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.DEEPSEEK_API_KEY}`},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||"deepseek-chat",messages:[{role:"system",content:system},...plain],temperature:.35,max_tokens:maxTokens}),signal:AbortSignal.timeout(55000)});
  const d=await r.json();if(!r.ok)throw Error(d?.error?.message||"DeepSeek failed");return d?.choices?.[0]?.message?.content?.trim()||"";
 }
 if(p==="gemini"){
  const contents=m.map(x=>({role:x.role==="assistant"?"model":"user",parts:typeof x.content==="string"?[{text:x.content}]:x.content.map(y=>y.type==="text"?{text:y.text}:{inline_data:{mime_type:y.image_url.url.match(/^data:(image\/[^;]+);base64,/)?.[1]||"image/jpeg",data:y.image_url.url.split(",")[1]}})}));
  const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL||"gemini-2.5-flash"}:generateContent`,{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":process.env.GEMINI_API_KEY!},body:JSON.stringify({systemInstruction:{parts:[{text:system}]},contents,generationConfig:{temperature:.35,maxOutputTokens:maxTokens}}),signal:AbortSignal.timeout(55000)});
  const d=await r.json();if(!r.ok)throw Error(d?.error?.message||"Gemini failed");return d?.candidates?.[0]?.content?.parts?.map((x:{text?:string})=>x.text||"").join("").trim()||"";
 }
 if(p==="groq"){
  if(m.some(x=>Array.isArray(x.content)&&x.content.some(y=>y.type==="image_url")))throw Error("Groq text mode cannot process images. Choose Gemini, Claude or ChatGPT.");
  const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.GROQ_API_KEY}`},body:JSON.stringify({model:process.env.GROQ_MODEL||"openai/gpt-oss-120b",messages:[{role:"system",content:system},...plain],temperature:.35,max_tokens:maxTokens}),signal:AbortSignal.timeout(55000)});
  const d=await r.json();if(!r.ok)throw Error(d?.error?.message||"Groq failed");return d?.choices?.[0]?.message?.content?.trim()||"";
 }
 if(p==="claude"){
  const content=m.map(x=>({role:x.role,content:typeof x.content==="string"?[{type:"text",text:x.content}]:x.content.map(y=>y.type==="text"?{type:"text",text:y.text}:{type:"image",source:{type:"base64",media_type:y.image_url.url.match(/^data:(image\/[^;]+);base64,/)?.[1]||"image/jpeg",data:y.image_url.url.split(",")[1]}})}));
  const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY!,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:process.env.CLAUDE_MODEL||"claude-sonnet-5-5",system,messages:content,max_tokens:maxTokens}),signal:AbortSignal.timeout(55000)});
  const d=await r.json();if(!r.ok)throw Error(d?.error?.message||"Claude failed");return d?.content?.filter((x:{type:string})=>x.type==="text").map((x:{text:string})=>x.text).join("").trim()||"";
 }
 const content=m.map(x=>({role:x.role,content:typeof x.content==="string"?x.content:x.content.map(y=>y.type==="text"?{type:"text",text:y.text}:{type:"image_url",image_url:{url:y.image_url.url}})}));
 const r=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||"gpt-4o-mini",messages:[{role:"system",content:system},...content],temperature:.35,max_tokens:maxTokens}),signal:AbortSignal.timeout(55000)});
 const d=await r.json();if(!r.ok)throw Error(d?.error?.message||"OpenAI failed");return d?.choices?.[0]?.message?.content?.trim()||"";
}
export async function generateWithFallback(m:Message[],system:string,preferred="auto",maxTokens=1800):Promise<{answer:string;provider:Provider}>{
 const available=availableProviders();const order:Provider[]=preferred==="auto"?["deepseek","gemini","groq","claude","openai"]:[preferred as Provider,...(["deepseek","gemini","groq","claude","openai"] as Provider[]).filter(x=>x!==preferred)];
 const candidates=order.filter(x=>available.includes(x));if(!candidates.length)throw Error("No AI provider API key is configured in Vercel.");
 let last="AI provider request failed.";for(const p of candidates){try{const answer=await askProvider(p,m,system,maxTokens);if(answer)return{answer,provider:p};last=providerNames[p]+" returned an empty response.";}catch(e){last=e instanceof Error?e.message:last;console.error(providerNames[p],last);}}throw Error(last);
}