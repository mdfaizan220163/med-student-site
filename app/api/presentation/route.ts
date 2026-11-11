import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";

export const runtime = "nodejs";
export const maxDuration = 60;

type SlideContent = { title: string; bullets: string[]; visual?: string };

const clean = (value: unknown, fallback = "") =>
  typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, " ").trim() : fallback;

export async function POST(request: NextRequest) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return NextResponse.json({ error: "Faizan AI is not configured. Add DEEPSEEK_API_KEY in Vercel and redeploy." }, { status: 503 });

  try {
    const form = await request.formData();
    const topic = clean(form.get("topic"));
    const language = clean(form.get("language"), "English");
    const slideCount = Math.min(20, Math.max(5, Number(form.get("slides")) || 10));
    if (!topic || topic.length > 300) return NextResponse.json({ error: "Enter a topic (maximum 300 characters)." }, { status: 400 });

    const uploaded: { name: string; data: string; type: string }[] = [];
    let totalBytes = 0;
    for (const entry of form.getAll("images")) {
      if (!(entry instanceof File)) continue;
      if (!["image/png", "image/jpeg", "image/webp"].includes(entry.type)) continue;
      totalBytes += entry.size;
      if (totalBytes > 12 * 1024 * 1024) return NextResponse.json({ error: "Please keep all uploaded images under 12 MB total." }, { status: 413 });
      const bytes = Buffer.from(await entry.arrayBuffer());
      uploaded.push({ name: entry.name, data: bytes.toString("base64"), type: entry.type });
    }

    const prompt = `Create a medically accurate educational MBBS presentation in ${language} about: ${topic}.
Return ONLY valid JSON, no markdown, in this exact shape:
{"title":"...","subtitle":"...","slides":[{"title":"...","bullets":["...","..."],"visual":"short optional visual suggestion"}]}
Create exactly ${slideCount} slides. Include learning objectives, core mechanisms/concepts, clinical relevance, summary, and 2-3 review questions when slide count permits. Keep each slide concise (3-5 bullets, each under 20 words). Do not invent references, statistics, guidelines, or citations. If a fact is uncertain, phrase cautiously. This is educational content, not patient-specific advice.`;

    const aiResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 5000
      }),
      signal: AbortSignal.timeout(50000)
    });

    if (!aiResponse.ok) {
      const detail = await aiResponse.text();
      console.error("Presentation AI provider error:", aiResponse.status, detail.slice(0, 800));
      const message = aiResponse.status === 402
        ? "DeepSeek API balance is insufficient. Add API credits, then try again."
        : aiResponse.status === 401
        ? "DeepSeek rejected the API key. Check DEEPSEEK_API_KEY in Vercel."
        : "Faizan AI could not generate the slide content. Please try again.";
      return NextResponse.json({ error: message }, { status: aiResponse.status === 402 ? 402 : aiResponse.status === 401 ? 401 : 502 });
    }

    const aiData = await aiResponse.json();
    const raw = aiData?.choices?.[0]?.message?.content;
    if (typeof raw !== "string") throw new Error("The AI returned no presentation content.");
    const parsedText = raw.replace(/^\uFEFF/, "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const content = JSON.parse(parsedText) as { title?: string; subtitle?: string; slides?: SlideContent[] };
    if (!Array.isArray(content.slides) || content.slides.length === 0) throw new Error("The AI returned an invalid slide outline.");

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_WIDE";
    pptx.author = "Faizan AI";
    pptx.subject = topic;
    pptx.title = clean(content.title, topic);
    pptx.company = "Faizan AI";
    pptx.theme = {
      headFontFace: "Aptos Display",
      bodyFontFace: "Aptos",
    };
    const navy = "102B4E";
    const blue = "2E6F9E";
    const pale = "F2F6FA";
    const addWatermark = (slide: PptxGenJS.Slide) => {
      slide.addText("FAIZAN AI", { x: 10.15, y: 7.13, w: 2.45, h: 0.18, fontFace: "Aptos", fontSize: 8, bold: true, color: "8BA2B7", transparency: 15, align: "right", margin: 0 });
    };

    const cover = pptx.addSlide();
    cover.background = { color: navy };
    cover.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.22, h: 7.5, line: { color: blue }, fill: { color: blue } });
    cover.addText(clean(content.title, topic), { x: 0.8, y: 1.65, w: 11.3, h: 1.6, fontFace: "Aptos Display", fontSize: 30, bold: true, color: "FFFFFF", breakLine: false, fit: "shrink" });
    cover.addText(clean(content.subtitle, "Medical learning presentation"), { x: 0.85, y: 3.45, w: 10.8, h: 0.55, fontSize: 17, color: "D5E4F0", fit: "shrink" });
    cover.addText("Prepared with Faizan AI", { x: 0.85, y: 6.65, w: 5, h: 0.3, fontSize: 11, color: "B8CDDF" });
    addWatermark(cover);

    const slides = content.slides.slice(0, slideCount);
    for (let i = 0; i < slides.length; i++) {
      const item = slides[i];
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.16, line: { color: navy }, fill: { color: navy } });
      slide.addText(clean(item.title, `Section ${i + 1}`), { x: 0.65, y: 0.55, w: 11.9, h: 0.72, fontFace: "Aptos Display", fontSize: 25, bold: true, color: navy, fit: "shrink" });
      const bullets = Array.isArray(item.bullets) ? item.bullets.slice(0, 6) : [];
      if (bullets.length) {
        slide.addText(bullets.map((b) => ({ text: clean(b), options: { bullet: { indent: 16 }, hanging: 4, breakLine: true } })), {
          x: 0.9, y: 1.65, w: 11.4, h: 4.55, fontFace: "Aptos", fontSize: 19, color: "263849", paraSpaceAfter: 15, breakLine: false, fit: "shrink", margin: 0.08
        });
      }
      if (item.visual) {
        slide.addShape(pptx.ShapeType.roundRect, { x: 0.9, y: 6.25, w: 11.45, h: 0.55, rectRadius: 0.08, line: { color: "D9E5EF" }, fill: { color: pale } });
        slide.addText(`Visual idea: ${clean(item.visual)}`, { x: 1.08, y: 6.39, w: 11.05, h: 0.22, fontSize: 10, color: blue, italic: true, fit: "shrink", margin: 0 });
      }
      addWatermark(slide);
      slide.addText(`${i + 1} / ${slides.length}`, { x: 0.65, y: 7.12, w: 0.6, h: 0.18, fontSize: 8, color: "8BA2B7", margin: 0 });
    }

    if (uploaded.length) {
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };
      slide.addText("Your uploaded images", { x: 0.65, y: 0.55, w: 11.9, h: 0.7, fontSize: 25, bold: true, color: navy });
      const positions = [
        { x: 0.8, y: 1.55, w: 5.6, h: 2.35 },
        { x: 6.9, y: 1.55, w: 5.6, h: 2.35 },
        { x: 0.8, y: 4.25, w: 5.6, h: 2.35 },
        { x: 6.9, y: 4.25, w: 5.6, h: 2.35 }
      ];
      uploaded.slice(0, 4).forEach((img, idx) => {
        const pos = positions[idx];
        slide.addImage({ data: `data:${img.type};base64,${img.data}`, ...pos });
        slide.addText(img.name.slice(0, 55), { x: pos.x, y: pos.y + pos.h + 0.05, w: pos.w, h: 0.22, fontSize: 8, color: "60788D", fit: "shrink" });
      });
      addWatermark(slide);
    }

    const output = await pptx.write({ outputType: "nodebuffer" });
    const buffer = Buffer.isBuffer(output) ? output : Buffer.from(output as ArrayBuffer);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="Faizan-AI-Presentation.pptx"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    console.error("PowerPoint generation failed:", error);
    return NextResponse.json({ error: "Could not create the PowerPoint. Check the topic and uploaded files, then try again." }, { status: 500 });
  }
}
