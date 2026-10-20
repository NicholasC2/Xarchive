"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../peices/auth.css";

export default function Login() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError("");

        const data = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        try {
            const response = await fetch("/api/auth/sign-in/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: data.email, password: data.password }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Could not sign in. Check your details and try again.");
            router.replace("/");
            router.refresh();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not sign in. Try again.");
            setBusy(false);
        }
    }

    return (
        <main className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Log in</h2>
                <label htmlFor="login-email">Email</label>
                <input id="login-email" name="email" type="email" autoComplete="email" required />
                <label htmlFor="login-password">Password</label>
                <input id="login-password" name="password" type="password" autoComplete="current-password" required />
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
                <p className="auth-switch">New here? <Link href="/sign-up">Create an account</Link></p>
            </form>
        </main>
    );
}
