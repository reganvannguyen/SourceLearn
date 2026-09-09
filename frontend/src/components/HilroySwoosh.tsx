type HilroySwooshProps = {
  id: string | number;
  color?: string;
};

const SWOOSH_WIDTH = 64;
const SWOOSH_HEIGHT = 290;
const PATH_D = `M 24 0 C 26 80, 10 180, 0 ${SWOOSH_HEIGHT} L ${SWOOSH_WIDTH} ${SWOOSH_HEIGHT} L ${SWOOSH_WIDTH} 0 Z`;

// Evenly spaced horizontal ruled lines across full height
const LINE_Y_COORDS = Array.from(
  { length: Math.floor(SWOOSH_HEIGHT / 13) },
  (_, i) => (i + 1) * 13
);

export const HilroySwoosh = ({ id, color = "#ffffff" }: HilroySwooshProps) => {
  const clipId = `hilroy-swoosh-${id}`;

  return (
    <svg
      className="notebook-card__swoosh"
      viewBox={`0 0 ${SWOOSH_WIDTH} ${SWOOSH_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={PATH_D} />
        </clipPath>
      </defs>
      <path d={PATH_D} fill="#111827" />
      <g
        clipPath={`url(#${clipId})`}
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.75"
      >
        {LINE_Y_COORDS.map((y) => (
          <line key={y} x1="0" y1={y} x2={SWOOSH_WIDTH} y2={y} />
        ))}
      </g>
    </svg>
  );
};
