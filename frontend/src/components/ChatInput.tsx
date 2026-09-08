import { useId, useState, type FormEvent } from "react";

type ChatInputProps = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

const ChatInput = ({ onSend, disabled = false }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const inputId = useId();
  const canSend = !disabled && message.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSend(trimmedMessage);
    setMessage("");
  };

  return (
    <form className={`chat-input ${disabled ? "chat-input--disabled" : ""}`} onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        Message
      </label>
      <input
        id={inputId}
        className="chat-input__field"
        type="text"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={disabled ? "Thinking…" : "Ask a question about your study material..."}
        autoComplete="off"
        maxLength={2000}
        disabled={disabled}
      />
      <button
        className="chat-input__send"
        type="submit"
        aria-label="Send message"
        title="Send message"
        disabled={!canSend}
      >
        <svg
          className="chat-input__icon"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M22 2 11 13"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="m22 2-7 20-4-9-9-4Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
    </form>
  );
};

export default ChatInput;
