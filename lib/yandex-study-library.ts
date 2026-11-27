import { inflateRawSync, inflateSync } from "node:zlib";

const PUBLIC_DISK_URL = "https://disk.360.yandex.ru/d/WEEaqRiRnzgI9g";
const API = "https://cloud-api.yandex.net/v1/disk";

type DiskItem = { name?: string; path?: string; type?: string; mime_type?: string; size?: number };
type DiskPage = { _embedded?: { items?: DiskItem[]; total?: number; limit?: number; offset?: number } };

function unzipTextEntries(buffer: Buffer, matcher: RegExp): string[] {
  const output: string[] = [];
  let offset = 0;
  while (offset + 30 < buffer.length) {
    const sig = buffer.readUInt32LE(offset);
    if (sig !== 0x04034b50) { offset++; continue; }
    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const start = offset + 30 + nameLength + extraLength;
    const name = buffer.toString("utf8", offset + 30, offset + 30 + nameLength);
    const end = start + compressedSize;
    if (end > buffer.length) break;
    if (matcher.test(name) && (method === 0 || method === 8)) {
      try {
        const raw = buffer.subarray(start, end);
        const xml = (method === 8 ? inflateRawSync(raw) : raw).toString("utf8");
        output.push(xml.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " "));
      } catch { /* Skip malformed archive entry */ }
    }
    offset = end;
  }
  return output;
}

function extractPdfText(buffer: Buffer): string {
  const chunks: string[] = [];
  const source = buffer.toString("latin1");
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamPattern.exec(source))) {
    const start = match.index + match[0].indexOf(match[1]);
    const raw = buffer.subarray(start, start + Buffer.byteLength(match[1], "latin1"));
    let decoded = raw;
    const dict = source.slice(Math.max(0, match.index - 600), match.index);
    try {
      if (/FlateDecode/.test(dict)) decoded = inflateSync(raw);
    } catch { try { decoded = inflateRawSync(raw); } catch { continue; } }
    const text = decoded.toString("latin1");
    const tokens = /\(((?:\\.|[^\\)])*)\)\s*Tj|\[((?:[\s\S]*?))\]\s*TJ/g;
    let token: RegExpExecArray | null;
    while ((token = tokens.exec(text))) {
      const value = token[1] ?? token[2] ?? "";
      const strings = token[1] !== undefined ? [value] : [...value.matchAll(/\(((?:\\.|[^\\)])*)\)/g)].map(x => x[1]);
      for (const str of strings) chunks.push(str.replace(/\\([()\\])/g, "$1").replace(/\\n/g, " ").replace(/\\r/g, " "));
    }
  }
  return chunks.join(" ").replace(/\s+/g, " ").trim();
}

function extractText(name: string, mime: string, bytes: Buffer): string {
  const lower = name.toLowerCase();
  if (mime === "text/plain" || lower.endsWith(".txt") || lower.endsWith(".md")) return bytes.toString("utf8");
  if (mime === "application/pdf" || lower.endsWith(".pdf")) return extractPdfText(bytes);
  if (lower.endsWith(".docx") || lower.endsWith(".pptx") || lower.endsWith(".xlsx")) {
    const matcher = lower.endsWith(".docx") ? /word\/document\.xml$/ : lower.endsWith(".pptx") ? /ppt\/slides\/slide\d+\.xml$/ : /xl\/sharedStrings\.xml$/;
    return unzipTextEntries(bytes, matcher).join("\n");
  }
  return "";
}

export async function loadYandexStudyLibrary(): Promise<{ text: string; files: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const files: string[] = [];
  const sections: string[] = [];
  const key = process.env.YANDEX_DISK_PUBLIC_URL || PUBLIC_DISK_URL;
  const metaUrl = new URL(API + "/public/resources");
  metaUrl.searchParams.set("public_key", key);
  metaUrl.searchParams.set("limit", "100");
  const metaResponse = await fetch(metaUrl, { signal: AbortSignal.timeout(18000), headers: { Accept: "application/json" } });
  if (!metaResponse.ok) throw new Error("Yandex Disk study folder could not be accessed. Check that its public share link is still active and downloads are allowed.");
  const page = await metaResponse.json() as DiskPage;
  const items = (page._embedded?.items || []).filter(item => item.type === "file" && item.path);
  const supported = items.filter(item => /\.(pdf|docx|pptx|txt|md)$/i.test(item.name || ""));
  if (!supported.length) throw new Error("No supported PDF, DOCX, PPTX, TXT or Markdown study files were found in the Yandex Disk folder.");
  for (const item of supported.slice(0, 18)) {
    const name = String(item.name || "Study material");
    try {
      const downloadUrl = new URL(API + "/public/resources/download");
      downloadUrl.searchParams.set("public_key", key);
      downloadUrl.searchParams.set("path", String(item.path));
      const linkResponse = await fetch(downloadUrl, { signal: AbortSignal.timeout(15000) });
      if (!linkResponse.ok) { warnings.push(name + ": download link unavailable"); continue; }
      const link = await linkResponse.json() as { href?: string };
      if (!link.href) { warnings.push(name + ": no download URL"); continue; }
      const response = await fetch(link.href, { signal: AbortSignal.timeout(35000) });
      if (!response.ok) { warnings.push(name + ": download failed"); continue; }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!bytes.length || bytes.length > 18 * 1024 * 1024) { warnings.push(name + ": skipped (empty or larger than 18 MB)"); continue; }
      const text = extractText(name, String(item.mime_type || response.headers.get("content-type") || ""), bytes).slice(0, 24000);
      if (text.length < 80) { warnings.push(name + ": text could not be extracted; it may be scanned/image-only"); continue; }
      files.push(name);
      sections.push("SOURCE FILE: " + name + "\n" + text);
    } catch (error) {
      warnings.push(name + ": " + (error instanceof Error ? error.message : "read failed"));
    }
  }
  return { text: sections.join("\n\n").slice(0, 65000), files, warnings };
}
