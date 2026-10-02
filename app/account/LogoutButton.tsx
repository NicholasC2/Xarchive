"use client";

import { authClient } from "@/lib/auth/client";

export default function LogoutButton() {
    return (
        <button style={{cursor: "pointer"}} onClick={()=>{
            authClient.signOut().then(()=>{
                location.pathname = "/"
            });
        }}>Logout</button>
    )
}