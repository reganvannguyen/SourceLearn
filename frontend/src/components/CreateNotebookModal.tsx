import { useEffect, useRef, useState, type FormEvent } from "react";

export const NOTEBOOK_COLORS = [
  { label: "Purple", value: "#aa3bff" },
  { label: "Ocean Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Orange", value: "#f97316" },
  { label: "Crimson", value: "#ef4444" },
  { label: "Rose", value: "#ec4899" },
];

type CreateNotebookModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => Promise<void>;
};

const CreateNotebookModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateNotebookModalProps) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTEBOOK_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setSelectedColor(NOTEBOOK_COLORS[0].value);
      setError(null);
      setIsSubmitting(false);

      // Focus input on open
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmed, selectedColor);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create notebook.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-notebook-title"
      >
        <header className="modal-header">
          <h2 id="create-notebook-title">Create New Notebook</h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Live Preview */}
            <div className="notebook-preview">
              <span className="notebook-preview__label">Preview</span>
              <div className="notebook-card notebook-card--preview">
                <div
                  className="notebook-card__icon"
                  style={{
                    backgroundColor: `${selectedColor}22`,
                    color: selectedColor,
                  }}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" />
                    <path d="M6 10h10" />
                  </svg>
                </div>
                <div className="notebook-card__content">
                  <h3 className="notebook-card__title">
                    {name.trim() || "Untitled Notebook"}
                  </h3>
                  <span className="notebook-card__date">Today</span>
                </div>
              </div>
            </div>

            {/* Notebook Name */}
            <div className="modal-field">
              <label htmlFor="notebook-name-input" className="modal-label">
                Notebook Name
              </label>
              <input
                ref={inputRef}
                id="notebook-name-input"
                type="text"
                className="modal-input"
                placeholder="e.g. Operating Systems, Chemistry 101"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                maxLength={60}
              />
            </div>

            {/* Color Swatches */}
            <div className="modal-field">
              <label className="modal-label">Choose a Color</label>
              <div className="color-swatches" role="radiogroup" aria-label="Notebook color">
                {NOTEBOOK_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    className={`color-swatch ${selectedColor === c.value ? "color-swatch--selected" : ""}`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setSelectedColor(c.value)}
                    title={c.label}
                    aria-label={c.label}
                    aria-checked={selectedColor === c.value}
                    role="radio"
                  />
                ))}
              </div>
            </div>

            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
          </div>

          <footer className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={!name.trim() || isSubmitting}
            >
              {isSubmitting ? "Creating…" : "Create Notebook"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default CreateNotebookModal;
