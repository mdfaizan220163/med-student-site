import JSZip from "jszip";

export type PptxValidationReport = {
  slides: Array<{
    slide: number;
    imageCount: number;
    missingImages: boolean;
    duplicateBlocks: string[];
    text: string;
  }>;
  nearDuplicates: Array<{ slideA: number; slideB: number; similarity: number }>;
};

const P_NS = "http://schemas.openxmlformats.org/presentationml/2006/main";
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";

function normalize(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function similarity(a: string, b: string) {
  const left = new Set(normalize(a).split(" ").filter(Boolean));
  const right = new Set(normalize(b).split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const word of left) if (right.has(word)) common++;
  return common / (left.size + right.size - common);
}

export async function validatePptx(file: File): Promise<PptxValidationReport> {
  const zip = await JSZip.loadAsync(file);
  const paths = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1]));

  const slides: PptxValidationReport["slides"] = [];
  for (const path of paths) {
    const slide = Number(path.match(/slide(\d+)/)?.[1]);
    const xml = new DOMParser().parseFromString(await zip.file(path)!.async("text"), "application/xml");
    if (xml.querySelector("parsererror")) throw new Error(`Slide ${slide} has malformed XML.`);

    const pictures = xml.getElementsByTagNameNS(P_NS, "pic");
    const shapes = Array.from(xml.getElementsByTagNameNS(P_NS, "sp"));
    const seen = new Set<string>();
    const duplicateBlocks: string[] = [];
    const blocks: string[] = [];

    for (const shape of shapes) {
      const text = Array.from(shape.getElementsByTagNameNS(A_NS, "t"))
        .map((node) => node.textContent || "").join(" ").replace(/\s+/g, " ").trim();
      if (!text) continue;
      blocks.push(text);
      const key = normalize(text);
      if (key && seen.has(key)) duplicateBlocks.push(text);
      seen.add(key);
    }

    slides.push({
      slide,
      imageCount: pictures.length,
      missingImages: pictures.length === 0,
      duplicateBlocks: [...new Set(duplicateBlocks)],
      text: blocks.join(" ")
    });
  }

  const nearDuplicates: PptxValidationReport["nearDuplicates"] = [];
  for (let i = 0; i < slides.length; i++) {
    for (let j = i + 1; j < slides.length; j++) {
      const score = similarity(slides[i].text, slides[j].text);
      if (score >= 0.72) nearDuplicates.push({
        slideA: slides[i].slide, slideB: slides[j].slide,
        similarity: Number(score.toFixed(3))
      });
    }
  }
  return { slides, nearDuplicates };
}
