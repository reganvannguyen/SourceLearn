import { useEffect, useRef, useState, useCallback } from "react";
import {
    deleteDocument,
    getDocumentsByNotebook,
    uploadDocument,
    type DocumentResponse,
} from "../api/documents";
import {
    deleteNotebookMessages,
    getNotebookMessages,
    sendNotebookMessage,
    type CitationItem,
} from "../api/messages";
import type { Notebook } from "../api/notebooks";
import { updateNotebook } from "../api/notebooks";
import ChatInput from "../components/ChatInput";
import ChatMessage, {
    type ChatMessageData,
} from "../components/ChatMessage";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import EditNotebookModal from "../components/EditNotebookModal";
import FileUpload from "../components/FileUpload";
import PdfViewerPane from "../components/PdfViewerPane";
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
    const [currentNotebook, setCurrentNotebook] = useState<Notebook>(notebook);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingHistory, setIsDeletingHistory] = useState(false);
    const [docToDelete, setDocToDelete] = useState<DocumentResponse | null>(null);
    const [isDeletingDoc, setIsDeletingDoc] = useState(false);
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const handleUpdateNotebook = async (
        id: number,
        name: string,
        color: string,
        icon: string,
    ) => {
        const updated = await updateNotebook(id, { name, color, icon });
        setCurrentNotebook((prev) => ({ ...prev, ...updated }));
    };

    const handleDeleteChatHistory = async () => {
        setIsDeletingHistory(true);
        try {
            await deleteNotebookMessages(currentNotebook.id);
            setMessages(initialMessages);
            setIsDeleteConfirmOpen(false);
        } catch (err: any) {
            console.error("Error deleting chat history:", err);
            alert(err?.message || "Failed to delete chat history. Please try again.");
        } finally {
            setIsDeletingHistory(false);
        }
    };

    const handleConfirmDeleteDocument = async () => {
        if (!docToDelete) return;
        setIsDeletingDoc(true);
        try {
            await deleteDocument(docToDelete.document_id);
            setDocuments((prev) => prev.filter((d) => d.document_id !== docToDelete.document_id));
            if (viewingDoc?.document_id === docToDelete.document_id) {
                setViewingDoc(null);
                setViewingPage(undefined);
                setViewingSnippet(undefined);
            }
            setDocToDelete(null);
        } catch (err: any) {
            console.error("Error deleting document:", err);
            alert(err?.message || "Failed to remove document. Please try again.");
        } finally {
            setIsDeletingDoc(false);
        }
    };

    // PDF modal viewing state
    const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);
    const [viewingPage, setViewingPage] = useState<number | undefined>(undefined);
    const [viewingSnippet, setViewingSnippet] = useState<string | undefined>(undefined);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    const loadData = useCallback(async () => {
        setIsLoadingDocs(true);
        setIsLoadingMessages(true);
        setLoadError(null);
        try {
            const [docs, msgs] = await Promise.all([
                getDocumentsByNotebook(notebook.id),
                getNotebookMessages(notebook.id),
            ]);

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
        } catch (err: any) {
            console.error("Error loading notebook data:", err);
            setLoadError(err?.message || "Failed to load study material and conversation.");
        } finally {
            setIsLoadingDocs(false);
            setIsLoadingMessages(false);
        }
    }, [notebook.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (content: string) => {
        const questionText = content.trim();
        if (isSending || !questionText) return;

        const userTempId = `user-${Date.now()}`;
        const thinkingId = `thinking-${Date.now()}`;

        const userMessage: ChatMessageData = {
            id: userTempId,
            sender: "user",
            content: questionText,
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
            const assistantResponse = await sendNotebookMessage(notebook.id, questionText);

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
            const errorMessage =
                err?.message ||
                "Unable to get a response from the study assistant. Please try again.";

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === thinkingId
                        ? {
                              id: `err-${Date.now()}`,
                              sender: "assistant",
                              content: errorMessage,
                              isError: true,
                              onRetry: () => handleSend(questionText),
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
        if (viewingDoc?.document_id === doc.document_id) {
            setViewingDoc(null);
            setViewingPage(undefined);
            setViewingSnippet(undefined);
        } else {
            setViewingPage(undefined);
            setViewingSnippet(undefined);
            setViewingDoc(doc);
        }
    };

    const notebookColor = currentNotebook.color || "#7eaed7";

    return (
        <div
            className="study-layout"
            style={{ "--notebook-color": notebookColor } as React.CSSProperties}
        >
            <StudySidebar
                notebook={currentNotebook}
                documents={documents}
                activeDocumentId={viewingDoc?.document_id}
                isLoadingDocs={isLoadingDocs}
                onAddMaterial={() => setIsUploadOpen(true)}
                onBack={onBack}
                onSelectDocument={handleSelectSidebarDoc}
                onEditNotebook={() => setIsEditModalOpen(true)}
                onDeleteChatHistory={() => setIsDeleteConfirmOpen(true)}
                onDeleteDocument={(doc) => setDocToDelete(doc)}
            />

            <main className="study-main">
                {loadError && (
                    <div className="study-load-error" role="alert">
                        <span className="study-load-error__icon">
                            <svg
                                viewBox="0 0 24 24"
                                width="16"
                                height="16"
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
                        <span className="study-load-error__text">{loadError}</span>
                        <button
                            type="button"
                            className="study-load-error__btn"
                            onClick={loadData}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className={`study-workspace ${viewingDoc ? "study-workspace--split" : ""}`}>
                    {viewingDoc && (
                        <div className="study-workspace__pdf-pane">
                            <PdfViewerPane
                                document={viewingDoc}
                                initialPage={viewingPage}
                                citedSnippet={viewingSnippet}
                                highlightColor={notebookColor}
                                onClose={() => {
                                    setViewingDoc(null);
                                    setViewingPage(undefined);
                                    setViewingSnippet(undefined);
                                }}
                            />
                        </div>
                    )}

                    <div className="study-workspace__chat-pane">
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
                                            isError={chatMessage.isError}
                                            onRetry={chatMessage.onRetry}
                                            onCitationClick={handleCitationClick}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="study-chat-bottom">
                            <div className="study-chat-input-wrapper">
                                <ChatInput onSend={handleSend} disabled={isSending} />
                            </div>
                        </div>
                    </div>
                </div>

                {isUploadOpen && (
                    <FileUpload
                        isOpen={isUploadOpen}
                        onClose={() => setIsUploadOpen(false)}
                        onConfirm={handleFileConfirm}
                    />
                )}

                <EditNotebookModal
                    notebook={currentNotebook}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateNotebook}
                />

                <ConfirmDeleteModal
                    isOpen={isDeleteConfirmOpen}
                    isDeleting={isDeletingHistory}
                    onConfirm={handleDeleteChatHistory}
                    onClose={() => {
                        if (!isDeletingHistory) setIsDeleteConfirmOpen(false);
                    }}
                />

                <ConfirmDeleteModal
                    isOpen={!!docToDelete}
                    isDeleting={isDeletingDoc}
                    title="Remove Document?"
                    description={`Are you sure you want to remove "${docToDelete?.file_name}" from this notebook? All indexed vector embeddings and document chunks will be permanently removed from the database.`}
                    confirmLabel="Remove Document"
                    onConfirm={handleConfirmDeleteDocument}
                    onClose={() => {
                        if (!isDeletingDoc) setDocToDelete(null);
                    }}
                />
            </main>
        </div>
    );
};

export default StudyPage;
