import { apiFetch } from "./client";

export interface DocumentResponse {
  document_id: number;
  file_name: string;
  notebook_id: number;
}

export const uploadDocument = async (
  file: File,
  notebookId: number = 1,
): Promise<DocumentResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return apiFetch<DocumentResponse>(
    `http://localhost:8082/notebooks/${notebookId}/documents`,
    {
      method: "POST",
      body: formData,
    },
  );
};

export const getDocumentsByNotebook = async (
  notebookId: number,
): Promise<DocumentResponse[]> => {
  return apiFetch<DocumentResponse[]>(
    `http://localhost:8082/notebooks/${notebookId}/documents`,
  );
};

export const getDocumentFileUrl = (
  documentId: number,
  page?: number,
  snippet?: string,
  color?: string,
): string => {
  const url = new URL(`http://localhost:8082/documents/${documentId}/file`);
  if (page) url.searchParams.set("page", page.toString());
  if (snippet) url.searchParams.set("snippet", snippet);
  if (color) url.searchParams.set("color", color);
  return url.toString();
};

