export interface CitationItem {
  chunk_id: number;
  document_id: number;
  file_name: string;
  page_number: number;
  snippet: string;
}

export interface MessageResponse {
  id: number;
  notebook_id: number;
  sender: "user" | "assistant";
  content: string;
  citations: CitationItem[];
  created_at: string;
}

export const getNotebookMessages = async (
  notebookId: number,
): Promise<MessageResponse[]> => {
  const response = await fetch(
    `http://localhost:8082/notebooks/${notebookId}/messages`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch messages (${response.status}).`);
  }

  return response.json();
};

export const sendNotebookMessage = async (
  notebookId: number,
  content: string,
): Promise<MessageResponse> => {
  const response = await fetch(
    `http://localhost:8082/notebooks/${notebookId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    let detail = `Failed to send question (${response.status}).`;
    try {
      const err = await response.json();
      if (err?.detail) detail = err.detail;
    } catch {
      // fallback
    }
    throw new Error(detail);
  }

  return response.json();
};
