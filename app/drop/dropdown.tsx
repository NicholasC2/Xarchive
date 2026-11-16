"use client";

import { useState } from "react";
import "./drop.css";

interface DropDownProps extends Omit<React.ComponentProps<"input">, "type"> {
  items?: string[];
  maxResults?: number;
}

export default function DropDown({
  items = [],
  maxResults,
  onChange,
  ...inputProps
}: DropDownProps) {
  const [query, setQuery] = useState(String(inputProps.value ?? ""));
  const results = items
    .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, maxResults ?? 99999);

  const [showResults, setShowResults] = useState(false);

  return (
    <div className="drop">
      <input
        {...inputProps}
        className={"drop-input " + inputProps.className}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          inputProps.onKeyDown?.(event);
          if (event.key === "Tab" && results.length > 0) {
            event.preventDefault();
            setQuery(results[0]);
          }
        }}
        onFocus={() => setShowResults(true)}
        onBlur={() => setShowResults(false)}
      />
        {showResults && results.length > 0 && (
          <ul className="drop-list" role="listbox">
            {results.map((item) => (
              <li
                key={item}
                title={item}
                role="option"
                aria-selected="false"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setQuery(item);
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
