"use client";

import { authClient } from "@/lib/auth/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();
    return (
        <button className="logout-button" onClick={()=>{
            authClient.signOut().then(()=>{
                router.replace("/");
                router.refresh();
            });
        }} aria-label="Log out" title="Log out"><LogOut size={15} /></button>
    )
}