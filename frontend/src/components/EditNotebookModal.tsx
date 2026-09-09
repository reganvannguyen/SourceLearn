import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Notebook } from "../api/notebooks";
import { NOTEBOOK_COLORS } from "./CreateNotebookModal";
import { HilroySwoosh } from "./HilroySwoosh";
import { NOTEBOOK_ICONS, NotebookIcon } from "./NotebookIcon";

type EditNotebookModalProps = {
  notebook: Notebook | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, name: string, color: string, icon: string) => Promise<void>;
};

export const EditNotebookModal = ({
  notebook,
  isOpen,
  onClose,
  onSave,
}: EditNotebookModalProps) => {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(NOTEBOOK_COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState<string>("book");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && notebook) {
      setName(notebook.name);
      setSelectedColor(notebook.color || NOTEBOOK_COLORS[0].value);
      setSelectedIcon(notebook.icon || "book");
      setError(null);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen, notebook]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !notebook) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please provide a notebook name.");
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(notebook.id, trimmed, selectedColor, selectedIcon);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to update notebook."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-notebook-title"
    >
      <div
        className="modal-container modal-container--sm"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="edit-notebook-title" className="modal-title">
              Edit Notebook
            </h2>
            <p className="modal-subtitle">
              Update your notebook's title, cover color, and emblem icon.
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Live Preview */}
            <div className="notebook-preview">
              <span className="notebook-preview__label">Live Preview</span>
              <div
                className="notebook-card notebook-card--preview"
                style={
                  {
                    "--card-accent": selectedColor,
                    backgroundColor: selectedColor,
                  } as React.CSSProperties
                }
              >
                <HilroySwoosh id={`edit-${notebook.id}`} color={selectedColor} />
                <div className="notebook-card__menu-btn notebook-card__menu-btn--preview">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </div>

                {/* Hilroy Center Emblem in Preview */}
                <div className="notebook-card__emblem">
                  <NotebookIcon icon={selectedIcon} size={56} />
                </div>

                <div className="notebook-card__content">
                  <h3 className="notebook-card__exercise-title">
                    {name.trim() || notebook.name}
                  </h3>
                </div>
              </div>
            </div>

            {/* Notebook Name */}
            <div className="modal-field">
              <label htmlFor="edit-notebook-name-input" className="modal-label">
                Notebook Name
              </label>
              <input
                ref={inputRef}
                id="edit-notebook-name-input"
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
              <label className="modal-label">Choose a Cover Color</label>
              <div
                className="color-swatches"
                role="radiogroup"
                aria-label="Notebook color"
              >
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

            {/* Emblem Icon Selector */}
            <div className="modal-field">
              <label className="modal-label">Choose an Emblem Icon</label>
              <div className="modal-icon-grid" role="radiogroup" aria-label="Notebook emblem icon">
                {NOTEBOOK_ICONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`modal-icon-btn ${selectedIcon === item.id ? "modal-icon-btn--selected" : ""}`}
                    onClick={() => setSelectedIcon(item.id)}
                    title={item.label}
                    aria-label={item.label}
                    aria-checked={selectedIcon === item.id}
                    role="radio"
                  >
                    <NotebookIcon icon={item.id} size={20} />
                    <span className="modal-icon-btn__label">{item.label}</span>
                  </button>
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
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default EditNotebookModal;
