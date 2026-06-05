import React from "react";

export function Badge({ children, tone = "default", className = "" }) {
  return (
    <span className={`ui-badge ui-badge--${tone} ${className}`.trim()}>
      {children}
    </span>
  );
}
