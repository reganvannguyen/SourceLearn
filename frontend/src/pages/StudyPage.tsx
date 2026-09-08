import { useState } from "react";
import { uploadDocument } from "../api/documents";
import ChatInput from "../components/ChatInput";
import ChatMessage, {
    type ChatMessageData,
} from "../components/ChatMessage";
import FileUpload from "../components/FileUpload";

const initialMessages: ChatMessageData[] = [
    {
        id: "assistant-welcome",
        sender: "assistant",
        content: "Hi! Upload your study material and ask me a question about it.",
    },
];

const StudyPage = () => {
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [confirmedFile, setConfirmedFile] = useState<File | null>(null);

    const handleSend = (content: string) => {
        const userMessage: ChatMessageData = {
            id: crypto.randomUUID(),
            sender: "user",
            content,
        };

        setMessages((currentMessages) => [...currentMessages, userMessage]);
    };

    const handleFileConfirm = async (file: File) => {
        await uploadDocument(file);
        setConfirmedFile(file);
    };

    return (
        <main className="study-page">
            <h1>SourceLearn</h1>
            <p>Upload your study material and ask questions about it</p>

            <div className="study-page__upload">
                <button
                    className="file-upload__trigger"
                    type="button"
                    onClick={() => setIsUploadOpen(true)}
                >
                    {confirmedFile ? "Change study material" : "Add study material"}
                </button>
                {confirmedFile && (
                    <div className="study-page__confirmed-file" role="status">
                        <span className="study-page__confirmed-file-label">Study material:</span>
                        <span>{confirmedFile.name}</span>
                    </div>
                )}
            </div>

            <div
                className="chat-messages"
                role="log"
                aria-live="polite"
                aria-label="Conversation"
            >
                {messages.map((chatMessage) => (
                    <ChatMessage
                        key={chatMessage.id}
                        sender={chatMessage.sender}
                        content={chatMessage.content}
                    />
                ))}
            </div>

            <ChatInput onSend={handleSend} />

            {isUploadOpen && (
                <FileUpload
                    isOpen={isUploadOpen}
                    onClose={() => setIsUploadOpen(false)}
                    onConfirm={handleFileConfirm}
                />
            )}
        </main>
    );
};

export default StudyPage;
