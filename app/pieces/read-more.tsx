"use client";

import { useState } from "react";
import "./read-more.css";

export default function ReadMore({
  text,
  lines,
  label = "Read more",
}: {
  text: string;
  lines: number;
  label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  return (
    <div className={`read-more ${expanded ? "read-more-expanded" : ""}`} style={{ "--read-more-lines": lines } as React.CSSProperties}>
      <p>{text}</p>
      <button type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        {expanded ? "Show less" : label}
      </button>
    </div>
  );
}
