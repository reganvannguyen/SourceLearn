import { apiFetch } from "./client";

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
  return apiFetch<MessageResponse[]>(
    `http://localhost:8082/notebooks/${notebookId}/messages`,
  );
};

export const sendNotebookMessage = async (
  notebookId: number,
  content: string,
): Promise<MessageResponse> => {
  return apiFetch<MessageResponse>(
    `http://localhost:8082/notebooks/${notebookId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    },
  );
};

export const deleteNotebookMessages = async (
  notebookId: number,
): Promise<{ success: boolean; deleted_count: number }> => {
  return apiFetch<{ success: boolean; deleted_count: number }>(
    `http://localhost:8082/notebooks/${notebookId}/messages`,
    {
      method: "DELETE",
    },
  );
};
