import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { NotebookIcon } from "../NotebookIcon";


describe("NotebookIcon component", () => {
  it("renders default book icon when no icon prop is given", () => {
    const { container } = render(<NotebookIcon />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("notebook-icon");
    expect(svg).toHaveAttribute("width", "48");
  });

  it("renders custom size", () => {
    const { container } = render(<NotebookIcon icon="cpu" size={24} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("renders specific icons properly", () => {
    const icons = ["maple", "code", "science", "math", "brain", "quill", "rocket", "globe"] as const;

    for (const icon of icons) {
      const { container } = render(<NotebookIcon icon={icon} />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    }
  });

  it("falls back to default book icon for unknown icon name", () => {
    const { container } = render(<NotebookIcon icon="unknown_icon_xyz" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

