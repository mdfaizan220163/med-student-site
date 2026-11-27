import "server-only";

type YandexItem = {
  name?: string;
  path?: string;
  type?: "file" | "dir";
  mime_type?: string;
  size?: number;
  _embedded?: { items?: YandexItem[] };
};
export type MedicalSource = { title: string; pages: number[]; excerpt: string };
const API = "https://cloud-api.yandex.net/v1/disk";

function words(value: string) {
  return [...new Set((value.toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) || [])
    .filter((w) => !["the", "and", "for", "with", "from", "what", "how", "why", "explain"].includes(w)))];
}
function score(text: string, terms: string[]) {
  const lower = text.toLowerCase();
  return terms.reduce((n, term) => n + (lower.includes(term) ? 1 + Math.min(3, (lower.match(new RegExp(term, "g")) || []).length - 1) : 0), 0);
}
async function yandexJson(url: URL) {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), cache: "no-store" });
  if (!response.ok) throw new Error(`Yandex Disk returned ${response.status}`);
  return response.json();
}
async function listFiles(publicUrl: string): Promise<YandexItem[]> {
  const found: YandexItem[] = [];
  const visit = async (path?: string, depth = 0): Promise<void> => {
    if (depth > 3 || found.length >= 180) return;
    const url = new URL(`${API}/public/resources`);
    url.searchParams.set("public_key", publicUrl);
    url.searchParams.set("limit", "100");
    if (path) url.searchParams.set("path", path);
    const data = await yandexJson(url);
    const items: YandexItem[] = data?._embedded?.items || [];
    for (const item of items) {
      if (item.type === "dir") {
        const child = item.path && item.path !== "/" ? item.path : [path, item.name].filter(Boolean).join("/");
        await visit(child.startsWith("/") ? child : `/${child}`, depth + 1);
      } else if (item.type === "file") found.push(item);
    }
  };
  await visit();
  return found;
}
async function downloadPublicFile(publicUrl: string, path: string) {
  const url = new URL(`${API}/public/resources/download`);
  url.searchParams.set("public_key", publicUrl);
  url.searchParams.set("path", path);
  const link = await yandexJson(url);
  const response = await fetch(link.href, { signal: AbortSignal.timeout(25000), cache: "no-store" });
  if (!response.ok) throw new Error("Could not download a reference document.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 22 * 1024 * 1024) throw new Error("Reference file is larger than the safe processing limit.");
  return bytes;
}
async function extractPdf(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdf = await pdfjs.getDocument({ data: bytes, useSystemFonts: true, isEvalSupported: false }).promise;
  const pages: { page: number; text: string }[] = [];
  for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 500); pageNo++) {
    const page = await pdf.getPage(pageNo);
    const data = await page.getTextContent();
    const text = data.items.map((item: { str?: string }) => item.str || "").join(" ").replace(/\s+/g, " ").trim();
    if (text) pages.push({ page: pageNo, text });
  }
  await pdf.destroy();
  return pages;
}
async function extractDocx(bytes: Uint8Array) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return result.value.replace(/\s+/g, " ").trim();
}

export async function retrieveMedicalContext(question: string): Promise<{ context: string; sources: MedicalSource[]; status: "found" | "empty" | "unavailable" }> {
  const publicUrl = process.env.YANDEX_DISK_PUBLIC_URL;
  if (!publicUrl) return { context: "", sources: [], status: "unavailable" };
  try {
    const files = await listFiles(publicUrl);
    const supported = files.filter((f) => /\.(pdf|docx)$/i.test(f.name || "") && f.path && (f.size || 0) <= 22 * 1024 * 1024);
    const terms = words(question);
    const ranked = supported.map((file) => ({
      file,
      priority: /robbins.*cotran|cotran.*robbins/i.test(file.name || "") ? 100 : 0,
      relevance: score(file.name || "", terms),
    })).sort((a, b) => (b.priority + b.relevance) - (a.priority + a.relevance)).slice(0, 4);
    const sections: string[] = [];
    const sources: MedicalSource[] = [];
    for (const { file } of ranked) {
      try {
        const bytes = await downloadPublicFile(publicUrl, file.path!);
        if (/\.pdf$/i.test(file.name || "")) {
          const pages = await extractPdf(bytes);
          const matches = pages.map((p) => ({ ...p, relevance: score(p.text, terms) }))
            .filter((p) => p.relevance > 0).sort((a, b) => b.relevance - a.relevance).slice(0, 4);
          if (!matches.length) continue;
          const selected = matches.sort((a, b) => a.page - b.page);
          sources.push({ title: file.name || "Medical PDF", pages: selected.map((p) => p.page), excerpt: selected.map((p) => p.text.slice(0, 1800)).join("\n") });
          sections.push(`SOURCE: ${file.name}\n${selected.map((p) => `PAGE ${p.page}: ${p.text.slice(0, 1800)}`).join("\n\n")}`);
        } else {
          const text = await extractDocx(bytes);
          if (score(text, terms) === 0) continue;
          const excerpt = text.slice(0, 6500);
          sources.push({ title: file.name || "Medical DOCX", pages: [], excerpt: excerpt.slice(0, 1200) });
          sections.push(`SOURCE: ${file.name} (DOCX page numbers unavailable)\n${excerpt}`);
        }
      } catch (error) {
        console.error("Faizan AI library file:", file.name, error);
      }
    }
    if (!sections.length) return { context: "", sources: [], status: "empty" };
    return { context: sections.join("\n\n---\n\n").slice(0, 18000), sources, status: "found" };
  } catch (error) {
    console.error("Faizan AI Yandex library:", error);
    return { context: "", sources: [], status: "unavailable" };
  }
}
