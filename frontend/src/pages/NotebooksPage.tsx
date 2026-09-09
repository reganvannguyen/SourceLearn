import { useEffect, useState } from "react";
import {
  createNotebook,
  deleteNotebook,
  getNotebooks,
  updateNotebook,
  type Notebook,
} from "../api/notebooks";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import CreateNotebookModal from "../components/CreateNotebookModal";
import EditNotebookModal from "../components/EditNotebookModal";
import NotebookCard from "../components/NotebookCard";
import { NotebookIcon } from "../components/NotebookIcon";

type NotebooksPageProps = {
  onSelectNotebook: (notebook: Notebook) => void;
};

const NotebooksPage = ({ onSelectNotebook }: NotebooksPageProps) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  const [deletingNotebook, setDeletingNotebook] = useState<Notebook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchNotebooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notebooks.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreate = async (name: string, color: string, icon: string) => {
    const created = await createNotebook(name, color, icon);
    setNotebooks((prev) => [created, ...prev]);
    onSelectNotebook(created);
  };

  const handleUpdateNotebook = async (
    id: number,
    name: string,
    color: string,
    icon: string,
  ) => {
    await updateNotebook(id, { name, color, icon });
    setNotebooks((prev) =>
      prev.map((nb) => (nb.id === id ? { ...nb, name, color, icon } : nb)),
    );
    setEditingNotebook(null);
  };

  const handleDeleteNotebook = async () => {
    if (!deletingNotebook) return;
    setIsDeleting(true);
    try {
      await deleteNotebook(deletingNotebook.id);
      setNotebooks((prev) => prev.filter((nb) => nb.id !== deletingNotebook.id));
      setDeletingNotebook(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete notebook.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="notebooks-page">
      <div className="notebooks-page__layout">
        {/* Left: Main Content */}
        <div className="notebooks-page__main">
          <header className="notebooks-page__header">
            <div className="notebooks-page__header-text">
              <h1>SourceLearn</h1>
              <p>Organize your study materials into notebooks and ask AI anything</p>
            </div>
          </header>

          <section className="notebooks-page__list-section">
            <div className="notebooks-page__list-header">
              <h2>Your Notebooks</h2>
              <span className="notebooks-page__count">
                {notebooks.length} {notebooks.length === 1 ? "notebook" : "notebooks"}
              </span>
            </div>

            {isLoading ? (
              <div className="notebooks-page__loading" role="status">
                Loading notebooks…
              </div>
            ) : error ? (
              <div className="notebooks-page__error-state">
                <p>{error}</p>
                <button
                  type="button"
                  className="notebooks-page__retry-btn"
                  onClick={fetchNotebooks}
                >
                  Retry
                </button>
              </div>
            ) : notebooks.length === 0 ? (
              <div className="notebooks-page__empty-state">
                <div className="notebooks-page__empty-icon" aria-hidden="true">
                  <NotebookIcon icon="book" size={52} />
                </div>
                <h3>No notebooks yet</h3>
                <p>Create your first notebook to start uploading study materials.</p>
                <button
                  type="button"
                  className="notebooks-page__empty-action-btn"
                  onClick={() => setIsModalOpen(true)}
                >
                  + Create Your First Notebook
                </button>
              </div>
            ) : (
              <div className="notebooks-grid">
                {notebooks.map((nb) => (
                  <NotebookCard
                    key={nb.id}
                    notebook={nb}
                    onClick={() => onSelectNotebook(nb)}
                    onEdit={(nbToEdit) => setEditingNotebook(nbToEdit)}
                    onDelete={(nbToDelete) => setDeletingNotebook(nbToDelete)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right: Canvas-Style Utility Sidebar */}
        <aside className="notebooks-page__sidebar" aria-label="Dashboard utility sidebar">
          <button
            type="button"
            className="notebooks-page__new-btn notebooks-page__new-btn--sidebar"
            onClick={() => setIsModalOpen(true)}
          >
            + New Notebook
          </button>

          {/* Study Overview Widget */}
          <div className="dashboard-widget">
            <h3 className="dashboard-widget__title">Study Overview</h3>
            <div className="dashboard-widget__stats">
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-number">{notebooks.length}</span>
                <span className="dashboard-stat-label">Notebooks</span>
              </div>
              <div className="dashboard-stat-card">
                <span className="dashboard-stat-number">AI</span>
                <span className="dashboard-stat-label">Grounded Q&A</span>
              </div>
            </div>
          </div>

          {/* Quick Tips Widget */}
          <div className="dashboard-widget">
            <h3 className="dashboard-widget__title">Quick Tips</h3>
            <ul className="dashboard-widget__tips-list">
              <li>
                <strong>Organize by Course:</strong> Group slides, syllabi, and notes for each subject.
              </li>
              <li>
                <strong>Cited Answers:</strong> Ask AI questions and see exactly which page and text grounded each response.
              </li>
              <li>
                <strong>Color Code:</strong> Use distinct course colors to navigate quickly.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />

      <EditNotebookModal
        notebook={editingNotebook}
        isOpen={!!editingNotebook}
        onClose={() => setEditingNotebook(null)}
        onSave={handleUpdateNotebook}
      />

      <ConfirmDeleteModal
        isOpen={!!deletingNotebook}
        isDeleting={isDeleting}
        title="Delete Notebook?"
        description={`Are you sure you want to delete "${deletingNotebook?.name}"? This action cannot be undone.`}
        notice="All uploaded study materials, PDF files, generated vector embeddings, and chat history will be permanently deleted."
        confirmLabel="Delete Notebook"
        onConfirm={handleDeleteNotebook}
        onClose={() => {
          if (!isDeleting) setDeletingNotebook(null);
        }}
      />
    </main>
  );
};

export default NotebooksPage;
