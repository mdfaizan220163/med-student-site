import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;
const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export async function POST(request: NextRequest) {
  try {
    // Match the existing Presentation Studio's signed-in-user requirement.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please log in to view presentations." }, { status: 401 });

    const url = process.env.PPTX_CONVERTER_URL;
    const secret = process.env.CONVERTER_API_SECRET;
    if (!url || !secret) return NextResponse.json({ error: "PDF conversion is not configured." }, { status: 503 });

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pptx") || file.type !== PPTX_MIME) {
      return NextResponse.json({ error: "Upload a valid .pptx file." }, { status: 415 });
    }
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Maximum PPTX size is 50 MB." }, { status: 413 });

    const forward = new FormData();
    forward.append("file", file, "presentation.pptx");
    const response = await fetch(url, {
      method: "POST", headers: { Authorization: `Bearer ${secret}` },
      body: forward, cache: "no-store", signal: AbortSignal.timeout(125000)
    });
    if (!response.ok) return NextResponse.json({ error: "LibreOffice conversion failed." }, { status: 502 });
    const pdf = await response.arrayBuffer();
    if (new TextDecoder().decode(pdf.slice(0, 5)) !== "%PDF-") {
      return NextResponse.json({ error: "Converter returned an invalid PDF." }, { status: 502 });
    }
    return new NextResponse(pdf, { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="presentation.pdf"',
      "Cache-Control": "private, no-store"
    }});
  } catch (error) {
    console.error("PPTX conversion:", error);
    return NextResponse.json({ error: "Conversion failed or timed out." }, { status: 502 });
  }
}
