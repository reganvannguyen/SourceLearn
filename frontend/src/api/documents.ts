export const uploadDocument = async (file: File): Promise<unknown> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://localhost:8082/documents/", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Document upload failed (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json")
    ? response.json()
    : response.text();
};
