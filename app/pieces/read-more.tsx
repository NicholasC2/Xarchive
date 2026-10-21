"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import "./read-more.css";

type ReadMoreProps = {
  children: ReactNode;
  className?: string;
  maxLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
};

export default function ReadMore({
  children,
  className = "",
  maxLines = 2,
  expandLabel = "Show more",
  collapseLabel = "Show less",
}: ReadMoreProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const style = window.getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight) || 18;
    const maxHeight = lineHeight * maxLines + 1;
    const nextOverflow = element.scrollHeight > maxHeight + 2 || element.scrollWidth > element.clientWidth + 1;
    setHasOverflow(nextOverflow);
  }, [children, maxLines]);

  const shouldClamp = !expanded && hasOverflow;

  return (
    <div className={`read-more ${className}`.trim()}>
      <div
        ref={contentRef}
        className={`read-more-content ${shouldClamp ? "is-clamped" : "is-expanded"}`}
        style={shouldClamp ? ({ WebkitLineClamp: maxLines } as CSSProperties) : undefined}
      >
        {children}
      </div>
      {hasOverflow && (
        <button type="button" className="read-more-toggle" onClick={() => setExpanded((current) => !current)}>
          {expanded ? collapseLabel : expandLabel}
        </button>
      )}
    </div>
  );
}
