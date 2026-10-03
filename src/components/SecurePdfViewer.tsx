import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, 
  Maximize2, Lock, ShieldAlert, Loader2, BookOpen, AlertCircle
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface SecurePdfViewerProps {
  url: string;
  title?: string;
  watermarkText?: string;
}

export default function SecurePdfViewer({ 
  url, 
  title = "स्मृति-पत्र एवं नियमावली", 
  watermarkText = "MANAV SAMANTA SANGTHAN • VIEW ONLY" 
}: SecurePdfViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('all');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const allPagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    if (!url) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url,
      withCredentials: false
    });

    loadingTask.promise
      .then((loadedDoc: any) => {
        if (!isCancelled) {
          setPdfDoc(loadedDoc);
          setNumPages(loadedDoc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (!isCancelled) {
          console.warn("SecurePdfViewer notice:", err?.message || err);
          setError("दस्तावेज़ लोड करने में समस्या आई। कृपया पुनः प्रयास करें।");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
      try {
        loadingTask.destroy();
      } catch (e) {
        // ignore
      }
    };
  }, [url]);

  // Render single page when currentPage, scale, or pdfDoc changes
  useEffect(() => {
    if (!pdfDoc || viewMode !== 'single') return;

    let renderTask: any = null;
    let isCancelled = false;
    setRendering(true);

    pdfDoc.getPage(currentPage).then((page: any) => {
      if (isCancelled || !canvasRef.current) return;

      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      renderTask = page.render(renderContext);
      renderTask.promise.then(() => {
        if (!isCancelled && context) {
          // Draw diagonal security watermark
          drawWatermark(context, canvas.width, canvas.height, watermarkText);
          setRendering(false);
        }
      }).catch((err: any) => {
        if (!isCancelled && err?.name !== 'RenderingCancelledException') {
          console.error("Render error:", err);
        }
        setRendering(false);
      });
    });

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale, viewMode, watermarkText]);

  // Helper to draw watermark
  const drawWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number, text: string) => {
    ctx.save();
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = 'rgba(20, 80, 50, 0.08)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.rotate(-Math.PI / 6);

    for (let x = -width; x < width * 2; x += 320) {
      for (let y = -height; y < height * 2; y += 220) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  };

  // Render all pages for continuous reading
  useEffect(() => {
    if (!pdfDoc || viewMode !== 'all' || !allPagesContainerRef.current) return;

    let isCancelled = false;
    const container = allPagesContainerRef.current;
    container.innerHTML = ''; // clear previous

    async function renderAll() {
      setRendering(true);
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (isCancelled) break;

        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'relative mb-6 shadow-xl rounded-lg overflow-hidden bg-white border border-slate-300';
          pageWrapper.style.maxWidth = '100%';

          const pageNumberBadge = document.createElement('div');
          pageNumberBadge.className = 'absolute top-3 right-4 px-2.5 py-1 bg-slate-900/70 text-white text-[11px] font-bold rounded-md z-10 pointer-events-none select-none';
          pageNumberBadge.innerText = `पृष्ठ ${pageNum} / ${pdfDoc.numPages}`;

          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.className = 'w-full h-auto block select-none';

          pageWrapper.appendChild(pageNumberBadge);
          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);

          const context = canvas.getContext('2d');
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            drawWatermark(context, canvas.width, canvas.height, watermarkText);
          }
        } catch (e) {
          console.warn(`Error rendering page ${pageNum}:`, e);
        }
      }
      if (!isCancelled) setRendering(false);
    }

    renderAll();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, viewMode, scale, watermarkText]);

  return (
    <div 
      ref={containerRef}
      className="w-full flex flex-col items-center bg-slate-900/90 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Top Floating Security & Control Bar */}
      <div className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-white text-xs">
        {/* Left: Security Tag */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            <Lock className="w-3.5 h-3.5" /> सुरक्षित व्यूअर (View-Only)
          </span>
          <span className="hidden sm:inline text-slate-400 font-medium">
            {title} ({numPages ? `${numPages} पृष्ठ` : 'दस्तावेज़'})
          </span>
        </div>

        {/* Center: View Mode & Navigation Controls */}
        <div className="flex items-center gap-2 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setViewMode('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              viewMode === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            सभी पृष्ठ (Continuous)
          </button>
          <button
            onClick={() => setViewMode('single')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              viewMode === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            एक-एक पृष्ठ (Page-by-Page)
          </button>

          {viewMode === 'single' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage <= 1}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs font-bold text-amber-300 px-1">
                {currentPage} / {numPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, numPages))}
                disabled={currentPage >= numPages}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 px-2 py-1 rounded-xl border border-slate-700">
          <button
            onClick={() => setScale(prev => Math.max(prev - 0.2, 0.7))}
            className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-slate-300 min-w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(prev => Math.min(prev + 0.2, 2.5))}
            className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1.2)}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold px-1.5 py-0.5 rounded hover:bg-slate-700 ml-1"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Security Instruction Bar */}
      <div className="w-full bg-emerald-950/60 border-b border-emerald-900/60 px-4 py-2 text-center text-[11px] text-emerald-200/90 flex items-center justify-center gap-2">
        <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>यह दस्तावेज़ संगठन की संपत्ति है। यह केवल ऑनलाइन पढ़ने के लिए सुरक्षित किया गया है (डाउनलोड प्रतिबंधित है)।</span>
      </div>

      {/* Main Canvas Viewer Body */}
      <div className="w-full p-4 sm:p-8 flex flex-col items-center justify-center min-h-[500px] overflow-auto max-h-[85vh] bg-slate-950/60">
        {loading && (
          <div className="py-20 flex flex-col items-center text-center text-slate-300">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
            <p className="font-bold text-sm">दस्तावेज़ लोड हो रहा है...</p>
            <p className="text-xs text-slate-400 mt-1">Please wait while the official document is being rendered securely.</p>
          </div>
        )}

        {error && (
          <div className="p-8 max-w-md bg-rose-950/40 border border-rose-800 text-rose-200 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              पुनः प्रयास करें (Retry)
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {viewMode === 'single' ? (
              <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white border border-slate-300 max-w-full">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto block select-none pointer-events-auto"
                />
                {rendering && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
            ) : (
              <div 
                ref={allPagesContainerRef} 
                className="w-full flex flex-col items-center max-w-4xl"
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Footer Details */}
      <div className="w-full bg-slate-900 border-t border-slate-800 px-4 py-2.5 text-center text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>मानव समानता संगठन (रजि.) • अधिकृत स्मृति-पत्र</span>
        <span className="text-amber-400/90 font-medium">
          🔒 Protected HTML5 Canvas Reader • No Download Allowed
        </span>
      </div>
    </div>
  );
}
