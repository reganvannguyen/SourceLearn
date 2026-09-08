
export type ChatMessageSender = "user" | "assistant";

export type ChatMessageData = {
  id: string;
  sender: ChatMessageSender;
  content: string;
};

type ChatMessageProps = Pick<ChatMessageData, "sender" | "content">;

const ChatMessage = ({ sender, content }: ChatMessageProps) => {
  const isUserMessage = sender === "user";

  return (
    <article
      className={`chat-message chat-message--${sender}`}
      aria-label={isUserMessage ? "Your message" : "AI message"}
    >
      <p className="chat-message__sender">{isUserMessage ? "You" : "AI"}</p>
      <p className="chat-message__content">{content}</p>
    </article>
  );
};

export default ChatMessage;
