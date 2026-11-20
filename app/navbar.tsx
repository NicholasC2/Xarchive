"use client";

import { ArrowLeftToLine, ArrowRightToLine, ArrowUpRight, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import SearchInput from "./dropdown/search-input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import ProfilePhoto from "./peices/profile-photo";

export default function Navbar() {
    const [panelOpen, setPanelOpen] = useState(false);
	const router = useRouter();
	const [query, setQuery] = useState("");

    const { data: session } = authClient.useSession();

	function submitSearch() {
		router.replace(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
	}

    return (
        <>
            <nav className={"navbar" + (panelOpen ? "" : " closed")}>
                <Link className="brand" href="/">Xarchive</Link>
                <Link href="/">Home</Link>
                <Link href="/download">Bulk download <ArrowUpRight size={14} /></Link>
                <Link href="/contribute">Contribute <ArrowUpRight size={14} /></Link>

                <SearchInput 
                    className="nav-search" 
                    onChange={(event) => setQuery(event.target.value)} 
                    onSubmit={()=>submitSearch()}
                    value={query} 
                    placeholder="Search archive"
                />

                <div className="flex-1" />

                {session?.user ? (
                    <div className="nav-account">
                        <div className="flex flex-row gap-2">
                            <ProfilePhoto image={session.user.image ?? ""} style={{width:25,height: 25}} />
                            <Link href={`/user/${encodeURIComponent(session.user.id)}`}>{session.user.name}</Link>
                        </div>
                        <Link href="/user/edit"><Settings size={15} /></Link>
                        <a className="cursor-pointer" onClick={()=>{
                            authClient.signOut().then(()=>{
                                router.replace("/");
                                router.refresh();
                            });
                        }}><LogOut size={15} /></a>
                    </div>
                ) : (
                    <div className="nav-account">
                        <Link href="/login">Log in</Link>
                        <Link className="nav-signup" href="/sign-up">Join</Link>
                    </div>
                )}

                <div className="navbar-toggle">
                    <a 
                        className="cursor-pointer"
                        onClick={(e)=>setPanelOpen(!panelOpen)}
                    >
                        {panelOpen
                        ? <ArrowLeftToLine size={18} /> 
                        : <ArrowRightToLine size={18} />}
                        
                    </a>
                </div>
            </nav>
        </>
    )
}