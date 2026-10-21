"use client";

import { useState } from "react";
import "./search-input.css";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  searchable?: string[];
  maxResults?: number;
  splitAt?: string;
  clickFill?: boolean;
  onClickItem?: (text: string) => void;
}

export default function SearchInput({
  searchable = [],
  maxResults = 10,
  splitAt,
  clickFill = true,
  onClickItem,
  defaultValue,
  onChange,
  ...inputProps
}: SearchInputProps) {
  const [query, setQuery] = useState(String(defaultValue ?? inputProps.value ?? ""));
  const results = searchable
    .filter((item) => item.toLowerCase().startsWith(
      splitAt ? query.toLowerCase().split(splitAt).at(-1) ?? "" : query.toLowerCase(),
    ))
    .slice(0, maxResults);

  function selectResult(item: string) {
    if (!clickFill) return;
    const value = splitAt && query.includes(splitAt)
      ? query.slice(0, query.lastIndexOf(splitAt) + splitAt.length) + item
      : item;
    setQuery(value);
  }

  return (
    <div className="search-input">
      <input
        {...inputProps}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          onChange?.(event);
        }}
        onKeyDown={(event) => {
          inputProps.onKeyDown?.(event);
          if (event.key === "Tab" && results.length > 0) selectResult(results[0]);
        }}
      />
      {query && results.length > 0 && (
        <ul className="search-input-options" role="listbox">
          {results.map((item) => (
            <li
              key={item}
              title={item}
              role="option"
              aria-selected="false"
              onMouseDown={(event) => {
                event.preventDefault();
                selectResult(item);
                onClickItem?.(item);
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
