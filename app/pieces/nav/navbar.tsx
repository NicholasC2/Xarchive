"use client";

import { ArrowUpRight, Search } from "lucide-react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./navbar.css";
import LogoutButton from "@/app/account/LogoutButton";
import SearchInput from "@/app/pieces/search-input";

type NavbarUser = { id: string; name?: string | null; email?: string | null };

export default function Navbar({ user }: { user: NavbarUser | null }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      <div className="nav-spacer" />
      {searchOpen ? (
        <form className="nav-search" onSubmit={submitSearch}>
          <SearchInput autoFocus searchable={[]} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search archive" aria-label="Search archive" />
          <button type="submit" aria-label="Submit search"><Search size={17} /></button>
        </form>
      ) : (
        <button className="icon-button nav-search-toggle" onClick={() => setSearchOpen(true)} aria-label="Search archive"><Search size={18} /></button>
      )}
      {user ? (
        <div className="nav-account">
          <Link className="nav-profile" href={`/profile/${encodeURIComponent(user.id)}`}>{user.name || user.email || "Profile"}</Link>
          <LogoutButton />
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
