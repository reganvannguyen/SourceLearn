import { apiFetch } from "./client";

export interface Notebook {
  id: number;
  name: string;
  color?: string;
  created_at?: string;
}

export const getNotebooks = async (): Promise<Notebook[]> => {
  return apiFetch<Notebook[]>("http://localhost:8082/notebooks/");
};

export const createNotebook = async (
  name: string,
  color: string = "#aa3bff",
): Promise<Notebook> => {
  return apiFetch<Notebook>("http://localhost:8082/notebooks/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, color }),
  });
};
