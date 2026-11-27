export type YandexDocumentPart = {
  type: "document";
  name: string;
  mime: "application/pdf";
  data: string;
};

export type YandexLibraryImage = {
  name: string;
  data: string;
  mime: "image/jpeg" | "image/png" | "image/webp";
  score: number;
};

type DiskItem = {
  name?: string;
  path?: string;
  type?: string;
  mime_type?: string;
  size?: number;
  file?: string;
  md5?: string;
  _embedded?: { items?: DiskItem[]; total?: number };
};

const API = "https://cloud-api.yandex.net/v1/disk";
const MAX_LIBRARY_ITEMS = 180;
const MAX_PDF_BYTES = 18 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function tokens(value: string): string[] {
  return Array.from(new Set(
    value.toLowerCase().normalize("NFKD")
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !["the", "and", "for", "with", "from", "into", "about", "medical", "lecture", "notes"].includes(word))
  ));
}

export function rankLibraryImage(images: YandexLibraryImage[], query: string, used: Set<string>): YandexLibraryImage | null {
  const wanted = tokens(query);
  const available = images.filter((image) => !used.has(image.name.toLowerCase()));
  if (!available.length) return null;
  const ranked = available.map((image) => {
    const words = tokens(image.name);
    const overlap = wanted.filter((word) => words.includes(word)).length;
    const score = overlap * 4 + image.score;
    return { image, score };
  }).sort((a, b) => b.score - a.score);
  return ranked[0]?.image ?? null;
}

async function readJson(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "FaizanAI-Medical-Library/1.0" },
    signal: AbortSignal.timeout(12000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Yandex Disk API returned HTTP ${response.status}`);
  return response.json();
}

function makeApiUrl(endpoint: string, publicKey: string, path?: string, offset = 0): string {
  const params = new URLSearchParams({ public_key: publicKey, limit: "1000", offset: String(offset) });
  if (path) params.set("path", path);
  return `${API}/public/resources${endpoint}?${params.toString()}`;
}

async function listLibraryItems(publicKey: string): Promise<DiskItem[]> {
  const collected: DiskItem[] = [];
  const visited = new Set<string>();
  async function walk(path: string | undefined, depth: number): Promise<void> {
    if (collected.length >= MAX_LIBRARY_ITEMS || depth > 4) return;
    const key = path || "/";
    if (visited.has(key)) return;
    visited.add(key);
    let offset = 0;
    while (collected.length < MAX_LIBRARY_ITEMS) {
      const meta = await readJson(makeApiUrl("", publicKey, path, offset));
      const items: DiskItem[] = meta?._embedded?.items ?? [];
      if (!items.length) break;
      for (const item of items) {
        if (item.type === "dir") {
          const childPath = item.path || (path ? `${path.replace(/\/$/, "")}/${item.name || ""}` : `/${item.name || ""}`);
          await walk(childPath, depth + 1);
        } else if (item.type === "file") {
          collected.push(item);
          if (collected.length >= MAX_LIBRARY_ITEMS) break;
        }
      }
      offset += items.length;
      if (items.length < 1000 || offset >= Number(meta?._embedded?.total || 0)) break;
    }
  }
  await walk(undefined, 0);
  return collected;
}

async function downloadItem(publicKey: string, item: DiskItem, maxBytes: number): Promise<Buffer | null> {
  if (typeof item.size === "number" && (item.size <= 0 || item.size > maxBytes)) return null;
  let href = item.file;
  if (!href) {
    const url = makeApiUrl("/download", publicKey, item.path);
    const link = await readJson(url);
    href = link?.href;
  }
  if (typeof href !== "string" || !/^https:\/\//i.test(href)) return null;
  const response = await fetch(href, {
    headers: { "User-Agent": "FaizanAI-Medical-Library/1.0" },
    signal: AbortSignal.timeout(18000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > maxBytes) return null;
  return bytes;
}

export async function getYandexMedicalMaterials(query: string): Promise<{
  documents: YandexDocumentPart[];
  images: YandexLibraryImage[];
  itemCount: number;
}> {
  const publicKey = process.env.YANDEX_DISK_PUBLIC_URL?.trim();
  if (!publicKey) return { documents: [], images: [], itemCount: 0 };

  try {
    const items = await listLibraryItems(publicKey);
    const wanted = tokens(query);
    const score = (name: string) => {
      const words = tokens(name);
      return wanted.filter((word) => words.includes(word)).length * 4;
    };
    const pdfs = items
      .filter((item) => /\.pdf$/i.test(item.name || "") && (!item.size || item.size <= MAX_PDF_BYTES))
      .map((item) => ({ item, score: score(item.name || "") }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);
    const imageItems = items
      .filter((item) => /\.(jpe?g|png|webp)$/i.test(item.name || "") && (!item.size || item.size <= MAX_IMAGE_BYTES))
      .map((item) => ({ item, score: score(item.name || "") }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 16);

    const documents: YandexDocumentPart[] = [];
    for (const { item } of pdfs) {
      try {
        const bytes = await downloadItem(publicKey, item, MAX_PDF_BYTES);
        if (bytes) documents.push({
          type: "document",
          name: item.name || "Yandex medical reference.pdf",
          mime: "application/pdf",
          data: bytes.toString("base64"),
        });
      } catch (error) {
        console.warn("[Faizan AI] Could not read a Yandex PDF", item.name, error);
      }
    }

    const images: YandexLibraryImage[] = [];
    const seen = new Set<string>();
    for (const { item, score: relevance } of imageItems) {
      const identity = (item.md5 || item.name || "").toLowerCase();
      if (!identity || seen.has(identity)) continue;
      seen.add(identity);
      try {
        const bytes = await downloadItem(publicKey, item, MAX_IMAGE_BYTES);
        if (!bytes) continue;
        const extension = (item.name || "").toLowerCase().split(".").pop();
        const mime = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
        images.push({ name: item.name || "Yandex medical image", data: bytes.toString("base64"), mime, score: relevance });
      } catch (error) {
        console.warn("[Faizan AI] Could not read a Yandex image", item.name, error);
      }
    }
    return { documents, images, itemCount: items.length };
  } catch (error) {
    console.warn("[Faizan AI] Yandex medical library is not reachable", error);
    return { documents: [], images: [], itemCount: 0 };
  }
}
