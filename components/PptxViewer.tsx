"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

export default function PptxViewer({ pdfUrl, downloadUrl }: {
  pdfUrl: string; downloadUrl?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof pdfjs.getDocument> | undefined;
    async function render() {
      setLoading(true); setError("");
      try {
        task = pdfjs.getDocument(pdfUrl);
        const pdf = await task.promise;
        if (cancelled) return;
        setPages(pdf.numPages);
        const pdfPage = await pdf.getPage(Math.min(page, pdf.numPages));
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context || cancelled) return;
        const base = pdfPage.getViewport({ scale: 1 });
        const width = Math.min(canvas.parentElement?.clientWidth || 1100, 1200);
        const ratio = Math.min(width / base.width, 2);
        const viewport = pdfPage.getViewport({ scale: ratio });
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        await pdfPage.render({
          canvas, canvasContext: context, viewport,
          transform: dpr === 1 ? undefined : [dpr, 0, 0, dpr, 0, 0]
        }).promise;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not display this presentation.");
      } finally { if (!cancelled) setLoading(false); }
    }
    render();
    return () => { cancelled = true; task?.destroy(); };
  }, [pdfUrl, page]);

  return <section className="mx-auto w-full max-w-[1200px]">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Slide {page} / {pages || "—"}</span>
        <button className="rounded-lg border px-3 py-2 disabled:opacity-40" disabled={!pages || page >= pages || loading} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
      {downloadUrl && <a className="rounded-lg bg-[#102b4e] px-4 py-2 text-sm font-semibold text-white" href={downloadUrl} download="Faizan-AI-Presentation.pptx">Download PPT</a>}
    </div>
    <div className="relative flex min-h-[320px] items-center justify-center overflow-auto rounded-2xl border bg-slate-100 p-2 shadow-lg">
      {loading && <div className="absolute z-10 rounded-xl bg-white px-5 py-4 text-sm shadow" role="status">⟳ Converting / loading presentation…</div>}
      {error ? <div role="alert" className="p-8 text-center text-sm text-red-700">{error}</div> : <canvas ref={canvasRef} className="max-w-full rounded bg-white shadow" />}
    </div>
  </section>;
}
