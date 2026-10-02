"use client";

import { useState } from "react";
import "../peices/form.css";

const emailReg = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function SignUp() {
    const [error, setError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const data = Object.fromEntries(
            new FormData(event.currentTarget)
        );

        if (data.password.toString().length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (data.password !== data.confirmPassword) {
            setError("Passwords must match!");
            return;
        }

        if (!emailReg.test(data.email.toString())) {
            setError("Invalid email format!");
            return;
        }

        setError("");

        const response = await fetch("/api/auth/sign-up/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
                email: data.email,
                password: data.password,
                name: data.username,
            }),
        });

        const result = await response.json();

        if(response.status == 200) {
            location.pathname = "/"
        } else {
            setError(result.message);
            return;
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>Username:</label>
            <input name="username" type="text" />

            <label>Email:</label>
            <input name="email" type="email" />

            <label>Password:</label>
            <input name="password" type="password" />

            <label>Confirm Password:</label>
            <input name="confirmPassword" type="password" />

            <input type="submit" value="Sign Up" style={{ cursor: "pointer" }} />

            {error && <span style={{ color: "red" }}>{error}</span>}
        </form>
    );
}
