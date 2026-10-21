"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import "../pieces/auth.css";

export default function SignUp() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "");
        const password = String(data.get("password") ?? "");
        const confirmPassword = String(data.get("confirmPassword") ?? "");
        const username = String(data.get("username") ?? "");

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords must match!");
            return;
        }

        setBusy(true);
        try {
            const { error } = await authClient.signUp.email({
                email,
                password,
                name: username,
            });
            if (error) throw new Error(error.message || "Could not create your account.");
            router.replace("/");
            router.refresh();
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not create your account.");
            setBusy(false);
        }
    }

    return (
        <main className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2>Create account</h2>
                <label htmlFor="signup-name">Display name</label>
                <input id="signup-name" name="username" type="text" autoComplete="name" maxLength={50} required />
                <label htmlFor="signup-email">Email</label>
                <input id="signup-email" name="email" type="email" autoComplete="email" required />
                <label htmlFor="signup-password">Password</label>
                <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
                <label htmlFor="signup-confirm">Confirm password</label>
                <input id="signup-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
                <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
            </form>
        </main>
    );
}
