import { useEffect, useRef, useState } from "react";
import { getDocumentFileUrl, type DocumentResponse } from "../api/documents";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

type PdfViewerPaneProps = {
  document: DocumentResponse;
  initialPage?: number;
  citedSnippet?: string;
  highlightColor?: string;
  onClose: () => void;
};

interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

interface PdfPageCanvasProps {
  pdf: any;
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
}

const PdfPageCanvas = ({
  pdf,
  pageNumber,
  width,
  height,
  scale,
}: PdfPageCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !pdf) return;

      try {
        const page = await pdf.getPage(pageNumber);
        if (isCancelled) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Cancel previous task if one is already running
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {
            // Ignore cancellation exceptions
          }
        }

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        renderTaskRef.current = renderTask;
        await renderTask.promise;

        if (!isCancelled) {
          setIsRendered(true);
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering PDF page ${pageNumber}:`, err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Ignore cancellation exceptions
        }
      }
    };
  }, [pdf, pageNumber, scale]);

  return (
    <div
      className="pdf-page-canvas-container"
      style={{ width: `${width}px`, minHeight: `${height}px`, position: "relative" }}
    >
      {!isRendered && (
        <div className="pdf-page-skeleton" style={{ width: `${width}px`, height: `${height}px` }} />
      )}
      <canvas
        ref={canvasRef}
        className="pdf-page-canvas"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: isRendered ? "block" : "none",
        }}
      />
    </div>
  );
};

export const PdfViewerPane = ({
  document: documentItem,
  initialPage,
  citedSnippet,
  highlightColor,
  onClose,
}: PdfViewerPaneProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showExcerpt, setShowExcerpt] = useState(Boolean(citedSnippet));

  useEffect(() => {
    if (citedSnippet) {
      setShowExcerpt(true);
    }
  }, [citedSnippet]);
  const [activePage, setActivePage] = useState<number>(initialPage || 1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const [pagesList, setPagesList] = useState<RenderedPage[]>([]);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  const viewportRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const isMountedRef = useRef(true);

  const rawUrl = getDocumentFileUrl(
    documentItem.document_id,
    initialPage,
    citedSnippet,
    highlightColor,
  );
  const externalTabUrl = initialPage ? `${rawUrl}#page=${initialPage}` : rawUrl;

  // Ensure PDF.js is loaded
  const ensurePdfJs = async (): Promise<any> => {
    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }

    return new Promise((resolve, reject) => {
      const existing = window.document.getElementById("pdfjs-cdn-script");
      if (existing) {
        existing.addEventListener("load", () => resolve(window.pdfjsLib));
        existing.addEventListener("error", reject);
        return;
      }

      const script = window.document.createElement("script");
      script.id = "pdfjs-cdn-script";
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.onload = () => resolve(window.pdfjsLib);
      script.onerror = reject;
      window.document.head.appendChild(script);
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    setShowExcerpt(Boolean(citedSnippet));
    setActivePage(initialPage || 1);
    setPagesList([]);
    setPdfDoc(null);

    let isCancelled = false;

    const loadDocument = async () => {
      try {
        const pdfjs = await ensurePdfJs();
        if (!pdfjs) throw new Error("PDF.js unavailable");

        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

        const loadingTask = pdfjs.getDocument({
          url: rawUrl,
          cMapUrl: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (isCancelled || !isMountedRef.current) return;

        setPdfDoc(pdf);
        const count = pdf.numPages;
        setTotalPages(count);

        // Compute layout dimensions for all pages
        const pages: RenderedPage[] = [];
        const containerWidth = viewportRef.current
          ? Math.max(320, viewportRef.current.clientWidth - 28)
          : 620;

        for (let i = 1; i <= count; i++) {
          const page = await pdf.getPage(i);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const targetWidth = Math.min(containerWidth, unscaledViewport.width * 1.5);
          const scale = targetWidth / unscaledViewport.width;
          const viewport = page.getViewport({ scale });

          pages.push({
            pageNumber: i,
            width: Math.floor(viewport.width),
            height: Math.floor(viewport.height),
            scale,
          });
        }

        if (isCancelled || !isMountedRef.current) return;
        setPagesList(pages);
        setIsLoading(false);
      } catch (err) {
        console.warn("PDF.js load failed, falling back to native iframe:", err);
        if (!isCancelled && isMountedRef.current) {
          setUseIframeFallback(true);
          setIsLoading(false);
        }
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
      isMountedRef.current = false;
    };
  }, [documentItem.document_id, initialPage, citedSnippet, highlightColor]);

  // Scroll to initial page when loaded
  useEffect(() => {
    if (pagesList.length === 0 || !initialPage || initialPage <= 1) return;

    const timer = setTimeout(() => {
      const targetEl = pageRefs.current[initialPage];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [pagesList, initialPage]);

  // Track currently visible page on scroll
  useEffect(() => {
    if (pagesList.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute("data-page"));
            if (pageNum) setActivePage(pageNum);
          }
        }
      },
      {
        root: viewportRef.current,
        threshold: 0.35,
      },
    );

    Object.values(pageRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [pagesList]);

  return (
    <div className="pdf-pane" aria-label={`PDF Viewer: ${documentItem.file_name}`}>
      <div className="pdf-scroll-viewport" ref={viewportRef}>
        {/* Header sits naturally at the top of the scroll container:
            scrolling down causes it to disappear with the document;
            scrolling back to top brings it back into view. */}
        <header className="pdf-pane__header">
          <div className="pdf-pane__header-info">
            <span className="pdf-pane__badge">Document</span>
            {totalPages > 0 && (
              <span className="pdf-pane__page-badge">
                <svg
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="22" y1="12" x2="18" y2="12" />
                  <line x1="6" y1="12" x2="2" y2="12" />
                  <line x1="12" y1="6" x2="12" y2="2" />
                  <line x1="12" y1="22" x2="12" y2="18" />
                </svg>
                Page {activePage} of {totalPages}
              </span>
            )}
            <h3 className="pdf-pane__title" title={documentItem.file_name}>
              {documentItem.file_name}
            </h3>
          </div>

          <div className="pdf-pane__header-actions">
            <a
              href={externalTabUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-pane__action-btn"
              title="Open in new browser tab"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Tab
            </a>

            <button
              type="button"
              className="pdf-pane__close-btn"
              onClick={onClose}
              aria-label="Close PDF Viewer"
              title="Close viewer"
            >
              ✕
            </button>
          </div>
        </header>

        {citedSnippet && showExcerpt && (
          <aside className="pdf-pane__excerpt-banner" aria-label="Cited excerpt">
            <div className="pdf-pane__excerpt-header">
              <div className="pdf-pane__excerpt-title-group">
                <span className="pdf-pane__excerpt-icon">
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                <span className="pdf-pane__excerpt-title">
                  Cited Source Quote (Page {initialPage || 1})
                </span>
              </div>
              <button
                type="button"
                className="pdf-pane__excerpt-close-btn"
                onClick={() => setShowExcerpt(false)}
                title="Dismiss cited quote"
                aria-label="Dismiss cited quote"
              >
                ✕
              </button>
            </div>
            <p className="pdf-pane__excerpt-body">"{citedSnippet}"</p>
          </aside>
        )}

        {isLoading && (
          <div className="pdf-pane__loading">
            <div className="pdf-modal-spinner" />
            <span>Loading document…</span>
          </div>
        )}

        {useIframeFallback ? (
          <div className="pdf-pane__body">
            <iframe
              src={`${rawUrl}#page=${initialPage || 1}&view=FitH&toolbar=0`}
              title={documentItem.file_name}
              className="pdf-pane__frame"
            />
          </div>
        ) : (
          <div className="pdf-pages-container">
            {pagesList.map((p) => (
              <div
                key={p.pageNumber}
                data-page={p.pageNumber}
                ref={(el) => {
                  pageRefs.current[p.pageNumber] = el;
                }}
                className="pdf-page-wrapper"
              >
                {pdfDoc && (
                  <PdfPageCanvas
                    pdf={pdfDoc}
                    pageNumber={p.pageNumber}
                    width={p.width}
                    height={p.height}
                    scale={p.scale}
                  />
                )}
                <div className="pdf-page-footer">
                  Page {p.pageNumber} of {totalPages}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewerPane;
