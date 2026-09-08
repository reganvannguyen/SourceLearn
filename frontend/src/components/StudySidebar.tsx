import type { DocumentResponse } from "../api/documents";
import type { Notebook } from "../api/notebooks";
import { NotebookIcon } from "./NotebookIcon";

type StudySidebarProps = {
  notebook: Notebook;
  documents: DocumentResponse[];
  isLoadingDocs: boolean;
  onAddMaterial: () => void;
  onBack?: () => void;
  onSelectDocument?: (doc: DocumentResponse) => void;
  onEditNotebook?: () => void;
};

const StudySidebar = ({
  notebook,
  documents,
  isLoadingDocs,
  onAddMaterial,
  onBack,
  onSelectDocument,
  onEditNotebook,
}: StudySidebarProps) => {
  const color = notebook.color || "#7eaed7";

  return (
    <aside className="study-sidebar" aria-label="Study notebook sidebar">
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
          {onEditNotebook && (
            <button
              type="button"
              className="study-sidebar__edit-btn"
              onClick={onEditNotebook}
              aria-label="Edit notebook title and color"
              title="Edit notebook"
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
            </button>
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
        </div>

        <button
          type="button"
          className="study-sidebar__add-btn"
          onClick={onAddMaterial}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add study material
        </button>

        <div className="study-sidebar__doc-list" role="list">
          {isLoadingDocs ? (
            <div className="study-sidebar__loading">Loading sources…</div>
          ) : documents.length === 0 ? (
            <div className="study-sidebar__empty">
              <p>No study materials yet.</p>
              <span>Upload a PDF to ask questions and get citations.</span>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.document_id}
                className="study-sidebar__doc-item study-sidebar__doc-item--clickable"
                role="button"
                tabIndex={0}
                onClick={() => onSelectDocument?.(doc)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectDocument?.(doc);
                  }
                }}
                title={`Click to view ${doc.file_name}`}
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
                <span className="study-sidebar__doc-badge">View</span>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default StudySidebar;
