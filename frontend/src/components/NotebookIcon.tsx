import type { FC, SVGProps } from "react";

export type NotebookIconId =
  | "book"
  | "maple"
  | "code"
  | "science"
  | "math"
  | "brain"
  | "quill"
  | "history"
  | "art"
  | "music"
  | "rocket"
  | "globe";

export const NOTEBOOK_ICONS: { id: NotebookIconId; label: string }[] = [
  { id: "book", label: "Book" },
  { id: "maple", label: "Maple Leaf" },
  { id: "code", label: "Code" },
  { id: "science", label: "Science" },
  { id: "math", label: "Math" },
  { id: "brain", label: "Brain" },
  { id: "quill", label: "Writing" },
  { id: "history", label: "History" },
  { id: "art", label: "Art" },
  { id: "music", label: "Music" },
  { id: "rocket", label: "Physics" },
  { id: "globe", label: "Geography" },
];

interface NotebookIconProps extends SVGProps<SVGSVGElement> {
  icon?: string;
  size?: number;
}

export const NotebookIcon: FC<NotebookIconProps> = ({
  icon = "book",
  size = 48,
  className = "",
  ...props
}) => {
  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    className: `notebook-icon ${className}`.trim(),
    "aria-hidden": true,
    ...props,
  };

  switch (icon) {
    case "maple":
      return (
        <svg {...commonProps}>
          {/* Authentic Stylized Maple Leaf */}
          <path d="M12 2l1.6 3.8 2.8-.8-1 3.2 3.6.4-.8 2.6 3.2 2-2.6 1.8 1.4 3.4-3.4-.6-1.2 2.8-2.6-2.2-.6 4.6h-1l-.6-4.6-2.6 2.2-1.2-2.8-3.4.6 1.4-3.4-2.6-1.8 3.2-2-.8-2.6 3.6-.4-1-3.2 2.8.8L12 2z" />
        </svg>
      );

    case "code":
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" strokeWidth="2" />
        </svg>
      );

    case "science":
      return (
        <svg {...commonProps}>
          {/* Chemistry Erlenmeyer Flask */}
          <path d="M19.7 18.2l-4.7-7.8V5h1V3H8v2h1v5.4L4.3 18.2c-.8 1.3-.8 2.8-.2 3.8.7 1 1.9 1.5 3.4 1.5h9c1.5 0 2.7-.5 3.4-1.5.6-1 .6-2.5-.2-3.8zM11 5h2v5.4l.6 1H10.4l.6-1V5zm-4.7 15l3.1-5h5.2l3.1 5H6.3z" />
          <circle cx="10" cy="17.5" r="1" />
          <circle cx="14" cy="16.5" r="1.2" />
        </svg>
      );

    case "math":
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="2" fill="currentColor" />
          <path d="M12 7L6 21" />
          <path d="M12 7l6 14" />
          <line x1="8" y1="15" x2="16" y2="15" strokeWidth="1.8" />
        </svg>
      );

    case "brain":
      return (
        <svg {...commonProps}>
          {/* Brain Silhouette */}
          <path d="M12 4.2c-.8 0-1.5.3-2.1.8-.7-.6-1.6-1-2.6-1-2.1 0-3.8 1.7-3.8 3.8 0 .4.1.8.2 1.2C2.7 9.8 2 11 2 12.5c0 1.6 1 3 2.5 3.5 0 .3-.1.7-.1 1 0 2.2 1.8 4 4 4 .9 0 1.7-.3 2.4-.8.4.5 1 .8 1.7.8h.5c.7 0 1.3-.3 1.7-.8.7.5 1.5.8 2.4.8 2.2 0 4-1.8 4-4 0-.3 0-.7-.1-1 1.5-.5 2.5-1.9 2.5-3.5 0-1.5-.7-2.7-1.7-3.5.1-.4.2-.8.2-1.2 0-2.1-1.7-3.8-3.8-3.8-1 0-1.9.4-2.6 1-.6-.5-1.3-.8-2.1-.8h-1zm-.5 2.2v12.2c-.3 0-.7-.1-1-.3-.6.6-1.5.9-2.3.9-1.2 0-2.2-1-2.2-2.2 0-.2 0-.5.1-.7-.8-.4-1.3-1.2-1.3-2.1 0-.9.5-1.6 1.2-2 .4-.2.6-.6.5-1-.2-.5-.3-1-.3-1.5 0-1.2 1-2.2 2.2-2.2.6 0 1.2.3 1.6.7.3.3.7.4 1 .2.5-.5.9-.8 1.5-.9zm2 0c.6.1 1 .4 1.5.9.3.2.7.1 1-.2.4-.4 1-.7 1.6-.7 1.2 0 2.2 1 2.2 2.2 0 .5-.1 1-.3 1.5-.1.4.1.8.5 1 .7.4 1.2 1.1 1.2 2 0 .9-.5 1.7-1.3 2.1.1.2.1.5.1.7 0 1.2-1 2.2-2.2 2.2-.8 0-1.7-.3-2.3-.9-.3.2-.7.3-1 .3V6.4z" />
        </svg>
      );

    case "quill":
      return (
        <svg {...commonProps}>
          {/* Vintage Quill & Pen Nib */}
          <path d="M21.7 2.3c-.6-.6-1.6-.6-2.2 0l-9.8 9.8c-.8.8-1.3 1.8-1.5 2.9l-.7 4.2c-.1.6.4 1.1 1 1l4.2-.7c1.1-.2 2.1-.7 2.9-1.5l9.8-9.8c.6-.6.6-1.6 0-2.2l-3.7-3.7zm-2.7 4.1L16.6 4l1.8-1.8 2.4 2.4-1.8 1.8zm-2.8 1.4l-7.7 7.7c-.5.5-1.1.8-1.8.9l-2.4.4.4-2.4c.1-.7.4-1.3.9-1.8l7.7-7.7 2.9 2.9z" />
          <path d="M3 21h8v2H3z" />
        </svg>
      );

    case "history":
      return (
        <svg {...commonProps}>
          {/* Classical Temple Architecture */}
          <path d="M12 2L2 7v2h20V7L12 2zm8 16H4v-7h2v7h3v-7h2v7h2v-7h2v7h3v-7h2v7zm2 2H2v2h20v-2z" />
        </svg>
      );

    case "art":
      return (
        <svg {...commonProps}>
          {/* Artist Palette */}
          <path d="M12 2C6.5 2 2 6.5 2 12c0 3.6 2 6.8 5 8.4V20c0-1.1.9-2 2-2h1.6c.8 0 1.4.6 1.4 1.4v.4c0 1.2 1 2.2 2.2 2.2h.8c4.4 0 8-3.6 8-8 0-6.6-4.9-12-11-12zm-4.5 9c-.8 0-1.5-.7-1.5-1.5S6.7 8 7.5 8s1.5.7 1.5 1.5S8.3 11 7.5 11zm3.5-3c-.8 0-1.5-.7-1.5-1.5S10.2 5 11 5s1.5.7 1.5 1.5S11.8 8 11 8zm4 0c-.8 0-1.5-.7-1.5-1.5S14.2 5 15 5s1.5.7 1.5 1.5S15.8 8 15 8zm3.5 3c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
        </svg>
      );

    case "music":
      return (
        <svg {...commonProps}>
          {/* Musical Beam Notes */}
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );

    case "rocket":
      return (
        <svg {...commonProps}>
          {/* Space Rocket */}
          <path d="M13.13 2.18c-1.39-.77-3.08-.73-4.44.11-2.73 1.68-4.44 4.54-4.8 7.74-.29 2.56.45 5.17 2.06 7.23L4 20l2.73-1.95c2.06 1.61 4.67 2.35 7.23 2.06 3.2-.36 6.06-2.07 7.74-4.8.84-1.36.88-3.05.11-4.44l-8.68-8.69zm-1.07 3.96c.78-.78 2.05-.78 2.83 0s.78 2.05 0 2.83-2.05.78-2.83 0-.78-2.05 0-2.83zM6.9 14.1c-.84-1.24-1.23-2.73-1.09-4.22.25-2.58 1.64-4.87 3.8-6.19l7.7 7.7c-1.32 2.16-3.61 3.55-6.19 3.8-1.49.14-2.98-.25-4.22-1.09z" />
        </svg>
      );

    case "globe":
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );

    case "book":
    default:
      return (
        <svg {...commonProps}>
          {/* Classic Open Study Textbook */}
          <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm-1 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
        </svg>
      );
  }
};
