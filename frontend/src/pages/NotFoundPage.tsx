import { useNavigate } from "react-router-dom";
import { NotebookIcon } from "../components/NotebookIcon";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <div className="not-found-page__card">
        <div className="not-found-page__icon" aria-hidden="true">
          <NotebookIcon icon="book" size={56} />
        </div>
        <h1 className="not-found-page__title">404</h1>
        <h2 className="not-found-page__subtitle">Page Not Found</h2>
        <p className="not-found-page__desc">
          The page you are looking for doesn't exist or has moved.
        </p>
        <button
          type="button"
          className="not-found-page__btn"
          onClick={() => navigate("/")}
        >
          &larr; Back to Notebooks
        </button>
      </div>
    </main>
  );
};

export default NotFoundPage;
