import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotebookCard from "../NotebookCard";
import type { Notebook } from "../../api/notebooks";


describe("NotebookCard component", () => {
  const mockNotebook: Notebook = {
    id: 10,
    name: "Distributed Systems",
    color: "#7eaed7",
    icon: "cpu",
  };

  it("renders notebook title and uses provided color", () => {
    render(<NotebookCard notebook={mockNotebook} onClick={vi.fn()} />);
    expect(screen.getByText("Distributed Systems")).toBeInTheDocument();
  });

  it("calls onClick when the card is clicked", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<NotebookCard notebook={mockNotebook} onClick={handleClick} />);
    const card = screen.getByRole("button", { name: /Distributed Systems/i });
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick on Enter or Space key press", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<NotebookCard notebook={mockNotebook} onClick={handleClick} />);
    const card = screen.getByRole("button", { name: /Distributed Systems/i });
    card.focus();

    await user.keyboard("{Enter}");
    expect(handleClick).toHaveBeenCalledTimes(1);

    await user.keyboard(" ");
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it("opens the options menu and triggers edit and delete callbacks", async () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    const user = userEvent.setup();

    render(
      <NotebookCard
        notebook={mockNotebook}
        onClick={vi.fn()}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />,
    );

    // Click 3-dots button
    const menuBtn = screen.getByRole("button", { name: /card options/i });
    await user.click(menuBtn);

    // Dropdown should be visible
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /open notebook/i })).toBeInTheDocument();

    // Click Edit
    const editBtn = screen.getByRole("menuitem", { name: /edit details/i });
    await user.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(mockNotebook);

    // Re-open menu to test Delete
    await user.click(menuBtn);
    const deleteBtn = screen.getByRole("menuitem", { name: /delete notebook/i });
    await user.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockNotebook);
  });

  it("closes the options menu on Escape key", async () => {
    const user = userEvent.setup();
    render(<NotebookCard notebook={mockNotebook} onClick={vi.fn()} onEdit={vi.fn()} />);

    const menuBtn = screen.getByRole("button", { name: /card options/i });
    await user.click(menuBtn);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});

