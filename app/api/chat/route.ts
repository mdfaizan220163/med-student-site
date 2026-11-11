import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = {
  role: "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" | "original" } }
      >;
};

const SYSTEM_PROMPT = `You are Medical Study Assistant, an educational tutor for medical students.
Explain concepts clearly at MBBS level. Use headings and concise bullet points when useful.
For clinical cases, explain the reasoning and differential diagnosis for education, but never claim to diagnose a real patient or replace a qualified clinician.
When interpreting an uploaded medical image, describe only visible findings, state uncertainty and image limitations, and do not invent labels or measurements. Encourage correlation with clinical history and formal reports.
If asked for current guidelines or references that you cannot verify, say so rather than inventing citations.`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "The AI service is not configured yet. Add DEEPSEEK_API_KEY in Vercel project environment variables and redeploy." }, { status: 503 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 7 * 1024 * 1024) {
    return NextResponse.json({ error: "Request is too large. Please use an image smaller than 5 MB." }, { status: 413 });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 12) {
    return NextResponse.json({ error: "Send between 1 and 12 recent messages." }, { status: 400 });
  }

  const messages: ChatMessage[] = [];
  for (const item of body.messages) {
    if (!item || !["user", "assistant"].includes(item.role)) {
      return NextResponse.json({ error: "Invalid message format." }, { status: 400 });
    }
    if (typeof item.content === "string") {
      if (item.content.length > 12000) return NextResponse.json({ error: "A message is too long." }, { status: 400 });
      messages.push({ role: item.role, content: item.content });
      continue;
    }
    if (item.role !== "user" || !Array.isArray(item.content) || item.content.length > 2) {
      return NextResponse.json({ error: "Unsupported image message format." }, { status: 400 });
    }
    const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail: "auto" } }> = [];
    for (const part of item.content) {
      if (part.type === "text" && typeof part.text === "string" && part.text.length <= 12000) {
        parts.push({ type: "text", text: part.text });
      } else if (part.type === "image_url" && typeof part.image_url?.url === "string") {
        const url = part.image_url.url;
        if (!/^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(url) || url.length > 6_800_000) {
          return NextResponse.json({ error: "Unsupported image. Use a JPEG, PNG, WebP or GIF image under 5 MB." }, { status: 400 });
        }
        parts.push({ type: "image_url", image_url: { url, detail: "auto" } });
      } else {
        return NextResponse.json({ error: "Unsupported message content." }, { status: 400 });
      }
    }
    messages.push({ role: item.role, content: parts });
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "The last message must be from the user." }, { status: 400 });
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.4,
        max_tokens: 1800,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("DeepSeek API error:", response.status, errorBody.slice(0, 1000));
      return NextResponse.json(
        { error: response.status === 401 ? "DeepSeek rejected the API key. Check the key in Vercel." : response.status === 402 ? "Your DeepSeek API balance or quota may be insufficient." : "The AI provider could not complete the request. Please try again." },
        { status: response.status === 401 ? 401 : response.status === 402 ? 402 : 502 }
      );
    }

    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return NextResponse.json({ error: "The AI returned an empty response. Please try again." }, { status: 502 });
    }
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Medical AI request failed:", error);
    return NextResponse.json({ error: "Could not reach the AI service. Please try again shortly." }, { status: 502 });
  }
}
