import { useState } from "react";
import "./App.css";
import type { Notebook } from "./api/notebooks";
import NotebooksPage from "./pages/NotebooksPage";
import StudyPage from "./pages/StudyPage";

const App = () => {
  const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(null);

  return currentNotebook ? (
    <StudyPage
      notebook={currentNotebook}
      onBack={() => setCurrentNotebook(null)}
    />
  ) : (
    <NotebooksPage onSelectNotebook={setCurrentNotebook} />
  );
};

export default App;
