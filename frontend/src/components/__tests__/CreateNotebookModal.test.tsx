import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateNotebookModal from "../CreateNotebookModal";


describe("CreateNotebookModal component", () => {
  it("does not render when isOpen is false", () => {
    const { container } = render(
      <CreateNotebookModal isOpen={false} onClose={vi.fn()} onCreate={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal elements when open", () => {
    render(<CreateNotebookModal isOpen={true} onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: /create notebook/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/notebook name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create notebook/i })).toBeInTheDocument();
  });

  it("updates live preview as name and color are changed", async () => {
    const user = userEvent.setup();
    render(<CreateNotebookModal isOpen={true} onClose={vi.fn()} onCreate={vi.fn()} />);

    const input = screen.getByLabelText(/notebook name/i);
    await user.type(input, "Machine Learning");

    // Exercise title in preview updates
    expect(screen.getByRole("heading", { name: "Machine Learning" })).toBeInTheDocument();

    // Select color swatch
    const yellowSwatch = screen.getByRole("radio", { name: /Hilroy Canary Yellow/i });
    await user.click(yellowSwatch);
    expect(yellowSwatch).toHaveAttribute("aria-checked", "true");
  });

  it("calls onCreate with entered values on submit", async () => {
    const handleCreate = vi.fn().mockResolvedValue(undefined);
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateNotebookModal
        isOpen={true}
        onClose={handleClose}
        onCreate={handleCreate}
      />,
    );

    const input = screen.getByLabelText(/notebook name/i);
    await user.type(input, "Data Structures");

    const submitBtn = screen.getByRole("button", { name: /create notebook/i });
    await user.click(submitBtn);

    expect(handleCreate).toHaveBeenCalledTimes(1);
    expect(handleCreate).toHaveBeenCalledWith(
      "Data Structures",
      expect.any(String),
      "book",
    );
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateNotebookModal
        isOpen={true}
        onClose={handleClose}
        onCreate={vi.fn()}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

