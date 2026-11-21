"use client";

import { authClient } from "@/lib/auth/client"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | {message: string, color: string}>("");
    const [busy, setBusy] = useState<false | string>(false);

    const { data: session, isPending } = authClient.useSession();

    const router = useRouter();

    useEffect(() =>{
        if(session?.user.emailVerified) {
            router.replace("/");
        }
    }, [isPending])

    async function verifyEmail() {
        if(!session) return;

        setBusy("Verifying Email...");

        if(email != session.user.email) {
            setError("Email is incorrect");
            setBusy(false);
            return;
        }

        setBusy("Sending Email...");

        const result = await authClient.sendVerificationEmail({
            email: email
        })

        if(result.error) {
            setError(result.error.message ?? "Unable to send email")
        }

        setError({
            message: "Sent Email",
            color: "success"
        })

        setBusy(false);
    }

    return <form className="panel" onSubmit={(e)=>{e.preventDefault();verifyEmail()}}>
        <h2>Verify Email</h2>
        <label>Confirm Email</label>
        {session
         ? <input type="text" placeholder="Email" autoComplete="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
         : <div className="loading min-h-[2.5rem]" />}
        <button type="submit" disabled={!session || busy != false}>{busy ? busy : "Send Verification Email"}</button>
        {error && <span style={{color: `var(--${typeof error == "string" ? "fail" : error.color})`}}>{typeof error == "string" ? error : error.message}</span>}
    </form>
}