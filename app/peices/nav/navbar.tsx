"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import "./navbar.css";
import LogoutButton from "@/app/account/LogoutButton";
import SearchInput from "../search";

export default function Navbar({ user }: { user: any }) {
  const [searchbarShown, setShowSearchbar] = useState(false);

  return (
    <nav className="navbar">
      <a href="/">Home</a>

      <div className="spacer flex-1" />


      {searchbarShown && (
        <SearchInput
          clickFill={false}
          onClickItem={(text) => {
            alert(text);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              alert(e.currentTarget.value);
            }
          }}
          searchable={["hoshie star"]}
        />
      )} {/* make sure to change searchable to artists */}

      <Search
        onClick={() => setShowSearchbar(!searchbarShown)}
        style={{ cursor: "pointer" }}
      />
      
      <a href="/add-song">Add Song</a>

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
