"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { SiGoogle } from "@icons-pack/react-simple-icons";

export default function Login() {
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

    async function login(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError("");

        const data = new FormData(event.currentTarget);

        try {
            const { error } = await authClient.signIn.email({
                email: String(data.get("email") ?? ""),
                password: String(data.get("password") ?? ""),
            });
            if (error) throw new Error(error.message || "Could not sign in. Check your details and try again.");
            router.push("/");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not sign in. Try again.");
            setBusy(false);
        }
    }

    async function handleOauth(e: MouseEvent, provider: string) {
        e.preventDefault();

        await authClient.signIn.social({
            provider,
            callbackURL: "/",
        });
    }

    return (
        <form className="panel" onSubmit={login}>
            <h2>Log in</h2>
            <label htmlFor="login-email">Email</label>
            <input id="login-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="login-password">Password</label>
            <input id="login-password" name="password" type="password" autoComplete="current-password" required />
            {error && <p className="panel-error" role="alert">{error}</p>}
            <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Log in"}</button>
            <div className="oauth">
                <button 
                    onClick={e => handleOauth(e as any, "google")}
                    disabled={!config.googleEnabled}
                >
                    <SiGoogle />
                </button>
            </div>
            <p className="panel-switch">New here? <Link href="/sign-up">Create an account</Link></p>
        </form>
    );
}
