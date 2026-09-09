import { useEffect, useRef, useState } from "react";
import type { DocumentResponse } from "../api/documents";
import type { Notebook } from "../api/notebooks";
import { NotebookIcon } from "./NotebookIcon";

type StudySidebarProps = {
  notebook: Notebook;
  documents: DocumentResponse[];
  activeDocumentId?: number;
  isLoadingDocs: boolean;
  onAddMaterial: () => void;
  onBack?: () => void;
  onSelectDocument?: (doc: DocumentResponse) => void;
  onEditNotebook?: () => void;
  onDeleteChatHistory?: () => void;
  onDeleteDocument?: (doc: DocumentResponse) => void;
  onDeleteNotebook?: () => void;
};

const StudySidebar = ({
  notebook,
  documents,
  activeDocumentId,
  isLoadingDocs,
  onAddMaterial,
  onBack,
  onSelectDocument,
  onEditNotebook,
  onDeleteChatHistory,
  onDeleteDocument,
  onDeleteNotebook,
}: StudySidebarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeDocMenuId, setActiveDocMenuId] = useState<number | null>(null);
  const docMenuRef = useRef<HTMLDivElement>(null);
  const color = notebook.color || "#7eaed7";

  useEffect(() => {
    if (activeDocMenuId === null) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (docMenuRef.current && !docMenuRef.current.contains(e.target as Node)) {
        setActiveDocMenuId(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveDocMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeDocMenuId]);

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
    <aside
      className="study-sidebar"
      style={{ "--notebook-color": color } as React.CSSProperties}
      aria-label="Study notebook sidebar"
    >
      {/* Top Navigation */}
      <div className="study-sidebar__top">
        {onBack && (
          <button
            type="button"
            className="study-sidebar__back-btn"
            onClick={onBack}
            aria-label="Back to all notebooks"
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
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            All Notebooks
          </button>
        )}

        <div className="study-sidebar__notebook-info">
          <div
            className="study-sidebar__notebook-icon"
            style={{
              backgroundColor: `${color}20`,
              color: color,
            }}
            aria-hidden="true"
          >
            <NotebookIcon icon={notebook.icon || "book"} size={20} />
          </div>
          <div className="study-sidebar__notebook-text">
            <span className="study-sidebar__badge">Notebook</span>
            <h2 className="study-sidebar__title" title={notebook.name}>
              {notebook.name}
            </h2>
          </div>
          {(onEditNotebook || onDeleteChatHistory || onDeleteNotebook) && (
            <div className="study-sidebar__menu-wrapper" ref={menuRef}>
              <button
                type="button"
                className="study-sidebar__menu-btn"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Notebook options"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                title="Notebook options"
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
                <div className="study-sidebar__menu-dropdown" role="menu">
                  {onEditNotebook && (
                    <button
                      type="button"
                      className="study-sidebar__menu-item"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onEditNotebook();
                      }}
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
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit Details
                    </button>
                  )}
                  {onDeleteChatHistory && (
                    <button
                      type="button"
                      className="study-sidebar__menu-item study-sidebar__menu-item--danger"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteChatHistory();
                      }}
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
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Delete Chat History
                    </button>
                  )}
                  {onDeleteNotebook && (
                    <button
                      type="button"
                      className="study-sidebar__menu-item study-sidebar__menu-item--danger"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteNotebook();
                      }}
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
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                      Delete Notebook
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Materials Section */}
      <div className="study-sidebar__materials-section">
        <div className="study-sidebar__materials-header">
          <div className="study-sidebar__materials-title-group">
            <h3>Sources</h3>
            <span className="study-sidebar__count">{documents.length}</span>
          </div>

          <button
            type="button"
            className="study-sidebar__add-icon-btn"
            onClick={onAddMaterial}
            title="Add study material"
            aria-label="Add study material"
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div className="study-sidebar__doc-list" role="list">
          {isLoadingDocs ? (
            <div className="study-sidebar__loading">Loading sources…</div>
          ) : documents.length === 0 ? (
            <div className="study-sidebar__empty">
              <p>No study materials yet.</p>
              <span>Upload a PDF to ask questions and get citations.</span>
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = activeDocumentId === doc.document_id;
              return (
                <div
                  key={doc.document_id}
                  className={`study-sidebar__doc-item study-sidebar__doc-item--clickable ${
                    isSelected ? "study-sidebar__doc-item--selected" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectDocument?.(doc)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectDocument?.(doc);
                    }
                  }}
                  title={
                    isSelected
                      ? `Click to close ${doc.file_name}`
                      : `Click to view ${doc.file_name}`
                  }
                >
                <div className="study-sidebar__doc-icon" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <span className="study-sidebar__doc-name">{doc.file_name}</span>
                <div
                  className="study-sidebar__doc-menu-wrapper"
                  ref={activeDocMenuId === doc.document_id ? docMenuRef : undefined}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="study-sidebar__doc-menu-btn"
                    aria-label={`Options for ${doc.file_name}`}
                    aria-expanded={activeDocMenuId === doc.document_id}
                    aria-haspopup="true"
                    title="Document options"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocMenuId((prev) =>
                        prev === doc.document_id ? null : doc.document_id
                      );
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>

                  {activeDocMenuId === doc.document_id && (
                    <div className="study-sidebar__doc-menu-dropdown" role="menu">
                      <button
                        type="button"
                        className="study-sidebar__menu-item"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDocMenuId(null);
                          onSelectDocument?.(doc);
                        }}
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
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {isSelected ? "Close Document" : "View Document"}
                      </button>

                      {onDeleteDocument && (
                        <button
                          type="button"
                          className="study-sidebar__menu-item study-sidebar__menu-item--danger"
                          role="menuitem"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDocMenuId(null);
                            onDeleteDocument(doc);
                          }}
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
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                          Remove from Notebook
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
          )}
        </div>
      </div>
    </aside>
  );
};

export default StudySidebar;
