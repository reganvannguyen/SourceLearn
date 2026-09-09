import { useEffect, useState } from "react";
import { getDocumentFileUrl, type DocumentResponse } from "../api/documents";

type PdfViewerPaneProps = {
  document: DocumentResponse;
  initialPage?: number;
  citedSnippet?: string;
  highlightColor?: string;
  onClose: () => void;
};

export const PdfViewerPane = ({
  document,
  initialPage,
  citedSnippet,
  highlightColor,
  onClose,
}: PdfViewerPaneProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showExcerpt, setShowExcerpt] = useState(Boolean(citedSnippet));

  useEffect(() => {
    setIsLoading(true);
    setShowExcerpt(Boolean(citedSnippet));
  }, [document.document_id, initialPage, citedSnippet]);

  const rawUrl = getDocumentFileUrl(
    document.document_id,
    initialPage,
    citedSnippet,
    highlightColor,
  );
  const embeddedParams = [
    initialPage ? `page=${initialPage}` : null,
    "view=FitH",
    "toolbar=0",
    "navpanes=0",
  ]
    .filter(Boolean)
    .join("&");
  const fileUrlWithHash = `${rawUrl}#${embeddedParams}`;
  const externalTabUrl = initialPage ? `${rawUrl}#page=${initialPage}` : rawUrl;

  return (
    <div className="pdf-pane" aria-label={`PDF Viewer: ${document.file_name}`}>
      <header className="pdf-pane__header">
        <div className="pdf-pane__header-info">
          <span className="pdf-pane__badge">Document</span>
          {initialPage && (
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
              Page {initialPage}
            </span>
          )}
          <h3 className="pdf-pane__title" title={document.file_name}>
            {document.file_name}
          </h3>
        </div>

        <div className="pdf-pane__header-actions">
          {citedSnippet && (
            <button
              type="button"
              className={`pdf-pane__excerpt-toggle ${showExcerpt ? "active" : ""}`}
              onClick={() => setShowExcerpt((prev) => !prev)}
              title="Toggle cited excerpt preview"
            >
              {showExcerpt ? "Hide Quote" : "Show Quote"}
            </button>
          )}

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
          <p className="pdf-pane__excerpt-body">"{citedSnippet}"</p>
        </aside>
      )}

      <div className="pdf-pane__body">
        {isLoading && (
          <div className="pdf-pane__loading">
            <div className="pdf-modal-spinner" />
            <span>Loading document…</span>
          </div>
        )}
        <iframe
          key={fileUrlWithHash}
          src={fileUrlWithHash}
          title={document.file_name}
          className="pdf-pane__frame"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default PdfViewerPane;
