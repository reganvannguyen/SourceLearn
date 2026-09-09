import { type ReactNode } from "react";
import type { CitationItem } from "../api/messages";

export type ChatMessageSender = "user" | "assistant";

export type ChatMessageData = {
  id: string | number;
  sender: ChatMessageSender;
  content: string;
  citations?: CitationItem[];
  isThinking?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

type ChatMessageProps = {
  sender: ChatMessageSender;
  content: string;
  citations?: CitationItem[];
  isThinking?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onCitationClick?: (citation: CitationItem) => void;
};

// Parses inline bracketed citations like [17] or [17, 39] and replaces them with interactive badges
const renderContentWithCitations = (
  text: string,
  citations: CitationItem[],
  onCitationClick?: (citation: CitationItem) => void,
): ReactNode[] => {
  if (!text) return [];
  if (!citations || citations.length === 0) {
    return [text];
  }

  // Map by chunk_id for direct chunk ID citations
  const chunkMap = new Map<number, CitationItem>();
  citations.forEach((c) => chunkMap.set(c.chunk_id, c));

  // Regex to match [17] or [17, 39] or [1]
  const citationRegex = /\[(\d+(?:\s*,\s*\d+)*)\]/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchEnd = match.index + match[0].length;

    // Push preceding text
    if (matchStart > lastIndex) {
      nodes.push(text.substring(lastIndex, matchStart));
    }

    // Parse IDs within brackets
    const rawIds = match[1]
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    const matchedCitations: { id: number; cite: CitationItem }[] = [];

    for (const num of rawIds) {
      // 1. Try matching by chunk_id
      if (chunkMap.has(num)) {
        matchedCitations.push({ id: num, cite: chunkMap.get(num)! });
      }
      // 2. Try matching by 1-indexed citation list position (e.g. [1])
      else if (num >= 1 && num <= citations.length) {
        matchedCitations.push({ id: num, cite: citations[num - 1] });
      }
    }

    if (matchedCitations.length > 0) {
      nodes.push(
        <span
          key={`citation-group-${matchStart}`}
          className="chat-inline-citations-group"
        >
          {matchedCitations.map(({ id, cite }, idx) => (
            <button
              key={`cite-pill-${id}-${idx}-${matchStart}`}
              type="button"
              className="chat-inline-citation"
              onClick={() => onCitationClick?.(cite)}
              title={`View in ${cite.file_name} (Page ${cite.page_number}):\n"${cite.snippet}"`}
            >
              <svg
                className="chat-inline-citation__icon"
                viewBox="0 0 24 24"
                width="11"
                height="11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="chat-inline-citation__page">
                p. {cite.page_number}
              </span>
            </button>
          ))}
        </span>,
      );
    } else {
      // If none matched, render original bracket as-is
      nodes.push(match[0]);
    }

    lastIndex = matchEnd;
  }

  // Push remaining text
  if (lastIndex < text.length) {
    nodes.push(text.substring(lastIndex));
  }

  return nodes;
};

const ChatMessage = ({
  sender,
  content,
  citations = [],
  isThinking = false,
  isError = false,
  onRetry,
  onCitationClick,
}: ChatMessageProps) => {
  const isUserMessage = sender === "user";

  if (isError) {
    return (
      <article
        className="chat-message chat-message--error"
        aria-label="Error message"
      >
        <div className="chat-message__header">
          <span className="chat-message__avatar" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
          <p className="chat-message__sender">Notice</p>
        </div>

        <div className="chat-message__content">
          <p className="chat-message__error-text">{content}</p>
          {onRetry && (
            <button
              type="button"
              className="chat-message__retry-btn"
              onClick={onRetry}
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Try Again
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <article
      className={`chat-message chat-message--${sender}`}
      aria-label={isUserMessage ? "Your message" : "AI message"}
    >
      <div className="chat-message__header">
        <span className="chat-message__avatar" aria-hidden="true">
          {isUserMessage ? (
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
            </svg>
          )}
        </span>
        <p className="chat-message__sender">
          {isUserMessage ? "You" : "Assistant"}
        </p>
      </div>

      <div className="chat-message__content">
        {isThinking ? (
          <div className="chat-message__thinking">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="thinking-text">
              Searching documents and generating response…
            </span>
          </div>
        ) : (
          <p className="chat-message__text">
            {isUserMessage
              ? content
              : renderContentWithCitations(content, citations, onCitationClick)}
          </p>
        )}
      </div>

      {!isThinking && citations && citations.length > 0 && (
        <div className="chat-message__citations">
          <div className="chat-citations-label">
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Referenced Sources</span>
          </div>

          <div className="chat-citations-list">
            {citations.map((cite, index) => (
              <button
                key={`${cite.chunk_id}-${index}`}
                type="button"
                className="chat-citation-pill"
                onClick={() => onCitationClick?.(cite)}
                title={`Open ${cite.file_name} at page ${cite.page_number}:\n"${cite.snippet}"`}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span className="citation-pill-name">{cite.file_name}</span>
                <span className="citation-pill-page">
                  p. {cite.page_number}
                </span>
                <span className="citation-pill-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default ChatMessage;
