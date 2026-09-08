export interface Notebook {
  id: number;
  name: string;
  color?: string;
  created_at?: string;
}

export const getNotebooks = async (): Promise<Notebook[]> => {
  const response = await fetch("http://localhost:8082/notebooks/");
  if (!response.ok) {
    throw new Error(`Failed to fetch notebooks (${response.status}).`);
  }
  return response.json();
};

export const createNotebook = async (
  name: string,
  color: string = "#aa3bff",
): Promise<Notebook> => {
  const response = await fetch("http://localhost:8082/notebooks/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, color }),
  });

  if (!response.ok) {
    let message = `Failed to create notebook (${response.status}).`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        message = errorData.detail;
      }
    } catch {
      // fallback
    }
    throw new Error(message);
  }

  return response.json();
};
