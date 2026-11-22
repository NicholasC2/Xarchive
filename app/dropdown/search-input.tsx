"use client";

import { useEffect, useRef, useState } from "react";
import "./dropdown.css";
import { createPortal } from "react-dom";
import { Album, Artist, Song } from "@/lib/db";
import Entry from "../peices/entry";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "type"> {
	searchable?: (string | Song | Album | Artist)[] | ((query: string) => Promise<(string | Song | Album | Artist)[]>);
	maxResults?: number;
	splitAt?: string | null;
	clickFill?: boolean;
	alwaysShow?: boolean;
	followLinks?: boolean;
	onClickItem?: (entry: (string | Song | Album | Artist)) => void;
}

export default function SearchInput({
	searchable = [],
	maxResults = 10,
	splitAt = ", ",
	clickFill = true,
	alwaysShow = false,
	followLinks = false,
	onClickItem,
	defaultValue,
	value,
	onChange,
	...inputProps
}: SearchInputProps) {
	const [internalQuery, setInternalQuery] = useState(String(defaultValue ?? ""));
	const [focused, setFocused] = useState(false);
	const [results, setResults] = useState<(string | Album | Artist | Song)[]>([]);

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
						!currentQuery || (typeof item == "string" ? item : item.name).toLowerCase().startsWith(currentQuery)
					)
					.slice(0, maxResults)
			);
		} catch (error) {
			console.error("Search failed:", error);
			setResults([]);
		}
	}

	function updateQuery(
		nextValue: string,
		event?: React.ChangeEvent<HTMLInputElement>
	) {
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

	useEffect(() => {
		if (value !== undefined) {
			setInternalQuery(String(value));
		}
	}, [value]);

	useEffect(() => {
		search(query);
	}, [searchable])

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
						selectResult(typeof results[0] == "string" ? results[0] : results[0].name);
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

			{!alwaysShow && focused && results.length > 0 && 
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
								title={typeof item == "string" ? item : item.name}
								role="option"
								aria-selected="false"
								onMouseDown={event => {
									event.preventDefault();
									if(typeof item == "string" || !followLinks) {
										selectResult(typeof item == "string" ? item : item.name);
									}
									onClickItem?.(item);
									if(followLinks) {
										setTimeout(()=>{
											setFocused(false);
										}, 500);
									}
								}}
							>
								{typeof item == "string"
								? item
								: <Entry entry={item} links={followLinks} />}
							</li>
						))}
					</ul>,
					document.body
				)
			}
		</div>
	);
}