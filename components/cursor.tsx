import type React from "react"

export const Cursor = ({
  className,
  style,
  color,
  name,
}: {
  className?: string
  style?: React.CSSProperties
  color: string
  name: string
}) => {
  return (
    <div className={`pointer-events-none ${className || ""}`} style={style}>
      {/* Custom SVG cursor replacing Lucide's MousePointer2 */}
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
        <path d="M13 13l6 6" />
      </svg>

      <div
        className="mt-1 px-2 py-1 rounded text-xs font-bold text-white text-center"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}
