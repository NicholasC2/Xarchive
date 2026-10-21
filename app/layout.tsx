
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "./pieces/nav/navbar";
import Footer from "./pieces/footer";
import { auth } from "@/lib/auth/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Xarchive",
  description: "A community-built archive for music.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: LayoutProps<"/">) {
  const session = await auth.getSession({
    fetchOptions: {
      headers: await headers(),
    },
  });

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar user={session.data?.user ?? null} />
        {children}
        <Footer />
      </body>
    </html>
  );
}
