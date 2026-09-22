"use client";

import { Search } from "lucide-react";
import { useState } from "react"
import "./navbar.css"

export default function Navbar() {
    var [searchbarShown, setShowSearchbar] = useState(false);

    return (
        <nav className="navbar">
            <a href="/">Home</a>

            <div className="spacer flex-1" />

            {searchbarShown && 
                <input type="text" />
            }
            <Search onClick={()=>{
                setShowSearchbar(!searchbarShown)
            }} style={{cursor: "pointer"}} />

            <a href="/sign-up">Sign Up</a>
            <a href="/login">Log in</a>
        </nav>
    )
}