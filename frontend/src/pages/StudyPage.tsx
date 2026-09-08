import { useEffect, useRef, useState } from "react";
import {
    getDocumentsByNotebook,
    uploadDocument,
    type DocumentResponse,
} from "../api/documents";
import type { Notebook } from "../api/notebooks";
import ChatInput from "../components/ChatInput";
import ChatMessage, {
    type ChatMessageData,
} from "../components/ChatMessage";
import FileUpload from "../components/FileUpload";
import PdfViewerModal from "../components/PdfViewerModal";
import StudySidebar from "../components/StudySidebar";

const initialMessages: ChatMessageData[] = [
    {
        id: "assistant-welcome",
        sender: "assistant",
        content: "Hi! Upload your study material in the sidebar and ask me a question about it.",
    },
];

type StudyPageProps = {
    notebook: Notebook;
    onBack?: () => void;
};

const StudyPage = ({ notebook, onBack }: StudyPageProps) => {
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    // On mount, load previously uploaded docs for this notebook
    useEffect(() => {
        let isMounted = true;
        const fetchDocs = async () => {
            setIsLoadingDocs(true);
            try {
                const docs = await getDocumentsByNotebook(notebook.id);
                if (isMounted) {
                    setDocuments(docs);
                }
            } catch (err) {
                console.error("Error fetching notebook documents:", err);
            } finally {
                if (isMounted) {
                    setIsLoadingDocs(false);
                }
            }
        };

        fetchDocs();

        return () => {
            isMounted = false;
        };
    }, [notebook.id]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = (content: string) => {
        const userMessage: ChatMessageData = {
            id: crypto.randomUUID(),
            sender: "user",
            content,
        };

        setMessages((currentMessages) => [...currentMessages, userMessage]);
    };

    const handleFileConfirm = async (file: File) => {
        const uploadedDoc = await uploadDocument(file, notebook.id);
        setDocuments((prev) => [uploadedDoc, ...prev]);
    };

    return (
        <div className="study-layout">
            <StudySidebar
                notebook={notebook}
                documents={documents}
                isLoadingDocs={isLoadingDocs}
                onAddMaterial={() => setIsUploadOpen(true)}
                onBack={onBack}
                onSelectDocument={setViewingDoc}
            />

            <main className="study-main">
                <header className="study-main__topbar">
                    <div className="study-main__topbar-info">
                        <h2>{notebook.name}</h2>
                        <span className="study-main__source-pill">
                            {documents.length} {documents.length === 1 ? "source" : "sources"}
                        </span>
                    </div>
                </header>

                <div
                    ref={chatScrollRef}
                    className="study-chat-scroll"
                    role="log"
                    aria-live="polite"
                    aria-label="Conversation"
                >
                    <div className="study-chat-messages">
                        {messages.map((chatMessage) => (
                            <ChatMessage
                                key={chatMessage.id}
                                sender={chatMessage.sender}
                                content={chatMessage.content}
                            />
                        ))}
                    </div>
                </div>

                <div className="study-chat-bottom">
                    <div className="study-chat-input-wrapper">
                        <ChatInput onSend={handleSend} />
                        <p className="study-chat-hint">
                            Responses are referenced directly from your uploaded materials.
                        </p>
                    </div>
                </div>

                {isUploadOpen && (
                    <FileUpload
                        isOpen={isUploadOpen}
                        onClose={() => setIsUploadOpen(false)}
                        onConfirm={handleFileConfirm}
                    />
                )}

                {viewingDoc && (
                    <PdfViewerModal
                        document={viewingDoc}
                        onClose={() => setViewingDoc(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default StudyPage;
