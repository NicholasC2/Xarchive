"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import "./navbar.css";
import LogoutButton from "@/app/account/LogoutButton";

export default function Navbar({ user }: { user: any }) {
  const [searchbarShown, setShowSearchbar] = useState(false);

  return (
    <nav className="navbar">
      <a href="/">Home</a>

      <div className="spacer flex-1" />

      {searchbarShown && <input type="text" />}

      <Search
        onClick={() => setShowSearchbar(!searchbarShown)}
        style={{ cursor: "pointer" }}
      />

      {user ? (
        <>
          <a href="/account" >{user.name || user.email}</a>
            <LogoutButton />
        </>
      ) : (
        <>
          <a href="/sign-up">Sign Up</a>
          <a href="/login">Log in</a>
        </>
      )}
    </nav>
  );
}
