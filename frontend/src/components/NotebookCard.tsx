import type { Notebook } from "../api/notebooks";

type NotebookCardProps = {
  notebook: Notebook;
  onClick: () => void;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Recently created";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
};

const NotebookCard = ({ notebook, onClick }: NotebookCardProps) => {
  const color = notebook.color || "#aa3bff";

  return (
    <div
      className="notebook-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={
        {
          "--card-accent": color,
        } as React.CSSProperties
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className="notebook-card__icon"
        style={{
          backgroundColor: `${color}20`,
          color: color,
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
        <h3 className="notebook-card__title">{notebook.name}</h3>
        <span className="notebook-card__date">{formatDate(notebook.created_at)}</span>
      </div>

      <div className="notebook-card__arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export default NotebookCard;
