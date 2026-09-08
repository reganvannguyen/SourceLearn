import type { CitationItem } from "../api/messages";

export type ChatMessageSender = "user" | "assistant";

export type ChatMessageData = {
  id: string | number;
  sender: ChatMessageSender;
  content: string;
  citations?: CitationItem[];
  isThinking?: boolean;
};

type ChatMessageProps = {
  sender: ChatMessageSender;
  content: string;
  citations?: CitationItem[];
  isThinking?: boolean;
  onCitationClick?: (citation: CitationItem) => void;
};

const ChatMessage = ({
  sender,
  content,
  citations = [],
  isThinking = false,
  onCitationClick,
}: ChatMessageProps) => {
  const isUserMessage = sender === "user";

  return (
    <article
      className={`chat-message chat-message--${sender}`}
      aria-label={isUserMessage ? "Your message" : "AI message"}
    >
      <div className="chat-message__header">
        <span className="chat-message__avatar" aria-hidden="true">
          {isUserMessage ? "👤" : "✨"}
        </span>
        <p className="chat-message__sender">{isUserMessage ? "You" : "Assistant"}</p>
      </div>

      <div className="chat-message__content">
        {isThinking ? (
          <div className="chat-message__thinking">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="thinking-text">Searching documents and generating response…</span>
          </div>
        ) : (
          <p className="chat-message__text">{content}</p>
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
                <span className="citation-pill-page">p. {cite.page_number}</span>
                <span className="citation-pill-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default ChatMessage;
