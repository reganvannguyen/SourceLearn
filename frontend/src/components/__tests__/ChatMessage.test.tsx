import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatMessage from "../ChatMessage";
import type { CitationItem } from "../../api/messages";


describe("ChatMessage component", () => {
  const sampleCitation: CitationItem = {
    chunk_id: 42,
    document_id: 1,
    file_name: "lecture1.pdf",
    page_number: 7,
    snippet: "Virtual memory isolates processes from each other.",
  };

  it("renders a user message correctly", () => {
    render(<ChatMessage sender="user" content="What is virtual memory?" />);

    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("What is virtual memory?")).toBeInTheDocument();
    expect(screen.getByLabelText("Your message")).toBeInTheDocument();
  });

  it("renders an assistant message with interactive citation badges", async () => {
    const handleCitationClick = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatMessage
        sender="assistant"
        content="Virtual memory isolates processes [42]."
        citations={[sampleCitation]}
        onCitationClick={handleCitationClick}
      />,
    );

    expect(screen.getByText("Assistant")).toBeInTheDocument();
    expect(screen.getByText(/Virtual memory isolates processes/)).toBeInTheDocument();

    // Check citation badge pill
    const citeButton = screen.getByRole("button", { name: /p\. 7/i });
    expect(citeButton).toBeInTheDocument();

    // Click badge
    await user.click(citeButton);
    expect(handleCitationClick).toHaveBeenCalledTimes(1);
    expect(handleCitationClick).toHaveBeenCalledWith(sampleCitation);
  });

  it("renders thinking state indicator", () => {
    render(<ChatMessage sender="assistant" content="" isThinking={true} />);

    expect(
      screen.getByText(/Searching documents and generating response/),
    ).toBeInTheDocument();
  });

  it("renders error state with retry button", async () => {
    const handleRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <ChatMessage
        sender="assistant"
        content="Failed to connect to AI server."
        isError={true}
        onRetry={handleRetry}
      />,
    );

    expect(screen.getByText("Notice")).toBeInTheDocument();
    expect(screen.getByText("Failed to connect to AI server.")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    await user.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

