import { useEffect } from "react";

type ConfirmDeleteModalProps = {
  isOpen: boolean;
  title?: string;
  description?: string;
  notice?: string;
  confirmLabel?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const ConfirmDeleteModal = ({
  isOpen,
  title = "Delete Chat History?",
  description = "Are you sure you want to delete all chat history in this notebook? This action cannot be undone and your conversation history cannot be recovered.",
  notice = "Uploaded study documents and notes will remain intact.",
  confirmLabel = "Delete Chat History",
  isDeleting = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div
        className="modal-container modal-container--sm confirm-delete-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="confirm-delete-modal__header-content">
            <div className="confirm-delete-modal__icon-badge" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h2 id="confirm-delete-title" className="modal-title">
                {title}
              </h2>
              <p className="modal-subtitle">
                Permanent deletion confirmation
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="modal-body">
          <div className="confirm-delete-modal__content">
            <p className="confirm-delete-modal__description">
              {description}
            </p>
            {notice && (
              <div className="confirm-delete-modal__notice">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>{notice}</span>
              </div>
            )}
          </div>
        </div>

        <footer className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn--secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="modal-btn modal-btn--danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <span className="confirm-delete-modal__loading">
                <span className="modal-spinner" aria-hidden="true" />
                Deleting...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
