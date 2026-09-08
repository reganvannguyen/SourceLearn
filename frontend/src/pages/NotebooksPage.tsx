import { useEffect, useState } from "react";
import { createNotebook, getNotebooks, type Notebook } from "../api/notebooks";
import CreateNotebookModal from "../components/CreateNotebookModal";
import NotebookCard from "../components/NotebookCard";

type NotebooksPageProps = {
  onSelectNotebook: (notebook: Notebook) => void;
};

const NotebooksPage = ({ onSelectNotebook }: NotebooksPageProps) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCreate = async (name: string, color: string) => {
    const created = await createNotebook(name, color);
    setNotebooks((prev) => [created, ...prev]);
    onSelectNotebook(created);
  };

  return (
    <main className="notebooks-page">
      <header className="notebooks-page__header">
        <div className="notebooks-page__header-text">
          <h1>SourceLearn</h1>
          <p>Organize your study materials into notebooks and ask AI anything</p>
        </div>
        <button
          type="button"
          className="notebooks-page__new-btn"
          onClick={() => setIsModalOpen(true)}
        >
          + New Notebook
        </button>
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
              📚
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
              />
            ))}
          </div>
        )}
      </section>

      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </main>
  );
};

export default NotebooksPage;
