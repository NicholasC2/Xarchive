"use client";

import { useState } from "react";
import "../peices/form.css";

export default function Login() {
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const data = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        const response = await fetch("/api/auth/sign-in/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                email: data.email,
                password: data.password,
            }),
        });

        const result = await response.json();

        if(response.status == 200) {
            location.pathname = "/"
        } else {
            setError(result.message);
            return;
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Email:</label>
            <input name="email" type="email" />

            <label>Password:</label>
            <input name="password" type="password" />

            <input type="submit" value="Login" style={{ cursor: "pointer" }} />

            {error && <span style={{ color: "red" }}>{error}</span>}
        </form>
    );
}
