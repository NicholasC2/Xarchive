"use client";

import { authClient } from "@/lib/auth/client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string>("");
    const [busy, setBusy] = useState<false | string>(false);
    const [cooldown, setCooldown] = useState(0);

    const { data: session, isPending } = authClient.useSession();

    const router = useRouter();

    useEffect(() =>{
        if(session?.user.emailVerified) {
            router.push("/");
        }
    }, [isPending, session?.user.emailVerified])

    async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if(!session) return;

        if(email != session.user.email) {
            setError("Email is incorrect");
            return;
        }

        setBusy("Sending Email...");

        const result = await authClient.sendVerificationEmail({
            email: email
        })

        if(result.error) {
            setError(result.error.message ?? "Unable to send email")
            setBusy(false);
            return;
        }

        setCooldown(30);
        setBusy(false);
    }

    setInterval(() => {
        if(cooldown > 0) setCooldown(cooldown - 1);
    }, 1000);

    return <form className="panel" onSubmit={verifyEmail}>
        <h2>Resend Email Verification</h2>
        <label>Confirm Email</label>
        {session
         ? <input type="text" placeholder="Email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
         : <div className="loading min-h-[2.5rem]" />}
        
        <button 
            type="submit" 
            disabled={!session || cooldown > 0 || busy != false}
        >
            {cooldown ? `Email sent, wait ${cooldown} seconds to resend` : (busy ? busy : "Resend Email")}
        </button>

        {error && <span 
                style={{
                    color: `var(--fail)`
                }}
            >
                {error}
            </span>
        }
    </form>
}