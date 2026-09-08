import { useEffect, useState } from "react";
import { getDocumentFileUrl, type DocumentResponse } from "../api/documents";

type PdfViewerModalProps = {
  document: DocumentResponse | null;
  onClose: () => void;
};

const PdfViewerModal = ({ document, onClose }: PdfViewerModalProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (document) {
      setIsLoading(true);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [document, onClose]);

  if (!document) return null;

  const fileUrl = getDocumentFileUrl(document.document_id);

  return (
    <div
      className="pdf-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="pdf-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`PDF Viewer: ${document.file_name}`}
      >
        <header className="pdf-modal-header">
          <div className="pdf-modal-header__info">
            <span className="pdf-modal-header__badge">PDF Document</span>
            <h3 className="pdf-modal-header__title" title={document.file_name}>
              {document.file_name}
            </h3>
          </div>

          <div className="pdf-modal-header__actions">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-modal-action-btn"
              title="Open in new browser tab"
            >
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
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
              Open in Tab
            </a>

            <button
              type="button"
              className="pdf-modal-close-btn"
              onClick={onClose}
              aria-label="Close PDF Viewer"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="pdf-modal-body">
          {isLoading && (
            <div className="pdf-modal-loading">
              <div className="pdf-modal-spinner" />
              <span>Loading PDF document…</span>
            </div>
          )}
          <iframe
            src={fileUrl}
            title={document.file_name}
            className="pdf-viewer-frame"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfViewerModal;
