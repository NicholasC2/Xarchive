import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./badges.css";
import "./panel.css";
import ErrorProvider from "./error";
import Navbar from "./navbar";

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
	return (
		<html
			lang="en"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<Navbar />

				{children}

				<footer className="flex items-center gap-x-[8px] gap-y-[22px] mt-auto p-[18px] text-[10px]" style={{borderTop: "1px solid var(--line)"}}>
					<p>idk what to put here</p>
				</footer>

				<ErrorProvider />
			</body>
		</html>
	);
}