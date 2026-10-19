import { useState } from "react";

interface SearchInputProps
  extends React.ComponentProps<"input"> {
  searchable: string[];
}

export default function SearchInput({
  searchable,
  ...inputProps
}: SearchInputProps) {
  const [query, setQuery] = useState("");

  const results = searchable.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <input
        {...inputProps}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          inputProps.onChange?.(e);
        }}
      />

      {query && (
        <ul style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            background: "var(--background-2)",
            width: "100%",
            padding: 10,
            gap: 4
        }} >
          {results.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}