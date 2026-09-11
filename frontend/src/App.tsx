import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import NotebooksPage from "./pages/NotebooksPage";
import StudyPage from "./pages/StudyPage";
import NotFoundPage from "./pages/NotFoundPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotebooksPage />} />
        <Route path="/notebooks" element={<Navigate to="/" replace />} />
        <Route path="/notebooks/:notebookId" element={<StudyPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
