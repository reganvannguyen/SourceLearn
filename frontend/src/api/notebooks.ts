import { apiFetch, API_BASE_URL } from "./client";

export interface Notebook {
  id: number;
  name: string;
  color?: string;
  icon?: string;
  created_at?: string;
}

export const getNotebooks = async (): Promise<Notebook[]> => {
  return apiFetch<Notebook[]>(`${API_BASE_URL}/notebooks/`);
};

export const getNotebook = async (id: number): Promise<Notebook> => {
  return apiFetch<Notebook>(`${API_BASE_URL}/notebooks/${id}`);
};

export const createNotebook = async (
  name: string,
  color: string = "#7eaed7",
  icon: string = "book",
): Promise<Notebook> => {
  return apiFetch<Notebook>(`${API_BASE_URL}/notebooks/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, color, icon }),
  });
};

export interface NotebookUpdateData {
  name?: string;
  color?: string;
  icon?: string;
}

export const updateNotebook = async (
  id: number,
  data: NotebookUpdateData,
): Promise<Notebook> => {
  return apiFetch<Notebook>(`${API_BASE_URL}/notebooks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
};

export const deleteNotebook = async (
  id: number,
): Promise<{ success: boolean; deleted_notebook_id: number }> => {
  return apiFetch<{ success: boolean; deleted_notebook_id: number }>(
    `${API_BASE_URL}/notebooks/${id}`,
    {
      method: "DELETE",
    },
  );
};

