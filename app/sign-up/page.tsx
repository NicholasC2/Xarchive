"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { SiGoogle } from "@icons-pack/react-simple-icons";

export default function SignUp() {
    const router = useRouter();
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [config, setConfig] = useState({
        googleEnabled: false
    });

    useEffect(()=>{
        (async ()=>{
            setConfig(await (await fetch("/api/config/")).json());
        })()
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        const data = new FormData(event.currentTarget);
        const email = String(data.get("email") ?? "");
        const password = String(data.get("password") ?? "");
        const confirmPassword = String(data.get("confirmPassword") ?? "");
        const username = String(data.get("username") ?? "");

        if (username.length < 2) {
            setError("Display name must be atleast 2 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords must match!");
            return;
        }

        setBusy(true);
        
        const { error } = await authClient.signUp.email({
            email,
            password,
            name: username,
        });

        if (error) {
            setError(error.message ?? "Could not create your account.");
            setBusy(false);
            return;
        }

        router.replace("/");
    }

    async function handleOauth(e: Event, provider: string) {
        e.preventDefault();

        await authClient.signIn.social({
            provider,
            callbackURL: "/",
        });
    }

    return (
        <form className="panel" onSubmit={handleSubmit}>
            <h2>Create account</h2>
            <label htmlFor="signup-name">Display name</label>
            <input id="signup-name" name="username" type="text" autoComplete="name" maxLength={50} required />
            <label htmlFor="signup-email">Email</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="signup-password">Password</label>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
            <label htmlFor="signup-confirm">Confirm password</label>
            <input id="signup-confirm" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required />
            {error && <p className="panel-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
            <div className="oauth">
                <button 
                    onClick={e => handleOauth(e as any, "google")}
                    disabled={!config.googleEnabled}
                >
                    <SiGoogle />
                </button>
            </div>
            <p className="panel-switch">Already have an account? <Link href="/login">Log in</Link></p>
        </form>
    );
}
