import { useState } from "react";

interface SearchInputProps extends React.ComponentProps<"input"> {
  searchable: string[];
  maxResults?: number;
  splitAt?: string;
  clickFill?: boolean;
  onClickItem?: (text: string) => void;
}

export default function SearchInput({
  searchable,
  maxResults = 10,
  splitAt,
  clickFill = true,
  onClickItem,
  ...inputProps
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const results = searchable
    .filter((item) =>
      item.toLowerCase().startsWith(
        splitAt
          ? query.toLowerCase().split(splitAt).at(-1) ?? ""
          : query.toLowerCase()
      )
    )
    .slice(0, maxResults);

  const selectResult = (item: string, fill = true) => {
    if (fill) {
      const value =
        splitAt && query.includes(splitAt)
          ? query.slice(0, query.lastIndexOf(splitAt) + splitAt.length) +
            item
          : item;

      setQuery(value);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        {...inputProps}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          inputProps.onChange?.(e);
        }}
        onKeyDown={(e) => {
          inputProps.onKeyDown?.(e);

          if (e.key === "Tab" && results.length > 0) {
            e.preventDefault();
            selectResult(results[0]);
          }
        }}
      />

      {query && results.length > 0 && (
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            boxSizing: "border-box",
            background: "var(--background-2)",
            width: "100%",
            padding: 10,
            gap: 4,
            margin: 0,
            listStyle: "none",
            zIndex: 10,
          }}
        >
          {results.map((item) => (
            <li
              key={item}
              title={item}
              onMouseDown={(e) => {
                e.preventDefault();
                selectResult(item, clickFill);
                onClickItem?.(item);
              }}
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
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