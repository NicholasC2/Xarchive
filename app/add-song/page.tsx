"use client";

import { useState } from "react";
import "../peices/form.css";
import SearchInput from "../peices/search";

export default function AddSong() {
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("Not implemented")
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Song Name:</label>
            <input name="name" type="text" />

            <label>Song Main Artists:</label>
            <SearchInput name="mainArtists" searchable={["hoshie star"]} splitAt=", " /> {/* make sure to change searchable to artists */}

            <input type="submit" value="Add Song" style={{ cursor: "pointer" }} />

            {error && <span style={{ color: "red" }}>{error}</span>}
        </form>
    );
}
