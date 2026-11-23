"use client";

import { authClient } from "@/lib/auth/client";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboard() {
    const { data: session, isPending } = authClient.useSession();

    const router = useRouter();

    useEffect(() => {
        if(!isPending && session?.user.role != "admin") {
            router.push("/");
        }
    }, [isPending])

    return (session?.user.role == "admin"
    ? <div className="archive-page">
        <div className="flex flex-col">
            <h2>Admin Dashboard</h2>
            <div className="flex flex-row flex-1">
                <div className="flex flex-col gap-2">
                    <label>reports</label>
                </div>
                <div style={{
                    border: "1px solid var(--line)"
                }} />
                <div className="flex flex-col gap-2">
                    <label>users</label>
                </div>
            </div>
        </div>
    </div>
    : <div className="archive-page items-center"><LoaderCircle className="loading-spinner" /></div>)
}