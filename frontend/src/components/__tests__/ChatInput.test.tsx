import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatInput from "../ChatInput";


describe("ChatInput component", () => {
  it("renders with send button disabled when input is empty", () => {
    render(<ChatInput onSend={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Ask a question about your study material/i);
    expect(input).toBeInTheDocument();

    const sendBtn = screen.getByRole("button", { name: /send message/i });
    expect(sendBtn).toBeDisabled();
  });

  it("enables send button when text is entered", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} />);

    const input = screen.getByPlaceholderText(/Ask a question about your study material/i);
    const sendBtn = screen.getByRole("button", { name: /send message/i });

    await user.type(input, "   ");
    expect(sendBtn).toBeDisabled(); // whitespace only still disabled

    await user.type(input, "Explain paging");
    expect(sendBtn).not.toBeDisabled();
  });

  it("calls onSend with trimmed message and clears input on submit", async () => {
    const handleSend = vi.fn();
    const user = userEvent.setup();
    render(<ChatInput onSend={handleSend} />);

    const input = screen.getByPlaceholderText(/Ask a question about your study material/i);
    await user.type(input, "  How does virtual memory work?  ");

    const sendBtn = screen.getByRole("button", { name: /send message/i });
    await user.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith("How does virtual memory work?");
    expect(input).toHaveValue("");
    expect(sendBtn).toBeDisabled();
  });

  it("locks input and shows placeholder when disabled", async () => {
    const handleSend = vi.fn();
    render(<ChatInput onSend={handleSend} disabled={true} />);

    const input = screen.getByPlaceholderText("Thinking…");
    expect(input).toBeDisabled();

    const sendBtn = screen.getByRole("button", { name: /send message/i });
    expect(sendBtn).toBeDisabled();
  });
});

