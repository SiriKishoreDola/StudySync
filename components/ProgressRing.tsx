// A circle that fills up to `percent`. Styled inline so it works anywhere.
export default function ProgressRing({
  percent,
  size = 56,
  caption,
}: {
  percent: number;
  size?: number;
  caption?: string;
}) {
  const stroke = 5;
  const r = (size - stroke) / 2; // radius
  const len = 2 * Math.PI * r; // circumference
  const mid = size / 2;

  return (
    <div style={{ textAlign: "center", flexShrink: 0 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle cx={mid} cy={mid} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
          <circle
            cx={mid} cy={mid} r={r} fill="none" stroke="var(--ink)" strokeWidth={stroke}
            strokeDasharray={`${(len * percent) / 100} ${len}`}
            transform={`rotate(-90 ${mid} ${mid})`} // start at the top
          />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600 }}>
          {percent}%
        </span>
      </div>
      {caption && <div style={{ fontSize: 10, color: "var(--soft)", marginTop: 2 }}>{caption}</div>}
    </div>
  );
}