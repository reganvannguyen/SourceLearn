import { useEffect, useRef, useState } from "react";
import {
    getDocumentsByNotebook,
    uploadDocument,
    type DocumentResponse,
} from "../api/documents";
import {
    getNotebookMessages,
    sendNotebookMessage,
    type CitationItem,
} from "../api/messages";
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
        citations: [],
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
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // PDF modal viewing state
    const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);
    const [viewingPage, setViewingPage] = useState<number | undefined>(undefined);
    const [viewingSnippet, setViewingSnippet] = useState<string | undefined>(undefined);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    // On mount or notebook switch: load documents and past messages
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            setIsLoadingDocs(true);
            setIsLoadingMessages(true);
            try {
                const [docs, msgs] = await Promise.all([
                    getDocumentsByNotebook(notebook.id),
                    getNotebookMessages(notebook.id),
                ]);

                if (isMounted) {
                    setDocuments(docs);
                    if (msgs && msgs.length > 0) {
                        setMessages(
                            msgs.map((m) => ({
                                id: m.id,
                                sender: m.sender,
                                content: m.content,
                                citations: m.citations || [],
                            }))
                        );
                    } else {
                        setMessages(initialMessages);
                    }
                }
            } catch (err) {
                console.error("Error loading notebook data:", err);
            } finally {
                if (isMounted) {
                    setIsLoadingDocs(false);
                    setIsLoadingMessages(false);
                }
            }
        };

        loadData();

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

    const handleSend = async (content: string) => {
        if (isSending || !content.trim()) return;

        const userTempId = `user-${Date.now()}`;
        const thinkingId = `thinking-${Date.now()}`;

        const userMessage: ChatMessageData = {
            id: userTempId,
            sender: "user",
            content: content.trim(),
        };

        const thinkingMessage: ChatMessageData = {
            id: thinkingId,
            sender: "assistant",
            content: "",
            isThinking: true,
        };

        setMessages((prev) => [...prev, userMessage, thinkingMessage]);
        setIsSending(true);

        try {
            const assistantResponse = await sendNotebookMessage(notebook.id, content.trim());

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === thinkingId
                        ? {
                              id: assistantResponse.id,
                              sender: assistantResponse.sender,
                              content: assistantResponse.content,
                              citations: assistantResponse.citations || [],
                          }
                        : msg
                )
            );
        } catch (err: any) {
            console.error("Error sending question:", err);
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === thinkingId
                        ? {
                              id: `err-${Date.now()}`,
                              sender: "assistant",
                              content:
                                  err?.message ||
                                  "Failed to get a response from the study assistant. Please try again.",
                          }
                        : msg
                )
            );
        } finally {
            setIsSending(false);
        }
    };

    const handleFileConfirm = async (file: File) => {
        const uploadedDoc = await uploadDocument(file, notebook.id);
        setDocuments((prev) => [uploadedDoc, ...prev]);
    };

    const handleCitationClick = (citation: CitationItem) => {
        const doc =
            documents.find((d) => d.document_id === citation.document_id) || {
                document_id: citation.document_id,
                file_name: citation.file_name,
                notebook_id: notebook.id,
            };

        setViewingPage(citation.page_number);
        setViewingSnippet(citation.snippet);
        setViewingDoc(doc);
    };

    const handleSelectSidebarDoc = (doc: DocumentResponse) => {
        setViewingPage(undefined);
        setViewingSnippet(undefined);
        setViewingDoc(doc);
    };

    return (
        <div className="study-layout">
            <StudySidebar
                notebook={notebook}
                documents={documents}
                isLoadingDocs={isLoadingDocs}
                onAddMaterial={() => setIsUploadOpen(true)}
                onBack={onBack}
                onSelectDocument={handleSelectSidebarDoc}
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
                    {isLoadingMessages ? (
                        <div className="study-chat-loading">
                            <div className="pdf-modal-spinner" />
                            <span>Loading conversation history…</span>
                        </div>
                    ) : (
                        <div className="study-chat-messages">
                            {messages.map((chatMessage) => (
                                <ChatMessage
                                    key={chatMessage.id}
                                    sender={chatMessage.sender}
                                    content={chatMessage.content}
                                    citations={chatMessage.citations}
                                    isThinking={chatMessage.isThinking}
                                    onCitationClick={handleCitationClick}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="study-chat-bottom">
                    <div className="study-chat-input-wrapper">
                        <ChatInput onSend={handleSend} disabled={isSending} />
                        <p className="study-chat-hint">
                            Responses are referenced directly from your uploaded materials with verifiable citations.
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
                        initialPage={viewingPage}
                        citedSnippet={viewingSnippet}
                        onClose={() => {
                            setViewingDoc(null);
                            setViewingPage(undefined);
                            setViewingSnippet(undefined);
                        }}
                    />
                )}
            </main>
        </div>
    );
};

export default StudyPage;
