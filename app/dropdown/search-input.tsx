"use client";

import { useEffect, useRef, useState } from "react";
import "./dropdown.css";
import { createPortal } from "react-dom";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
	searchable?: string[] | ((query: string) => Promise<string[]>);
	maxResults?: number;
	splitAt?: string | null;
	clickFill?: boolean;
	alwaysShow?: boolean;
	onClickItem?: (text: string) => void;
}

export default function SearchInput({
	searchable = [],
	maxResults = 10,
	splitAt = ", ",
	clickFill = true,
	alwaysShow = false,
	onClickItem,
	defaultValue,
	value,
	onChange,
	...inputProps
}: SearchInputProps) {
	const [internalQuery, setInternalQuery] = useState(String(defaultValue ?? ""));
	const [focused, setFocused] = useState(false);
	const [results, setResults] = useState<string[]>([]);

	const query = value !== undefined ? String(value) : internalQuery;

	async function search(nextQuery: string) {
		const currentQuery = splitAt
			? nextQuery.toLowerCase().split(splitAt).at(-1) ?? ""
			: nextQuery.toLowerCase();

		try {
			const items = typeof searchable === "function"
				? await searchable(currentQuery)
				: searchable;

			setResults(
				items
					.filter(item =>
						!currentQuery || item.toLowerCase().startsWith(currentQuery)
					)
					.slice(0, maxResults)
			);
		} catch (error) {
			console.error("Search failed:", error);
			setResults([]);
		}
	}

	function updateQuery(nextValue: string, event?: React.ChangeEvent<HTMLInputElement>) {
		setInternalQuery(nextValue);
		search(nextValue);

		if (event) onChange?.(event);
	}

	function selectResult(item: string) {
		if (!clickFill) return;

		const nextValue = splitAt && query.includes(splitAt)
			? query.slice(0, query.lastIndexOf(splitAt) + splitAt.length) + item
			: item;

		updateQuery(nextValue);

		onChange?.({
			target: { value: nextValue },
		} as React.ChangeEvent<HTMLInputElement>);
	}

	const inputRef = useRef<HTMLInputElement>(null);
	const [rect, setRect] = useState<DOMRect | null>(null);

	useEffect(() => {
		function updatePosition() {
			const element = inputRef.current;
			if (!element) return;

			setRect(element.getBoundingClientRect());
		}

		updatePosition();

		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);

		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, []);

	return (
		<div className="dropdown">
			<input
				{...inputProps}
				className={"drop-input " + (inputProps.className ?? "")}
				type="text"
				value={query}
				onChange={event => updateQuery(event.target.value, event)}
				onKeyDown={event => {
					inputProps.onKeyDown?.(event);

					if (event.key === "Tab" && results.length > 0) {
						event.preventDefault();
						selectResult(results[0]);
					}
				}}
				onFocus={event => {
					setFocused(true);
					inputProps.onFocus?.(event);
				}}
				onBlur={event => {
					setFocused(false);
					inputProps.onBlur?.(event);
				}}
				ref={inputRef}
			/>

			{(query || (alwaysShow && focused)) && results.length > 0 && 
				createPortal(
					<ul 
						className="drop-list"
						style={{
							top: rect?.bottom,
							left: rect?.left,
							width: rect?.width,
						}}
					>
						{results.map((item, index) => (
							<li
								key={`${item}-${index}`}
								title={item}
								role="option"
								aria-selected="false"
								onMouseDown={event => {
									event.preventDefault();
									selectResult(item);
									onClickItem?.(item);
								}}
							>
								{item}
							</li>
						))}
					</ul>,
					document.body
				)
			}
		</div>
	);
}