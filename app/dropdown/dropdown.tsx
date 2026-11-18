
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp } from "lucide-react";
import "./dropdown.css";

interface DropDownProps extends Omit<React.ComponentProps<"input">, "type"> {
    items?: string[];
    maxResults?: number;
    input?: boolean;
    value?: string;
}

export default function DropDown({
    items = [],
    input = true,
    value = "",
    maxResults,
    onChange,
    ...divProps
}: DropDownProps) {
    const [query, setQuery] = useState(value);
    const [showResults, setShowResults] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const divRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const results = items.slice(0, maxResults ?? Infinity);

    useEffect(() => {
        if (!showResults) return;

        function updatePosition() {
            const element = divRef.current;
            if (!element) return;

            setRect(element.getBoundingClientRect());
        }

        updatePosition();

        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        document.addEventListener("mousedown", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        	document.removeEventListener("mousedown", updatePosition);
        };
    }, [showResults]);

    useEffect(() => {
        if (!showResults) return;

        function handleClick(event: MouseEvent) {
            setShowResults(false);
        }

        document.addEventListener("mousedown", handleClick);

        return () => {
            document.removeEventListener("mousedown", handleClick);
        };
    }, [showResults]);

    function selectItem(item: string) {
        setQuery(item);
        setShowResults(false);

        onChange?.({
            target: { value: item },
        } as React.ChangeEvent<HTMLInputElement>);
    }

    return (
        <div className="dropdown">
            <div
                ref={divRef}
                className={
                    "drop-input cursor-pointer flex flex-row input " +
                    (divProps.className ?? "")
                }
                style={{
                    ...divProps.style,
                    alignItems: "center",
                    padding: "10px",
                }}
                onMouseDown={() => {if(!showResults) setShowResults(previous => !previous)}}
            >
                <div>{query}</div>
                <div className="flex-1" />

                {showResults
                    ? <ArrowUp size={20} />
                    : <ArrowDown size={20} />
                }
            </div>

            {showResults && results.length > 0 && rect &&
                createPortal(
                    <ul
                        ref={listRef}
                        className="drop-list"
                        style={{
                            position: "fixed",
                            top: rect.bottom,
                            left: rect.left,
                            width: rect.width,
                            zIndex: 99999,
                        }}
                    >
                        {results.map(item => (
                            <li
                                key={item}
                                title={item}
                                role="option"
                                aria-selected={query === item}
                                onMouseDown={event => {
                                    event.preventDefault();
                                    selectItem(item);
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
