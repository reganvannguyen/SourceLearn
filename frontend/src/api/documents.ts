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

  const response = await fetch(
    `http://localhost:8082/notebooks/${notebookId}/documents`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    let message = `Document upload failed (${response.status}).`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        message = errorData.detail;
      }
    } catch {
      // fallback to status code message
    }
    throw new Error(message);
  }

  return response.json();
};

export const getDocumentsByNotebook = async (
  notebookId: number,
): Promise<DocumentResponse[]> => {
  const response = await fetch(
    `http://localhost:8082/notebooks/${notebookId}/documents`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch documents (${response.status}).`);
  }

  return response.json();
};

export const getDocumentFileUrl = (documentId: number): string => {
  return `http://localhost:8082/documents/${documentId}/file`;
};

