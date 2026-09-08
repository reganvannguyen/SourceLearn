import { useEffect, useRef, useState } from "react";
import type { Notebook } from "../api/notebooks";
import { HilroySwoosh } from "./HilroySwoosh";
import { NotebookIcon } from "./NotebookIcon";

type NotebookCardProps = {
  notebook: Notebook;
  onClick: () => void;
  onEdit?: (notebook: Notebook) => void;
};


const NotebookCard = ({ notebook, onClick, onEdit }: NotebookCardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const color = notebook.color || "#7eaed7";

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div
      className="notebook-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={
        {
          "--card-accent": color,
          backgroundColor: color,
        } as React.CSSProperties
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Full-Height Hilroy Swoosh */}
      <HilroySwoosh id={notebook.id} color={color} />

      {/* Top-Right 3-dots Menu */}
      <div
        className="notebook-card__menu-wrapper"
        ref={menuRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="notebook-card__menu-btn"
          aria-label="Card options"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((prev) => !prev);
          }}
        >
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
        </button>

        {menuOpen && (
          <div className="notebook-card__menu-dropdown" role="menu">
            <button
              type="button"
              className="notebook-card__menu-item"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onClick();
              }}
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
              Open Notebook
            </button>

            {onEdit && (
              <button
                type="button"
                className="notebook-card__menu-item"
                role="menuitem"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onEdit(notebook);
                }}
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
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Details
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hilroy Center Emblem (where the Canada map was on original) */}
      <div className="notebook-card__emblem">
        <NotebookIcon icon={notebook.icon || "book"} size={52} />
      </div>

      {/* Hilroy Exercise Booklet Cover Typography */}
      <div className="notebook-card__content">
        <h3 className="notebook-card__exercise-title" title={notebook.name}>
          {notebook.name}
        </h3>
      </div>
    </div>
  );
};

export default NotebookCard;
