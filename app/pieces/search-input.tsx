import { useMemo, useState } from "react";

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
  value,
  onChange,
  ...inputProps
}: SearchInputProps) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState(typeof value === "string" ? value : "");
  const query = isControlled ? String(value ?? "") : internalQuery;

  const normalizedQuery = query.toLowerCase();
  const querySegment = splitAt ? normalizedQuery.split(splitAt).at(-1) ?? "" : normalizedQuery;

  const results = useMemo(() => {
    const filtered = searchable.filter((item) => {
      const candidate = item.toLowerCase();
      return candidate.includes(querySegment) || candidate.startsWith(querySegment);
    });

    return filtered.slice(0, maxResults);
  }, [searchable, querySegment, maxResults]);

  const selectResult = (item: string, fill = true) => {
    if (!fill) {
      onClickItem?.(item);
      return;
    }

    const nextValue = splitAt && query.includes(splitAt)
      ? query.slice(0, query.lastIndexOf(splitAt) + splitAt.length) + item
      : item;

    if (!isControlled) {
      setInternalQuery(nextValue);
    }

    const nextTarget = { ...inputProps, value: nextValue } as unknown as HTMLInputElement;
    const syntheticEvent = {
      target: nextTarget,
      currentTarget: nextTarget,
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    onChange?.(syntheticEvent);
    onClickItem?.(item);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalQuery(event.target.value);
    }
    onChange?.(event);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        {...inputProps}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={(event) => {
          inputProps.onKeyDown?.(event);

          if (event.key === "Tab" && results.length > 0) {
            event.preventDefault();
            selectResult(results[0]);
          }

          if (event.key === "Enter" && results.length > 0 && query) {
            event.preventDefault();
            selectResult(results[0]);
          }
        }}
      />

      {query && results.length > 0 && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            inset: "calc(100% + 4px) 0 auto 0",
            boxSizing: "border-box",
            background: "var(--background-2, #101010)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10,
            width: "100%",
            padding: 8,
            gap: 4,
            margin: 0,
            listStyle: "none",
            zIndex: 20,
            boxShadow: "0 18px 42px rgba(0, 0, 0, 0.28)",
          }}
        >
          {results.map((item) => (
            <li key={item} style={{ listStyle: "none" }}>
              <button
                type="button"
                title={item}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectResult(item, clickFill);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  color: "inherit",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  padding: "8px 10px",
                  borderRadius: 8,
                }}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}