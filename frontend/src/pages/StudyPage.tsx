import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
import { deleteNotebook, getNotebook, updateNotebook } from "../api/notebooks";
import ChatInput from "../components/ChatInput";
import ChatMessage, {
    type ChatMessageData,
} from "../components/ChatMessage";
import ConfirmDeleteModal from "../components/ConfirmDeleteModal";
import EditNotebookModal from "../components/EditNotebookModal";
import FileUpload from "../components/FileUpload";
import { NotebookIcon } from "../components/NotebookIcon";
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
    notebook?: Notebook;
    onBack?: () => void;
};

const StudyPage = ({ notebook, onBack }: StudyPageProps) => {
    const params = useParams<{ notebookId: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const locationNotebook = (location.state as { notebook?: Notebook } | null)?.notebook;
    const initialNotebook = notebook || locationNotebook;

    const parsedId = params.notebookId ? parseInt(params.notebookId, 10) : NaN;

    const [currentNotebook, setCurrentNotebook] = useState<Notebook | null>(() => {
        if (initialNotebook && (!parsedId || initialNotebook.id === parsedId)) {
            return initialNotebook;
        }
        return null;
    });
    const [isLoadingNotebook, setIsLoadingNotebook] = useState<boolean>(() => {
        if (initialNotebook && (!parsedId || initialNotebook.id === parsedId)) {
            return false;
        }
        return !isNaN(parsedId);
    });
    const [notebookError, setNotebookError] = useState<string | null>(() => {
        if (isNaN(parsedId) && !initialNotebook) {
            return "Invalid notebook ID.";
        }
        return null;
    });

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeletingHistory, setIsDeletingHistory] = useState(false);
    const [docToDelete, setDocToDelete] = useState<DocumentResponse | null>(null);
    const [isDeletingDoc, setIsDeletingDoc] = useState(false);
    const [isDeleteNotebookOpen, setIsDeleteNotebookOpen] = useState(false);
    const [isDeletingNotebook, setIsDeletingNotebook] = useState(false);
    const [messages, setMessages] = useState<ChatMessageData[]>(initialMessages);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    // PDF modal viewing state
    const [viewingDoc, setViewingDoc] = useState<DocumentResponse | null>(null);
    const [viewingPage, setViewingPage] = useState<number | undefined>(undefined);
    const [viewingSnippet, setViewingSnippet] = useState<string | undefined>(undefined);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    const handleBack = useCallback(() => {
        if (onBack) {
            onBack();
        } else {
            navigate("/");
        }
    }, [onBack, navigate]);

    useEffect(() => {
        if (isNaN(parsedId)) {
            return;
        }
        if (currentNotebook && currentNotebook.id === parsedId) {
            return;
        }

        let isMounted = true;

        getNotebook(parsedId)
            .then((data) => {
                if (isMounted) {
                    setCurrentNotebook(data);
                    setIsLoadingNotebook(false);
                }
            })
            .catch((err: unknown) => {
                if (isMounted) {
                    setNotebookError(err instanceof Error ? err.message : "Notebook not found.");
                    setIsLoadingNotebook(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [parsedId, currentNotebook]);

    const handleUpdateNotebook = async (
        id: number,
        name: string,
        color: string,
        icon: string,
    ) => {
        const updated = await updateNotebook(id, { name, color, icon });
        setCurrentNotebook((prev) => (prev ? { ...prev, ...updated } : prev));
    };

    const handleDeleteChatHistory = async () => {
        if (!currentNotebook) return;
        setIsDeletingHistory(true);
        try {
            await deleteNotebookMessages(currentNotebook.id);
            setMessages(initialMessages);
            setIsDeleteConfirmOpen(false);
        } catch (err: unknown) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Failed to delete chat history.",
            );
        } finally {
            setIsDeletingHistory(false);
        }
    };

    const handleDeleteNotebook = async () => {
        if (!currentNotebook) return;
        setIsDeletingNotebook(true);
        try {
            await deleteNotebook(currentNotebook.id);
            setIsDeleteNotebookOpen(false);
            handleBack();
        } catch (err: unknown) {
            alert(
                err instanceof Error
                    ? err.message
                    : "Failed to delete notebook.",
            );
        } finally {
            setIsDeletingNotebook(false);
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
        } catch (err: unknown) {
            console.error("Error deleting document:", err);
            alert(err instanceof Error ? err.message : "Failed to remove document. Please try again.");
        } finally {
            setIsDeletingDoc(false);
        }
    };

    const loadData = useCallback(async (targetNotebookId: number) => {
        setIsLoadingDocs(true);
        setIsLoadingMessages(true);
        setLoadError(null);
        try {
            const [docs, msgs] = await Promise.all([
                getDocumentsByNotebook(targetNotebookId),
                getNotebookMessages(targetNotebookId),
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
        } catch (err: unknown) {
            console.error("Error loading notebook data:", err);
            setLoadError(err instanceof Error ? err.message : "Failed to load study material and conversation.");
        } finally {
            setIsLoadingDocs(false);
            setIsLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (!currentNotebook?.id) return;
        const notebookId = currentNotebook.id;
        let isMounted = true;

        Promise.all([
            getDocumentsByNotebook(notebookId),
            getNotebookMessages(notebookId),
        ])
            .then(([docs, msgs]) => {
                if (!isMounted) return;
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
                setIsLoadingDocs(false);
                setIsLoadingMessages(false);
            })
            .catch((err: unknown) => {
                if (!isMounted) return;
                console.error("Error loading notebook data:", err);
                setLoadError(err instanceof Error ? err.message : "Failed to load study material and conversation.");
                setIsLoadingDocs(false);
                setIsLoadingMessages(false);
            });

        return () => {
            isMounted = false;
        };
    }, [currentNotebook?.id]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (content: string) => {
        const questionText = content.trim();
        if (isSending || !questionText || !currentNotebook) return;

        const randomSuffix = Math.random().toString(36).slice(2, 9);
        const userTempId = `user-${randomSuffix}`;
        const thinkingId = `thinking-${randomSuffix}`;

        const userMessage: ChatMessageData = {
            id: userTempId,
            sender: "user",
            content: questionText,
        };

        const thinkingMessage: ChatMessageData = {
            id: thinkingId,
            sender: "assistant",
            content: "Consulting your study materials…",
            isThinking: true,
        };

        setMessages((prev) => [...prev, userMessage, thinkingMessage]);
        setIsSending(true);

        try {
            const assistantResponse = await sendNotebookMessage(currentNotebook.id, questionText);

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
        } catch (err: unknown) {
            console.error("Error sending question:", err);
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Unable to get a response from the study assistant. Please try again.";

            setMessages((prev) =>
                prev.map((msg) =>
                    msg.id === thinkingId
                        ? {
                              id: `err-${Math.random().toString(36).slice(2, 9)}`,
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
        if (!currentNotebook) return;
        const uploadedDoc = await uploadDocument(file, currentNotebook.id);
        setDocuments((prev) => [uploadedDoc, ...prev]);
    };

    const handleCitationClick = (citation: CitationItem) => {
        const doc =
            documents.find((d) => d.document_id === citation.document_id) || {
                document_id: citation.document_id,
                file_name: citation.file_name,
                notebook_id: currentNotebook?.id || citation.document_id,
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

    if (isLoadingNotebook) {
        return (
            <main className="study-page-state">
                <div className="study-page-state__card">
                    <div className="study-page-state__spinner" />
                    <p>Loading notebook…</p>
                </div>
            </main>
        );
    }

    if (notebookError || !currentNotebook) {
        return (
            <main className="study-page-state">
                <div className="study-page-state__card">
                    <div className="study-page-state__icon">
                        <NotebookIcon icon="book" size={48} />
                    </div>
                    <h2>Notebook Not Found</h2>
                    <p>{notebookError || "The requested notebook could not be found or has been removed."}</p>
                    <button
                        type="button"
                        className="study-page-state__btn"
                        onClick={handleBack}
                    >
                        &larr; Back to Notebooks
                    </button>
                </div>
            </main>
        );
    }

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
                onBack={handleBack}
                onSelectDocument={handleSelectSidebarDoc}
                onEditNotebook={() => setIsEditModalOpen(true)}
                onDeleteChatHistory={() => setIsDeleteConfirmOpen(true)}
                onDeleteDocument={(doc) => setDocToDelete(doc)}
                onDeleteNotebook={() => setIsDeleteNotebookOpen(true)}
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
                            onClick={() => currentNotebook && loadData(currentNotebook.id)}
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

                <ConfirmDeleteModal
                    isOpen={isDeleteNotebookOpen}
                    isDeleting={isDeletingNotebook}
                    title="Delete Notebook?"
                    description={`Are you sure you want to delete "${currentNotebook.name}"? This action cannot be undone.`}
                    notice="All uploaded study materials, PDF files, generated vector embeddings, and chat history will be permanently deleted."
                    confirmLabel="Delete Notebook"
                    onConfirm={handleDeleteNotebook}
                    onClose={() => {
                        if (!isDeletingNotebook) setIsDeleteNotebookOpen(false);
                    }}
                />
            </main>
        </div>
    );
};

export default StudyPage;
