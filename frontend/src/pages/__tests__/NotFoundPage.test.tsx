import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import NotFoundPage from "../NotFoundPage";


const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NotFoundPage", () => {
  it("renders 404 header and description", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/The page you are looking for doesn't exist/i),
    ).toBeInTheDocument();
  });

  it("navigates to '/' when Back to Notebooks button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    const backBtn = screen.getByRole("button", { name: /Back to Notebooks/i });
    await user.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});

