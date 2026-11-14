"use client";

import { useEffect, useState } from "react";
import PptxViewer from "@/components/PptxViewer";
import { validatePptx, type PptxValidationReport } from "@/components/validatePptx";

export default function PresentationViewerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [pptUrl, setPptUrl] = useState("");
  const [report, setReport] = useState<PptxValidationReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    if (pptUrl) URL.revokeObjectURL(pptUrl);
  }, [pdfUrl, pptUrl]);

  async function inspectAndConvert(selected: File) {
    setBusy(true); setError(""); setReport(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    if (pptUrl) URL.revokeObjectURL(pptUrl);
    setPdfUrl(""); setPptUrl("");
    try {
      const validation = await validatePptx(selected);
      setReport(validation);
      console.group("PPTX validation report");
      console.table(validation.slides.map(s => ({
        slide: s.slide, images: s.imageCount, missingImages: s.missingImages,
        duplicateTextBlocks: s.duplicateBlocks.length
      })));
      console.table(validation.nearDuplicates);
      console.groupEnd();

      const form = new FormData();
      form.append("file", selected);
      const response = await fetch("/api/pptx/convert", { method: "POST", body: form });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || "PPTX to PDF conversion failed.");
      }
      const pdf = await response.blob();
      setPdfUrl(URL.createObjectURL(pdf));
      setPptUrl(URL.createObjectURL(selected));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process this presentation.");
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#f4f7fb] px-4 py-8">
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-[#102b4e]">PowerPoint viewer</h1>
      <p className="mb-6 mt-2 text-sm text-slate-600">Upload a PPTX to validate its slide content and view a LibreOffice-rendered PDF.</p>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
        <input type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={e => { const selected = e.target.files?.[0]; if (selected) { setFile(selected); void inspectAndConvert(selected); } }} />
        {busy && <span role="status" className="text-sm text-slate-600">Checking and converting…</span>}
        {file && <a href={URL.createObjectURL(file)} download={file.name} className="text-sm font-semibold text-blue-700">Download PPT</a>}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {report && <section className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <h2 className="font-bold text-[#102b4e]">Validation report</h2>
        <p className="mt-1 text-sm text-slate-600">{report.slides.length} slides · {report.slides.filter(s => s.missingImages).length} slides have no picture objects · {report.nearDuplicates.length} near-duplicate slide pairs</p>
        <div className="mt-3 max-h-48 overflow-auto text-xs">
          {report.slides.map(s => <p key={s.slide}>Slide {s.slide}: {s.imageCount} images; {s.duplicateBlocks.length} duplicate text blocks {s.missingImages ? "· no images" : ""}</p>)}
          {report.nearDuplicates.map(d => <p key={d.slideA + "-" + d.slideB}>Possible duplicate: slides {d.slideA} and {d.slideB} ({Math.round(d.similarity * 100)}%)</p>)}
        </div>
      </section>}
      {pdfUrl && <PptxViewer pdfUrl={pdfUrl} downloadUrl={pptUrl} />}
    </div>
  </main>;
}
