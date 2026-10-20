"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../peices/auth.css";

const emailReg = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function SignUp() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const data = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        if (data.password.toString().length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (data.password !== data.confirmPassword) {
            setError("Passwords must match!");
            return;
        }

        if (!emailReg.test(data.email.toString())) {
            setError("Invalid email format!");
            return;
        }

        setBusy(true);
        try {
            const response = await fetch("/api/auth/sign-up/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email: data.email, password: data.password, name: data.username }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Could not create your account.");
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
