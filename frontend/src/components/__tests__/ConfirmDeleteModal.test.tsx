import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmDeleteModal from "../ConfirmDeleteModal";


describe("ConfirmDeleteModal component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <ConfirmDeleteModal isOpen={false} onConfirm={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders custom title, description, and confirm button label", () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        title="Delete Physics Notebook?"
        description="This will permanently delete the notebook and files."
        confirmLabel="Yes, Delete"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Delete Physics Notebook?" })).toBeInTheDocument();
    expect(screen.getByText("This will permanently delete the notebook and files.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes, Delete" })).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const handleConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onConfirm={handleConfirm}
        onClose={vi.fn()}
      />,
    );

    const deleteBtn = screen.getByRole("button", { name: /delete chat history/i });
    await user.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel or close button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <ConfirmDeleteModal
        isOpen={true}
        onConfirm={vi.fn()}
        onClose={handleClose}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

