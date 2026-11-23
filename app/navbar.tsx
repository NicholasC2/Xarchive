"use client";

import { ArrowLeftToLine, ArrowRightToLine, ArrowUpRight, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import SearchInput from "./dropdown/search-input";
import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import ProfilePhoto from "./peices/profile-photo";

export default function Navbar() {
    const params = useSearchParams();
    const redirect_uri = params.get("redirect_uri");

    const [panelOpen, setPanelOpen] = useState(false);
	const [query, setQuery] = useState("");

	const router = useRouter();
    const pathname = usePathname();

    const { data: session } = authClient.useSession();

    const searchArtists = useCallback(async (query: string): Promise<string[]> => {
        const response = await fetch(
            `/api/search/artists${query ? `?query=${encodeURIComponent(query)}` : ""}`
        );

        if (!response.ok) return [];

        return response.json();
    }, []);

    return (
        <>
            {session && !session.user.emailVerified && <div 
                className="w-full flex flex-row" 
                style={{
                    background: "var(--warn)", 
                    color: "var(--warn-bg)", 
                    paddingLeft: "2.5%", 
                    gap: "0.5rem"
            }}>
                Your email is not verified
                <Link href="/verify-email">
                    <b className="flex flex-row" style={{alignItems: "center"}}  >
                        Resend Email <ArrowUpRight size={16} />
                    </b>
                </Link>
            </div>}

            <nav className={"navbar" + (panelOpen ? "" : " closed")}>
                <Link className="brand" href="/">Xarchive</Link>
                <Link href="/">Home</Link>
                <Link href="/download">Bulk download <ArrowUpRight size={14} /></Link>
                <Link href="/contribute">Contribute <ArrowUpRight size={14} /></Link>

                <form onSubmit={e => {
                    e.preventDefault();
                    router.push(`/search?query=${encodeURIComponent(query)}`);
                }}>
                    <SearchInput 
                        searchable={searchArtists}
                        followLinks={true}
                        className="nav-search" 
                        onChange={(event) => setQuery(event.target.value)} 
                        onClickItem={(item) => setTimeout(()=>setQuery(""), 500)}
                        value={query} 
                        placeholder="Search archive"
                    />
                </form>

                <div className="flex-1" />

                {session?.user ? (
                    <div className="nav-account">
                        <div className="flex flex-row gap-2">
                            <ProfilePhoto image={session.user.image ?? ""} style={{width:25,height: 25}} />
                            <Link href={`/user/${encodeURIComponent(session.user.id)}`}>{session.user.name}</Link>
                        </div>
                        <Link href="/user/edit"><Settings size={15} /></Link>
                        <a className="cursor-pointer" onClick={async()=>{
                            await authClient.signOut();
                            router.refresh();
                        }}><LogOut size={15} /></a>
                    </div>
                ) : (
                    <div className="nav-account">
                        <Link href={"/login?redirect_uri="+(redirect_uri ?? pathname)}>Log in</Link>
                        <Link className="nav-signup" href={"/sign-up?redirect_uri="+(redirect_uri ?? pathname)}>Join</Link>
                    </div>
                )}

                <a 
                    className="cursor-pointer navbar-toggle"
                    onClick={(e)=>setPanelOpen(!panelOpen)}
                >
                    {panelOpen
                    ? <ArrowLeftToLine size={18} /> 
                    : <ArrowRightToLine size={18} />}
                </a>
            </nav>
        </>
    )
}