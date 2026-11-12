import { markShapes, type MarkShape } from "@/data/marks";
import { useId } from "react";

export type { MarkId } from "@/data/marks";

function Shape({ shape }: { shape: MarkShape }) {
  switch (shape.shape) {
    case "path":
      return <path d={shape.d} />;
    case "circle":
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} />;
    case "rect":
      return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx} />;
  }
}

export function Mark({ id, className = "h-4 w-4" }: { id: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {markShapes(id).map((shape, index) => (
        <Shape key={index} shape={shape} />
      ))}
    </svg>
  );
}

export function HilbrasMark({ className = "h-5 w-5" }: { className?: string }) {
  const light = useId();
  const streak = useId();

  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={light} x1="3" y1="2.25" x2="20.9" y2="21.75">
          <stop offset="0" stopColor="currentColor" stopOpacity="1" />
          <stop offset="0.45" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={streak} x1="6" y1="18" x2="18.75" y2="5.25">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      <path
        d="M12 2.625 20.25 7.3125v9.375L12 21.375 3.75 16.6875V7.3125Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.35"
      />
      <path
        d="M12 4.125 18.9375 7.875v8.25L12 19.875 5.0625 16.125V7.875Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity="0.16"
      />

      <path
        d="M8.8125 16.875 17.0625 6.75"
        stroke={`url(#${streak})`}
        strokeWidth="0.6"
        strokeLinecap="round"
        opacity="0.55"
      />

      <path d="M7.3125 7.125H9.9375V10.6875H14.0625V7.125H16.6875V16.875H14.0625V13.3125H9.9375V16.875H7.3125Z" fill={`url(#${light})`} />
      <path d="M7.3125 7.125H9.9375V7.65H7.8375V16.5H7.3125Z" fill="currentColor" opacity="0.35" />

      <path
        d="M17.625 4.3125l0.7125 1.725 1.725 0.7125-1.725 0.7125L17.625 9.1875l-0.7125-1.725-1.725-0.7125 1.725-0.7125Z"
        fill={`url(#${light})`}
      />
      <circle cx="17.625" cy="6.75" r="0.5625" fill="currentColor" />

      <circle cx="6.9375" cy="17.0625" r="0.525" fill={`url(#${light})`} />
    </svg>
  );
}
