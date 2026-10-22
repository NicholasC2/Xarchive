"use client";

import { ArrowUpRight, LogOut, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchInput from "@/app/pieces/search-input";
import "./navbar.css";
import { authClient } from "@/lib/auth/client";

type NavbarUser = { id: string; name?: string | null; email?: string | null };

export default function Navbar({ user }: { user: NavbarUser | null }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submitSearch() {
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
    setSearchOpen(false);
  }

  return (
    <nav className="navbar">
      <Link className="brand" href="/">Xarchive</Link>
      <div className="nav-links">
        <Link href="/">Home</Link>
        <Link href="/download">Bulk download <ArrowUpRight size={14} /></Link>
        <Link href="/contribute">Contribute <ArrowUpRight size={14} /></Link>
      </div>
      <div className="flex-1 spacer" />
      {searchOpen && <form onSubmit={()=>submitSearch()}>
        <input autoFocus className="nav-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search archive" aria-label="Search archive" />
      </form>}
      <button className="nav-search-toggle" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search archive"><Search size={18} /></button>
      {user ? (
        <div className="nav-account">
          <Link className="nav-profile" href={`/profile/${encodeURIComponent(user.id)}`}>{user.name || user.email || "Profile"}</Link>  
          <button className="logout-button" onClick={()=>{
              authClient.signOut().then(()=>{
                  router.replace("/");
                  router.refresh();
              });
          }} aria-label="Log out" title="Log out"><LogOut size={15} /></button>
        </div>
      ) : (
        <div className="nav-account">
          <Link href="/login">Log in</Link>
          <Link className="nav-signup" href="/sign-up">Join</Link>
        </div>
      )}
    </nav>
  );
}
