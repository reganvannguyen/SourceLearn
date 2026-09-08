import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

type FileUploadProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void | Promise<void>;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / 1024 ** unitIndex;

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const FileUpload = ({ isOpen, onClose, onConfirm }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const isConfirmingRef = useRef(false);
  const fileInputId = useId();
  const titleId = useId();
  const descriptionId = useId();

  const handleClose = useCallback(() => {
    isConfirmingRef.current = false;
    setSelectedFile(null);
    setIsDragging(false);
    setConfirmError(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirmingRef.current) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, handleClose]);

  if (!isOpen) {
    return null;
  }

  const selectFile = (file: File | undefined) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setConfirmError(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  };

  const handleConfirm = async () => {
    if (!selectedFile || isConfirming) {
      return;
    }

    isConfirmingRef.current = true;
    setIsConfirming(true);
    setConfirmError(null);

    try {
      await onConfirm(selectedFile);
      handleClose();
    } catch (error) {
      setConfirmError(
        error instanceof Error
          ? error.message
          : "The file could not be uploaded. Please try again.",
      );
    } finally {
      isConfirmingRef.current = false;
      setIsConfirming(false);
    }
  };

  return (
    <div
      className="file-upload__backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isConfirming) {
          handleClose();
        }
      }}
    >
      <section
        className="file-upload__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <header className="file-upload__header">
          <div>
            <h2 id={titleId}>Add study material</h2>
            <p id={descriptionId}>Choose a file or drag it into the area below.</p>
          </div>
          <button
            ref={closeButtonRef}
            className="file-upload__close"
            type="button"
            aria-label="Close file upload"
            title="Close"
            disabled={isConfirming}
            onClick={handleClose}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m6 6 12 12M18 6 6 18"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </header>

        <div className="file-upload__body">
          <div
            className={`file-upload__dropzone${isDragging ? " file-upload__dropzone--dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              id={fileInputId}
              className="sr-only"
              type="file"
              aria-label="Choose study material"
              onChange={handleFileChange}
            />
            <svg className="file-upload__upload-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 16V4m0 0L7 9m5-5 5 5M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <p className="file-upload__dropzone-title">Drag and drop your file here</p>
            <p className="file-upload__dropzone-subtitle">or</p>
            <button
              className="file-upload__browse"
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Choose a file
            </button>
          </div>

          {selectedFile && (
            <div className="file-upload__selected-file">
              <div className="file-upload__file-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Zm0 0v6h6"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                  />
                </svg>
              </div>
              <div className="file-upload__file-details">
                <p className="file-upload__file-name">{selectedFile.name}</p>
                <p className="file-upload__file-meta">
                  {selectedFile.type || "Unknown file type"} · {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                className="file-upload__remove"
                type="button"
                disabled={isConfirming}
                onClick={() => {
                  setSelectedFile(null);
                  setConfirmError(null);
                }}
              >
                Remove
              </button>
            </div>
          )}

          {confirmError && (
            <p className="file-upload__error" role="alert">
              {confirmError}
            </p>
          )}
        </div>

        <footer className="file-upload__footer">
          <button
            className="file-upload__cancel"
            type="button"
            disabled={isConfirming}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="file-upload__confirm"
            type="button"
            disabled={!selectedFile || isConfirming}
            onClick={handleConfirm}
          >
            {isConfirming ? "Uploading…" : "Confirm file"}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default FileUpload;
